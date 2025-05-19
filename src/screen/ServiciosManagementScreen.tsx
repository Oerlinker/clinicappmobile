import React, {useState} from 'react';
import {View, StyleSheet, ScrollView, Alert} from 'react-native';
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

interface Servicio {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
}

export default function ServiciosManagementScreen() {
  const queryClient = useQueryClient();
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingServicio, setEditingServicio] = useState<Servicio | null>(null);
  const [formData, setFormData] = useState<{
    nombre: string;
    descripcion: string;
    precio: string;
  }>({
    nombre: '',
    descripcion: '',
    precio: '',
  });

  // Consulta para obtener todos los servicios
  const {
    data: servicios = [],
    isLoading,
    error,
  } = useQuery<Servicio[]>({
    queryKey: ['servicios'],
    queryFn: () => api.get('/servicios').then(res => res.data),
  });

  // Mutación para crear servicio
  const createServicioMutation = useMutation({
    mutationFn: (servicio: {
      nombre: string;
      descripcion: string;
      precio: number;
    }) => api.post('/servicios', servicio),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['servicios']});
      setDialogVisible(false);
      resetForm();
      Alert.alert('Éxito', 'Servicio creado correctamente');
    },
    onError: (err: any) => {
      Alert.alert(
        'Error',
        err.response?.data?.message || 'No se pudo crear el servicio',
      );
    },
  });

  // Mutación para actualizar servicio
  const updateServicioMutation = useMutation({
    mutationFn: (servicio: Servicio) =>
      api.put(`/servicios/${servicio.id}`, {
        nombre: servicio.nombre,
        descripcion: servicio.descripcion,
        precio: servicio.precio,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['servicios']});
      setDialogVisible(false);
      setEditingServicio(null);
      Alert.alert('Éxito', 'Servicio actualizado correctamente');
    },
    onError: (err: any) => {
      Alert.alert(
        'Error',
        err.response?.data?.message || 'No se pudo actualizar el servicio',
      );
    },
  });

  // Mutación para eliminar servicio
  const deleteServicioMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/servicios/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['servicios']});
      Alert.alert('Éxito', 'Servicio eliminado correctamente');
    },
    onError: (err: any) => {
      Alert.alert(
        'Error',
        err.response?.data?.message || 'No se pudo eliminar el servicio',
      );
    },
  });

  const handleEdit = (servicio: Servicio) => {
    setEditingServicio(servicio);
    setFormData({
      nombre: servicio.nombre,
      descripcion: servicio.descripcion,
      precio: servicio.precio.toString(),
    });
    setDialogVisible(true);
  };

  const resetForm = () => {
    setEditingServicio(null);
    setFormData({
      nombre: '',
      descripcion: '',
      precio: '',
    });
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Está seguro que desea eliminar este servicio?',
      [
        {text: 'Cancelar', style: 'cancel'},
        {
          text: 'Eliminar',
          onPress: () => deleteServicioMutation.mutate(id),
          style: 'destructive',
        },
      ],
    );
  };

  const handleSubmit = () => {
    if (!formData.nombre) {
      Alert.alert('Error', 'El nombre del servicio es obligatorio');
      return;
    }

    const precio = parseFloat(formData.precio);
    if (isNaN(precio) || precio <= 0) {
      Alert.alert('Error', 'Por favor ingrese un precio válido mayor a 0');
      return;
    }

    if (editingServicio) {
      updateServicioMutation.mutate({
        ...editingServicio,
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        precio: precio,
      });
    } else {
      createServicioMutation.mutate({
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        precio: precio,
      });
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Cargando servicios...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text>Error al cargar los servicios</Text>
        <Button
          mode="contained"
          onPress={() =>
            queryClient.invalidateQueries({queryKey: ['servicios']})
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
          <Title style={styles.title}>Gestión de Servicios</Title>
          <Button
            mode="contained"
            icon="plus"
            onPress={() => {
              resetForm();
              setDialogVisible(true);
            }}>
            Nuevo
          </Button>
        </View>

        <DataTable style={styles.table}>
          <DataTable.Header>
            <DataTable.Title style={styles.nombreCol}>Nombre</DataTable.Title>
            <DataTable.Title style={styles.descCol}>
              Descripción
            </DataTable.Title>
            <DataTable.Title style={styles.precioCol}>Precio</DataTable.Title>
            <DataTable.Title style={styles.actionsCol}>
              Acciones
            </DataTable.Title>
          </DataTable.Header>

          {servicios.map(servicio => (
            <DataTable.Row key={servicio.id.toString()}>
              <DataTable.Cell style={styles.nombreCol}>
                {servicio.nombre}
              </DataTable.Cell>
              <DataTable.Cell style={styles.descCol}>
                {servicio.descripcion}
              </DataTable.Cell>
              <DataTable.Cell style={styles.precioCol}>
                {`$${servicio.precio.toLocaleString()}`}
              </DataTable.Cell>
              <DataTable.Cell style={styles.actionsCol}>
                <View style={styles.actionsContainer}>
                  <Button
                    mode="outlined"
                    compact
                    style={styles.actionButton}
                    onPress={() => handleEdit(servicio)}>
                    Editar
                  </Button>
                  <Button
                    mode="outlined"
                    compact
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDelete(servicio.id)}>
                    Eliminar
                  </Button>
                </View>
              </DataTable.Cell>
            </DataTable.Row>
          ))}
        </DataTable>
      </ScrollView>

      <Portal>
        <Dialog
          visible={dialogVisible}
          onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>
            {editingServicio ? 'Editar Servicio' : 'Registrar Servicio'}
          </Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Nombre"
              value={formData.nombre}
              onChangeText={text => setFormData({...formData, nombre: text})}
              style={styles.input}
            />
            <TextInput
              label="Descripción"
              value={formData.descripcion}
              onChangeText={text =>
                setFormData({...formData, descripcion: text})
              }
              style={styles.input}
              multiline
            />
            <TextInput
              label="Precio"
              value={formData.precio}
              onChangeText={text => setFormData({...formData, precio: text})}
              style={styles.input}
              keyboardType="numeric"
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
  nombreCol: {
    flex: 1.5,
  },
  descCol: {
    flex: 2,
  },
  precioCol: {
    flex: 1,
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
