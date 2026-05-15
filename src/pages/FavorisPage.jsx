// ============================================
// FavorisPage.jsx – Mes équipes favorites
// ============================================

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ChevronLeft, Calendar, Loader, ArrowUp, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { getTeamData } from '../utils/teams';
import axios from 'axios';

const API_BASE = 'https://top14-api-production.up.railway.app';

const CHAMP_LABELS = {
  top14: { label: 'TOP 14', color: '#D4A017', bg: '#FFF8E7' },
  d2: { label: 'PRO D2', color: '#00174D', bg: '#E8EFF7' },
  hcup: { label: 'C.CUP', color: '#003E7E', bg: '#E8EEF7' },
};

export default function FavorisPage() {
  const { user } = useAuth();
  const { favorites, isFavori, toggleFavori, reloadFavorites } = useFavorites();
  const navigate = useNavigate();
  const [matchs, setMatchs] = useState([]);
  const [matchsDisponibles, setMatchsDisponibles] = useState(new Set());
  const [loadingMatchs, setLoadingMatchs] = useState(false);
  const [loadingPage, setLoadingPage] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const prevFavoritesRef = useRef([]);

  // Scroll to top button
  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Charger les matchs au montage
  useEffect(() => {
    loadMatchs();
    setLoadingPage(false);
  }, []);

  // Recharger les matchs quand favorites change
  useEffect(() => {
    const prev = prevFavoritesRef.current;
    const curr = favorites;
    // Détecter un changement réel
    if (JSON.stringify(prev.sort()) !== JSON.stringify([...curr].sort())) {
      prevFavoritesRef.current = [...curr];
      loadMatchs();
    }
  }, [favorites]);

  const loadMatchs = async () => {
    if (!user) return;
    setLoadingMatchs(true);
    try {
      const [favRes, dispRes] = await Promise.all([
        axios.get(`${API_BASE}/api/favorites/matchs`, { headers: { 'x-user-id': user.id } }),
        axios.get(`${API_BASE}/api/matchs/a-venir`),
      ]);
      setMatchs(favRes.data.matchs || []);
      // Construire un Set des match_ids avec paris ouverts
      const ids = new Set((dispRes.data.matchs || []).map(m => m.match_id || m.id));
      setMatchsDisponibles(ids);
    } catch (e) {
      console.error('Erreur chargement matchs:', e.message);
    } finally {
      setLoadingMatchs(false);
    }
  };

  const handleActualiser = async () => {
    await reloadFavorites();
    await loadMatchs();
  };

  const handleToggle = async (equipe_nom) => {
    await toggleFavori(equipe_nom);
    // Recharger les matchs immédiatement après toggle
    await loadMatchs();
  };

  if (loadingPage) {
    return (
      <div className="flex justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-rugby-gold" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">

      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm"
           style={{ paddingTop: 'var(--safe-area-top, 0px)' }}>
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <Star className="w-5 h-5 text-rugby-gold fill-rugby-gold" />
            <h1 className="text-lg font-bold text-gray-900">Mes équipes favorites</h1>
          </div>
          <button
            onClick={handleActualiser}
            disabled={loadingMatchs}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Actualiser"
          >
            <RefreshCw className={`w-5 h-5 text-gray-500 ${loadingMatchs ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 space-y-5">

        {favorites.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-gray-200">
            <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Aucune équipe favorite</p>
            <p className="text-sm text-gray-400 mt-1">
              Appuie sur l'étoile ⭐ d'un match pour suivre une équipe
            </p>
          </div>
        ) : (
          <>
            {/* Liste des équipes favorites */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h2 className="text-sm font-bold text-gray-700 uppercase">
                  {favorites.length} équipe{favorites.length > 1 ? 's' : ''} suivie{favorites.length > 1 ? 's' : ''}
                </h2>
              </div>
              {favorites.map((equipe_nom, i) => {
                const teamData = getTeamData(equipe_nom);
                return (
                  <div key={equipe_nom}
                    className={`px-4 py-3 flex items-center gap-3 ${i < favorites.length - 1 ? 'border-b border-gray-100' : ''}`}>
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <img src={teamData.logo} alt={teamData.name}
                        className="w-8 h-8 object-contain"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    </div>
                    <span className="flex-1 font-semibold text-gray-800 uppercase">{teamData.name}</span>
                    <button
                      onClick={() => handleToggle(equipe_nom)}
                      className="p-1.5 rounded-full hover:bg-red-50 transition-colors"
                      title="Retirer des favoris"
                    >
                      <Star className="w-5 h-5 text-rugby-gold fill-rugby-gold" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Prochains matchs */}
            <div>
              <h2 className="text-sm font-bold text-gray-700 uppercase px-1 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Prochains matchs
                {loadingMatchs && <Loader className="w-3.5 h-3.5 animate-spin text-gray-400" />}
              </h2>

              {matchs.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-6 text-center border border-gray-200">
                  <p className="text-gray-400 text-sm">Aucun match à venir pour tes équipes favorites</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {matchs.map((match) => {
                    const teamDom = getTeamData(match.equipe_domicile);
                    const teamExt = getTeamData(match.equipe_exterieure);
                    const champ = CHAMP_LABELS[match.championnat] || CHAMP_LABELS.top14;
                    const date = new Date(match.date_match);
                    const showTime = date.getHours() !== 0 || date.getMinutes() !== 0;

                    return (
                      <div key={match.match_id}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

                        {/* Badge championnat + date */}
                        <div className="px-4 py-2 flex items-center justify-between"
                             style={{ backgroundColor: champ.bg }}>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: champ.color, color: '#fff' }}>
                            {champ.label}
                          </span>
                          <span className="text-xs text-gray-500">
                            {date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                            {showTime && ` • ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`}
                          </span>
                        </div>

                        {/* Équipes */}
                        <div className="px-4 py-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1">
                              <img src={teamDom.logo} alt={teamDom.name}
                                className="w-8 h-8 object-contain"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                              <span className="font-bold text-gray-900 uppercase text-sm">{teamDom.name}</span>
                            </div>
                            <span className="text-gray-400 font-bold text-xs">vs</span>
                            <div className="flex items-center gap-2 flex-1 justify-end">
                              <span className="font-bold text-gray-900 uppercase text-sm">{teamExt.name}</span>
                              <img src={teamExt.logo} alt={teamExt.name}
                                className="w-8 h-8 object-contain"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                            </div>
                          </div>

                          {/* Journée / Round */}
                          <div className="mt-1.5 flex items-center justify-between">
                            <span className="text-[10px] text-gray-400">
                              {match.round && match.round !== 'Journée'
                                ? match.round
                                : match.journee
                                  ? `Journée ${String(match.journee).replace('J', '')}`
                                  : ''}
                            </span>
                            {/* Bouton Parier — uniquement si paris ouverts */}
                            {matchsDisponibles.has(match.match_id) && (
                              <button
                                onClick={() => navigate('/pronos', {
                                  state: {
                                    activeTab: 'a-parier',
                                    scrollToMatchId: match.match_id,
                                    championnat: match.championnat,
                                  }
                                })}
                                className="text-[10px] font-bold px-2 py-1 rounded-full transition-colors"
                                style={{
                                  backgroundColor: champ.color + '20',
                                  color: champ.color,
                                  border: `1px solid ${champ.color}40`
                                }}
                              >
                                🎯 Parier
                              </button>
                            )}
                          </div>

                          {/* Prono IA */}
                          {match.score_predit_dom != null && (
                            <div className="mt-1 flex items-center justify-center gap-2">
                              <span className="text-[10px] text-indigo-500 font-semibold">Prono IA :</span>
                              <span className="text-[11px] font-bold text-indigo-700">
                                {match.score_predit_dom} - {match.score_predit_ext}
                              </span>
                              {match.confiance_algo != null && (
                                <span className="text-[10px] text-gray-400">
                                  ({match.confiance_algo <= 1
                                    ? Math.round(match.confiance_algo * 100)
                                    : Math.round(match.confiance_algo)}% confiance)
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Bouton retour en haut */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-24 right-4 w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-all z-40"
          style={{ backgroundColor: '#D4A017' }}
        >
          <ArrowUp className="w-5 h-5 text-white" />
        </button>
      )}
    </div>
  );
}
