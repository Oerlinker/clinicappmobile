import React, {useState} from 'react';
import {View, StyleSheet, ScrollView, Alert, Platform} from 'react-native';
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

interface Doctor {
  id: number;
  usuario: {nombre: string; apellido: string};
}

interface Disponibilidad {
  id: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  duracionSlot: number;
  cupos: number;
  empleado: {usuario: {nombre: string; apellido: string}};
}

export default function DisponibilidadReportScreen() {
  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [enabled, setEnabled] = useState(false);

  const {
    data: doctors = [],
    isLoading: loadingDoctors,
    isError: errorDoctors,
  } = useQuery<Doctor[], Error>({
    queryKey: ['dispo-report-doctores'],
    queryFn: () => api.get('/empleados/doctores').then(r => r.data),
  });

  const {
    data: rows = [],
    isFetching: loadingReport,
    isError: errorReport,
  } = useQuery<Disponibilidad[], Error>({
    queryKey: ['dispo-report', {doctorId, fromDate, toDate}],
    queryFn: () =>
      api
        .post<Disponibilidad[]>('/reportes/disponibilidades', {
          doctorId: doctorId ?? undefined,
          fechaDesde: fromDate?.toISOString().slice(0, 10),
          fechaHasta: toDate?.toISOString().slice(0, 10),
        })
        .then(r => r.data),
    enabled,
  });

  if (errorDoctors) {
    Alert.alert('Error', 'No se pudieron cargar los doctores');
  }
  if (errorReport) {
    Alert.alert('Error', 'No se pudo generar el reporte');
  }

  const formatDate = (d: Date | null) =>
    d ? d.toISOString().slice(0, 10) : '—';

  const selectedDoc = doctors.find((d: Doctor) => d.id === doctorId);

  const pickDoctor = () => {
    if (loadingDoctors) return;
    Alert.alert(
      'Selecciona un doctor',
      undefined,
      [
        {text: '— Todos —', onPress: () => setDoctorId(null)},
        ...doctors.map((d: Doctor) => ({
          text: `${d.usuario.nombre} ${d.usuario.apellido}`,
          onPress: () => setDoctorId(d.id),
        })),
      ],
      {cancelable: true},
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.title}>
            Reporte de Disponibilidades
          </Text>

          {/* Fila de selectores de fecha */}
          <View style={styles.row}>
            <Button
              mode="outlined"
              onPress={() => setShowFromPicker(true)}
              style={[styles.inputButton, styles.flexItem]}>
              Desde: {formatDate(fromDate)}
            </Button>
            <Button
              mode="outlined"
              onPress={() => setShowToPicker(true)}
              style={[styles.inputButton, styles.flexItem]}>
              Hasta: {formatDate(toDate)}
            </Button>
          </View>

          {showFromPicker && (
            <DateTimePicker
              value={fromDate || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(_, date) => {
                setShowFromPicker(false);
                if (date) setFromDate(date);
              }}
            />
          )}
          {showToPicker && (
            <DateTimePicker
              value={toDate || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(_, date) => {
                setShowToPicker(false);
                if (date) setToDate(date);
              }}
            />
          )}

          {/* Selector de doctor */}
          <Button
            mode="outlined"
            onPress={pickDoctor}
            style={styles.inputButton}
            loading={loadingDoctors}>
            Doctor:{' '}
            {selectedDoc
              ? `${selectedDoc.usuario.nombre} ${selectedDoc.usuario.apellido}`
              : '— Todos —'}
          </Button>

          {/* Generar reporte */}
          <Button
            mode="contained"
            onPress={() => setEnabled(true)}
            style={styles.runButton}
            disabled={loadingReport}>
            Generar Reporte
          </Button>
        </Card.Content>
      </Card>

      {/* Loading */}
      {(loadingReport || loadingDoctors) && (
        <ActivityIndicator style={styles.loader} size="large" />
      )}

      {/* Tabla de resultados */}
      {!loadingReport && rows.length > 0 && (
        <DataTable style={styles.table}>
          <DataTable.Header>
            <DataTable.Title>Fecha</DataTable.Title>
            <DataTable.Title>Doctor</DataTable.Title>
            <DataTable.Title>Inicio</DataTable.Title>
            <DataTable.Title>Fin</DataTable.Title>
            <DataTable.Title numeric>Slots</DataTable.Title>
            <DataTable.Title numeric>Cupos</DataTable.Title>
          </DataTable.Header>
          {rows.map((d: Disponibilidad) => (
            <DataTable.Row key={d.id}>
              <DataTable.Cell>{d.fecha.slice(0, 10)}</DataTable.Cell>
              <DataTable.Cell>
                {d.empleado?.usuario
                  ? `${d.empleado.usuario.nombre} ${d.empleado.usuario.apellido}`
                  : '—'}
              </DataTable.Cell>
              <DataTable.Cell>{d.horaInicio}</DataTable.Cell>
              <DataTable.Cell>{d.horaFin}</DataTable.Cell>
              <DataTable.Cell numeric>{d.duracionSlot}</DataTable.Cell>
              <DataTable.Cell numeric>{d.cupos}</DataTable.Cell>
            </DataTable.Row>
          ))}
        </DataTable>
      )}

      {/* Sin datos */}
      {!loadingReport && enabled && rows.length === 0 && (
        <Text style={styles.noData}>
          No hay disponibilidades para esos filtros.
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    flexGrow: 1,
  },
  card: {
    marginBottom: 12,
  },
  title: {
    marginBottom: 12,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  flexItem: {
    flex: 1,
    marginHorizontal: 4,
  },
  inputButton: {
    justifyContent: 'center',
    minHeight: 48,
  },
  runButton: {
    marginTop: 8,
  },
  loader: {
    marginVertical: 16,
  },
  table: {
    marginTop: 16,
  },
  noData: {
    textAlign: 'center',
    marginTop: 24,
    color: '#555',
  },
});
