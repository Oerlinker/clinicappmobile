// src/navigation/DoctorDrawerNavigator.tsx
import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import ProfileScreen from '../screen/ProfileScreen.tsx';
import VerTriajeScreen from '../screen/doctor/VerTriajeScreen.tsx';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DoctorCitasScreen from '../screen/doctor/DoctorCitasScreen.tsx';
import AtencionFormScreen from '../screen/doctor/AtencionFormScreen.tsx';

export type DoctorDrawerParamList = {
  CitasStack: undefined;
  Perfil: undefined;
};

export type DoctorStackParamList = {
  Citas: undefined;
  VerTriaje: {
    citaId: number;
  };
  AtencionForm: {
    citaId: number;
  };
};

const Drawer = createDrawerNavigator<DoctorDrawerParamList>();
const Stack = createNativeStackNavigator<DoctorStackParamList>();

const CitasStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Citas" component={DoctorCitasScreen} />
      <Stack.Screen name="VerTriaje" component={VerTriajeScreen} />
      <Stack.Screen name="AtencionForm" component={AtencionFormScreen} />
    </Stack.Navigator>
  );
};

export default function DoctorDrawerNavigator() {
  return (
    <Drawer.Navigator
      initialRouteName="CitasStack"
      screenOptions={{ headerShown: true }}>
      <Drawer.Screen
        name="CitasStack"
        component={CitasStackNavigator}
        options={{ title: 'Mis Citas' }}
      />
      <Drawer.Screen
        name="Perfil"
        component={ProfileScreen}
      />
    </Drawer.Navigator>
  );
}
