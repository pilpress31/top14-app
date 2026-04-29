// ============================================
// PAGE "MES POINTS" — Historique des paris gagnés
// avec cumul des points classement
// Route : /mes-points
// ============================================

import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, ArrowDownUp, Filter, Award, Target, ThumbsUp, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { getTeamData } from '../utils/teams';
import { useRealtimeSync } from '../hooks/useRealtimeSync';

// ─── Helper : déterminer le badge selon les points et le bet_type ───
const getBadgeForBet = (bet) => {
  const points = (bet.points_ft || 0) + (bet.points_mt || 0);
  const isWinnerBet = bet.bet_type === 'WINNER_FT' || bet.bet_type === 'WINNER_MT';

  if (isWinnerBet) {
    return { icon: Target, color: 'text-purple-600 bg-purple-100', label: 'Pari vainqueur' };
  }

  // Paris score classiques (FT/MT)
  if (bet.bet_type === 'FT') {
    if (points === 10) return { icon: Trophy, color: 'text-yellow-600 bg-yellow-100', label: 'Score exact' };
    if (points === 7) return { icon: Award, color: 'text-amber-600 bg-amber-100', label: 'Parfait écart' };
    if (points === 5) return { icon: CheckCircle2, color: 'text-green-600 bg-green-100', label: 'Bon écart' };
    if (points === 3) return { icon: CheckCircle2, color: 'text-blue-600 bg-blue-100', label: 'Bon vainqueur' };
    if (points === 1) return { icon: ThumbsUp, color: 'text-gray-600 bg-gray-100', label: 'Bon vainqueur' };
  }

  if (bet.bet_type === 'MT') {
    if (points === 5) return { icon: Trophy, color: 'text-yellow-600 bg-yellow-100', label: 'Score exact MT' };
    if (points === 3) return { icon: CheckCircle2, color: 'text-green-600 bg-green-100', label: 'Bon écart MT' };
    if (points === 1) return { icon: ThumbsUp, color: 'text-gray-600 bg-gray-100', label: 'Bon vainqueur MT' };
  }

  return { icon: CheckCircle2, color: 'text-gray-600 bg-gray-100', label: 'Pari gagné' };
};

// ─── Helper : extraire la journée depuis le match_id (Top 14 ou D2) ───
const extractJournee = (matchId) => {
  if (!matchId) return null;
  // Top 14 : "2025-2026_22_..."
  const t14 = matchId.match(/^\d{4}-\d{4}_(\d+)_/);
  if (t14) return `J${t14[1]}`;
  // D2 : "2025_2026_J29_..."
  const d2 = matchId.match(/^\d{4}_\d{4}_(J\d+)_/);
  if (d2) return d2[1];
  return null;
};

// ─── Helper : extraire la saison depuis le match_id ───
const extractSaison = (matchId) => {
  if (!matchId) return null;
  // Top 14 : "2025-2026_..." → "2025-2026"
  const t14 = matchId.match(/^(\d{4}-\d{4})_/);
  if (t14) return t14[1];
  // D2 : "2025_2026_..." → "2025-2026"
  const d2 = matchId.match(/^(\d{4})_(\d{4})_/);
  if (d2) return `${d2[1]}-${d2[2]}`;
  return null;
};

