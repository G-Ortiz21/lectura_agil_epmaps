import { StyleSheet, Text, View } from 'react-native';
import type { MedidorOficina } from '../domain/tipos';
import { colors } from '../theme/colors';
import { radii, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

interface MedidorCardProps {
  medidor: MedidorOficina;
  origen: 'oficina' | 'cache_local';
  consultadoEn: string;
}

export function MedidorCard({
  medidor,
  origen,
  consultadoEn,
}: MedidorCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.kicker}>DATOS DEL MEDIDOR</Text>
      <Text style={styles.codigo}>{medidor.codigo}</Text>
      <Text style={styles.direccion}>{medidor.direccion}</Text>

      <Dato etiqueta="SECTOR" valor={medidor.sector ?? 'No disponible'} />
      <Dato
        etiqueta="NÚMERO DE CUENTA"
        valor={medidor.numeroCuenta ?? 'No disponible'}
      />
      <Dato etiqueta="ESTADO DE OFICINA" valor={medidor.estadoOficina} />

      <View style={styles.lecturas}>
        <Dato
          etiqueta="ÚLTIMA LECTURA"
          valor={
            medidor.ultimaLectura === null
              ? 'No disponible'
              : String(medidor.ultimaLectura)
          }
        />
        <Dato
          etiqueta="FECHA DE LECTURA"
          valor={medidor.fechaUltimaLectura ?? 'No disponible'}
        />
        <Dato
          etiqueta="PROMEDIO MENSUAL"
          valor={
            medidor.promedioMensual === null
              ? 'No disponible'
              : String(medidor.promedioMensual)
          }
        />
      </View>

      <View
        style={origen === 'oficina' ? styles.fuenteOficina : styles.fuenteCache}
        accessibilityRole="summary"
      >
        <Text style={styles.fuenteTitulo}>
          {origen === 'oficina'
            ? 'Datos consultados en la oficina'
            : 'Datos de caché local'}
        </Text>
        <Text style={styles.fuenteFecha}>
          Consulta local: {new Date(consultadoEn).toLocaleString()}
        </Text>
      </View>
    </View>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <View style={styles.dato}>
      <Text style={styles.etiqueta}>{etiqueta}</Text>
      <Text style={styles.valor}>{valor}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.superficie,
    borderColor: colors.borde,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  kicker: {
    ...typography.caption,
    color: colors.marcaOscura,
  },
  codigo: {
    ...typography.technical,
    color: colors.marcaOscura,
  },
  direccion: {
    ...typography.section,
    color: colors.texto,
  },
  dato: {
    gap: spacing.xs,
  },
  etiqueta: {
    ...typography.caption,
    color: colors.textoSecundario,
  },
  valor: {
    ...typography.body,
    color: colors.texto,
  },
  lecturas: {
    backgroundColor: colors.superficieSuave,
    borderRadius: radii.field,
    gap: spacing.md,
    padding: spacing.md,
  },
  fuenteOficina: {
    borderLeftColor: colors.exito,
    borderLeftWidth: 3,
    gap: spacing.xs,
    paddingLeft: spacing.md,
  },
  fuenteCache: {
    borderLeftColor: colors.informacion,
    borderLeftWidth: 3,
    gap: spacing.xs,
    paddingLeft: spacing.md,
  },
  fuenteTitulo: {
    ...typography.label,
    color: colors.texto,
  },
  fuenteFecha: {
    ...typography.body,
    color: colors.textoSecundario,
  },
});
