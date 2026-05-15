// ============================================
// FavoritesContext.jsx – Contexte global favoris
// ============================================
// Charge les favoris + matchs une seule fois au login
// Expose : favorites, matchsFavoris, isFavori(), toggleFavori()
// Mise à jour optimiste pour les étoiles
// Rechargement matchs après confirmation API
// ============================================

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';

const API_BASE = 'https://top14-api-production.up.railway.app';

const FavoritesContext = createContext({});

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

export const FavoritesProvider = ({ children }) => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [matchsFavoris, setMatchsFavoris] = useState([]);
  const [loading, setLoading] = useState(false);
  const userRef = useRef(user);

  useEffect(() => { userRef.current = user; }, [user]);

  // Charger favoris + matchs au login
  useEffect(() => {
    if (user) {
      loadAll();
    } else {
      setFavorites([]);
      setMatchsFavoris([]);
    }
  }, [user]);

  const loadAll = async () => {
    if (!userRef.current) return;
    setLoading(true);
    try {
      const [favRes, matchsRes] = await Promise.all([
        axios.get(`${API_BASE}/api/favorites`, { headers: { 'x-user-id': userRef.current.id } }),
        axios.get(`${API_BASE}/api/favorites/matchs`, { headers: { 'x-user-id': userRef.current.id } }),
      ]);
      const equipes = (favRes.data.favorites || []).map(f => f.equipe_nom);
      setFavorites(equipes);
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
      console.warn('Erreur chargement matchs favoris:', e.message);
    }
  };

  // Vérifier si une équipe est en favori — instantané
  const isFavori = useCallback((equipe_nom) => {
    return favorites.includes(equipe_nom);
  }, [favorites]);

  // Toggle favori
  const toggleFavori = useCallback(async (equipe_nom, championnat = 'top14') => {
    if (!userRef.current) return;

    const wasInFav = favorites.includes(equipe_nom);

    // ── Mise à jour optimiste immédiate des étoiles ──
    setFavorites(prev =>
      wasInFav
        ? prev.filter(e => e !== equipe_nom)
        : [...prev, equipe_nom]
    );

    // Si suppression → retirer les matchs immédiatement
    if (wasInFav) {
      setMatchsFavoris(prev =>
        prev.filter(m =>
          m.equipe_domicile !== equipe_nom && m.equipe_exterieure !== equipe_nom
        )
      );
    }

    try {
      // Confirmer avec l'API
      await axios.post(`${API_BASE}/api/favorites/toggle`,
        { equipe_nom, championnat },
        { headers: { 'x-user-id': userRef.current.id } }
      );

      // Si ajout → recharger les matchs APRÈS confirmation API
      if (!wasInFav) {
        await loadMatchsFavoris();
      }

    } catch (e) {
      // Rollback si erreur API
      console.error('Erreur toggle favori:', e.message);
      setFavorites(prev =>
        wasInFav
          ? [...prev, equipe_nom]
          : prev.filter(eq => eq !== equipe_nom)
      );
      await loadMatchsFavoris();
    }
  }, [user, favorites]);

  const value = {
    favorites,
    matchsFavoris,
    loading,
    isFavori,
    toggleFavori,
    reloadFavorites: loadAll,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};
