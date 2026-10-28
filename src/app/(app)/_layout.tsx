import { Stack } from 'expo-router';


export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="inicio" />
      <Stack.Screen name="lecturas" />
      <Stack.Screen name="medidor/index" />
      <Stack.Screen name="medidor/[codigo]" />
    </Stack>
  );
}