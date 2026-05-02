// ============================================
// MES PARIS - CHAMPIONS CUP
// Affiche l'historique des paris HCup du user
// Couleurs : bleu EPCR #003E7E + or #FFC72C
// ============================================

import { useState, useEffect, useRef } from 'react';
import { Coins, TrendingUp, TrendingDown, Trophy, Clock, FileText, Target, Globe } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import axios from 'axios';
import { getTeamData } from '../utils/teams';
import ReglementModal from './ReglementModal';
import { useLocation } from 'react-router-dom';
import { useRealtimeSync } from '../hooks/useRealtimeSync';

const API_BASE = 'https://top14-api-production.up.railway.app';

// Couleurs Champions Cup
const HCUP_BLEU = '#003E7E';
const HCUP_OR = '#FFC72C';

export default function MesParisHcupTab() {
  const location = useLocation();
  const [userCredits, setUserCredits] = useState(null);
  const [paris, setParis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [showReglementModal, setShowReglementModal] = useState(false);

  const [targetMatchId, setTargetMatchId] = useState(null);
  const betRefs = useRef({});

  // Realtime : refresh sur user_bets_hcup et user_credits
  useRealtimeSync([
    { table: 'user_bets_hcup', onUpdate: () => loadData() },
    { table: 'user_credits', onUpdate: () => loadData() },
  ]);

  useEffect(() => {
    loadData();
  }, []);

  // Scroll vers un pari spécifique (depuis notification ou redirection)
  useEffect(() => {
    const matchIdFromState = location.state?.scrollToMatchId;
    const urlParams = new URLSearchParams(window.location.search);
    const matchIdFromUrl = urlParams.get('scrollToMatchId');
    const matchId = matchIdFromState || matchIdFromUrl;

    if (matchId && paris.length > 0) {
      const targetBet = paris.find(bet => bet.match_id === matchId);
      if (targetBet) {
        setTargetMatchId(matchId);
        if (targetBet.status === 'pending') setFilter('pending');
        else if (targetBet.status === 'won') setFilter('won');
        else if (targetBet.status === 'lost') setFilter('lost');
      }
      if (window.history?.replaceState) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [paris, location.state]);

  useEffect(() => {
    if (targetMatchId && paris.length > 0) {
      setTimeout(() => {
        const element = betRefs.current[targetMatchId];
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('ring-4', 'ring-offset-2', 'scale-105', 'shadow-2xl');
          element.style.setProperty('--tw-ring-color', HCUP_OR);
          setTimeout(() => {
            element.classList.remove('ring-4', 'ring-offset-2', 'scale-105', 'shadow-2xl');
          }, 3000);
          setTargetMatchId(null);
        }
      }, 600);
    }
  }, [filter, targetMatchId, paris.length]);

  const loadData = async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      // Crédits + total gagné GLOBAL (Top 14 + Pro D2 + HCup)
      try {
        const creditsResponse = await axios.get(`${API_BASE}/api/user/credits`, {
          headers: { 'x-user-id': user.id }
        });

        const [{ data: wonTop14 }, { data: wonD2 }, { data: wonHcup }] = await Promise.all([
          supabase.from('user_bets').select('payout').eq('user_id', user.id).eq('status', 'won'),
          supabase.from('user_bets_d2').select('payout').eq('user_id', user.id).eq('status', 'won'),
          supabase.from('user_bets_hcup').select('payout').eq('user_id', user.id).eq('status', 'won'),
        ]);

        const totalWonFromBets =
          (wonTop14 || []).reduce((s, b) => s + (b.payout || 0), 0) +
          (wonD2 || []).reduce((s, b) => s + (b.payout || 0), 0) +
          (wonHcup || []).reduce((s, b) => s + (b.payout || 0), 0);

        setUserCredits({ ...creditsResponse.data, totalWonFromBets });
      } catch {
        setUserCredits({ credits: 1000, total_earned: 0, total_spent: 0, totalWonFromBets: 0 });
      }

      // Paris HCup
      try {
        const parisResponse = await axios.get(`${API_BASE}/api/hcup/user/bets/detailed`, {
          headers: { 'x-user-id': user.id }
        });
        setParis(parisResponse.data.bets || []);
      } catch (error) {
        console.error('Erreur chargement paris HCup:', error);
        setParis([]);
      }
    } catch (error) {
      console.error('❌ Erreur globale chargement données HCup:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4" style={{ borderColor: HCUP_BLEU }}></div>
      </div>
    );
  }

  const parisFiltered = paris.filter(bet => {
    if (filter === 'pending') return bet.status === 'pending';
    if (filter === 'won') return bet.status === 'won';
    if (filter === 'lost') return bet.status === 'lost';
    return true;
  });

  const parisPending = paris.filter(p => p.status === 'pending').length;
  const parisWon = paris.filter(p => p.status === 'won').length;
  const parisLost = paris.filter(p => p.status === 'lost').length;

  // Bandeau cagnotte : dégradé bleu EPCR → or
  const bandeauStyle = {
    background: `linear-gradient(to right, ${HCUP_BLEU}, ${HCUP_OR})`
  };

  return (
    <div className="space-y-3">

      {/* BANDEAU CAGNOTTE */}
      <div className="rounded-lg p-4 shadow-lg" style={bandeauStyle}>
        <div className="flex items-center justify-between">
          <button
            onClick={() => window.location.href = '/ma-cagnotte'}
            className="flex items-center gap-3 bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg transition-colors backdrop-blur-sm"
          >
            <Coins className="w-8 h-8 text-white" />
            <div>
              <p className="text-white text-xs font-medium">Ma cagnotte</p>
              <p className="text-white text-3xl font-bold">{userCredits?.credits || 0}</p>
            </div>
          </button>

          <button
            onClick={() => window.location.href = '/ma-cagnotte'}
            className="text-right bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg transition-colors backdrop-blur-sm"
          >
            <p className="text-white/80 text-xs">Total gagné</p>
            <p className="text-white text-xl font-bold flex items-center gap-1 justify-end">
              <TrendingUp className="w-4 h-4" />
              {userCredits?.totalWonFromBets || 0}
            </p>
          </button>
        </div>
      </div>

      {/* Badge championnat HCup */}
      <div
        className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg w-fit mx-auto"
        style={{ backgroundColor: HCUP_BLEU }}
      >
        <Globe className="w-4 h-4" style={{ color: HCUP_OR }} />
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: HCUP_OR }}>
          Paris Champions Cup
        </span>
      </div>

      {/* STATS PARIS AVEC FILTRES */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => setFilter('pending')}
          className={`rounded-lg shadow-sm p-3 text-center border transition-all ${
            filter === 'pending'
              ? 'bg-orange-500 border-orange-600 ring-2 ring-orange-300'
              : 'bg-white border-rugby-gray hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-center gap-1 mb-1">
            <Clock className={`w-4 h-4 ${filter === 'pending' ? 'text-white' : 'text-orange-500'}`} />
            <p className={`text-xl font-bold ${filter === 'pending' ? 'text-white' : 'text-orange-500'}`}>
              {parisPending}
            </p>
          </div>
          <p className={`text-[10px] ${filter === 'pending' ? 'text-white' : 'text-gray-600'}`}>En cours</p>
        </button>

        <button
          onClick={() => setFilter('won')}
          className={`rounded-lg shadow-sm p-3 text-center border transition-all ${
            filter === 'won'
              ? 'bg-green-600 border-green-700 ring-2 ring-green-300'
              : 'bg-white border-rugby-gray hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-center gap-1 mb-1">
            <Trophy className={`w-4 h-4 ${filter === 'won' ? 'text-white' : 'text-green-600'}`} />
            <p className={`text-xl font-bold ${filter === 'won' ? 'text-white' : 'text-green-600'}`}>
              {parisWon}
            </p>
          </div>
          <p className={`text-[10px] ${filter === 'won' ? 'text-white' : 'text-gray-600'}`}>Gagnés</p>
        </button>

        <button
          onClick={() => setFilter('lost')}
          className={`rounded-lg shadow-sm p-3 text-center border transition-all ${
            filter === 'lost'
              ? 'bg-red-600 border-red-700 ring-2 ring-red-300'
              : 'bg-white border-rugby-gray hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingDown className={`w-4 h-4 ${filter === 'lost' ? 'text-white' : 'text-red-600'}`} />
            <p className={`text-xl font-bold ${filter === 'lost' ? 'text-white' : 'text-red-600'}`}>
              {parisLost}
            </p>
          </div>
          <p className={`text-[10px] ${filter === 'lost' ? 'text-white' : 'text-gray-600'}`}>Perdus</p>
        </button>
      </div>

      {/* Liste des paris */}
      {parisFiltered.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-6 text-center border border-rugby-gray">
          <p className="text-gray-500">
            {filter === 'pending' && 'Aucun pari Champions Cup en cours'}
            {filter === 'won' && 'Aucun pari gagné'}
            {filter === 'lost' && 'Aucun pari perdu'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {parisFiltered.map(bet => {
            // Récupérer les équipes depuis bet (vue detailed les expose directement)
            const teamDom = bet.equipe_domicile ? getTeamData(bet.equipe_domicile) : null;
            const teamExt = bet.equipe_exterieure ? getTeamData(bet.equipe_exterieure) : null;

            const potentialWin = Math.floor(bet.stake * (bet.odds || 1));
            const isWon = bet.status === 'won';
            const isPending = bet.status === 'pending';
            const isLost = bet.status === 'lost';

            // Détection phase finale (pour afficher info prolongation)
            const isPhaseFinale = ['8e de finale', 'Quart de finale', 'Demi-finale', 'Finale'].includes(bet.round);
            const hasProlongation = bet.prolongation === true;

            return (
              <div
                key={bet.id}
                ref={el => {
                  if (el && !betRefs.current[bet.match_id]) {
                    betRefs.current[bet.match_id] = el;
                  }
                }}
                className={`bg-white rounded-xl shadow-md border-2 hover:shadow-lg transition-all duration-300 overflow-hidden ${
                  isPending ? 'border-orange-400' :
                  isWon ? 'border-green-500' : 'border-red-500'
                }`}
              >
                {/* Header */}
                <div className={`px-4 py-2 flex items-center justify-between ${
                  isPending ? 'bg-orange-50' :
                  isWon ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  <div className="flex items-center gap-2">
                    {isPending && <Clock className="w-4 h-4 text-orange-600" />}
                    {isWon && <Trophy className="w-4 h-4 text-green-600" />}
                    {isLost && <TrendingDown className="w-4 h-4 text-red-600" />}

                    <span className={`text-xs font-bold uppercase ${
                      isPending ? 'text-orange-700' :
                      isWon ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {isPending && 'En cours'}
                      {isWon && 'Gagné'}
                      {isLost && 'Perdu'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Badge HCup */}
                    <span
                      className="px-2 py-1 rounded-full text-[10px] font-bold"
                      style={{ backgroundColor: HCUP_BLEU, color: HCUP_OR }}
                    >
                      ⭐ C.CUP
                    </span>
                    {/* Badge round si phase finale */}
                    {isPhaseFinale && (
                      <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                        {bet.round}
                      </span>
                    )}
                    <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-white/60">
                      {bet.bet_type === 'WINNER_FT' ? '🎯 Vainqueur' : '🏉 Score exact'}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  {/* Match */}
                  {teamDom && teamExt && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 flex-1">
                          <img
                            src={teamDom.logo}
                            alt={teamDom.name}
                            className="w-8 h-8 object-contain"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                          <span className="font-bold text-gray-900">{teamDom.name}</span>
                        </div>
                        <div className="px-3">
                          <span className="text-gray-400 font-bold">vs</span>
                        </div>
                        <div className="flex items-center gap-2 flex-1 justify-end">
                          <span className="font-bold text-gray-900">{teamExt.name}</span>
                          <img
                            src={teamExt.logo}
                            alt={teamExt.name}
                            className="w-8 h-8 object-contain"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        </div>
                      </div>

                      {/* Scores */}
                      <div className="grid grid-cols-2 gap-2">
                        {/* Pronostic */}
                        <div
                          className="rounded-lg py-2 px-3 border"
                          style={{ backgroundColor: '#E8EFF7', borderColor: HCUP_BLEU }}
                        >
                          <p className="text-[10px] font-semibold mb-1 flex items-center gap-1" style={{ color: HCUP_BLEU }}>
                            <Target className="w-3 h-3" /> Ton pronostic
                          </p>
                          {bet.bet_type === 'WINNER_FT' ? (
                            <p className="text-base font-bold text-center" style={{ color: HCUP_BLEU }}>
                              🎯 {bet.winner_predit === 'DOM' ? (teamDom?.name || 'Domicile')
                                : bet.winner_predit === 'EXT' ? (teamExt?.name || 'Extérieur')
                                : 'Match nul'}
                            </p>
                          ) : (
                            <p className="text-xl font-bold text-center" style={{ color: HCUP_BLEU }}>
                              {bet.score_domicile} - {bet.score_exterieur}
                            </p>
                          )}
                        </div>

                        {/* Score réel - uniquement pour paris résolus */}
                        {!isPending && (() => {
                          // Score à 80' (utilisé pour résoudre les paris)
                          const realHome = bet.score_reel_dom ?? bet.score_dom_80min;
                          const realAway = bet.score_reel_ext ?? bet.score_ext_80min;

                          // Score final (incluant prolongation)
                          const finalHome = bet.score_final_domicile;
                          const finalAway = bet.score_final_exterieur;

                          if (realHome == null || realAway == null) return null;

                          // Calculer le vainqueur réel pour WINNER_FT
                          let realWinnerName = null;
                          if (bet.bet_type === 'WINNER_FT') {
                            if (realHome > realAway) realWinnerName = teamDom?.name || 'Domicile';
                            else if (realAway > realHome) realWinnerName = teamExt?.name || 'Extérieur';
                            else realWinnerName = 'Match nul';
                          }

                          return (
                            <div className={`rounded-lg py-2 px-3 border ${isWon ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                              <p className={`text-[10px] font-semibold mb-1 ${isWon ? 'text-green-700' : 'text-red-700'}`}>
                                {bet.bet_type === 'WINNER_FT' ? 'Résultat' : 'Score réel'}
                              </p>
                              {realWinnerName ? (
                                <>
                                  <p className={`text-base font-bold text-center ${isWon ? 'text-green-900' : 'text-red-900'}`}>
                                    {isWon ? '🎉' : '❌'} {realWinnerName}
                                  </p>
                                  <p className={`text-xs text-center ${isWon ? 'text-green-700' : 'text-red-700'}`}>
                                    ({realHome} - {realAway})
                                  </p>
                                </>
                              ) : (
                                <p className={`text-xl font-bold text-center ${isWon ? 'text-green-900' : 'text-red-900'}`}>
                                  {realHome} - {realAway}
                                </p>
                              )}

                              {/* Mention prolongation si applicable */}
                              {hasProlongation && finalHome != null && finalAway != null && (
                                <p className="text-[9px] text-center italic text-gray-500 mt-1">
                                  Score final : {finalHome} - {finalAway} (a.p.)
                                </p>
                              )}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Mention "pari basé sur 80'" pour paris en cours en phase finale */}
                      {isPending && isPhaseFinale && (
                        <p className="text-[10px] italic text-gray-500 mt-2 text-center">
                          Pari basé sur le score à 80 min, hors prolongation
                        </p>
                      )}
                    </div>
                  )}

                  {/* Mise + Cote */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-blue-50 rounded-lg p-2.5 border border-blue-200">
                      <p className="text-[10px] text-blue-700 font-semibold mb-1">Mise</p>
                      <p className="text-lg font-bold text-blue-900">{bet.stake} 🪙</p>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-2.5 border border-purple-200">
                      <p className="text-[10px] text-purple-700 font-semibold mb-1">Cote</p>
                      <p className="text-lg font-bold text-purple-900">×{bet.odds?.toFixed(2) || '1.00'}</p>
                    </div>
                  </div>

                  {/* Résultat */}
                  {isPending && (
                    <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-3 border-2 border-orange-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-orange-700">Gain potentiel :</span>
                        <span className="text-xl font-bold text-orange-600">{potentialWin} 🪙</span>
                      </div>
                    </div>
                  )}

                  {isWon && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border-2 border-green-300">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-green-700">Gain :</span>
                        <span className="text-xl font-bold text-green-600">+{bet.payout} 🪙</span>
                      </div>
                    </div>
                  )}

                  {isLost && (
                    <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-3 border-2 border-red-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-red-700">Perte :</span>
                        <span className="text-xl font-bold text-red-600">-{bet.stake} 🪙</span>
                      </div>
                    </div>
                  )}

                  {/* Date */}
                  <p className="text-xs text-gray-400 mt-3 text-center">
                    {new Date(bet.placed_at || bet.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                    {' à '}
                    {new Date(bet.placed_at || bet.created_at).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bouton Règlement */}
      <div className="flex justify-center mt-6 mb-4">
        <button
          onClick={() => setShowReglementModal(true)}
          className="flex items-center gap-2 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all"
          style={bandeauStyle}
        >
          <FileText className="w-5 h-5" />
          <span className="font-semibold">Consulter le règlement</span>
        </button>
      </div>

      <ReglementModal
        isOpen={showReglementModal}
        onClose={() => setShowReglementModal(false)}
      />
    </div>
  );
}
