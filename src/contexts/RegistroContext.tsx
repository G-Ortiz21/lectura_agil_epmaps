import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';
import {
  eliminarBorrador,
  guardarBorrador,
  obtenerBorrador,
} from '../data/repositories/borradorRepository';
import type {
  DatosRegistroLectura,
  EstadoMedidor,
  PasoRegistro,
} from '../domain/tipos';
import { eliminarFoto } from '../services/fotoService';

/**
 * Estado del registro en curso compartido entre los pasos del asistente
 * (ADR-004). El estado vive en memoria y se replica en la tabla local
 * `borrador` mediante el repositorio existente: este contexto no define
 * consultas SQL propias ni sustituye la persistencia prevista en la
 * arquitectura, la reutiliza.
 */
export interface EstadoRegistro {
  codigoMedidor: string | null;
  estadoMedidor: EstadoMedidor | null;
  paso: PasoRegistro;
  datos: DatosRegistroLectura;
}

interface ContextoRegistro {
  registro: EstadoRegistro;
  /** True mientras se lee el borrador guardado al montar. */
  cargandoBorrador: boolean;
  definirCodigoMedidor: (codigo: string | null) => void;
  definirEstadoMedidor: (estado: EstadoMedidor | null) => void;
  definirPaso: (paso: PasoRegistro) => void;
  /** Fusiona cambios parciales en los datos del paso actual. */
  actualizarDatos: (cambios: Partial<DatosRegistroLectura>) => void;
  /** Reinicia el estado en memoria sin tocar archivos (tras guardar). */
  reiniciarRegistro: () => void;
  /** Borra borrador y fotografía del registro y reinicia el estado. */
  descartarRegistro: () => Promise<void>;
}

const RegistroContext = createContext<ContextoRegistro | null>(null);

const ESTADO_INICIAL: EstadoRegistro = {
  codigoMedidor: null,
  estadoMedidor: null,
  paso: 'estado_medidor',
  datos: {},
};

/** Espera del ADR-004 antes de escribir cada cambio del borrador. */
const RETARDO_GUARDADO_MS = 300;

export function RegistroProvider({ children }: { children: ReactNode }) {
  const [registro, setRegistro] = useState<EstadoRegistro>(ESTADO_INICIAL);
  const [cargandoBorrador, setCargandoBorrador] = useState(true);

  const cargadoRef = useRef(false);
  const registroRef = useRef(registro);
  const pasoPrevioRef = useRef<PasoRegistro | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // registroRef refleja el estado más reciente para efectos y oyentes.
  useEffect(() => {
    registroRef.current = registro;
  }, [registro]);

  // Al montar se lee el borrador antes de que el asistente muestre pasos.
  useEffect(() => {
    let vigente = true;

    void obtenerBorrador()
      .then((borrador) => {
        if (!vigente) {
          return;
        }
        if (borrador !== null) {
          setRegistro({
            codigoMedidor: borrador.codigoMedidor,
            estadoMedidor: borrador.estadoMedidor,
            paso: borrador.paso,
            datos: borrador.datos,
          });
          pasoPrevioRef.current = borrador.paso;
        }
        cargadoRef.current = true;
        setCargandoBorrador(false);
      })
      .catch((error: unknown) => {
        if (!vigente) {
          return;
        }
        // Con un borrador ilegible se continúa solo en memoria; no se
        // sobrescribe lo guardado sin que el técnico lo decida.
        console.error('No se pudo leer el borrador del registro.', error);
        cargadoRef.current = true;
        setCargandoBorrador(false);
      });

    return () => {
      vigente = false;
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  async function escribirBorrador(estado: EstadoRegistro): Promise<void> {
    try {
      await guardarBorrador({
        codigoMedidor: estado.codigoMedidor,
        estadoMedidor: estado.estadoMedidor,
        paso: estado.paso,
        datos: estado.datos,
      });
    } catch (error: unknown) {
      console.error('No se pudo guardar el borrador del registro.', error);
    }
  }

  function cancelarRetardo(): void {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  // Cada cambio se escribe tras unos 300 ms; el cambio de paso se escribe
  // de inmediato (ADR-004).
  useEffect(() => {
    if (!cargadoRef.current) {
      return;
    }

    const cambioDePaso =
      pasoPrevioRef.current !== null && pasoPrevioRef.current !== registro.paso;
    pasoPrevioRef.current = registro.paso;
    cancelarRetardo();

    if (cambioDePaso) {
      void escribirBorrador(registro);
      return;
    }

    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      void escribirBorrador(registroRef.current);
    }, RETARDO_GUARDADO_MS);
  }, [registro]);

  // Al pasar a segundo plano se escribe de inmediato lo pendiente.
  useEffect(() => {
    const suscripcion = AppState.addEventListener('change', (estadoApp) => {
      if (estadoApp !== 'background' || !cargadoRef.current) {
        return;
      }
      cancelarRetardo();
      void escribirBorrador(registroRef.current);
    });

    return () => {
      suscripcion.remove();
    };
  }, []);

  // Las acciones son estables para que los efectos de las pantallas no
  // se repitan con cada cambio del registro.
  const definirCodigoMedidor = useCallback((codigo: string | null) => {
    setRegistro((anterior) => ({ ...anterior, codigoMedidor: codigo }));
  }, []);

  const definirEstadoMedidor = useCallback((estado: EstadoMedidor | null) => {
    setRegistro((anterior) => ({ ...anterior, estadoMedidor: estado }));
  }, []);

  const definirPaso = useCallback((paso: PasoRegistro) => {
    setRegistro((anterior) => ({ ...anterior, paso }));
  }, []);

  const actualizarDatos = useCallback((cambios: Partial<DatosRegistroLectura>) => {
    setRegistro((anterior) => ({
      ...anterior,
      datos: { ...anterior.datos, ...cambios },
    }));
  }, []);

  const reiniciarRegistro = useCallback(() => {
    cancelarRetardo();
    pasoPrevioRef.current = null;
    setRegistro(ESTADO_INICIAL);
  }, []);

  const descartarRegistro = useCallback(async () => {
    cancelarRetardo();
    const fotoNombre = registroRef.current.datos.fotoNombre;
    if (typeof fotoNombre === 'string' && fotoNombre.length > 0) {
      try {
        eliminarFoto(fotoNombre);
      } catch (error: unknown) {
        console.error('No se pudo eliminar la fotografía del registro.', error);
      }
    }
    await eliminarBorrador();
    pasoPrevioRef.current = null;
    setRegistro(ESTADO_INICIAL);
  }, []);

  const valor = useMemo<ContextoRegistro>(
    () => ({
      registro,
      cargandoBorrador,
      definirCodigoMedidor,
      definirEstadoMedidor,
      definirPaso,
      actualizarDatos,
      reiniciarRegistro,
      descartarRegistro,
    }),
    [
      registro,
      cargandoBorrador,
      definirCodigoMedidor,
      definirEstadoMedidor,
      definirPaso,
      actualizarDatos,
      reiniciarRegistro,
      descartarRegistro,
    ],
  );

  return (
    <RegistroContext.Provider value={valor}>
      {children}
    </RegistroContext.Provider>
  );
}

export function useRegistro(): ContextoRegistro {
  const context = useContext(RegistroContext);
  if (context === null) {
    throw new Error('useRegistro debe utilizarse dentro de RegistroProvider.');
  }
  return context;
}
