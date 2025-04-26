import React, {useContext} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {AuthContext} from '../context/AuthContext';
import AppNavigator from './AppNavigator';
import AuthNavigator from './AuthNavigator';
import {ActivityIndicator, View} from 'react-native';

const Navigation = () => {
  const {isAuthenticated, isLoading} = useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default Navigation;
