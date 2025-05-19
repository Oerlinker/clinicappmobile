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
import DeptEmployees from '../components/DeptEmployees';

interface Departamento {
  id: number;
  nombre: string;
  descripcion: string;
}

export default function DeptManagementScreen() {
  const queryClient = useQueryClient();
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingDept, setEditingDept] = useState<Departamento | null>(null);
  const [newDept, setNewDept] = useState<{nombre: string; descripcion: string}>(
    {
      nombre: '',
      descripcion: '',
    },
  );

  // Estados para gestión de empleados
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  const [showEmployees, setShowEmployees] = useState(false);

  // Consulta para obtener todos los departamentos
  const {
    data: departamentos = [],
    isLoading,
    error,
  } = useQuery<Departamento[]>({
    queryKey: ['departamentos'],
    queryFn: () => api.get('/departamentos').then(res => res.data),
  });

  // Mutación para crear departamento
  const createDeptMutation = useMutation({
    mutationFn: (dept: {nombre: string; descripcion: string}) =>
      api.post('/departamentos', dept),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['departamentos']});
      setDialogVisible(false);
      setNewDept({nombre: '', descripcion: ''});
      Alert.alert('Éxito', 'Departamento creado correctamente');
    },
    onError: (err: any) => {
      Alert.alert(
        'Error',
        err.response?.data?.message || 'No se pudo crear el departamento',
      );
    },
  });

  // Mutación para actualizar departamento
  const updateDeptMutation = useMutation({
    mutationFn: (dept: Departamento) =>
      api.put(`/departamentos/${dept.id}`, {
        nombre: dept.nombre,
        descripcion: dept.descripcion,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['departamentos']});
      setDialogVisible(false);
      setEditingDept(null);
      Alert.alert('Éxito', 'Departamento actualizado correctamente');
    },
    onError: (err: any) => {
      Alert.alert(
        'Error',
        err.response?.data?.message || 'No se pudo actualizar el departamento',
      );
    },
  });

  // Mutación para eliminar departamento
  const deleteDeptMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/departamentos/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['departamentos']});
      Alert.alert('Éxito', 'Departamento eliminado correctamente');
    },
    onError: (err: any) => {
      Alert.alert(
        'Error',
        err.response?.data?.message || 'No se pudo eliminar el departamento',
      );
    },
  });

  const handleEdit = (dept: Departamento) => {
    setEditingDept(dept);
    setNewDept({
      nombre: dept.nombre,
      descripcion: dept.descripcion,
    });
    setDialogVisible(true);
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Está seguro que desea eliminar este departamento?',
      [
        {text: 'Cancelar', style: 'cancel'},
        {
          text: 'Eliminar',
          onPress: () => deleteDeptMutation.mutate(id),
          style: 'destructive',
        },
      ],
    );
  };

  const handleSubmit = () => {
    if (!newDept.nombre) {
      Alert.alert('Error', 'El nombre del departamento es obligatorio');
      return;
    }

    if (editingDept) {
      updateDeptMutation.mutate({
        ...editingDept,
        nombre: newDept.nombre,
        descripcion: newDept.descripcion,
      });
    } else {
      createDeptMutation.mutate(newDept);
    }
  };

  const handleManageEmployees = (dept: Departamento) => {
    setSelectedDeptId(dept.id.toString());
    setShowEmployees(true);
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Cargando departamentos...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text>Error al cargar los departamentos</Text>
        <Button
          mode="contained"
          onPress={() =>
            queryClient.invalidateQueries({queryKey: ['departamentos']})
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
          <Title style={styles.title}>Gestión de Departamentos</Title>
          <Button
            mode="contained"
            icon="plus"
            onPress={() => {
              setEditingDept(null);
              setNewDept({nombre: '', descripcion: ''});
              setDialogVisible(true);
            }}>
            Nuevo
          </Button>
        </View>

        <DataTable style={styles.table}>
          <DataTable.Header>
            <DataTable.Title style={styles.idCol}>ID</DataTable.Title>
            <DataTable.Title style={styles.nameCol}>Nombre</DataTable.Title>
            <DataTable.Title style={styles.descCol}>
              Descripción
            </DataTable.Title>
            <DataTable.Title style={styles.actionsCol}>
              Acciones
            </DataTable.Title>
          </DataTable.Header>

          {departamentos.map(dept => (
            <DataTable.Row key={dept.id.toString()}>
              <DataTable.Cell style={styles.idCol}>{dept.id}</DataTable.Cell>
              <DataTable.Cell style={styles.nameCol}>
                {dept.nombre}
              </DataTable.Cell>
              <DataTable.Cell style={styles.descCol}>
                {dept.descripcion}
              </DataTable.Cell>
              <DataTable.Cell style={styles.actionsCol}>
                <View style={styles.actionsContainer}>
                  <Button
                    mode="outlined"
                    compact
                    style={styles.actionButton}
                    onPress={() => handleEdit(dept)}>
                    Editar
                  </Button>
                  <Button
                    mode="outlined"
                    compact
                    style={styles.actionButton}
                    onPress={() => handleManageEmployees(dept)}>
                    Empleados
                  </Button>
                  <Button
                    mode="outlined"
                    compact
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDelete(dept.id)}>
                    Eliminar
                  </Button>
                </View>
              </DataTable.Cell>
            </DataTable.Row>
          ))}
        </DataTable>
      </ScrollView>

      <Portal>
        {/* Diálogo para editar/crear departamento */}
        <Dialog
          visible={dialogVisible}
          onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>
            {editingDept ? 'Editar Departamento' : 'Nuevo Departamento'}
          </Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Nombre"
              value={newDept.nombre}
              onChangeText={text => setNewDept({...newDept, nombre: text})}
              style={styles.input}
            />
            <TextInput
              label="Descripción"
              value={newDept.descripcion}
              onChangeText={text => setNewDept({...newDept, descripcion: text})}
              style={styles.input}
              multiline
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Cancelar</Button>
            <Button onPress={handleSubmit}>Guardar</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Diálogo para gestionar empleados */}
        <Dialog
          visible={showEmployees}
          onDismiss={() => setShowEmployees(false)}
          style={{maxHeight: '80%'}}>
          <Dialog.Title>Gestionar Empleados</Dialog.Title>
          <Dialog.ScrollArea>
            {selectedDeptId && <DeptEmployees deptId={selectedDeptId} />}
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setShowEmployees(false)}>Cerrar</Button>
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
  idCol: {
    flex: 0.5,
  },
  nameCol: {
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
