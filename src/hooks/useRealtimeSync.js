import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * Hook Supabase Realtime — rafraîchit automatiquement quand les données changent
 * ET quand l'app revient au premier plan (depuis arrière-plan / verrouillage)
 * ET quand le Service Worker signale une donnée fraîche disponible
 *
 * @param {Array} subscriptions - Liste des abonnements { table, event, filter?, onUpdate }
 */
export function useRealtimeSync(subscriptions) {
  const subscriptionsRef = useRef(subscriptions);
  subscriptionsRef.current = subscriptions;

  useEffect(() => {
    // -------------------------------------------------------
    // 1. Abonnements Supabase Realtime (changements en base)
    // -------------------------------------------------------
    const channels = subscriptionsRef.current.map(({ table, event = '*', filter, onUpdate }, i) => {
      const config = { event, schema: 'public', table };
      if (filter) config.filter = filter;

      return supabase
        .channel(`realtime-${table}-${i}`)
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
    //    Debounce 300ms pour éviter les rechargements en cascade
    //    (plusieurs appels API simultanés → un seul reload)
    // -------------------------------------------------------
    let swDebounceTimer = null;
    const handleSWMessage = (event) => {
      if (event.data?.type === 'SW_DATA_UPDATED') {
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
