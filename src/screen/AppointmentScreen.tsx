// src/screens/AppointmentScreen.tsx
import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  Linking,
  TouchableOpacity,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import api from '../api';
import AppointmentForm from '../components/AppointmentForm';

export default function AppointmentScreen() {
  const { user } = useContext(AuthContext);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  // 1) Función para cargar tus citas
  const fetchAppointments = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const resp = await api.get('/citas/mis-citas');
      setAppointments(resp.data);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar tus citas');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // 2) Al crear una nueva cita: cierra modal, recarga y abre Stripe
  const handleCreateSuccess = async (newCita:{id:number;precio:number}) => {
    setModalVisible(false);
    await fetchAppointments();
    try {
      const { data } = await api.post('/payments/create-checkout-session', {
        citaId: newCita.id,
        pacienteId: user!.id,
        amount: newCita.precio,
        currency: 'USD',
      });
      Linking.openURL(data.url);
    } catch {
      Alert.alert('Error', 'No se pudo iniciar el pago');
    }
  };

  // 3) Función para cancelar una cita
  const handleCancel = (citaId: number) => {
    Alert.alert(
      'Confirmar cancelación',
      '¿Estás seguro de que deseas cancelar esta cita?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.patch(`/citas/${citaId}/cancelar`);
              Alert.alert('Cita cancelada', 'Tu cita ha sido cancelada exitosamente.');
              fetchAppointments();
            } catch {
              Alert.alert('Error', 'No se pudo cancelar la cita.');
            }
          }
        }
      ]
    );
  };

  // 4) Render de cada tarjeta
  const renderItem = ({ item }: { item:any }) => (
    <View style={styles.card}>
      <Text style={styles.line}>
        <Text style={styles.bold}>{item.fecha}</Text> – {item.hora.split('T')[1].slice(0,5)}
      </Text>
      <Text style={styles.line}>{item.tipo}</Text>
      <Text style={styles.line}>
        Dr. {item.doctor.usuario.nombre} {item.doctor.usuario.apellido}
      </Text>
      <Text style={styles.line}>Precio: ${item.precio}</Text>
      <Text
        style={[
          styles.line,
          { color:
              item.estado === 'AGENDADA'  ? 'orange' :
                item.estado === 'REALIZADA' ? 'green'  :
                  'red'
          }
        ]}
      >
        {item.estado}
      </Text>

      {/* Botón Cancelar sólo si está AGENDADA */}
      {item.estado === 'AGENDADA' && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => handleCancel(item.id)}
        >
          <Text style={styles.cancelText}>Cancelar</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator style={styles.centered} size="large" />
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={i => i.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
        />
      )}

      <Text style={styles.new} onPress={() => setModalVisible(true)}>
        + Nueva Cita
      </Text>

      <Modal visible={modalVisible} animationType="slide">
        <AppointmentForm
          onSuccess={handleCreateSuccess}
          onCancel={() => setModalVisible(false)}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#F5F7FA' },
  centered:     { flex:1, justifyContent:'center', alignItems:'center' },
  card:         { padding:12, backgroundColor:'#fff', marginBottom:12, borderRadius:8 },
  line:         { marginBottom: 4 },
  bold:         { fontWeight: '600' },
  new:          {
    position:'absolute',
    bottom:16, right:16,
    backgroundColor:'#0055A4',
    color:'#fff',
    padding:12,
    borderRadius:24,
    fontWeight:'bold'
  },
  cancelButton: {
    marginTop: 8,
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F44336',
    borderRadius: 4,
  },
  cancelText: {
    color: '#fff',
    fontWeight: '600',
  },
});
