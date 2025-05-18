import React, {useState, useEffect, useContext} from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Alert,
  ActivityIndicator,
  Text,
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
  onSuccess: (newCita: {id: number; precio: number}) => void;
  onCancel: () => void;
}

interface Doctor {
  id: number;
  usuario: {nombre: string; apellido: string};
}

interface Disponibilidad {
  fecha: string;
  horaInicio: string;
  horaFin: string;
  duracionSlot: number;
  cupos: number;
}

interface CitaData {
  id: number;
  fecha: string;
  hora: string;
  estado: string;
  precio: number;
}

export default function AppointmentForm({
  onSuccess,
  onCancel,
}: AppointmentFormProps) {
  const {user} = useContext(AuthContext);

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  const [selectedDoctor, setSelectedDoctor] = useState<number | ''>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [disp, setDisp] = useState<Disponibilidad | null>(null);
  const [citasDoc, setCitasDoc] = useState<CitaData[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string>('');

  const [misCitas, setMisCitas] = useState<CitaData[]>([]);

  const [loading, setLoading] = useState(false);

  const appointmentTypes = [
    {label: 'Rutina', value: 'RUTINA'},
    {label: 'Control', value: 'CONTROL'},
    {label: 'Pediátrica', value: 'PEDIATRICA'},
    {label: 'Pre-quirúrgica', value: 'PRE_QUIRURGICA'},
    {label: 'Post-quirúrgica', value: 'POST_QUIRURGICA'},
  ];

  useEffect(() => {
    (async () => {
      setLoadingDoctors(true);
      try {
        const resp = await api.get<Doctor[]>('/empleados/doctores');
        setDoctors(resp.data);
      } catch {
        Alert.alert('Error', 'No se pudieron cargar los doctores');
      } finally {
        setLoadingDoctors(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!user) return;
    api
      .get<CitaData[]>('/citas/mis-citas')
      .then(r => setMisCitas(r.data))
      .catch(() => setMisCitas([]));
  }, [user]);

  useEffect(() => {
    if (!selectedDoctor) {
      setDisp(null);
      setCitasDoc([]);
      setSlots([]);
      return;
    }
    const fechaStr = format(selectedDate, 'yyyy-MM-dd');
    setLoadingSlots(true);
    Promise.all([
      api
        .get<Disponibilidad>(
          `/disponibilidades/empleado/${selectedDoctor}/fecha/${fechaStr}`,
        )
        .then(r => r.data)
        .catch(() => null),
      api
        .get<CitaData[]>(`/citas/doctor/${selectedDoctor}/fecha/${fechaStr}`)
        .then(r => r.data)
        .catch(() => []),
    ]).then(([d, c]) => {
      setDisp(d);
      setCitasDoc(c);
      setLoadingSlots(false);
      setSelectedSlot('');
    });
  }, [selectedDoctor, selectedDate]);

  useEffect(() => {
    if (!disp) {
      setSlots([]);
      return;
    }
    const {horaInicio, horaFin, duracionSlot, cupos} = disp;
    const [h0, m0] = horaInicio.slice(0, 5).split(':').map(Number);
    const [h1, m1] = horaFin.slice(0, 5).split(':').map(Number);
    const startMin = h0 * 60 + m0;
    const endMin = h1 * 60 + m1;

    const allSlots: string[] = [];
    for (let t = startMin; t + duracionSlot <= endMin; t += duracionSlot) {
      const hh = String(Math.floor(t / 60)).padStart(2, '0');
      const mm = String(t % 60).padStart(2, '0');
      allSlots.push(`${hh}:${mm}`);
    }

    const booked = citasDoc.map(c => c.hora.split('T')[1].slice(0, 5));
    const available = allSlots.filter(
      time => booked.filter(b => b === time).length < cupos,
    );
    setSlots(available);
  }, [disp, citasDoc]);

  const onChangeDate = (_: DateTimePickerEvent, date?: Date) => {
    setShowDatePicker(false);
    if (date) setSelectedDate(date);
  };

  const validate = (): boolean => {
    const fechaStr = format(selectedDate, 'yyyy-MM-dd');

    if (misCitas.find(c => c.fecha === fechaStr && c.estado !== 'CANCELADA')) {
      Alert.alert('Aviso', 'Usted ya tiene una cita activa para este día.');
      return false;
    }
    if (!selectedDoctor) {
      Alert.alert('Error', 'Selecciona un médico');
      return false;
    }
    if (!selectedType) {
      Alert.alert('Error', 'Selecciona tipo de cita');
      return false;
    }
    if (!selectedSlot) {
      Alert.alert('Error', 'Selecciona un horario');
      return false;
    }
    return true;
  };

  const scheduleAppointment = async () => {
    if (!validate() || !user) return;
    setLoading(true);

    const payload = {
      fecha: format(selectedDate, 'yyyy-MM-dd'),
      hora: `${selectedSlot}:00`,
      estado: 'AGENDADA',
      tipo: selectedType,
      paciente: {id: user.id},
      doctor: {id: selectedDoctor},
    };

    try {
      const {data: newCita} = await api.post('/citas', payload);
      onSuccess(newCita);
    } catch (e: any) {
      Alert.alert(
        'Error',
        e.response?.data?.message || 'No se pudo agendar la cita.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Fecha */}
      <View style={styles.field}>
        <Text style={styles.label}>Fecha</Text>
        <Text style={styles.input} onPress={() => setShowDatePicker(true)}>
          {format(selectedDate, 'dd/MM/yyyy', {locale: es})}
        </Text>
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            minimumDate={new Date()}
            onChange={onChangeDate}
          />
        )}
      </View>

      {/* Médico */}
      <View style={styles.field}>
        <Text style={styles.label}>Médico</Text>
        {loadingDoctors ? (
          <ActivityIndicator />
        ) : (
          <View style={styles.picker}>
            <Picker
              selectedValue={selectedDoctor}
              onValueChange={v => setSelectedDoctor(v as number)}
              style={{color: '#000'}}>
              <Picker.Item label="Selecciona médico" value="" />
              {doctors.map(d => (
                <Picker.Item
                  key={d.id}
                  label={`${d.usuario.nombre} ${d.usuario.apellido}`}
                  value={d.id}
                />
              ))}
            </Picker>
          </View>
        )}
      </View>

      {/* Tipo */}
      <View style={styles.field}>
        <Text style={styles.label}>Tipo de cita</Text>
        <View style={styles.picker}>
          <Picker
            selectedValue={selectedType}
            onValueChange={v => setSelectedType(v as string)}
            style={{color: '#000'}}>
            <Picker.Item label="Selecciona tipo" value="" />
            {appointmentTypes.map(t => (
              <Picker.Item key={t.value} label={t.label} value={t.value} />
            ))}
          </Picker>
        </View>
      </View>

      {/* Horario */}
      <View style={styles.field}>
        <Text style={styles.label}>Horario</Text>
        {loadingSlots ? (
          <ActivityIndicator />
        ) : slots.length > 0 ? (
          <View style={styles.picker}>
            <Picker
              selectedValue={selectedSlot}
              onValueChange={v => setSelectedSlot(v as string)}
              style={{color: '#000'}}>
              <Picker.Item label="Selecciona horario" value="" />
              {slots.map(s => (
                <Picker.Item key={s} label={s} value={s} />
              ))}
            </Picker>
          </View>
        ) : (
          <Text style={{color: '#555'}}>
            {selectedDoctor
              ? 'No hay turnos disponibles en esta fecha'
              : 'Selecciona doctor y fecha'}
          </Text>
        )}
      </View>

      {/* Botones */}
      <View style={styles.buttons}>
        <Text style={styles.cancel} onPress={onCancel}>
          Cancelar
        </Text>
        <View style={styles.spacer} />
        {loading ? (
          <ActivityIndicator />
        ) : (
          <Text style={styles.submit} onPress={scheduleAppointment}>
            Agendar Cita
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {padding: 16, backgroundColor: '#fff'},
  field: {marginBottom: 16},
  label: {fontWeight: '600', marginBottom: 4},
  input: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 4,
    backgroundColor: '#f9f9f9',
  },
  picker: {
    borderWidth: 1,
    borderRadius: 4,
    backgroundColor: '#f9f9f9',
  },
  buttons: {flexDirection: 'row', justifyContent: 'flex-end', marginTop: 24},
  cancel: {
    color: '#666',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  spacer: {width: 16},
  submit: {
    color: '#fff',
    backgroundColor: '#0055A4',
    padding: 12,
    borderRadius: 4,
  },
});
