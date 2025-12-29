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
  
  // ✅ Stocker le match_id cible pour le scroll après changement d'onglet
  const [targetMatchId, setTargetMatchId] = useState(null);

  // ? Refs pour chaque pari
  const betRefs = useRef({});

  useEffect(() => {
    loadData();
  }, []);

  // ? Scroll auto vers un pari spécifique
  useEffect(() => {
    // ✅ Lire depuis location.state OU depuis les query params de l'URL
    const matchIdFromState = location.state?.scrollToMatchId;
    const urlParams = new URLSearchParams(window.location.search);
    const matchIdFromUrl = urlParams.get('scrollToMatchId');
    const matchId = matchIdFromState || matchIdFromUrl;

    if (matchId && paris.length > 0) {
      console.log('🎯 Navigation vers match_id:', matchId);
      
      // ? Trouver le bet qui a ce match_id
      const targetBet = paris.find(bet => bet.match_id === matchId);
      
      if (targetBet) {
        console.log('✅ Pari trouvé:', targetBet);
        console.log('📊 Status du pari:', targetBet.status);
        
        // ✅ Stocker le match_id pour le scroll après le changement d'onglet
        setTargetMatchId(matchId);
        
        // ? Changer l'onglet selon le status du pari
        if (targetBet.status === 'pending') {
          console.log('🔄 Changement vers onglet: En cours');
          setFilter('pending');
        } else if (targetBet.status === 'won') {
          console.log('🔄 Changement vers onglet: Gagnés');
          setFilter('won');
        } else if (targetBet.status === 'lost') {
          console.log('🔄 Changement vers onglet: Perdus');
          setFilter('lost');
        }
      } else {
        console.log('❌ Aucun pari trouvé pour match_id:', matchId);
        console.log('❌ Paris disponibles:', paris.map(p => p.match_id));
      }

      // Nettoyer le state ET l'URL
      if (window.history?.replaceState) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [location.state, paris]);

  // ✅ Nouveau useEffect pour gérer le scroll APRÈS le changement d'onglet
  useEffect(() => {
    if (targetMatchId && paris.length > 0) {
      console.log('🎯 Tentative de scroll vers:', targetMatchId);
      
      // Attendre que React ait re-rendu la liste avec le bon filtre
      setTimeout(() => {
        const element = betRefs.current[targetMatchId];
        console.log('🔍 Recherche élément pour match_id:', targetMatchId);
        console.log('🔍 Élément trouvé:', element);
        console.log('🔍 Tous les refs disponibles:', Object.keys(betRefs.current));
        
        if (element) {
          console.log('📜 Scroll vers l\'élément');
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // ✅ Effet de highlight temporaire
          element.classList.add('ring-4', 'ring-blue-500', 'ring-offset-2', 'scale-105', 'shadow-2xl');
          console.log('✨ Classes ajoutées pour highlight');
          
          setTimeout(() => {
            element.classList.remove('ring-4', 'ring-blue-500', 'ring-offset-2', 'scale-105', 'shadow-2xl');
            console.log('🔄 Classes retirées');
          }, 3000);
          
          // ✅ Nettoyer targetMatchId après le scroll
          setTargetMatchId(null);
        } else {
          console.log('❌ Élément non trouvé, nouvelle tentative dans 500ms');
          // Réessayer une fois au cas où le DOM n'est pas encore prêt
          setTimeout(() => {
            const retryElement = betRefs.current[targetMatchId];
            if (retryElement) {
              retryElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
              retryElement.classList.add('ring-4', 'ring-blue-500', 'ring-offset-2', 'scale-105', 'shadow-2xl');
              setTimeout(() => {
                retryElement.classList.remove('ring-4', 'ring-blue-500', 'ring-offset-2', 'scale-105', 'shadow-2xl');
              }, 3000);
            }
            setTargetMatchId(null);
          }, 500);
        }
      }, 300); // Délai court car on attend déjà le changement de filter
    }
  }, [targetMatchId, filter, paris]); // ✅ Se déclenche quand filter change

  const loadData = async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        console.log('? Pas de user connecté');
        return;
      }

      console.log('? User ID:', user.id);

      // Charger les crédits
      try {
        const creditsResponse = await axios.get('https://top14-api-production.up.railway.app/api/user/credits', {
          headers: { 'x-user-id': user.id }
        });
        console.log('? Crédits chargés:', creditsResponse.data);
        setUserCredits(creditsResponse.data);
      } catch (error) {
        console.log('?? Crédits non disponibles:', error.message);
        setUserCredits({ credits: 1000, total_earned: 0, total_spent: 0 });
      }

      // Charger les paris
      try {
        const parisResponse = await axios.get('https://top14-api-production.up.railway.app/api/user/bets', {
          headers: { 'x-user-id': user.id }
        });
        console.log('? Réponse brute API:', parisResponse.data);
        
        const parisList = Array.isArray(parisResponse.data) 
          ? parisResponse.data 
          : (parisResponse.data.bets || []);
        
        console.log(`?? Nombre de paris trouvés: ${parisList.length}`);
        console.log('?? Liste paris:', parisList);
        setParis(parisList);
      } catch (error) {
        console.error('? Erreur chargement paris:', error);
        console.log('? Détails:', error.response?.data || error.message);
        setParis([]);
      }

      // Charger les pronos
      const { data: pronosData, error: pronosError } = await supabase
        .from('user_pronos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!pronosError) {
        console.log(`?? Nombre de pronos trouvés: ${pronosData?.length || 0}`);
        setPronos(pronosData || []);
      } else {
        console.error('? Erreur chargement pronos:', pronosError);
      }

    } catch (error) {
      console.error('? Erreur globale chargement données:', error);
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

  console.log('?? Stats paris:', { total: paris.length, pending: parisPending, won: parisWon, lost: parisLost });

  return (
    <div className="space-y-4">
      {/* Dashboard cagnotte - ? ICÔNE CLIQUABLE */}
      <div className="bg-gradient-to-r from-rugby-gold to-rugby-bronze rounded-lg p-4 shadow-lg">
        <div className="flex items-center justify-between">
          {/* ? ZONE CLIQUABLE */}
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
                ref={el => betRefs.current[bet.match_id] = el}  // ? Ref par match_id
                className="bg-white rounded-lg shadow-sm p-4 border-l-4 hover:shadow-md transition-all duration-300"
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
                    <p className="font-bold">{bet.bet_type === 'FT' ? '?? Temps plein' : '?? Mi-temps'}</p>
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
                      <span className="text-xs font-semibold text-green-700">? Gagné:</span>
                      <span className="text-sm font-bold text-green-700">
                        +{bet.payout} jetons
                      </span>
                    </div>
                  )}
                  {bet.status === 'lost' && (
                    <div className="flex items-center justify-between bg-red-50 rounded px-2 py-1">
                      <span className="text-xs font-semibold text-red-700">? Perdu:</span>
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


      {/* Bouton Règlement en bas de page */}
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