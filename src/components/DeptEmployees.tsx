
import React from 'react';
import {View, StyleSheet, ScrollView} from 'react-native';
import {Text, Button, Card, Title, Divider} from 'react-native-paper';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import api from '../api.ts';

interface Empleado {
  id: number;
  nombre: string;
  apellido: string;
}

interface Props {
  deptId: string;
}

const DeptEmployees: React.FC<Props> = ({deptId}) => {
  const qc = useQueryClient();

  // Consulta empleados asignados al departamento
  const {data: asignados = []} = useQuery<Empleado[]>({
    queryKey: ['empleados-departamento', deptId],
    queryFn: () => api.get(`/empleados/departamento/${deptId}`).then(r => r.data),
  });

  // Consulta empleados sin departamento
  const {data: disponibles = []} = useQuery<Empleado[]>({
    queryKey: ['empleados-sin-departamento'],
    queryFn: () => api.get('/empleados/sin-departamento').then(r => r.data),
  });

  // Mutación para asignar empleado al departamento
  const asignarMutation = useMutation({
    mutationFn: (empId: number) =>
      api.patch(`/empleados/${empId}/departamento/${deptId}`),
    onSuccess: () => {
      qc.invalidateQueries({queryKey: ['empleados-departamento', deptId]});
      qc.invalidateQueries({queryKey: ['empleados-sin-departamento']});
      qc.invalidateQueries({queryKey: ['empleados']});
    },
  });

  // Mutación para quitar empleado del departamento
  const quitarMutation = useMutation({
    mutationFn: (empId: number) =>
      api.patch(`/empleados/${empId}/sin-departamento`),
    onSuccess: () => {
      qc.invalidateQueries({queryKey: ['empleados-departamento', deptId]});
      qc.invalidateQueries({queryKey: ['empleados-sin-departamento']});
      qc.invalidateQueries({queryKey: ['empleados']});
    },
  });

  return (
    <Card style={styles.container}>
      <Card.Content>
        <Title>Gestión de Empleados</Title>
        <View style={styles.gridContainer}>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Asignados</Text>
            <ScrollView style={styles.list}>
              {asignados.length === 0 && (
                <Text style={styles.emptyText}>No hay empleados asignados</Text>
              )}
              {asignados.map(emp => (
                <View key={emp.id} style={styles.itemContainer}>
                  <Text>{`${emp.nombre} ${emp.apellido}`}</Text>
                  <Button
                    mode="outlined"
                    compact
                    style={styles.deleteButton}
                    onPress={() => quitarMutation.mutate(emp.id)}>
                    Quitar
                  </Button>
                </View>
              ))}
            </ScrollView>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Disponibles</Text>
            <ScrollView style={styles.list}>
              {disponibles.length === 0 && (
                <Text style={styles.emptyText}>No hay empleados disponibles</Text>
              )}
              {disponibles.map(emp => (
                <View key={emp.id} style={styles.itemContainer}>
                  <Text>{`${emp.nombre} ${emp.apellido}`}</Text>
                  <Button
                    mode="contained"
                    compact
                    onPress={() => asignarMutation.mutate(emp.id)}>
                    Asignar
                  </Button>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginBottom: 16,
  },
  gridContainer: {
    marginTop: 12,
    flexDirection: 'column',
  },
  column: {
    marginBottom: 16,
  },
  divider: {
    marginVertical: 12,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
  },
  list: {
    maxHeight: 200,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 4,
  },
  deleteButton: {
    borderColor: '#FF5252',
  },
  emptyText: {
    fontStyle: 'italic',
    color: 'gray',
  },
});

export default DeptEmployees;
