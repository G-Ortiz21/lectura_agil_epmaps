
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';

import { useSesion } from '../../contexts/SesionContext';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export default function HomeScreen() {
  const { tecnicoCodigo, cerrarSesion } = useSesion();
  const [cerrando, setCerrando] = useState(false);

  async function salir(): Promise<void> {
    setCerrando(true);

    try {
      await cerrarSesion();
      router.replace('/login');
    } catch (error) {
      console.error('No se pudo cerrar la sesión:', error);
    } finally {
      setCerrando(false);
    }
  }

  return (
    <View style={styles.pantalla}>
      <ScrollView
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
      >
        {/* Encabezado principal */}
        <View style={styles.encabezado}>
          <View pointerEvents="none" style={styles.orbeUno} />
          <View pointerEvents="none" style={styles.orbeDos} />

          <View style={styles.marcaFila}>
            <View style={styles.marcaIcono}>
              <Text style={styles.gotaMarca}>◇</Text>
            </View>
            <Text style={styles.marcaTexto}>LECTURA ÁGIL · EPMAPS</Text>
          </View>

          <View style={styles.saludoFila}>
            <View style={styles.saludoContenido}>
              <Text style={styles.sobreTitulo}>PANEL DEL TÉCNICO</Text>
              <Text style={styles.titulo}>Tu jornada,</Text>
              <Text style={styles.tituloAcento}>bajo control.</Text>
            </View>

            <View style={styles.iconoAgua}>
              <Text style={styles.iconoAguaTexto}>♢</Text>
              <View style={styles.reflejoAgua} />
            </View>
          </View>

          <Text style={styles.subtitulo}>
            Gestiona tus medidores y administra las lecturas de tu jornada.
          </Text>

          {/* Sesión del técnico */}
          <View style={styles.tecnicoPanel}>
            <View style={styles.avatar}>
              <Text style={styles.avatarTexto}>T</Text>
            </View>

            <View style={styles.tecnicoInfo}>
              <Text style={styles.tecnicoLabel}>SESIÓN ACTIVA</Text>
              <Text style={styles.tecnicoCodigo} numberOfLines={1}>
                {tecnicoCodigo || 'Técnico identificado'}
              </Text>
            </View>

            <View style={styles.conexionIndicador}>
              <View style={styles.conexionPunto} />
              <Text style={styles.conexionTexto}>Activa</Text>
            </View>
          </View>
        </View>

        {/* Accesos principales */}
        <View style={styles.seccion}>
          <View>
            <Text style={styles.seccionTitulo}>Operaciones</Text>
            <Text style={styles.seccionSubtitulo}>
              Accede a las tareas principales.
            </Text>
          </View>
          <View style={styles.seccionDecoracion} />
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/medidor')}
          style={({ pressed }) => [
            styles.accionPrincipal,
            pressed && styles.tarjetaPresionada,
          ]}
        >
          <View pointerEvents="none" style={styles.accionBrillo} />

          <View style={styles.accionIconoPrincipal}>
            <Text style={styles.accionIconoTexto}>⌕</Text>
          </View>

          <View style={styles.accionContenido}>
            <Text style={styles.accionSobreTitulo}>CONSULTA</Text>
            <Text style={styles.accionTituloPrincipal}>
              Consultar medidor
            </Text>
            <Text style={styles.accionDescripcionPrincipal}>
              Busca un suministro por su código y revisa sus datos disponibles.
            </Text>
          </View>

          <View style={styles.flechaPrincipal}>
            <Text style={styles.flechaPrincipalTexto}>↗</Text>
          </View>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/lecturas')}
          style={({ pressed }) => [
            styles.accionSecundaria,
            pressed && styles.tarjetaPresionada,
          ]}
        >
          <View style={styles.accionIconoSecundario}>
            <Text style={styles.accionIconoSecundarioTexto}>▤</Text>
          </View>

          <View style={styles.accionContenido}>
            <Text style={styles.accionTitulo}>Historial de lecturas</Text>
            <Text style={styles.accionDescripcion}>
              Consulta registros guardados y su estado de sincronización.
            </Text>
            <View style={styles.enlaceAccion}>
              <Text style={styles.enlaceAccionTexto}>Abrir historial</Text>
              <Text style={styles.enlaceFlecha}>→</Text>
            </View>
          </View>
        </Pressable>

        {/* Información operativa */}
        <View style={styles.seccion}>
          <View>
            <Text style={styles.seccionTitulo}>Centro de operaciones</Text>
            <Text style={styles.seccionSubtitulo}>
              Información para tu trabajo en campo.
            </Text>
          </View>
        </View>

        <View style={styles.infoPanel}>
          <View style={styles.infoIcono}>
            <Text style={styles.infoIconoTexto}>⌁</Text>
          </View>

          <View style={styles.infoContenido}>
            <Text style={styles.infoTitulo}>Trabajo en campo</Text>
            <Text style={styles.infoDescripcion}>
              Consulta los datos disponibles del medidor antes de registrar
              una lectura.
            </Text>
          </View>
        </View>

        <View style={styles.infoPanel}>
          <View style={[styles.infoIcono, styles.infoIconoVerde]}>
            <Text style={[styles.infoIconoTexto, styles.infoTextoVerde]}>
              ↻
            </Text>
          </View>

          <View style={styles.infoContenido}>
            <Text style={styles.infoTitulo}>Control de registros</Text>
            <Text style={styles.infoDescripcion}>
              Revisa el historial para identificar lecturas pendientes,
              enviadas o que requieren atención.
            </Text>
          </View>
        </View>

        {/* Cierre de sesión */}
        <Pressable
          accessibilityRole="button"
          disabled={cerrando}
          onPress={() => void salir()}
          style={({ pressed }) => [
            styles.botonSalir,
            pressed && styles.botonSalirPresionado,
            cerrando && styles.botonDesactivado,
          ]}
        >
          {cerrando ? (
            <ActivityIndicator color="#C43F55" size="small" />
          ) : (
            <Text style={styles.botonSalirIcono}>↗</Text>
          )}

          <Text style={styles.botonSalirTexto}>
            {cerrando ? 'Cerrando sesión…' : 'Cerrar sesión'}
          </Text>
        </Pressable>

        <Text style={styles.pie}>
          LECTURA ÁGIL · EPMAPS
        </Text>
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

  // Identidad visual
  encabezado: {
    backgroundColor: '#062B52',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl * 1.5,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  orbeUno: {
    position: 'absolute',
    top: -100,
    right: -70,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(34,178,224,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(179,239,255,0.20)',
  },
  orbeDos: {
    position: 'absolute',
    bottom: -110,
    left: -70,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(0,207,190,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(179,239,255,0.16)',
  },
  marcaFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  marcaIcono: {
    width: 36,
    height: 36,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  gotaMarca: {
    color: '#8DEBFF',
    fontSize: 25,
    fontWeight: '700',
  },
  marcaTexto: {
    ...typography.label,
    color: '#BDEBFA',
    fontSize: 11,
    letterSpacing: 1.1,
  },
  saludoFila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  saludoContenido: {
    flex: 1,
  },
  sobreTitulo: {
    color: '#7EE6E8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.6,
    marginBottom: spacing.sm,
  },
  titulo: {
    ...typography.title,
    color: '#FFFFFF',
    fontSize: 31,
    lineHeight: 36,
  },
  tituloAcento: {
    color: '#65DCE5',
    fontSize: 30,
    lineHeight: 37,
    fontWeight: '800',
  },
  iconoAgua: {
    width: 77,
    height: 89,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(180,240,255,0.35)',
    transform: [{ rotate: '4deg' }],
  },
  iconoAguaTexto: {
    color: '#9BEFFF',
    fontSize: 57,
    fontWeight: '300',
  },
  reflejoAgua: {
    position: 'absolute',
    width: 23,
    height: 23,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    top: 17,
    right: 17,
  },
  subtitulo: {
    ...typography.body,
    color: '#D5EAF7',
    fontSize: 13,
    lineHeight: 21,
    marginTop: spacing.md,
    maxWidth: 310,
  },

  // Panel translúcido de sesión
  tecnicoPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  avatar: {
    width: 43,
    height: 43,
    borderRadius: 15,
    backgroundColor: 'rgba(92,218,232,0.20)',
    borderWidth: 1,
    borderColor: 'rgba(141,235,255,0.42)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTexto: {
    color: '#B5F6FF',
    fontSize: 20,
    fontWeight: '800',
  },
  tecnicoInfo: {
    flex: 1,
    minWidth: 0,
  },
  tecnicoLabel: {
    color: '#A6D7EA',
    fontSize: 9,
    letterSpacing: 1,
    fontWeight: '700',
    marginBottom: 4,
  },
  tecnicoCodigo: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  conexionIndicador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: 'rgba(32,185,144,0.16)',
  },
  conexionPunto: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#51E1AF',
  },
  conexionTexto: {
    color: '#B4F9DF',
    fontSize: 10,
    fontWeight: '700',
  },

  // Secciones
  seccion: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  seccionTitulo: {
    ...typography.section,
    color: '#103E66',
    fontSize: 19,
  },
  seccionSubtitulo: {
    ...typography.body,
    color: '#5A788D',
    fontSize: 12,
    marginTop: 4,
  },
  seccionDecoracion: {
    width: 34,
    height: 4,
    borderRadius: 3,
    backgroundColor: '#36C7CD',
  },

  // Acción principal
  accionPrincipal: {
    marginHorizontal: spacing.md,
    padding: spacing.md,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#0879B6',
    borderWidth: 1,
    borderColor: '#50C9E4',
    overflow: 'hidden',
    shadowColor: '#075D92',
    shadowOpacity: 0.20,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 4,
  },
  accionBrillo: {
    position: 'absolute',
    top: -80,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  accionIconoPrincipal: {
    width: 48,
    height: 48,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accionIconoTexto: {
    color: '#FFFFFF',
    fontSize: 35,
    lineHeight: 39,
  },
  accionContenido: {
    flex: 1,
    minWidth: 0,
  },
  accionSobreTitulo: {
    color: '#A9EFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.3,
    marginBottom: 4,
  },
  accionTituloPrincipal: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '800',
  },
  accionDescripcionPrincipal: {
    color: '#E0F6FF',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 5,
  },
  flechaPrincipal: {
    width: 30,
    height: 30,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flechaPrincipalTexto: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
  },

  // Acción secundaria
  accionSecundaria: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.76)',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    shadowColor: '#0A456A',
    shadowOpacity: 0.07,
    shadowRadius: 13,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  accionIconoSecundario: {
    width: 49,
    height: 49,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DDF4FA',
    borderWidth: 1,
    borderColor: '#BDE7F2',
  },
  accionIconoSecundarioTexto: {
    color: '#0879B6',
    fontSize: 26,
    fontWeight: '800',
  },
  accionTitulo: {
    color: '#103E66',
    fontSize: 15,
    fontWeight: '800',
  },
  accionDescripcion: {
    color: '#5A788D',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },
  enlaceAccion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  enlaceAccionTexto: {
    color: '#0879B6',
    fontSize: 12,
    fontWeight: '800',
  },
  enlaceFlecha: {
    color: '#0879B6',
    fontSize: 16,
    fontWeight: '800',
  },
  tarjetaPresionada: {
    opacity: 0.84,
    transform: [{ scale: 0.99 }],
  },

  // Información operativa
  infoPanel: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.95)',
  },
  infoIcono: {
    width: 39,
    height: 39,
    borderRadius: 14,
    backgroundColor: '#DDF4FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoIconoTexto: {
    color: '#0879B6',
    fontSize: 25,
    fontWeight: '800',
  },
  infoIconoVerde: {
    backgroundColor: '#D9F7E9',
  },
  infoTextoVerde: {
    color: '#087F62',
  },
  infoContenido: {
    flex: 1,
  },
  infoTitulo: {
    color: '#103E66',
    fontSize: 13,
    fontWeight: '800',
  },
  infoDescripcion: {
    color: '#5A788D',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },

  // Cierre de sesión
  botonSalir: {
    minHeight: 49,
    marginHorizontal: spacing.md,
    marginTop: spacing.xl,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#F4CDD3',
  },
  botonSalirPresionado: {
    backgroundColor: '#FFE1E5',
  },
  botonDesactivado: {
    opacity: 0.6,
  },
  botonSalirIcono: {
    color: '#C43F55',
    fontSize: 18,
    fontWeight: '800',
  },
  botonSalirTexto: {
    ...typography.label,
    color: '#B52E47',
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
