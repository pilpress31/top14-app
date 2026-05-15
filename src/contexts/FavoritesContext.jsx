// ============================================
// FavoritesContext.jsx – Contexte global favoris
// ============================================
// Realtime Supabase sur user_favorites
// Mutex pour éviter les conflits toggle/realtime
// ============================================

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabaseClient';
import axios from 'axios';

const API_BASE = 'https://top14-api-production.up.railway.app';

const FavoritesContext = createContext({});

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error('useFavorites must be used within a FavoritesProvider');
  return context;
};

export const FavoritesProvider = ({ children }) => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [matchsFavoris, setMatchsFavoris] = useState([]);
  const [loading, setLoading] = useState(false);
  const userRef = useRef(user);
  const isTogglingRef = useRef(false); // Mutex pour bloquer le Realtime pendant un toggle

  useEffect(() => { userRef.current = user; }, [user]);

  // ── Charger tout au login ─────────────────────────────────
  useEffect(() => {
    if (user) {
      loadAll();
    } else {
      setFavorites([]);
      setMatchsFavoris([]);
    }
  }, [user]);

  // ── Realtime sur user_favorites ───────────────────────────
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('user_favorites_realtime')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_favorites',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          // Ne pas recharger si un toggle est en cours (évite les conflits)
          if (isTogglingRef.current) {
            console.log('🔄 Realtime ignoré (toggle en cours)');
            return;
          }
          console.log('🔄 Realtime favoris → rechargement');
          loadAll();
        }
      )
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [user]);

  const loadAll = async () => {
    if (!userRef.current) return;
    setLoading(true);
    try {
      const [favRes, matchsRes] = await Promise.all([
        axios.get(`${API_BASE}/api/favorites`, { headers: { 'x-user-id': userRef.current.id } }),
        axios.get(`${API_BASE}/api/favorites/matchs`, { headers: { 'x-user-id': userRef.current.id } }),
      ]);
      setFavorites((favRes.data.favorites || []).map(f => f.equipe_nom));
      setMatchsFavoris(matchsRes.data.matchs || []);
    } catch (e) {
      console.warn('Erreur chargement favoris:', e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMatchsFavoris = async () => {
    if (!userRef.current) return;
    try {
      const res = await axios.get(`${API_BASE}/api/favorites/matchs`, {
        headers: { 'x-user-id': userRef.current.id }
      });
      setMatchsFavoris(res.data.matchs || []);
    } catch (e) {
      console.warn('Erreur chargement matchs:', e.message);
    }
  };

  const isFavori = useCallback((equipe_nom) => {
    return favorites.includes(equipe_nom);
  }, [favorites]);

  const toggleFavori = useCallback(async (equipe_nom, championnat = 'top14') => {
    if (!userRef.current) return;
    const wasInFav = favorites.includes(equipe_nom);

    // Activer le mutex — bloquer le Realtime pendant l'opération
    isTogglingRef.current = true;

    // ── Mise à jour optimiste des étoiles ──
    setFavorites(prev =>
      wasInFav ? prev.filter(e => e !== equipe_nom) : [...prev, equipe_nom]
    );

    try {
      await axios.post(`${API_BASE}/api/favorites/toggle`,
        { equipe_nom, championnat },
        { headers: { 'x-user-id': userRef.current.id } }
      );
      // Recharger les matchs après confirmation API
      await loadMatchsFavoris();
    } catch (e) {
      console.error('Erreur toggle favori, rollback:', e.message);
      setFavorites(prev =>
        wasInFav ? [...prev, equipe_nom] : prev.filter(eq => eq !== equipe_nom)
      );
      await loadMatchsFavoris();
    } finally {
      // Désactiver le mutex après 1s (laisser le temps au Realtime de passer)
      setTimeout(() => { isTogglingRef.current = false; }, 1000);
    }
  }, [favorites]);

  return (
    <FavoritesContext.Provider value={{
      favorites,
      matchsFavoris,
      loading,
      isFavori,
      toggleFavori,
      reloadFavorites: loadAll,
    }}>
      {children}
    </FavoritesContext.Provider>
  );
};
