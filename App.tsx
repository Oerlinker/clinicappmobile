import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthContext, AuthProvider } from './src/context/AuthContext';
import AuthNavigator from './src/navigation/AuthNavigator';
import PacienteTabNavigator from './src/navigation/AppNavigator';
import AdminDrawerNavigator from './src/navigation/DrawerNavigator';
import EnfermeraDrawerNavigator from './src/navigation/EnfermeraDrawerNavigator';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as PaperProvider } from 'react-native-paper';

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

  if (!isAuthenticated) {
    return <AuthNavigator />;
  } else if (userRole === 'ADMIN') {
    return <AdminDrawerNavigator />;
  } else if (userRole === 'ENFERMERA') {
    return <EnfermeraDrawerNavigator />;
  } else {
    return <PacienteTabNavigator />;
  }
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PaperProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </PaperProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
