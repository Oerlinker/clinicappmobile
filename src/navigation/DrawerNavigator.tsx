import React from 'react';
import {createDrawerNavigator} from '@react-navigation/drawer';

import RoleManagementScreen from '../screen/RoleManagementScreen';
import EmployeeManagementScreen from '../screen/EmployeeManagementScreen';
import BitacoraScreen from '../screen/BitacoraScreen';
import CitaReportScreen from '../screen/CitaReportScreen';
import DisponibilidadReportScreen from '../screen/DisponibilidadReportScreen';
import DisponibilidadManagementScreen from '../screen/DisponibilidadManagementScreen';
import EmployeeRegisterScreen from '../screen/EmployeeRegisterScreen';
import ProfileScreen from '../screen/ProfileScreen.tsx';

export type AdminDrawerParamList = {
  Roles: undefined;
  Empleados: undefined;
  RegistrarEmpleado: undefined;
  Bitacora: undefined;
  'Reportes Citas': undefined;
  'Reportes Disponibilidades': undefined;
  Disponibilidades: undefined;
  Perfil: undefined;
};

const Drawer = createDrawerNavigator<AdminDrawerParamList>();

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator
      initialRouteName="Roles"
      screenOptions={{headerShown: true}}>
      <Drawer.Screen name="Roles" component={RoleManagementScreen} />
      <Drawer.Screen name="Empleados" component={EmployeeManagementScreen} />
      <Drawer.Screen name="Bitacora" component={BitacoraScreen} />
      <Drawer.Screen name="Reportes Citas" component={CitaReportScreen} />
      <Drawer.Screen
        name="Reportes Disponibilidades"
        component={DisponibilidadReportScreen}
      />
      <Drawer.Screen
        name="Disponibilidades"
        component={DisponibilidadManagementScreen}
      />

      <Drawer.Screen
        name="RegistrarEmpleado"
        component={EmployeeRegisterScreen}
        options={{title: 'Registrar Empleado'}}
      />
      <Drawer.Screen
        name="Perfil"
        component={ProfileScreen}
      />
    </Drawer.Navigator>
  );
}
