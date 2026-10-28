
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { RouteScreen } from '../../../components/RouteScreen';
import { mensajeErrorMedidor } from '../../../components/medidoresUi';
import { useConexion } from '../../../contexts/ConexionContext';
import { useRegistro } from '../../../contexts/RegistroContext';
import { ESTADOS_MEDIDOR, type EstadoMedidor } from '../../../domain/tipos';
import {
  evaluarEstadoOficina,
  validarCodigoMedidor,
} from '../../../domain/validaciones';
import { existeLecturaEnPeriodo } from '../../../services/registroService';
import type { ResultadoConsultaMedidor } from '../../../services/medidoresService';
import { consultarMedidor } from '../../../services/medidoresService';

const PALETA = {
  fondo: '#EAF4F8',
  azulOscuro: '#062B52',
  azul: '#087FC4',
  azulClaro: '#DDF4FA',
  texto: '#103E66',
  secundario: '#5A788D',
  blanco: '#FFFFFF',
  borde: '#D1E6F0',
  verde: '#087F62',
  verdeFondo: '#D9F7E9',
  ambar: '#A96500',
  ambarFondo: '#FFF0C8',
  rojo: '#C7354F',
  rojoFondo: '#FFE0E5',
};

const ESTADOS: Record<
  EstadoMedidor,
  { titulo: string; descripcion: string; icono: string; color: string; fondo: string }
> = {
  normal: {
    titulo: 'Normal',
    descripcion: 'El medidor responde. Exige registrar la lectura.',
    icono: '✓',
    color: PALETA.verde,
    fondo: PALETA.verdeFondo,
  },
  inaccesible: {
    titulo: 'Inaccesible',
    descripcion: 'No se pudo leer. Debes indicar el motivo; no admite lectura.',
    icono: '⌕',
    color: PALETA.ambar,
    fondo: PALETA.ambarFondo,
  },
  danado: {
    titulo: 'Dañado',
    descripcion: 'Debes describir el daño. La lectura es opcional.',
    icono: '!',
    color: PALETA.rojo,
    fondo: PALETA.rojoFondo,
  },
};

