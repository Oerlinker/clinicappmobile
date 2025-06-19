import React, { useEffect, useState, useContext } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import api from '../api';
import { AuthContext } from '../context/AuthContext';

interface MedicamentoTratamiento {
  id: number;
  medicamentoId: number;
  nombreMedicamento?: string;
  dosis: string;
  unidadMedida: string;
  frecuencia: string;
  duracionDias: number;
  viaAdministracion: string;
  instrucciones?: string;
}

interface Tratamiento {
  id: number;
  descripcion: string;
  fechaInicio: string;
  fechaFin: string;
  observaciones?: string;
  medicamentosTratamiento: MedicamentoTratamiento[];
}

interface Atencion {
  id: number;
}

const ListaTratamientos: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    const cargarTratamientos = async () => {
      setIsLoading(true);
      try {
        // 1. Obtener atenciones del usuario
        const respAtenciones = await api.get<Atencion[]>(`/atenciones/usuario/${user?.id}`);
        const atenciones = respAtenciones.data;
        let todosTratamientos: Tratamiento[] = [];
        // 2. Para cada atención, obtener tratamientos
        for (const atencion of atenciones) {
          try {
            const respTrat = await api.get<Tratamiento[]>(`/tratamientos/atencion/${atencion.id}`);
            todosTratamientos = todosTratamientos.concat(respTrat.data);
          } catch (e) {
            // ignorar error de una atención
          }
        }
        // Filtrar tratamientos vigentes (fechaFin >= hoy)
        const hoy = new Date();
        todosTratamientos = todosTratamientos.filter(t => new Date(t.fechaFin) >= new Date(hoy.setHours(0,0,0,0)));
        // 3. Ordenar por fecha de inicio descendente
        todosTratamientos.sort((a, b) => new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime());
        setTratamientos(todosTratamientos);
      } catch (e) {
        setTratamientos([]);
      } finally {
        setIsLoading(false);
      }
    };
    if (user?.id) cargarTratamientos();
  }, [user]);

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString();
  };

  if (isLoading) {
    return <ActivityIndicator style={{ marginVertical: 24 }} size="large" />;
  }
  if (tratamientos.length === 0) {
    return <Text style={styles.empty}>No tiene tratamientos registrados</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tratamientos Recibidos</Text>
      <FlatList
        data={tratamientos}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <TouchableOpacity onPress={() => setExpanded(expanded === item.id ? null : item.id)}>
              <View style={styles.headerRow}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.descripcion.length > 50 ? item.descripcion.substring(0, 50) + '...' : item.descripcion}</Text>
                <Text style={styles.period}>{formatFecha(item.fechaInicio)} - {formatFecha(item.fechaFin)}</Text>
              </View>
            </TouchableOpacity>
            {expanded === item.id && (
              <View style={styles.detail}>
                <Text style={styles.label}>Descripción:</Text>
                <Text>{item.descripcion}</Text>
                <Text style={styles.label}>Periodo:</Text>
                <Text>Desde {formatFecha(item.fechaInicio)} hasta {formatFecha(item.fechaFin)}</Text>
                {item.observaciones ? (
                  <>
                    <Text style={styles.label}>Observaciones:</Text>
                    <Text>{item.observaciones}</Text>
                  </>
                ) : null}
                <Text style={styles.label}>Medicamentos:</Text>
                {item.medicamentosTratamiento && item.medicamentosTratamiento.length > 0 ? (
                  <View style={styles.medsTable}>
                    <View style={styles.medsHeader}>
                      <Text style={styles.medsCol}>Medicamento</Text>
                      <Text style={styles.medsCol}>Dosis</Text>
                      <Text style={styles.medsCol}>Frecuencia</Text>
                      <Text style={styles.medsCol}>Duración</Text>
                      <Text style={styles.medsCol}>Vía</Text>
                    </View>
                    {item.medicamentosTratamiento.map(med => (
                      <View key={med.id} style={styles.medsRow}>
                        <Text style={styles.medsCol}>{med.nombreMedicamento}</Text>
                        <Text style={styles.medsCol}>{med.dosis} {med.unidadMedida}</Text>
                        <Text style={styles.medsCol}>{med.frecuencia}</Text>
                        <Text style={styles.medsCol}>{med.duracionDias} días</Text>
                        <Text style={styles.medsCol}>{med.viaAdministracion}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.empty}>No hay medicamentos asignados</Text>
                )}
                {item.medicamentosTratamiento && item.medicamentosTratamiento.some(med => med.instrucciones) && (
                  <View style={{ marginTop: 8 }}>
                    <Text style={styles.label}>Instrucciones específicas:</Text>
                    {item.medicamentosTratamiento.filter(med => med.instrucciones).map(med => (
                      <Text key={med.id} style={styles.instruccion}><Text style={{fontWeight:'bold'}}>{med.nombreMedicamento}:</Text> {med.instrucciones}</Text>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: 24, marginHorizontal: 12 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  card: { backgroundColor: '#fff', borderRadius: 8, marginBottom: 12, elevation: 2, padding: 12 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontWeight: '600', fontSize: 16, flex: 1 },
  period: { fontSize: 13, color: '#666', marginLeft: 8 },
  detail: { marginTop: 10 },
  label: { fontWeight: '600', marginTop: 8 },
  medsTable: { marginTop: 8, borderWidth: 1, borderColor: '#eee', borderRadius: 4 },
  medsHeader: { flexDirection: 'row', backgroundColor: '#f3f3f3', padding: 4 },
  medsRow: { flexDirection: 'row', padding: 4 },
  medsCol: { flex: 1, fontSize: 12 },
  instruccion: { fontSize: 12, color: '#333', marginLeft: 8 },
  empty: { textAlign: 'center', color: '#888', marginVertical: 16 },
});

export default ListaTratamientos;
