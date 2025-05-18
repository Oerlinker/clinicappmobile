import React, {useState} from 'react';
import {StyleSheet, ScrollView, Alert, View, Platform} from 'react-native';
import {
  Text,
  Button,
  TextInput,
  ActivityIndicator,
  HelperText,
} from 'react-native-paper';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import {Picker} from '@react-native-picker/picker';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import type {AxiosResponse, AxiosError} from 'axios';
import api from '../api'; // Ajusta la ruta si tu api.ts está en otra carpeta

type Doctor = {
  id: number;
  usuario: {nombre: string; apellido: string};
};

type DisponibilidadPayload = {
  empleado: {id: number};
  fecha: string;
  horaInicio: string;
  horaFin: string;
  cupos: number;
  duracionSlot: number;
};

export default function DisponibilidadManagementScreen() {
  const qc = useQueryClient();

  const {
    data: doctors = [],
    isLoading: loadingDoctors,
    isError: errorDoctors,
  } = useQuery<Doctor[]>({
    queryKey: ['doctores'],
    queryFn: () =>
      api.get<Doctor[]>('/empleados/doctores').then(res => res.data),
  });

  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [fecha, setFecha] = useState(new Date());
  const [showDate, setShowDate] = useState(false);
  const [horaInicio, setHoraInicio] = useState(new Date());
  const [showStart, setShowStart] = useState(false);
  const [horaFin, setHoraFin] = useState(new Date());
  const [showEnd, setShowEnd] = useState(false);
  const [cupos, setCupos] = useState('');
  const [duracionSlot, setDuracionSlot] = useState('');

  const {mutate, status: mutationStatus} = useMutation<
    AxiosResponse<any>,
    AxiosError<{message: string}>,
    DisponibilidadPayload
  >({
    mutationFn: payload => api.post('/disponibilidades', payload),
    onSuccess: () => {
      qc.invalidateQueries({queryKey: ['disponibilidades']});
      Alert.alert('Éxito', 'Disponibilidad creada correctamente');
      // Reset formularios
      setDoctorId(null);
      setFecha(new Date());
      setHoraInicio(new Date());
      setHoraFin(new Date());
      setCupos('');
      setDuracionSlot('');
    },
    onError: err => {
      const msg =
        err.response?.data?.message || 'No se pudo crear la disponibilidad';
      Alert.alert('Error', msg);
    },
  });

  const onChangeDate = (_: DateTimePickerEvent, d?: Date) => {
    setShowDate(Platform.OS === 'ios');
    if (d) setFecha(d);
  };
  const onChangeStart = (_: DateTimePickerEvent, d?: Date) => {
    setShowStart(Platform.OS === 'ios');
    if (d) setHoraInicio(d);
  };
  const onChangeEnd = (_: DateTimePickerEvent, d?: Date) => {
    setShowEnd(Platform.OS === 'ios');
    if (d) setHoraFin(d);
  };

  const handleSubmit = () => {
    if (!doctorId) {
      return Alert.alert('Error', 'Por favor selecciona un doctor.');
    }
    if (!cupos.trim()) {
      return Alert.alert('Error', 'Por favor ingresa número de cupos.');
    }
    if (!duracionSlot.trim()) {
      return Alert.alert('Error', 'Por favor ingresa duración del slot.');
    }

    const payload: DisponibilidadPayload = {
      empleado: {id: doctorId},
      fecha: fecha.toISOString().slice(0, 10),
      horaInicio: horaInicio.toLocaleTimeString('en-GB', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
      }),
      horaFin: horaFin.toLocaleTimeString('en-GB', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
      }),
      cupos: parseInt(cupos, 10),
      duracionSlot: parseInt(duracionSlot, 10),
    };

    mutate(payload);
  };

  const isMutating = mutationStatus === 'pending';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Gestionar Disponibilidad</Text>

      {/* Doctor Picker */}
      <View style={styles.field}>
        <Text style={styles.label}>Doctor</Text>
        {loadingDoctors ? (
          <ActivityIndicator />
        ) : errorDoctors ? (
          <Text>Error cargando doctores</Text>
        ) : (
          <View style={styles.picker}>
            <Picker
              selectedValue={doctorId}
              onValueChange={v => setDoctorId(v as number)}
              style={{color: '#000'}}>
              <Picker.Item label="— Seleccionar —" value={null} />
              {doctors.map(doc => (
                <Picker.Item
                  key={doc.id}
                  label={`${doc.usuario.nombre} ${doc.usuario.apellido}`}
                  value={doc.id}
                />
              ))}
            </Picker>
          </View>
        )}
      </View>

      {/* Fecha */}
      <View style={styles.field}>
        <Text style={styles.label}>Fecha</Text>
        <Button onPress={() => setShowDate(true)}>
          {fecha.toLocaleDateString()}
        </Button>
        {showDate && (
          <DateTimePicker
            value={fecha}
            mode="date"
            display="default"
            onChange={onChangeDate}
          />
        )}
      </View>

      {/* Hora Inicio */}
      <View style={styles.field}>
        <Text style={styles.label}>Hora Inicio</Text>
        <Button onPress={() => setShowStart(true)}>
          {horaInicio.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Button>
        {showStart && (
          <DateTimePicker
            value={horaInicio}
            mode="time"
            display="default"
            onChange={onChangeStart}
          />
        )}
      </View>

      {/* Hora Fin */}
      <View style={styles.field}>
        <Text style={styles.label}>Hora Fin</Text>
        <Button onPress={() => setShowEnd(true)}>
          {horaFin.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Button>
        {showEnd && (
          <DateTimePicker
            value={horaFin}
            mode="time"
            display="default"
            onChange={onChangeEnd}
          />
        )}
      </View>

      {/* Cupos */}
      <View style={styles.field}>
        <Text style={styles.label}>Cupos</Text>
        <TextInput
          mode="outlined"
          keyboardType="number-pad"
          value={cupos}
          onChangeText={setCupos}
          style={styles.input}
        />
      </View>

      {/* Duración Slot */}
      <View style={styles.field}>
        <Text style={styles.label}>Duración Slot (min)</Text>
        <TextInput
          mode="outlined"
          keyboardType="number-pad"
          value={duracionSlot}
          onChangeText={setDuracionSlot}
          style={styles.input}
        />
        <HelperText type="info">Duración de cada cita en minutos</HelperText>
      </View>

      {/* Botón Crear */}
      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={isMutating}
        disabled={isMutating}
        style={styles.button}>
        Crear Disponibilidad
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  field: {
    marginBottom: 12,
  },
  label: {
    fontWeight: '600',
    marginBottom: 4,
  },
  picker: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
  },
  input: {
    backgroundColor: 'white',
  },
  button: {
    marginTop: 20,
  },
});
