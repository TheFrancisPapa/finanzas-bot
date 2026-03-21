import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// --- LIMPIEZA DE CACHÉ (Service Workers) ---
// Render a veces sirve versiones viejas por culpa de los Service Workers.
// Este bloque asegura que si hay una versión vieja de la app (la de Vanilla JS), se borre.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function (registrations) {
    for (let registration of registrations) {
      registration.unregister();
      console.log("Service worker obsoleto de Manguito eliminado.");
    }
  });
}

// --- RENDERIZADO PRINCIPAL ---
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)