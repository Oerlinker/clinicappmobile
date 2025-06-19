// filepath: c:\Users\andre\clinicappmobile\src\screen\doctor\AtencionFormScreen.tsx
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {TextInput, Button, Checkbox} from 'react-native-paper';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {useMutation} from '@tanstack/react-query';
import api from '../../api';
import {theme} from '../../theme';
import {Picker} from '@react-native-picker/picker';
import {format, addDays} from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Tipos
interface Patologia {
  id: number;
  nombre: string;
}

interface Medicamento {
  id: number;
  nombre: string;
  fabricante: string;
}

interface MedicamentoTratamientoDTO {
  medicamentoId: number;
  dosis: string;
  unidadMedida: string;
  frecuencia: string;
  duracionDias: number;
  viaAdministracion: string;
  instrucciones: string;
}

interface TratamientoFormData {
  nombre: string;
  descripcion: string;
  duracionDias: number;
  fechaInicio: Date;
  fechaFin: Date;
  observaciones: string;
  medicamentos: MedicamentoTratamientoDTO[];
}

type AtencionRouteParamList = {
  AtencionForm: {
    citaId: number;
  };
};

const AtencionFormScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<AtencionRouteParamList, 'AtencionForm'>>();
  const citaId = route.params?.citaId;

  // Estados principales
  const [motivo, setMotivo] = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [patologias, setPatologias] = useState<Patologia[]>([]);
  const [patologiaId, setPatologiaId] = useState<number | null>(null);
  const [showTratamientoForm, setShowTratamientoForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para el tratamiento
  const [tratamientoForm, setTratamientoForm] = useState<TratamientoFormData>({
    nombre: '',
    descripcion: '',
    duracionDias: 7,
    fechaInicio: new Date(),
    fechaFin: addDays(new Date(), 7),
    observaciones: '',
    medicamentos: [],
  });

  // Estado para nuevo medicamento
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [nuevoMedicamento, setNuevoMedicamento] = useState<MedicamentoTratamientoDTO>({
    medicamentoId: 0,
    dosis: '',
    unidadMedida: '',
    frecuencia: '',
    duracionDias: 7,
    viaAdministracion: '',
    instrucciones: '',
  });

  // Controles fecha
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'inicio' | 'fin'>('inicio');

  // Consultas
  useEffect(() => {
    // Cargar patologías
    api.get<Patologia[]>('/patologias')
      .then(res => setPatologias(res.data))
      .catch(err => console.error('Error al cargar patologías', err));

    // Cargar medicamentos
    api.get<Medicamento[]>('/medicamentos')
      .then(res => setMedicamentos(res.data))
      .catch(err => console.error('Error al cargar medicamentos', err));
  }, []);

  // Mutación para guardar
  const guardarAtencionMutation = useMutation({
    mutationFn: async (data: any) => {
      return await api.post('/atenciones', data);
    },
    onSuccess: () => {
      navigation.goBack();
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Error al guardar la atención');
    }
  });

  // Manejadores de cambios en tratamiento
  const handleTratamientoChange = (name: string, value: any) => {
    setTratamientoForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNuevoMedicamentoChange = (name: string, value: any) => {
    setNuevoMedicamento(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const agregarMedicamento = () => {
    if (nuevoMedicamento.medicamentoId === 0) {
      setError('Debe seleccionar un medicamento');
      return;
    }

    setTratamientoForm(prev => ({
      ...prev,
      medicamentos: [...prev.medicamentos, nuevoMedicamento]
    }));

    // Resetear formulario de medicamento
    setNuevoMedicamento({
      medicamentoId: 0,
      dosis: '',
      unidadMedida: '',
      frecuencia: '',
      duracionDias: 7,
      viaAdministracion: '',
      instrucciones: '',
    });
  };

  const eliminarMedicamento = (index: number) => {
    setTratamientoForm(prev => {
      const meds = [...prev.medicamentos];
      meds.splice(index, 1);
      return {...prev, medicamentos: meds};
    });
  };

  // Manejo de fechas
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      if (datePickerMode === 'inicio') {
        const fechaFin = addDays(selectedDate, tratamientoForm.duracionDias);
        setTratamientoForm(prev => ({
          ...prev,
          fechaInicio: selectedDate,
          fechaFin: fechaFin
        }));
      } else {
        setTratamientoForm(prev => ({
          ...prev,
          fechaFin: selectedDate
        }));
      }
    }
  };

  const showDatepicker = (mode: 'inicio' | 'fin') => {
    setDatePickerMode(mode);
    setShowDatePicker(true);
  };

  // Enviar formulario
  const handleSubmit = () => {
    if (!motivo.trim() || !diagnostico.trim()) {
      setError('El motivo y el diagnóstico son obligatorios');
      return;
    }

    const payload: any = {
      citaId,
      motivo,
      diagnostico,
      observaciones,
    };

    if (patologiaId) {
      payload.patologiaId = patologiaId;
    }

    if (showTratamientoForm && tratamientoForm.nombre && tratamientoForm.descripcion) {
      payload.tratamientos = [
        {
          nombre: tratamientoForm.nombre,
          descripcion: tratamientoForm.descripcion,
          duracionDias: tratamientoForm.duracionDias,
          fechaInicio: format(tratamientoForm.fechaInicio, 'yyyy-MM-dd'),
          fechaFin: format(tratamientoForm.fechaFin, 'yyyy-MM-dd'),
          observaciones: tratamientoForm.observaciones,
          medicamentos: tratamientoForm.medicamentos
        }
      ];
    }

    guardarAtencionMutation.mutate(payload);
  };

  const getMedicamentoNombre = (id: number) => {
    const med = medicamentos.find(m => m.id === id);
    return med ? `${med.nombre} (${med.fabricante})` : 'Desconocido';
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Registrar Atención</Text>

      {error && (
        <Text style={styles.error}>{error}</Text>
      )}

      {/* Motivo */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Motivo:</Text>
        <TextInput
          mode="outlined"
          value={motivo}
          onChangeText={setMotivo}
          style={styles.input}
        />
      </View>

      {/* Diagnóstico */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Diagnóstico:</Text>
        <TextInput
          mode="outlined"
          multiline
          numberOfLines={3}
          value={diagnostico}
          onChangeText={setDiagnostico}
          style={styles.input}
        />
      </View>

      {/* Toggle tratamiento */}
      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => setShowTratamientoForm(!showTratamientoForm)}
      >
        <Checkbox
          status={showTratamientoForm ? 'checked' : 'unchecked'}
        />
        <Text style={styles.checkboxLabel}>Crear tratamiento estructurado</Text>
      </TouchableOpacity>

      {/* Formulario de tratamiento */}
      {showTratamientoForm && (
        <View style={styles.tratamientoContainer}>
          <Text style={styles.sectionTitle}>Detalles del Tratamiento</Text>

          {/* Nombre y descripción */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Nombre:</Text>
            <TextInput
              mode="outlined"
              value={tratamientoForm.nombre}
              onChangeText={value => handleTratamientoChange('nombre', value)}
              style={styles.input}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Descripción:</Text>
            <TextInput
              mode="outlined"
              multiline
              numberOfLines={3}
              value={tratamientoForm.descripcion}
              onChangeText={value => handleTratamientoChange('descripcion', value)}
              style={styles.input}
            />
          </View>

          {/* Duración y fechas */}
          <View style={styles.rowContainer}>
            <View style={[styles.formGroup, styles.rowItem]}>
              <Text style={styles.label}>Duración (días):</Text>
              <TextInput
                mode="outlined"
                keyboardType="numeric"
                value={tratamientoForm.duracionDias.toString()}
                onChangeText={value => {
                  const dias = parseInt(value) || 7;
                  handleTratamientoChange('duracionDias', dias);
                  // Actualizar fecha fin
                  const nuevaFechaFin = addDays(tratamientoForm.fechaInicio, dias);
                  handleTratamientoChange('fechaFin', nuevaFechaFin);
                }}
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.rowContainer}>
            <View style={[styles.formGroup, styles.rowItem]}>
              <Text style={styles.label}>Fecha Inicio:</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => showDatepicker('inicio')}
              >
                <Text>{format(tratamientoForm.fechaInicio, 'dd/MM/yyyy')}</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.formGroup, styles.rowItem]}>
              <Text style={styles.label}>Fecha Fin:</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => showDatepicker('fin')}
              >
                <Text>{format(tratamientoForm.fechaFin, 'dd/MM/yyyy')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {showDatePicker && (
            <DateTimePicker
              testID="dateTimePicker"
              value={datePickerMode === 'inicio' ? tratamientoForm.fechaInicio : tratamientoForm.fechaFin}
              mode="date"
              is24Hour={true}
              onChange={handleDateChange}
            />
          )}

          {/* Observaciones */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Observaciones:</Text>
            <TextInput
              mode="outlined"
              multiline
              numberOfLines={3}
              value={tratamientoForm.observaciones}
              onChangeText={value => handleTratamientoChange('observaciones', value)}
              style={styles.input}
            />
          </View>

          {/* Medicamentos */}
          <Text style={styles.sectionTitle}>Agregar Medicamento</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Medicamento:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={nuevoMedicamento.medicamentoId}
                onValueChange={value => handleNuevoMedicamentoChange('medicamentoId', value)}
                style={styles.picker}
              >
                <Picker.Item label="-- Seleccionar --" value={0} />
                {medicamentos.map(med => (
                  <Picker.Item
                    key={med.id}
                    label={`${med.nombre} (${med.fabricante})`}
                    value={med.id}
                  />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.rowContainer}>
            <View style={[styles.formGroup, styles.rowItem]}>
              <Text style={styles.label}>Dosis:</Text>
              <TextInput
                mode="outlined"
                value={nuevoMedicamento.dosis}
                onChangeText={value => handleNuevoMedicamentoChange('dosis', value)}
                style={styles.input}
              />
            </View>

            <View style={[styles.formGroup, styles.rowItem]}>
              <Text style={styles.label}>Unidad:</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={nuevoMedicamento.unidadMedida}
                  onValueChange={value => handleNuevoMedicamentoChange('unidadMedida', value)}
                  style={styles.picker}
                >
                  <Picker.Item label="-- --" value="" />
                  <Picker.Item label="Gotas" value="gotas" />
                  <Picker.Item label="Tabletas" value="tabletas" />
                  <Picker.Item label="ml" value="ml" />
                  <Picker.Item label="mg" value="mg" />
                </Picker>
              </View>
            </View>
          </View>

          <View style={styles.rowContainer}>
            <View style={[styles.formGroup, styles.rowItem]}>
              <Text style={styles.label}>Frecuencia:</Text>
              <TextInput
                mode="outlined"
                value={nuevoMedicamento.frecuencia}
                onChangeText={value => handleNuevoMedicamentoChange('frecuencia', value)}
                placeholder="Ej: Cada 8 h"
                style={styles.input}
              />
            </View>

            <View style={[styles.formGroup, styles.rowItem]}>
              <Text style={styles.label}>Duración (días):</Text>
              <TextInput
                mode="outlined"
                keyboardType="numeric"
                value={nuevoMedicamento.duracionDias.toString()}
                onChangeText={value => handleNuevoMedicamentoChange('duracionDias', parseInt(value) || 7)}
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Vía:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={nuevoMedicamento.viaAdministracion}
                onValueChange={value => handleNuevoMedicamentoChange('viaAdministracion', value)}
                style={styles.picker}
              >
                <Picker.Item label="-- --" value="" />
                <Picker.Item label="Oral" value="Oral" />
                <Picker.Item label="Oftálmica" value="Oftálmica" />
                <Picker.Item label="Tópica" value="Tópica" />
                <Picker.Item label="Intravenosa" value="Intravenosa" />
              </Picker>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Instrucciones:</Text>
            <TextInput
              mode="outlined"
              value={nuevoMedicamento.instrucciones}
              onChangeText={value => handleNuevoMedicamentoChange('instrucciones', value)}
              style={styles.input}
            />
          </View>

          <Button
            mode="contained"
            onPress={agregarMedicamento}
            style={styles.button}
          >
            Agregar al tratamiento
          </Button>

          {/* Lista de medicamentos */}
          {tratamientoForm.medicamentos.length > 0 && (
            <View style={styles.medicamentosContainer}>
              <Text style={styles.sectionTitle}>Medicamentos en este tratamiento</Text>

              {tratamientoForm.medicamentos.map((med, i) => (
                <View key={i} style={styles.medicamentoItem}>
                  <View style={styles.medicamentoInfo}>
                    <Text style={styles.medicamentoNombre}>
                      {getMedicamentoNombre(med.medicamentoId)}
                    </Text>
                    <Text style={styles.medicamentoDetalle}>
                      {med.dosis} {med.unidadMedida}, {med.frecuencia}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => eliminarMedicamento(i)}
                    style={styles.deleteButton}
                  >
                    <Icon name="trash-can-outline" size={24} color="red" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Observaciones */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Observaciones:</Text>
        <TextInput
          mode="outlined"
          multiline
          numberOfLines={3}
          value={observaciones}
          onChangeText={setObservaciones}
          style={styles.input}
        />
      </View>

      {/* Patología */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Patología (opcional):</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={patologiaId}
            onValueChange={setPatologiaId}
            style={styles.picker}
          >
            <Picker.Item label="-- Ninguna --" value={null} />
            {patologias.map(p => (
              <Picker.Item
                key={p.id}
                label={p.nombre}
                value={p.id}
              />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={guardarAtencionMutation.isPending}
          disabled={guardarAtencionMutation.isPending}
          style={styles.submitButton}
        >
          Guardar Atención
        </Button>

        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={styles.cancelButton}
        >
          Cancelar
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: theme.colors.primary,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 4,
    color: '#555',
  },
  input: {
    backgroundColor: 'white',
  },
  error: {
    color: 'red',
    marginBottom: 10,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 16,
  },
  tratamientoContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: theme.colors.primary,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowItem: {
    flex: 1,
    marginRight: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    backgroundColor: 'white',
  },
  picker: {
    height: 50,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 4,
    backgroundColor: 'white',
  },
  button: {
    marginTop: 8,
  },
  medicamentosContainer: {
    marginTop: 16,
  },
  medicamentoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginBottom: 8,
  },
  medicamentoInfo: {
    flex: 1,
  },
  medicamentoNombre: {
    fontWeight: 'bold',
  },
  medicamentoDetalle: {
    color: '#555',
  },
  deleteButton: {
    padding: 4,
  },
  buttonContainer: {
    marginTop: 16,
    marginBottom: 32,
  },
  submitButton: {
    marginBottom: 12,
  },
  cancelButton: {
    borderColor: theme.colors.primary,
  },
});

export default AtencionFormScreen;
