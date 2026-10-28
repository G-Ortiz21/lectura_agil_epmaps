import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';

import { obtenerTodasLasLecturas } from '../../data/repositories/lecturasRepository';
import type { LecturaLocal } from '../../domain/tipos';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Filtro = 'todas' | 'pendiente' | 'enviando' | 'enviada' | 'error';
type Tono = 'azul' | 'verde' | 'ambar' | 'rojo';

const FILTROS: { label: string; value: Filtro; icon: string }[] = [
  { label: 'Todas', value: 'todas', icon: '▦' },
  { label: 'Pendientes', value: 'pendiente', icon: '◷' },
  { label: 'Enviando', value: 'enviando', icon: '↗' },
  { label: 'Enviadas', value: 'enviada', icon: '✓' },
  { label: 'Errores', value: 'error', icon: '!' },
];

const ESTADOS: Record<LecturaLocal['syncEstado'], string> = {
  pendiente: 'Pendiente',
  enviando: 'Enviando',
  enviada: 'Enviada',
  error: 'Error de envío',
};

const TONOS: Record<Tono, { texto: string; fondo: string; borde: string }> = {
  azul: { texto: '#087FC4', fondo: '#DDF4FF', borde: '#B8E8FA' },
  verde: { texto: '#087F62', fondo: '#D9F7E9', borde: '#B5EBD3' },
  ambar: { texto: '#A96500', fondo: '#FFF0C8', borde: '#F5DDA0' },
  rojo: { texto: '#C7354F', fondo: '#FFE0E5', borde: '#F5C0CA' },
};

function tonoEstado(estado: LecturaLocal['syncEstado']): Tono {
  if (estado === 'enviada') return 'verde';
  if (estado === 'pendiente') return 'ambar';
  if (estado === 'error') return 'rojo';
  return 'azul';
}

function formatearNumero(valor: number) {
  return new Intl.NumberFormat('es-EC', {
    maximumFractionDigits: 2,
  }).format(valor);
}

function etiquetaVerificacion(estado: LecturaLocal['verificacion']) {
  if (estado === 'verificada') return 'Verificada';
  if (estado === 'requiere_accion') return 'Requiere acción';
  return 'Pendiente';
}

