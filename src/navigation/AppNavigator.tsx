import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import { theme } from '../theme';

import HomeScreen from '../screen/HomeScreen';
import AppointmentScreen from '../screen/AppointmentScreen';
import ProfileScreen from '../screen/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerTitleAlign: 'center',
        headerStyle: {
          backgroundColor: theme.colors.primary,
          borderBottomLeftRadius: 16,
          borderBottomRightRadius: 16,
          elevation: 4,
        },
        headerTitleStyle: {
          color: '#fff',
          fontWeight: 'bold',
          fontSize: 20,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: '#b0b0b0',
        tabBarStyle: {
          height: 62,
          paddingBottom: 8,
          paddingTop: 8,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          backgroundColor: '#fff',
          elevation: 8,
          overflow: 'hidden',
        },
        tabBarLabelStyle: {
          fontSize: 13,
          marginBottom: 4,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Inicio',
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color, fontSize: size }}>🏠</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Citas"
        component={AppointmentScreen}
        options={{
          tabBarLabel: 'Citas',
          title: 'Citas',
          tabBarIcon: ({ color, size }) => (
            <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color, fontSize: size }}>📅</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Perfil"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Perfil',
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color, fontSize: size }}>👤</Text>
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}
