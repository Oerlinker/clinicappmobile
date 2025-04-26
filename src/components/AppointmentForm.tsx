import React, {useState, useEffect, useContext} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import {format} from 'date-fns';
import {es} from 'date-fns/locale';
import {AuthContext} from '../context/AuthContext';
import api from '../api';

interface AppointmentFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface Doctor {
  id: number;
  usuario: {
    nombre: string;
    apellido: string;
  };
}

const AppointmentForm = ({onSuccess, onCancel}: AppointmentFormProps) => {
  const {user} = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  // Datos para selección
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointmentTypes] = useState([
    {id: 'Rutina', nombre: 'Rutina'},
    {id: 'Control', nombre: 'Control'},
    {id: 'Pediátrica', nombre: 'Pediátrica'},
    {id: 'Pre-quirúrgica', nombre: 'Pre-quirúrgica'},
    {id: 'Post-quirúrgica', nombre: 'Post-quirúrgica'},
  ]);

  // Valores del formulario
  const [selectedDoctor, setSelectedDoctor] = useState<string | number>('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    setLoadingDoctors(true);
    try {
      const response = await api.get('/empleados/doctores');
      setDoctors(response.data);
    } catch (error) {
      console.error('Error al cargar doctores:', error);
      Alert.alert('Error', 'No se pudieron cargar los doctores');
    } finally {
      setLoadingDoctors(false);
    }
  };

  const handleDateChange = (event: DateTimePickerEvent, date?: Date) => {
    setShowDatePicker(false);
    if (date) setSelectedDate(date);
  };

  const handleTimeChange = (event: DateTimePickerEvent, time?: Date) => {
    setShowTimePicker(false);
    if (time) setSelectedTime(time);
  };

  const validateForm = () => {
    if (!selectedDoctor) {
      Alert.alert('Error', 'Por favor selecciona un médico');
      return false;
    }

    if (!selectedType) {
      Alert.alert('Error', 'Por favor selecciona un tipo de cita');
      return false;
    }

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    const selectedDateCopy = new Date(selectedDate);
    selectedDateCopy.setHours(0, 0, 0, 0);

    if (selectedDateCopy < currentDate) {
      Alert.alert('Error', 'La fecha de la cita no puede ser en el pasado');
      return false;
    }
    return true;
  };

  const scheduleAppointment = async () => {
    if (!validateForm()) return;
    if (!user) {
      Alert.alert('Error', 'No se pudo identificar al usuario');
      return;
    }

    setLoading(true);
    try {
      const appointmentData = {
        fecha: format(selectedDate, 'yyyy-MM-dd'),
        hora: format(selectedTime, 'HH:mm'),
        estado: 'AGENDADA',
        tipo: selectedType,
        paciente: {id: user.id},
        doctor: {id: Number(selectedDoctor)},
      };

      await api.post('/citas', appointmentData);
      onSuccess();
    } catch (error) {
      console.error('Error al agendar cita:', error);
      Alert.alert(
        'Error',
        'No se pudo agendar la cita. Por favor, verifica los datos e inténtalo nuevamente.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Fecha</Text>
        <TouchableOpacity
          style={styles.dateInput}
          onPress={() => setShowDatePicker(true)}>
          <Text>{format(selectedDate, 'dd/MM/yyyy', {locale: es})}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Hora</Text>
        <TouchableOpacity
          style={styles.dateInput}
          onPress={() => setShowTimePicker(true)}>
          <Text>{format(selectedTime, 'HH:mm', {locale: es})}</Text>
        </TouchableOpacity>
        {showTimePicker && (
          <DateTimePicker
            value={selectedTime}
            mode="time"
            is24Hour={true}
            display="default"
            onChange={handleTimeChange}
          />
        )}
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Tipo de Cita</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedType}
            style={styles.picker}
            onValueChange={itemValue => setSelectedType(itemValue)}>
            <Picker.Item label="Seleccione un tipo" value="" />
            {appointmentTypes.map(type => (
              <Picker.Item key={type.id} label={type.nombre} value={type.id} />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Médico</Text>
        {loadingDoctors ? (
          <ActivityIndicator size="small" color="#2196F3" />
        ) : (
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedDoctor}
              style={styles.picker}
              onValueChange={itemValue => setSelectedDoctor(itemValue)}>
              <Picker.Item label="Seleccione un médico" value="" />
              {doctors.map(doctor => (
                <Picker.Item
                  key={doctor.id}
                  label={`${doctor.usuario.nombre} ${doctor.usuario.apellido}`}
                  value={doctor.id}
                />
              ))}
            </Picker>
          </View>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
          disabled={loading}>
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={scheduleAppointment}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Agendar Cita</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
    color: '#333',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    backgroundColor: '#f9f9f9',
  },
  picker: {
    height: 50,
    color: '#333',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 12,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 10,
    textAlignVertical: 'top',
    minHeight: 100,
    backgroundColor: '#f9f9f9',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 4,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 4,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default AppointmentForm;
