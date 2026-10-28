
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { MedidorCard } from '../../../components/MedidorCard';
import { mensajeErrorMedidor } from '../../../components/medidoresUi';
import { useConexion } from '../../../contexts/ConexionContext';
import {
  evaluarEstadoOficina,
  validarCodigoMedidor,
} from '../../../domain/validaciones';
import type { ResultadoConsultaMedidor } from '../../../services/medidoresService';
import { consultarMedidor } from '../../../services/medidoresService';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';

export default function MedidorDetailScreen() {
  const { codigo } = useLocalSearchParams<{ codigo: string }>();
  const codigoMedidor = Array.isArray(codigo) ? '' : codigo ?? '';
  const { enLinea } = useConexion();

  const [consulta, setConsulta] = useState<{
    clave: string;
    resultado: ResultadoConsultaMedidor | null;
    error: string | null;
  } | null>(null);

  const errorCodigo =
    validarCodigoMedidor(codigoMedidor) === null
      ? null
      : 'El código del medidor no tiene un formato válido.';

  const claveConsulta = `${codigoMedidor}:${enLinea}`;

  useEffect(() => {
    let vigente = true;

    if (errorCodigo !== null) {
      return () => {
        vigente = false;
      };
    }

    void consultarMedidor(codigoMedidor, enLinea)
      .then((resultadoConsulta) => {
        if (vigente) {
          setConsulta({
            clave: claveConsulta,
            resultado: resultadoConsulta,
            error: null,
          });
        }
      })
      .catch((consultaError: unknown) => {
        if (vigente) {
          setConsulta({
            clave: claveConsulta,
            resultado: null,
            error: mensajeErrorMedidor(consultaError),
          });
        }
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
    resultado?.estado === 'encontrado' ? resultado : null;

  const decision =
    medidorEncontrado === null
      ? null
      : evaluarEstadoOficina(
          medidorEncontrado.medidor.estadoOficina,
        );

  const puedeRegistrar =
    resultado?.estado === 'sin_cache_sin_conexion' ||
    decision?.permiteContinuar === true;

  function volverAConsultar() {
    router.replace('/medidor');
  }

  function registrarLectura() {
    router.push({
      pathname: '/registro/estado_medidor',
      params: { codigo: codigoMedidor },
    });
  }

  return (
    <View style={styles.pantalla}>
      <ScrollView
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
      >
        {/* Encabezado */}
        <View style={styles.encabezado}>
          <View pointerEvents="none" style={styles.orbeUno} />
          <View pointerEvents="none" style={styles.orbeDos} />

          <Pressable
            accessibilityRole="button"
            onPress={volverAConsultar}
            style={({ pressed }) => [
              styles.botonVolver,
              pressed && styles.presionado,
            ]}
          >
            <Text style={styles.flechaVolver}>←</Text>
            <Text style={styles.textoVolver}>Volver a consulta</Text>
          </Pressable>

          <View style={styles.marcaFila}>
            <View style={styles.marcaIcono}>
              <Text style={styles.gotaMarca}>◇</Text>
            </View>
            <Text style={styles.marcaTexto}>LECTURA ÁGIL · EPMAPS</Text>
          </View>

          <Text style={styles.kicker}>INFORMACIÓN DEL SUMINISTRO</Text>
          <Text style={styles.titulo}>Detalle del</Text>
          <Text style={styles.tituloAcento}>medidor.</Text>

          <Text style={styles.subtitulo}>
            Revisa la información disponible antes de registrar una nueva
            lectura.
          </Text>

          <View style={styles.codigoPanel}>
            <View style={styles.codigoIcono}>
              <Text style={styles.codigoIconoTexto}>◇</Text>
            </View>

            <View style={styles.codigoContenido}>
              <Text style={styles.codigoEtiqueta}>CÓDIGO CONSULTADO</Text>
              <Text style={styles.codigoValor}>
                {codigoMedidor || 'Código no disponible'}
              </Text>
            </View>

            <View style={styles.codigoPunto} />
          </View>
        </View>

        {/* Estado de consulta */}
        <View style={styles.seccion}>
          <View>
            <Text style={styles.seccionTitulo}>Resultado de consulta</Text>
            <Text style={styles.seccionSubtitulo}>
              Información obtenida para este suministro.
            </Text>
          </View>
        </View>

        {cargando && (
          <View style={styles.estadoPanel}>
            <View style={styles.cargaIcono}>
              <ActivityIndicator size="large" color="#087FC4" />
            </View>
            <Text style={styles.estadoTitulo}>Consultando medidor</Text>
            <Text style={styles.estadoDescripcion}>
              Estamos recuperando los datos disponibles del suministro.
            </Text>
          </View>
        )}

        {error !== null && (
          <View style={styles.errorPanel} accessibilityRole="alert">
            <View style={styles.errorIcono}>
              <Text style={styles.errorIconoTexto}>!</Text>
            </View>
            <Text style={styles.errorTitulo}>
              No se pudo completar la consulta
            </Text>
            <Text style={styles.errorDescripcion}>{error}</Text>

            <Pressable
              accessibilityRole="button"
              onPress={volverAConsultar}
              style={({ pressed }) => [
                styles.botonReintentar,
                pressed && styles.presionado,
              ]}
            >
              <Text style={styles.botonReintentarTexto}>
                Volver a consultar
              </Text>
              <Text style={styles.botonReintentarFlecha}>→</Text>
            </Pressable>
          </View>
        )}

        {resultado?.estado === 'sin_cache_sin_conexion' && (
          <View style={styles.offlinePanel}>
            <View style={styles.offlineCabecera}>
              <View style={styles.offlineIcono}>
                <Text style={styles.offlineIconoTexto}>⌁</Text>
              </View>
              <View style={styles.offlineContenido}>
                <Text style={styles.offlineTitulo}>
                  Información no disponible
                </Text>
                <Text style={styles.offlineEtiqueta}>
                  MODO SIN CONEXIÓN
                </Text>
              </View>
            </View>

            <Text style={styles.offlineDescripcion}>
              No hay conexión ni una copia local de este medidor. Si continúas,
              el registro deberá quedar pendiente de verificación según las
              reglas de la aplicación.
            </Text>
          </View>
        )}

        {medidorEncontrado !== null && (
          <View style={styles.resultadoContenedor}>
            <View style={styles.resultadoEtiqueta}>
              <View style={styles.resultadoPunto} />
              <Text style={styles.resultadoEtiquetaTexto}>
                MEDIDOR ENCONTRADO
              </Text>
            </View>

            <View style={styles.medidorCardContenedor}>
              <MedidorCard
                medidor={medidorEncontrado.medidor}
                origen={medidorEncontrado.origen}
                consultadoEn={medidorEncontrado.consultadoEn}
              />
            </View>

            {decision !== null && (
              <View
                accessibilityRole="summary"
                style={[
                  styles.decisionPanel,
                  decision.permiteContinuar
                    ? styles.decisionPermitida
                    : styles.decisionBloqueada,
                ]}
              >
                <View
                  style={[
                    styles.decisionIcono,
                    decision.permiteContinuar
                      ? styles.decisionIconoVerde
                      : styles.decisionIconoRojo,
                  ]}
                >
                  <Text
                    style={[
                      styles.decisionIconoTexto,
                      decision.permiteContinuar
                        ? styles.decisionTextoVerde
                        : styles.decisionTextoRojo,
                    ]}
                  >
                    {decision.permiteContinuar ? '✓' : '!'}
                  </Text>
                </View>

                <View style={styles.decisionContenido}>
                  <Text style={styles.decisionTitulo}>
                    {decision.permiteContinuar
                      ? 'Puede continuar'
                      : 'Requiere atención'}
                  </Text>
                  <Text
                    style={[
                      styles.decisionDescripcion,
                      !decision.permiteContinuar &&
                        styles.decisionDescripcionRoja,
                    ]}
                  >
                    {decision.mensaje}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Acción principal */}
        {puedeRegistrar && (
          <View style={styles.accionPanel}>
            <View style={styles.accionCabecera}>
              <View style={styles.accionIcono}>
                <Text style={styles.accionIconoTexto}>▤</Text>
              </View>
              <View style={styles.accionContenido}>
                <Text style={styles.accionTitulo}>
                  Siguiente paso
                </Text>
                <Text style={styles.accionDescripcion}>
                  Continúa al registro para indicar el estado del medidor.
                </Text>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={registrarLectura}
              style={({ pressed }) => [
                styles.botonRegistrar,
                pressed && styles.botonRegistrarPresionado,
              ]}
            >
              <Text style={styles.botonRegistrarTexto}>
                Registrar lectura
              </Text>
              <Text style={styles.botonRegistrarFlecha}>→</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.piePanel}>
          <View style={styles.pieIcono}>
            <Text style={styles.pieIconoTexto}>i</Text>
          </View>
          <Text style={styles.pieTexto}>
            La información mostrada depende de los datos disponibles en
            oficina o en la caché local.
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace('/inicio')}
          style={({ pressed }) => [
            styles.botonInicio,
            pressed && styles.presionado,
          ]}
        >
          <Text style={styles.botonInicioTexto}>Volver al inicio</Text>
        </Pressable>

        <Text style={styles.pieMarca}>LECTURA ÁGIL · EPMAPS</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: '#EAF4F8',
  },
  contenido: {
    paddingBottom: 36,
  },

  // Encabezado
  encabezado: {
    backgroundColor: '#062B52',
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  orbeUno: {
    position: 'absolute',
    top: -90,
    right: -70,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(34,178,224,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(179,239,255,0.2)',
  },
  orbeDos: {
    position: 'absolute',
    bottom: -110,
    left: -70,
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: 'rgba(0,207,190,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(179,239,255,0.16)',
  },
  botonVolver: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 22,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  flechaVolver: {
    color: '#FFFFFF',
    fontSize: 20,
  },
  textoVolver: {
    color: '#E0F6FF',
    fontSize: 12,
    fontWeight: '700',
  },
  marcaFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 24,
  },
  marcaIcono: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  gotaMarca: {
    color: '#8DEBFF',
    fontSize: 24,
    fontWeight: '700',
  },
  marcaTexto: {
    color: '#BDEBFA',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  kicker: {
    color: '#7EE6E8',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 8,
  },
  titulo: {
    ...typography.title,
    color: '#FFFFFF',
    fontSize: 29,
    lineHeight: 35,
  },
  tituloAcento: {
    color: '#65DCE5',
    fontSize: 30,
    lineHeight: 37,
    fontWeight: '800',
  },
  subtitulo: {
    ...typography.body,
    color: '#D5EAF7',
    fontSize: 12,
    lineHeight: 20,
    marginTop: 10,
  },
  codigoPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 22,
    padding: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  codigoIcono: {
    width: 43,
    height: 43,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(92,218,232,0.20)',
    borderWidth: 1,
    borderColor: 'rgba(141,235,255,0.42)',
  },
  codigoIconoTexto: {
    color: '#B5F6FF',
    fontSize: 30,
    fontWeight: '700',
  },
  codigoContenido: {
    flex: 1,
    minWidth: 0,
  },
  codigoEtiqueta: {
    color: '#A6D7EA',
    fontSize: 9,
    letterSpacing: 1,
    fontWeight: '700',
    marginBottom: 5,
  },
  codigoValor: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  codigoPunto: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#51E1AF',
  },

  // Sección y estados
  seccion: {
    marginHorizontal: 22,
    marginTop: 25,
    marginBottom: 13,
  },
  seccionTitulo: {
    color: '#103E66',
    fontSize: 19,
    fontWeight: '800',
  },
  seccionSubtitulo: {
    color: '#5A788D',
    fontSize: 12,
    marginTop: 4,
  },
  estadoPanel: {
    marginHorizontal: 16,
    alignItems: 'center',
    padding: 25,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  cargaIcono: {
    width: 58,
    height: 58,
    borderRadius: 21,
    backgroundColor: '#DDF4FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  estadoTitulo: {
    color: '#103E66',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  estadoDescripcion: {
    color: '#5A788D',
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 8,
  },
  errorPanel: {
    marginHorizontal: 16,
    padding: 18,
    borderRadius: 23,
    backgroundColor: '#FFF3F4',
    borderWidth: 1,
    borderColor: '#F5CDD4',
  },
  errorIcono: {
    width: 43,
    height: 43,
    borderRadius: 15,
    backgroundColor: '#FFE0E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  errorIconoTexto: {
    color: '#C7354F',
    fontSize: 25,
    fontWeight: '900',
  },
  errorTitulo: {
    color: '#A92D43',
    fontSize: 16,
    fontWeight: '800',
  },
  errorDescripcion: {
    color: '#963D4D',
    fontSize: 12,
    lineHeight: 19,
    marginTop: 7,
  },
  botonReintentar: {
    minHeight: 45,
    marginTop: 15,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#C7354F',
  },
  botonReintentarTexto: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  botonReintentarFlecha: {
    color: '#FFFFFF',
    fontSize: 19,
  },

  // Resultado del medidor
  resultadoContenedor: {
    marginHorizontal: 16,
  },
  resultadoEtiqueta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    alignSelf: 'flex-start',
    paddingHorizontal: 11,
    paddingVertical: 7,
    marginBottom: 10,
    borderRadius: 99,
    backgroundColor: '#D9F7E9',
    borderWidth: 1,
    borderColor: '#B5EBD3',
  },
  resultadoPunto: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#087F62',
  },
  resultadoEtiquetaTexto: {
    color: '#087F62',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  medidorCardContenedor: {
    borderRadius: 23,
    overflow: 'hidden',
  },
  decisionPanel: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 15,
    marginTop: 13,
    borderRadius: 20,
    borderWidth: 1,
  },
  decisionPermitida: {
    backgroundColor: 'rgba(217,247,233,0.88)',
    borderColor: '#B5EBD3',
  },
  decisionBloqueada: {
    backgroundColor: '#FFF0F2',
    borderColor: '#F5CDD4',
  },
  decisionIcono: {
    width: 36,
    height: 36,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  decisionIconoVerde: {
    backgroundColor: '#C1EED9',
  },
  decisionIconoRojo: {
    backgroundColor: '#FFDCE2',
  },
  decisionIconoTexto: {
    fontSize: 19,
    fontWeight: '900',
  },
  decisionTextoVerde: {
    color: '#087F62',
  },
  decisionTextoRojo: {
    color: '#C7354F',
  },
  decisionContenido: {
    flex: 1,
  },
  decisionTitulo: {
    color: '#16496D',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  decisionDescripcion: {
    color: '#286B56',
    fontSize: 12,
    lineHeight: 18,
  },
  decisionDescripcionRoja: {
    color: '#963D4D',
  },

  // Modo sin conexión
  offlinePanel: {
    marginHorizontal: 16,
    padding: 17,
    borderRadius: 23,
    backgroundColor: '#FFF8E8',
    borderWidth: 1,
    borderColor: '#F2DDAA',
  },
  offlineCabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  offlineIcono: {
    width: 43,
    height: 43,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFE8B5',
  },
  offlineIconoTexto: {
    color: '#A96500',
    fontSize: 26,
    fontWeight: '800',
  },
  offlineContenido: {
    flex: 1,
  },
  offlineTitulo: {
    color: '#80511A',
    fontSize: 15,
    fontWeight: '800',
  },
  offlineEtiqueta: {
    color: '#A96500',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.7,
    marginTop: 4,
  },
  offlineDescripcion: {
    color: '#805E32',
    fontSize: 12,
    lineHeight: 19,
    marginTop: 13,
  },

  // Acción de registro
  accionPanel: {
    marginHorizontal: 16,
    marginTop: 18,
    padding: 17,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    shadowColor: '#0A456A',
    shadowOpacity: 0.08,
    shadowRadius: 13,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  accionCabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  accionIcono: {
    width: 45,
    height: 45,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DDF4FA',
    borderWidth: 1,
    borderColor: '#BDE7F2',
  },
  accionIconoTexto: {
    color: '#0879B6',
    fontSize: 25,
    fontWeight: '800',
  },
  accionContenido: {
    flex: 1,
  },
  accionTitulo: {
    color: '#103E66',
    fontSize: 15,
    fontWeight: '800',
  },
  accionDescripcion: {
    color: '#5A788D',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },
  botonRegistrar: {
    minHeight: 53,
    paddingHorizontal: 16,
    borderRadius: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#087FC4',
    borderWidth: 1,
    borderColor: '#38B8DD',
    shadowColor: '#087FC4',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  botonRegistrarPresionado: {
    backgroundColor: '#075D92',
  },
  botonRegistrarTexto: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  botonRegistrarFlecha: {
    color: '#FFFFFF',
    fontSize: 21,
  },

  // Pie y navegación
  piePanel: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 18,
    padding: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(221,244,250,0.76)',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  pieIcono: {
    width: 25,
    height: 25,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  pieIconoTexto: {
    color: '#0879B6',
    fontSize: 14,
    fontWeight: '900',
  },
  pieTexto: {
    flex: 1,
    color: '#5A788D',
    fontSize: 11,
    lineHeight: 17,
  },
  botonInicio: {
    alignSelf: 'center',
    marginTop: 18,
    paddingHorizontal: 17,
    paddingVertical: 11,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: '#C5E0EB',
    backgroundColor: 'rgba(255,255,255,0.65)',
  },
  botonInicioTexto: {
    color: '#315F7B',
    fontSize: 12,
    fontWeight: '700',
  },
  presionado: {
    opacity: 0.8,
  },
  pieMarca: {
    color: '#7190A3',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.4,
    textAlign: 'center',
    marginTop: 20,
  },
});
