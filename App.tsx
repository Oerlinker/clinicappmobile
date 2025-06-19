import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthContext, AuthProvider } from './src/context/AuthContext';
import AuthNavigator from './src/navigation/AuthNavigator';
import PacienteTabNavigator from './src/navigation/AppNavigator';
import AdminDrawerNavigator from './src/navigation/DrawerNavigator';
import EnfermeraDrawerNavigator from './src/navigation/EnfermeraDrawerNavigator';
import DoctorDrawerNavigator from './src/navigation/DoctorDrawerNavigator';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as PaperProvider } from 'react-native-paper';
import { theme } from './src/theme';
import { DefaultTheme as NavigationDefaultTheme, Theme as NavigationTheme } from '@react-navigation/native';

const queryClient = new QueryClient();

function RootNavigator() {
  const { user, isLoading, isAuthenticated } = useContext(AuthContext);

  if (isLoading) {
    return null;
  }

  const getUserRole = () => {
    if (!user) return null;
    if (user.rol?.nombre) return user.rol.nombre.toUpperCase();
    if ((user as any).role) return (user as any).role.toUpperCase();
    return null;
  };

  const userRole = getUserRole();
  console.log('App.tsx - Rol detectado:', userRole);

  if (!isAuthenticated) {
    return <AuthNavigator />;
  } else if (userRole === 'ADMIN') {
    return <AdminDrawerNavigator />;
  } else if (userRole === 'ENFERMERA') {
    return <EnfermeraDrawerNavigator />;
  } else if (userRole === 'DOCTOR') {
    console.log('Redirigiendo a DoctorDrawerNavigator');
    return <DoctorDrawerNavigator />;
  } else {
    return <PacienteTabNavigator />;
  }
}

function App() {
  const navigationTheme: NavigationTheme = {
    ...NavigationDefaultTheme,
    colors: {
      ...NavigationDefaultTheme.colors,
      background: theme.colors.background,
    },
  };
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PaperProvider theme={theme}>
          <NavigationContainer theme={navigationTheme}>
            <RootNavigator />
          </NavigationContainer>
        </PaperProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
