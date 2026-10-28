import { Stack } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { ConexionProvider } from '../contexts/ConexionContext';
import { SesionProvider, useSesion } from '../contexts/SesionContext';
import SincronizacionAutomatica from '../components/SincronizacionAutomatica';
/**
 * Pantalla de arranque: evita mostrar el login o las pantallas internas
 * durante el instante en que se lee la sesión (ADR-001, ADR-012).
 */
function PantallaArranque() {
  return (
    <View style={styles.arranque}>
      <ActivityIndicator accessibilityLabel="Cargando sesión" color={colors.marca} />
      <Text style={styles.arranqueTexto}>Comprobando la sesión…</Text>
    </View>
  );
}

function NavegacionRaiz() {
  const { estado } = useSesion();

  if (estado === 'cargando') {
    return <PantallaArranque />;
  }

  const autenticado = estado === 'autenticado';

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.fondo },
      }}
    >
      <Stack.Protected guard={autenticado}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!autenticado}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Screen name="index" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SesionProvider>
      <ConexionProvider>
        <SincronizacionAutomatica />
        <NavegacionRaiz />
      </ConexionProvider>
    </SesionProvider>
  );
}


const styles = StyleSheet.create({
  arranque: {
    alignItems: 'center',
    backgroundColor: colors.fondo,
    flex: 1,
    gap: spacing.md,
    justifyContent: 'center',
  },
  arranqueTexto: {
    ...typography.body,
    color: colors.textoSecundario,
  },
});
