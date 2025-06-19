import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import api from '../../api';
import { Button } from 'react-native-paper';
import { theme } from '../../theme';

type RouteParamList = {
  VerTriaje: {
    citaId: number;
  };
};

interface TriajeDTO {
  id: number;
  citaId: number;
  fechaHoraRegistro: string;
  presionArterial: number;
  frecuenciaCardiaca: number;
  temperatura: number;
  peso: number;
  altura: number;
  comentarios: string;
}

const VerTriajeScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParamList, 'VerTriaje'>>();
  const citaId = route.params?.citaId;

  const { data, isLoading, error } = useQuery<TriajeDTO>({
    queryKey: ['triaje', citaId],
    queryFn: () => api.get(`/triajes/cita/${citaId}`).then(res => res.data),
    enabled: Boolean(citaId),
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Cargando triaje...</Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error al cargar el triaje.</Text>
        <Button mode="contained" onPress={() => navigation.goBack()} style={styles.button}>
          Volver atrás
        </Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Detalle de Triaje</Text>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Registro</Text>
        <Text style={styles.value}>
          {new Date(data.fechaHoraRegistro).toLocaleString()}
        </Text>
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Presión Arterial</Text>
        <Text style={styles.value}>{data.presionArterial}</Text>
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Frecuencia Cardíaca</Text>
        <Text style={styles.value}>{data.frecuenciaCardiaca}</Text>
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Temperatura (°C)</Text>
        <Text style={styles.value}>{data.temperatura}</Text>
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Peso (kg)</Text>
        <Text style={styles.value}>{data.peso}</Text>
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Altura (m)</Text>
        <Text style={styles.value}>{data.altura}</Text>
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Comentarios</Text>
        <Text style={styles.value}>{data.comentarios}</Text>
      </View>

      <Button
        mode="outlined"
        onPress={() => navigation.goBack()}
        style={styles.button}
      >
        Volver a Citas
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#555',
  },
  value: {
    fontSize: 16,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    marginTop: 20,
    marginBottom: 40,
  },
});

export default VerTriajeScreen;
