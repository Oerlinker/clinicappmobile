import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import HomeScreen from '../screen/HomeScreen';
import ProfileScreen from '../screen/ProfileScreen';
import AppointmentScreen from '../screen/AppointmentScreen';
import {Text} from 'react-native';

const Tab = createBottomTabNavigator();

const AppNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: 'gray',
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Inicio',
          tabBarIcon: ({color, size}) => (
            <Text style={{color, fontSize: size}}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Appointment"
        component={AppointmentScreen}
        options={{
          tabBarLabel: 'Citas',
          tabBarIcon: ({color, size}) => (
            <Text style={{color, fontSize: size}}>📅</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Perfil"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({color, size}) => (
            <Text style={{color, fontSize: size}}>👤</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default AppNavigator;
