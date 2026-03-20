import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google';

// Tu ID de Cliente de Google oficial
const GOOGLE_CLIENT_ID = "938457845659-43m4o2esvlht4kr3pnd3b147efo1v94j.apps.googleusercontent.com"; 

// Limpieza de Service Workers viejos para evitar que Render sirva caché obsoleto
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister();
      console.log("Service worker obsoleto eliminado.");
    } 
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)
