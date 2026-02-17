import { useEffect, useState } from 'react';
import { loadApiConfig } from './config.js';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { LikeSaveProvider } from './context/LikeSaveContext.jsx';

export default function AppBootstrap() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadApiConfig().then(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontFamily: 'sans-serif'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <AuthProvider>
      <LikeSaveProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </LikeSaveProvider>
    </AuthProvider>
  );
}
