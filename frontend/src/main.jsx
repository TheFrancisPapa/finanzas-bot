import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google';

// --- ID DE CLIENTE DE GOOGLE ---
// Este es tu ID oficial para que la autenticación funcione en localhost y en Render
const GOOGLE_CLIENT_ID = "938457845659-43m4o2esvlht4kr3pnd3b147efo1v94j.apps.googleusercontent.com";

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
    {/* Envolvemos la App con el proveedor de Google para habilitar el login */}
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)