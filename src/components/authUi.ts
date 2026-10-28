import {
  CredencialesInvalidasError,
  SinUsuariosConfiguradosError,
} from '../services/authService';

/** Texto breve para mostrar junto al formulario de inicio de sesión. */
export function mensajeErrorSesion(error: unknown): string {
  if (error instanceof CredencialesInvalidasError) {
    return 'El código de empleado o la clave no coinciden. Verifícalos e inténtalo de nuevo.';
  }

  if (error instanceof SinUsuariosConfiguradosError) {
    return 'La aplicación no tiene técnicos autorizados configurados. No se puede iniciar sesión.';
  }

  return 'No se pudo iniciar sesión. Inténtalo de nuevo.';
}
