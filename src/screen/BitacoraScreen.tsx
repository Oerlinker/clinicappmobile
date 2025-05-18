import React, {useState} from 'react';
import {StyleSheet, View, FlatList, Platform, Alert} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  ActivityIndicator,
  List,
} from 'react-native-paper';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import {useQuery} from '@tanstack/react-query';
import {format, parseISO} from 'date-fns';
import type {AxiosError} from 'axios';
import api from '../api';

type Bitacora = {
  id: number;
  usuario: {id: number};
  fecha: string;
  accion: string;
  ip?: string;
};

export default function BitacoraScreen() {
  const [userId, setUserId] = useState<string>('');
  const [desde, setDesde] = useState<Date>(new Date());
  const [hasta, setHasta] = useState<Date>(new Date());
  const [showDesde, setShowDesde] = useState(false);
  const [showHasta, setShowHasta] = useState(false);

  const {data, isFetching, refetch, isLoading, isError} = useQuery<
    Bitacora[],
    AxiosError
  >({
    queryKey: [
      'bitacoras',
      userId.trim(),
      format(desde, 'yyyy-MM-dd'),
      format(hasta, 'yyyy-MM-dd'),
    ],
    queryFn: async () => {
      const fDesde = format(desde, 'yyyy-MM-dd');
      const fHasta = format(hasta, 'yyyy-MM-dd');
      let url = '/bitacoras';

      if (userId.trim() && fDesde && fHasta) {
        url = `/bitacoras/usuario/${userId.trim()}/fecha?desde=${fDesde}&hasta=${fHasta}`;
      } else if (userId.trim()) {
        url = `/bitacoras/usuario/${userId.trim()}`;
      } else {
        url = `/bitacoras/fecha?desde=${fDesde}&hasta=${fHasta}`;
      }

      const res = await api.get<Bitacora[]>(url);
      return res.data;
    },
    enabled: false,
    keepPreviousData: true,
    retry: false,
  });

  const bitacoras = data ?? [];

  const onChangeDesde = (_: DateTimePickerEvent, selected?: Date) => {
    setShowDesde(Platform.OS === 'ios');
    if (selected) setDesde(selected);
  };
  const onChangeHasta = (_: DateTimePickerEvent, selected?: Date) => {
    setShowHasta(Platform.OS === 'ios');
    if (selected) setHasta(selected);
  };

  const handleBuscar = () => {
    if (userId && isNaN(Number(userId))) {
      return Alert.alert('Error', 'El ID de usuario debe ser un número');
    }
    refetch();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bitácora de Actividades</Text>

      <View style={styles.filters}>
        <TextInput
          label="ID de Usuario"
          mode="outlined"
          keyboardType="number-pad"
          value={userId}
          onChangeText={setUserId}
          style={styles.input}
        />

        <View style={styles.dateRow}>
          <Button
            mode="outlined"
            onPress={() => setShowDesde(true)}
            style={styles.dateButton}>
            Desde: {format(desde, 'yyyy-MM-dd')}
          </Button>
          {showDesde && (
            <DateTimePicker
              value={desde}
              mode="date"
              display="default"
              onChange={onChangeDesde}
            />
          )}

          <Button
            mode="outlined"
            onPress={() => setShowHasta(true)}
            style={styles.dateButton}>
            Hasta: {format(hasta, 'yyyy-MM-dd')}
          </Button>
          {showHasta && (
            <DateTimePicker
              value={hasta}
              mode="date"
              display="default"
              onChange={onChangeHasta}
            />
          )}
        </View>

        <Button
          mode="contained"
          onPress={handleBuscar}
          loading={isFetching}
          style={styles.searchButton}>
          Buscar
        </Button>
      </View>

      {isLoading ? (
        <ActivityIndicator animating size="large" style={{marginTop: 20}} />
      ) : isError ? (
        <Text style={styles.empty}>Error al cargar la bitácora.</Text>
      ) : (
        <FlatList
          data={bitacoras}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>No hay registros.</Text>
          }
          renderItem={({item}) => (
            <List.Item
              title={item.accion}
              description={`#${item.id} • Usuario: ${
                item.usuario.id
              } • ${format(parseISO(item.fecha), 'dd/MM/yyyy HH:mm:ss')}`}
              left={_ => <List.Icon icon="history" />}
              right={_ => <Text style={styles.ip}>{item.ip ?? 'IP: N/A'}</Text>}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    margin: 16,
    textAlign: 'center',
  },
  filters: {
    paddingHorizontal: 16,
  },
  input: {
    marginBottom: 12,
    backgroundColor: 'white',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dateButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  searchButton: {
    marginBottom: 16,
  },
  list: {
    paddingHorizontal: 0,
  },
  empty: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
  },
  ip: {
    alignSelf: 'center',
    marginRight: 16,
    color: '#888',
  },
});
