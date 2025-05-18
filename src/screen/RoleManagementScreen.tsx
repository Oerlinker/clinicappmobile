import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  DataTable,
  ActivityIndicator,
} from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';

interface Role {
  id: number;
  nombre: string;
}

export default function RoleManagementScreen() {
  const queryClient = useQueryClient();

  // Fetch roles
  const {
    data: roles = [],
    isLoading,
    error,
  } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: () => api.get<Role[]>('/roles').then(res => res.data),
  });

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editName, setEditName] = useState('');

  const createRole = useMutation({
    mutationFn: (payload: { nombre: string }) => api.post('/roles', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setNewName('');
      setShowCreate(false);
      Alert.alert('Éxito', 'Rol creado exitosamente');
    },
    onError: (e: any) => {
      Alert.alert('Error', e.response?.data?.message || 'No se pudo crear el rol');
    },
  });

  const updateRole = useMutation({
    mutationFn: (role: Role) => api.put(`/roles/${role.id}`, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setEditingRole(null);
      setEditName('');
      Alert.alert('Éxito', 'Rol actualizado exitosamente');
    },
    onError: (e: any) => {
      Alert.alert('Error', e.response?.data?.message || 'No se pudo actualizar el rol');
    },
  });

  const deleteRole = useMutation({
    mutationFn: (id: number) => api.delete(`/roles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      Alert.alert('Éxito', 'Rol eliminado exitosamente');
    },
    onError: (e: any) => {
      Alert.alert('Error', e.response?.data?.message || 'No se pudo eliminar el rol');
    },
  });

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setEditName(role.nombre);
  };
  const handleCancelEdit = () => {
    setEditingRole(null);
    setEditName('');
  };
  const handleSubmitEdit = () => {
    if (editingRole) {
      updateRole.mutate({ ...editingRole, nombre: editName });
    }
  };

  const renderRow = ({ item }: { item: Role }) => {
    const isEditing = editingRole?.id === item.id;
    return (
      <DataTable.Row>
        <DataTable.Cell>{item.id}</DataTable.Cell>
        <DataTable.Cell style={styles.cellFlex}>
          {isEditing ? (
            <TextInput
              mode="outlined"
              dense
              value={editName}
              onChangeText={setEditName}
            />
          ) : (
            <Text>{item.nombre}</Text>
          )}
        </DataTable.Cell>
        <DataTable.Cell>
          {isEditing ? (
            <View style={styles.actionsRow}>
              <Button onPress={handleSubmitEdit} style={styles.actionButton}>Guardar</Button>
              <Button onPress={handleCancelEdit} style={styles.actionButton}>Cancelar</Button>
            </View>
          ) : (
            <View style={styles.actionsRow}>
              <Button onPress={() => handleEdit(item)} style={styles.actionButton}>Editar</Button>
              <Button onPress={() => deleteRole.mutate(item.id)} style={styles.actionButton}>Eliminar</Button>
            </View>
          )}
        </DataTable.Cell>
      </DataTable.Row>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.center}>
        <Text>Error al cargar roles</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.createContainer}>
        {showCreate ? (
          <View style={styles.createRow}>
            <TextInput
              mode="outlined"
              label="Nuevo rol"
              value={newName}
              onChangeText={setNewName}
              style={styles.input}
            />
            <Button mode="contained" onPress={() => createRole.mutate({ nombre: newName })}>
              Crear
            </Button>
            <Button mode="text" onPress={() => setShowCreate(false)}>
              Cancelar
            </Button>
          </View>
        ) : (
          <Button mode="contained" onPress={() => setShowCreate(true)}>
            + Agregar Rol
          </Button>
        )}
      </View>

      <DataTable>
        <DataTable.Header>
          <DataTable.Title>ID</DataTable.Title>
          <DataTable.Title style={styles.cellFlex}>Nombre</DataTable.Title>
          <DataTable.Title>Acciones</DataTable.Title>
        </DataTable.Header>
        <FlatList data={roles} keyExtractor={item => item.id.toString()} renderItem={renderRow} />
      </DataTable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  createContainer: { marginBottom: 16 },
  createRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: { flex: 1 },
  cellFlex: { flex: 1.5 },
  cellActions: { flex: 2.5, justifyContent: 'flex-end' },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 2,
  },
  actionButton: {
    marginHorizontal: 0,
    paddingHorizontal: 4,
  },
});
