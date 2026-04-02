import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * Hook Supabase Realtime — rafraîchit automatiquement quand les données changent
 * ET quand l'app revient au premier plan (depuis arrière-plan / verrouillage)
 *
 * @param {Array} subscriptions - Liste des abonnements { table, event, filter?, onUpdate }
 */
export function useRealtimeSync(subscriptions) {
  // Ref pour accéder aux subscriptions dans les listeners sans re-render
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
    //    Couvre : retour depuis arrière-plan, déverrouillage,
    //    changement d'onglet, réouverture de l'app PWA
    // -------------------------------------------------------
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Déclencher onUpdate pour chaque abonnement
        subscriptionsRef.current.forEach(({ onUpdate }) => {
          try { onUpdate(null); } catch (e) { /* silencieux */ }
        });

        // Réabonner les channels Supabase si la connexion s'est coupée
        channels.forEach(channel => {
          try {
            const state = channel.state;
            if (state === 'closed' || state === 'errored') {
              channel.subscribe();
            }
          } catch (e) { /* silencieux */ }
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // -------------------------------------------------------
    // Cleanup à la destruction du composant
    // -------------------------------------------------------
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
