import { getDatabase } from '../database';
import type { MedidorCache, MedidorOficina } from '../../domain/tipos';
import { parsearMedidorOficina } from '../../domain/validaciones';

interface MedidorCacheRow {
  codigo: string;
  datos_json: string;
  consultado_en: string;
}

export async function guardarMedidorCache(
  codigo: string,
  datos: MedidorOficina,
  consultadoEn: Date = new Date(),
): Promise<MedidorCache> {
  const medidor = parsearMedidorOficina(datos);
  if (medidor === null || medidor.codigo !== codigo) {
    throw new TypeError('Los datos del medidor no cumplen el contrato aprobado.');
  }

  const consultadoEnIso = convertirFecha(consultadoEn);
  const datosJson = JSON.stringify(medidor);
  if (datosJson === undefined) {
    throw new TypeError('Los datos del medidor no se pueden serializar.');
  }

  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO medidores_cache (codigo, datos_json, consultado_en)
     VALUES (?, ?, ?)
     ON CONFLICT(codigo) DO UPDATE SET
       datos_json = excluded.datos_json,
       consultado_en = excluded.consultado_en`,
    [codigo, datosJson, consultadoEnIso],
  );

  return { codigo, datos: medidor, consultadoEn: consultadoEnIso };
}

export async function obtenerMedidorCache(
  codigo: string,
): Promise<MedidorCache | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<MedidorCacheRow>(
    `SELECT codigo, datos_json, consultado_en
     FROM medidores_cache
     WHERE codigo = ?`,
    [codigo],
  );

  return row === null ? null : mapearMedidorCache(row);
}

export async function obtenerMedidoresCache(): Promise<MedidorCache[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<MedidorCacheRow>(
    `SELECT codigo, datos_json, consultado_en
     FROM medidores_cache
     ORDER BY codigo`,
  );

  return rows.map(mapearMedidorCache);
}

function mapearMedidorCache(row: MedidorCacheRow): MedidorCache {
  const datos: unknown = JSON.parse(row.datos_json);
  const medidor = parsearMedidorOficina(datos);
  if (medidor === null || medidor.codigo !== row.codigo) {
    throw new Error(
      `Los datos locales del medidor ${row.codigo} no cumplen el contrato aprobado.`,
    );
  }

  return {
    codigo: row.codigo,
    datos: medidor,
    consultadoEn: row.consultado_en,
  };
}

function convertirFecha(fecha: Date): string {
  if (Number.isNaN(fecha.getTime())) {
    throw new RangeError('La fecha de consulta del medidor no es válida.');
  }

  return fecha.toISOString();
}