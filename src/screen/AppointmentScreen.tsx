
  import React, { useState, useContext } from 'react';
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
  import { useQuery } from '@tanstack/react-query';
  import api from '../api';
  import AppointmentForm from '../components/AppointmentForm';
  import { format, subWeeks, parseISO } from 'date-fns';

  interface Cita {
    id: number;
    fecha: string;
    hora: string;
    estado: string;
    tipo: string;
    doctor: {
      usuario: { nombre: string; apellido: string }
    };
    precio: number;
  }

  export default function AppointmentScreen() {
    const { user } = useContext(AuthContext);
    const [modalVisible, setModalVisible] = useState(false);

    // Usar react-query para gestionar las citas
    const {
      data: appointments = [],
      isLoading,
      isError,
      refetch
    } = useQuery<Cita[]>({
      queryKey: ['mis-citas'],
      queryFn: () => api.get('/citas/mis-citas').then(res => res.data),
      enabled: !!user
    });

    // Filtrar citas (sólo mostrar desde hace una semana o futuras)
    const filteredAppointments = appointments.filter(cita => {
      const today = new Date();
      const oneWeekAgo = subWeeks(today, 1);
      const citaDate = parseISO(cita.fecha);
      return citaDate >= oneWeekAgo || citaDate > today;
    });

    // Función para crear nueva cita y procesar el pago
    const handleCreateSuccess = async (newCita:{id:number;precio:number}) => {
      setModalVisible(false);
      await refetch();
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

    // Función mejorada para cancelar una cita
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
                refetch();
              } catch {
                Alert.alert('Error', 'No se pudo cancelar la cita.');
              }
            }
          }
        ]
      );
    };

    // Renderizado de cada cita
    const renderItem = ({ item }: { item: Cita }) => (
      <View style={styles.card}>
        <Text style={styles.line}>
          <Text style={styles.bold}>
            {format(parseISO(item.fecha), 'dd/MM/yyyy')}
          </Text> – {item.hora.split('T')[1]?.slice(0,5) || item.hora.slice(0,5)}
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
        {isLoading ? (
          <ActivityIndicator style={styles.centered} size="large" />
        ) : isError ? (
          <View style={styles.centered}>
            <Text>Error al cargar tus citas</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.header}>Mis Citas</Text>
            <FlatList
              data={filteredAppointments}
              keyExtractor={item => item.id.toString()}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No tienes citas programadas</Text>
                </View>
              }
            />
          </>
        )}

        <TouchableOpacity
          style={styles.new}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.newText}>+ Nueva Cita</Text>
        </TouchableOpacity>

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
    centered:     { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header:       { fontSize: 22, fontWeight: 'bold', padding: 16, paddingBottom: 8 },
    listContent:  { padding: 16 },
    card:         { padding: 16, backgroundColor: '#fff', marginBottom: 12, borderRadius: 8, elevation: 2 },
    line:         { marginBottom: 6 },
    bold:         { fontWeight: '600' },
    new:          {
      position: 'absolute',
      bottom: 20, right: 20,
      backgroundColor: '#0055A4',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 24,
      elevation: 4,
    },
    newText:      { color: '#fff', fontWeight: 'bold' },
    cancelButton: {
      marginTop: 8,
      alignSelf: 'flex-end',
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: '#F44336',
      borderRadius: 4,
    },
    cancelText:   { color: '#fff', fontWeight: '600' },
    retryButton:  {
      marginTop: 12,
      paddingHorizontal: 20,
      paddingVertical: 8,
      backgroundColor: '#0055A4',
      borderRadius: 4,
    },
    retryText:    { color: '#fff' },
    emptyState:   { padding: 32, alignItems: 'center' },
    emptyText:    { fontSize: 16, color: '#666' },
  });
