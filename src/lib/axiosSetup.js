// ============================================================
//  axiosSetup.js — Intercepteur global d'authentification
// ------------------------------------------------------------
//  ÉTAPE 1 du chantier "vraie auth JWT".
//  Ajoute automatiquement `Authorization: Bearer <token>` à TOUS
//  les appels axios, en récupérant le token de session Supabase.
//
//  À ce stade, le serveur n'EXIGE pas encore le token : on l'envoie
//  simplement "en plus". L'appli fonctionne donc exactement comme
//  avant (x-user-id conservé). Étape sûre et réversible.
//
//  Import unique au démarrage de l'appli (voir main.jsx).
// ============================================================
import axios from 'axios';
import { supabase } from './supabaseClient';

// Évite d'enregistrer l'intercepteur deux fois (hot-reload / double import)
if (!axios.__top14AuthInterceptor) {
  axios.interceptors.request.use(
    async (config) => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (token) {
          // N'écrase pas un Authorization déjà posé explicitement
          config.headers = config.headers || {};
          if (!config.headers.Authorization && !config.headers.authorization) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
      } catch (e) {
        // Pas de session / erreur de lecture : on laisse partir la requête
        // sans token (comportement identique à aujourd'hui). On ne bloque jamais.
        console.debug('[axiosSetup] pas de token de session :', e?.message || e);
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
  axios.__top14AuthInterceptor = true;
}
