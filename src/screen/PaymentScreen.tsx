// src/screens/PaymentScreen.tsx
import React, { useEffect } from 'react';
import { View, ActivityIndicator, Alert, Linking } from 'react-native';
import { useRoute } from '@react-navigation/native';
import api from '../api';

type Params = {
  citaId: number;
  pacienteId: number;
  amount: number;
  currency: string;
};

export default function PaymentScreen() {
  const { citaId, pacienteId, amount, currency } = useRoute().params as Params;

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.post('/payments/create-checkout-session', {
          citaId,
          pacienteId,
          amount,
          currency,
        });
        Linking.openURL(data.url);
      } catch {
        Alert.alert('Error', 'No se pudo iniciar el pago');
      }
    })();
  }, );

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
