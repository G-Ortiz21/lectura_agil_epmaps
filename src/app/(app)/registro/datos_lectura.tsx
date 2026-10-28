import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Campo } from '../../../components/Campo';
import { mensajeErrorMedidor } from '../../../components/medidoresUi';
import { useConexion } from '../../../contexts/ConexionContext';
import { useRegistro } from '../../../contexts/RegistroContext';
import type { ErroresRegistro } from '../../../domain/tipos';
import { validarRegistro } from '../../../domain/validaciones';
import type { ResultadoConsultaMedidor } from '../../../services/medidoresService';
import { consultarMedidor } from '../../../services/medidoresService';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';

/** Errores que corresponden a los campos de este paso (R5). */
const CAMPOS_PASO: readonly (keyof ErroresRegistro)[] = [
  'lectura',
  'lecturaAnterior',
  'motivo',
  'descripcion',
];

const COLORES = {
  fondo: '#EAF4F8',
  azulOscuro: '#062B52',
  azul: '#087FC4',
  azulPresionado: '#075D92',
  celeste: '#22B2E0',
  texto: '#17324D',
  secundario: '#617A90',
  blanco: '#FFFFFF',
  borde: '#D8E8F1',
  verde: '#087F62',
  verdeFondo: '#E6F6EF',
  naranja: '#A96500',
  naranjaFondo: '#FFF4DF',
  sombra: '#123B5A',
};

