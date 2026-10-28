import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors } from '../theme/colors';
import { dimensions, radii, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

/**
 * Campo de formulario controlado con etiqueta visible y error junto al
 * campo (ADR-006, DISEÑO.md §6.3). El valor vive fuera del componente,
 * en la pantalla o en el RegistroContext.
 */
export interface CampoProps {
  etiqueta: string;
  valor: string;
  onChangeText: (texto: string) => void;
  /** Texto de ayuda breve bajo la etiqueta. */
  ayuda?: string;
  /** Mensaje de error junto al campo. Si existe, el borde cambia de estado. */
  error?: string | null;
  placeholder?: string;
  editable?: boolean;
  multiline?: boolean;
  maxLength?: number;
  keyboardType?: TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
}

export function Campo({
  etiqueta,
  valor,
  onChangeText,
  ayuda,
  error,
  placeholder,
  editable = true,
  multiline = false,
  maxLength,
  keyboardType,
  autoCapitalize,
}: CampoProps) {
  return (
    <View style={styles.campo}>
      <Text style={styles.etiqueta}>{etiqueta}</Text>
      {ayuda !== undefined && <Text style={styles.ayuda}>{ayuda}</Text>}
      <TextInput
        accessibilityLabel={etiqueta}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        editable={editable}
        keyboardType={keyboardType}
        maxLength={maxLength}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textoSecundario}
        style={[styles.input, multiline && styles.inputMultiline, error != null && styles.inputError]}
        value={valor}
      />
      {error != null && (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  campo: {
    gap: spacing.xs,
  },
  etiqueta: {
    ...typography.label,
    color: colors.texto,
  },
  ayuda: {
    ...typography.caption,
    color: colors.textoSecundario,
  },
  input: {
    ...typography.body,
    backgroundColor: colors.superficie,
    borderColor: colors.borde,
    borderRadius: radii.field,
    borderWidth: 1,
    color: colors.texto,
    minHeight: dimensions.inputMinimumHeight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  inputMultiline: {
    minHeight: dimensions.inputMinimumHeight * 2,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: colors.error,
  },
  error: {
    ...typography.body,
    color: colors.error,
  },
});
