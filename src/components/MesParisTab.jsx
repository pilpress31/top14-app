// ============================================
// MES PARIS
// Support Top 14 et Pro D2
// ============================================

import { useState, useEffect, useRef } from 'react';
import { Coins, TrendingUp, TrendingDown, Trophy, Calendar, Clock, FileText, Target } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import axios from 'axios';
import { getTeamData } from '../utils/teams';
import ReglementModal from './ReglementModal';
import PartagePronostic from './PartagePronostic';
import { useLocation } from 'react-router-dom';
import { useRealtimeSync } from '../hooks/useRealtimeSync';
import { useChampionnat } from '../contexts/ChampionnatContext';

const API_BASE = 'https://top14-api-production.up.railway.app';

export default function MesParisTab() {
  const { isD2 } = useChampionnat();

  const location = useLocation();
  const [userCredits, setUserCredits] = useState(null);
  const [paris, setParis] = useState([]);
  const [pronos, setPronos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [showReglementModal, setShowReglementModal] = useState(false);
  const [matchResults, setMatchResults] = useState({});

  const [targetMatchId, setTargetMatchId] = useState(null);
  const betRefs = useRef({});

  // Ref pour capturer isD2 dans les closures async
  const isD2Ref = useRef(isD2);
  useEffect(() => { isD2Ref.current = isD2; }, [isD2]);

  const extractTeamsFromMatchId = (matchId) => {
    if (!matchId) return { home: null, away: null };
    const parts = matchId.split('_');
    if (parts.length < 4) return { home: null, away: null };
    const teams = parts.slice(2).join('_');
    const possibleTeams = teams.split('_');
    for (let i = 1; i < possibleTeams.length; i++) {
      const testHome = possibleTeams.slice(0, i).join(' ');
      const testAway = possibleTeams.slice(i).join(' ');
      const homeData = getTeamData(testHome);
      const awayData = getTeamData(testAway);
      if (homeData?.logo !== '/logos/default.svg' && awayData?.logo !== '/logos/default.svg') {
        return { home: homeData, away: awayData };
      }
    }
    return { home: null, away: null };
  };

  // ✅ Realtime selon championnat
  useRealtimeSync([
    { table: isD2 ? 'user_bets_d2' : 'user_bets', onUpdate: () => loadData() },
    { table: 'user_credits', onUpdate: () => loadData() },
    ...(isD2
      ? [{ table: 'match_cotes_d2', onUpdate: () => loadData() }]
      : [{ table: 'matchs_results', onUpdate: () => loadData() }]
    ),
  ]);

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isD2]);

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
          element.classList.add('ring-4', 'ring-blue-500', 'ring-offset-2', 'scale-105', 'shadow-2xl');
          setTimeout(() => {
            element.classList.remove('ring-4', 'ring-blue-500', 'ring-offset-2', 'scale-105', 'shadow-2xl');
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

      const useD2 = isD2Ref.current;

      // Crédits + total gagné GLOBAL (Top 14 + Pro D2) — indépendant du championnat affiché
      try {
        const creditsResponse = await axios.get(`${API_BASE}/api/user/credits`, {
          headers: { 'x-user-id': user.id }
        });

        // Agrégation totale des gains sur les deux championnats
        const [{ data: wonTop14 }, { data: wonD2 }] = await Promise.all([
          supabase.from('user_bets').select('payout').eq('user_id', user.id).eq('status', 'won'),
          supabase.from('user_bets_d2').select('payout').eq('user_id', user.id).eq('status', 'won'),
        ]);

        const totalWonFromBets =
          (wonTop14 || []).reduce((s, b) => s + (b.payout || 0), 0) +
          (wonD2 || []).reduce((s, b) => s + (b.payout || 0), 0);

        setUserCredits({ ...creditsResponse.data, totalWonFromBets });
      } catch {
        setUserCredits({ credits: 1000, total_earned: 0, total_spent: 0, totalWonFromBets: 0 });
      }

      // ✅ Paris selon championnat
      const parisUrl = useD2
        ? `${API_BASE}/api/d2/user/bets/detailed`
        : `${API_BASE}/api/user/bets/detailed`;

      try {
        const parisResponse = await axios.get(parisUrl, {
          headers: { 'x-user-id': user.id }
        });
        setParis(parisResponse.data.bets || []);
      } catch (error) {
        console.error('Erreur chargement paris:', error);
        setParis([]);
      }

      if (!useD2) {
        // Pronos Top 14 (pour récupérer noms d'équipes si nécessaire)
        const { data: pronosData, error: pronosError } = await supabase
          .from('user_pronos_view')
          .select('*')
          .eq('user_id', user.id)
          .order('match_date', { ascending: true });
        if (!pronosError) setPronos(pronosData || []);

        // Scores réels Top 14 — on charge seulement les matchs terminés pour éviter la limite de 1000 lignes
        const { data: resultsData } = await supabase
          .from('matchs_results')
          .select('id, score_domicile, score_exterieur, score_ht_domicile, score_ht_exterieur')
          .not('score_domicile', 'is', null);
        if (resultsData) {
          const resultsMap = {};
          resultsData.forEach(r => { resultsMap[r.id] = r; });
          setMatchResults(resultsMap);
        }
      } else {
        // Pro D2 : on ne charge plus matchResults depuis match_cotes_d2
        // Les scores réels viennent directement de l'endpoint /api/d2/user/bets/detailed
        // (fallback sur bet.score_reel_dom/ext dans l'affichage)
        setPronos([]);
        setMatchResults({});
      }

    } catch (error) {
      console.error('❌ Erreur globale chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-rugby-gold"></div>
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

  // ⚠️ totalWonFromBets est chargé dans userCredits (agrégé Top14 + D2)
  // Le calcul ci-dessous n'est PAS utilisé pour le bandeau cagnotte — laissé ici si besoin ailleurs
  // const totalWonFromBets = paris.filter(p => p.status === 'won').reduce((sum, p) => sum + (p.payout || 0), 0);

  // Couleurs selon championnat
  const bandeauBg = isD2
    ? 'bg-gradient-to-r from-[#00174D] to-[#97C1FE]'
    : 'bg-gradient-to-r from-rugby-gold to-rugby-bronze';

  return (
    <div className="space-y-3">

      {/* BANDEAU CAGNOTTE */}
      <div className={`${bandeauBg} rounded-lg p-4 shadow-lg`}>
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

      {/* Badge championnat en mode D2 */}
      {isD2 && (
        <div className="flex items-center justify-center gap-2 px-4 py-2 bg-[#00174D] rounded-lg w-fit mx-auto">
          <span className="text-xs font-bold text-[#C0C0C0] uppercase tracking-wide">🏉 Paris Pro D2</span>
        </div>
      )}

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
            {filter === 'pending' && (isD2 ? 'Aucun pari Pro D2 en cours' : 'Aucun pari en cours')}
            {filter === 'won' && 'Aucun pari gagné'}
            {filter === 'lost' && 'Aucun pari perdu'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {parisFiltered.map(bet => {
            // ✅ Récupération des équipes :
            //    - En Top 14 : d'abord via user_pronos_view (pronos), fallback extraction match_id
            //    - En Pro D2 : directement depuis bet.equipe_domicile/exterieure (vue detailed)
            let teamDom = null;
            let teamExt = null;

            if (isD2) {
              // Vue user_bets_d2_detailed expose equipe_domicile et equipe_exterieure
              teamDom = bet.equipe_domicile ? getTeamData(bet.equipe_domicile) : null;
              teamExt = bet.equipe_exterieure ? getTeamData(bet.equipe_exterieure) : null;
            } else {
              const prono = pronos.find(p => p.match_id === bet.match_id);
              teamDom = prono ? getTeamData(prono.equipe_domicile) : null;
              teamExt = prono ? getTeamData(prono.equipe_exterieure) : null;
            }

            // Fallback : extraction depuis le match_id
            if (!teamDom || !teamExt) {
              const extracted = extractTeamsFromMatchId(bet.match_id);
              teamDom = teamDom || extracted.home;
              teamExt = teamExt || extracted.away;
            }

            const potentialWin = Math.floor(bet.stake * (bet.odds || 1));
            const isWon = bet.status === 'won';
            const isPending = bet.status === 'pending';
            const isLost = bet.status === 'lost';

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
                    {/* Badge Pro D2 uniquement en D2 */}
                    {isD2 && (
                      <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-[#00174D] text-[#C0C0C0]">
                        🏉 Pro D2
                      </span>
                    )}
                    {/* Badge Barrage / Accession */}
                    {isD2 && bet.round && bet.round !== 'Journée' && (
                      <span className="px-2 py-1 rounded-full text-[10px] font-bold"
                        style={bet.round === 'Accession'
                          ? { backgroundColor: '#7c3aed', color: '#fff' }
                          : { backgroundColor: '#00174D', color: '#97C1FE' }}>
                        {bet.round === 'Accession' ? '⚡ Accession' : '🏆 Barrage'}
                      </span>
                    )}
                    <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-white/60">
                      {bet.bet_type === 'MT' ? '⏱️ Score MT'
                        : bet.bet_type === 'WINNER_FT' ? '🎯 Vainqueur FT'
                        : bet.bet_type === 'WINNER_MT' ? '🎯 Vainqueur MT'
                        : '🏉 Score FT'}
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
                        <div className="bg-blue-50 rounded-lg py-2 px-3 border border-blue-200">
                          <p className="text-[10px] text-blue-700 font-semibold mb-1 flex items-center gap-1">
                            <Target className="w-3 h-3" /> Ton pronostic
                          </p>
                          {/* ✅ Fix : WINNER_FT et WINNER_MT affichent le vainqueur prédit */}
                          {(bet.bet_type === 'WINNER_FT' || bet.bet_type === 'WINNER_MT') ? (
                            <p className="text-base font-bold text-blue-900 text-center">
                              🎯 {bet.winner_predit === 'domicile' ? (teamDom?.name || 'Domicile')
                                : bet.winner_predit === 'exterieur' ? (teamExt?.name || 'Extérieur')
                                : 'Match nul'}
                            </p>
                          ) : (
                            <p className="text-xl font-bold text-blue-900 text-center">
                              {bet.score_domicile} - {bet.score_exterieur}
                            </p>
                          )}
                          {/* ✅ Badge FT / MT sous le pronostic — demande users */}
                          <div className="flex justify-center mt-1">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              bet.bet_type === 'MT' || bet.bet_type === 'WINNER_MT'
                                ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                : 'bg-amber-100 text-amber-700 border border-amber-200'
                            }`}>
                              {bet.bet_type === 'MT' || bet.bet_type === 'WINNER_MT' ? '⏱ MT' : '🏉 FT'}
                            </span>
                          </div>
                        </div>
                        {/* Score réel - uniquement pour paris résolus */}
                        {!isPending && (() => {
                          const result = matchResults[bet.match_id];
                          const matchData = result || bet.matches;
                          const isPariMT = bet.bet_type === 'MT' || bet.bet_type === 'WINNER_MT';

                          // En Top 14 : on lit depuis matchResults
                          // En Pro D2 : on lit directement bet.score_reel_dom/ext (renvoyé par l'endpoint)
                          let realHome, realAway;

                          // Score plein temps (toujours calculé : sert de score final
                          // secondaire pour les paris mi-temps)
                          const ftHome = isD2
                            ? (bet.score_reel_dom ?? matchData?.score_domicile)
                            : (matchData?.score_domicile ?? matchData?.score_home);
                          const ftAway = isD2
                            ? (bet.score_reel_ext ?? matchData?.score_exterieur)
                            : (matchData?.score_exterieur ?? matchData?.score_away);

                          if (isD2) {
                            realHome = ftHome;
                            realAway = ftAway;
                          } else if (isPariMT) {
                            realHome = matchData?.score_ht_domicile ?? matchData?.score_ht_home;
                            realAway = matchData?.score_ht_exterieur ?? matchData?.score_ht_away;
                          } else {
                            realHome = ftHome;
                            realAway = ftAway;
                          }

                          if (realHome == null || realAway == null) return null;

                          // Pour les paris WINNER_FT et WINNER_MT, calculer et afficher le vrai vainqueur
                          let realWinnerName = null;
                          if (bet.bet_type === 'WINNER_FT' || bet.bet_type === 'WINNER_MT') {
                            if (realHome > realAway) realWinnerName = teamDom?.name || 'Domicile';
                            else if (realAway > realHome) realWinnerName = teamExt?.name || 'Extérieur';
                            else realWinnerName = 'Match nul';
                          }

                          // Pari mi-temps : on affiche le score final en complément (plus petit)
                          const showFinal = isPariMT && ftHome != null && ftAway != null;

                          return (
                            <div className={`rounded-lg py-2 px-3 border ${isWon ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                              <p className={`text-[10px] font-semibold mb-1 ${isWon ? 'text-green-700' : 'text-red-700'}`}>
                                {(bet.bet_type === 'WINNER_FT' || bet.bet_type === 'WINNER_MT') ? 'Résultat' : 'Score réel'}
                                {isPariMT && <span className="font-normal"> (mi-temps)</span>}
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
                              {showFinal && (
                                <p className="text-[10px] text-gray-500 text-center mt-1">
                                  Score final : {ftHome} - {ftAway}
                                </p>
                              )}
                            </div>
                          );
                        })()}
                      </div>
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
                  {isPending && teamDom && teamExt && (
                    <PartagePronostic
                      equipeDomicile={isD2
                        ? bet.equipe_domicile
                        : pronos.find(p => p.match_id === bet.match_id)?.equipe_domicile}
                      equipeExterieure={isD2
                        ? bet.equipe_exterieure
                        : pronos.find(p => p.match_id === bet.match_id)?.equipe_exterieure}
                      championnat={isD2 ? 'prod2' : 'top14'}
                      mode="perso"
                      scoreDom={bet.score_domicile}
                      scoreExt={bet.score_exterieur}
                      betType={bet.bet_type}
                      winnerPredit={bet.winner_predit}
                    />
                  )}
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
          className={`flex items-center gap-2 ${bandeauBg} text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all`}
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
