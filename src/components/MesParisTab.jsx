import { useState, useEffect, useRef, useMemo } from 'react';
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

  // ✅ Refs pour chaque pari
  const betRefs = useRef({});

  useEffect(() => {
    loadData();
  }, []);

  // ✅ Scroll auto vers un pari spécifique
  useEffect(() => {
    if (location.state?.scrollToMatchId && paris.length > 0) {
      const matchId = location.state.scrollToMatchId;  // ✅ Chercher par match_id
      
      // ✅ Trouver le bet qui a ce match_id
      const targetBet = paris.find(bet => bet.match_id === matchId);
      
      if (targetBet) {
        // Attendre que le DOM soit mis à jour
        setTimeout(() => {
          const element = betRefs.current[targetBet.match_id];  // ✅ Utiliser match_id
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Effet de highlight temporaire
            element.classList.add('ring-4', 'ring-blue-500', 'ring-offset-2');
            setTimeout(() => {
              element.classList.remove('ring-4', 'ring-blue-500', 'ring-offset-2');
            }, 2000);
          }
        }, 300);
      }

      // Nettoyer le state
      window.history.replaceState({}, document.title);
    }
  }, [location.state, paris]);

  const loadData = async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        console.log('❌ Pas de user connecté');
        return;
      }

      console.log('✅ User ID:', user.id);

      // Charger les crédits
      try {
        const creditsResponse = await axios.get('https://top14-api-production.up.railway.app/api/user/credits', {
          headers: { 'x-user-id': user.id }
        });
        console.log('✅ Crédits chargés:', creditsResponse.data);
        setUserCredits(creditsResponse.data);
      } catch (error) {
        console.log('⚠️ Crédits non disponibles:', error.message);
        setUserCredits({ credits: 1000, total_earned: 0, total_spent: 0 });
      }

      // Charger les paris
      try {
        const parisResponse = await axios.get('https://top14-api-production.up.railway.app/api/user/bets', {
          headers: { 'x-user-id': user.id }
        });
        console.log('✅ Réponse brute API:', parisResponse.data);
        
        const parisList = Array.isArray(parisResponse.data) 
          ? parisResponse.data 
          : (parisResponse.data.bets || []);
        
        console.log(`📊 Nombre de paris trouvés: ${parisList.length}`);
        console.log('📋 Liste paris:', parisList);
        setParis(parisList);
      } catch (error) {
        console.error('❌ Erreur chargement paris:', error);
        console.log('❌ Détails:', error.response?.data || error.message);
        setParis([]);
      }

      // Charger les pronos
      const { data: pronosData, error: pronosError } = await supabase
        .from('user_pronos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!pronosError) {
        console.log(`📊 Nombre de pronos trouvés: ${pronosData?.length || 0}`);
        setPronos(pronosData || []);
      } else {
        console.error('❌ Erreur chargement pronos:', pronosError);
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

  const parisFiltered = (paris || []).filter(bet => {
    if (filter === 'pending') return bet.status === 'pending';
    if (filter === 'won') return bet.status === 'won';
    if (filter === 'lost') return bet.status === 'lost';
    return true;
  });

  const parisPending = useMemo(() => (paris || []).filter(b => b.status === "pending").length, [paris]);
  const parisWon = useMemo(() => (paris || []).filter(b => b.status === "won").length, [paris]);
  const parisLost = useMemo(() => (paris || []).filter(b => b.status === "lost").length, [paris]);

  console.log('📊 Stats paris:', { total: (paris || []).length, pending: parisPending, won: parisWon, lost: parisLost });

  return (
    <div className="space-y-4">
      {/* Dashboard cagnotte - ✅ ICÔNE CLIQUABLE */}
      <div className="bg-gradient-to-r from-rugby-gold to-rugby-bronze rounded-lg p-4 shadow-lg">
        <div className="flex items-center justify-between">
          {/* ✅ ZONE CLIQUABLE */}
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
            onClick={() => setShowReglementModal(true)}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-lg transition-colors backdrop-blur-sm"
          >
            <FileText className="w-4 h-4" />
            <span className="text-xs font-semibold">Règlement</span>
          </button>

          <div className="text-right">
            <p className="text-white/80 text-xs">Total gagné</p>
            <p className="text-white text-xl font-bold flex items-center gap-1 justify-end">
              <TrendingUp className="w-4 h-4" />
              {userCredits?.total_earned || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Stats paris */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white rounded-lg shadow-sm p-3 text-center border border-rugby-gray">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Clock className="w-4 h-4 text-orange-500" />
            <p className="text-xl font-bold text-orange-500">{parisPending}</p>
          </div>
          <p className="text-[10px] text-gray-600">En cours</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-3 text-center border border-rugby-gray">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Trophy className="w-4 h-4 text-green-600" />
            <p className="text-xl font-bold text-green-600">{parisWon}</p>
          </div>
          <p className="text-[10px] text-gray-600">Gagnés</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-3 text-center border border-rugby-gray">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingDown className="w-4 h-4 text-red-600" />
            <p className="text-xl font-bold text-red-600">{parisLost}</p>
          </div>
          <p className="text-[10px] text-gray-600">Perdus</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setFilter('pending')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
            filter === 'pending'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          En cours ({parisPending})
        </button>
        <button
          onClick={() => setFilter('won')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
            filter === 'won'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Gagnés ({parisWon})
        </button>
        <button
          onClick={() => setFilter('lost')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
            filter === 'lost'
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Perdus ({parisLost})
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
            const teamDom = prono ? getTeamData(prono.equipe_domicile) : null;
            const teamExt = prono ? getTeamData(prono.equipe_exterieure) : null;

            return (
              <div 
                key={bet.id}
                ref={el => betRefs.current[bet.match_id] = el}  // ✅ Ref par match_id
                className="bg-white rounded-lg shadow-sm p-4 border-l-4 hover:shadow-md transition-all"
                style={{
                  borderLeftColor: 
                    bet.status === 'pending' ? '#f97316' : 
                    bet.status === 'won' ? '#16a34a' : '#dc2626'
                }}
              >
                {/* Match */}
                {prono && teamDom && teamExt && (
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

                {/* Infos pari */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-gray-500">Type</p>
                    <p className="font-bold">{bet.bet_type === 'FT' ? '⏱️ Temps plein' : '⏱️ Mi-temps'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Prono</p>
                    <p className="font-bold">{bet.score_domicile}-{bet.score_exterieur}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Mise</p>
                    <p className="font-bold text-rugby-gold">{bet.stake} jetons</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Cote</p>
                    <p className="font-bold">×{bet.odds?.toFixed(2)}</p>
                  </div>
                </div>

                {/* Gain */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  {bet.status === 'pending' && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Gain potentiel:</span>
                      <span className="text-sm font-bold text-green-600">
                        {Math.floor(bet.stake * bet.odds)} jetons
                      </span>
                    </div>
                  )}
                  {bet.status === 'won' && (
                    <div className="flex items-center justify-between bg-green-50 rounded px-2 py-1">
                      <span className="text-xs font-semibold text-green-700">✓ Gagné:</span>
                      <span className="text-sm font-bold text-green-700">
                        +{bet.payout} jetons
                      </span>
                    </div>
                  )}
                  {bet.status === 'lost' && (
                    <div className="flex items-center justify-between bg-red-50 rounded px-2 py-1">
                      <span className="text-xs font-semibold text-red-700">✗ Perdu:</span>
                      <span className="text-sm font-bold text-red-700">
                        -{bet.stake} jetons
                      </span>
                    </div>
                  )}
                </div>

                {/* Date */}
                <div className="mt-2 flex items-center gap-1 text-[10px] text-gray-400">
                  <Calendar className="w-3 h-3" />
                  {new Date(bet.placed_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ReglementModal 
        isOpen={showReglementModal}
        onClose={() => setShowReglementModal(false)}
      />
    </div>
  );
}
