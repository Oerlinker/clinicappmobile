import React, {useState, useContext, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import {AuthContext} from '../context/AuthContext';
import api from '../api';
import {format} from 'date-fns';
import {es} from 'date-fns/locale';
import AppointmentForm from '../components/AppointmentForm';

interface Doctor {
  id: number;
  usuario: {
    nombre: string;
    apellido: string;
  };
}

interface Appointment {
  id: number;
  fecha: string;
  hora: string;
  estado: string;
  tipo: string;
  paciente: {
    id: number;
  };
  doctor: Doctor;
}

const AppointmentScreen = () => {
  const {user} = useContext(AuthContext);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchAppointments = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await api.get(`/citas/usuario/${user.id}`);
      setAppointments(response.data);
    } catch (error) {
      console.error('Error al cargar citas:', error);
      Alert.alert('Error', 'No se pudieron cargar tus citas');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleCreateSuccess = () => {
    setModalVisible(false);
    fetchAppointments();
    Alert.alert('Éxito', 'Cita agendada correctamente');
  };

  const getStatusColor = (estado: string) => {
    switch (estado?.toLowerCase()) {
      case 'agendada':
        return '#4CAF50'; // Verde
      case 'completada':
        return '#2196F3'; // Azul
      case 'cancelada':
        return '#F44336'; // Rojo
      default:
        return '#9E9E9E'; // Gris
    }
  };

  const renderAppointmentItem = ({item}: {item: Appointment}) => (
    <View style={styles.appointmentCard}>
      <View style={styles.appointmentHeader}>
        <Text style={styles.dateText}>
          {format(new Date(item.fecha), 'dd MMM yyyy', {locale: es})}
        </Text>
        <Text style={styles.timeText}>{item.hora}</Text>
      </View>

      <Text style={styles.doctorName}>
        Dr. {item.doctor.usuario.nombre} {item.doctor.usuario.apellido}
      </Text>

      <Text style={styles.appointmentType}>Tipo: {item.tipo}</Text>

      <View
        style={[
          styles.statusBadge,
          {backgroundColor: getStatusColor(item.estado)},
        ]}>
        <Text style={styles.statusText}>{item.estado}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Citas</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}>
          <Text style={styles.addButtonText}>+ Nueva Cita</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listContainer}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#2196F3" />
          </View>
        ) : appointments.length > 0 ? (
          <FlatList
            data={appointments}
            renderItem={renderAppointmentItem}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={{padding: 8}}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No tienes citas agendadas. ¿Quieres agendar una cita ahora?
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => setModalVisible(true)}>
              <Text style={styles.emptyButtonText}>Agendar Cita</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Modal
        animationType="slide"
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Agendar Nueva Cita</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          <AppointmentForm
            onSuccess={handleCreateSuccess}
            onCancel={() => setModalVisible(false)}
          />
        </View>
      </Modal>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
  },
  appointmentCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  timeText: {
    fontSize: 16,
    color: '#333',
  },
  doctorName: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  appointmentType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  reason: {
    fontSize: 13,
    color: '#777',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 4,
  },
  emptyButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#2196F3',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  closeButton: {
    fontSize: 22,
    color: 'white',
    fontWeight: 'bold',
  },
});

export default AppointmentScreen;
