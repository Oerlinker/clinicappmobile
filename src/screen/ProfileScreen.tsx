import React, {useContext} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Alert} from 'react-native';
import {AuthContext} from '../context/AuthContext';

const ProfileScreen = () => {
  const {user, logout} = useContext(AuthContext);
  console.log('Datos de usuario en perfil:', user);

  const handleLogout = async () => {
    try {
      await logout();

      Alert.alert('Sesión cerrada', 'Has cerrado sesión correctamente', [
        {text: 'OK'},
      ]);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Perfil de Usuario</Text>
      {user && (
        <View style={styles.userInfo}>
          <Text style={styles.userField}>
            Nombre: {user.nombre || user.name || '-'}
          </Text>
          <Text style={styles.userField}>Apellido: {user.apellido || '-'}</Text>
          <Text style={styles.userField}>Email: {user.email || '-'}</Text>
          <Text style={styles.userField}>
            Rol: {user.rol?.nombre || user.role || '-'}
          </Text>
        </View>
      )}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#000',
  },
  userInfo: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  userField: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  logoutBtn: {
    backgroundColor: '#f44336',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  logoutText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default ProfileScreen;
