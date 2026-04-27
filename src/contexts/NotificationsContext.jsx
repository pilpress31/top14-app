// ==========================================
// NOTIFICATIONS CONTEXT
// ==========================================
// Fichier : src/contexts/NotificationsContext.jsx
//
// 🆕 Provider qui appelle useNotifications UNE SEULE FOIS
// et partage l'état entre tous les composants consommateurs.
// Évite que NotificationBadge et NotificationCenter aient
// des states séparés qui se désynchronisent.
// ==========================================

import { createContext, useContext } from 'react';
import { useNotifications as useNotificationsHook } from '../hooks/useNotifications';

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const value = useNotificationsHook();
  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

// Hook à utiliser dans les composants (au lieu de useNotifications directement)
export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error(
      'useNotifications doit être utilisé dans un <NotificationsProvider>'
    );
  }
  return ctx;
}

// Re-export des helpers depuis le hook (pour ne pas casser les imports existants)
export { 
  getRelativeTime, 
  getNotificationIcon, 
  getNotificationColor 
} from '../hooks/useNotifications';
