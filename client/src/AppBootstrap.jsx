import { useEffect, useState } from 'react';
import { loadApiConfig, getConfigError } from './config.js';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { LikeSaveProvider } from './context/LikeSaveContext.jsx';

export default function AppBootstrap() {
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    loadApiConfig()
      .then(() => setReady(true))
      .catch(() => setReady(true));
  }, []);

  const configError = getConfigError();

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

  if (configError && typeof window !== 'undefined' && window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1')) {
    return (
      <div style={{
        padding: '2rem',
        maxWidth: '480px',
        margin: '2rem auto',
        fontFamily: 'sans-serif',
        background: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '8px'
      }}>
        <h2 style={{ color: '#b91c1c', marginTop: 0 }}>API URL not configured</h2>
        <p style={{ color: '#991b1b' }}>{configError}</p>
        <p style={{ color: '#7f1d1d', fontSize: '0.9rem' }}>
          In your <strong>client</strong> Railway service, add environment variable:<br />
          <code style={{ background: '#fff', padding: '2px 6px', borderRadius: 4 }}>VITE_API_URL</code> = your <strong>backend</strong> URL<br />
          (e.g. https://artscape-server.up.railway.app)
        </p>
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
