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
import DeptManagementScreen from '../screen/DeptManagementScreen.tsx';
import ServiciosManagementScreen from '../screen/ServiciosManagementScreen.tsx';
import PatologiasManagementScreen from '../screen/PatologiasManagementScreen.tsx';

export type AdminDrawerParamList = {
  Roles: undefined;
  Empleados: undefined;
  RegistrarEmpleado: undefined;
  Bitacora: undefined;
  'Reportes Citas': undefined;
  'Reportes Disponibilidades': undefined;
  Disponibilidades: undefined;
  Departamentos: undefined;
  Servicios: undefined;
  Patologias: undefined;
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
      <Drawer.Screen name="Departamentos" component={DeptManagementScreen} />
      <Drawer.Screen name="Servicios" component={ServiciosManagementScreen} />
      <Drawer.Screen name="Patologias" component={PatologiasManagementScreen} />
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
