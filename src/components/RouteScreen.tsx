import { Link, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { dimensions, radii, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

export interface RouteLink {
  label: string;
  href: Href;
}

interface RouteScreenProps {
  title: string;
  description: string;
  links?: RouteLink[];
  children?: ReactNode;
  kicker?: string;
  showPendingNotice?: boolean;
}

export function RouteScreen({
  title,
  description,
  links = [],
  children,
  kicker = 'ESTRUCTURA DE NAVEGACIÓN',
  showPendingNotice = true,
}: RouteScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.brand}>LECTURA ÁGIL</Text>
          <Text style={styles.headerSubtitle}>Registro técnico de medidores</Text>
        </View>

        <View style={styles.body}>
          <Text style={styles.kicker}>{kicker}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>

          {showPendingNotice && (
            <View style={styles.notice} accessibilityRole="summary">
              <Text style={styles.noticeTitle}>Funcionalidad pendiente</Text>
              <Text style={styles.noticeText}>
                Esta pantalla solo prepara la ruta. No inicia sesión, consulta
                datos ni guarda cambios.
              </Text>
            </View>
          )}

          {children}

          {links.length > 0 && (
            <View style={styles.navigation}>
              <Text style={styles.navigationTitle}>NAVEGACIÓN</Text>
              {links.map((link) => (
                <Link key={`${link.href}-${link.label}`} href={link.href} asChild>
                  <Pressable
                    accessibilityRole="button"
                    style={({ pressed }) => [
                      styles.link,
                      pressed && styles.linkPressed,
                    ]}
                  >
                    <Text style={styles.linkText}>{link.label}</Text>
                  </Pressable>
                </Link>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.fondo,
  },
  content: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: colors.marca,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  brand: {
    ...typography.section,
    color: colors.blanco,
  },
  headerSubtitle: {
    ...typography.body,
    color: colors.blanco,
    marginTop: spacing.xs,
  },
  body: {
    padding: spacing.xl,
    gap: spacing.md,
  },
  kicker: {
    ...typography.label,
    color: colors.marcaOscura,
  },
  title: {
    ...typography.title,
    color: colors.texto,
  },
  description: {
    ...typography.body,
    color: colors.textoSecundario,
  },
  notice: {
    backgroundColor: colors.superficie,
    borderColor: colors.borde,
    borderRadius: radii.card,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  noticeTitle: {
    ...typography.label,
    color: colors.advertencia,
  },
  noticeText: {
    ...typography.body,
    color: colors.texto,
  },
  navigation: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  navigationTitle: {
    ...typography.label,
    color: colors.textoSecundario,
    marginBottom: spacing.xs,
  },
  link: {
    alignItems: 'center',
    backgroundColor: colors.superficie,
    borderColor: colors.marca,
    borderRadius: radii.field,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: dimensions.minimumTouchTarget,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  linkPressed: {
    backgroundColor: colors.superficieSuave,
  },
  linkText: {
    ...typography.label,
    color: colors.marcaOscura,
    textAlign: 'center',
  },
});
