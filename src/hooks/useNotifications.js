// ==========================================
// HOOK useNotifications
// ==========================================
// Fichier : src/hooks/useNotifications.js
//
// 🆕 v3 : badge réactif instantané ET compatibilité ascendante
//    - unreadCount dérivé localement de notifications (calcul réactif)
//    - Polling 30s supprimé
//    - loadUnreadCount conservé pour compatibilité (ne fait plus rien de néfaste)
// ==========================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import axios from 'axios';

const API_URL = 'https://top14-api-production.up.railway.app/api';


export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🆕 unreadCount DÉRIVÉ localement de notifications (toujours en sync avec l'UI)
  const unreadCount = useMemo(
    () => notifications.filter(n => !n.is_read).length,
    [notifications]
  );

  // Charger notifications
  const loadNotifications = useCallback(async (unreadOnly = false) => {
    try {
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

      setNotifications(response.data.notifications || []);

    } catch (err) {
      console.error('Erreur chargement notifications:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // 🆕 loadUnreadCount conservé pour compatibilité ascendante
  // Maintenant il appelle simplement loadNotifications(),
  // ce qui recharge tout (notifs + compteur dérivé) sans risque de désync
  const loadUnreadCount = useCallback(async () => {
    return loadNotifications();
  }, [loadNotifications]);

  // Marquer notification comme lue (MISE À JOUR OPTIMISTE)
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      // ✅ OPTIMISTE : mettre à jour l'UI IMMÉDIATEMENT
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );

      await axios.put(
        `${API_URL}/notifications/${notificationId}/read`,
        {},
        { headers: { 'x-user-id': user.id } }
      );
    } catch (err) {
      console.error('Erreur marquage notification:', err);
      loadNotifications();
    }
  }, [loadNotifications]);

  // Marquer toutes comme lues (MISE À JOUR OPTIMISTE)
  const markAllAsRead = useCallback(async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));

      await axios.put(
        `${API_URL}/notifications/read-all`,
        {},
        { headers: { 'x-user-id': user.id } }
      );
    } catch (err) {
      console.error('Erreur marquage toutes notifications:', err);
      loadNotifications();
    }
  }, [loadNotifications]);

  // Supprimer notification (MISE À JOUR OPTIMISTE)
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));

      await axios.delete(
        `${API_URL}/notifications/${notificationId}`,
        { headers: { 'x-user-id': user.id } }
      );
    } catch (err) {
      console.error('Erreur suppression notification:', err);
      loadNotifications();
    }
  }, [loadNotifications]);

  // Supprimer toutes les notifications (MISE À JOUR OPTIMISTE)
  const deleteAllNotifications = useCallback(async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      setNotifications([]);

      await axios.delete(
        `${API_URL}/notifications/all`,
        { headers: { 'x-user-id': user.id } }
      );
    } catch (err) {
      console.error('Erreur suppression toutes notifications:', err);
      loadNotifications();
    }
  }, [loadNotifications]);

  // Écouter temps réel (Supabase Realtime) — INSERT, UPDATE, DELETE
  useEffect(() => {
    let channel;

    async function setupRealtime() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

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
            // 🆕 Note : on évite TOUT loadUnreadCount() ici.
            // Le compteur est dérivé de notifications via useMemo,
            // donc il se met à jour automatiquement.

            if (payload.eventType === 'INSERT') {
              setNotifications(prev => {
                if (prev.some(n => n.id === payload.new.id)) return prev;
                return [payload.new, ...prev];
              });
            }
            else if (payload.eventType === 'UPDATE') {
              setNotifications(prev =>
                prev.map(n => n.id === payload.new.id ? payload.new : n)
              );
            }
            else if (payload.eventType === 'DELETE') {
              setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
            }
          }
        )
        .subscribe();
    }

    setupRealtime();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  // Charger au montage
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // 🚫 SUPPRIMÉ : le polling 30s qui écrasait l'optimistic update
  // Realtime Supabase suffit pour synchroniser avec d'autres appareils

  return {
    notifications,
    unreadCount,
    loading,
    error,
    loadNotifications,
    loadUnreadCount,  // 🆕 conservé pour compatibilité (ne fait plus rien de néfaste)
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    refresh: loadNotifications
  };
}

// ==========================================
// HELPER - Formater temps relatif
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

// ==========================================
// HELPER - Icône selon type
// ==========================================

export function getNotificationIcon(type) {
  switch (type) {
    case 'distribution':
      return '💰';
    case 'bonus':
      return '🎯';
    case 'bet_won':
      return '✅';
    case 'bet_lost':
      return '❌';
    case 'new_match':
      return '🆕';
    case 'rank_up':
      return '🏆';
    default:
      return '🔔';
  }
}

// ==========================================
// HELPER - Couleur selon type
// ==========================================

export function getNotificationColor(type) {
  switch (type) {
    case 'distribution':
      return 'bg-yellow-50 border-yellow-300';
    case 'bonus':
      return 'bg-orange-50 border-orange-300';
    case 'bet_won':
      return 'bg-green-50 border-green-300';
    case 'bet_lost':
      return 'bg-red-50 border-red-300';
    case 'new_match':
      return 'bg-blue-50 border-blue-300';
    case 'rank_up':
      return 'bg-purple-50 border-purple-300';
    default:
      return 'bg-gray-50 border-gray-300';
  }
}
