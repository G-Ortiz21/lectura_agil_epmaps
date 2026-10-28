import { Stack } from 'expo-router';
import { RegistroProvider } from '../../../contexts/RegistroContext';

export default function RegistroLayout() {
  return (
    <RegistroProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="estado_medidor" />
        <Stack.Screen name="datos_lectura" />
        <Stack.Screen name="revision_consumo" />
        <Stack.Screen name="fotografia" />
        <Stack.Screen name="resumen" />
      </Stack>
    </RegistroProvider>
  );
}
