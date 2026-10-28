import { useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useRegistro } from '../../../contexts/RegistroContext';
import { requiereFoto } from '../../../domain/reglasLectura';
import {
  CamaraNoDisponibleError,
  capturarFoto,
  nombreFotoDeLectura,
  obtenerRutaFoto,
  PermisoCamaraDenegadoError,
  recuperarFotoPendiente,
} from '../../../services/fotoService';

const COLORES = {
  fondo: '#EAF4F8',
  azulOscuro: '#062B52',
  azul: '#087FC4',
  azulPresionado: '#075D92',
  celeste: '#22B2E0',
  blanco: '#FFFFFF',
  texto: '#17324D',
  secundario: '#5A7185',
  borde: '#D8E7F0',
  verde: '#087F62',
  verdeFondo: '#E6F6F0',
  ambar: '#A96500',
  ambarFondo: '#FFF4DE',
  rojo: '#C7354F',
  rojoFondo: '#FFF0F2',
};

export default function FotografiaScreen() {
  const { registro, cargandoBorrador, actualizarDatos, definirPaso } =
    useRegistro();

  const [tomandoFoto, setTomandoFoto] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [permisoDenegado, setPermisoDenegado] = useState(false);

  const codigoMedidor = registro.codigoMedidor;
  const estado = registro.estadoMedidor;
  const datos = registro.datos;

  useEffect(() => {
    if (!cargandoBorrador) {
      definirPaso('fotografia');
    }
  }, [cargandoBorrador, definirPaso]);

  const nombreArchivo =
    codigoMedidor === null ? null : nombreFotoDeLectura(codigoMedidor);

  // Recupera una fotografía pendiente si Android cerró la aplicación
  // durante la captura (ADR-007).
  useEffect(() => {
    let vigente = true;

    if (
      nombreArchivo === null ||
      cargandoBorrador ||
      datos.fotoNombre !== null
    ) {
      return () => {
        vigente = false;
      };
    }

    void recuperarFotoPendiente(nombreArchivo)
      .then((nombre) => {
        if (vigente && nombre !== null) {
          actualizarDatos({ fotoNombre: nombre });
        }
      })
      .catch(() => {
        // No hay una fotografía pendiente que recuperar.
      });

    return () => {
      vigente = false;
    };
    // Se conserva el comportamiento original: consultar al cargar el borrador.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nombreArchivo, cargandoBorrador]);

  if (cargandoBorrador) {
    return (
      <View style={styles.pantalla}>
        <View style={styles.encabezado}>
          <Text style={styles.marca}>LECTURA ÁGIL · EPMAPS</Text>
          <Text style={styles.paso}>PASO 4 DE 5 · FOTOGRAFÍA</Text>
          <Text style={styles.titulo}>Fotografía</Text>
          <Text style={styles.descripcion}>
            Recuperando el registro guardado…
          </Text>
        </View>
        <View style={styles.contenido}>
          <View style={styles.tarjeta}>
            <Text style={styles.texto}>Recuperando los datos del registro…</Text>
          </View>
        </View>
      </View>
    );
  }

  if (codigoMedidor === null || estado === null) {
    return (
      <View style={styles.pantalla}>
        <View style={styles.encabezado}>
          <Text style={styles.marca}>LECTURA ÁGIL · EPMAPS</Text>
          <Text style={styles.paso}>PASO 4 DE 5 · FOTOGRAFÍA</Text>
          <Text style={styles.titulo}>Fotografía</Text>
          <Text style={styles.descripcion}>
            Completa los pasos anteriores para adjuntar evidencia.
          </Text>
        </View>

        <View style={styles.contenido}>
          <View style={styles.tarjeta}>
            <Text style={styles.texto}>
              Primero consulta un medidor y completa los datos de lectura.
            </Text>

            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/medidor')}
              style={({ pressed }) => [
                styles.boton,
                pressed && styles.botonPresionado,
              ]}
            >
              <Text style={styles.botonTexto}>Consultar medidor</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  const obligatoria = requiereFoto(estado, datos.consumoAnomalo ?? null);

  const motivoObligatoria =
    estado === 'danado'
      ? 'Obligatoria por medidor dañado'
      : datos.consumoAnomalo === true
        ? 'Obligatoria por consumo anómalo'
        : 'La fotografía es opcional en este registro';

  const rutaFoto = datos.fotoNombre
    ? obtenerRutaFoto(datos.fotoNombre)
    : null;

  async function tomar(): Promise<void> {
    if (nombreArchivo === null) {
      return;
    }

    setTomandoFoto(true);
    setMensaje(null);
    setPermisoDenegado(false);

    try {
      const nombre = await capturarFoto(nombreArchivo);

      if (nombre !== null) {
        actualizarDatos({ fotoNombre: nombre });
      }
    } catch (error: unknown) {
      if (error instanceof PermisoCamaraDenegadoError) {
        setPermisoDenegado(true);
        setMensaje(
          'La aplicación necesita acceso a la cámara. Concede el permiso desde los ajustes del teléfono.',
        );
      } else if (error instanceof CamaraNoDisponibleError) {
        setMensaje('No se encontró una cámara disponible en este dispositivo.');
      } else {
        setMensaje('No se pudo capturar la fotografía. Inténtalo de nuevo.');
      }
    } finally {
      setTomandoFoto(false);
    }
  }

  function avanzar(): void {
    if (obligatoria && datos.fotoNombre === null) {
      setMensaje('La fotografía es obligatoria para este registro.');
      return;
    }

    setMensaje(null);
    definirPaso('resumen');
    router.push('/registro/resumen');
  }

  return (
    <View style={styles.pantalla}>
      <View style={styles.encabezado}>
        <View style={styles.orbeSuperior} />
        <View style={styles.orbeInferior} />

        <Text style={styles.marca}>LECTURA ÁGIL · EPMAPS</Text>
        <Text style={styles.paso}>PASO 4 DE 5 · EVIDENCIA</Text>
        <Text style={styles.titulo}>Fotografía</Text>
        <Text style={styles.descripcion}>
          Adjunta una imagen del medidor como evidencia del registro.
        </Text>

        <View style={styles.progresoContenedor}>
          <View style={styles.progresoFondo}>
            <View style={styles.progresoActivo} />
          </View>
          <Text style={styles.progresoTexto}>4 de 5 pasos</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.tarjetaMedidor}>
          <View style={styles.iconoMedidor}>
            <Text style={styles.iconoMedidorTexto}>04</Text>
          </View>

          <View style={styles.datosMedidor}>
            <Text style={styles.etiqueta}>CÓDIGO DEL MEDIDOR</Text>
            <Text style={styles.codigoMedidor}>{codigoMedidor}</Text>
          </View>

          <View
            style={[
              styles.estadoEtiqueta,
              obligatoria ? styles.estadoObligatorio : styles.estadoOpcional,
            ]}
          >
            <Text
              style={[
                styles.estadoEtiquetaTexto,
                obligatoria
                  ? styles.textoObligatorio
                  : styles.textoOpcional,
              ]}
            >
              {obligatoria ? 'Requerida' : 'Opcional'}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.tarjeta,
            obligatoria ? styles.tarjetaAdvertencia : styles.tarjetaPositiva,
          ]}
        >
          <View style={styles.encabezadoTarjeta}>
            <View
              style={[
                styles.puntoEstado,
                obligatoria ? styles.puntoAmbar : styles.puntoVerde,
              ]}
            />
            <Text
              style={[
                styles.tituloTarjeta,
                obligatoria ? styles.textoObligatorio : styles.textoOpcional,
              ]}
            >
              {motivoObligatoria}
            </Text>
          </View>

          <Text style={styles.textoSecundario}>
            {obligatoria
              ? 'Asegúrate de que la imagen permita identificar el estado del medidor.'
              : 'Puedes adjuntar una fotografía para respaldar la información registrada.'}
          </Text>
        </View>

        <View style={styles.seccion}>
          <Text style={styles.tituloSeccion}>Evidencia fotográfica</Text>
          <Text style={styles.subtituloSeccion}>
            {datos.fotoNombre !== null
              ? 'Revisa la imagen guardada o vuelve a tomarla.'
              : 'Toma una fotografía directamente desde la cámara del dispositivo.'}
          </Text>
        </View>

        <View style={styles.areaFoto}>
          {datos.fotoNombre !== null && rutaFoto !== null ? (
            <>
              <Image
                source={{ uri: rutaFoto }}
                style={styles.vistaPrevia}
                resizeMode="cover"
              />
              <View style={styles.insigniaFoto}>
                <Text style={styles.insigniaFotoTexto}>
                  Fotografía adjunta
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.contenedorSinFoto}>
              <View style={styles.iconoCamara}>
                <Text style={styles.iconoCamaraTexto}>+</Text>
              </View>
              <Text style={styles.sinFoto}>
                {datos.fotoNombre !== null
                  ? 'La fotografía guardada ya no está disponible en el dispositivo.'
                  : 'Todavía no hay una fotografía adjunta'}
              </Text>
              <Text style={styles.ayudaFoto}>
                Utiliza el botón inferior para abrir la cámara.
              </Text>
            </View>
          )}
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={tomandoFoto}
          onPress={() => void tomar()}
          style={({ pressed }) => [
            styles.boton,
            pressed && styles.botonPresionado,
            tomandoFoto && styles.botonDeshabilitado,
          ]}
        >
          <Text style={styles.botonTexto}>
            {tomandoFoto
              ? 'Abriendo la cámara…'
              : datos.fotoNombre !== null
                ? 'Repetir fotografía'
                : 'Tomar fotografía'}
          </Text>
        </Pressable>

        {permisoDenegado && (
          <View style={styles.aviso}>
            <Text style={styles.avisoTitulo}>Permiso de cámara denegado</Text>
            <Text style={styles.avisoTexto}>
              {obligatoria
                ? 'Mientras no concedas el permiso, este registro no puede avanzar.'
                : 'Puedes continuar sin fotografía porque es opcional.'}
            </Text>
          </View>
        )}

        {mensaje !== null && (
          <View style={styles.errorContenedor}>
            <Text accessibilityRole="alert" style={styles.error}>
              {mensaje}
            </Text>
          </View>
        )}

        <Pressable
          accessibilityRole="button"
          onPress={avanzar}
          style={({ pressed }) => [
            styles.botonSecundario,
            pressed && styles.botonSecundarioPresionado,
          ]}
        >
          <Text style={styles.botonSecundarioTexto}>
            {obligatoria && datos.fotoNombre === null
              ? 'Se requiere la fotografía para continuar'
              : 'Siguiente: resumen'}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/registro/revision_consumo')}
          style={styles.botonVolver}
        >
          <Text style={styles.botonVolverTexto}>
            ← Volver a revisión del consumo
          </Text>
        </Pressable>

        <Text style={styles.notaPie}>
          Verifica la evidencia antes de continuar con el resumen del registro.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: COLORES.fondo,
  },
  encabezado: {
    backgroundColor: COLORES.azulOscuro,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 27,
  },
  orbeSuperior: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(34,178,224,0.12)',
    top: -95,
    right: -45,
  },
  orbeInferior: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(0,207,190,0.10)',
    bottom: -75,
    left: 90,
  },
  marca: {
    color: COLORES.celeste,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  paso: {
    color: '#B8D8EC',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: 24,
  },
  titulo: {
    color: COLORES.blanco,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.7,
    marginTop: 7,
  },
  descripcion: {
    color: '#D5EAF7',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    maxWidth: 320,
  },
  progresoContenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 22,
  },
  progresoFondo: {
    height: 5,
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progresoActivo: {
    width: '80%',
    height: '100%',
    backgroundColor: COLORES.celeste,
    borderRadius: 5,
  },
  progresoTexto: {
    color: '#D5EAF7',
    fontSize: 11,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  contenido: {
    padding: 20,
    paddingBottom: 34,
    gap: 16,
  },
  tarjetaMedidor: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORES.blanco,
    borderRadius: 22,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E1EDF4',
  },
  iconoMedidor: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5F5FC',
  },
  iconoMedidorTexto: {
    color: COLORES.azul,
    fontSize: 17,
    fontWeight: '800',
  },
  datosMedidor: {
    flex: 1,
    gap: 5,
  },
  etiqueta: {
    color: COLORES.secundario,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  codigoMedidor: {
    color: COLORES.azulOscuro,
    fontSize: 20,
    fontWeight: '800',
  },
  estadoEtiqueta: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  estadoObligatorio: {
    backgroundColor: COLORES.ambarFondo,
  },
  estadoOpcional: {
    backgroundColor: COLORES.verdeFondo,
  },
  estadoEtiquetaTexto: {
    fontSize: 11,
    fontWeight: '800',
  },
  textoObligatorio: {
    color: COLORES.ambar,
  },
  textoOpcional: {
    color: COLORES.verde,
  },
  tarjeta: {
    backgroundColor: COLORES.blanco,
    borderRadius: 22,
    padding: 18,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E1EDF4',
  },
  tarjetaAdvertencia: {
    borderLeftWidth: 4,
    borderLeftColor: '#E7A12B',
  },
  tarjetaPositiva: {
    borderLeftWidth: 4,
    borderLeftColor: '#22A783',
  },
  encabezadoTarjeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  puntoEstado: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  puntoAmbar: {
    backgroundColor: '#E7A12B',
  },
  puntoVerde: {
    backgroundColor: '#22A783',
  },
  tituloTarjeta: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
  },
  textoSecundario: {
    color: COLORES.secundario,
    fontSize: 13,
    lineHeight: 20,
  },
  seccion: {
    gap: 5,
    marginTop: 2,
  },
  tituloSeccion: {
    color: COLORES.azulOscuro,
    fontSize: 19,
    fontWeight: '800',
  },
  subtituloSeccion: {
    color: COLORES.secundario,
    fontSize: 13,
    lineHeight: 19,
  },
  areaFoto: {
    backgroundColor: COLORES.blanco,
    borderColor: COLORES.borde,
    borderRadius: 24,
    borderWidth: 1,
    padding: 12,
    overflow: 'hidden',
  },
  vistaPrevia: {
    width: '100%',
    height: 270,
    borderRadius: 16,
    backgroundColor: '#EAF1F5',
  },
  insigniaFoto: {
    alignSelf: 'flex-start',
    marginTop: 12,
    borderRadius: 10,
    backgroundColor: COLORES.verdeFondo,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  insigniaFotoTexto: {
    color: COLORES.verde,
    fontSize: 12,
    fontWeight: '800',
  },
  contenedorSinFoto: {
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  iconoCamara: {
    width: 62,
    height: 62,
    borderRadius: 22,
    backgroundColor: '#E5F5FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconoCamaraTexto: {
    color: COLORES.azul,
    fontSize: 36,
    fontWeight: '400',
    lineHeight: 40,
  },
  sinFoto: {
    color: COLORES.texto,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 21,
  },
  ayudaFoto: {
    color: COLORES.secundario,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  boton: {
    minHeight: 54,
    backgroundColor: COLORES.azul,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  botonPresionado: {
    backgroundColor: COLORES.azulPresionado,
  },
  botonDeshabilitado: {
    opacity: 0.6,
  },
  botonTexto: {
    color: COLORES.blanco,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  botonSecundario: {
    minHeight: 54,
    backgroundColor: COLORES.blanco,
    borderColor: '#A8D5E9',
    borderWidth: 1,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  botonSecundarioPresionado: {
    backgroundColor: '#E5F3FA',
  },
  botonSecundarioTexto: {
    color: COLORES.azulOscuro,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  aviso: {
    backgroundColor: COLORES.ambarFondo,
    borderColor: '#F0D69F',
    borderWidth: 1,
    borderRadius: 16,
    padding: 15,
    gap: 6,
  },
  avisoTitulo: {
    color: COLORES.ambar,
    fontSize: 13,
    fontWeight: '800',
  },
  avisoTexto: {
    color: COLORES.texto,
    fontSize: 13,
    lineHeight: 19,
  },
  errorContenedor: {
    backgroundColor: COLORES.rojoFondo,
    borderColor: '#F3C5CE',
    borderWidth: 1,
    borderRadius: 15,
    padding: 14,
  },
  error: {
    color: COLORES.rojo,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 20,
  },
  botonVolver: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  botonVolverTexto: {
    color: COLORES.secundario,
    fontSize: 13,
    fontWeight: '700',
  },
  notaPie: {
    color: COLORES.secundario,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 2,
  },
  texto: {
  color: COLORES.texto,
  fontSize: 14,
  lineHeight: 21,
},
});