
import { useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { RouteScreen } from '../../../components/RouteScreen';
import { useConexion } from '../../../contexts/ConexionContext';
import { useRegistro } from '../../../contexts/RegistroContext';
import { useSesion } from '../../../contexts/SesionContext';
import { calcularConsumo } from '../../../domain/consumo';
import { crearPeriodoLocal } from '../../../domain/identidadLectura';
import { determinarEstadoVerificacion } from '../../../domain/reglasLectura';
import type { MedidorOficina } from '../../../domain/tipos';
import { validarRegistro } from '../../../domain/validaciones';
import { obtenerRutaFoto } from '../../../services/fotoService';
import type { ResultadoConsultaMedidor } from '../../../services/medidoresService';
import { consultarMedidor } from '../../../services/medidoresService';
import {
  guardarLecturaLocal,
  LecturaYaRegistradaError,
} from '../../../services/registroService';
import { dimensions, spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';

const ETIQUETAS_ESTADO = {
  normal: 'Normal',
  inaccesible: 'Inaccesible',
  danado: 'Dañado',
} as const;

export default function ResumenScreen() {
  const { registro, cargandoBorrador, definirPaso, reiniciarRegistro } =
    useRegistro();
  const { tecnicoCodigo } = useSesion();
  const { enLinea } = useConexion();

  const [medidor, setMedidor] = useState<MedidorOficina | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [guardada, setGuardada] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [faltantes, setFaltantes] = useState<string[]>([]);

  const codigoMedidor = registro.codigoMedidor;
  const estado = registro.estadoMedidor;
  const datos = registro.datos;

  useEffect(() => {
    if (!cargandoBorrador) {
      definirPaso('resumen');
    }
  }, [cargandoBorrador, definirPaso]);

  useEffect(() => {
    let vigente = true;

    if (codigoMedidor === null || cargandoBorrador) {
      return () => {
        vigente = false;
      };
    }

    void consultarMedidor(codigoMedidor, enLinea)
      .then((resultado: ResultadoConsultaMedidor) => {
        if (vigente && resultado.estado === 'encontrado') {
          setMedidor(resultado.medidor);
        }
      })
      .catch(() => {
        // Sin datos de oficina, el resumen usa lo registrado por el técnico.
      });

    return () => {
      vigente = false;
    };
  }, [codigoMedidor, enLinea, cargandoBorrador]);

  if (cargandoBorrador) {
    return (
      <RouteScreen
        title="Resumen del registro"
        description="Recuperando el registro guardado…"
        kicker="PASO 5 DE 5 · RESUMEN"
        showPendingNotice={false}
      />
    );
  }

  // 2. Después, mostrar el éxito aunque el registro ya se haya reiniciado.
if (guardada) {
  return (
    <View style={styles.guardada}>
      <View style={styles.iconoExito}>
        <Text style={styles.iconoExitoTexto}>✓</Text>
      </View>

      <Text style={styles.guardadaTitulo}>
        ¡Lectura registrada!
      </Text>

      <Text style={styles.guardadaTexto}>
        La lectura se guardó correctamente en el dispositivo.
        Quedará pendiente de sincronización hasta que haya conexión.
      </Text>

      <Pressable
        style={styles.button}
        onPress={() => router.replace('/inicio')}
      >
        <Text style={styles.buttonText}>
          Volver al inicio
        </Text>
      </Pressable>
    </View>
  );
}

  if (codigoMedidor === null || estado === null) {
    return (
      <RouteScreen
        title="Resumen del registro"
        description="Primero completa los pasos anteriores del asistente."
        kicker="PASO 5 DE 5 · RESUMEN"
        showPendingNotice={false}
        links={[{ label: 'Consultar medidor', href: '/medidor' }]}
      />
    );
  }

  const periodo = crearPeriodoLocal(new Date());

  const lecturaActual =
    datos.lectura === null ||
    datos.lectura === undefined ||
    datos.lectura === ''
      ? null
      : Number(datos.lectura);

  const lecturaAnterior =
    datos.lecturaAnterior ?? medidor?.ultimaLectura ?? null;

  const consumo = calcularConsumo(lecturaActual, lecturaAnterior);

  const verificacion = determinarEstadoVerificacion({
    lectura: lecturaActual,
    lecturaAnterior,
    enLinea,
  });

  const rutaFoto = datos.fotoNombre
    ? obtenerRutaFoto(datos.fotoNombre)
    : null;

  async function guardar(): Promise<void> {
    if (codigoMedidor === null || estado === null) {
      return;
    }

    const estadoTecnico = estado;

    setGuardando(true);
    setMensaje(null);

    const errores = validarRegistro(estadoTecnico, datos);
    const camposFaltantes = Object.values(errores);

    if (camposFaltantes.length > 0) {
      setFaltantes(camposFaltantes);
      setGuardando(false);
      return;
    }

    setFaltantes([]);

    try {
      await guardarLecturaLocal({
        codigoMedidor,
        estadoMedidor: estadoTecnico,
        datos,
        tecnicoCodigo,
        enLinea,
        promedioMensual: medidor?.promedioMensual ?? null,
      });

      reiniciarRegistro();
      setGuardada(true);
    } catch (error: unknown) {
      if (error instanceof LecturaYaRegistradaError) {
        setMensaje(
          'Ya existe una lectura de este medidor en el mes actual. No se guardó una segunda.',
        );
      } else {
        setMensaje(
          'No se pudo guardar la lectura en el dispositivo. Inténtalo de nuevo.',
        );
      }
    } finally {
      setGuardando(false);
    }
  }

  if (guardada) {
    return (
      <View style={styles.pantalla}>
        <View style={styles.encabezado}>
          <View style={styles.orbeUno} />
          <View style={styles.orbeDos} />

          <Text style={styles.marca}>LECTURA ÁGIL · EPMAPS</Text>
          <Text style={styles.paso}>PASO 5 DE 5 · RESUMEN</Text>
          <Text style={styles.titulo}>
            Lectura <Text style={styles.tituloAcento}>guardada</Text>
          </Text>
          <Text style={styles.subtitulo}>
            Tu registro quedó almacenado en este dispositivo.
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.contenido}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.guardada}>
            <View style={styles.iconoExito}>
              <Text style={styles.iconoExitoTexto}>✓</Text>
            </View>

            <Text style={styles.guardadaTitulo}>
              Guardada en el dispositivo
            </Text>

            <Text style={styles.guardadaTexto}>
              Aún no se ha enviado a la oficina. La aplicación la enviará
              cuando haya conexión.
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace('/inicio')}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.buttonText}>Volver al inicio</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.pantalla}>
      <View style={styles.encabezado}>
        <View style={styles.orbeUno} />
        <View style={styles.orbeDos} />

        <Text style={styles.marca}>LECTURA ÁGIL · EPMAPS</Text>
        <Text style={styles.paso}>PASO 5 DE 5 · RESUMEN</Text>

        <Text style={styles.titulo}>
          Resumen del <Text style={styles.tituloAcento}>registro</Text>
        </Text>

        <Text style={styles.subtitulo}>
          Revisa la información antes de guardar la lectura en el dispositivo.
        </Text>

        <View style={styles.indicadorPaso}>
          <View style={styles.indicadorCompletado} />
          <View style={styles.indicadorCompletado} />
          <View style={styles.indicadorCompletado} />
          <View style={styles.indicadorCompletado} />
          <View style={styles.indicadorActual} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.tarjeta}>
          <View style={styles.cabeceraTarjeta}>
            <View style={styles.iconoMedidor}>
              <Text style={styles.iconoMedidorTexto}>M</Text>
            </View>

            <View style={styles.infoMedidor}>
              <Text style={styles.etiquetaSuperior}>CÓDIGO DEL MEDIDOR</Text>
              <Text style={styles.codigo}>{codigoMedidor}</Text>
            </View>
          </View>

          <View style={styles.separador} />

          <View style={styles.periodoContenedor}>
            <Text style={styles.periodoEtiqueta}>PERÍODO DEL REGISTRO</Text>
            <Text style={styles.periodo}>{periodo}</Text>
          </View>

          <Fila
            etiqueta="ESTADO DEL MEDIDOR"
            valor={ETIQUETAS_ESTADO[estado]}
          />

          <Fila
            etiqueta="LECTURA ACTUAL"
            valor={
              lecturaActual === null
                ? 'Sin lectura'
                : String(lecturaActual)
            }
          />

          <Fila
            etiqueta="LECTURA ANTERIOR"
            valor={
              lecturaAnterior === null
                ? 'Sin dato previo'
                : String(lecturaAnterior)
            }
          />

          <Fila
            etiqueta="CONSUMO"
            valor={consumo === null ? 'No calculable' : String(consumo)}
          />

          {estado === 'inaccesible' && datos.motivo != null && (
            <Fila etiqueta="MOTIVO" valor={datos.motivo} />
          )}

          {estado === 'danado' && datos.descripcion != null && (
            <Fila etiqueta="DAÑO DESCRITO" valor={datos.descripcion} />
          )}

          <Fila
            etiqueta="FOTOGRAFÍA"
            valor={
              datos.fotoNombre === null
                ? 'Sin fotografía'
                : rutaFoto === null
                  ? 'Archivo no disponible'
                  : 'Adjunta'
            }
          />

          <View style={styles.estadoVerificacion}>
            <Text style={styles.filaEtiqueta}>VERIFICACIÓN</Text>

            <Text
              style={[
                styles.verificacionValor,
                verificacion === 'verificada'
                  ? styles.verificacionCorrecta
                  : styles.verificacionPendiente,
              ]}
            >
              {verificacion === 'verificada'
                ? '✓ Datos completos para verificar'
                : 'Pendiente de verificar con los datos de oficina'}
            </Text>
          </View>
        </View>

        {rutaFoto !== null && (
          <View style={styles.seccionFoto}>
            <Text style={styles.tituloSeccion}>Fotografía adjunta</Text>
            <Image
              source={{ uri: rutaFoto }}
              style={styles.miniatura}
              resizeMode="cover"
            />
          </View>
        )}

        {faltantes.length > 0 && (
          <View style={styles.faltantes} accessibilityRole="summary">
            <Text style={styles.faltantesTitulo}>Falta completar</Text>

            {faltantes.map((texto, indice) => (
              <Text key={`${indice}-${texto}`} style={styles.faltantesTexto}>
                • {texto}
              </Text>
            ))}
          </View>
        )}

        {mensaje !== null && (
          <Text accessibilityRole="alert" style={styles.error}>
            {mensaje}
          </Text>
        )}

        <View style={styles.notaGuardado}>
          <Text style={styles.notaIcono}>i</Text>
          <Text style={styles.nota}>
            Guardar no envía la lectura. Quedará pendiente hasta que la oficina
            la reciba.
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={guardando}
          onPress={() => void guardar()}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
            guardando && styles.buttonDisabled,
          ]}
        >
          <Text style={styles.buttonText}>
            {guardando
              ? 'Guardando…'
              : 'Guardar lectura en el dispositivo'}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/registro/fotografia')}
          style={({ pressed }) => [
            styles.buttonSecundario,
            pressed && styles.buttonSecundarioPresionado,
          ]}
        >
          <Text style={styles.buttonSecundarioTexto}>
            Volver a la fotografía
          </Text>
        </Pressable>

        <Text style={styles.pie}>
          LECTURA ÁGIL · REGISTRO DE CONSUMO
        </Text>
      </ScrollView>
    </View>
  );
}

