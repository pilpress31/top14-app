import { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * Hook Supabase Realtime — rafraîchit automatiquement quand les données changent
 * @param {Array} subscriptions - Liste des abonnements { table, event, filter?, onUpdate }
 */
export function useRealtimeSync(subscriptions) {
  useEffect(() => {
    const channels = subscriptions.map(({ table, event = '*', filter, onUpdate }, i) => {
      const config = { event, schema: 'public', table };
      if (filter) config.filter = filter;

      return supabase
        .channel(`realtime-${table}-${i}`)
        .on('postgres_changes', config, (payload) => {
          onUpdate(payload);
        })
        .subscribe();
    });

    // Cleanup à la destruction du composant
    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}