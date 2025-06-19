import React, {useContext, useRef, useEffect} from 'react';
import {View, Text, StyleSheet, Alert, Animated} from 'react-native';
import {Card, Title, Divider, Button} from 'react-native-paper';
import {AuthContext} from '../context/AuthContext';
import {theme} from '../theme';
import {useIsFocused} from '@react-navigation/native';

const ProfileScreen = () => {
  const {user, logout} = useContext(AuthContext);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const isFocused = useIsFocused();

  useEffect(() => {
    // Reset animations when screen is focused
    fadeAnim.setValue(0);
    slideAnim.setValue(50);

    // Start parallel animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true
      })
    ]).start();
  }, [isFocused]);

  const handleLogout = async () => {
    try {
      await logout();
      Alert.alert('Sesión cerrada', 'Has cerrado sesión correctamente', [
        {text: 'OK'},
      ]);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{translateY: slideAnim}],
          width: '100%'
        }}
      >
        <Card style={styles.profileCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>Información Personal</Title>
            <Divider style={styles.divider} />

            {user && (
              <View style={styles.userInfo}>
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Nombre:</Text>
                  <Text style={styles.fieldValue}>
                    {user.nombre || user.name || '-'}
                  </Text>
                </View>

                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Apellido:</Text>
                  <Text style={styles.fieldValue}>{user.apellido || '-'}</Text>
                </View>

                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Email:</Text>
                  <Text style={styles.fieldValue}>{user.email || '-'}</Text>
                </View>

                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Rol:</Text>
                  <Text style={styles.fieldValue}>
                    {user.rol?.nombre || user.role || '-'}
                  </Text>
                </View>
              </View>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.actionsCard}>
          <Card.Content>
            <Button
              mode="contained"
              onPress={handleLogout}
              style={styles.logoutBtn}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              Cerrar Sesión
            </Button>
          </Card.Content>
        </Card>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  profileCard: {
    marginBottom: 16,
    elevation: 4,
    borderRadius: 16,
  },
  cardTitle: {
    fontSize: 22,
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  divider: {
    backgroundColor: theme.colors.primary,
    height: 2,
    marginBottom: 16,
  },
  userInfo: {
    marginTop: 8,
  },
  fieldContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
    width: '30%',
  },
  fieldValue: {
    fontSize: 16,
    flex: 1,
    color: '#333',
  },
  actionsCard: {
    elevation: 4,
    borderRadius: 16,
  },
  actionsTitle: {
    fontSize: 20,
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  logoutBtn: {
    backgroundColor: '#f44336',
    marginTop: 8,
    borderRadius: 8,
  },
  buttonContent: {
    height: 48,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default ProfileScreen;
