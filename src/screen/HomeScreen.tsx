import React, {useContext} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {AuthContext} from '../context/AuthContext';

const HomeScreen: React.FC = () => {
  const {user} = useContext(AuthContext);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenido, {user?.name}</Text>
      <Text style={styles.subtitle}>
        Esta es la pantalla principal de la aplicación.
      </Text>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
  },
});
