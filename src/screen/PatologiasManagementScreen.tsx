// src/screen/PatologiasManagementScreen.tsx
import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  DataTable,
  Text,
  Button,
  ActivityIndicator,
  TextInput,
  Title,
  Dialog,
  Portal,
} from 'react-native-paper';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import api from '../api';

interface Patologia {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
}

export default function PatologiasManagementScreen() {
  const queryClient = useQueryClient();
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingPatologia, setEditingPatologia] = useState<Patologia | null>(null);
  const [formData, setFormData] = useState<{
    codigo: string;
    nombre: string;
    descripcion: string;
  }>({
    codigo: '',
    nombre: '',
    descripcion: '',
  });

  // Consulta para obtener todas las patologías
  const {data: patologias = [], isLoading, error} = useQuery<Patologia[]>({
    queryKey: ['patologias'],
    queryFn: () => api.get('/patologias').then(res => res.data),
  });

  // Mutación para crear patología
  const createPatologiaMutation = useMutation({
    mutationFn: (patologia: {codigo: string; nombre: string; descripcion: string}) =>
      api.post('/patologias', patologia),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['patologias']});
      setDialogVisible(false);
      resetForm();
      Alert.alert('Éxito', 'Patología creada correctamente');
    },
    onError: (err: any) => {
      Alert.alert(
        'Error',
        err.response?.data?.message || 'No se pudo crear la patología',
      );
    },
  });

  // Mutación para actualizar patología
  const updatePatologiaMutation = useMutation({
    mutationFn: (patologia: Patologia) =>
      api.put(`/patologias/${patologia.id}`, {
        codigo: patologia.codigo,
        nombre: patologia.nombre,
        descripcion: patologia.descripcion,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['patologias']});
      setDialogVisible(false);
      resetForm();
      Alert.alert('Éxito', 'Patología actualizada correctamente');
    },
    onError: (err: any) => {
      Alert.alert(
        'Error',
        err.response?.data?.message || 'No se pudo actualizar la patología',
      );
    },
  });

  // Mutación para eliminar patología
  const deletePatologiaMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/patologias/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['patologias']});
      Alert.alert('Éxito', 'Patología eliminada correctamente');
    },
    onError: (err: any) => {
      Alert.alert(
        'Error',
        err.response?.data?.message || 'No se pudo eliminar la patología',
      );
    },
  });

  const handleEdit = (patologia: Patologia) => {
    setEditingPatologia(patologia);
    setFormData({
      codigo: patologia.codigo,
      nombre: patologia.nombre,
      descripcion: patologia.descripcion,
    });
    setDialogVisible(true);
  };

  const resetForm = () => {
    setEditingPatologia(null);
    setFormData({
      codigo: '',
      nombre: '',
      descripcion: '',
    });
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Está seguro que desea eliminar esta patología?',
      [
        {text: 'Cancelar', style: 'cancel'},
        {
          text: 'Eliminar',
          onPress: () => deletePatologiaMutation.mutate(id),
          style: 'destructive',
        },
      ],
    );
  };

  const handleSubmit = () => {
    if (!formData.codigo || !formData.nombre) {
      Alert.alert('Error', 'El código y nombre son obligatorios');
      return;
    }

    if (editingPatologia) {
      updatePatologiaMutation.mutate({
        ...editingPatologia,
        codigo: formData.codigo,
        nombre: formData.nombre,
        descripcion: formData.descripcion,
      });
    } else {
      createPatologiaMutation.mutate({
        codigo: formData.codigo,
        nombre: formData.nombre,
        descripcion: formData.descripcion,
      });
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Cargando patologías...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text>Error al cargar las patologías</Text>
        <Button
          mode="contained"
          onPress={() =>
            queryClient.invalidateQueries({queryKey: ['patologias']})
          }>
          Reintentar
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.headerContainer}>
          <Title style={styles.title}>Gestión de Patologías</Title>
          <Button
            mode="contained"
            icon="plus"
            onPress={() => {
              resetForm();
              setDialogVisible(true);
            }}>
            Nueva
          </Button>
        </View>

        <ScrollView horizontal contentContainerStyle={styles.tableWrapper}>
          <DataTable style={styles.table}>
            <DataTable.Header>
              <DataTable.Title style={styles.codigoCol}>Código</DataTable.Title>
              <DataTable.Title style={styles.nombreCol}>Nombre</DataTable.Title>
              <DataTable.Title style={styles.descCol}>Descripción</DataTable.Title>
              <DataTable.Title style={styles.actionsCol}>Acciones</DataTable.Title>
            </DataTable.Header>

            {patologias.map(patologia => (
              <DataTable.Row key={patologia.id.toString()}>
                <DataTable.Cell style={styles.codigoCol}>{patologia.codigo}</DataTable.Cell>
                <DataTable.Cell style={styles.nombreCol}>{patologia.nombre}</DataTable.Cell>
                <DataTable.Cell style={styles.descCol}>{patologia.descripcion}</DataTable.Cell>
                <DataTable.Cell style={styles.actionsCol}>
                  <View style={styles.actionsContainer}>
                    <Button
                      mode="outlined"
                      compact
                      style={styles.actionButton}
                      onPress={() => handleEdit(patologia)}>
                      Editar
                    </Button>
                    <Button
                      mode="outlined"
                      compact
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => handleDelete(patologia.id)}>
                      Eliminar
                    </Button>
                  </View>
                </DataTable.Cell>
              </DataTable.Row>
            ))}
          </DataTable>
        </ScrollView>
      </ScrollView>

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>
            {editingPatologia ? 'Editar Patología' : 'Nueva Patología'}
          </Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Código"
              value={formData.codigo}
              onChangeText={text => setFormData({...formData, codigo: text})}
              style={styles.input}
            />
            <TextInput
              label="Nombre"
              value={formData.nombre}
              onChangeText={text => setFormData({...formData, nombre: text})}
              style={styles.input}
            />
            <TextInput
              label="Descripción"
              value={formData.descripcion}
              onChangeText={text => setFormData({...formData, descripcion: text})}
              style={styles.input}
              multiline
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Cancelar</Button>
            <Button onPress={handleSubmit}>Guardar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  table: {
    marginBottom: 20,
  },
  tableWrapper: {
    paddingRight: 16,
  },
  codigoCol: {
    flex: 1,
  },
  nombreCol: {
    flex: 1.5,
  },
  descCol: {
    flex: 2,
  },
  actionsCol: {
    flex: 2,
    justifyContent: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  actionButton: {
    marginHorizontal: 4,
  },
  deleteButton: {
    borderColor: '#FF5252',
  },
  input: {
    marginBottom: 12,
  },
});

