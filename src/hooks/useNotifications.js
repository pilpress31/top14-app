// ==========================================
// HOOK useNotifications
// ==========================================
// Fichier : src/hooks/useNotifications.js

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import axios from 'axios';

// const API_URL = import.meta.env.VITE_API_URL || 'https://top14-api-production.up.railway.app/api';
// Hardcodé temporairement pour tester
const API_URL = 'https://top14-api-production.up.railway.app/api';


export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger notifications
  const loadNotifications = useCallback(async (unreadOnly = false) => {
    try {
      setLoading(true);
      setError(null);

      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        setNotifications([]);
        setUnreadCount(0);
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
      setUnreadCount(response.data.unread_count || 0);

    } catch (err) {
      console.error('Erreur chargement notifications:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger compteur uniquement
  const loadUnreadCount = useCallback(async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        setUnreadCount(0);
        return;
      }

      const response = await axios.get(`${API_URL}/notifications/unread-count`, {
        headers: { 'x-user-id': user.id }
      });

      setUnreadCount(response.data.unread_count || 0);

    } catch (err) {
      console.error('Erreur comptage notifications:', err);
    }
  }, []);

  // Marquer notification comme lue (MISE À JOUR OPTIMISTE)
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      // ✅ OPTIMISTE : mettre à jour l'UI IMMÉDIATEMENT
      let wasUnread = false;
      setNotifications(prev => {
        const notif = prev.find(n => n.id === notificationId);
        wasUnread = notif && !notif.is_read;
        return prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n);
      });
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      // Puis synchroniser avec le serveur en arrière-plan
      await axios.put(
        `${API_URL}/notifications/${notificationId}/read`,
        {},
        { headers: { 'x-user-id': user.id } }
      );
    } catch (err) {
      console.error('Erreur marquage notification:', err);
      // En cas d'erreur, on recharge pour resynchroniser
      loadNotifications();
    }
  }, [loadNotifications]);

  // Marquer toutes comme lues (MISE À JOUR OPTIMISTE)
  const markAllAsRead = useCallback(async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      // ✅ OPTIMISTE : mettre à jour l'UI IMMÉDIATEMENT
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);

      // Puis synchroniser avec le serveur
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

      // ✅ OPTIMISTE : retirer de l'UI IMMÉDIATEMENT
      let wasUnread = false;
      setNotifications(prev => {
        const notif = prev.find(n => n.id === notificationId);
        wasUnread = notif && !notif.is_read;
        return prev.filter(n => n.id !== notificationId);
      });
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      // Puis synchroniser avec le serveur
      await axios.delete(
        `${API_URL}/notifications/${notificationId}`,
        { headers: { 'x-user-id': user.id } }
      );
    } catch (err) {
      console.error('Erreur suppression notification:', err);
      loadNotifications();
    }
  }, [loadNotifications]);

  // Écouter temps réel (Supabase Realtime) — INSERT, UPDATE, DELETE
  useEffect(() => {
    let channel;

    async function setupRealtime() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // S'abonner à TOUS les changements de notifications (INSERT / UPDATE / DELETE)
      channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: '*',  // ✅ INSERT + UPDATE + DELETE
            schema: 'public',
            table: 'user_notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Événement notification:', payload.eventType, payload);

            if (payload.eventType === 'INSERT') {
              // Nouvelle notif reçue
              setNotifications(prev => {
                // Éviter doublons si déjà ajoutée localement
                if (prev.some(n => n.id === payload.new.id)) return prev;
                return [payload.new, ...prev];
              });
              setUnreadCount(prev => prev + 1);
            }
            else if (payload.eventType === 'UPDATE') {
              // Notif marquée comme lue depuis un autre appareil
              setNotifications(prev =>
                prev.map(n => n.id === payload.new.id ? payload.new : n)
              );
              // Recharger le compteur pour être sûr
              loadUnreadCount();
            }
            else if (payload.eventType === 'DELETE') {
              // Notif supprimée depuis un autre appareil
              setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
              // Recharger le compteur pour être sûr
              loadUnreadCount();
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
  }, [loadUnreadCount]);

  // Charger au montage
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Rafraîchir compteur toutes les 30s
  useEffect(() => {
    const interval = setInterval(() => {
      loadUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadUnreadCount]);

  // Supprimer toutes les notifications (MISE À JOUR OPTIMISTE)
  const deleteAllNotifications = useCallback(async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      // ✅ OPTIMISTE : vider l'UI IMMÉDIATEMENT
      setNotifications([]);
      setUnreadCount(0);

      // Puis synchroniser avec le serveur
      await axios.delete(
        `${API_URL}/notifications/all`,
        { headers: { 'x-user-id': user.id } }
      );
    } catch (err) {
      console.error('Erreur suppression toutes notifications:', err);
      loadNotifications();
    }
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
