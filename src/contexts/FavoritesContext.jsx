// ============================================
// FavoritesContext.jsx – Contexte global favoris
// ============================================
// Charge les favoris + matchs une seule fois au login
// Expose : favorites, matchsFavoris, isFavori(), toggleFavori()
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
  const [favorites, setFavorites] = useState([]);
  const [matchsFavoris, setMatchsFavoris] = useState([]);
  const [loading, setLoading] = useState(false);

  // Charger les favoris quand l'user se connecte
  useEffect(() => {
    if (user) {
      loadFavorites();
    } else {
      setFavorites([]);
      setMatchsFavoris([]);
    }
  }, [user]);

  // Recharger les matchs à chaque changement de favoris
  useEffect(() => {
    if (!user) return;
    if (favorites.length === 0) {
      setMatchsFavoris([]);
      return;
    }
    loadMatchsFavoris();
  }, [favorites]);

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

  const loadMatchsFavoris = async () => {
    if (!user) return;
    try {
      const res = await axios.get(`${API_BASE}/api/favorites/matchs`, {
        headers: { 'x-user-id': user.id }
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

    // Mise à jour optimiste des matchs aussi
    if (wasInFav) {
      setMatchsFavoris(prev =>
        prev.filter(m =>
          m.equipe_domicile !== equipe_nom && m.equipe_exterieure !== equipe_nom
        )
      );
    }

    try {
      await axios.post(`${API_BASE}/api/favorites/toggle`,
        { equipe_nom, championnat },
        { headers: { 'x-user-id': user.id } }
      );
      // Si on a ajouté, recharger les matchs depuis l'API
      if (!wasInFav) {
        loadMatchsFavoris();
      }
    } catch (e) {
      // Rollback si erreur API
      console.error('Erreur toggle favori:', e.message);
      setFavorites(prev =>
        wasInFav
          ? [...prev, equipe_nom]
          : prev.filter(eq => eq !== equipe_nom)
      );
      loadMatchsFavoris();
    }
  }, [user, favorites]);

  const value = {
    favorites,
    matchsFavoris,
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
