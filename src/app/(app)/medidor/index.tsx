
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';

import { mensajeErrorMedidor } from '../../../components/medidoresUi';
import { useConexion } from '../../../contexts/ConexionContext';
import { validarCodigoMedidor } from '../../../domain/validaciones';
import { consultarMedidor } from '../../../services/medidoresService';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';

export default function MedidorSearchScreen() {
  const { enLinea } = useConexion();

  const [codigo, setCodigo] = useState('');
  const [errorCampo, setErrorCampo] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [sinCacheOffline, setSinCacheOffline] = useState(false);
  const [consultando, setConsultando] = useState(false);

  async function buscar(): Promise<void> {
    const codigoNormalizado = codigo.trim().toUpperCase();
    const errorValidacion = validarCodigoMedidor(codigoNormalizado);

    setErrorCampo(errorValidacion);
    setMensaje(null);
    setSinCacheOffline(false);

    if (errorValidacion !== null) return;

    setConsultando(true);

    try {
      const resultado = await consultarMedidor(codigoNormalizado, enLinea);

      if (resultado.estado === 'sin_cache_sin_conexion') {
        setSinCacheOffline(true);
        return;
      }

      router.push({
        pathname: '/medidor/[codigo]',
        params: { codigo: resultado.medidor.codigo },
      });
    } catch (consultaError: unknown) {
      setMensaje(mensajeErrorMedidor(consultaError));
    } finally {
      setConsultando(false);
    }
  }

  function cambiarCodigo(value: string) {
    const nuevoCodigo = value.toUpperCase();

    setCodigo(nuevoCodigo);
    setErrorCampo(
      nuevoCodigo.length > 0 ? validarCodigoMedidor(nuevoCodigo) : null,
    );
    setMensaje(null);
    setSinCacheOffline(false);
  }

  return (
    <View style={styles.pantalla}>
      <ScrollView
        contentContainerStyle={styles.contenido}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Encabezado */}
        <View style={styles.encabezado}>
          <View pointerEvents="none" style={styles.orbeUno} />
          <View pointerEvents="none" style={styles.orbeDos} />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver al inicio"
            onPress={() => router.replace('/inicio')}
            style={({ pressed }) => [
              styles.botonVolver,
              pressed && styles.presionado,
            ]}
          >
            <Text style={styles.flechaVolver}>←</Text>
            <Text style={styles.textoVolver}>Inicio</Text>
          </Pressable>

          <View style={styles.marcaFila}>
            <View style={styles.marcaIcono}>
              <Text style={styles.gotaMarca}>◇</Text>
            </View>
            <Text style={styles.marcaTexto}>LECTURA ÁGIL · EPMAPS</Text>
          </View>

          <View style={styles.tituloFila}>
            <View style={styles.tituloContenido}>
              <Text style={styles.kicker}>GESTIÓN DE SUMINISTROS</Text>
              <Text style={styles.titulo}>Consulta de</Text>
              <Text style={styles.tituloAcento}>medidor.</Text>
            </View>

            <View style={styles.iconoAgua}>
              <Text style={styles.iconoAguaTexto}>◇</Text>
            </View>
          </View>

          <Text style={styles.subtitulo}>
            Identifica el suministro para consultar su información y continuar
            con el proceso de lectura.
          </Text>

          <View style={styles.estadoConexion}>
            <View
              style={[
                styles.puntoConexion,
                enLinea ? styles.puntoDisponible : styles.puntoDesconectado,
              ]}
            />
            <Text style={styles.estadoConexionTexto}>
              {enLinea
                ? 'Conectividad de red disponible'
                : 'Modo sin conexión'}
            </Text>
          </View>
        </View>

        {/* Formulario de búsqueda */}
        <View style={styles.formulario}>
          <View style={styles.formularioEncabezado}>
            <View style={styles.numeroPaso}>
              <Text style={styles.numeroPasoTexto}>01</Text>
            </View>
            <View style={styles.formularioTituloContenido}>
              <Text style={styles.formularioTitulo}>Identificar medidor</Text>
              <Text style={styles.formularioSubtitulo}>
                Ingresa el código del suministro.
              </Text>
            </View>
          </View>

          <Text style={styles.label}>CÓDIGO DEL MEDIDOR</Text>

          <View
            style={[
              styles.campo,
              errorCampo !== null && styles.campoError,
            ]}
          >
            <View style={styles.iconoCampo}>
              <Text style={styles.iconoCampoTexto}>⌕</Text>
            </View>

            <TextInput
              accessibilityLabel="Código del medidor"
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={10}
              onChangeText={cambiarCodigo}
              onSubmitEditing={() => void buscar()}
              placeholder="MED-123456"
              placeholderTextColor="#7993A5"
              returnKeyType="search"
              style={styles.input}
              value={codigo}
              editable={!consultando}
            />

            {codigo.length > 0 && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Borrar código"
                disabled={consultando}
                onPress={() => cambiarCodigo('')}
                style={styles.borrarCodigo}
              >
                <Text style={styles.borrarCodigoTexto}>×</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.ayudaFila}>
            <Text style={styles.ayudaIcono}>i</Text>
            <Text style={styles.ayudaTexto}>
              Formato esperado: MED- seguido de seis dígitos.
            </Text>
          </View>

          {errorCampo !== null && (
            <View style={styles.mensajeError}>
              <Text style={styles.mensajeErrorIcono}>!</Text>
              <Text style={styles.mensajeErrorTexto}>{errorCampo}</Text>
            </View>
          )}

          <Pressable
            accessibilityRole="button"
            disabled={consultando}
            onPress={() => void buscar()}
            style={({ pressed }) => [
              styles.botonBuscar,
              pressed && styles.botonBuscarPresionado,
              consultando && styles.botonDesactivado,
            ]}
          >
            {consultando ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.botonBuscarIcono}>⌕</Text>
            )}

            <Text style={styles.botonBuscarTexto}>
              {consultando ? 'Consultando medidor…' : 'Consultar medidor'}
            </Text>

            {!consultando && (
              <Text style={styles.botonBuscarFlecha}>→</Text>
            )}
          </Pressable>

          {mensaje !== null && (
            <View
              accessibilityRole="alert"
              style={styles.mensajeError}
            >
              <Text style={styles.mensajeErrorIcono}>!</Text>
              <Text style={styles.mensajeErrorTexto}>{mensaje}</Text>
            </View>
          )}

          {sinCacheOffline && (
            <View style={styles.offlinePanel} accessibilityRole="summary">
              <View style={styles.offlineCabecera}>
                <View style={styles.offlineIcono}>
                  <Text style={styles.offlineIconoTexto}>⌁</Text>
                </View>
                <View style={styles.offlineTituloContenido}>
                  <Text style={styles.offlineTitulo}>
                    Sin datos disponibles
                  </Text>
                  <Text style={styles.offlineEtiqueta}>
                    CONSULTA LOCAL NO DISPONIBLE
                  </Text>
                </View>
              </View>

              <Text style={styles.offlineDescripcion}>
                No hay conexión disponible ni información guardada para este
                medidor. Puedes continuar indicando su estado, pero la lectura
                quedará pendiente de verificación según el flujo de registro.
              </Text>

              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  router.push({
                    pathname: '/registro/estado_medidor',
                    params: { codigo: codigo.trim().toUpperCase() },
                  })
                }
                style={({ pressed }) => [
                  styles.botonContinuar,
                  pressed && styles.presionado,
                ]}
              >
                <Text style={styles.botonContinuarTexto}>
                  Continuar sin datos de oficina
                </Text>
                <Text style={styles.botonContinuarFlecha}>→</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Orientación para el técnico */}
        <View style={styles.pistaPanel}>
          <View style={styles.pistaIcono}>
            <Text style={styles.pistaIconoTexto}>✓</Text>
          </View>
          <View style={styles.pistaContenido}>
            <Text style={styles.pistaTitulo}>Antes de continuar</Text>
            <Text style={styles.pistaTexto}>
              Comprueba que el código corresponda al medidor que estás
              inspeccionando.
            </Text>
          </View>
        </View>

        <Text style={styles.pie}>LECTURA ÁGIL · EPMAPS</Text>
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
    paddingBottom: spacing.xl * 2,
  },

  // Encabezado azul con transparencias
  encabezado: {
    backgroundColor: '#062B52',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl * 1.5,
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
    bottom: -100,
    left: -70,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(0,207,190,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(179,239,255,0.16)',
  },
  botonVolver: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginBottom: spacing.lg,
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
    gap: spacing.sm,
    marginBottom: spacing.lg,
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
    ...typography.label,
    color: '#BDEBFA',
    fontSize: 10,
    letterSpacing: 1,
  },
  tituloFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tituloContenido: {
    flex: 1,
  },
  kicker: {
    color: '#7EE6E8',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: spacing.sm,
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
    lineHeight: 36,
    fontWeight: '800',
  },
  iconoAgua: {
    width: 72,
    height: 82,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(180,240,255,0.35)',
  },
  iconoAguaTexto: {
    color: '#9BEFFF',
    fontSize: 55,
    fontWeight: '300',
  },
  subtitulo: {
    ...typography.body,
    color: '#D5EAF7',
    fontSize: 12,
    lineHeight: 20,
    marginTop: spacing.md,
  },
  estadoConexion: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.17)',
  },
  puntoConexion: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  puntoDisponible: {
    backgroundColor: '#51E1AF',
  },
  puntoDesconectado: {
    backgroundColor: '#FFC45C',
  },
  estadoConexionTexto: {
    color: '#E0F6FF',
    fontSize: 11,
    fontWeight: '600',
  },

  // Formulario principal
  formulario: {
    marginHorizontal: spacing.md,
    marginTop: -spacing.md,
    padding: spacing.lg,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.84)',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    shadowColor: '#0A456A',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  formularioEncabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  numeroPaso: {
    width: 43,
    height: 43,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DDF4FA',
    borderWidth: 1,
    borderColor: '#BDE7F2',
  },
  numeroPasoTexto: {
    color: '#0879B6',
    fontSize: 14,
    fontWeight: '900',
  },
  formularioTituloContenido: {
    flex: 1,
  },
  formularioTitulo: {
    color: '#103E66',
    fontSize: 17,
    fontWeight: '800',
  },
  formularioSubtitulo: {
    color: '#648196',
    fontSize: 11,
    marginTop: 4,
  },
  label: {
    ...typography.label,
    color: '#315B76',
    fontSize: 10,
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  campo: {
    minHeight: 57,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 18,
    backgroundColor: '#F6FBFD',
    borderWidth: 1,
    borderColor: '#C7E2ED',
  },
  campoError: {
    borderColor: '#D94B61',
    backgroundColor: '#FFF8F8',
  },
  iconoCampo: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DDF4FA',
  },
  iconoCampoTexto: {
    color: '#0879B6',
    fontSize: 28,
    lineHeight: 31,
  },
  input: {
    flex: 1,
    minWidth: 0,
    color: '#103E66',
    fontSize: 16,
    fontWeight: '700',
    paddingVertical: spacing.sm,
  },
  borrarCodigo: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E2EFF5',
  },
  borrarCodigoTexto: {
    color: '#315B76',
    fontSize: 22,
  },
  ayudaFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  ayudaIcono: {
    width: 17,
    height: 17,
    borderRadius: 9,
    overflow: 'hidden',
    textAlign: 'center',
    color: '#0879B6',
    backgroundColor: '#DDF4FA',
    fontSize: 12,
    fontWeight: '800',
  },
  ayudaTexto: {
    flex: 1,
    color: '#648196',
    fontSize: 11,
    lineHeight: 16,
  },
  mensajeError: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor: '#FFF0F2',
    borderWidth: 1,
    borderColor: '#F5CDD4',
  },
  mensajeErrorIcono: {
    color: '#C7354F',
    fontSize: 15,
    fontWeight: '900',
  },
  mensajeErrorTexto: {
    flex: 1,
    color: '#B52E47',
    fontSize: 12,
    lineHeight: 18,
  },
  botonBuscar: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: 17,
    backgroundColor: '#087FC4',
    borderWidth: 1,
    borderColor: '#38B8DD',
    shadowColor: '#087FC4',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  botonBuscarPresionado: {
    backgroundColor: '#075D92',
  },
  botonDesactivado: {
    opacity: 0.65,
  },
  botonBuscarIcono: {
    color: '#FFFFFF',
    fontSize: 25,
  },
  botonBuscarTexto: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  botonBuscarFlecha: {
    color: '#FFFFFF',
    fontSize: 20,
    marginLeft: 'auto',
  },

  // Continuar sin conexión
  offlinePanel: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: 20,
    backgroundColor: '#FFF8E8',
    borderWidth: 1,
    borderColor: '#F2DDAA',
  },
  offlineCabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  offlineIcono: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FFE8B5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineIconoTexto: {
    color: '#A96500',
    fontSize: 25,
    fontWeight: '800',
  },
  offlineTituloContenido: {
    flex: 1,
  },
  offlineTitulo: {
    color: '#80511A',
    fontSize: 15,
    fontWeight: '800',
  },
  offlineEtiqueta: {
    color: '#A96500',
    fontSize: 8,
    letterSpacing: 0.7,
    fontWeight: '800',
    marginTop: 4,
  },
  offlineDescripcion: {
    color: '#805E32',
    fontSize: 12,
    lineHeight: 19,
    marginTop: spacing.md,
  },
  botonContinuar: {
    minHeight: 47,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    backgroundColor: '#A96500',
  },
  presionado: {
    opacity: 0.8,
  },
  botonContinuarTexto: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  botonContinuarFlecha: {
    color: '#FFFFFF',
    fontSize: 19,
  },

  // Ayuda contextual
  pistaPanel: {
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: 'rgba(221,244,250,0.75)',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  pistaIcono: {
    width: 35,
    height: 35,
    borderRadius: 12,
    backgroundColor: '#C9F2E3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pistaIconoTexto: {
    color: '#087F62',
    fontSize: 17,
    fontWeight: '900',
  },
  pistaContenido: {
    flex: 1,
  },
  pistaTitulo: {
    color: '#16496D',
    fontSize: 12,
    fontWeight: '800',
  },
  pistaTexto: {
    color: '#5A788D',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },
  pie: {
    color: '#7190A3',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.4,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
