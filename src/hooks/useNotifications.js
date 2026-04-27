// ==========================================
// HOOK useNotifications
// ==========================================
// Fichier : src/hooks/useNotifications.js
//
// 🆕 v3.1 : badge réactif + logs de débogage temporaires
//    À enlever après diagnostic terminé
// ==========================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import axios from 'axios';

const API_URL = 'https://top14-api-production.up.railway.app/api';

// 🐛 Helper de log avec timestamp
const dlog = (...args) => {
  const now = new Date();
  const t = `${now.getMinutes()}:${now.getSeconds()}.${now.getMilliseconds().toString().padStart(3, '0')}`;
  console.log(`%c[NOTIFS ${t}]`, 'color:#0d9488;font-weight:bold', ...args);
};


export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // unreadCount DÉRIVÉ localement de notifications
  const unreadCount = useMemo(
    () => {
      const count = notifications.filter(n => !n.is_read).length;
      dlog(`📊 unreadCount recalculé = ${count} (sur ${notifications.length} notifs)`);
      return count;
    },
    [notifications]
  );

  // Charger notifications
  const loadNotifications = useCallback(async (unreadOnly = false) => {
    try {
      dlog('🔄 loadNotifications() appelé');
      setLoading(true);
      setError(null);

      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        setNotifications([]);
        return;
      }

      const response = await axios.get(`${API_URL}/notifications`, {
        headers: { 'x-user-id': user.id },
        params: { 
          limit: 50,
          unread_only: unreadOnly 
        }
      });

      const newNotifs = response.data.notifications || [];
      dlog(`✅ Reçu ${newNotifs.length} notifs du serveur`, newNotifs.map(n => ({id: n.id, read: n.is_read})));
      setNotifications(newNotifs);

    } catch (err) {
      console.error('Erreur chargement notifications:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUnreadCount = useCallback(async () => {
    dlog('🔢 loadUnreadCount() appelé (redirige vers loadNotifications)');
    return loadNotifications();
  }, [loadNotifications]);

  // Marquer notification comme lue
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      dlog(`✏️ markAsRead(${notificationId}) - optimistic update`);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );

      await axios.put(
        `${API_URL}/notifications/${notificationId}/read`,
        {},
        { headers: { 'x-user-id': user.id } }
      );
      dlog(`✅ markAsRead serveur OK`);
    } catch (err) {
      console.error('Erreur marquage notification:', err);
      loadNotifications();
    }
  }, [loadNotifications]);

  const markAllAsRead = useCallback(async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      dlog('✏️ markAllAsRead - optimistic update');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));

      await axios.put(
        `${API_URL}/notifications/read-all`,
        {},
        { headers: { 'x-user-id': user.id } }
      );
      dlog('✅ markAllAsRead serveur OK');
    } catch (err) {
      console.error('Erreur marquage toutes notifications:', err);
      loadNotifications();
    }
  }, [loadNotifications]);

  // Supprimer notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      dlog(`🗑️ deleteNotification(${notificationId}) - optimistic update`);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));

      await axios.delete(
        `${API_URL}/notifications/${notificationId}`,
        { headers: { 'x-user-id': user.id } }
      );
      dlog('✅ deleteNotification serveur OK');
    } catch (err) {
      console.error('Erreur suppression notification:', err);
      loadNotifications();
    }
  }, [loadNotifications]);

  const deleteAllNotifications = useCallback(async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      dlog('🗑️ deleteAllNotifications - optimistic update');
      setNotifications([]);

      await axios.delete(
        `${API_URL}/notifications/all`,
        { headers: { 'x-user-id': user.id } }
      );
      dlog('✅ deleteAllNotifications serveur OK');
    } catch (err) {
      console.error('Erreur suppression toutes notifications:', err);
      loadNotifications();
    }
  }, [loadNotifications]);

  // Realtime
  useEffect(() => {
    let channel;

    async function setupRealtime() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        dlog('❌ Pas de user, Realtime non démarré');
        return;
      }

      dlog(`📡 Setup Realtime pour user ${user.id.substring(0, 8)}...`);

      channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            dlog(`🔔 REALTIME ${payload.eventType}:`, payload.new || payload.old);

            if (payload.eventType === 'INSERT') {
              setNotifications(prev => {
                if (prev.some(n => n.id === payload.new.id)) {
                  dlog('⚠️ INSERT ignoré (doublon)');
                  return prev;
                }
                dlog('➕ INSERT appliqué');
                return [payload.new, ...prev];
              });
            }
            else if (payload.eventType === 'UPDATE') {
              dlog('✏️ UPDATE appliqué');
              setNotifications(prev =>
                prev.map(n => n.id === payload.new.id ? payload.new : n)
              );
            }
            else if (payload.eventType === 'DELETE') {
              dlog('➖ DELETE appliqué');
              setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
            }
          }
        )
        .subscribe((status) => {
          dlog(`📡 Realtime status: ${status}`);
        });
    }

    setupRealtime();

    return () => {
      if (channel) {
        dlog('🔌 Cleanup Realtime');
        supabase.removeChannel(channel);
      }
    };
  }, []);

  // Charger au montage
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    loadNotifications,
    loadUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    refresh: loadNotifications
  };
}

// ==========================================
// HELPERS (inchangés)
// ==========================================

export function getRelativeTime(date) {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'À l\'instant';
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
  
  return then.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short'
  });
}

export function getNotificationIcon(type) {
  switch (type) {
    case 'distribution': return '💰';
    case 'bonus': return '🎯';
    case 'bet_won': return '✅';
    case 'bet_lost': return '❌';
    case 'new_match': return '🆕';
    case 'rank_up': return '🏆';
    default: return '🔔';
  }
}

export function getNotificationColor(type) {
  switch (type) {
    case 'distribution': return 'bg-yellow-50 border-yellow-300';
    case 'bonus': return 'bg-orange-50 border-orange-300';
    case 'bet_won': return 'bg-green-50 border-green-300';
    case 'bet_lost': return 'bg-red-50 border-red-300';
    case 'new_match': return 'bg-blue-50 border-blue-300';
    case 'rank_up': return 'bg-purple-50 border-purple-300';
    default: return 'bg-gray-50 border-gray-300';
  }
}
