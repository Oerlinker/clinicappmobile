import React, { useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import medicamentoService, { Medicamento, MedicamentoDTO } from '../services/medicamentoService';
import { theme } from '../theme';

export default function MedicamentosManagementScreen() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentMedicamento, setCurrentMedicamento] = useState<Medicamento | null>(null);
  const [formData, setFormData] = useState<MedicamentoDTO>({
    nombre: '',
    descripcion: '',
    fabricante: '',
    efectosSecundarios: '',
  });

  // Consulta para obtener medicamentos
  const {
    data: medicamentos = [],
    isLoading,
  } = useQuery({
    queryKey: ['medicamentos'],
    queryFn: () => medicamentoService.getAllMedicamentos().then(res => res.data),
  });

  // Mutación para crear/actualizar medicamento
  const mutation = useMutation({
    mutationFn: async () => {
      if (isEditing && currentMedicamento) {
        return medicamentoService.updateMedicamento(currentMedicamento.id, formData);
      }
      return medicamentoService.createMedicamento(formData);
    },
    onSuccess: () => {
      Alert.alert(
        isEditing ? 'Medicamento Actualizado' : 'Medicamento Creado',
        `El medicamento ha sido ${isEditing ? 'actualizado' : 'creado'} exitosamente.`
      );
      setIsDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['medicamentos'] });
    },
    onError: (error: any) => {
      console.error('Error en la mutación:', error);
      Alert.alert(
        'Error',
        isEditing
          ? 'No se pudo actualizar el medicamento'
          : 'No se pudo crear el medicamento'
      );
    },
  });

  // Mutación para eliminar medicamento
  const deleteMutation = useMutation({
    mutationFn: (id: number) => medicamentoService.deleteMedicamento(id),
    onSuccess: () => {
      Alert.alert('Éxito', 'Medicamento eliminado correctamente');
      queryClient.invalidateQueries({ queryKey: ['medicamentos'] });
    },
    onError: () => {
      Alert.alert('Error', 'No se pudo eliminar el medicamento');
    },
  });

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      queryClient.invalidateQueries({ queryKey: ['medicamentos'] });
      return;
    }

    try {
      const response = await medicamentoService.buscarMedicamentosPorNombre(searchTerm);
      queryClient.setQueryData(['medicamentos'], response.data);
    } catch (error) {
      Alert.alert('Error', 'Error al buscar medicamentos');
    }
  };

  const handleInputChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      fabricante: '',
      efectosSecundarios: '',
    });
    setIsEditing(false);
    setCurrentMedicamento(null);
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (medicamento: Medicamento) => {
    setIsEditing(true);
    setCurrentMedicamento(medicamento);
    setFormData({
      nombre: medicamento.nombre,
      descripcion: medicamento.descripcion,
      fabricante: medicamento.fabricante,
      efectosSecundarios: medicamento.efectosSecundarios,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.nombre.trim() || !formData.fabricante.trim()) {
      Alert.alert('Error', 'Nombre y fabricante son campos requeridos');
      return;
    }
    mutation.mutate();
  };

  const handleDelete = async (id: number) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que deseas eliminar este medicamento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          onPress: () => deleteMutation.mutate(id),
          style: 'destructive'
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: Medicamento }) => (
    <View style={styles.card}>
      <View>
        <Text style={styles.title}>{item.nombre}</Text>
        <Text>Fabricante: {item.fabricante}</Text>
        <Text>Efectos secundarios: {item.efectosSecundarios}</Text>
        <Text>Estado: {item.activo ? 'Activo' : 'Inactivo'}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => openEditDialog(item)}
        >
          <Text style={styles.editButtonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item.id)}
        >
          <Text style={styles.deleteButtonText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gestión de Medicamentos</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Buscar</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.addButton} onPress={openAddDialog}>
        <Text style={styles.addButtonText}>+ Agregar Medicamento</Text>
      </TouchableOpacity>

      {isLoading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loading} />
      ) : medicamentos.length === 0 ? (
        <Text style={styles.emptyText}>No hay medicamentos disponibles</Text>
      ) : (
        <FlatList
          data={medicamentos}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.list}
        />
      )}

      {/* Modal para crear/editar */}
      <Modal
        visible={isDialogOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsDialogOpen(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {isEditing ? 'Editar Medicamento' : 'Agregar Medicamento'}
            </Text>

            <ScrollView>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Nombre *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.nombre}
                  onChangeText={(text) => handleInputChange('nombre', text)}
                  placeholder="Nombre del medicamento"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Descripción</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.descripcion}
                  onChangeText={(text) => handleInputChange('descripcion', text)}
                  placeholder="Descripción del medicamento"
                  multiline
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Fabricante *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.fabricante}
                  onChangeText={(text) => handleInputChange('fabricante', text)}
                  placeholder="Fabricante del medicamento"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Efectos Secundarios</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.efectosSecundarios}
                  onChangeText={(text) => handleInputChange('efectosSecundarios', text)}
                  placeholder="Efectos secundarios"
                  multiline
                />
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsDialogOpen(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSubmit}
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {isEditing ? 'Actualizar' : 'Guardar'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 10,
    marginRight: 8,
  },
  searchButton: {
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  searchButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    margin: 16,
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  editButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginRight: 8,
  },
  editButtonText: {
    color: 'white',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  deleteButtonText: {
    color: 'white',
  },
  loading: {
    marginTop: 50,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    color: '#666',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 16,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#666',
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});
