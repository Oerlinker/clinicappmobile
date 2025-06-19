import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  TextInput,
  Button,
  Title,
  ActivityIndicator,
} from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import api from '../api';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, parseISO } from 'date-fns';
import { theme } from '../theme';

interface Cargo { id: number; nombre: string }
interface Especialidad { id: number; nombre: string }

export default function EmployeeRegisterScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const { data: cargos = [], isLoading: loadingCargos } = useQuery<Cargo[]>({
    queryKey: ['cargos'],
    queryFn: () => api.get('/cargos').then(r => r.data),
  });
  const {
    data: especialidades = [],
    isLoading: loadingEsp,
  } = useQuery<Especialidad[]>({
    queryKey: ['especialidades'],
    queryFn: () => api.get('/especialidades').then(r => r.data),
  });

  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    cargoId: '',
    especialidadId: '',
    fechaContratacion: '',
    salario: ''});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const selectedDate = form.fechaContratacion
    ? parseISO(form.fechaContratacion)
    : new Date();

  const registerEmpleado = useMutation({
    mutationFn: (payload: any) => api.post('/empleados', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empleados'] });
      Alert.alert('¡Éxito!', 'Empleado registrado correctamente', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    },
    onError: (err: any) => {
      console.error('RESPONSE DATA:', err.response?.data);
      Alert.alert(
        'Error',
        err.response?.data as string || 'No se pudo registrar el empleado'
      );
    },
  });

  const selectedCargo = cargos.find(c => c.id.toString() === form.cargoId)
  const showEspecialidad =
    selectedCargo?.nombre.toLowerCase() === 'médico';

  const onChange = (key: keyof typeof form, value: string) =>
    setForm(f => ({ ...f, [key]: value }));

  const onSubmit = () => {
    if (!form.nombre || !form.apellido || !form.email || !form.password || !form.cargoId) {
      return Alert.alert('Error', 'Completa todos los campos obligatorios');
    }
    if (showEspecialidad && !form.especialidadId) {
      return Alert.alert('Error', 'El cargo Médico requiere una especialidad');
    }

    const payload = {
      nombre: form.nombre,
      apellido: form.apellido,
      email: form.email,
      password: form.password,
      cargoId: Number(form.cargoId),
      especialidadId: showEspecialidad
        ? Number(form.especialidadId)
        : null,
      fechaContratacion: form.fechaContratacion || null,
      salario: form.salario || null};

    registerEmpleado.mutate(payload);
  };

  if (loadingCargos || loadingEsp) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <Title style={styles.title}>Registrar Empleado</Title>
        <View style={styles.formContainer}>
          {/* Campos de registro */}
          <TextInput
            mode="outlined"
            label="Nombre"
            value={form.nombre}
            onChangeText={v => onChange('nombre', v)}
            style={styles.input}
          />
          <TextInput
            mode="outlined"
            label="Apellido"
            value={form.apellido}
            onChangeText={v => onChange('apellido', v)}
            style={styles.input}
          />
          <TextInput
            mode="outlined"
            label="Email"
            keyboardType="email-address"
            value={form.email}
            onChangeText={v => onChange('email', v)}
            style={styles.input}
          />
          <TextInput
            mode="outlined"
            label="Contraseña"
            secureTextEntry
            value={form.password}
            onChangeText={v => onChange('password', v)}
            style={styles.input}
          />

          {/* Selector de Cargo */}
          <TextInput
            mode="outlined"
            label="Cargo"
            value={selectedCargo?.nombre || ''}
            onFocus={() =>
              Alert.alert(
                'Selecciona un cargo',
                undefined,
                cargos.map(c => ({
                  text: c.nombre,
                  onPress: () => onChange('cargoId', c.id.toString()),
                }))
              )
            }
            style={styles.input}
            right={<TextInput.Icon icon="menu-down" />}
          />

          {/* Si es Médico, pedimos especialidad */}
          {showEspecialidad && (
            <TextInput
              mode="outlined"
              label="Especialidad"
              value={
                especialidades.find(e => e.id.toString() === form.especialidadId)
                  ?.nombre || ''
              }
              onFocus={() =>
                Alert.alert(
                  'Selecciona una especialidad',
                  undefined,
                  especialidades.map(e => ({
                    text: e.nombre,
                    onPress: () => onChange('especialidadId', e.id.toString()),
                  }))
                )
              }
              style={styles.input}
              right={<TextInput.Icon icon="menu-down" />}
            />
          )}

          {/* Fecha de contratación con DateTimePicker */}
          <TextInput
            mode="outlined"
            label="Fecha contratación"
            value={format(selectedDate, 'dd/MM/yyyy')}
            onFocus={() => setShowDatePicker(true)}
            showSoftInputOnFocus={false}
            style={styles.input}
            right={<TextInput.Icon icon="calendar" />}
          />
          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(_, date) => {
                setShowDatePicker(false);
                if (date) onChange('fechaContratacion', format(date, 'yyyy-MM-dd'));
              }}
            />
          )}

          <TextInput
            mode="outlined"
            label="Salario"
            placeholder="1000.00"
            keyboardType="numeric"
            value={form.salario}
            onChangeText={v => onChange('salario', v)}
            style={styles.input}
          />

          <Button
            mode="contained"
            onPress={onSubmit}
            loading={registerEmpleado.status === 'pending'}
            style={styles.button}
          >
            Registrar
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16 },
  title: { marginBottom: 16, textAlign: 'center' },
  formContainer: { backgroundColor: '#fff', padding: 16, borderRadius: 8, elevation: 2 },
  input: { marginBottom: 12 },
  button: { marginTop: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