export default function DatosLecturaScreen() {
  const {
    registro,
    cargandoBorrador,
    actualizarDatos,
    definirPaso,
  } = useRegistro();

  const { enLinea } = useConexion();

  const [errores, setErrores] = useState<
    Partial<Record<'lectura' | 'motivo' | 'descripcion', string>>
  >({});

  const [consultaMedidor, setConsultaMedidor] =
    useState<ResultadoConsultaMedidor | null>(null);

  const codigoMedidor = registro.codigoMedidor;
  const estado = registro.estadoMedidor;
  const datos = registro.datos;

  // El paso actual se guarda en el borrador (ADR-004).
  useEffect(() => {
    if (!cargandoBorrador) {
      definirPaso('datos_lectura');
    }
  }, [cargandoBorrador, definirPaso]);

  // La lectura anterior de la oficina sirve de referencia y para comparar.
  useEffect(() => {
    let vigente = true;

    if (codigoMedidor === null || cargandoBorrador) {
      return () => {
        vigente = false;
      };
    }

    void consultarMedidor(codigoMedidor, enLinea)
      .then((resultado) => {
        if (!vigente) {
          return;
        }

        setConsultaMedidor(resultado);

        if (
          resultado.estado === 'encontrado' &&
          resultado.medidor.ultimaLectura !== null &&
          datos.lecturaAnterior === null
        ) {
          actualizarDatos({
            lecturaAnterior: resultado.medidor.ultimaLectura,
          });
        }
      })
      .catch((consultaError: unknown) => {
        if (vigente) {
          // Sin datos de oficina la comparación queda pendiente (ADR-014).
          console.warn(mensajeErrorMedidor(consultaError));
        }
      });

    return () => {
      vigente = false;
    };

    // datos.lecturaAnterior se omite a propósito: solo se rellena una vez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codigoMedidor, enLinea, cargandoBorrador]);

  function avanzar(): void {
    if (estado === null) {
      return;
    }

    const resultadoValidacion = validarRegistro(estado, datos);
    const erroresPaso: typeof errores = {};

    for (const campo of CAMPOS_PASO) {
      const mensaje = resultadoValidacion[campo];

      if (
        mensaje !== undefined &&
        (campo === 'lectura' ||
          campo === 'motivo' ||
          campo === 'descripcion')
      ) {
        erroresPaso[campo] = mensaje;
      }
    }

    setErrores(erroresPaso);

    if (Object.keys(erroresPaso).length > 0) {
      return;
    }

    // La lectura cambia: la confirmación y la anomalía se recalculan
    // en el siguiente paso.
    actualizarDatos({
      consumoAnomalo: null,
      confirmacionAnomalia: false,
    });

    definirPaso('revision_consumo');
    router.push('/registro/revision_consumo');
  }

  const lecturaAnterior =
    datos.lecturaAnterior !== null &&
    datos.lecturaAnterior !== undefined
      ? String(datos.lecturaAnterior)
      : consultaMedidor?.estado === 'encontrado'
        ? consultaMedidor.medidor.ultimaLectura === null
          ? 'Sin dato previo'
          : String(consultaMedidor.medidor.ultimaLectura)
        : 'Sin dato previo';

  const nombreEstado =
    estado === 'normal'
      ? 'Normal'
      : estado === 'inaccesible'
        ? 'Inaccesible'
        : 'Dañado';

  if (cargandoBorrador) {
    return (
      <View style={styles.pantallaCarga}>
        <View style={styles.cargaIcono}>
          <Text style={styles.cargaIconoTexto}>02</Text>
        </View>
        <Text style={styles.cargaTitulo}>Datos de lectura</Text>
        <Text style={styles.cargaDescripcion}>
          Recuperando el registro guardado…
        </Text>
      </View>
    );
  }

  if (codigoMedidor === null || estado === null) {
    return (
      <View style={styles.pantallaCarga}>
        <View style={styles.cargaIcono}>
          <Text style={styles.cargaIconoTexto}>!</Text>
        </View>
        <Text style={styles.cargaTitulo}>Falta información previa</Text>
        <Text style={styles.cargaDescripcion}>
          Primero consulta un medidor e indica su estado desde el asistente.
        </Text>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/medidor')}
          style={({ pressed }) => [
            styles.botonPrincipal,
            pressed && styles.botonPresionado,
          ]}
        >
          <Text style={styles.botonPrincipalTexto}>
            Consultar medidor
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.pantalla}>
      <ScrollView
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
      >
        {/* Encabezado visual */}
        <View style={styles.encabezado}>
          <View style={styles.orbeSuperior} />
          <View style={styles.orbeInferior} />

          <View style={styles.marca}>
            <View style={styles.marcaPunto} />
            <Text style={styles.marcaTexto}>
              LECTURA ÁGIL · EPMAPS
            </Text>
          </View>

          <Text style={styles.kicker}>PASO 2 DE 5 · LECTURA</Text>

          <Text style={styles.titulo}>
            Datos de{' '}
            <Text style={styles.tituloAcento}>lectura</Text>
          </Text>

          <Text style={styles.subtitulo}>
            Registra lo observado en el medidor según su estado.
          </Text>

          <View style={styles.progresoFila}>
            {[1, 2, 3, 4, 5].map((paso) => (
              <View
                key={paso}
                style={[
                  styles.progresoSegmento,
                  paso <= 2 && styles.progresoActivo,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Contenido del formulario */}
        <View style={styles.cuerpo}>
          <View style={styles.tarjetaMedidor}>
            <View style={styles.medidorIcono}>
              <Text style={styles.medidorIconoTexto}>M</Text>
            </View>

            <View style={styles.medidorInfo}>
              <Text style={styles.etiquetaPequena}>
                CÓDIGO DEL MEDIDOR
              </Text>
              <Text style={styles.codigoMedidor}>
                {codigoMedidor}
              </Text>
            </View>

            <View
              style={[
                styles.estadoPildora,
                estado === 'normal'
                  ? styles.estadoNormal
                  : estado === 'inaccesible'
                    ? styles.estadoInaccesible
                    : styles.estadoDanado,
              ]}
            >
              <Text
                style={[
                  styles.estadoPildoraTexto,
                  estado === 'normal'
                    ? styles.estadoNormalTexto
                    : estado === 'inaccesible'
                      ? styles.estadoInaccesibleTexto
                      : styles.estadoDanadoTexto,
                ]}
              >
                {nombreEstado}
              </Text>
            </View>
          </View>

          <View style={styles.seccionEncabezado}>
            <Text style={styles.seccionTitulo}>
              Información del registro
            </Text>
            <Text style={styles.seccionDescripcion}>
              Completa los campos correspondientes al estado registrado.
            </Text>
          </View>

          <View style={styles.tarjetaFormulario}>
            {estado === 'inaccesible' ? (
              <>
                <View style={styles.avisoSeccion}>
                  <Text style={styles.avisoIcono}>i</Text>
                  <Text style={styles.avisoTexto}>
                    Un medidor inaccesible no admite lectura. Indica el
                    motivo por el que no se pudo leer.
                  </Text>
                </View>

                <Campo
                  etiqueta="MOTIVO DE LA INACCESIBILIDAD"
                  error={errores.motivo ?? null}
                  multiline
                  maxLength={300}
                  onChangeText={(texto) =>
                    actualizarDatos({ motivo: texto })
                  }
                  placeholder="Ej: medidor bajo tierra con agua acumulada"
                  valor={datos.motivo ?? ''}
                />
              </>
            ) : (
              <>
                {estado === 'danado' && (
                  <View style={styles.avisoSeccion}>
                    <Text style={styles.avisoIcono}>!</Text>
                    <Text style={styles.avisoTexto}>
                      Describe el daño observado. La lectura es opcional.
                    </Text>
                  </View>
                )}

                {estado === 'normal' && (
                  <Text style={styles.textoAyuda}>
                    Ingresa la lectura numérica que muestra el medidor.
                  </Text>
                )}

                <Campo
                  etiqueta="LECTURA ACTUAL"
                  ayuda={`Lectura anterior de referencia: ${lecturaAnterior}`}
                  error={errores.lectura ?? null}
                  keyboardType="numeric"
                  maxLength={9}
                  onChangeText={(texto) =>
                    actualizarDatos({ lectura: texto })
                  }
                  placeholder="Ej: 1254"
                  valor={
                    typeof datos.lectura === 'number'
                      ? String(datos.lectura)
                      : datos.lectura ?? ''
                  }
                />

                {estado === 'danado' && (
                  <Campo
                    etiqueta="DESCRIPCIÓN DEL DAÑO"
                    error={errores.descripcion ?? null}
                    multiline
                    maxLength={300}
                    onChangeText={(texto) =>
                      actualizarDatos({ descripcion: texto })
                    }
                    placeholder="Ej: tapa rota y vidrio fracturado"
                    valor={datos.descripcion ?? ''}
                  />
                )}
              </>
            )}
          </View>

          {consultaMedidor?.estado === 'sin_cache_sin_conexion' && (
            <View style={styles.avisoConexion}>
              <Text style={styles.avisoConexionIcono}>!</Text>
              <View style={styles.avisoConexionContenido}>
                <Text style={styles.avisoConexionTitulo}>
                  Verificación pendiente
                </Text>
                <Text style={styles.avisoConexionTexto}>
                  Sin datos de oficina: la lectura quedará pendiente de
                  verificar.
                </Text>
              </View>
            </View>
          )}

          {!enLinea && (
            <View style={styles.estadoConexion}>
              <View style={styles.conexionPunto} />
              <Text style={styles.estadoConexionTexto}>
                Modo sin conexión
              </Text>
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
            <Text style={styles.botonPrincipalTexto}>
              Siguiente: revisión del consumo
            </Text>
            <Text style={styles.flechaBoton}>→</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/registro/estado_medidor')}
            style={({ pressed }) => [
              styles.botonSecundario,
              pressed && styles.botonSecundarioPresionado,
            ]}
          >
            <Text style={styles.botonSecundarioTexto}>
              ← Volver al estado del medidor
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
    fontSize: 31,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  tituloAcento: {
    color: '#63D2F0',
  },
  subtitulo: {
    ...typography.body,
    color: '#D5EAF7',
    lineHeight: 22,
    marginTop: 10,
    maxWidth: 320,
  },
  progresoFila: {
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
    backgroundColor: '#63D2F0',
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
  medidorIcono: {
    width: 45,
    height: 45,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5F5FC',
  },
  medidorIconoTexto: {
    color: COLORES.azul,
    fontSize: 21,
    fontWeight: '800',
  },
  medidorInfo: {
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
  estadoPildora: {
    borderRadius: 30,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  estadoNormal: {
    backgroundColor: COLORES.verdeFondo,
  },
  estadoInaccesible: {
    backgroundColor: COLORES.naranjaFondo,
  },
  estadoDanado: {
    backgroundColor: '#FCE9EC',
  },
  estadoPildoraTexto: {
    fontSize: 11,
    fontWeight: '800',
  },
  estadoNormalTexto: {
    color: COLORES.verde,
  },
  estadoInaccesibleTexto: {
    color: COLORES.naranja,
  },
  estadoDanadoTexto: {
    color: '#C7354F',
  },
  seccionEncabezado: {
    marginTop: 25,
    marginBottom: 14,
  },
  seccionTitulo: {
    color: COLORES.azulOscuro,
    fontSize: 19,
    fontWeight: '800',
  },
  seccionDescripcion: {
    ...typography.body,
    color: COLORES.secundario,
    lineHeight: 21,
    marginTop: 5,
  },
  tarjetaFormulario: {
    backgroundColor: COLORES.blanco,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORES.borde,
    padding: 18,
    gap: 14,
    shadowColor: COLORES.sombra,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1,
  },
  avisoSeccion: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 13,
    borderRadius: 15,
    backgroundColor: '#EDF7FC',
    borderWidth: 1,
    borderColor: '#D6ECF7',
  },
  avisoIcono: {
    width: 22,
    height: 22,
    borderRadius: 11,
    overflow: 'hidden',
    textAlign: 'center',
    textAlignVertical: 'center',
    color: COLORES.azul,
    backgroundColor: '#D7EFFA',
    fontSize: 13,
    fontWeight: '800',
  },
  avisoTexto: {
    ...typography.body,
    flex: 1,
    color: COLORES.texto,
    lineHeight: 21,
  },
  textoAyuda: {
    ...typography.body,
    color: COLORES.secundario,
    lineHeight: 21,
  },
  avisoConexion: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 16,
    padding: 15,
    borderRadius: 18,
    backgroundColor: COLORES.naranjaFondo,
    borderWidth: 1,
    borderColor: '#F0D7A7',
  },
  avisoConexionIcono: {
    width: 25,
    height: 25,
    borderRadius: 13,
    textAlign: 'center',
    textAlignVertical: 'center',
    overflow: 'hidden',
    color: COLORES.naranja,
    backgroundColor: '#FFE7B5',
    fontWeight: '900',
  },
  avisoConexionContenido: {
    flex: 1,
    gap: 4,
  },
  avisoConexionTitulo: {
    color: '#805000',
    fontSize: 14,
    fontWeight: '800',
  },
  avisoConexionTexto: {
    ...typography.body,
    color: '#805000',
    lineHeight: 20,
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
    backgroundColor: '#FFF4DF',
  },
  conexionPunto: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORES.naranja,
  },
  estadoConexionTexto: {
    color: COLORES.naranja,
    fontSize: 12,
    fontWeight: '700',
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
  botonPrincipalTexto: {
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
  botonSecundario: {
    minHeight: 48,
    marginTop: 10,
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
  botonSecundarioTexto: {
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
  cargaIcono: {
    width: 62,
    height: 62,
    borderRadius: 21,
    backgroundColor: COLORES.azulOscuro,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  cargaIconoTexto: {
    color: '#63D2F0',
    fontSize: 22,
    fontWeight: '900',
  },
  cargaTitulo: {
    color: COLORES.azulOscuro,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  cargaDescripcion: {
    ...typography.body,
    color: COLORES.secundario,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 20,
  },
});