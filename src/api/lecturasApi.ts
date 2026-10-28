
import { API_BASE_URL, API_RESOURCES } from '../config';
import type { LecturaLocal } from '../domain/tipos';

export interface LecturaRemota {
  id: string;
  claveUnica: string;
  medidorCodigo: string;
  periodo: string;
}

function obtenerUrl(): string {
  return `${API_BASE_URL.replace(/\/+$/, '')}/${API_RESOURCES.lecturas}`;
}

async function solicitar<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    let response: Response;

    try {
      response = await fetch(url, {
        ...init,
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          ...(init?.body
            ? { 'Content-Type': 'application/json' }
            : {}),
          ...init?.headers,
        },
      });
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('La solicitud a MockAPI excedió 10 segundos.');
      }

      throw new Error('No se pudo conectar con MockAPI.');
    }

    if (!response.ok) {
      throw new Error(`MockAPI respondió con HTTP ${response.status}.`);
    }

    try {
      return (await response.json()) as T;
    } catch {
      throw new Error('MockAPI devolvió una respuesta JSON inválida.');
    }
  } finally {
    clearTimeout(timeout);
  }
}

export async function buscarLecturaRemotaPorClave(
  claveUnica: string,
): Promise<LecturaRemota | null> {
  const url = new URL(obtenerUrl());
  url.searchParams.set('claveUnica', claveUnica);

  const resultado = await solicitar<LecturaRemota[]>(url.toString());

  if (!Array.isArray(resultado)) {
    throw new Error('MockAPI no devolvió una lista válida de lecturas.');
  }

  const coincidencias = resultado.filter(
    (item) => item.claveUnica === claveUnica,
  );

  if (coincidencias.length > 1) {
    throw new Error(
      `Hay varias lecturas remotas con la clave ${claveUnica}.`,
    );
  }

  return coincidencias[0] ?? null;
}

export async function crearLecturaRemota(
  lectura: LecturaLocal,
): Promise<LecturaRemota> {
  const payload = {
    claveUnica: lectura.claveUnica,
    medidorCodigo: lectura.medidorCodigo,
    periodo: lectura.periodo,
    estadoMedidor: lectura.estadoMedidor,
    lectura: lectura.lectura,
    lecturaAnterior: lectura.lecturaAnterior,
    consumo: lectura.consumo,
    promedioMensual: lectura.promedioMensual,
    consumoAnomalo: lectura.consumoAnomalo,
    confirmacionAnomalia: lectura.confirmacionAnomalia,
    motivo: lectura.motivo,
    descripcion: lectura.descripcion,
    fotoNombre: lectura.fotoNombre,
    verificacion: lectura.verificacion,
    tecnicoCodigo: lectura.tecnicoCodigo,
    creadoEn: lectura.creadoEn,
  };

  const creada = await solicitar<LecturaRemota>(obtenerUrl(), {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (
    !creada ||
    creada.id == null ||
    String(creada.id).length === 0 ||
    creada.claveUnica !== lectura.claveUnica
  ) {
    throw new Error('MockAPI no confirmó correctamente la lectura creada.');
  }

  return { ...creada, id: String(creada.id) };
}