export default function EstadoMedidorScreen() {
  const { codigo } = useLocalSearchParams<{ codigo: string }>();
  const codigoMedidor = Array.isArray(codigo) ? '' : codigo ?? '';
  const { enLinea } = useConexion();

  const {
    registro,
    definirCodigoMedidor,
    definirEstadoMedidor,
    descartarRegistro,
  } = useRegistro();

  const [consulta, setConsulta] = useState<{
    clave: string;
    resultado: ResultadoConsultaMedidor | null;
    error: string | null;
  } | null>(null);

  const [lecturaExistente, setLecturaExistente] =
    useState<boolean | null>(null);

  const errorCodigo =
    validarCodigoMedidor(codigoMedidor) === null
      ? null
      : 'Consulta un medidor válido antes de iniciar el registro.';

  const claveConsulta = `${codigoMedidor}:${enLinea}`;

  useEffect(() => {
    if (
      errorCodigo === null &&
      registro.codigoMedidor !== codigoMedidor
    ) {
      definirCodigoMedidor(codigoMedidor);
    }
  }, [
    errorCodigo,
    codigoMedidor,
    registro.codigoMedidor,
    definirCodigoMedidor,
  ]);

  useEffect(() => {
    let vigente = true;

    if (errorCodigo !== null) {
      return () => {
        vigente = false;
      };
    }

    void consultarMedidor(codigoMedidor, enLinea)
      .then((resultado) => {
        if (vigente) {
          setConsulta({
            clave: claveConsulta,
            resultado,
            error: null,
          });
        }
      })
      .catch((errorConsulta: unknown) => {
        if (vigente) {
          setConsulta({
            clave: claveConsulta,
            resultado: null,
            error: mensajeErrorMedidor(errorConsulta),
          });
        }
      });

    void existeLecturaEnPeriodo(codigoMedidor)
      .then((existe) => {
        if (vigente) setLecturaExistente(existe);
      })
      .catch(() => {
        if (vigente) setLecturaExistente(false);
      });

    return () => {
      vigente = false;
    };
  }, [codigoMedidor, enLinea, claveConsulta, errorCodigo]);

  const consultaActual =
    consulta?.clave === claveConsulta ? consulta : null;

  const resultado = consultaActual?.resultado ?? null;
  const error = errorCodigo ?? consultaActual?.error ?? null;
  const cargando = errorCodigo === null && consultaActual === null;

  const medidorEncontrado =
    resultado?.estado === 'encontrado' ? resultado.medidor : null;

  const decision =
    medidorEncontrado === null
      ? null
      : evaluarEstadoOficina(medidorEncontrado.estadoOficina);

  const permiteRegistrar =
    decision?.permiteContinuar === true ||
    resultado?.estado === 'sin_cache_sin_conexion';

  const registroOtroMedidor =
    registro.codigoMedidor !== null &&
    registro.codigoMedidor !== codigoMedidor &&
    registro.estadoMedidor !== null;

  if (registroOtroMedidor) {
    return (
      <RouteScreen
        title="Registro en curso"
        description={`Ya hay un registro sin guardar del medidor ${registro.codigoMedidor}. Continúalo o descártalo antes de iniciar uno nuevo.`}
        kicker="CONTROL PREVIO"
        showPendingNotice={false}
        links={[{ label: 'Volver al inicio', href: '/inicio' }]}
      >
        <View style={styles.panel}>
          <Text style={styles.panelTitulo}>Tienes un registro pendiente</Text>
          <Text style={styles.texto}>
            Para comenzar con otro medidor, primero debes continuar o descartar
            el registro actual.
          </Text>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push(`/registro/${registro.paso}`)}
            style={({ pressed }) => [
              styles.botonPrincipal,
              pressed && styles.presionado,
            ]}
          >
            <Text style={styles.botonPrincipalTexto}>
              Continuar registro
            </Text>
            <Text style={styles.flecha}>→</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => void descartarRegistro()}
            style={({ pressed }) => [
              styles.botonSecundario,
              pressed && styles.presionado,
            ]}
          >
            <Text style={styles.botonSecundarioTexto}>
              Descartar ese registro
            </Text>
          </Pressable>
        </View>
      </RouteScreen>
    );
  }

  return (
    <RouteScreen
      title="Estado del medidor"
      description="Indica cómo encontraste el medidor. El estado de oficina se comprueba por separado."
      kicker="PASO 1 DE 5 · CONTROL PREVIO"
      showPendingNotice={false}
      links={[{ label: 'Volver a consultar medidor', href: '/medidor' }]}
    >
      <View style={styles.marcaFila}>
        <View style={styles.marcaIcono}>
          <Text style={styles.marcaGota}>◇</Text>
        </View>
        <Text style={styles.marcaTexto}>LECTURA ÁGIL · EPMAPS</Text>
      </View>

      <View style={styles.pasoPanel}>
        <View style={styles.pasoNumero}>
          <Text style={styles.pasoNumeroTexto}>01</Text>
        </View>
        <View style={styles.pasoContenido}>
          <Text style={styles.pasoEtiqueta}>PASO 1 DE 5</Text>
          <Text style={styles.pasoTitulo}>Estado observado</Text>
          <Text style={styles.pasoDescripcion}>
            Comprueba el suministro y selecciona la condición física
            encontrada durante la visita.
          </Text>
        </View>
      </View>

      {medidorEncontrado !== null && (
        <View style={styles.medidorPanel}>
          <View style={styles.medidorIcono}>
            <Text style={styles.medidorGota}>◇</Text>
          </View>
          <View style={styles.medidorContenido}>
            <Text style={styles.etiqueta}>MEDIDOR CONSULTADO</Text>
            <Text style={styles.codigo}>{medidorEncontrado.codigo}</Text>
            <Text style={styles.texto}>
              Estado de oficina: {medidorEncontrado.estadoOficina}
            </Text>
          </View>
          <View style={styles.puntoVerde} />
        </View>
      )}

      {cargando && (
        <View style={styles.estadoPanel}>
          <ActivityIndicator size="large" color={PALETA.azul} />
          <Text style={styles.panelTitulo}>Verificando suministro</Text>
          <Text style={styles.texto}>
            Consultando los datos disponibles de oficina y la información local.
          </Text>
        </View>
      )}

      {error !== null && (
        <View style={styles.errorPanel} accessibilityRole="alert">
          <Text style={styles.errorIcono}>!</Text>
          <Text style={styles.errorTitulo}>No se pudo completar la consulta</Text>
          <Text style={styles.errorTexto}>{error}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace('/medidor')}
            style={({ pressed }) => [
              styles.botonPrincipal,
              pressed && styles.presionado,
            ]}
          >
            <Text style={styles.botonPrincipalTexto}>Volver a consultar</Text>
            <Text style={styles.flecha}>→</Text>
          </Pressable>
        </View>
      )}

      {decision !== null && (
        <View
          style={[
            styles.avisoPanel,
            decision.permiteContinuar
              ? styles.avisoPermitido
              : styles.avisoBloqueado,
          ]}
          accessibilityRole="summary"
        >
          <View
            style={[
              styles.avisoIcono,
              {
                backgroundColor: decision.permiteContinuar
                  ? PALETA.verdeFondo
                  : PALETA.rojoFondo,
              },
            ]}
          >
            <Text
              style={{
                color: decision.permiteContinuar
                  ? PALETA.verde
                  : PALETA.rojo,
                fontSize: 19,
                fontWeight: '900',
              }}
            >
              {decision.permiteContinuar ? '✓' : '!'}
            </Text>
          </View>
          <View style={styles.avisoContenido}>
            <Text style={styles.panelTitulo}>
              {decision.permiteContinuar
                ? 'Puede continuar'
                : 'Requiere atención'}
            </Text>
            <Text style={styles.texto}>{decision.mensaje}</Text>
          </View>
        </View>
      )}

      {resultado?.estado === 'sin_cache_sin_conexion' && (
        <View style={styles.offlinePanel}>
          <Text style={styles.offlineTitulo}>⌁  Modo sin conexión</Text>
          <Text style={styles.offlineTexto}>
            No hay datos de oficina disponibles. Si continúas, la lectura
            quedará pendiente de verificación al recuperar la conexión.
          </Text>
        </View>
      )}

      {lecturaExistente === true && (
        <View style={styles.errorPanel} accessibilityRole="summary">
          <Text style={styles.errorTitulo}>
            Ya registraste este medidor este mes
          </Text>
          <Text style={styles.errorTexto}>
            Solo puede haber una lectura por medidor y periodo. Revisa el
            registro existente desde el historial.
          </Text>
        </View>
      )}

      {permiteRegistrar && lecturaExistente !== true && (
        <>
          <View style={styles.seccion}>
            <Text style={styles.seccionTitulo}>Estado observado por el técnico</Text>
            <Text style={styles.seccionSubtitulo}>
              Selecciona una sola opción para continuar.
            </Text>
          </View>

          <View style={styles.opciones}>
            {ESTADOS_MEDIDOR.map((estado) => {
              const seleccionado = registro.estadoMedidor === estado;
              const apariencia = ESTADOS[estado];

              return (
                <Pressable
                  key={estado}
                  accessibilityRole="button"
                  accessibilityState={{ selected: seleccionado }}
                  onPress={() => definirEstadoMedidor(estado)}
                  style={({ pressed }) => [
                    styles.opcion,
                    seleccionado && {
                      borderColor: PALETA.azul,
                      backgroundColor: '#F1FAFF',
                    },
                    pressed && styles.opcionPresionada,
                  ]}
                >
                  <View
                    style={[
                      styles.opcionIcono,
                      { backgroundColor: apariencia.fondo },
                    ]}
                  >
                    <Text
                      style={[
                        styles.opcionIconoTexto,
                        { color: apariencia.color },
                      ]}
                    >
                      {apariencia.icono}
                    </Text>
                  </View>

                  <View style={styles.opcionContenido}>
                    <Text style={styles.opcionTitulo}>
                      {apariencia.titulo}
                    </Text>
                    <Text style={styles.opcionDescripcion}>
                      {apariencia.descripcion}
                    </Text>
                    {seleccionado && (
                      <Text style={styles.opcionSeleccionadaTexto}>
                        ✓ Seleccionado
                      </Text>
                    )}
                  </View>

                  <View
                    style={[
                      styles.radio,
                      seleccionado && styles.radioSeleccionado,
                    ]}
                  >
                    {seleccionado && <View style={styles.radioCentro} />}
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.ayudaPanel}>
            <Text style={styles.ayudaIcono}>i</Text>
            <Text style={styles.ayudaTexto}>
              La opción seleccionada determina los campos que se solicitarán
              en los siguientes pasos del registro.
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={registro.estadoMedidor === null}
            onPress={() => router.push('/registro/datos_lectura')}
            style={({ pressed }) => [
              styles.botonPrincipal,
              pressed && styles.presionado,
              registro.estadoMedidor === null && styles.botonDeshabilitado,
            ]}
          >
            <Text style={styles.botonPrincipalTexto}>
              Siguiente: datos de lectura
            </Text>
            <Text style={styles.flecha}>→</Text>
          </Pressable>

          {registro.estadoMedidor === null && (
            <Text style={styles.mensajeSeleccion}>
              Selecciona el estado observado para continuar.
            </Text>
          )}
        </>
      )}

      <Text style={styles.pieMarca}>LECTURA ÁGIL · EPMAPS</Text>
    </RouteScreen>
  );
}

const styles = StyleSheet.create({
  marcaFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 16,
  },
  marcaIcono: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETA.azulOscuro,
  },
  marcaGota: {
    color: '#8DEBFF',
    fontSize: 24,
    fontWeight: '700',
  },
  marcaTexto: {
    color: PALETA.secundario,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  pasoPanel: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 13,
    padding: 16,
    marginBottom: 14,
    borderRadius: 22,
    backgroundColor: PALETA.azulOscuro,
  },
  pasoNumero: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: 'rgba(141,235,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(141,235,255,0.32)',
  },
  pasoNumeroTexto: {
    color: '#8DEBFF',
    fontSize: 17,
    fontWeight: '900',
  },
  pasoContenido: { flex: 1 },
  pasoEtiqueta: {
    color: '#8DEBFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  pasoTitulo: {
    color: PALETA.blanco,
    fontSize: 17,
    fontWeight: '800',
    marginTop: 4,
  },
  pasoDescripcion: {
    color: '#D5EAF7',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },
  medidorPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 15,
    marginBottom: 16,
    borderRadius: 22,
    backgroundColor: PALETA.blanco,
    borderWidth: 1,
    borderColor: '#D5EAF2',
  },
  medidorIcono: {
    width: 47,
    height: 47,
    borderRadius: 16,
    backgroundColor: PALETA.azulClaro,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medidorGota: {
    color: PALETA.azul,
    fontSize: 29,
    fontWeight: '800',
  },
  medidorContenido: { flex: 1, minWidth: 0 },
  etiqueta: {
    color: PALETA.secundario,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  codigo: {
    color: PALETA.texto,
    fontSize: 16,
    fontWeight: '900',
    marginTop: 4,
  },
  puntoVerde: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#20B990',
  },
  estadoPanel: {
    alignItems: 'center',
    padding: 22,
    marginBottom: 14,
    borderRadius: 22,
    backgroundColor: PALETA.blanco,
    gap: 10,
  },
  panel: {
    padding: 17,
    borderRadius: 22,
    backgroundColor: PALETA.blanco,
    gap: 12,
  },
  panelTitulo: {
    color: PALETA.texto,
    fontSize: 15,
    fontWeight: '800',
  },
  texto: {
    color: PALETA.secundario,
    fontSize: 12,
    lineHeight: 19,
  },
  errorPanel: {
    padding: 17,
    marginBottom: 14,
    borderRadius: 22,
    backgroundColor: '#FFF3F4',
    borderWidth: 1,
    borderColor: '#F5CDD4',
    gap: 9,
  },
  errorIcono: {
    color: PALETA.rojo,
    fontSize: 24,
    fontWeight: '900',
  },
  errorTitulo: {
    color: '#A92D43',
    fontSize: 15,
    fontWeight: '800',
  },
  errorTexto: {
    color: '#963D4D',
    fontSize: 12,
    lineHeight: 19,
  },
  avisoPanel: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 15,
    marginBottom: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  avisoPermitido: {
    backgroundColor: PALETA.verdeFondo,
    borderColor: '#B5EBD3',
  },
  avisoBloqueado: {
    backgroundColor: '#FFF0F2',
    borderColor: '#F5CDD4',
  },
  avisoIcono: {
    width: 36,
    height: 36,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avisoContenido: { flex: 1, gap: 5 },
  offlinePanel: {
    padding: 16,
    marginBottom: 14,
    borderRadius: 20,
    backgroundColor: '#FFF8E8',
    borderWidth: 1,
    borderColor: '#F2DDAA',
    gap: 9,
  },
  offlineTitulo: {
    color: PALETA.ambar,
    fontSize: 14,
    fontWeight: '800',
  },
  offlineTexto: {
    color: '#805E32',
    fontSize: 12,
    lineHeight: 19,
  },
  seccion: {
    marginTop: 8,
    marginBottom: 12,
  },
  seccionTitulo: {
    color: PALETA.texto,
    fontSize: 18,
    fontWeight: '800',
  },
  seccionSubtitulo: {
    color: PALETA.secundario,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  opciones: { gap: 12 },
  opcion: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 15,
    minHeight: 100,
    borderRadius: 22,
    backgroundColor: PALETA.blanco,
    borderWidth: 1,
    borderColor: '#D5EAF2',
  },
  opcionPresionada: { opacity: 0.82 },
  opcionIcono: {
    width: 43,
    height: 43,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  opcionIconoTexto: {
    fontSize: 21,
    fontWeight: '900',
  },
  opcionContenido: { flex: 1, gap: 5 },
  opcionTitulo: {
    color: PALETA.texto,
    fontSize: 15,
    fontWeight: '800',
  },
  opcionDescripcion: {
    color: PALETA.secundario,
    fontSize: 12,
    lineHeight: 18,
  },
  opcionSeleccionadaTexto: {
    color: PALETA.azul,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 3,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#A8C7D7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSeleccionado: { borderColor: PALETA.azul },
  radioCentro: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: PALETA.azul,
  },
  ayudaPanel: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 13,
    marginTop: 14,
    marginBottom: 14,
    borderRadius: 17,
    backgroundColor: PALETA.azulClaro,
  },
  ayudaIcono: {
    width: 24,
    height: 24,
    borderRadius: 8,
    textAlign: 'center',
    textAlignVertical: 'center',
    overflow: 'hidden',
    backgroundColor: PALETA.blanco,
    color: PALETA.azul,
    fontWeight: '900',
  },
  ayudaTexto: {
    flex: 1,
    color: '#315F7B',
    fontSize: 11,
    lineHeight: 17,
  },
  botonPrincipal: {
    minHeight: 52,
    marginTop: 12,
    paddingHorizontal: 16,
    borderRadius: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: PALETA.azul,
  },
  botonPrincipalTexto: {
    flex: 1,
    color: PALETA.blanco,
    fontSize: 13,
    fontWeight: '800',
  },
  flecha: {
    color: PALETA.blanco,
    fontSize: 21,
    marginLeft: 10,
  },
  botonDeshabilitado: { opacity: 0.48 },
  botonSecundario: {
    minHeight: 48,
    paddingHorizontal: 15,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F7FA',
    borderWidth: 1,
    borderColor: '#C8E3EF',
  },
  botonSecundarioTexto: {
    color: PALETA.azulOscuro,
    fontSize: 12,
    fontWeight: '800',
  },
  presionado: { opacity: 0.8 },
  mensajeSeleccion: {
    color: PALETA.secundario,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 9,
  },
  pieMarca: {
    color: '#7190A3',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
    textAlign: 'center',
    marginTop: 24,
  },
});
