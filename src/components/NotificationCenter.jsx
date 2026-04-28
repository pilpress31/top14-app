// ==========================================
// NOTIFICATION CENTER
// ==========================================
// Fichier : src/components/NotificationCenter.jsx
// 🆕 v2 : utilise NotificationsContext au lieu du hook direct
// ==========================================

import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Check, Trash2, Loader2 } from 'lucide-react';
import { 
  useNotifications, 
  getRelativeTime, 
  getNotificationIcon,
  getNotificationColor 
} from '../contexts/NotificationsContext';

export default function NotificationCenter({ isOpen, onClose }) {
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications
  } = useNotifications();

  // Fermer si clic extérieur
  useEffect(() => {
    function handleClickOutside(event) {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Gérer clic sur notification
  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    const { type, data } = notification;

    if (type === 'distribution' || type === 'bonus') {
      navigate('/ma-cagnotte');
      onClose();
    } 
    else if (type === 'bet_won' || type === 'bet_lost') {
      const filter = type === 'bet_won' ? 'won' : 'lost';
      navigate('/pronos', {
        state: { activeTab: 'mes-paris', filter }
      });
      onClose();
    }
    else if (type === 'new_match') {
      navigate('/pronos');
      onClose();
    }
    else if (type === 'rank_up') {
      navigate('/classement');
      onClose();
    }
    else if (type === 'tuto_push_in_app') {
      // 🆕 Notif tuto activation des push : redirige vers la page d'aide
      navigate('/notifications-push');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      <div 
        ref={panelRef}
        className="fixed top-16 right-4 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-2xl z-50 max-h-[80vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-800">Notifications</h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                {unreadCount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                title="Marquer toutes comme lues"
              >
                <Check className="w-4 h-4 text-green-600" />
              </button>
            )}

            {notifications.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm('Supprimer toutes les notifications ?')) {
                    deleteAllNotifications();
                  }
                }}
                className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                title="Tout supprimer"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Liste notifications */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-rugby-gold animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-3">🔔</div>
              <p className="text-gray-500 text-sm">Aucune notification</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={() => handleNotificationClick(notification)}
                  onDelete={() => deleteNotification(notification.id)}
                  onMarkRead={() => markAsRead(notification.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ==========================================
// NOTIFICATION ITEM
// ==========================================

function NotificationItem({ notification, onClick, onDelete, onMarkRead }) {
  const { id, type, title, message, is_read, created_at } = notification;
  const icon = getNotificationIcon(type);
  const colorClass = getNotificationColor(type);
  const timeAgo = getRelativeTime(created_at);

  return (
    <div
      className={`relative p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
        !is_read ? 'bg-blue-50/50' : ''
      }`}
      onClick={onClick}
    >
      {!is_read && (
        <div className="absolute top-3 right-3 w-2 h-2 bg-blue-500 rounded-full"></div>
      )}

      <div className="flex gap-3">
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 ${colorClass}`}>
          <span className="text-xl">{icon}</span>
        </div>

        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${!is_read ? 'text-gray-900' : 'text-gray-700'}`}>
            {title}
          </p>
          <p className="text-xs text-gray-600 mt-0.5 line-clamp-3">
            {message}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {timeAgo}
          </p>
        </div>

        <div className="flex flex-col gap-1">
          {!is_read && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMarkRead();
              }}
              className="p-1 hover:bg-green-100 rounded transition-colors"
              title="Marquer comme lu"
            >
              <Check className="w-3.5 h-3.5 text-green-600" />
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 hover:bg-red-100 rounded transition-colors"
            title="Supprimer"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-600" />
          </button>
        </div>
      </div>
    </div>
  );
}
