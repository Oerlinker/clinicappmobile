import React, {useContext, useRef, useEffect} from 'react';
import {View, StyleSheet, Animated} from 'react-native';
import {Card, Title, Paragraph} from 'react-native-paper';
import {AuthContext} from '../context/AuthContext';
import {theme} from '../theme';
import {useIsFocused} from '@react-navigation/native';

const HomeScreen: React.FC = () => {
  const {user} = useContext(AuthContext);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const isFocused = useIsFocused();

  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {toValue: 1, duration: 800, useNativeDriver: true}).start();
  }, [isFocused]);

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <Animated.View style={{opacity: fadeAnim}}>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>Bienvenido a Clínica Horus</Title>
            <Paragraph style={styles.subtitle}>
              Hola, {user?.nombre}. ¡Nos alegra poder VERTE!
            </Paragraph>
          </Card.Content>
        </Card>
      </Animated.View>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    margin: 16,
    borderRadius: 16,
    elevation: 8,
    backgroundColor: theme.colors.primary,
    paddingVertical: 24,
    paddingHorizontal: 16,
    width: '90%',
    alignSelf: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#e0e0e0',
    marginBottom: 0,
  },
});
