import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { mensajeErrorSesion } from '../../components/authUi';
import { useSesion } from '../../contexts/SesionContext';

const colores = {
  fondo: '#EAF4F8',
  azul: '#062B52',
  azulMedio: '#087FC4',
  turquesa: '#65DCE5',
  blanco: '#FFFFFF',
  texto: '#173650',
  secundario: '#688196',
  borde: '#D5E5ED',
  error: '#C0394B',
  errorFondo: '#FFF0F1',
};

export default function LoginScreen() {
  const { iniciarSesion } = useSesion();

  const [codigo, setCodigo] = useState('');
  const [clave, setClave] = useState('');
  const [errorCampo, setErrorCampo] = useState({
    codigo: false,
    clave: false,
  });
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [ingresando, setIngresando] = useState(false);

  async function ingresar(): Promise<void> {
    setMensaje(null);

    const vacio = {
      codigo: codigo.trim().length === 0,
      clave: clave.trim().length === 0,
    };

    setErrorCampo(vacio);

    if (vacio.codigo || vacio.clave) {
      setMensaje('Ingresa tu código de empleado y tu clave.');
      return;
    }

    setIngresando(true);

    try {
      await iniciarSesion(codigo, clave);
      router.replace('/inicio');
    } catch (error: unknown) {
      setMensaje(mensajeErrorSesion(error));
    } finally {
      setIngresando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.contenedor}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contenido}>
          {/* Encabezado de marca */}
          <View style={styles.encabezado}>
            <View style={styles.orbeGrande} />
            <View style={styles.orbePequeno} />

            <View style={styles.marca}>
              <View style={styles.iconoMarca}>
                <Text style={styles.iconoTexto}>EA</Text>
              </View>
              <View>
                <Text style={styles.nombreMarca}>LECTURA ÁGIL</Text>
                <Text style={styles.submarca}>EPMAPS · GESTIÓN DE MEDIDORES</Text>
              </View>
            </View>

            <View style={styles.etiqueta}>
              <View style={styles.puntoActivo} />
              <Text style={styles.etiquetaTexto}>ACCESO PARA PERSONAL</Text>
            </View>

            <Text style={styles.titulo}>Bienvenido</Text>
            <Text style={styles.descripcion}>
              Identifícate para consultar medidores y gestionar las lecturas
              de tu jornada.
            </Text>

            <View style={styles.decoracion}>
              <View style={styles.lineaDecorativa} />
              <View style={styles.lineaCorta} />
            </View>
          </View>

          {/* Formulario */}
          <View style={styles.panel}>
            <View style={styles.indicadorPanel} />

            <Text style={styles.tituloFormulario}>Iniciar sesión</Text>
            <Text style={styles.textoFormulario}>
              Ingresa tus credenciales de empleado.
            </Text>

            <View style={styles.formulario}>
              <Text style={styles.label}>CÓDIGO DE EMPLEADO</Text>

              <View
                style={[
                  styles.campo,
                  errorCampo.codigo && styles.campoError,
                ]}
              >
                <Text style={styles.iconoCampo}>ID</Text>
                <TextInput
                  accessibilityLabel="Código de empleado"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  editable={!ingresando}
                  maxLength={20}
                  onChangeText={(value) => {
                    setCodigo(value);
                    setMensaje(null);
                    setErrorCampo((previo) => ({
                      ...previo,
                      codigo: false,
                    }));
                  }}
                  onSubmitEditing={() => undefined}
                  placeholder="Ej. TEC-0001"
                  placeholderTextColor="#8CA1B1"
                  returnKeyType="next"
                  style={styles.input}
                  value={codigo}
                />
              </View>

              <Text style={styles.label}>CLAVE DE ACCESO</Text>

              <View
                style={[
                  styles.campo,
                  errorCampo.clave && styles.campoError,
                ]}
              >
                <Text style={styles.iconoCampo}>●</Text>
                <TextInput
                  accessibilityLabel="Clave"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!ingresando}
                  maxLength={50}
                  onChangeText={(value) => {
                    setClave(value);
                    setMensaje(null);
                    setErrorCampo((previo) => ({
                      ...previo,
                      clave: false,
                    }));
                  }}
                  onSubmitEditing={() => void ingresar()}
                  placeholder="Ingresa tu clave"
                  placeholderTextColor="#8CA1B1"
                  returnKeyType="go"
                  secureTextEntry
                  style={styles.input}
                  value={clave}
                />
              </View>

              {mensaje !== null && (
                <View
                  accessibilityRole="alert"
                  style={styles.mensajeError}
                >
                  <Text style={styles.iconoError}>!</Text>
                  <Text style={styles.textoError}>{mensaje}</Text>
                </View>
              )}

              <Pressable
                accessibilityRole="button"
                disabled={ingresando}
                onPress={() => void ingresar()}
                style={({ pressed }) => [
                  styles.boton,
                  pressed && styles.botonPresionado,
                  ingresando && styles.botonDeshabilitado,
                ]}
              >
                {ingresando ? (
                  <ActivityIndicator color={colores.blanco} />
                ) : (
                  <>
                    <Text style={styles.textoBoton}>Ingresar al sistema</Text>
                    <Text style={styles.flecha}>→</Text>
                  </>
                )}
              </Pressable>

              <View style={styles.notaSeguridad}>
                <Text style={styles.iconoSeguridad}>✓</Text>
                <Text style={styles.textoSeguridad}>
                  Acceso exclusivo para personal autorizado.
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.pie}>
            <View style={styles.puntoPie} />
            <Text style={styles.textoPie}>LECTURA ÁGIL EPMAPS</Text>
            <Text style={styles.separadorPie}>·</Text>
            <Text style={styles.textoPie}>SISTEMA DE GESTIÓN</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colores.fondo,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingVertical: 28,
  },
  contenido: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
  },
  encabezado: {
    backgroundColor: colores.azul,
    borderRadius: 28,
    borderBottomLeftRadius: 12,
    paddingHorizontal: 25,
    paddingTop: 25,
    paddingBottom: 30,
    overflow: 'hidden',
  },
  orbeGrande: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(101,220,229,0.09)',
    top: -105,
    right: -65,
  },
  orbePequeno: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 1,
    borderColor: 'rgba(101,220,229,0.20)',
    bottom: -65,
    right: 35,
  },
  marca: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconoMarca: {
    width: 47,
    height: 47,
    borderRadius: 15,
    backgroundColor: 'rgba(101,220,229,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(101,220,229,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconoTexto: {
    color: colores.turquesa,
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -1,
  },
  nombreMarca: {
    color: colores.blanco,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  submarca: {
    color: '#B8D5E5',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1,
    marginTop: 5,
  },
  etiqueta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    marginTop: 29,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(101,220,229,0.25)',
    backgroundColor: 'rgba(101,220,229,0.09)',
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  puntoActivo: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colores.turquesa,
  },
  etiquetaTexto: {
    color: '#D5F7F8',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  titulo: {
    color: colores.blanco,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.8,
    marginTop: 21,
  },
  descripcion: {
    color: '#C1D5E4',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 9,
    maxWidth: 330,
  },
  decoracion: {
    flexDirection: 'row',
    gap: 5,
    marginTop: 23,
  },
  lineaDecorativa: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colores.turquesa,
  },
  lineaCorta: {
    width: 12,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(101,220,229,0.4)',
  },
  panel: {
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.95)',
    padding: 23,
    marginTop: -12,
    marginHorizontal: 8,
    shadowColor: '#153E5B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.09,
    shadowRadius: 22,
    elevation: 5,
  },
  indicadorPanel: {
    width: 35,
    height: 4,
    borderRadius: 2,
    backgroundColor: colores.turquesa,
    marginBottom: 19,
  },
  tituloFormulario: {
    color: colores.azul,
    fontSize: 23,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  textoFormulario: {
    color: colores.secundario,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    marginBottom: 23,
  },
  formulario: {
    gap: 11,
  },
  label: {
    color: colores.texto,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 4,
  },
  campo: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 53,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colores.borde,
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 14,
  },
  campoError: {
    borderColor: colores.error,
    backgroundColor: colores.errorFondo,
  },
  iconoCampo: {
    color: colores.azulMedio,
    width: 28,
    fontSize: 12,
    fontWeight: '900',
  },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 50,
    color: colores.texto,
    fontSize: 15,
    paddingVertical: 10,
  },
  mensajeError: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colores.errorFondo,
    borderWidth: 1,
    borderColor: '#F2CDD2',
    marginTop: 3,
  },
  iconoError: {
    color: colores.error,
    fontWeight: '900',
    fontSize: 15,
  },
  textoError: {
    flex: 1,
    color: colores.error,
    fontSize: 12,
    lineHeight: 18,
  },
  boton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    minHeight: 54,
    backgroundColor: colores.azulMedio,
    borderRadius: 14,
    marginTop: 10,
    paddingHorizontal: 18,
    shadowColor: colores.azulMedio,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.18,
    shadowRadius: 9,
    elevation: 3,
  },
  botonPresionado: {
    backgroundColor: colores.azul,
    transform: [{ scale: 0.99 }],
  },
  botonDeshabilitado: {
    opacity: 0.65,
  },
  textoBoton: {
    color: colores.blanco,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  flecha: {
    color: colores.turquesa,
    fontSize: 22,
    fontWeight: '700',
  },
  notaSeguridad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  iconoSeguridad: {
    color: '#16866C',
    fontSize: 13,
    fontWeight: '900',
  },
  textoSeguridad: {
    color: colores.secundario,
    fontSize: 11,
    textAlign: 'center',
    flexShrink: 1,
  },
  pie: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 24,
  },
  puntoPie: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colores.azulMedio,
  },
  textoPie: {
    color: colores.secundario,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.7,
  },
  separadorPie: {
    color: colores.turquesa,
    fontWeight: '900',
  },
});
