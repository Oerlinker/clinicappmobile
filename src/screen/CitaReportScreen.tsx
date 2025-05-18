import React, {useState} from 'react';
import {StyleSheet, ScrollView, Alert, Platform} from 'react-native';
import {
  Card,
  Text,
  Button,
  ActivityIndicator,
  DataTable,
} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import {useQuery} from '@tanstack/react-query';
import api from '../api';

interface Cita {
  id: number;
  fecha: string;
  hora: string;
  estado: string;
  tipo: string;
  paciente: {nombre: string; apellido: string};
  doctor: {usuario: {nombre: string; apellido: string}};
  precio: number;
}

interface Doctor {
  id: number;
  usuario: {nombre: string; apellido: string};
}

export default function CitaReportScreen() {
  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [enabled, setEnabled] = useState(false);

  const {data: doctors = [], isLoading: loadingDoctors} = useQuery<Doctor[]>({
    queryKey: ['citas-report-doctores'],
    queryFn: () => api.get('/empleados/doctores').then(r => r.data),
  });

  const {data: citas = [], isFetching} = useQuery<Cita[]>({
    queryKey: ['citas-report', {doctorId, fromDate, toDate}],
    enabled,
    queryFn: () =>
      api
        .post<Cita[]>('/reportes/citas', {
          doctorId: doctorId ?? undefined,
          fechaDesde: fromDate?.toISOString().split('T')[0],
          fechaHasta: toDate?.toISOString().split('T')[0],
        })
        .then(r => r.data),
  });

  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  const pickDoctor = () => {
    if (!doctors.length) return;
    const options = [
      {text: '— Todos —', onPress: () => setDoctorId(null)},
      ...doctors.map(d => ({
        text: `${d.usuario.nombre} ${d.usuario.apellido}`,
        onPress: () => setDoctorId(d.id),
      })),
    ];
    Alert.alert('Selecciona un doctor', undefined, options);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.title}>
            Reporte de Citas
          </Text>

          <Button
            mode="outlined"
            onPress={() => setShowFromPicker(true)}
            style={styles.input}>
            Desde: {fromDate ? formatDate(fromDate) : '—'}
          </Button>
          {showFromPicker && (
            <DateTimePicker
              value={fromDate || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={(_, date) => {
                setShowFromPicker(false);
                if (date) setFromDate(date);
              }}
            />
          )}

          <Button
            mode="outlined"
            onPress={() => setShowToPicker(true)}
            style={styles.input}>
            Hasta: {toDate ? formatDate(toDate) : '—'}
          </Button>
          {showToPicker && (
            <DateTimePicker
              value={toDate || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={(_, date) => {
                setShowToPicker(false);
                if (date) setToDate(date);
              }}
            />
          )}

          <Button mode="outlined" onPress={pickDoctor} style={styles.input}>
            Doctor:{' '}
            {doctorId
              ? doctors.find(d => d.id === doctorId)!.usuario.nombre +
                ' ' +
                doctors.find(d => d.id === doctorId)!.usuario.apellido
              : '— Todos —'}
          </Button>

          <Button
            mode="contained"
            onPress={() => setEnabled(true)}
            style={styles.button}>
            Generar Reporte
          </Button>
        </Card.Content>
      </Card>

      {(isFetching || loadingDoctors) && (
        <ActivityIndicator style={styles.loader} size="large" />
      )}

      {!isFetching && citas.length > 0 && (
        <DataTable>
          <DataTable.Header>
            <DataTable.Title style={styles.col}>Fecha</DataTable.Title>
            <DataTable.Title style={styles.col}>Hora</DataTable.Title>
            <DataTable.Title style={styles.col}>Paciente</DataTable.Title>
            <DataTable.Title style={styles.col}>Doctor</DataTable.Title>
            <DataTable.Title style={styles.col}>Tipo</DataTable.Title>
            <DataTable.Title style={styles.col}>Estado</DataTable.Title>
            <DataTable.Title numeric style={styles.colNum}>
              Precio
            </DataTable.Title>
          </DataTable.Header>

          {citas.map(c => (
            <DataTable.Row key={c.id}>
              <DataTable.Cell style={styles.col}>
                {c.fecha.split('T')[0]}
              </DataTable.Cell>
              <DataTable.Cell style={styles.col}>
                {c.hora.slice(11, 16)}
              </DataTable.Cell>
              <DataTable.Cell style={styles.col}>
                {c.paciente.nombre} {c.paciente.apellido}
              </DataTable.Cell>
              <DataTable.Cell style={styles.col}>
                {c.doctor.usuario.nombre} {c.doctor.usuario.apellido}
              </DataTable.Cell>
              <DataTable.Cell style={styles.col}>{c.tipo}</DataTable.Cell>
              <DataTable.Cell style={styles.col}>{c.estado}</DataTable.Cell>
              <DataTable.Cell numeric style={styles.colNum}>
                ${c.precio}
              </DataTable.Cell>
            </DataTable.Row>
          ))}
        </DataTable>
      )}

      {!isFetching && citas.length === 0 && enabled && (
        <Text style={styles.noData}>No hay citas con esos filtros.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: '#f6f6f6',
  },
  card: {marginBottom: 12},
  title: {marginBottom: 8, textAlign: 'center'},
  input: {marginVertical: 6},
  button: {marginTop: 12},
  loader: {marginTop: 24},
  col: {flex: 1, minWidth: 80},
  colNum: {flex: 1, minWidth: 60, alignItems: 'flex-end'},
  noData: {textAlign: 'center', marginTop: 24},
});
