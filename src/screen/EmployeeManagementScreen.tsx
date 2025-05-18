import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {
  DataTable,
  TextInput,
  Button,
  ActivityIndicator,
  Text,
  HelperText,
} from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';

interface Especialidad {
  id: number;
  nombre: string;
}

interface EmpleadoData {
  id: number;
  usuario: { nombre: string; apellido: string };
  cargo: { id: number; nombre: string };
  especialidad?: Especialidad | null;
  fechaContratacion?: string;
  salario?: number;
}

export default function EmployeeManagementScreen() {
  const queryClient = useQueryClient();

  const { data: empleados = [], isLoading, error } = useQuery<EmpleadoData[]>({
    queryKey: ['empleados'],
    queryFn: () => api.get('/empleados').then((res) => res.data),
  });

  const { data: especialidades = [] } = useQuery<Especialidad[]>({
    queryKey: ['especialidades'],
    queryFn: () => api.get('/especialidades').then((res) => res.data),
  });

  const [editingEmpleado, setEditingEmpleado] = useState<EmpleadoData | null>(null);
  const [formData, setFormData] = useState({
    especialidadId: '',
    fechaContratacion: '',
    salario: '',
  });

  const updateEmpleado = useMutation({
    mutationFn: ({
                   id,
                   data,
                 }: {
      id: number;
      data: {
        cargo: { id: number; nombre: string };
        especialidadId: number | null;
        fechaContratacion: string;
        salario: number | null;
      };
    }) => api.put(`/empleados/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empleados'] });
      setEditingEmpleado(null);
      Alert.alert('Éxito', 'Empleado actualizado correctamente');
    },
    onError: (e: any) => {
      Alert.alert('Error', e.response?.data?.message || 'No se pudo actualizar');
    },
  });

  const deleteEmpleado = useMutation({
    mutationFn: (id: number) => api.delete(`/empleados/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empleados'] });
      Alert.alert('Éxito', 'Empleado eliminado correctamente');
    },
    onError: (e: any) => {
      Alert.alert('Error', e.response?.data?.message || 'No se pudo eliminar');
    },
  });

  const handleEdit = (empleado: EmpleadoData) => {
    setEditingEmpleado(empleado);
    setFormData({
      especialidadId: empleado.especialidad?.id.toString() || '',
      fechaContratacion: empleado.fechaContratacion || '',
      salario: empleado.salario?.toString() || '',
    });
  };

  const handleSubmitEdit = () => {
    if (!editingEmpleado) return;
    updateEmpleado.mutate({
      id: editingEmpleado.id,
      data: {
        cargo: editingEmpleado.cargo,
        especialidadId: formData.especialidadId ? Number(formData.especialidadId) : null,
        fechaContratacion: formData.fechaContratacion,
        salario: formData.salario ? Number(formData.salario) : null,
      },
    });
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.center}>
        <Text>Error al cargar empleados</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {editingEmpleado ? (
        <View>
          <Text style={styles.title}>Editar Empleado</Text>

          <TextInput
            mode="outlined"
            label="Especialidad"
            value={
              especialidades.find(
                (e) => e.id.toString() === formData.especialidadId
              )?.nombre || ''
            }
            onFocus={() =>
              Alert.alert(
                'Selecciona Especialidad',
                undefined,
                especialidades.map((e) => ({
                  text: e.nombre,
                  onPress: () =>
                    setFormData((f) => ({
                      ...f,
                      especialidadId: e.id.toString(),
                    })),
                }))
              )
            }
            style={styles.input}
            right={<TextInput.Icon icon="menu-down" />}
          />
          <HelperText type="info">
            Toca para elegir una especialidad
          </HelperText>

          <TextInput
            mode="outlined"
            label="Fecha Contratación"
            placeholder="AAAA-MM-DD"
            value={formData.fechaContratacion}
            onChangeText={(v) =>
              setFormData({ ...formData, fechaContratacion: v })
            }
            style={styles.input}
          />

          <TextInput
            mode="outlined"
            label="Salario"
            keyboardType="numeric"
            value={formData.salario}
            onChangeText={(v) => setFormData({ ...formData, salario: v })}
            style={styles.input}
          />

          <View style={styles.buttonsRow}>
            <Button
              mode="contained"
              onPress={handleSubmitEdit}
              style={styles.button}
            >
              Guardar
            </Button>
            <Button
              mode="outlined"
              onPress={() => setEditingEmpleado(null)}
              style={styles.button}
            >
              Cancelar
            </Button>
          </View>
        </View>
      ) : (
        // ScrollView horizontal para tablas anchas
        <ScrollView horizontal contentContainerStyle={styles.tableWrapper}>
          <DataTable>
            <DataTable.Header>
              <DataTable.Title style={styles.colNombre}>Nombre</DataTable.Title>
              <DataTable.Title style={styles.col}>Cargo</DataTable.Title>
              <DataTable.Title style={styles.col}>Especialidad</DataTable.Title>
              <DataTable.Title style={styles.col}>Fecha</DataTable.Title>
              <DataTable.Title style={styles.col} numeric>
                Salario
              </DataTable.Title>
              <DataTable.Title style={styles.colAcciones} numeric>
                Acciones
              </DataTable.Title>
            </DataTable.Header>

            <FlatList
              data={empleados}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <DataTable.Row>
                  <DataTable.Cell style={styles.colNombre}>
                    <Text numberOfLines={1} ellipsizeMode="tail" style={{ flexShrink: 1 }}>
                      {item.usuario.nombre} {item.usuario.apellido}
                    </Text>
                  </DataTable.Cell>
                  <DataTable.Cell style={styles.col}>
                    <Text numberOfLines={1} ellipsizeMode="tail">
                      {item.cargo.nombre}
                    </Text>
                  </DataTable.Cell>
                  <DataTable.Cell style={styles.col}>
                    <Text numberOfLines={1} ellipsizeMode="tail">
                      {item.especialidad?.nombre || '-'}
                    </Text>
                  </DataTable.Cell>
                  <DataTable.Cell style={styles.col}>
                    <Text numberOfLines={1} ellipsizeMode="tail">
                      {item.fechaContratacion || '-'}
                    </Text>
                  </DataTable.Cell>
                  <DataTable.Cell style={styles.col} numeric>
                    <Text numberOfLines={1} ellipsizeMode="tail">
                      {item.salario != null ? `$${item.salario}` : '-'}
                    </Text>
                  </DataTable.Cell>
                  <DataTable.Cell style={styles.colAcciones} numeric>
                    <View style={styles.actionsRow}>
                      <Button compact onPress={() => handleEdit(item)} style={styles.actionButton}>
                        Editar
                      </Button>
                      <Button
                        compact
                        onPress={() =>
                          Alert.alert(
                            'Confirmar',
                            `Eliminar al empleado ${item.usuario.nombre}?`,
                            [
                              { text: 'Cancelar', style: 'cancel' },
                              {
                                text: 'Eliminar',
                                style: 'destructive',
                                onPress: () => deleteEmpleado.mutate(item.id),
                              },
                            ]
                          )
                        }
                        style={styles.actionButton}
                      >
                        Eliminar
                      </Button>
                    </View>
                  </DataTable.Cell>
                </DataTable.Row>
              )}
            />
          </DataTable>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 8, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', marginVertical: 12 },
  input: { marginVertical: 8 },
  buttonsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  button: { flex: 1, marginHorizontal: 4 },
  tableWrapper: {
    // Asegura algo de padding para el scroll
    paddingRight: 16,
  },
  colNombre: {
    minWidth: 140,
  },
  col: {
    minWidth: 100,
  },
  colAcciones: {
    minWidth: 120,
  },
  actionsRow: { flexDirection: 'row' },
  actionButton: { marginHorizontal: 4 },
});
