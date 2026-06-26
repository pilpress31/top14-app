import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import './lib/axiosSetup';   // <-- AJOUTER CETTE LIGNE (Étape 1 : intercepteur token)
import { captureAcquisition } from './utils/acquisition';

// 🌐 Capture la source d'acquisition (?ref / utm_source) dès le 1er chargement
captureAcquisition();

// ==========================================
// ENREGISTRER SERVICE WORKER PWA
// ==========================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(registration => {
        console.log('✅ Service Worker enregistré:', registration.scope);
      })
      .catch(error => {
        console.error('❌ Service Worker erreur:', error);
      });
  });
}

// ==========================================
// RENDER REACT APP
// ==========================================
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);