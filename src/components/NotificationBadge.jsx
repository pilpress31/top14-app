// ==========================================
// NOTIFICATION BADGE
// ==========================================
// Fichier : src/components/NotificationBadge.jsx

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import NotificationCenter from './NotificationCenter';

export default function NotificationBadge() {
  const { unreadCount, loadUnreadCount } = useNotifications();
  const [showCenter, setShowCenter] = useState(false);

  // Rafraîchir compteur au montage
  useEffect(() => {
    loadUnreadCount();
  }, [loadUnreadCount]);

  return (
    <>
      {/* Bouton Badge */}
      <button
        onClick={() => setShowCenter(!showCenter)}
        className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6 text-gray-700" />
        
        {/* Badge compteur */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {/* Animation pulse si non lues */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex h-5 w-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          </span>
        )}
      </button>

      {/* Centre de notifications */}
      {showCenter && (
        <NotificationCenter 
          isOpen={showCenter}
          onClose={() => setShowCenter(false)}
        />
      )}
    </>
  );
}
