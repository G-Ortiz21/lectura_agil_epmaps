import * as SecureStore from 'expo-secure-store';
import { USUARIOS_PRUEBA } from '../data/usuarios';

/**
 * Identificación local del técnico contra los usuarios fijos del código
 * (ADR-012). No es una autenticación contra un servidor: la aplicación no
 * dispone de servicio de autenticación remota y este servicio no debe
 * presentarse como tal.
 *
 * La sesión persistida guarda únicamente el código del empleado en
 * expo-secure-store. La clave nunca se escribe en el dispositivo.
 */

/** Única clave de sesión en el almacén seguro. */
const CLAVE_SESION = 'sesion_tecnico_codigo';

export class CredencialesInvalidasError extends Error {
  constructor() {
    super('El código de empleado o la clave no coinciden.');
    this.name = 'CredencialesInvalidasError';
  }
}

export class SinUsuariosConfiguradosError extends Error {
  constructor() {
    super('La aplicación no tiene técnicos autorizados configurados.');
    this.name = 'SinUsuariosConfiguradosError';
  }
}

/**
 * Compara el código y la clave con los usuarios fijos del código.
 * Devuelve el código del técnico identificado o lanza un error.
 */
export async function identificarTecnico(
  codigo: string,
  clave: string,
): Promise<string> {
  if (USUARIOS_PRUEBA.length === 0) {
    throw new SinUsuariosConfiguradosError();
  }

  const codigoNormalizado = codigo.trim();
  const claveNormalizada = clave.trim();
  const coincide = USUARIOS_PRUEBA.some(
    (usuario) =>
      usuario.codigo === codigoNormalizado && usuario.clave === claveNormalizada,
  );

  if (!coincide) {
    throw new CredencialesInvalidasError();
  }

  return codigoNormalizado;
}

/** Guarda el código del empleado como sesión activa (nunca la clave). */
export async function guardarSesion(codigo: string): Promise<void> {
  const codigoNormalizado = codigo.trim();
  if (codigoNormalizado.length === 0) {
    throw new TypeError('La sesión necesita el código del empleado.');
  }

  await SecureStore.setItemAsync(CLAVE_SESION, codigoNormalizado);
}

/**
 * Lee la sesión persistida. Devuelve el código del técnico o null si no
 * hay sesión o el valor guardado no es utilizable.
 */
export async function leerSesion(): Promise<string | null> {
  const valor = await SecureStore.getItemAsync(CLAVE_SESION);
  if (valor === null) {
    return null;
  }

  const codigo = valor.trim();
  if (codigo.length === 0) {
    await borrarSesion();
    return null;
  }

  return codigo;
}

/** Borra la sesión persistida. Se usa al cerrar sesión. */
export async function borrarSesion(): Promise<void> {
  await SecureStore.deleteItemAsync(CLAVE_SESION);
}
