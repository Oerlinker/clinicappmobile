// filepath: c:\Users\andre\clinicappmobile\src\screen\doctor\DoctorCitasScreen.tsx
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {Button} from 'react-native-paper';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import api from '../../api';
import {format, parseISO, startOfDay} from 'date-fns';
import {es} from 'date-fns/locale';
import {theme} from '../../theme';

interface Paciente {
  id: number;
  nombre: string;
  apellido: string;
}

interface Cita {
  id: number;
  fecha: string;
  hora: string;
  estado: string;
  paciente: Paciente;
  doctor: {id: number};
}

const DoctorCitasScreen = () => {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [hasTriajeMap, setHasTriajeMap] = useState<Record<number, boolean>>({});

  // Consulta para obtener las citas del doctor
  const {data: citas, isLoading} = useQuery({
    queryKey: ['citas-doctor'],
    queryFn: async () => {
      const response = await api.get<Cita[]>('/citas/mis-citas-doctor');

      // Filtrar solo las citas de hoy que están agendadas
      const hoy = startOfDay(new Date());
      return response.data.filter(c =>
        startOfDay(parseISO(c.fecha)).getTime() >= hoy.getTime() &&
        c.estado === "AGENDADA"
      );
    },
  });

  // Verificar cuáles citas ya tienen triaje
  useEffect(() => {
    if (citas && citas.length > 0) {
      const checkTriaje = async () => {
        const map: Record<number, boolean> = {};

        await Promise.all(
          citas.map(async c => {
            try {
              await api.get(`/triajes/cita/${c.id}`);
              map[c.id] = true;
            } catch {
              map[c.id] = false;
            }
          })
        );

        setHasTriajeMap(map);
      };

      checkTriaje();
    }
  }, [citas]);

  // Mutación para marcar cita como realizada
  const realizarCitaMutation = useMutation({
    mutationFn: async (citaId: number) => {
      await api.patch(`/citas/${citaId}/realizar`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['citas-doctor']});
    },
  });

  // Mutación para cancelar cita
  const cancelarCitaMutation = useMutation({
    mutationFn: async (citaId: number) => {
      await api.patch(`/citas/${citaId}/cancelar-doctor`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['citas-doctor']});
    },
  });

  const handleVerTriaje = (citaId: number) => {
    navigation.navigate('VerTriaje' as never, {citaId} as never);
  };

  const handleRegistrarAtencion = (citaId: number) => {
    navigation.navigate('AtencionForm' as never, {citaId} as never);
  };

  const handleRealizarCita = (citaId: number) => {
    realizarCitaMutation.mutate(citaId);
  };

  const handleCancelarCita = (citaId: number) => {
    cancelarCitaMutation.mutate(citaId);
  };

  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), "dd 'de' MMMM, yyyy", {locale: es});
  };

  const formatTime = (timeString: string) => {
    return timeString.substring(11, 16);
  };

  const renderCitaItem = ({item}: {item: Cita}) => (
    <View style={styles.citaCard}>
      <View style={styles.citaHeader}>
        <Text style={styles.fecha}>{formatDate(item.fecha)}</Text>
        <Text style={styles.hora}>{formatTime(item.hora)}</Text>
      </View>

      <View style={styles.citaBody}>
        <Text style={styles.label}>Paciente:</Text>
        <Text style={styles.value}>{item.paciente.nombre} {item.paciente.apellido}</Text>

        <Text style={styles.label}>Estado:</Text>
        <Text style={styles.value}>{item.estado}</Text>
      </View>

      <View style={styles.buttonContainer}>
        {hasTriajeMap[item.id] && (
          <>
            <Button
              mode="contained"
              style={styles.button}
              onPress={() => handleVerTriaje(item.id)}>
              Ver Triaje
            </Button>
            <Button
              mode="contained"
              style={styles.button}
              onPress={() => handleRegistrarAtencion(item.id)}>
              Registrar Atención
            </Button>
          </>
        )}
        <Button
          mode="contained"
          style={styles.button}
          onPress={() => handleRealizarCita(item.id)}>
          Realizada
        </Button>
        <Button
          mode="outlined"
          style={styles.button}
          onPress={() => handleCancelarCita(item.id)}>
          Cancelar
        </Button>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Cargando citas...</Text>
      </View>
    );
  }

  if (!citas || citas.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No tiene citas agendadas para hoy</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Citas de hoy</Text>
      <FlatList
        data={citas}
        renderItem={renderCitaItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    color: theme.colors.primary,
  },
  listContainer: {
    paddingBottom: 20,
  },
  citaCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  citaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  fecha: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  hora: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  citaBody: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  value: {
    fontSize: 16,
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-start',
  },
  button: {
    marginRight: 8,
    marginBottom: 8,
  },
});

export default DoctorCitasScreen;
