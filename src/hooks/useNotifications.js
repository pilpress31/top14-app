// ==========================================
// HOOK useNotifications
// ==========================================
// Fichier : src/hooks/useNotifications.js

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import axios from 'axios';

// const API_URL = import.meta.env.VITE_API_URL || 'https://top14-api.vercel.app/api';
// Hardcodé temporairement pour tester
const API_URL = 'https://top14-api.vercel.app/api';


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

  // Marquer notification comme lue
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      await axios.put(
        `${API_URL}/notifications/${notificationId}/read`,
        {},
        { headers: { 'x-user-id': user.id } }
      );

      // Mettre à jour state local
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );

      setUnreadCount(prev => Math.max(0, prev - 1));

    } catch (err) {
      console.error('Erreur marquage notification:', err);
    }
  }, []);

  // Marquer toutes comme lues
  const markAllAsRead = useCallback(async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      await axios.put(
        `${API_URL}/notifications/read-all`,
        {},
        { headers: { 'x-user-id': user.id } }
      );

      // Mettre à jour state local
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );

      setUnreadCount(0);

    } catch (err) {
      console.error('Erreur marquage toutes notifications:', err);
    }
  }, []);

  // Supprimer notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      await axios.delete(
        `${API_URL}/notifications/${notificationId}`,
        { headers: { 'x-user-id': user.id } }
      );

      // Retirer du state local
      setNotifications(prev => 
        prev.filter(n => n.id !== notificationId)
      );

      // Décrémenter compteur si non lue
      const notification = notifications.find(n => n.id === notificationId);
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

    } catch (err) {
      console.error('Erreur suppression notification:', err);
    }
  }, [notifications]);

  // Écouter temps réel (Supabase Realtime)
  useEffect(() => {
    let channel;

    async function setupRealtime() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // S'abonner aux nouvelles notifications
      channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'user_notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Nouvelle notification reçue:', payload.new);
            
            // Ajouter au state
            setNotifications(prev => [payload.new, ...prev]);
            setUnreadCount(prev => prev + 1);
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

  // Rafraîchir compteur toutes les 30s
  useEffect(() => {
    const interval = setInterval(() => {
      loadUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadUnreadCount]);

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
