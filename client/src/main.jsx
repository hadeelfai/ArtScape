import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { CartProvider } from './context/CartContext.jsx';
import { LikeSaveProvider } from './context/LikeSaveContext.jsx';


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <LikeSaveProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </LikeSaveProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