function Fila({
  etiqueta,
  valor,
}: {
  etiqueta: string;
  valor: string;
}) {
  return (
    <View style={styles.fila}>
      <Text style={styles.filaEtiqueta}>{etiqueta}</Text>
      <Text style={styles.filaValor}>{valor}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: '#EAF4F8',
  },
  encabezado: {
    backgroundColor: '#062B52',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 54,
    paddingBottom: 28,
    overflow: 'hidden',
  },
  orbeUno: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(34,178,224,0.15)',
    top: -90,
    right: -45,
  },
  orbeDos: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(0,207,190,0.12)',
    bottom: -65,
    left: 30,
  },
  marca: {
    color: '#A8E8F8',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.6,
    marginBottom: 22,
  },
  paso: {
    color: '#A8E8F8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 10,
  },
  titulo: {
    color: '#FFFFFF',
    fontSize: 29,
    fontWeight: '800',
    lineHeight: 36,
    marginBottom: 10,
  },
  tituloAcento: {
    color: '#53D6E8',
  },
  subtitulo: {
    color: '#D5EAF7',
    fontSize: 14,
    lineHeight: 22,
    maxWidth: 340,
  },
  indicadorPaso: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 22,
  },
  indicadorCompletado: {
    flex: 1,
    height: 4,
    borderRadius: 4,
    backgroundColor: '#53D6E8',
  },
  indicadorActual: {
    flex: 1,
    height: 4,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  contenido: {
    padding: 20,
    paddingBottom: 36,
    gap: 16,
  },
  tarjeta: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D7E8F1',
    borderRadius: 24,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
    shadowColor: '#062B52',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  cabeceraTarjeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconoMedidor: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#E5F5FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconoMedidorTexto: {
    color: '#087FC4',
    fontSize: 21,
    fontWeight: '900',
  },
  infoMedidor: {
    flex: 1,
    gap: 4,
  },
  etiquetaSuperior: {
    color: '#5A7185',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  codigo: {
    ...typography.technical,
    color: '#062B52',
    fontSize: 22,
    fontWeight: '800',
  },
  separador: {
    height: 1,
    backgroundColor: '#EAF1F5',
  },
  periodoContenedor: {
    backgroundColor: '#EAF7FC',
    borderRadius: 16,
    padding: 12,
    gap: 5,
  },
  periodoEtiqueta: {
    color: '#5A7185',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  periodo: {
    color: '#087FC4',
    fontSize: 15,
    fontWeight: '800',
  },
  fila: {
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#EAF1F5',
  },
  filaEtiqueta: {
    ...typography.caption,
    color: '#5A7185',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  filaValor: {
    ...typography.body,
    color: '#123550',
    fontWeight: '600',
    lineHeight: 23,
  },
  estadoVerificacion: {
    gap: 8,
    backgroundColor: '#F5F9FC',
    padding: 12,
    borderRadius: 14,
  },
  verificacionValor: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 20,
  },
  verificacionCorrecta: {
    color: '#087F62',
  },
  verificacionPendiente: {
    color: '#A96500',
  },
  seccionFoto: {
    gap: 10,
  },
  tituloSeccion: {
    color: '#062B52',
    fontSize: 16,
    fontWeight: '800',
  },
  miniatura: {
    borderRadius: 20,
    height: dimensions.minimumTouchTarget * 4,
    width: '100%',
    borderWidth: 1,
    borderColor: '#D7E8F1',
    backgroundColor: '#FFFFFF',
  },
  faltantes: {
    backgroundColor: '#FFF8E9',
    borderColor: '#F0C36D',
    borderRadius: 20,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  faltantesTitulo: {
    ...typography.label,
    color: '#A96500',
    fontSize: 16,
  },
  faltantesTexto: {
    ...typography.body,
    color: '#714B12',
    lineHeight: 22,
  },
  error: {
    ...typography.body,
    color: '#C7354F',
    backgroundColor: '#FFF0F2',
    borderColor: '#F2C6CF',
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing.md,
    lineHeight: 22,
  },
  notaGuardado: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#E5F5FC',
    borderRadius: 16,
    padding: 14,
  },
  notaIcono: {
    color: '#087FC4',
    fontSize: 16,
    fontWeight: '900',
  },
  nota: {
    ...typography.caption,
    color: '#45647B',
    flex: 1,
    lineHeight: 20,
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#087FC4',
    borderRadius: 18,
    justifyContent: 'center',
    marginTop: spacing.sm,
    minHeight: dimensions.buttonMinimumHeight,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    shadowColor: '#087FC4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonPressed: {
    backgroundColor: '#075D92',
    transform: [{ scale: 0.99 }],
  },
  buttonDisabled: {
    opacity: 0.55,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    ...typography.label,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  buttonSecundario: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#B7D9E9',
    borderWidth: 1,
    borderRadius: 18,
    justifyContent: 'center',
    minHeight: dimensions.buttonMinimumHeight,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  buttonSecundarioPresionado: {
    backgroundColor: '#E5F5FC',
  },
  buttonSecundarioTexto: {
    color: '#075D92',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  guardada: {
    backgroundColor: '#FFFFFF',
    borderColor: '#9ADBC5',
    borderRadius: 24,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
    alignItems: 'flex-start',
    shadowColor: '#062B52',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  iconoExito: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#E1F6ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconoExitoTexto: {
    color: '#087F62',
    fontSize: 30,
    fontWeight: '900',
  },
  guardadaTitulo: {
    ...typography.section,
    color: '#087F62',
    fontWeight: '800',
  },
  guardadaTexto: {
    ...typography.body,
    color: '#245B4B',
    lineHeight: 23,
  },
  pie: {
    color: '#7893A5',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.1,
    textAlign: 'center',
    marginTop: 8,
  },
});
