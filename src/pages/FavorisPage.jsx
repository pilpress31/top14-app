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
  const [matchsBetStatus, setMatchsBetStatus] = useState({}); // match_id → 'none' | 'partial' | 'complete'
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
      const [favRes, top14Res, d2Res, hcupRes, betsTop14Res, betsD2Res, betsHcupRes] = await Promise.all([
        axios.get(`${API_BASE}/api/favorites/matchs`, { headers: { 'x-user-id': user.id } }),
        axios.get(`${API_BASE}/api/matchs/a-venir`),
        axios.get(`${API_BASE}/api/d2/matchs/a-venir`),
        axios.get(`${API_BASE}/api/hcup/matchs/a-venir`),
        axios.get(`${API_BASE}/api/user/bets/detailed`, { headers: { 'x-user-id': user.id } }).catch(() => ({ data: { bets: [] } })),
        axios.get(`${API_BASE}/api/d2/user/bets/detailed`, { headers: { 'x-user-id': user.id } }).catch(() => ({ data: { bets: [] } })),
        axios.get(`${API_BASE}/api/hcup/user/bets/detailed`, { headers: { 'x-user-id': user.id } }).catch(() => ({ data: { bets: [] } })),
      ]);
      setMatchs(favRes.data.matchs || []);

      // Paris existants (uniquement pending)
      const betsTop14 = (betsTop14Res.data.bets || []).filter(b => b.status === 'pending');
      const betsD2 = (betsD2Res.data.bets || []).filter(b => b.status === 'pending');
      const betsHcup = (betsHcupRes.data.bets || []).filter(b => b.status === 'pending');

      const status = {};

      // ── Top 14 ───────────────────────────────────────────
      // Grouper les bets par match_id
      const top14Matchs = top14Res.data.matchs || [];
      const firstJourneeTop14 = top14Matchs.length > 0 ? top14Matchs[0].journee : null;

      // Construire un map journee → match_id depuis les bets (les bets ont les vrais IDs)
      // Pour chaque match favori de la première journée, chercher ses bets
      const betsParMatchTop14 = {};
      betsTop14.forEach(b => {
        if (!betsParMatchTop14[b.match_id]) betsParMatchTop14[b.match_id] = [];
        betsParMatchTop14[b.match_id].push(b);
      });

      // Pour chaque match de la première journée, déterminer le statut
      // On utilise les matchs favoris retournés par /api/favorites/matchs qui ont les vrais IDs
      const favMatchsTop14 = (favRes.data.matchs || []).filter(m =>
        m.championnat === 'top14' && m.journee === firstJourneeTop14
      );

      favMatchsTop14.forEach(m => {
        const id = m.match_id;
        const matchBets = betsParMatchTop14[id] || [];
        const hasFT = matchBets.some(b => b.bet_type === 'FT' || b.bet_type === 'WINNER_FT');
        const hasMT = matchBets.some(b => b.bet_type === 'MT' || b.bet_type === 'WINNER_MT');
        // Vérifier si cotes MT disponibles depuis les matchs a-venir
        const matchAVenir = top14Matchs.find(av =>
          av.equipe_domicile === m.equipe_domicile && av.equipe_exterieure === m.equipe_exterieure
        );
        const hasMTCotes = matchAVenir?.cote_mt_domicile != null;
        if (!hasFT && !hasMT) status[id] = 'none';
        else if ((hasFT && hasMTCotes && !hasMT) || (!hasFT && hasMTCotes && hasMT)) status[id] = 'partial';
        else status[id] = 'complete';
      });

      // Ajouter aussi les matchs de la J courante qui ne sont pas en favoris
      // mais qui pourraient l'être (pour que les matchs a-venir non favoris soient aussi couverts)
      top14Matchs.filter(m => m.journee === firstJourneeTop14).forEach(m => {
        const id = m.match_id || m.id;
        if (!id || status[id] !== undefined) return;
        const matchBets = betsParMatchTop14[id] || [];
        const hasFT = matchBets.some(b => b.bet_type === 'FT' || b.bet_type === 'WINNER_FT');
        const hasMT = matchBets.some(b => b.bet_type === 'MT' || b.bet_type === 'WINNER_MT');
        const hasMTCotes = m.cote_mt_domicile != null;
        if (!hasFT && !hasMT) status[id] = 'none';
        else if ((hasFT && hasMTCotes && !hasMT) || (!hasFT && hasMTCotes && hasMT)) status[id] = 'partial';
        else status[id] = 'complete';
      });

      // ── Pro D2 ───────────────────────────────────────────
      const d2Matchs = d2Res.data.matchs || [];
      const firstJourneeD2 = d2Matchs.length > 0 ? d2Matchs[0].journee : null;
      const favMatchsD2 = (favRes.data.matchs || []).filter(m =>
        m.championnat === 'd2' && m.journee === firstJourneeD2
      );
      favMatchsD2.forEach(m => {
        const id = m.match_id;
        status[id] = betsD2.some(b => b.match_id === id) ? 'complete' : 'none';
      });

      // ── HCup ─────────────────────────────────────────────
      const hcupMatchs = hcupRes.data.matchs || [];
      const firstRoundHcup = hcupMatchs.length > 0 ? hcupMatchs[0].round : null;
      const favMatchsHcup = (favRes.data.matchs || []).filter(m => m.championnat === 'hcup');
      favMatchsHcup.forEach(m => {
        const id = m.match_id;
        status[id] = betsHcup.some(b => b.match_id === id) ? 'complete' : 'none';
      });

      setMatchsBetStatus(status);
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

                        {/* Badge championnat + date + journée */}
                        <div className="px-4 py-2 flex items-center justify-between"
                             style={{ backgroundColor: champ.bg }}>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                                  style={{ backgroundColor: champ.color, color: '#fff' }}>
                              {champ.label}
                            </span>
                            {/* Journée / Round à côté du badge */}
                            {(match.journee || match.round) && (
                              <span className="text-[10px] text-gray-500 font-medium">
                                {match.round && match.round !== 'Journée'
                                  ? match.round
                                  : match.journee
                                    ? `Journée ${String(match.journee).replace('J', '')}`
                                    : ''}
                              </span>
                            )}
                          </div>
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

                          {/* Bouton selon statut des paris */}
                          <div className="mt-1.5 flex items-center justify-end">
                            {(() => {
                              const matchId = match.match_id || match.id;
                              const betStatus = matchsBetStatus[matchId];
                              if (betStatus === 'none') {
                                return (
                                  <button
                                    onClick={() => navigate('/pronos', { state: { activeTab: 'a-parier', scrollToMatchId: matchId, championnat: match.championnat } })}
                                    className="text-[10px] font-bold px-2 py-1 rounded-full transition-colors"
                                    style={{ backgroundColor: champ.color + '20', color: champ.color, border: `1px solid ${champ.color}40` }}
                                  >
                                    🎯 Parier
                                  </button>
                                );
                              }
                              if (betStatus === 'partial') {
                                return (
                                  <button
                                    onClick={() => navigate('/pronos', { state: { activeTab: 'a-parier', scrollToMatchId: matchId, championnat: match.championnat } })}
                                    className="text-[10px] font-bold px-2 py-1 rounded-full transition-colors"
                                    style={{ backgroundColor: '#FF8C0020', color: '#FF8C00', border: '1px solid #FF8C0040' }}
                                  >
                                    ✏️ Compléter
                                  </button>
                                );
                              }
                              if (betStatus === 'complete') {
                                return (
                                  <button
                                    onClick={() => navigate('/pronos', { state: { activeTab: 'mes-paris', scrollToMatchId: matchId, championnat: match.championnat } })}
                                    className="text-[10px] font-bold px-2 py-1 rounded-full transition-colors"
                                    style={{ backgroundColor: '#16a34a20', color: '#16a34a', border: '1px solid #16a34a40' }}
                                  >
                                    ✅ Voir mon pari
                                  </button>
                                );
                              }
                              return null;
                            })()}
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
