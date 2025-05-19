import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {Button, TextInput, DataTable} from 'react-native-paper';
import {Picker} from '@react-native-picker/picker';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {format, parseISO} from 'date-fns';
import api from '../api';

interface Paciente {
  id: number;
  nombre: string;
  apellido: string;
}

type Antecedente = {
  id: number;
  tipo: string;
  descripcion: string;
  fechaRegistro: string;
};

const tipos = [
  {value: 'PERSONAL', label: 'Personal'},
  {value: 'FAMILIAR', label: 'Familiar'},
  {value: 'ALERGIA', label: 'Alergia'},
  {value: 'QUIRURGICO', label: 'Quirúrgico'},
];

export default function AntecedentesEnfScreen() {
  const queryClient = useQueryClient();
  const [pacienteId, setPacienteId] = useState<string>('');
  const [tipo, setTipo] = useState<string>('');
  const [descripcion, setDescripcion] = useState<string>('');
  const [editingId, setEditingId] = useState<number | null>(null);

  // Carga de pacientes
  const {data: pacientes = [], isLoading: loadingPacientes} = useQuery({
    queryKey: ['pacientes'],
    queryFn: () =>
      api.get<Paciente[]>('/auth/usuarios/pacientes').then(res => res.data),
  });

  // Carga antecedentes según paciente
  const {data: antecedentes = [], isLoading: loadingAnte} = useQuery({
    queryKey: ['antecedentes', pacienteId],
    queryFn: () =>
      api
        .get<Antecedente[]>(`/antecedentes/usuario/${pacienteId}`)
        .then(res => res.data),
    enabled: !!pacienteId,
  });

  // Mutación para crear
  const createMutation = useMutation({
    mutationFn: (newAnt: {
      usuarioId: number;
      tipo: string;
      descripcion: string;
    }) => api.post('/antecedentes', newAnt),
    onSuccess: () => {
      Alert.alert('Éxito', 'Antecedente agregado correctamente');
      queryClient.invalidateQueries({queryKey: ['antecedentes', pacienteId]});
      resetForm();
    },
    onError: (error: any) => {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'No se pudo agregar el antecedente',
      );
    },
  });

  // Mutación para actualizar
  const updateMutation = useMutation({
    mutationFn: (upd: {
      id: number;
      usuarioId: number;
      tipo: string;
      descripcion: string;
    }) =>
      api.put(`/antecedentes/${upd.id}`, {
        usuarioId: upd.usuarioId,
        tipo: upd.tipo,
        descripcion: upd.descripcion,
      }),
    onSuccess: () => {
      Alert.alert('Éxito', 'Antecedente modificado correctamente');
      queryClient.invalidateQueries({queryKey: ['antecedentes', pacienteId]});
      resetForm();
    },
    onError: (error: any) => {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'No se pudo actualizar el antecedente',
      );
    },
  });

  const resetForm = () => {
    setTipo('');
    setDescripcion('');
    setEditingId(null);
  };

  const handleSubmit = () => {
    if (!tipo || !descripcion || !pacienteId) {
      Alert.alert('Error', 'Completa todos los campos');
      return;
    }
    const payload = {usuarioId: Number(pacienteId), tipo, descripcion};
    if (editingId != null) {
      updateMutation.mutate({...payload, id: editingId});
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (ant: Antecedente) => {
    setEditingId(ant.id);
    setTipo(ant.tipo);
    setDescripcion(ant.descripcion);
  };

  if (loadingPacientes) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Gestión de Antecedentes</Text>

      <View style={styles.selectorContainer}>
        <Text style={styles.label}>Seleccione Paciente</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={pacienteId}
            onValueChange={itemValue => setPacienteId(itemValue.toString())}
            style={styles.picker}>
            <Picker.Item label="-- Seleccione un paciente --" value="" />
            {pacientes.map(p => (
              <Picker.Item
                key={p.id.toString()}
                label={`${p.nombre} ${p.apellido}`}
                value={p.id.toString()}
              />
            ))}
          </Picker>
        </View>
      </View>

      {pacienteId && (
        <View style={styles.formContainer}>
          <Text style={styles.subtitle}>
            {editingId ? 'Editar antecedente' : 'Nuevo antecedente'}
          </Text>
          <View>
            <Text style={styles.label}>Tipo</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={tipo}
                onValueChange={itemValue => setTipo(itemValue)}
                style={styles.picker}>
                <Picker.Item label="-- Seleccione tipo --" value="" />
                {tipos.map(t => (
                  <Picker.Item key={t.value} label={t.label} value={t.value} />
                ))}
              </Picker>
            </View>

            <Text style={styles.label}>Descripción</Text>
            <TextInput
              mode="outlined"
              value={descripcion}
              onChangeText={setDescripcion}
              style={styles.input}
            />

            <View style={styles.formButtons}>
              <Button
                mode="contained"
                onPress={handleSubmit}
                style={styles.actionButton}>
                {editingId ? 'Actualizar' : 'Agregar'}
              </Button>

              {editingId && (
                <Button
                  mode="outlined"
                  onPress={resetForm}
                  style={styles.actionButton}>
                  Cancelar
                </Button>
              )}
            </View>
          </View>
        </View>
      )}

      {pacienteId && (
        <View style={styles.tableContainer}>
          <DataTable>
            <DataTable.Header>
              <DataTable.Title>Tipo</DataTable.Title>
              <DataTable.Title style={{flex: 2}}>Descripción</DataTable.Title>
              <DataTable.Title>Fecha</DataTable.Title>
              <DataTable.Title>Acción</DataTable.Title>
            </DataTable.Header>

            {loadingAnte ? (
              <DataTable.Row>
                <DataTable.Cell style={{flex: 4}}>
                  <ActivityIndicator size="small" />
                </DataTable.Cell>
              </DataTable.Row>
            ) : antecedentes.length === 0 ? (
              <DataTable.Row>
                <DataTable.Cell style={{flex: 4}}>
                  No hay antecedentes registrados
                </DataTable.Cell>
              </DataTable.Row>
            ) : (
              antecedentes.map(a => (
                <DataTable.Row key={a.id.toString()}>
                  <DataTable.Cell>{a.tipo}</DataTable.Cell>
                  <DataTable.Cell style={{flex: 2}}>
                    {a.descripcion}
                  </DataTable.Cell>
                  <DataTable.Cell>
                    {format(parseISO(a.fechaRegistro), 'dd/MM/yy')}
                  </DataTable.Cell>
                  <DataTable.Cell>
                    <Button
                      mode="outlined"
                      compact
                      onPress={() => handleEdit(a)}>
                      Editar
                    </Button>
                  </DataTable.Cell>
                </DataTable.Row>
              ))
            )}
          </DataTable>
        </View>
      )}
    </ScrollView>
  );
}

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
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  selectorContainer: {
    marginBottom: 16,
  },
  formContainer: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'white',
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  tableContainer: {
    marginBottom: 24,
  },
});
