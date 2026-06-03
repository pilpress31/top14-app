// src/components/RefreshOnResume.jsx
// ============================================================
// Corrige le "gel" des PWA iOS : quand on quitte l'app sans la tuer,
// iOS la suspend en arrière-plan ; à la réouverture, l'écran est restauré
// tel quel SANS rejouer les requêtes réseau → données périmées (ex. J25
// au lieu de J26). Ce composant détecte le retour au premier plan après
// une absence prolongée et recharge l'app (cold start → données fraîches).
//
// À monter UNE seule fois, en permanence, au niveau racine (dans App,
// pas dans une route conditionnelle qui se démonte). Ne rend rien.
//
// seuilMinutes : durée minimale d'arrière-plan avant de déclencher le reload.
// ============================================================
import { useEffect } from 'react';

export default function RefreshOnResume({ seuilMinutes = 5 }) {
  useEffect(() => {
    const SEUIL_MS = seuilMinutes * 60 * 1000;
    let hiddenAt = null;

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // L'app passe en arrière-plan : on note l'instant.
        hiddenAt = Date.now();
      } else if (document.visibilityState === 'visible') {
        // L'app revient au premier plan : si l'absence a dépassé le seuil
        // (et qu'on est en ligne), on recharge pour repartir sur des données
        // fraîches. Sinon on ne fait rien (pas de reload intempestif).
        if (hiddenAt && (Date.now() - hiddenAt) > SEUIL_MS && navigator.onLine !== false) {
          window.location.reload();
        }
        hiddenAt = null;
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [seuilMinutes]);

  return null;
}
