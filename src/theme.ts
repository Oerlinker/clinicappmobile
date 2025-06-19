// src/theme.ts
    import { MD3LightTheme as DefaultTheme } from 'react-native-paper';
    import type { MD3Theme } from 'react-native-paper';

    export const theme: MD3Theme = {
      ...DefaultTheme,
      roundness: 8,
      colors: {
        ...DefaultTheme.colors,
        primary: '#0f4c81',
        secondary: '#4cb050',
        background: '#f2f4f5',
        surface: '#ffffff',
        error: '#cf6679',
      },
    };
