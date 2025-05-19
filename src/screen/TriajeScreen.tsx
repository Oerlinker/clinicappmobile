import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import {TextInput, Button} from 'react-native-paper';
import {format, parseISO} from 'date-fns';
import api from '../api';

interface CitaInfo {
  id: number;
  fecha: string;
  hora: string;
  servicio: {
    id: number;
    nombre: string;
  };
  paciente: {
    id: number;
    nombre: string;
    apellido: string;
  };
}

interface TriajeCreateDTO {
  citaId: number;
  presionArterial: number;
  frecuenciaCardiaca: number;
  temperatura: number;
  peso: number;
  altura: number;
  comentarios: string;
}

export default function TriajeScreen() {
  const [busqueda, setBusqueda] = useState('');
  const [citas, setCitas] = useState<CitaInfo[]>([]);
  const [filtradas, setFiltradas] = useState<CitaInfo[]>([]);
  const [citaSel, setCitaSel] = useState<CitaInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<Omit<TriajeCreateDTO, 'citaId'>>({
    presionArterial: 0,
    frecuenciaCardiaca: 0,
    temperatura: 0,
    peso: 0,
    altura: 0,
    comentarios: '',
  });

  useEffect(() => {
    setLoading(true);
    api
      .get<CitaInfo[]>('/citas/pendientes-triaje')
      .then(res => {
        setCitas(res.data);
        setFiltradas(res.data);
      })
      .catch(() => {
        Alert.alert(
          'Error',
          'No se pudieron cargar las citas pendientes de triaje',
        );
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const txt = busqueda.toLowerCase().trim();
    setFiltradas(
      citas.filter(c =>
        `${c.paciente.nombre} ${c.paciente.apellido}`
          .toLowerCase()
          .includes(txt),
      ),
    );
  }, [busqueda, citas]);

  const handleChange = (id: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [id]: id === 'comentarios' ? value : parseFloat(value) || 0,
    }));
  };

  const handleSubmit = async () => {
    if (!citaSel) return;

    setLoading(true);

    const payload: TriajeCreateDTO = {
      citaId: citaSel.id,
      ...formData,
    };

    try {
      await api.post('/triajes', payload);
      Alert.alert('Éxito', 'Triaje registrado correctamente', [
        {
          text: 'OK',
          onPress: () => {
            setCitaSel(null);
            // Recargar las citas pendientes
            api
              .get<CitaInfo[]>('/citas/pendientes-triaje')
              .then(res => {
                setCitas(res.data);
                setFiltradas(res.data);
              })
              .catch(() => {});
          },
        },
      ]);
    } catch (err: any) {
      Alert.alert(
        'Error',
        err.response?.data?.message || 'No se pudo guardar el triaje',
      );
    } finally {
      setLoading(false);
    }
  };

  const renderListHeader = () => (
    <View style={styles.tableHeader}>
      <Text style={[styles.headerText, {flex: 2}]}>Paciente</Text>
      <Text style={[styles.headerText, {flex: 1}]}>Fecha</Text>
      <Text style={[styles.headerText, {flex: 1}]}>Hora</Text>
      <Text style={[styles.headerText, {flex: 1}]}>Acción</Text>
    </View>
  );

  if (loading && !citaSel) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!citaSel ? (
        <View style={styles.searchSection}>
          <Text style={styles.title}>Buscar Cita para Triaje</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Paciente:</Text>
            <TextInput
              mode="outlined"
              placeholder="Nombre o apellido"
              value={busqueda}
              onChangeText={setBusqueda}
              style={styles.input}
            />
          </View>

          {renderListHeader()}
          <FlatList
            data={filtradas}
            keyExtractor={item => item.id.toString()}
            renderItem={({item}) => (
              <View style={styles.tableRow}>
                <Text style={[styles.cellText, {flex: 2}]}>
                  {item.paciente.nombre} {item.paciente.apellido}
                </Text>
                <Text style={[styles.cellText, {flex: 1}]}>
                  {format(parseISO(item.fecha), 'dd/MM/yyyy')}
                </Text>
                <Text style={[styles.cellText, {flex: 1}]}>
                  {item.hora.slice(0, 5)}
                </Text>
                <View style={{flex: 1}}>
                  <Button
                    mode="contained"
                    compact
                    onPress={() => setCitaSel(item)}>
                    Elegir
                  </Button>
                </View>
              </View>
            )}
            style={styles.flatList}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No hay citas pendientes</Text>
            }
          />
        </View>
      ) : (
        <ScrollView style={styles.formContainer}>
          <Button
            mode="text"
            icon="arrow-left"
            onPress={() => setCitaSel(null)}
            style={styles.backButton}>
            Cambiar cita
          </Button>

          <Text style={styles.title}>Registro de Triaje</Text>
          <View style={styles.patientInfo}>
            <Text style={styles.patientText}>
              <Text style={styles.bold}>Paciente:</Text>{' '}
              {citaSel.paciente.nombre} {citaSel.paciente.apellido}
            </Text>
            <Text style={styles.patientText}>
              <Text style={styles.bold}>Fecha y hora:</Text>{' '}
              {format(parseISO(citaSel.fecha), 'dd/MM/yyyy')}{' '}
              {citaSel.hora.slice(0, 5)}
            </Text>
            <Text style={styles.patientText}>
              <Text style={styles.bold}>Servicio:</Text>{' '}
              {citaSel.servicio.nombre}
            </Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Presión Arterial</Text>
            <TextInput
              mode="outlined"
              keyboardType="numeric"
              value={formData.presionArterial.toString()}
              onChangeText={value => handleChange('presionArterial', value)}
              style={styles.input}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Frecuencia Cardíaca</Text>
            <TextInput
              mode="outlined"
              keyboardType="numeric"
              value={formData.frecuenciaCardiaca.toString()}
              onChangeText={value => handleChange('frecuenciaCardiaca', value)}
              style={styles.input}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Temperatura (°C)</Text>
            <TextInput
              mode="outlined"
              keyboardType="numeric"
              value={formData.temperatura.toString()}
              onChangeText={value => handleChange('temperatura', value)}
              style={styles.input}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Peso (kg)</Text>
            <TextInput
              mode="outlined"
              keyboardType="numeric"
              value={formData.peso.toString()}
              onChangeText={value => handleChange('peso', value)}
              style={styles.input}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Altura (m)</Text>
            <TextInput
              mode="outlined"
              keyboardType="numeric"
              value={formData.altura.toString()}
              onChangeText={value => handleChange('altura', value)}
              style={styles.input}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Comentarios</Text>
            <TextInput
              mode="outlined"
              multiline
              numberOfLines={4}
              value={formData.comentarios}
              onChangeText={value => handleChange('comentarios', value)}
              style={styles.textArea}
            />
          </View>

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            style={styles.submitButton}>
            Guardar Triaje
          </Button>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchSection: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f2f2f2',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerText: {
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  cellText: {
    fontSize: 14,
  },
  flatList: {
    flex: 1,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
  },
  formContainer: {
    flex: 1,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  patientInfo: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    marginBottom: 16,
    borderRadius: 4,
  },
  patientText: {
    marginBottom: 4,
  },
  bold: {
    fontWeight: 'bold',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    backgroundColor: 'white',
  },
  textArea: {
    backgroundColor: 'white',
    height: 120,
  },
  submitButton: {
    marginTop: 8,
    marginBottom: 24,
  },
});
