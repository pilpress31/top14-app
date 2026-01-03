import { useState, useEffect, useRef } from 'react';
import { Coins, TrendingUp, TrendingDown, Trophy, Calendar, Clock, FileText } from 'lucide-react';
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
  
  const [targetMatchId, setTargetMatchId] = useState(null);
  const betRefs = useRef({});

  // ✅ FONCTION HELPER : Extraire les noms d'équipes depuis match_id
  const extractTeamsFromMatchId = (matchId) => {
    if (!matchId) return { home: null, away: null };
    
    // Format: 2025-2026_14_EQUIPE_DOMICILE_EQUIPE_EXTERIEURE
    const parts = matchId.split('_');
    if (parts.length < 4) return { home: null, away: null };
    
    const teams = parts.slice(2).join('_');
    const possibleTeams = teams.split('_');
    
    // Essayer toutes les combinaisons pour trouver les 2 équipes
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

      // Charger les crédits
      try {
        const creditsResponse = await axios.get('https://top14-api-production.up.railway.app/api/user/credits', {
          headers: { 'x-user-id': user.id }
        });
        setUserCredits(creditsResponse.data);
      } catch (error) {
        setUserCredits({ credits: 1000, total_earned: 0, total_spent: 0 });
      }

      // Charger les paris
      try {
        const parisResponse = await axios.get('https://top14-api-production.up.railway.app/api/user/bets/detailed', {
          headers: { 'x-user-id': user.id }
        });
        const parisList = parisResponse.data.bets || [];
        setParis(parisList);
      } catch (error) {
        setParis([]);
      }

      // Charger les pronos
      const { data: pronosData, error: pronosError } = await supabase
        .from('user_pronos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!pronosError) {
        setPronos(pronosData || []);
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

  const totalWonFromBets = paris.filter(p => p.status === 'won').reduce((sum, p) => sum + (p.payout || 0), 0);

  return (
    <div className="space-y-3">
      
      {/* BANDEAU AVEC ICÔNE CLIQUABLE */}
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

      {/* ✅ STATS PARIS AVEC FILTRES INTÉGRÉS - SUPPRESSION DU BANDEAU DOUBLON */}
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
            // ✅ Essayer d'abord de charger depuis user_pronos
            const prono = pronos.find(p => p.match_id === bet.match_id);
            let teamDom = prono ? getTeamData(prono.equipe_domicile) : null;
            let teamExt = prono ? getTeamData(prono.equipe_exterieure) : null;
            
            // ✅ Si pas trouvé dans pronos, extraire depuis match_id
            if (!teamDom || !teamExt) {
              const extracted = extractTeamsFromMatchId(bet.match_id);
              teamDom = extracted.home;
              teamExt = extracted.away;
            }

            return (
              <div 
                key={bet.id}
                ref={el => betRefs.current[bet.match_id] = el}
                className="bg-white rounded-lg shadow-sm p-4 border-l-4 hover:shadow-md transition-all duration-300"
                style={{
                  borderLeftColor: 
                    bet.status === 'pending' ? '#f97316' : 
                    bet.status === 'won' ? '#16a34a' : '#dc2626'
                }}
              >
                {/* Match */}
                {teamDom && teamExt && (
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <img 
                        src={teamDom.logo} 
                        alt={teamDom.name} 
                        className="w-6 h-6 object-contain"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                      <span className="text-sm font-bold">{teamDom.name}</span>
                    </div>
                    <span className="text-gray-400 font-semibold text-xs">vs</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{teamExt.name}</span>
                      <img 
                        src={teamExt.logo} 
                        alt={teamExt.name} 
                        className="w-6 h-6 object-contain"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    </div>
                  </div>
                )}

                {/* Détails */}
                <div className="space-y-1 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Type</span>
                    <span>{bet.bet_type === 'FT' ? 'Temps plein' : 'Mi-temps'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Prono</span>
                    <span>{bet.score_domicile}-{bet.score_exterieur}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Mise</span>
                    <span>{bet.stake} jetons</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Cote</span>
                    <span>×{bet.odds?.toFixed(2) || '1.00'}</span>
                  </div>
                  {bet.status === 'pending' && (
                    <div className="flex items-center gap-2 text-orange-600">
                      <span className="font-semibold">Gain potentiel:</span>
                      <span>{Math.floor(bet.stake * (bet.odds || 1))} jetons</span>
                    </div>
                  )}
                  {bet.status === 'won' && (
                    <div className="flex items-center gap-2 text-green-600">
                      <span className="font-semibold">Gagné:</span>
                      <span>+{bet.payout} jetons</span>
                    </div>
                  )}
                  {bet.status === 'lost' && (
                    <div className="flex items-center gap-2 text-red-600">
                      <span className="font-semibold">Perdu:</span>
                      <span>-{bet.stake} jetons</span>
                    </div>
                  )}
                </div>

                {/* Date */}
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(bet.placed_at).toLocaleDateString('fr-FR', { 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric' 
                  })}
                  {', '}
                  {new Date(bet.placed_at).toLocaleTimeString('fr-FR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
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
