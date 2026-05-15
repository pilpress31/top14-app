// ============================================
// FavorisPage.jsx – Mes équipes favorites
// ============================================

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Star, ChevronLeft, Calendar, Loader } from 'lucide-react';
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
  const { favorites, isFavori, toggleFavori } = useFavorites();
  const navigate = useNavigate();
  const location = useLocation();
  const [matchs, setMatchs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Recharger les matchs quand les favoris changent ou qu'on navigue ici
  useEffect(() => {
    loadMatchs();
  }, [favorites, location.key]);

  const loadMatchs = async () => {
    if (!user || favorites.length === 0) {
      setMatchs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/favorites/matchs`, {
        headers: { 'x-user-id': user.id }
      });
      setMatchs(res.data.matchs || []);
    } catch (e) {
      console.error('Erreur chargement matchs favoris:', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (equipe_nom) => {
    await toggleFavori(equipe_nom);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">

      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm"
           style={{ paddingTop: 'var(--safe-area-top, 0px)' }}>
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-rugby-gold fill-rugby-gold" />
            <h1 className="text-lg font-bold text-gray-900">Mes équipes favorites</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 space-y-5">

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader className="w-8 h-8 animate-spin text-rugby-gold" />
          </div>
        ) : favorites.length === 0 ? (
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

                          {/* Prono IA si disponible */}
                          {match.score_predit_dom != null && (
                            <div className="mt-2 flex items-center justify-center gap-2">
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

                          {/* Phase HCup si disponible */}
                          {match.round && (
                            <div className="mt-1 text-center">
                              <span className="text-[10px] text-gray-400">{match.round}</span>
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
    </div>
  );
}
