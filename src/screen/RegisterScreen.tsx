import React, {useState, useContext} from 'react';
import {
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {AuthContext} from '../context/AuthContext';

const RegisterScreen = () => {
  const navigation = useNavigation();
  const {register} = useContext(AuthContext);
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu nombre');
      return false;
    }
    if (!apellido.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu apellido');
      return false;
    }
    if (!email.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu email');
      return false;
    }
    if (!password) {
      Alert.alert('Error', 'Por favor ingresa una contraseña');
      return false;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await register(nombre, apellido, email, password);

      Alert.alert(
        'Registro exitoso',
        'Tu cuenta ha sido creada. Ahora puedes iniciar sesión.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login' as never),
          },
        ],
      );
    } catch (error: any) {
      const message =
        error.response?.data?.message || 'Error al registrar usuario';
      Alert.alert('Error en el registro', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Crear Cuenta</Text>

      <TextInput
        style={styles.input}
        placeholder="Nombre"
        placeholderTextColor="#666"
        value={nombre}
        onChangeText={setNombre}
        autoCapitalize="words"
      />

      <TextInput
        style={styles.input}
        placeholder="Apellido"
        placeholderTextColor="#666"
        value={apellido}
        onChangeText={setApellido}
        autoCapitalize="words"
      />

      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        placeholderTextColor="#666"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        placeholderTextColor="#666"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TextInput
        style={styles.input}
        placeholder="Confirmar contraseña"
        placeholderTextColor="#666"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <TouchableOpacity
        style={styles.registerBtn}
        onPress={handleRegister}
        disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.btnText}>Registrarse</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.loginLink}
        onPress={() => navigation.navigate('Login' as never)}>
        <Text style={styles.loginLinkText}>
          ¿Ya tienes cuenta? Inicia sesión
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    marginBottom: 12,
    padding: 10,
  },
  registerBtn: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 10,
  },
  btnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loginLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  loginLinkText: {
    color: '#2196F3',
    fontSize: 14,
  },
});

export default RegisterScreen;
