import {
  guardarMedidorCache,
  obtenerMedidorCache,
} from '../data/repositories/medidoresRepository';
import { ApiError } from '../api/client';
import { buscarMedidorRemoto } from '../api/medidoresApi';
import { validarCodigoMedidor } from '../domain/validaciones';
import type { MedidorOficina } from '../domain/tipos';

export type ResultadoConsultaMedidor =
  | {
      estado: 'encontrado';
      medidor: MedidorOficina;
      origen: 'oficina' | 'cache_local';
      consultadoEn: string;
    }
  | { estado: 'sin_cache_sin_conexion'; codigo: string };

export async function consultarMedidor(
  codigo: string,
  hayConexion: boolean,
  fechaActual: Date = new Date(),
): Promise<ResultadoConsultaMedidor> {
  const errorCodigo = validarCodigoMedidor(codigo);
  if (errorCodigo !== null) {
    throw new TypeError(errorCodigo);
  }
  if (Number.isNaN(fechaActual.getTime())) {
    throw new RangeError('La fecha de consulta del medidor no es válida.');
  }

  const cache = await obtenerMedidorCache(codigo);
  if (cache !== null && fueConsultadoHoy(cache.consultadoEn, fechaActual)) {
    return {
      estado: 'encontrado',
      medidor: cache.datos,
      origen: 'cache_local',
      consultadoEn: cache.consultadoEn,
    };
  }

  if (!hayConexion) {
    return cache === null
      ? { estado: 'sin_cache_sin_conexion', codigo }
      : {
          estado: 'encontrado',
          medidor: cache.datos,
          origen: 'cache_local',
          consultadoEn: cache.consultadoEn,
        };
  }

  try {
    const resultadoRemoto = await buscarMedidorRemoto(codigo);
    if (resultadoRemoto.estado === 'no_encontrado') {
      throw new ApiError('not_found', 'El medidor no existe en la oficina.', 404);
    }

    const consultadoEn = fechaActual.toISOString();
    await guardarMedidorCache(codigo, resultadoRemoto.medidor, fechaActual);
    return {
      estado: 'encontrado',
      medidor: resultadoRemoto.medidor,
      origen: 'oficina',
      consultadoEn,
    };
  } catch (error: unknown) {
    if (error instanceof ApiError && error.kind === 'network' && cache !== null) {
      return {
        estado: 'encontrado',
        medidor: cache.datos,
        origen: 'cache_local',
        consultadoEn: cache.consultadoEn,
      };
    }
    throw error;
  }
}

function fueConsultadoHoy(consultadoEn: string, fechaActual: Date): boolean {
  const fechaConsulta = new Date(consultadoEn);
  return (
    !Number.isNaN(fechaConsulta.getTime()) &&
    fechaConsulta.getFullYear() === fechaActual.getFullYear() &&
    fechaConsulta.getMonth() === fechaActual.getMonth() &&
    fechaConsulta.getDate() === fechaActual.getDate()
  );
}