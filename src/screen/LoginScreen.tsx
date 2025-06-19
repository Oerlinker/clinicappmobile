import React, {useState, useContext} from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import {useNavigation} from '@react-navigation/native';
import { TextInput, Button, Title } from 'react-native-paper';
import { theme } from '../theme';
import {AuthContext} from '../context/AuthContext';

const LoginScreen: React.FC = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const {login} = useContext(AuthContext);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor ingresa email y contraseña');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
    } catch (error: any) {
      Alert.alert(
        'Error de inicio de sesión',
        error.response?.data?.message || 'Error al iniciar sesión',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Title style={styles.title}>Iniciar Sesión</Title>
      <TextInput
        mode="outlined"
        label="Correo electrónico"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />
      <TextInput
        mode="outlined"
        label="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      <Button
        mode="contained"
        onPress={handleLogin}
        loading={isLoading}
        buttonColor={theme.colors.primary}
        style={styles.btn}
      >
        Iniciar Sesión
      </Button>
      <Button
        mode="text"
        onPress={() => navigation.navigate('Register' as never)}
        textColor={theme.colors.primary}
        style={styles.registerLink}
      >
        ¿No tienes cuenta? Regístrate
      </Button>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  input: { marginBottom: 12 },
  btn: { marginTop: 8 },
  registerLink: { marginTop: 16 },
});