export default function LecturasScreen() {
  const [lecturas, setLecturas] = useState<LecturaLocal[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todas');
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarLecturas = useCallback(async () => {
    try {
      const resultado = await obtenerTodasLasLecturas();
      setLecturas(resultado);
      setError(null);
    } catch {
      setError(
        'No se pudo consultar el historial local. Inténtalo de nuevo.',
      );
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let activa = true;

      async function cargarAlEntrar() {
        setCargando(true);
        try {
          const resultado = await obtenerTodasLasLecturas();
          if (activa) {
            setLecturas(resultado);
            setError(null);
          }
        } catch {
          if (activa) {
            setError(
              'No se pudo consultar el historial local. Comprueba la base de datos e inténtalo de nuevo.',
            );
          }
        } finally {
          if (activa) setCargando(false);
        }
      }

      void cargarAlEntrar();
      return () => {
        activa = false;
      };
    }, []),
  );

  const resumen = useMemo(
    () => ({
      total: lecturas.length,
      pendiente: lecturas.filter((l) => l.syncEstado === 'pendiente').length,
      enviando: lecturas.filter((l) => l.syncEstado === 'enviando').length,
      enviada: lecturas.filter((l) => l.syncEstado === 'enviada').length,
      error: lecturas.filter((l) => l.syncEstado === 'error').length,
    }),
    [lecturas],
  );

  const filtradas = useMemo(() => {
    const termino = busqueda.trim().toUpperCase();

    return lecturas.filter((lectura) => {
      const coincideTexto =
        !termino ||
        lectura.medidorCodigo.toUpperCase().includes(termino) ||
        lectura.periodo.toUpperCase().includes(termino);

      const coincideEstado =
        filtro === 'todas' || lectura.syncEstado === filtro;

      return coincideTexto && coincideEstado;
    });
  }, [lecturas, busqueda, filtro]);

  async function actualizar() {
    setActualizando(true);
    try {
      await cargarLecturas();
    } finally {
      setActualizando(false);
    }
  }

  return (
    <View style={styles.pantalla}>
      <ScrollView
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={actualizando}
            onRefresh={actualizar}
            tintColor="#FFFFFF"
            colors={['#20B9C6']}
          />
        }
      >
        {/* Encabezado con capas translúcidas */}
        <View style={styles.encabezado}>
          <View pointerEvents="none" style={styles.orbeUno} />
          <View pointerEvents="none" style={styles.orbeDos} />

          <View style={styles.marcaFila}>
            <View style={styles.marcaIcono}>
              <Text style={styles.gotaMarca}>◇</Text>
            </View>
            <Text style={styles.marcaTexto}>LECTURA ÁGIL · EPMAPS</Text>
          </View>

          <Text style={styles.titulo}>Historial de lecturas</Text>
          <Text style={styles.subtitulo}>
            Controla tus registros, consumos y estados de sincronización.
          </Text>

          <View style={styles.etiquetaLocal}>
            <View style={styles.puntoVerde} />
            <Text style={styles.etiquetaLocalTexto}>
              REGISTROS DEL DISPOSITIVO
            </Text>
          </View>
        </View>

        {/* Indicadores */}
        <View style={styles.resumenPanel}>
          <Resumen
            icono="▤"
            etiqueta="Total"
            valor={resumen.total}
            tono="total"
          />
          <Resumen
            icono="◷"
            etiqueta="Pendientes"
            valor={resumen.pendiente}
            tono="ambar"
          />
          <Resumen
            icono="↗"
            etiqueta="Enviando"
            valor={resumen.enviando}
            tono="azul"
          />
          <Resumen
            icono="✓"
            etiqueta="Enviadas"
            valor={resumen.enviada}
            tono="verde"
          />
          <Resumen
            icono="!"
            etiqueta="Errores"
            valor={resumen.error}
            tono="rojo"
          />
        </View>

        {/* Búsqueda y filtros */}
        <View style={styles.controles}>
          <View style={styles.busqueda}>
            <Text style={styles.iconoBusqueda}>⌕</Text>
            <TextInput
              value={busqueda}
              onChangeText={setBusqueda}
              placeholder="Código de medidor o período..."
              placeholderTextColor="#69879A"
              style={styles.input}
              autoCapitalize="characters"
              accessibilityLabel="Buscar lecturas por medidor o período"
              returnKeyType="search"
            />
            {busqueda.length > 0 && (
              <Pressable
                onPress={() => setBusqueda('')}
                accessibilityRole="button"
                accessibilityLabel="Limpiar búsqueda"
                style={styles.limpiar}
              >
                <Text style={styles.limpiarTexto}>×</Text>
              </Pressable>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtros}
          >
            {FILTROS.map((item) => {
              const activo = filtro === item.value;

              return (
                <Pressable
                  key={item.value}
                  onPress={() => setFiltro(item.value)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: activo }}
                  style={[
                    styles.filtro,
                    activo && styles.filtroActivo,
                  ]}
                >
                  <Text
                    style={[
                      styles.filtroIcono,
                      activo && styles.filtroIconoActivo,
                    ]}
                  >
                    {item.icon}
                  </Text>
                  <Text
                    style={[
                      styles.filtroTexto,
                      activo && styles.filtroTextoActivo,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Lista */}
        <View style={styles.seccion}>
          <View>
            <Text style={styles.seccionTitulo}>Registros guardados</Text>
            <Text style={styles.seccionSubtitulo}>
              {filtradas.length}{' '}
              {filtradas.length === 1
                ? 'registro encontrado'
                : 'registros encontrados'}
            </Text>
          </View>

          <View style={styles.contador}>
            <Text style={styles.contadorTexto}>
              {String(filtradas.length).padStart(2, '0')}
            </Text>
          </View>
        </View>

        {cargando ? (
          <View style={styles.estadoPanel}>
            <ActivityIndicator size="large" color="#087FC4" />
            <Text style={styles.estadoTitulo}>Cargando historial</Text>
            <Text style={styles.estadoTexto}>
              Consultando los registros almacenados en el dispositivo.
            </Text>
          </View>
        ) : error ? (
          <View style={styles.estadoPanel}>
            <View style={[styles.estadoIcono, styles.iconoError]}>
              <Text style={styles.iconoErrorTexto}>!</Text>
            </View>
            <Text style={styles.estadoTitulo}>No se pudo cargar</Text>
            <Text style={styles.estadoTexto}>{error}</Text>
            <Pressable
              onPress={() => {
                setCargando(true);
                void cargarLecturas().finally(() => setCargando(false));
              }}
              style={styles.boton}
              accessibilityRole="button"
            >
              <Text style={styles.botonTexto}>Intentar de nuevo</Text>
            </Pressable>
          </View>
        ) : filtradas.length === 0 ? (
          <View style={styles.estadoPanel}>
            <View style={styles.estadoIcono}>
              <Text style={styles.gotaVacia}>◇</Text>
            </View>
            <Text style={styles.estadoTitulo}>
              {lecturas.length === 0
                ? 'Todavía no hay lecturas'
                : 'No hay coincidencias'}
            </Text>
            <Text style={styles.estadoTexto}>
              {lecturas.length === 0
                ? 'Cuando registres una lectura, aparecerá aquí con su estado de sincronización.'
                : 'Prueba con otro código, período o filtro.'}
            </Text>
            {lecturas.length > 0 && (
              <Pressable
                onPress={() => {
                  setBusqueda('');
                  setFiltro('todas');
                }}
                style={styles.boton}
                accessibilityRole="button"
              >
                <Text style={styles.botonTexto}>Limpiar filtros</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View style={styles.lista}>
            {filtradas.map((lectura) => (
              <TarjetaLectura
                key={lectura.claveUnica}
                lectura={lectura}
              />
            ))}
          </View>
        )}

        <View style={styles.pie}>
          <View style={styles.pieIcono}>
            <Text style={styles.pieIconoTexto}>↻</Text>
          </View>
          <View style={styles.pieContenido}>
            <Text style={styles.pieTitulo}>Historial local</Text>
            <Text style={styles.pieTexto}>
              Desliza hacia abajo para actualizar la lista.
            </Text>
          </View>
          <View style={styles.puntoVerde} />
        </View>
      </ScrollView>
    </View>
  );
}

function Resumen({
  icono,
  etiqueta,
  valor,
  tono,
}: {
  icono: string;
  etiqueta: string;
  valor: number;
  tono: 'total' | Tono;
}) {
  const color =
    tono === 'total' ? '#0875A7' : TONOS[tono].texto;
  const fondo =
    tono === 'total' ? '#D1F1FF' : TONOS[tono].fondo;

  return (
    <View style={[styles.resumenItem, tono === 'total' && styles.resumenTotal]}>
      <View style={[styles.resumenIcono, { backgroundColor: fondo }]}>
        <Text style={[styles.resumenIconoTexto, { color }]}>{icono}</Text>
      </View>
      <Text style={styles.resumenEtiqueta}>{etiqueta}</Text>
      <Text style={[styles.resumenValor, { color }]}>{valor}</Text>
    </View>
  );
}

function TarjetaLectura({ lectura }: { lectura: LecturaLocal }) {
  const tono = tonoEstado(lectura.syncEstado);
  const paleta = TONOS[tono];
  const requiereAccion = lectura.verificacion === 'requiere_accion';

  return (
    <View style={styles.lecturaCard}>
      <View style={styles.lecturaCabecera}>
        <View
          style={[
            styles.medidorIcono,
            { backgroundColor: paleta.fondo, borderColor: paleta.borde },
          ]}
        >
          <Text style={[styles.medidorGota, { color: paleta.texto }]}>◇</Text>
          <View style={[styles.medidorPunto, { backgroundColor: paleta.texto }]} />
        </View>

        <View style={styles.medidorInfo}>
          <Text style={styles.medidorCodigo}>{lectura.medidorCodigo}</Text>
          <Text style={styles.periodo}>▦  Período: {lectura.periodo}</Text>
        </View>

        <View
          style={[
            styles.estadoBadge,
            { backgroundColor: paleta.fondo, borderColor: paleta.borde },
          ]}
        >
          <Text style={[styles.estadoBadgeIcono, { color: paleta.texto }]}>
            {lectura.syncEstado === 'enviada'
              ? '✓'
              : lectura.syncEstado === 'error'
                ? '!'
                : lectura.syncEstado === 'enviando'
                  ? '↗'
                  : '◷'}
          </Text>
          <Text style={[styles.estadoBadgeTexto, { color: paleta.texto }]}>
            {ESTADOS[lectura.syncEstado]}
          </Text>
        </View>
      </View>

      <View style={styles.datosLectura}>
        <Dato
          icono="◉"
          etiqueta="Lectura"
          valor={
            lectura.lectura == null
              ? '—'
              : `${formatearNumero(lectura.lectura)} m³`
          }
        />
        <View style={styles.divisorDato} />
        <Dato
          icono="▥"
          etiqueta="Consumo"
          valor={
            lectura.consumo == null
              ? '—'
              : `${formatearNumero(lectura.consumo)} m³`
          }
        />
        <View style={styles.divisorDato} />
        <Dato
          icono={requiereAccion ? '!' : '✓'}
          etiqueta="Verificación"
          valor={etiquetaVerificacion(lectura.verificacion)}
          advertencia={requiereAccion}
        />
      </View>

      {(lectura.consumoAnomalo || lectura.ultimoError) && (
        <View
          style={[
            styles.aviso,
            lectura.ultimoError ? styles.avisoError : styles.avisoAnomalo,
          ]}
        >
          <Text style={styles.avisoIcono}>
            {lectura.ultimoError ? '!' : '↗'}
          </Text>
          <Text style={styles.avisoTexto}>
            {lectura.ultimoError ||
              'Consumo fuera del rango habitual. Revisa la lectura.'}
          </Text>
        </View>
      )}
    </View>
  );
}

function Dato({
  icono,
  etiqueta,
  valor,
  advertencia = false,
}: {
  icono: string;
  etiqueta: string;
  valor: string;
  advertencia?: boolean;
}) {
  return (
    <View style={styles.dato}>
      <View
        style={[
          styles.datoIcono,
          advertencia && styles.datoIconoAdvertencia,
        ]}
      >
        <Text
          style={[
            styles.datoIconoTexto,
            advertencia && styles.datoAdvertencia,
          ]}
        >
          {icono}
        </Text>
      </View>
      <Text style={styles.datoEtiqueta}>{etiqueta}</Text>
      <Text
        numberOfLines={2}
        style={[styles.datoValor, advertencia && styles.datoAdvertencia]}
      >
        {valor}
      </Text>
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

  // Encabezado azul con orbes translúcidos
  encabezado: {
    backgroundColor: '#062B52',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl * 1.5,
    paddingBottom: spacing.xl * 1.5,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },
  orbeUno: {
    position: 'absolute',
    top: -95,
    right: -60,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(34,178,224,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(179,239,255,0.2)',
  },
  orbeDos: {
    position: 'absolute',
    bottom: -110,
    left: -50,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(0,207,190,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(179,239,255,0.15)',
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
  gotaMarca: { color: '#8DEBFF', fontSize: 24, fontWeight: '700' },
  marcaTexto: {
    ...typography.label,
    color: '#BDEBFA',
    fontSize: 11,
    letterSpacing: 1.1,
  },
  titulo: {
    ...typography.title,
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 35,
    marginBottom: spacing.sm,
  },
  subtitulo: {
    ...typography.body,
    color: '#D5EAF7',
    lineHeight: 22,
  },
  etiquetaLocal: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  puntoVerde: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#20B990',
  },
  etiquetaLocalTexto: {
    color: '#DDF8FF',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.7,
  },

  // Resumen tipo vidrio esmerilado
  resumenPanel: {
    marginHorizontal: spacing.md,
    marginTop: -spacing.md,
    padding: spacing.sm,
    borderRadius: 25,
    flexDirection: 'row',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.76)',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    shadowColor: '#073C68',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  resumenItem: {
    flex: 1,
    minWidth: 0,
    alignItems: 'flex-start',
    paddingHorizontal: 5,
    paddingVertical: spacing.sm,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.52)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  resumenTotal: {
    backgroundColor: '#EAF8FF',
    borderColor: '#B5E8F7',
  },
  resumenIcono: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  resumenIconoTexto: { fontSize: 16, fontWeight: '800' },
  resumenEtiqueta: {
    fontSize: 10,
    lineHeight: 13,
    color: '#45627A',
    fontWeight: '600',
    minHeight: 26,
  },
  resumenValor: { fontSize: 22, lineHeight: 27, fontWeight: '800' },

  // Buscador y filtros
  controles: {
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.70)',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    shadowColor: '#0C527B',
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  busqueda: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderWidth: 1,
    borderColor: '#C8E3EF',
  },
  iconoBusqueda: {
    fontSize: 28,
    color: '#34799A',
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    color: colors.texto,
    fontSize: 14,
    paddingVertical: spacing.sm,
  },
  limpiar: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: '#E3F1F7',
  },
  limpiarTexto: { color: '#245D7A', fontSize: 22 },
  filtros: { gap: spacing.sm, paddingTop: spacing.md, paddingBottom: 2 },
  filtro: {
    minHeight: 39,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: '#D1E6F0',
  },
  filtroActivo: {
    backgroundColor: '#087FC4',
    borderColor: '#087FC4',
    shadowColor: '#087FC4',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  filtroIcono: { color: '#47748E', fontSize: 15, fontWeight: '700' },
  filtroIconoActivo: { color: '#FFFFFF' },
  filtroTexto: { color: '#345F7A', fontSize: 12, fontWeight: '600' },
  filtroTextoActivo: { color: '#FFFFFF' },

  // Sección del historial
  seccion: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    marginHorizontal: spacing.lg,
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
    marginTop: 3,
  },
  contador: {
    minWidth: 42,
    height: 36,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: '#DDF4FA',
    borderWidth: 1,
    borderColor: '#BCE7F3',
  },
  contadorTexto: { color: '#0877A5', fontSize: 15, fontWeight: '800' },
  lista: { paddingHorizontal: spacing.md, gap: spacing.md },

  // Tarjetas de lectura
  lecturaCard: {
    borderRadius: 24,
    padding: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    shadowColor: '#0A456A',
    shadowOpacity: 0.09,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 7 },
    elevation: 3,
    overflow: 'hidden',
  },
  lecturaCabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  medidorIcono: {
    width: 49,
    height: 49,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
  },
  medidorGota: { fontSize: 31, fontWeight: '700' },
  medidorPunto: {
    position: 'absolute',
    right: 1,
    bottom: 1,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  medidorInfo: { flex: 1, minWidth: 0 },
  medidorCodigo: {
    color: '#0A355E',
    fontSize: 15,
    fontWeight: '800',
  },
  periodo: { color: '#587990', fontSize: 11, marginTop: 5 },
  estadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 7,
    borderRadius: 99,
    borderWidth: 1,
  },
  estadoBadgeIcono: { fontSize: 12, fontWeight: '900' },
  estadoBadgeTexto: { fontSize: 10, fontWeight: '800' },
  datosLectura: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#DCEBF1',
    gap: spacing.xs,
  },
  dato: { flex: 1, minWidth: 0, paddingHorizontal: 2 },
  datoIcono: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E0F3FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  datoIconoAdvertencia: { backgroundColor: '#FFF0C8' },
  datoIconoTexto: { color: '#0877AD', fontSize: 14, fontWeight: '800' },
  datoEtiqueta: { color: '#5A788D', fontSize: 10, marginBottom: 4 },
  datoValor: { color: '#103E66', fontSize: 11, lineHeight: 15, fontWeight: '800' },
  datoAdvertencia: { color: '#A96500' },
  divisorDato: { width: 1, backgroundColor: '#DCEBF1', marginVertical: 2 },
  aviso: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.sm,
    borderRadius: 12,
  },
  avisoError: { backgroundColor: '#FFF0F1' },
  avisoAnomalo: { backgroundColor: '#FFF6DF' },
  avisoIcono: { color: '#A96500', fontWeight: '900' },
  avisoTexto: { flex: 1, color: '#80511A', fontSize: 11, lineHeight: 16 },

  // Carga, errores y lista vacía
  estadoPanel: {
    marginHorizontal: spacing.md,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl * 1.5,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.76)',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  estadoIcono: {
    width: 58,
    height: 58,
    borderRadius: 21,
    backgroundColor: '#DDF5FC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  iconoError: { backgroundColor: '#FFE1E6' },
  iconoErrorTexto: { color: '#C7354F', fontSize: 28, fontWeight: '800' },
  gotaVacia: { color: '#087FC4', fontSize: 35, fontWeight: '700' },
  estadoTitulo: {
    color: '#103E66',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  estadoTexto: {
    color: '#5A788D',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: spacing.sm,
    maxWidth: 320,
  },
  boton: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 99,
    backgroundColor: '#087FC4',
  },
  botonTexto: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },

  // Pie de pantalla
  pie: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.md,
    padding: spacing.md,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(222,244,251,0.76)',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  pieIcono: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  pieIconoTexto: { color: '#087FC4', fontSize: 23, fontWeight: '700' },
  pieContenido: { flex: 1 },
  pieTitulo: { color: '#16496D', fontSize: 12, fontWeight: '800' },
  pieTexto: { color: '#5A788D', fontSize: 11, marginTop: 3 },
});