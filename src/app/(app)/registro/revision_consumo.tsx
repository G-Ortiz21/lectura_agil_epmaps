import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useConexion } from '../../../contexts/ConexionContext';
import { useRegistro } from '../../../contexts/RegistroContext';
import { calcularConsumo, esAnomalo } from '../../../domain/consumo';
import type { MedidorOficina } from '../../../domain/tipos';
import type { ResultadoConsultaMedidor } from '../../../services/medidoresService';
import { consultarMedidor } from '../../../services/medidoresService';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';

const COLORES = {
  fondo: '#EAF4F8',
  azulOscuro: '#062B52',
  azul: '#087FC4',
  azulPresionado: '#075D92',
  celeste: '#63D2F0',
  texto: '#17324D',
  secundario: '#617A90',
  blanco: '#FFFFFF',
  borde: '#D8E8F1',
  verde: '#087F62',
  verdeFondo: '#E6F6EF',
  naranja: '#A96500',
  naranjaFondo: '#FFF4DF',
  rojo: '#C7354F',
  rojoFondo: '#FCE9EC',
  sombra: '#123B5A',
};

export default function RevisionConsumoScreen() {
  const {
    registro,
    cargandoBorrador,
    actualizarDatos,
    definirPaso,
  } = useRegistro();

  const { enLinea } = useConexion();

  const [medidor, setMedidor] = useState<MedidorOficina | null>(null);
  const [errorConfirmacion, setErrorConfirmacion] = useState<string | null>(
    null,
  );

  const codigoMedidor = registro.codigoMedidor;
  const estado = registro.estadoMedidor;
  const datos = registro.datos;

  useEffect(() => {
    if (!cargandoBorrador) {
      definirPaso('revision_consumo');
    }
  }, [cargandoBorrador, definirPaso]);

  // Los datos de oficina vienen de la caché consultada el mismo día
  // o de la oficina.
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
        // Sin datos de oficina no se puede calcular; se informa abajo.
      });

    return () => {
      vigente = false;
    };
  }, [codigoMedidor, enLinea, cargandoBorrador]);

  if (cargandoBorrador) {
    return (
      <View style={styles.pantallaCarga}>
        <View style={styles.iconoCarga}>
          <Text style={styles.iconoCargaTexto}>03</Text>
        </View>
        <Text style={styles.tituloCarga}>Revisión del consumo</Text>
        <Text style={styles.descripcionCarga}>
          Recuperando el registro guardado…
        </Text>
      </View>
    );
  }

  if (codigoMedidor === null || estado === null) {
    return (
      <View style={styles.pantallaCarga}>
        <View style={styles.iconoCarga}>
          <Text style={styles.iconoCargaTexto}>!</Text>
        </View>
        <Text style={styles.tituloCarga}>Completa los pasos anteriores</Text>
        <Text style={styles.descripcionCarga}>
          Primero completa los datos de lectura del asistente.
        </Text>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/medidor')}
          style={({ pressed }) => [
            styles.botonPrincipal,
            pressed && styles.botonPresionado,
          ]}
        >
          <Text style={styles.textoBotonPrincipal}>Consultar medidor</Text>
        </Pressable>
      </View>
    );
  }

  const lecturaActual =
    datos.lectura === null ||
    datos.lectura === undefined ||
    datos.lectura === ''
      ? null
      : Number(datos.lectura);

  const lecturaAnterior =
    datos.lecturaAnterior ?? medidor?.ultimaLectura ?? null;

  const promedioMensual = medidor?.promedioMensual ?? null;
  const consumo = calcularConsumo(lecturaActual, lecturaAnterior);
  const anomalo = esAnomalo(consumo, promedioMensual);

  function avanzar(): void {
    if (anomalo === true && datos.confirmacionAnomalia !== true) {
      setErrorConfirmacion('Confirma que revisaste el consumo anómalo.');
      return;
    }

    setErrorConfirmacion(null);
    actualizarDatos({ consumoAnomalo: anomalo });
    definirPaso('fotografia');
    router.push('/registro/fotografia');
  }

  const contenidoSinLectura = lecturaActual === null;

  return (
    <View style={styles.pantalla}>
      <ScrollView
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.encabezado}>
          <View style={styles.orbeSuperior} />
          <View style={styles.orbeInferior} />

          <View style={styles.marca}>
            <View style={styles.marcaPunto} />
            <Text style={styles.marcaTexto}>LECTURA ÁGIL · EPMAPS</Text>
          </View>

          <Text style={styles.kicker}>PASO 3 DE 5 · CONSUMO</Text>

          <Text style={styles.titulo}>
            Revisión del{' '}
            <Text style={styles.tituloAcento}>consumo</Text>
          </Text>

          <Text style={styles.subtitulo}>
            Comprueba los valores calculados antes de continuar con el registro.
          </Text>

          <View style={styles.progreso}>
            {[1, 2, 3, 4, 5].map((paso) => (
              <View
                key={paso}
                style={[
                  styles.progresoSegmento,
                  paso <= 3 && styles.progresoActivo,
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.cuerpo}>
          <View style={styles.tarjetaMedidor}>
            <View style={styles.iconoMedidor}>
              <Text style={styles.iconoMedidorTexto}>M</Text>
            </View>

            <View style={styles.infoMedidor}>
              <Text style={styles.etiquetaPequena}>CÓDIGO DEL MEDIDOR</Text>
              <Text style={styles.codigoMedidor}>{codigoMedidor}</Text>
            </View>

            <View style={styles.pasoPildora}>
              <Text style={styles.pasoPildoraTexto}>Paso 3</Text>
            </View>
          </View>

          {contenidoSinLectura ? (
            <>
              <View style={styles.tarjetaSinLectura}>
                <View style={styles.iconoSinLectura}>
                  <Text style={styles.iconoSinLecturaTexto}>i</Text>
                </View>

                <Text style={styles.tituloTarjeta}>
                  No hay consumo que calcular
                </Text>

                <Text style={styles.textoSinLectura}>
                  Este registro no incluye una lectura numérica porque el
                  medidor está{' '}
                  {estado === 'inaccesible' ? 'inaccesible' : 'dañado'}.
                  No se calculará consumo ni anomalía.
                </Text>
              </View>

              <Pressable
                accessibilityRole="button"
                onPress={avanzar}
                style={({ pressed }) => [
                  styles.botonPrincipal,
                  pressed && styles.botonPresionado,
                ]}
              >
                <Text style={styles.textoBotonPrincipal}>
                  Siguiente: fotografía
                </Text>
                <Text style={styles.flechaBoton}>→</Text>
              </Pressable>
            </>
          ) : (
            <>
              <View style={styles.encabezadoSeccion}>
                <Text style={styles.tituloSeccion}>Resumen de lecturas</Text>
                <Text style={styles.descripcionSeccion}>
                  Valores utilizados para calcular el consumo.
                </Text>
              </View>

              <View style={styles.tarjetaLecturas}>
                <View style={styles.filaLectura}>
                  <View style={styles.datoLectura}>
                    <Text style={styles.etiqueta}>LECTURA ANTERIOR</Text>
                    <Text style={styles.valorLectura}>
                      {lecturaAnterior ?? 'Sin dato previo'}
                    </Text>
                  </View>
                  <View style={styles.miniIcono}>
                    <Text style={styles.miniIconoTexto}>01</Text>
                  </View>
                </View>

                <View style={styles.divisor} />

                <View style={styles.filaLectura}>
                  <View style={styles.datoLectura}>
                    <Text style={styles.etiqueta}>LECTURA ACTUAL</Text>
                    <Text style={styles.valorLectura}>{lecturaActual}</Text>
                  </View>
                  <View style={[styles.miniIcono, styles.miniIconoActual]}>
                    <Text style={styles.miniIconoActualTexto}>02</Text>
                  </View>
                </View>
              </View>

              <View style={styles.tarjetaConsumo} accessibilityRole="summary">
                <View style={styles.encabezadoConsumo}>
                  <View style={styles.puntoConsumo} />
                  <Text style={styles.etiquetaConsumo}>
                    CONSUMO CALCULADO
                  </Text>
                </View>

                <Text style={styles.valorConsumo}>
                  {consumo === null ? 'No calculable' : String(consumo)}
                </Text>

                <Text style={styles.unidadConsumo}>
                  {consumo === null
                    ? 'Falta una lectura anterior válida'
                    : 'Unidades de consumo'}
                </Text>

                <View style={styles.divisorConsumo} />

                <Text style={styles.notaConsumo}>
                  {consumo === null
                    ? 'Sin lectura anterior no se puede calcular el consumo. Al volver la conexión, la oficina permitirá verificarlo.'
                    : 'Lectura actual menos lectura anterior.'}
                </Text>
              </View>

              <View style={styles.tarjetaPromedio}>
                <View style={styles.iconoPromedio}>
                  <Text style={styles.iconoPromedioTexto}>↗</Text>
                </View>
                <View style={styles.infoPromedio}>
                  <Text style={styles.etiquetaPromedio}>
                    PROMEDIO MENSUAL DE REFERENCIA
                  </Text>
                  <Text style={styles.valorPromedio}>
                    {promedioMensual === null
                      ? 'No disponible'
                      : String(promedioMensual)}
                  </Text>
                </View>
              </View>

              {anomalo === true && (
                <View style={styles.tarjetaAnomalia} accessibilityRole="summary">
                  <View style={styles.filaAlerta}>
                    <View style={styles.iconoAlerta}>
                      <Text style={styles.iconoAlertaTexto}>!</Text>
                    </View>
                    <View style={styles.infoAlerta}>
                      <Text style={styles.tituloAlerta}>Consumo anómalo</Text>
                      <Text style={styles.textoAlerta}>
                        El consumo supera el triple del promedio mensual.
                        Revisa la lectura y confirma que la verificaste.
                        Este registro exigirá una fotografía.
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{
                      checked: datos.confirmacionAnomalia === true,
                    }}
                    onPress={() => {
                      actualizarDatos({
                        confirmacionAnomalia:
                          datos.confirmacionAnomalia !== true,
                      });
                      setErrorConfirmacion(null);
                    }}
                    style={[
                      styles.confirmacion,
                      datos.confirmacionAnomalia === true &&
                        styles.confirmacionMarcada,
                    ]}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        datos.confirmacionAnomalia === true &&
                          styles.checkboxMarcado,
                      ]}
                    >
                      {datos.confirmacionAnomalia === true && (
                        <Text style={styles.checkTexto}>✓</Text>
                      )}
                    </View>

                    <Text style={styles.confirmacionTexto}>
                      {datos.confirmacionAnomalia === true
                        ? 'Confirmado: revisé el consumo anómalo'
                        : 'Confirmar que revisé el consumo anómalo'}
                    </Text>
                  </Pressable>

                  {errorConfirmacion !== null && (
                    <Text accessibilityRole="alert" style={styles.error}>
                      {errorConfirmacion}
                    </Text>
                  )}
                </View>
              )}

              {anomalo === false && (
                <View style={styles.tarjetaNormal}>
                  <View style={styles.iconoNormal}>
                    <Text style={styles.iconoNormalTexto}>✓</Text>
                  </View>
                  <View style={styles.infoNormal}>
                    <Text style={styles.tituloNormal}>
                      Consumo dentro del rango esperado
                    </Text>
                    <Text style={styles.textoNormal}>
                      El consumo no supera el triple del promedio mensual.
                    </Text>
                  </View>
                </View>
              )}

              <Pressable
                accessibilityRole="button"
                onPress={avanzar}
                style={({ pressed }) => [
                  styles.botonPrincipal,
                  pressed && styles.botonPresionado,
                ]}
              >
                <Text style={styles.textoBotonPrincipal}>
                  Siguiente: fotografía
                </Text>
                <Text style={styles.flechaBoton}>→</Text>
              </Pressable>
            </>
          )}

          {!enLinea && (
            <View style={styles.estadoConexion}>
              <View style={styles.puntoSinConexion} />
              <Text style={styles.textoConexion}>
                Modo sin conexión
              </Text>
            </View>
          )}

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/registro/datos_lectura')}
            style={({ pressed }) => [
              styles.botonSecundario,
              pressed && styles.botonSecundarioPresionado,
            ]}
          >
            <Text style={styles.textoBotonSecundario}>
              ← Volver a los datos de lectura
            </Text>
          </Pressable>

          <Text style={styles.pie}>
            EPMAPS · Registro de lectura de medidores
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: COLORES.fondo,
  },
  contenido: {
    paddingBottom: spacing.xl,
  },
  encabezado: {
    backgroundColor: COLORES.azulOscuro,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 30,
  },
  orbeSuperior: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: 'rgba(34,178,224,0.13)',
    top: -105,
    right: -50,
  },
  orbeInferior: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(0,207,190,0.10)',
    bottom: -80,
    left: '42%',
  },
  marca: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 26,
  },
  marcaPunto: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORES.celeste,
  },
  marcaTexto: {
    ...typography.label,
    color: COLORES.blanco,
    letterSpacing: 1.2,
    fontSize: 11,
  },
  kicker: {
    ...typography.label,
    color: '#8EDCF5',
    fontSize: 11,
    letterSpacing: 1.4,
    marginBottom: 9,
  },
  titulo: {
    color: COLORES.blanco,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  tituloAcento: {
    color: COLORES.celeste,
  },
  subtitulo: {
    ...typography.body,
    color: '#D5EAF7',
    lineHeight: 22,
    marginTop: 10,
  },
  progreso: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 24,
  },
  progresoSegmento: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  progresoActivo: {
    backgroundColor: COLORES.celeste,
  },
  cuerpo: {
    paddingHorizontal: 20,
    paddingTop: 22,
  },
  tarjetaMedidor: {
    backgroundColor: COLORES.blanco,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORES.borde,
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: COLORES.sombra,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  iconoMedidor: {
    width: 45,
    height: 45,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5F5FC',
  },
  iconoMedidorTexto: {
    color: COLORES.azul,
    fontSize: 21,
    fontWeight: '800',
  },
  infoMedidor: {
    flex: 1,
  },
  etiquetaPequena: {
    ...typography.label,
    color: COLORES.secundario,
    fontSize: 10,
    letterSpacing: 0.7,
  },
  codigoMedidor: {
    color: COLORES.azulOscuro,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 4,
  },
  pasoPildora: {
    backgroundColor: '#E5F5FC',
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  pasoPildoraTexto: {
    color: COLORES.azul,
    fontSize: 11,
    fontWeight: '800',
  },
  encabezadoSeccion: {
    marginTop: 25,
    marginBottom: 14,
  },
  tituloSeccion: {
    color: COLORES.azulOscuro,
    fontSize: 19,
    fontWeight: '800',
  },
  descripcionSeccion: {
    ...typography.body,
    color: COLORES.secundario,
    lineHeight: 21,
    marginTop: 5,
  },
  tarjetaLecturas: {
    backgroundColor: COLORES.blanco,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORES.borde,
    paddingHorizontal: 18,
    paddingVertical: 6,
  },
  filaLectura: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    gap: 12,
  },
  datoLectura: {
    flex: 1,
    gap: 7,
  },
  etiqueta: {
    ...typography.label,
    color: COLORES.secundario,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  valorLectura: {
    color: COLORES.azulOscuro,
    fontSize: 21,
    fontWeight: '800',
  },
  miniIcono: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: '#EDF3F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniIconoTexto: {
    color: COLORES.secundario,
    fontSize: 12,
    fontWeight: '800',
  },
  miniIconoActual: {
    backgroundColor: '#E2F5FC',
  },
  miniIconoActualTexto: {
    color: COLORES.azul,
    fontSize: 12,
    fontWeight: '800',
  },
  divisor: {
    height: 1,
    backgroundColor: '#E8F0F5',
  },
  tarjetaConsumo: {
    backgroundColor: COLORES.azulOscuro,
    borderRadius: 24,
    padding: 22,
    marginTop: 17,
    overflow: 'hidden',
  },
  encabezadoConsumo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  puntoConsumo: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORES.celeste,
  },
  etiquetaConsumo: {
    ...typography.label,
    color: '#B8D9EB',
    fontSize: 11,
    letterSpacing: 1,
  },
  valorConsumo: {
    color: COLORES.blanco,
    fontSize: 38,
    fontWeight: '900',
    marginTop: 15,
  },
  unidadConsumo: {
    color: '#9CC9E1',
    fontSize: 12,
    marginTop: 4,
  },
  divisorConsumo: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.17)',
    marginVertical: 16,
  },
  notaConsumo: {
    ...typography.body,
    color: '#D5EAF7',
    lineHeight: 21,
  },
  tarjetaPromedio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    backgroundColor: COLORES.blanco,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORES.borde,
    padding: 16,
    marginTop: 15,
  },
  iconoPromedio: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#E5F5FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconoPromedioTexto: {
    color: COLORES.azul,
    fontSize: 22,
    fontWeight: '800',
  },
  infoPromedio: {
    flex: 1,
    gap: 5,
  },
  etiquetaPromedio: {
    ...typography.label,
    color: COLORES.secundario,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  valorPromedio: {
    color: COLORES.azulOscuro,
    fontSize: 18,
    fontWeight: '800',
  },
  tarjetaAnomalia: {
    backgroundColor: COLORES.blanco,
    borderColor: '#F0D7A7',
    borderWidth: 1,
    borderRadius: 22,
    padding: 17,
    marginTop: 17,
    gap: 16,
  },
  filaAlerta: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconoAlerta: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORES.naranjaFondo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconoAlertaTexto: {
    color: COLORES.naranja,
    fontSize: 20,
    fontWeight: '900',
  },
  infoAlerta: {
    flex: 1,
    gap: 6,
  },
  tituloAlerta: {
    color: COLORES.naranja,
    fontSize: 16,
    fontWeight: '800',
  },
  textoAlerta: {
    ...typography.body,
    color: COLORES.texto,
    lineHeight: 21,
  },
  confirmacion: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 13,
    paddingVertical: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORES.borde,
    backgroundColor: '#F7FAFC',
  },
  confirmacionMarcada: {
    borderColor: COLORES.verde,
    backgroundColor: COLORES.verdeFondo,
  },
  checkbox: {
    width: 23,
    height: 23,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#9CB2C2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxMarcado: {
    backgroundColor: COLORES.verde,
    borderColor: COLORES.verde,
  },
  checkTexto: {
    color: COLORES.blanco,
    fontSize: 15,
    fontWeight: '900',
  },
  confirmacionTexto: {
    flex: 1,
    color: COLORES.texto,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  error: {
    ...typography.body,
    color: COLORES.rojo,
    lineHeight: 20,
  },
  tarjetaNormal: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    marginTop: 17,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#B9E5D3',
    backgroundColor: COLORES.verdeFondo,
  },
  iconoNormal: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: '#C9EFDF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconoNormalTexto: {
    color: COLORES.verde,
    fontSize: 18,
    fontWeight: '900',
  },
  infoNormal: {
    flex: 1,
    gap: 5,
  },
  tituloNormal: {
    color: COLORES.verde,
    fontSize: 14,
    fontWeight: '800',
  },
  textoNormal: {
    ...typography.body,
    color: '#285D4D',
    lineHeight: 20,
  },
  tarjetaSinLectura: {
    alignItems: 'center',
    backgroundColor: COLORES.blanco,
    borderWidth: 1,
    borderColor: COLORES.borde,
    borderRadius: 23,
    padding: 23,
    marginTop: 20,
  },
  iconoSinLectura: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#E5F5FC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  iconoSinLecturaTexto: {
    color: COLORES.azul,
    fontSize: 25,
    fontWeight: '900',
  },
  tituloTarjeta: {
    color: COLORES.azulOscuro,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  textoSinLectura: {
    ...typography.body,
    color: COLORES.secundario,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 9,
  },
  botonPrincipal: {
    minHeight: 54,
    marginTop: 23,
    paddingHorizontal: 18,
    borderRadius: 17,
    backgroundColor: COLORES.azul,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: COLORES.azulOscuro,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  botonPresionado: {
    backgroundColor: COLORES.azulPresionado,
  },
  textoBotonPrincipal: {
    ...typography.label,
    color: COLORES.blanco,
    textAlign: 'center',
    flexShrink: 1,
    fontSize: 14,
  },
  flechaBoton: {
    color: COLORES.blanco,
    fontSize: 20,
    fontWeight: '700',
  },
  estadoConexion: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    marginTop: 15,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORES.naranjaFondo,
  },
  puntoSinConexion: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORES.naranja,
  },
  textoConexion: {
    color: COLORES.naranja,
    fontSize: 12,
    fontWeight: '700',
  },
  botonSecundario: {
    minHeight: 48,
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#C9DFEB',
    backgroundColor: 'rgba(255,255,255,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  botonSecundarioPresionado: {
    backgroundColor: '#DCEEF6',
  },
  textoBotonSecundario: {
    color: COLORES.azulOscuro,
    fontSize: 13,
    fontWeight: '700',
  },
  pie: {
    ...typography.caption,
    color: '#7890A3',
    textAlign: 'center',
    marginTop: 23,
    marginBottom: 8,
  },
  pantallaCarga: {
    flex: 1,
    backgroundColor: COLORES.fondo,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  iconoCarga: {
    width: 62,
    height: 62,
    borderRadius: 21,
    backgroundColor: COLORES.azulOscuro,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  iconoCargaTexto: {
    color: COLORES.celeste,
    fontSize: 22,
    fontWeight: '900',
  },
  tituloCarga: {
    color: COLORES.azulOscuro,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  descripcionCarga: {
    ...typography.body,
    color: COLORES.secundario,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 20,
  },
});

