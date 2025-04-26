// App.tsx
import React from 'react';
import {AuthProvider} from './src/context/AuthContext';
import Navigation from './src/navigation';

const App = () => {
  return (
    <AuthProvider>
      <Navigation />
    </AuthProvider>
  );
};

export default App;
