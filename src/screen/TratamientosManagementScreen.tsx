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
import { Picker } from '@react-native-picker/picker';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import tratamientoService, {
  Tratamiento,
  TratamientoDTO,
  MedicamentoTratamientoDTO
} from '../services/tratamientoService';
import medicamentoService from '../services/medicamentoService';
import { theme } from '../theme';

export default function TratamientosManagementScreen() {
  const queryClient = useQueryClient();
  const [isTratamientoDialogOpen, setIsTratamientoDialogOpen] = useState(false);
  const [isMedicamentoDialogOpen, setIsMedicamentoDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [currentTratamiento, setCurrentTratamiento] = useState<Tratamiento | null>(null);
  const [currentTratamientoId, setCurrentTratamientoId] = useState<number | null>(null);

  // Estado para los formularios
  const [tratamientoFormData, setTratamientoFormData] = useState<TratamientoDTO>({
    nombre: '',
    atencionId: 0,
    descripcion: '',
    duracionDias: 0,
    fechaInicio: '',
    fechaFin: '',
    observaciones: ''
  });

  const [medicamentoFormData, setMedicamentoFormData] = useState<MedicamentoTratamientoDTO>({
    medicamentoId: 0,
    dosis: '',
    unidadMedida: '',
    frecuencia: '',
    duracionDias: 0,
    viaAdministracion: '',
    instrucciones: ''
  });

  // Consultas para obtener datos
  const {
    data: tratamientos = [],
    isLoading: isLoadingTratamientos,
    refetch: refetchTratamientos
  } = useQuery({
    queryKey: ['tratamientos'],
    queryFn: () => tratamientoService.getAllTratamientos().then(res => res.data),
  });

  const {
    data: medicamentos = [],
    isLoading: isLoadingMedicamentos
  } = useQuery({
    queryKey: ['medicamentos'],
    queryFn: () => medicamentoService.getAllMedicamentos().then(res => res.data),
  });

  // Mutaciones
  const tratamientoMutation = useMutation({
    mutationFn: async () => {
      if (isEditing && currentTratamiento) {
        return tratamientoService.updateTratamiento(currentTratamiento.id, tratamientoFormData);
      }
      return tratamientoService.createTratamiento(tratamientoFormData);
    },
    onSuccess: () => {
      Alert.alert(
        isEditing ? 'Tratamiento Actualizado' : 'Tratamiento Creado',
        `El tratamiento ha sido ${isEditing ? 'actualizado' : 'creado'} exitosamente.`
      );
      setIsTratamientoDialogOpen(false);
      resetTratamientoForm();
      refetchTratamientos();
    },
    onError: (error: any) => {
      console.error('Error en la mutación:', error);
      Alert.alert(
        'Error',
        isEditing
          ? 'No se pudo actualizar el tratamiento'
          : 'No se pudo crear el tratamiento'
      );
    },
  });

  const medicamentoMutation = useMutation({
    mutationFn: async () => {
      if (!currentTratamientoId) throw new Error('No hay tratamiento seleccionado');
      return tratamientoService.addMedicamentoToTratamiento(
        currentTratamientoId,
        medicamentoFormData
      );
    },
    onSuccess: async () => {
      Alert.alert('Éxito', 'Medicamento añadido al tratamiento correctamente');
      setIsMedicamentoDialogOpen(false);
      resetMedicamentoForm();

      if (currentTratamientoId) {
        // Actualizar solo el tratamiento modificado
        const response = await tratamientoService.getTratamientoById(currentTratamientoId);
        const updatedTratamiento = response.data;

        queryClient.setQueryData(['tratamientos'], (oldData: any) => {
          return oldData.map((t: Tratamiento) =>
            t.id === updatedTratamiento.id ? updatedTratamiento : t
          );
        });
      }
    },
    onError: () => {
      Alert.alert('Error', 'No se pudo añadir el medicamento al tratamiento');
    },
  });

  const deleteTratamientoMutation = useMutation({
    mutationFn: (id: number) => tratamientoService.deleteTratamiento(id),
    onSuccess: () => {
      Alert.alert('Éxito', 'Tratamiento eliminado correctamente');
      refetchTratamientos();
    },
    onError: () => {
      Alert.alert('Error', 'No se pudo eliminar el tratamiento');
    },
  });

  const deleteMedicamentoMutation = useMutation({
    mutationFn: ({ tratamientoId, medicamentoTratamientoId }: { tratamientoId: number, medicamentoTratamientoId: number }) =>
      tratamientoService.removeMedicamentoFromTratamiento(tratamientoId, medicamentoTratamientoId),
    onSuccess: async (_, variables) => {
      Alert.alert('Éxito', 'Medicamento eliminado del tratamiento correctamente');

      if (variables.tratamientoId) {
        // Actualizar solo el tratamiento modificado
        const response = await tratamientoService.getTratamientoById(variables.tratamientoId);
        const updatedTratamiento = response.data;

        queryClient.setQueryData(['tratamientos'], (oldData: any) => {
          return oldData.map((t: Tratamiento) =>
            t.id === updatedTratamiento.id ? updatedTratamiento : t
          );
        });
      }
    },
    onError: () => {
      Alert.alert('Error', 'No se pudo eliminar el medicamento del tratamiento');
    },
  });

  // Funciones auxiliares
  const resetTratamientoForm = () => {
    setTratamientoFormData({
      nombre: '',
      atencionId: 0,
      descripcion: '',
      duracionDias: 0,
      fechaInicio: '',
      fechaFin: '',
      observaciones: ''
    });
    setIsEditing(false);
    setCurrentTratamiento(null);
  };

  const resetMedicamentoForm = () => {
    setMedicamentoFormData({
      medicamentoId: 0,
      dosis: '',
      unidadMedida: '',
      frecuencia: '',
      duracionDias: 0,
      viaAdministracion: '',
      instrucciones: ''
    });
  };

  const openAddTratamientoDialog = () => {
    resetTratamientoForm();
    setIsTratamientoDialogOpen(true);
  };

  const openEditTratamientoDialog = (tratamiento: Tratamiento) => {
    setIsEditing(true);
    setCurrentTratamiento(tratamiento);
    setTratamientoFormData({
      nombre: tratamiento.nombre,
      atencionId: tratamiento.atencionId,
      descripcion: tratamiento.descripcion,
      duracionDias: tratamiento.duracionDias,
      fechaInicio: tratamiento.fechaInicio,
      fechaFin: tratamiento.fechaFin,
      observaciones: tratamiento.observaciones || ''
    });
    setIsTratamientoDialogOpen(true);
  };

  const openAddMedicamentoDialog = (tratamientoId: number) => {
    resetMedicamentoForm();
    setCurrentTratamientoId(tratamientoId);
    setIsMedicamentoDialogOpen(true);
  };

  const handleTratamientoInputChange = (name: string, value: string) => {
    setTratamientoFormData({
      ...tratamientoFormData,
      [name]: ['atencionId', 'duracionDias'].includes(name) ? parseInt(value) : value,
    });
  };

  const handleMedicamentoInputChange = (name: string, value: string) => {
    setMedicamentoFormData({
      ...medicamentoFormData,
      [name]: ['medicamentoId', 'duracionDias'].includes(name) ? parseInt(value) : value,
    });
  };

  const handleTratamientoSubmit = () => {
    if (
      !tratamientoFormData.nombre.trim() ||
      tratamientoFormData.atencionId <= 0 ||
      !tratamientoFormData.fechaInicio ||
      !tratamientoFormData.fechaFin
    ) {
      Alert.alert('Error', 'Por favor complete todos los campos requeridos');
      return;
    }
    tratamientoMutation.mutate();
  };

  const handleMedicamentoSubmit = () => {
    if (
      medicamentoFormData.medicamentoId <= 0 ||
      !medicamentoFormData.dosis.trim() ||
      !medicamentoFormData.unidadMedida ||
      !medicamentoFormData.frecuencia.trim() ||
      medicamentoFormData.duracionDias <= 0 ||
      !medicamentoFormData.viaAdministracion
    ) {
      Alert.alert('Error', 'Por favor complete todos los campos requeridos');
      return;
    }
    medicamentoMutation.mutate();
  };

  const handleDeleteTratamiento = (id: number) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que deseas eliminar este tratamiento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          onPress: () => deleteTratamientoMutation.mutate(id),
          style: 'destructive'
        }
      ]
    );
  };

  const handleDeleteMedicamento = (tratamientoId: number, medicamentoTratamientoId: number) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que deseas eliminar este medicamento del tratamiento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          onPress: () => deleteMedicamentoMutation.mutate({ tratamientoId, medicamentoTratamientoId }),
          style: 'destructive'
        }
      ]
    );
  };

  const formatFecha = (fechaStr: string) => {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString();
  };

  const toggleExpanded = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Renderizado de los elementos de la lista
  const renderTratamientoItem = ({ item }: { item: Tratamiento }) => (
    <View style={styles.card}>
      <TouchableOpacity onPress={() => toggleExpanded(item.id)}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardTitle}>Tratamiento #{item.id}</Text>
            <Text style={styles.subtitle}>
              Atención #{item.atencionId} | {formatFecha(item.fechaInicio)} - {formatFecha(item.fechaFin)}
            </Text>
          </View>
          <Text style={styles.expandIcon}>
            {expandedId === item.id ? '▼' : '▶'}
          </Text>
        </View>
      </TouchableOpacity>

      {expandedId === item.id && (
        <View style={styles.expandedContent}>
          {/* Detalles del tratamiento */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Detalles del Tratamiento</Text>
            <Text><Text style={styles.label}>Nombre:</Text> {item.nombre}</Text>
            <Text><Text style={styles.label}>Descripción:</Text> {item.descripcion}</Text>
            <Text><Text style={styles.label}>Duración:</Text> {item.duracionDias} días</Text>
            {item.observaciones && (
              <Text><Text style={styles.label}>Observaciones:</Text> {item.observaciones}</Text>
            )}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => openEditTratamientoDialog(item)}
              >
                <Text style={styles.editButtonText}>Editar Tratamiento</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteTratamiento(item.id)}
              >
                <Text style={styles.deleteButtonText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Medicamentos asociados */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Medicamentos Asignados</Text>
              <TouchableOpacity
                style={styles.addMedicamentoButton}
                onPress={() => openAddMedicamentoDialog(item.id)}
              >
                <Text style={styles.addMedicamentoButtonText}>+ Añadir Medicamento</Text>
              </TouchableOpacity>
            </View>

            {item.medicamentosTratamiento && item.medicamentosTratamiento.length > 0 ? (
              item.medicamentosTratamiento.map((med: any) => (
                <View key={med.id} style={styles.medicamentoCard}>
                  <View style={styles.medicamentoDetails}>
                    <Text style={styles.medicamentoName}>{med.nombreMedicamento}</Text>
                    <Text>Dosis: {med.dosis} {med.unidadMedida}</Text>
                    <Text>Frecuencia: {med.frecuencia}</Text>
                    <Text>Duración: {med.duracionDias} días</Text>
                    <Text>Vía: {med.viaAdministracion}</Text>
                    {med.instrucciones && (
                      <Text>Instrucciones: {med.instrucciones}</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.deleteMedicamentoButton}
                    onPress={() => handleDeleteMedicamento(item.id, med.id)}
                  >
                    <Text style={styles.deleteMedicamentoText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No hay medicamentos asignados a este tratamiento</Text>
            )}
          </View>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gestión de Tratamientos</Text>
      </View>

      <TouchableOpacity style={styles.addButton} onPress={openAddTratamientoDialog}>
        <Text style={styles.addButtonText}>+ Agregar Tratamiento</Text>
      </TouchableOpacity>

      {isLoadingTratamientos ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loading} />
      ) : tratamientos.length === 0 ? (
        <Text style={styles.emptyText}>No hay tratamientos disponibles</Text>
      ) : (
        <FlatList
          data={tratamientos}
          renderItem={renderTratamientoItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.list}
        />
      )}

      {/* Modal para crear/editar tratamiento */}
      <Modal
        visible={isTratamientoDialogOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsTratamientoDialogOpen(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {isEditing ? 'Editar Tratamiento' : 'Agregar Nuevo Tratamiento'}
            </Text>

            <ScrollView>
              <View style={styles.formGroup}>
                <Text style={styles.label}>ID de la Atención *</Text>
                <TextInput
                  style={styles.input}
                  value={tratamientoFormData.atencionId.toString()}
                  onChangeText={(text) => handleTratamientoInputChange('atencionId', text)}
                  placeholder="ID de la atención"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Nombre del Tratamiento *</Text>
                <TextInput
                  style={styles.input}
                  value={tratamientoFormData.nombre}
                  onChangeText={(text) => handleTratamientoInputChange('nombre', text)}
                  placeholder="Nombre del tratamiento"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Descripción *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={tratamientoFormData.descripcion}
                  onChangeText={(text) => handleTratamientoInputChange('descripcion', text)}
                  placeholder="Descripción del tratamiento"
                  multiline
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Duración (días) *</Text>
                <TextInput
                  style={styles.input}
                  value={tratamientoFormData.duracionDias.toString()}
                  onChangeText={(text) => handleTratamientoInputChange('duracionDias', text)}
                  placeholder="Duración en días"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Fecha Inicio *</Text>
                <TextInput
                  style={styles.input}
                  value={tratamientoFormData.fechaInicio}
                  onChangeText={(text) => handleTratamientoInputChange('fechaInicio', text)}
                  placeholder="YYYY-MM-DD"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Fecha Fin *</Text>
                <TextInput
                  style={styles.input}
                  value={tratamientoFormData.fechaFin}
                  onChangeText={(text) => handleTratamientoInputChange('fechaFin', text)}
                  placeholder="YYYY-MM-DD"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Observaciones</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={tratamientoFormData.observaciones}
                  onChangeText={(text) => handleTratamientoInputChange('observaciones', text)}
                  placeholder="Observaciones adicionales"
                  multiline
                />
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsTratamientoDialogOpen(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleTratamientoSubmit}
                disabled={tratamientoMutation.isPending}
              >
                {tratamientoMutation.isPending ? (
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

      {/* Modal para añadir medicamento al tratamiento */}
      <Modal
        visible={isMedicamentoDialogOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsMedicamentoDialogOpen(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Añadir Medicamento al Tratamiento
            </Text>

            <ScrollView>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Medicamento *</Text>
                {isLoadingMedicamentos ? (
                  <ActivityIndicator size="small" />
                ) : (
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={medicamentoFormData.medicamentoId.toString()}
                      onValueChange={(value) => handleMedicamentoInputChange('medicamentoId', value)}
                      style={styles.picker}
                    >
                      <Picker.Item label="Seleccionar medicamento" value="0" enabled={medicamentoFormData.medicamentoId === 0} />
                      {medicamentos.map((med: { id: number; nombre: string; fabricante: string }) => (
                        <Picker.Item
                          key={med.id}
                          label={`${med.nombre} - ${med.fabricante}`}
                          value={med.id.toString()}
                        />
                      ))}
                    </Picker>
                  </View>
                )}
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Dosis *</Text>
                  <TextInput
                    style={styles.input}
                    value={medicamentoFormData.dosis}
                    onChangeText={(text) => handleMedicamentoInputChange('dosis', text)}
                    placeholder="Cantidad"
                  />
                </View>

                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Unidad *</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={medicamentoFormData.unidadMedida}
                      onValueChange={(value) => handleMedicamentoInputChange('unidadMedida', value)}
                      style={styles.picker}
                    >
                      <Picker.Item label="Seleccionar" value="" enabled={medicamentoFormData.unidadMedida === ""} />
                      <Picker.Item label="Gotas" value="gotas" />
                      <Picker.Item label="Tabletas" value="tabletas" />
                      <Picker.Item label="ml" value="ml" />
                      <Picker.Item label="mg" value="mg" />
                      <Picker.Item label="Unidades" value="unidades" />
                    </Picker>
                  </View>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Frecuencia *</Text>
                <TextInput
                  style={styles.input}
                  value={medicamentoFormData.frecuencia}
                  onChangeText={(text) => handleMedicamentoInputChange('frecuencia', text)}
                  placeholder="Ej: Cada 8 horas, 1 vez al día"
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Duración (días) *</Text>
                  <TextInput
                    style={styles.input}
                    value={medicamentoFormData.duracionDias.toString()}
                    onChangeText={(text) => handleMedicamentoInputChange('duracionDias', text)}
                    placeholder="Días"
                    keyboardType="numeric"
                  />
                </View>

                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Vía *</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={medicamentoFormData.viaAdministracion}
                      onValueChange={(value) => handleMedicamentoInputChange('viaAdministracion', value)}
                      style={styles.picker}
                    >
                      <Picker.Item label="Seleccionar" value="" enabled={medicamentoFormData.viaAdministracion === ""} />
                      <Picker.Item label="Oral" value="Oral" />
                      <Picker.Item label="Oftálmica" value="Oftálmica" />
                      <Picker.Item label="Tópica" value="Tópica" />
                      <Picker.Item label="Intravenosa" value="Intravenosa" />
                      <Picker.Item label="Intramuscular" value="Intramuscular" />
                      <Picker.Item label="Subcutánea" value="Subcutánea" />
                    </Picker>
                  </View>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Instrucciones Específicas</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={medicamentoFormData.instrucciones}
                  onChangeText={(text) => handleMedicamentoInputChange('instrucciones', text)}
                  placeholder="Instrucciones adicionales para este medicamento"
                  multiline
                />
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsMedicamentoDialogOpen(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleMedicamentoSubmit}
                disabled={medicamentoMutation.isPending}
              >
                {medicamentoMutation.isPending ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.saveButtonText}>Añadir</Text>
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  expandIcon: {
    fontSize: 18,
    color: theme.colors.primary,
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  label: {
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    marginTop: 12,
  },
  editButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginRight: 8,
  },
  editButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  addMedicamentoButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  addMedicamentoButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  medicamentoCard: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  medicamentoDetails: {
    flex: 1,
  },
  medicamentoName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  deleteMedicamentoButton: {
    backgroundColor: '#dc3545',
    alignSelf: 'flex-start',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteMedicamentoText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loading: {
    marginTop: 50,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 12,
    color: '#666',
    fontStyle: 'italic',
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
  formRow: {
    flexDirection: 'row',
    marginBottom: 16,
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
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
