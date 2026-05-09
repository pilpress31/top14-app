// ==========================================
// HOOK useNotifications
// ==========================================
// Fichier : src/hooks/useNotifications.js
//
// v3.3 — fix Realtime replay au resubscribe (mai 2026)
//   - Channel name UNIQUE par user + timestamp (évite la réutilisation côté Supabase)
//   - Garde temporelle sur INSERT : ignore les events bufferisés antérieurs au mount
//   - unreadCount dérivé localement de notifications via useMemo
//   - Pas de polling périodique (Realtime suffit)
//   - À utiliser via NotificationsContext (Provider) pour partager
//     le state entre Badge et Center
//
// Bug corrigé :
//   Au refresh d'une page (ex. Classement Pro D2), le hook se remontait
//   et le channel 'notifications' (statique) pouvait rejouer les INSERT
//   bufferisés côté Supabase, faisant réapparaître des notifs déjà supprimées.
// ==========================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import axios from 'axios';

const API_URL = 'https://top14-api-production.up.railway.app/api';


export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // unreadCount DÉRIVÉ localement de notifications (toujours en sync avec l'UI)
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

  // Conservé pour compatibilité ascendante (au cas où un composant l'appellerait)
  // Redirige simplement vers loadNotifications
  const loadUnreadCount = useCallback(async () => {
    return loadNotifications();
  }, [loadNotifications]);

  // Marquer notification comme lue (mise à jour optimiste)
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

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

  // Marquer toutes comme lues (mise à jour optimiste)
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

  // Supprimer notification (mise à jour optimiste)
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

  // Supprimer toutes les notifications (mise à jour optimiste)
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

  // Realtime Supabase — INSERT, UPDATE, DELETE
  // ⚠️ FIX v3.3 : channel name unique + garde temporelle anti-replay au resubscribe
  useEffect(() => {
    let channel;
    const mountTime = new Date().toISOString();

    async function setupRealtime() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 🆕 Channel name UNIQUE par user + par mount
      // Empêche Supabase de retomber sur un channel existant côté serveur
      // et de rejouer son backlog d'events bufferisés.
      const channelName = `notifications-${user.id}-${Date.now()}`;

      channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            // Note : on ne touche QUE notifications.
            // unreadCount est dérivé via useMemo, il se met à jour automatiquement.

            if (payload.eventType === 'INSERT') {
              // 🛡️ Garde temporelle : ignorer les INSERTs antérieurs au mount du hook.
              // Si une notif arrive via Realtime mais a été créée AVANT que le hook
              // ne se monte, c'est forcément un replay de buffer Supabase → on l'ignore.
              // Le fetch REST initial (loadNotifications) charge déjà les notifs préexistantes.
              if (payload.new.created_at && payload.new.created_at < mountTime) {
                console.log('[useNotifications] INSERT bufferisé ignoré:', payload.new.id);
                return;
              }
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
    case 'distribution': return '💰';
    case 'bonus': return '🎯';
    case 'bet_won': return '✅';
    case 'bet_lost': return '❌';
    case 'new_match': return '🆕';
    case 'rank_up': return '🏆';
    case 'tuto_push_in_app': return '🛎️';
    default: return '🔔';
  }
}

// ==========================================
// HELPER - Couleur selon type
// ==========================================

export function getNotificationColor(type) {
  switch (type) {
    case 'distribution': return 'bg-yellow-50 border-yellow-300';
    case 'bonus': return 'bg-orange-50 border-orange-300';
    case 'bet_won': return 'bg-green-50 border-green-300';
    case 'bet_lost': return 'bg-red-50 border-red-300';
    case 'new_match': return 'bg-blue-50 border-blue-300';
    case 'rank_up': return 'bg-purple-50 border-purple-300';
    case 'tuto_push_in_app': return 'bg-amber-50 border-amber-300';
    default: return 'bg-gray-50 border-gray-300';
  }
}
