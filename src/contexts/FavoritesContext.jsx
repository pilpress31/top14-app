// ============================================
// FavoritesContext.jsx – Contexte global favoris
// ============================================
// Charge les favoris une seule fois au login
// Expose : favorites, isFavori(), toggleFavori()
// Mise à jour instantanée dans toute l'app
// ============================================

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  const [favorites, setFavorites] = useState([]); // liste des equipe_nom
  const [loading, setLoading] = useState(false);

  // Charger les favoris quand l'user se connecte
  useEffect(() => {
    if (user) {
      loadFavorites();
    } else {
      setFavorites([]);
    }
  }, [user]);

  const loadFavorites = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/favorites`, {
        headers: { 'x-user-id': user.id }
      });
      const equipes = (res.data.favorites || []).map(f => f.equipe_nom);
      setFavorites(equipes);
    } catch (e) {
      console.warn('Erreur chargement favoris:', e.message);
    } finally {
      setLoading(false);
    }
  };

  // Vérifier si une équipe est en favori
  const isFavori = useCallback((equipe_nom) => {
    return favorites.includes(equipe_nom);
  }, [favorites]);

  // Toggle favori — mise à jour optimiste immédiate
  const toggleFavori = useCallback(async (equipe_nom, championnat = 'top14') => {
    if (!user) return;

    const wasInFav = favorites.includes(equipe_nom);

    // Mise à jour optimiste immédiate (avant la réponse API)
    setFavorites(prev =>
      wasInFav
        ? prev.filter(e => e !== equipe_nom)
        : [...prev, equipe_nom]
    );

    try {
      await axios.post(`${API_BASE}/api/favorites/toggle`,
        { equipe_nom, championnat },
        { headers: { 'x-user-id': user.id } }
      );
    } catch (e) {
      // Rollback si erreur API
      console.error('Erreur toggle favori:', e.message);
      setFavorites(prev =>
        wasInFav
          ? [...prev, equipe_nom]
          : prev.filter(eq => eq !== equipe_nom)
      );
    }
  }, [user, favorites]);

  const value = {
    favorites,
    loading,
    isFavori,
    toggleFavori,
    reloadFavorites: loadFavorites,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};
