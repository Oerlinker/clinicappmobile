import React, {useContext} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {View, ActivityIndicator} from 'react-native';
import {AuthContext} from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';
import DrawerNavigator from './DrawerNavigator';
import EnfermeraDrawerNavigator from './EnfermeraDrawerNavigator.tsx';

const Navigation = () => {
  const {isAuthenticated, isLoading, user} = useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!isAuthenticated ? (
        <AuthNavigator />
      ) : user?.rol?.nombre === 'ADMIN' ? (
        <DrawerNavigator />
      ) : user?.rol?.nombre === 'ENFERMERA' ? (
        <EnfermeraDrawerNavigator />
      ) : user?.rol?.nombre === 'PACIENTE' ? (
        <AppNavigator />
      ) : (
        <AppNavigator />
      )}
    </NavigationContainer>
  );
};

export default Navigation;
