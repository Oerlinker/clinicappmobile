import React, {useContext, useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {View, ActivityIndicator, Text} from 'react-native';
import {AuthContext} from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';
import DrawerNavigator from './DrawerNavigator';
import EnfermeraDrawerNavigator from './EnfermeraDrawerNavigator.tsx';
import DoctorDrawerNavigator from './DoctorDrawerNavigator.tsx';

const Navigation = () => {
  const {isAuthenticated, isLoading, user} = useContext(AuthContext);

  // Log para depurar
  useEffect(() => {
    if (user) {
      console.log('Usuario autenticado:', JSON.stringify(user));
      console.log('Rol del usuario:', user?.rol?.nombre);
    }
  }, [user]);

  if (isLoading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  // Determinar qué navegador mostrar según el rol
  const renderNavigator = () => {
    if (!isAuthenticated) {
      return <AuthNavigator />;
    }

    if (!user?.rol?.nombre) {
      return (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20}}>
          <Text style={{color: 'red', textAlign: 'center'}}>
            Error: Usuario autenticado pero sin información de rol.
          </Text>
        </View>
      );
    }

    const rolNombre = user.rol.nombre.trim().toUpperCase();
    console.log('Evaluando navegador para rol:', rolNombre);

    switch (rolNombre) {
      case 'ADMIN':
        return <DrawerNavigator />;
      case 'ENFERMERA':
        return <EnfermeraDrawerNavigator />;
      case 'DOCTOR':
        console.log('➡️ Mostrando DoctorDrawerNavigator');
        return <DoctorDrawerNavigator />;
      case 'PACIENTE':
        return <AppNavigator />;
      default:
        console.log('⚠️ Rol no reconocido, usando navegador por defecto');
        return <AppNavigator />;
    }
  };

  return (
    <NavigationContainer>
      {renderNavigator()}
    </NavigationContainer>
  );
};

export default Navigation;
