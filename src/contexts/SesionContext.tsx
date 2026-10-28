import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  borrarSesion,
  guardarSesion,
  identificarTecnico,
  leerSesion,
} from '../services/authService';

/** Estado de la sesión al arrancar o tras una operación. */
export type EstadoSesion = 'cargando' | 'no_autenticado' | 'autenticado';

interface ContextoSesion {
  estado: EstadoSesion;
  /** Código del técnico identificado, o null sin sesión. */
  tecnicoCodigo: string | null;
  /** Valida las credenciales y activa la sesión (ADR-012). */
  iniciarSesion: (codigo: string, clave: string) => Promise<void>;
  /** Borra la sesión del dispositivo y vuelve al login. */
  cerrarSesion: () => Promise<void>;
}

const SesionContext = createContext<ContextoSesion | null>(null);

export function SesionProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoSesion>('cargando');
  const [tecnicoCodigo, setTecnicoCodigo] = useState<string | null>(null);

  useEffect(() => {
    let vigente = true;

    void leerSesion()
      .then((codigo) => {
        if (!vigente) {
          return;
        }
        setTecnicoCodigo(codigo);
        setEstado(codigo === null ? 'no_autenticado' : 'autenticado');
      })
      .catch(() => {
        if (!vigente) {
          return;
        }
        // Sin sesión legible se trata como no autenticado; no se adivina.
        setTecnicoCodigo(null);
        setEstado('no_autenticado');
      });

    return () => {
      vigente = false;
    };
  }, []);

  const valor = useMemo<ContextoSesion>(
    () => ({
      estado,
      tecnicoCodigo,
      async iniciarSesion(codigo: string, clave: string) {
        const codigoIdentificado = await identificarTecnico(codigo, clave);
        await guardarSesion(codigoIdentificado);
        setTecnicoCodigo(codigoIdentificado);
        setEstado('autenticado');
      },
      async cerrarSesion() {
        await borrarSesion();
        setTecnicoCodigo(null);
        setEstado('no_autenticado');
      },
    }),
    [estado, tecnicoCodigo],
  );

  return (
    <SesionContext.Provider value={valor}>{children}</SesionContext.Provider>
  );
}

export function useSesion(): ContextoSesion {
  const context = useContext(SesionContext);
  if (context === null) {
    throw new Error('useSesion debe utilizarse dentro de SesionProvider.');
  }
  return context;
}
