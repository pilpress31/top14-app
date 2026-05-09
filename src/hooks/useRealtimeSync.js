import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * Hook Supabase Realtime — rafraîchit automatiquement quand les données changent
 * ET quand l'app revient au premier plan (depuis arrière-plan / verrouillage)
 * ET quand le Service Worker signale une donnée fraîche disponible
 *
 * v2 — fix conflits de channel names (mai 2026)
 *   - Channel name unique par mount : `realtime-${table}-${i}-${instanceId}`
 *     → évite les conflits quand 2 composants écoutent la même table
 *     (ex. MaCagnotte + ClassementCommunauteTab écoutent tous les deux user_credits)
 *
 * @param {Array} subscriptions - Liste des abonnements { table, event, filter?, onUpdate }
 */
export function useRealtimeSync(subscriptions) {
  const subscriptionsRef = useRef(subscriptions);
  subscriptionsRef.current = subscriptions;

  useEffect(() => {
    // 🆕 ID unique par mount du composant (évite les conflits inter-composants)
    const instanceId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // -------------------------------------------------------
    // 1. Abonnements Supabase Realtime (changements en base)
    // -------------------------------------------------------
    const channels = subscriptionsRef.current.map(({ table, event = '*', filter, onUpdate }, i) => {
      const config = { event, schema: 'public', table };
      if (filter) config.filter = filter;

      // 🆕 Channel name unique par instance pour éviter les conflits
      // entre composants qui écoutent la même table en parallèle.
      const channelName = `realtime-${table}-${i}-${instanceId}`;

      return supabase
        .channel(channelName)
        .on('postgres_changes', config, (payload) => {
          onUpdate(payload);
        })
        .subscribe();
    });

    // -------------------------------------------------------
    // 2. Rechargement au retour au premier plan
    //    Couvre : arrière-plan, déverrouillage, changement d'onglet
    // -------------------------------------------------------
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        subscriptionsRef.current.forEach(({ onUpdate }) => {
          try { onUpdate(null); } catch (e) { /* silencieux */ }
        });
        // Réabonner les channels si connexion coupée
        channels.forEach(channel => {
          try {
            if (channel.state === 'closed' || channel.state === 'errored') {
              channel.subscribe();
            }
          } catch (e) { /* silencieux */ }
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // -------------------------------------------------------
    // 3. Message du Service Worker → donnée fraîche disponible
    //    Debounce 300ms + cooldown 5s après chargement initial
    //    pour éviter la boucle infinie : reload → API → SW → reload
    // -------------------------------------------------------
    const mountTime = Date.now();
    let swDebounceTimer = null;

    const handleSWMessage = (event) => {
      if (event.data?.type === 'SW_DATA_UPDATED') {
        // Ignorer les messages SW pendant les 5 premières secondes
        // (les appels API du chargement initial ne doivent pas reboucler)
        if (Date.now() - mountTime < 5000) return;

        clearTimeout(swDebounceTimer);
        swDebounceTimer = setTimeout(() => {
          subscriptionsRef.current.forEach(({ onUpdate }) => {
            try { onUpdate(null); } catch (e) { /* silencieux */ }
          });
        }, 300);
      }
    };
    navigator.serviceWorker?.addEventListener('message', handleSWMessage);

    // -------------------------------------------------------
    // Cleanup à la destruction du composant
    // -------------------------------------------------------
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      navigator.serviceWorker?.removeEventListener('message', handleSWMessage);
      clearTimeout(swDebounceTimer);
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
