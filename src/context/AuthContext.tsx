import React, {createContext, useState, useEffect, ReactNode} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api';

type User = {
  id: string | number;
  email: string;
  name?: string;
  role?: string;
  username?: string;
  nombre?: string;
  apellido?: string;
  rol?: {
    id: number;
    nombre: string;
  };
  fechaRegistro?: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (nombre: string, apellido: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: false,
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<{children: ReactNode}> = ({children}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userString = await AsyncStorage.getItem('user');
        const token = await AsyncStorage.getItem('token');

        if (userString && token) {
          setUser(JSON.parse(userString));
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error cargando datos de usuario:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', {email, password});
      console.log('Respuesta completa:', JSON.stringify(response.data));

      const {token, user: userData} = response.data;

      // Asegurarse de que el objeto de usuario tenga la estructura correcta
      const userToStore = userData || response.data;

      // Log adicional para depurar el rol
      console.log('Rol del usuario en login:', userToStore?.rol);

      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(userToStore));

      // Configurar el token en el header para futuras solicitudes
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      setUser(userToStore);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error en logout:', error);
    }
  };
  const register = async (nombre: string, apellido: string, email: string, password: string) => {
    try {
      await api.post('/auth/register', {
        nombre,
        apellido,
        email,
        password,
      });
    } catch (error) {
      console.error('Error en registro:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        login,
        register,
        logout,
      }}>
      {children}
    </AuthContext.Provider>
  );
};
