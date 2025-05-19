// src/navigation/EnfermeraDrawerNavigator.tsx
import React from 'react';
import {createDrawerNavigator} from '@react-navigation/drawer';
import ProfileScreen from '../screen/ProfileScreen.tsx';
import TriajeScreen from '../screen/TriajeScreen';

export type EnfermeraDrawerParamList = {
  Triaje: undefined;
  Perfil: undefined;
};

const Drawer = createDrawerNavigator<EnfermeraDrawerParamList>();

export default function EnfermeraDrawerNavigator() {
  return (
    <Drawer.Navigator
      initialRouteName="Triaje"
      screenOptions={{headerShown: true}}>
      <Drawer.Screen name="Triaje" component={TriajeScreen} />
      <Drawer.Screen
        name="Perfil"
        component={ProfileScreen}
      />
    </Drawer.Navigator>
  );
}
