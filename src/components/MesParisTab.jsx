import { useState, useEffect, useRef } from 'react';
import { Coins, TrendingUp, TrendingDown, Trophy, Calendar, Clock, FileText, Target } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import axios from 'axios';
import { getTeamData } from '../utils/teams';
import ReglementModal from './ReglementModal';
import { useLocation } from 'react-router-dom';

export default function MesParisTab() {
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
      
      if (homeData?.logo !== '/logos/default.svg' && 
          awayData?.logo !== '/logos/default.svg') {
        return { home: homeData, away: awayData };
      }
    }
    
    return { home: null, away: null };
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const matchIdFromState = location.state?.scrollToMatchId;
    const urlParams = new URLSearchParams(window.location.search);
    const matchIdFromUrl = urlParams.get('scrollToMatchId');
    const matchId = matchIdFromState || matchIdFromUrl;

    if (matchId && paris.length > 0) {
      const targetBet = paris.find(bet => bet.match_id === matchId);
      
      if (targetBet) {
        setTargetMatchId(matchId);
        
        if (targetBet.status === 'pending') {
          setFilter('pending');
        } else if (targetBet.status === 'won') {
          setFilter('won');
        } else if (targetBet.status === 'lost') {
          setFilter('lost');
        }
      }

      if (window.history?.replaceState) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [location.state, paris]);

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
      }, 300);
    }
  }, [filter, targetMatchId]);

  const loadData = async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      try {
        const creditsResponse = await axios.get('https://top14-api-production.up.railway.app/api/user/credits', {
          headers: { 'x-user-id': user.id }
        });
        setUserCredits(creditsResponse.data);
      } catch (error) {
        setUserCredits({ credits: 1000, total_earned: 0, total_spent: 0 });
      }

      try {
        const parisResponse = await axios.get('https://top14-api-production.up.railway.app/api/user/bets/detailed', {
          headers: { 'x-user-id': user.id }
        });
        const parisList = parisResponse.data.bets || [];
        setParis(parisList);
      } catch (error) {
        setParis([]);
      }

      const { data: pronosData, error: pronosError } = await supabase
        .from('user_pronos_view')
        .select('*')
        .eq('user_id', user.id)
        .order('match_date', { ascending: true });

      if (!pronosError) {
        setPronos(pronosData || []);
      }

      // ✅ Charger les scores réels depuis matchs_results
      const { data: resultsData } = await supabase
        .from('matchs_results')
        .select('id, score_domicile, score_exterieur, score_ht_domicile, score_ht_exterieur');
      
      if (resultsData) {
        const resultsMap = {};
        resultsData.forEach(r => { resultsMap[r.id] = r; });
        setMatchResults(resultsMap);
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

  const parisPending = paris.filter(b => b.status === 'pending').length;
  const parisWon = paris.filter(b => b.status === 'won').length;
  const parisLost = paris.filter(b => b.status === 'lost').length;

  const totalWonFromBets = paris
    .filter(p => p.status === 'won')
    .reduce((sum, p) => sum + p.payout, 0);


  return (
    <div className="space-y-3">
      
      {/* BANDEAU CAGNOTTE */}
      <div className="bg-gradient-to-r from-rugby-gold to-rugby-bronze rounded-lg p-4 shadow-lg">
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
              {totalWonFromBets}
            </p>
          </button>
        </div>
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
          <p className={`text-[10px] ${filter === 'pending' ? 'text-white' : 'text-gray-600'}`}>
            En cours
          </p>
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
          <p className={`text-[10px] ${filter === 'won' ? 'text-white' : 'text-gray-600'}`}>
            Gagnés
          </p>
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
          <p className={`text-[10px] ${filter === 'lost' ? 'text-white' : 'text-gray-600'}`}>
            Perdus
          </p>
        </button>
      </div>

      {/* Liste des paris */}
      {parisFiltered.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-6 text-center border border-rugby-gray">
          <p className="text-gray-500">
            {filter === 'pending' && 'Aucun pari en cours'}
            {filter === 'won' && 'Aucun pari gagné'}
            {filter === 'lost' && 'Aucun pari perdu'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {parisFiltered.map(bet => {
            const prono = pronos.find(p => p.match_id === bet.match_id);
            let teamDom = prono ? getTeamData(prono.equipe_domicile) : null;
            let teamExt = prono ? getTeamData(prono.equipe_exterieure) : null;
            
            if (!teamDom || !teamExt) {
              const extracted = extractTeamsFromMatchId(bet.match_id);
              teamDom = extracted.home;
              teamExt = extracted.away;
            }

            const potentialWin = Math.floor(bet.stake * (bet.odds || 1));
            const isWon = bet.status === 'won';
            const isPending = bet.status === 'pending';
            const isLost = bet.status === 'lost';

            return (
              <div 
                key={bet.id}
                ref={el => betRefs.current[bet.match_id] = el}
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
                  
                  <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-white/60">
                    {bet.bet_type === 'FT' ? '🏉 Temps plein' : '⏱️ Mi-temps'}
                  </span>
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
                          <p className="text-xl font-bold text-blue-900 text-center">
                            {bet.score_domicile} - {bet.score_exterieur}
                          </p>
                        </div>
                        {/* Score réel - uniquement pour paris résolus */}
                        {!isPending && (() => {
                          const result = matchResults[bet.match_id];
                          // Fallback : utiliser les scores depuis bet.matches si matchResults vide
                          const matchData = result || bet.matches;
                          if (!matchData) return null;
                          const realHome = bet.bet_type === 'MT' 
                            ? (matchData.score_ht_domicile ?? matchData.score_ht_home) 
                            : (matchData.score_domicile ?? matchData.score_home);
                          const realAway = bet.bet_type === 'MT' 
                            ? (matchData.score_ht_exterieur ?? matchData.score_ht_away) 
                            : (matchData.score_exterieur ?? matchData.score_away);
                          if (realHome == null || realAway == null) return null;
                          return (
                            <div className={`rounded-lg py-2 px-3 border ${isWon ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                              <p className={`text-[10px] font-semibold mb-1 ${isWon ? 'text-green-700' : 'text-red-700'}`}>
                                Score réel
                              </p>
                              <p className={`text-xl font-bold text-center ${isWon ? 'text-green-900' : 'text-red-900'}`}>
                                {realHome} - {realAway}
                              </p>
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
                    {new Date(bet.placed_at).toLocaleDateString('fr-FR', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                    {' à '}
                    {new Date(bet.placed_at).toLocaleTimeString('fr-FR', { 
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
          className="flex items-center gap-2 bg-gradient-to-r from-rugby-gold to-rugby-bronze text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all"
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