// ─── Helper : formater une date courte en français ───
const formatDate = (date) => {
  if (!date) return '?';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export default function MesPoints() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [bets, setBets] = useState([]);
  const [matchsResults, setMatchsResults] = useState({});
  const [matchsResultsD2, setMatchsResultsD2] = useState({});
  const [matchCotesD2, setMatchCotesD2] = useState({});
  const [loading, setLoading] = useState(true);
  const [sortMode, setSortMode] = useState('asc'); // ASC = chronologique (vieux → récent)
  const [championnatFilter, setChampionnatFilter] = useState('all'); // all | top14 | prod2
  const loadingRef = useRef(false);

  // ─── Realtime avec debounce (calque MaCagnotte) ───
  const realtimeDebounceRef = useRef(null);
  const debouncedLoadData = (userId) => {
    if (realtimeDebounceRef.current) clearTimeout(realtimeDebounceRef.current);
    realtimeDebounceRef.current = setTimeout(() => {
      if (userId && !loadingRef.current) loadData(userId);
      realtimeDebounceRef.current = null;
    }, 500);
  };

  useRealtimeSync([
    { table: 'user_bets', onUpdate: () => debouncedLoadData(user?.id) },
    { table: 'user_bets_d2', onUpdate: () => debouncedLoadData(user?.id) },
  ]);

  useEffect(() => {
    return () => {
      if (realtimeDebounceRef.current) clearTimeout(realtimeDebounceRef.current);
    };
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        navigate('/login');
        return;
      }
      setUser(data.user);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    loadData(user.id);
  }, [user]);

  const loadData = async (userId) => {
    try {
      loadingRef.current = true;
      setLoading(true);

      // ─── 1. Paris won Top 14 avec points > 0 ───
      const { data: topBets, error: topErr } = await supabase
        .from('user_bets')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'won')
        .order('result_at', { ascending: true });
      if (topErr) throw topErr;

      // ─── 2. Paris won Pro D2 avec points > 0 ───
      const { data: d2Bets, error: d2Err } = await supabase
        .from('user_bets_d2')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'won')
        .order('resolved_at', { ascending: true });
      if (d2Err) throw d2Err;

      // ─── 3. Charger les résultats de matchs Top 14 (pour score affichage) ───
      const topMatchIds = [...new Set((topBets || []).map(b => b.match_id))];
      let topMatchesMap = {};
      if (topMatchIds.length > 0) {
        const { data: tm } = await supabase
          .from('matchs_results')
          .select('id, equipe_domicile, equipe_exterieure, score_domicile, score_exterieur, score_ht_domicile, score_ht_exterieur, journee, saison, date_match')
          .in('id', topMatchIds);
        topMatchesMap = (tm || []).reduce((acc, m) => ({ ...acc, [m.id]: m }), {});
      }

      // ─── 4. Charger les match_cotes_d2 pour les matchs D2 (pour score affichage) ───
      const d2MatchIds = [...new Set((d2Bets || []).map(b => b.match_id))];
      let d2MatchesMap = {};
      if (d2MatchIds.length > 0) {
        const { data: dm } = await supabase
          .from('match_cotes_d2')
          .select('match_id, equipe_domicile, equipe_exterieure, score_reel_dom, score_reel_ext, journee, saison, date_match')
          .in('match_id', d2MatchIds);
        d2MatchesMap = (dm || []).reduce((acc, m) => ({ ...acc, [m.match_id]: m }), {});
      }

      setMatchsResults(topMatchesMap);
      setMatchCotesD2(d2MatchesMap);

      // ─── 5. Fusionner les paris et garder uniquement ceux avec points > 0 ───
      const allBets = [
        ...(topBets || []).map(b => ({ ...b, championnat: 'top14' })),
        ...(d2Bets || []).map(b => ({ ...b, championnat: 'prod2' })),
      ].filter(b => ((b.points_ft || 0) + (b.points_mt || 0)) > 0);

      // Tri ASC par défaut (date de résolution)
      allBets.sort((a, b) => {
        const dA = new Date(a.result_at || a.resolved_at || a.placed_at || 0);
        const dB = new Date(b.result_at || b.resolved_at || b.placed_at || 0);
        return dA - dB;
      });

      setBets(allBets);
    } catch (err) {
      console.error('Erreur chargement /mes-points:', err);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  };

  // ─── Filtrer par championnat ───
  const filteredBets = useMemo(() => {
    if (championnatFilter === 'all') return bets;
    return bets.filter(b => b.championnat === championnatFilter);
  }, [bets, championnatFilter]);

  // ─── Calculer le cumul (TOUJOURS chronologique ASC) ───
  // puis appliquer le tri d'affichage demandé
  const betsWithCumul = useMemo(() => {
    // Étape 1 : cumul calculé chronologiquement (ASC) — cumul réel
    const sortedAsc = [...filteredBets].sort((a, b) => {
      const dA = new Date(a.result_at || a.resolved_at || a.placed_at || 0);
      const dB = new Date(b.result_at || b.resolved_at || b.placed_at || 0);
      return dA - dB;
    });

    let runningTotal = 0;
    const withCumul = sortedAsc.map(bet => {
      const points = (bet.points_ft || 0) + (bet.points_mt || 0);
      runningTotal += points;
      return { ...bet, _points: points, _cumul: runningTotal };
    });

    // Étape 2 : appliquer le tri d'affichage
    if (sortMode === 'desc') {
      return [...withCumul].reverse();
    }
    return withCumul;
  }, [filteredBets, sortMode]);

  const totalPoints = useMemo(
    () => filteredBets.reduce((sum, b) => sum + ((b.points_ft || 0) + (b.points_mt || 0)), 0),
    [filteredBets]
  );

  // ─── Récupérer les infos d'un match selon le championnat ───
  const getMatchInfo = (bet) => {
    if (bet.championnat === 'prod2') {
      return matchCotesD2[bet.match_id];
    }
    return matchsResults[bet.match_id];
  };

  // ─── Récupérer le score selon le championnat ───
  const getScores = (bet, matchInfo) => {
    if (!matchInfo) return null;
    if (bet.championnat === 'prod2') {
      return {
        dom: matchInfo.score_reel_dom,
        ext: matchInfo.score_reel_ext,
        ht_dom: null,
        ht_ext: null,
      };
    }
    return {
      dom: matchInfo.score_domicile,
      ext: matchInfo.score_exterieur,
      ht_dom: matchInfo.score_ht_domicile,
      ht_ext: matchInfo.score_ht_exterieur,
    };
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header sticky */}
      <div className="sticky top-0 z-40 bg-gradient-to-r from-rugby-gold to-rugby-bronze shadow-md">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Retour"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-white" />
            <h1 className="text-xl font-bold text-white">Mes Points</h1>
          </div>
          <div className="w-10" />
        </div>

        <div className="max-w-md mx-auto px-4 pb-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
            <p className="text-xs text-white/90 font-semibold mb-1">
              Total points
              {championnatFilter !== 'all' && ` — ${championnatFilter === 'top14' ? 'Top 14' : 'Pro D2'}`}
            </p>
            <p className="text-3xl font-bold text-white">{totalPoints}</p>
            <p className="text-xs text-white/80 mt-1">
              {filteredBets.length} pari{filteredBets.length > 1 ? 's' : ''} gagné{filteredBets.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="max-w-md mx-auto px-4 py-3 sticky top-[140px] z-30 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Filtre championnat */}
          <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <button
              onClick={() => setChampionnatFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                championnatFilter === 'all'
                  ? 'bg-rugby-gold text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setChampionnatFilter('top14')}
              className={`px-3 py-1.5 text-xs font-semibold transition-colors border-l border-gray-200 ${
                championnatFilter === 'top14'
                  ? 'bg-rugby-gold text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              🏆 Top 14
            </button>
            <button
              onClick={() => setChampionnatFilter('prod2')}
              className={`px-3 py-1.5 text-xs font-semibold transition-colors border-l border-gray-200 ${
                championnatFilter === 'prod2'
                  ? 'bg-[#00174D] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              🥈 Pro D2
            </button>
          </div>

          {/* Tri inversable */}
          <button
            onClick={() => setSortMode(sortMode === 'asc' ? 'desc' : 'asc')}
            className="flex items-center gap-1 px-3 py-1.5 bg-white rounded-lg shadow-sm border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-100 ml-auto"
            aria-label="Inverser le tri"
          >
            <ArrowDownUp className="w-3.5 h-3.5" />
            {sortMode === 'asc' ? 'Plus ancien' : 'Plus récent'}
          </button>
        </div>
      </div>

      {/* Liste des paris gagnés */}
      <div className="max-w-md mx-auto px-4 py-4 space-y-3">
        {loading && (
          <div className="text-center py-8 text-gray-500">
            Chargement…
          </div>
        )}

        {!loading && betsWithCumul.length === 0 && (
          <div className="bg-white rounded-lg p-8 text-center text-gray-500 shadow-sm">
            <Trophy className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="font-semibold">Aucun pari gagné pour l'instant</p>
            <p className="text-sm mt-1">Vos points apparaîtront ici dès vos premiers paris gagnés.</p>
          </div>
        )}

        {!loading && betsWithCumul.map((bet) => {
          const matchInfo = getMatchInfo(bet);
          const scores = getScores(bet, matchInfo);
          const teamDom = matchInfo ? getTeamData(matchInfo.equipe_domicile) : null;
          const teamExt = matchInfo ? getTeamData(matchInfo.equipe_exterieure) : null;
          const journee = matchInfo?.journee
            ? (typeof matchInfo.journee === 'number' ? `J${matchInfo.journee}` : matchInfo.journee)
            : extractJournee(bet.match_id);
          const saison = matchInfo?.saison || extractSaison(bet.match_id);
          const dateMatch = matchInfo?.date_match || bet.result_at || bet.resolved_at;
          const badge = getBadgeForBet(bet);
          const BadgeIcon = badge.icon;
          const isMT = bet.bet_type === 'MT' || bet.bet_type === 'WINNER_MT';

          return (
            <div
              key={bet.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
            >
              {/* En-tête : journée, saison, date, championnat */}
              <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-gray-700">{journee || '?'}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600">{saison || '?'}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600">{formatDate(dateMatch)}</span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    bet.championnat === 'prod2'
                      ? 'bg-[#00174D] text-white'
                      : 'bg-rugby-gold text-white'
                  }`}
                >
                  {bet.championnat === 'prod2' ? 'Pro D2' : 'Top 14'}
                </span>
              </div>

              {/* Corps : match + score + badge */}
              <div className="p-3">
                {/* Équipes */}
                {matchInfo ? (
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      {teamDom?.logo && (
                        <img
                          src={teamDom.logo}
                          alt={teamDom.name}
                          className="w-5 h-5 object-contain flex-shrink-0"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      )}
                      <span className="text-sm font-semibold text-gray-900 truncate">
                        {teamDom?.name || matchInfo.equipe_domicile}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 px-2 font-mono font-bold text-gray-900">
                      {scores && scores.dom != null && scores.ext != null ? (
                        <>
                          <span>{scores.dom}</span>
                          <span className="text-gray-400">-</span>
                          <span>{scores.ext}</span>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                      <span className="text-sm font-semibold text-gray-900 truncate">
                        {teamExt?.name || matchInfo.equipe_exterieure}
                      </span>
                      {teamExt?.logo && (
                        <img
                          src={teamExt.logo}
                          alt={teamExt.name}
                          className="w-5 h-5 object-contain flex-shrink-0"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mb-2 truncate">
                    {bet.match_id}
                  </p>
                )}

                {/* Score MT en plus si pari MT */}
                {isMT && scores && scores.ht_dom != null && (
                  <p className="text-xs text-gray-500 mb-2 text-center">
                    Mi-temps : {scores.ht_dom}-{scores.ht_ext}
                  </p>
                )}

                {/* Badge + points + cumul */}
                <div className="flex items-center justify-between gap-2 mt-2">
                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold ${badge.color}`}>
                    <BadgeIcon className="w-3.5 h-3.5" />
                    <span>{badge.label}</span>
                    {isMT && bet.bet_type !== 'WINNER_MT' && !badge.label.includes('MT') && <span>(MT)</span>}
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <div className="text-right">
                      <p className="text-[10px] text-gray-500 leading-tight">Points</p>
                      <p className="text-sm font-bold text-rugby-gold">+{bet._points}</p>
                    </div>
                    <div className="text-right border-l border-gray-200 pl-3">
                      <p className="text-[10px] text-gray-500 leading-tight">Cumul</p>
                      <p className="text-sm font-bold text-gray-900">{bet._cumul}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
