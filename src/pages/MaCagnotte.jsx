import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Coins, TrendingUp, TrendingDown, Trophy, 
  DollarSign, History, Gift, Award, Calendar, Clock, ExternalLink, Info 
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import axios from 'axios';
import { useLocation } from "react-router-dom";


// 👉 TU COLLES BetItem ICI, juste après les imports
function BetItem({ t, getTransactionIcon, getTransactionLabel, navigateToBet }) {
  const bet = t.bets;
  const match = bet?.matches;

  const isBet = !!bet;

  return (
    <div 
      className="p-4 border-b border-gray-200 hover:bg-gray-50 transition cursor-pointer"
      onClick={() => navigateToBet(t)}
    >
      {/* Ligne titre + montant */}
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-2">
          {getTransactionIcon(t.type)}
          <span className="font-semibold">{getTransactionLabel(t.type)}</span>
        </div>

        <span className={`font-bold ${t.amount > 0 ? "text-green-600" : "text-red-600"}`}>
          {t.amount > 0 ? `+${t.amount}` : t.amount} jetons
        </span>
      </div>

      {/* Bloc pari */}
      {isBet && (
        <div className="mt-2 text-sm text-gray-700">
          {/* Match */}
          <div className="font-semibold">
            {match.home_team}{" "}
            {match.score_home !== null ? match.score_home : ""}

            {match.score_home !== null ? " – " : " vs "}

            {match.score_away !== null ? match.score_away : ""}{" "}
            {match.away_team}
          </div>

          {/* Détails pari */}
          <div className="text-gray-500">
            Cote {bet.odds} • Mise {bet.stake}
            {bet.payout && t.type === "bet_won" && (
              <> • Gain {bet.payout}</>
            )}
          </div>

          {/* Journée */}
          {match.round && (
            <div className="text-gray-500">Journée : {match.round}</div>
          )}
        </div>
      )}

      {/* Solde après transaction */}
      <div className="mt-2 text-xs text-gray-500">
        Solde après transaction :{" "}
        <span className="font-semibold">{t.balance_after}</span>
      </div>

      {/* Date */}
      <div className="text-xs text-gray-400">
        {new Date(t.created_at).toLocaleString("fr-FR", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit"
        })}
      </div>
    </div>
  );
}



export default function MaCagnotte() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [userCredits, setUserCredits] = useState(null);
  const [paris, setParis] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    totalBets: 0,
    pendingBets: 0,
    wonBets: 0,
    lostBets: 0,
    totalStaked: 0,
    totalWon: 0,
    netProfit: 0,
    totalBonus: 0,
    nbDistributions: 0
  });

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // 1️⃣ Charger l’utilisateur d’abord
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

  // 2️⃣ Charger les données uniquement quand user.id existe
  useEffect(() => {
    if (!user?.id) return; // attendre que user soit prêt
    loadData(user.id);
  }, [user]);

  // 3️⃣ loadData reçoit userId
  const loadData = async (userId) => {
    try {
      console.log("🔍 DEBUG userId:", userId); // ✅ Ajoutez ceci
      
      // --- Crédits ---
      const creditsResponse = await axios.get(
        'https://top14-api-production.up.railway.app/api/user/credits',
        { headers: { 'x-user-id': userId } }
      );
      setUserCredits(creditsResponse.data);

      // --- Paris enrichis ---
      console.log("🔍 Appel API bets/v2 avec userId:", userId); // ✅ Ajoutez ceci

      const parisResponse = await axios.get(
        'https://top14-api-production.up.railway.app/api/user/bets/v2',
        { headers: { 'x-user-id': userId } }
      );

      console.log("✅ Réponse API bets/v2:", parisResponse.data); // ✅ Ajoutez ceci

      const parisList = Array.isArray(parisResponse.data)
        ? parisResponse.data
        : [];

      setParis(parisList);

      // --- Stats ---
      const pending = parisList.filter(b => b.bets?.status === 'pending').length;
      const won = parisList.filter(b => b.bets?.status === 'won').length;
      const lost = parisList.filter(b => b.bets?.status === 'lost').length;

      const totalStaked = parisList.reduce(
        (sum, b) => sum + (b.bets?.stake || 0),
        0
      );

      const totalWon = parisList
        .filter(b => b.bets?.status === 'won')
        .reduce((sum, b) => sum + (b.bets?.payout || 0), 0);

      setStats({
        totalBets: parisList.length,
        pendingBets: pending,
        wonBets: won,
        lostBets: lost,
        totalStaked,
        totalWon,
        netProfit: totalWon - totalStaked,
        totalBonus: parisList.filter(t => t.type === 'bonus').length,
        nbDistributions: parisList.filter(t => t.type === 'monthly_distribution').length
      });

      setLoading(false);

    } catch (error) {
      console.error("Erreur loadData:", error);
      setLoading(false);
    }
  };


  const navigateToBet = (transaction) => {
    let matchId = null;

    // 1) metadata.match_id
    if (transaction.metadata?.match_id) {
      matchId = transaction.metadata.match_id;
    }

    // 2) reference_id → retrouver le pari
    else if (transaction.reference_id) {
      const bet = paris.find(p => p.id === transaction.reference_id);
      if (bet?.match_id) matchId = bet.match_id;
    }

    // 3) description → fallback
    else if (transaction.description) {
      const match = transaction.description.match(/! (.+?) \d+-\d+ (.+?)$/);
      if (match) {
        const [_, team1, team2] = match;
        const bet = paris.find(p => {
          const parts = p.match_id?.split('_') || [];
          const teams = parts.slice(2).join('_');
          return (
            teams.includes(team1.replace(/ /g, '_')) ||
            teams.includes(team2.replace(/ /g, '_'))
          );
        });
        if (bet?.match_id) matchId = bet.match_id;
      }
    }

    // 4) Navigation vers /pronos avec paramètre URL
    if (matchId) {
      window.location.href = `/pronos?match=${encodeURIComponent(matchId)}`;
    }
  };


  const getTransactionIcon = (type) => {
    switch (type) {
      case 'bet_placed':
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      case 'bet_won':
        return <Trophy className="w-5 h-5 text-green-500" />;
      case 'bet_lost':
        return <TrendingDown className="w-5 h-5 text-gray-400" />;
      case 'monthly_distribution':
        return <Gift className="w-5 h-5 text-blue-500" />;
      case 'bonus':
      case 'bonus_exact_score':
        return <Award className="w-5 h-5 text-purple-500" />;
      case 'initial_capital':
        return <Gift className="w-5 h-5 text-blue-500" />;
      default:
        return <Coins className="w-5 h-5 text-gray-400" />;
    }
  };

  const getTransactionLabel = (type) => {
    switch (type) {
      case 'bet_placed':
        return 'Pari placé';
      case 'bet_won':
        return 'Pari gagné';
      case 'bet_lost':
        return 'Pari perdu';
      case 'monthly_distribution':
        return 'Distribution mensuelle';
      case 'bonus_exact_score':
        return 'Bonus score exact';
      case 'bonus':
        return 'Bonus';
      case 'initial_capital':
        return 'Bonus de bienvenue';  
      default:
        return 'Transaction';
    }
  };

  const getTransactionDetails = (trans) => {
    if (!trans.metadata) return null;

    if (trans.type === 'bet_placed' || trans.type === 'bet_won' || trans.type === 'bet_lost') {
      return (
        <p className="text-xs text-gray-500 mt-1">
          {trans.metadata.bet_type === 'FT' ? 'Full Time' : 'Mi-Temps'} • 
          Cote: {trans.metadata.odds} • 
          Mise: {trans.metadata.stake} jetons
        </p>
      );
    }

    if (trans.type === 'bonus_exact_score') {
      return (
        <p className="text-xs text-gray-500 mt-1">
          Score exact trouvé ! 🎯
        </p>
      );
    }
    
    if (trans.type === 'initial_capital') {
      return (
        <p className="text-xs text-gray-500 mt-1">
          Jetons offerts à l’inscription
        </p>
      );
    }
  

    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-rugby-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-rugby-gold"></div>
      </div>
    );
  }

  const winRate = stats.totalBets > 0 
    ? ((stats.wonBets / stats.totalBets) * 100).toFixed(1) 
    : 0;

  // ✅ Calcul ROI
  const roi = stats.totalStaked > 0
    ? Math.round(((stats.totalWon - stats.totalStaked) / stats.totalStaked) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-rugby-white pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-rugby-gold to-rugby-bronze p-6 shadow-lg">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white mb-4 hover:text-white/80 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Retour</span>
        </button>
        
        <div className="flex items-center gap-3 mb-4">
          <Coins className="w-8 h-8 text-white" />
          <h1 className="text-2xl font-bold text-white">Ma Cagnotte</h1>
        </div>

        {/* Cagnotte principale */}
        <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
          <p className="text-white/80 text-sm mb-1">Solde actuel</p>
          <p className="text-white text-4xl font-bold">{userCredits?.credits || 0}</p>
          <p className="text-white/70 text-xs mt-1">jetons</p>
        </div>
      </div>

      {/* Onglets */}
      <div className="bg-white border-b-2 border-rugby-gray sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto flex">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-3 font-semibold transition-colors ${
              activeTab === 'overview'
                ? 'text-rugby-gold border-b-4 border-rugby-gold'
                : 'text-gray-600 hover:text-rugby-gold'
            }`}
          >
            Vue d'ensemble
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex-1 py-3 font-semibold transition-colors ${
              activeTab === 'transactions'
                ? 'text-rugby-gold border-b-4 border-rugby-gold'
                : 'text-gray-600 hover:text-rugby-gold'
            }`}
          >
            Historique
          </button>
        </div>
      </div>

      {/* Contenu */}
      {activeTab === 'overview' ? (
        <div className="p-6 space-y-4">
          {/* Gains/Pertes */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <p className="text-xs text-green-700 font-semibold">Total gagné</p>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {userCredits?.total_earned || 0}
              </p>
            </div>

            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-5 h-5 text-red-600" />
                <p className="text-xs text-red-700 font-semibold">Total misé</p>
              </div>
              <p className="text-2xl font-bold text-red-600">
                {stats.totalStaked}
              </p>
            </div>
          </div>

          {/* Bénéfice net */}
          <div className={`rounded-lg p-4 border ${
            stats.netProfit >= 0 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className={`text-xs font-semibold ${
                    stats.netProfit >= 0 ? 'text-green-700' : 'text-red-700'
                  }`}>
                    Bénéfice net
                  </p>
                  {/* ✅ Tooltip explicatif */}
                  <div className="group relative">
                    <Info className="w-4 h-4 text-gray-400 cursor-help" />
                    <div className="invisible group-hover:visible absolute left-0 top-6 w-64 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg z-50">
                      <strong>Bénéfice net =</strong> Total gagné - Total misé
                      <br/><br/>
                      Représente votre profit/perte global sur tous vos paris.
                    </div>
                  </div>
                </div>
                <p className={`text-3xl font-bold ${
                  stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stats.netProfit >= 0 ? '+' : ''}{stats.netProfit}
                </p>
              </div>
              <DollarSign className={`w-12 h-12 ${
                stats.netProfit >= 0 ? 'text-green-300' : 'text-red-300'
              }`} />
            </div>
          </div>

          {/* Bonus et distributions */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-purple-600" />
                <p className="text-xs text-purple-700 font-semibold">Bonus gagnés</p>
              </div>
              <p className="text-2xl font-bold text-purple-600">
                {stats.totalBonus}
              </p>
              <p className="text-[10px] text-purple-500 mt-1">jetons</p>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Gift className="w-5 h-5 text-blue-600" />
                <p className="text-xs text-blue-700 font-semibold">Distributions</p>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {stats.nbDistributions}
              </p>
              <p className="text-[10px] text-blue-500 mt-1">reçues</p>
            </div>
          </div>

          {/* Statistiques paris */}
          <div className="bg-white rounded-lg shadow-sm border border-rugby-gray p-4">
            <h2 className="text-lg font-bold text-rugby-gold mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Statistiques Paris
            </h2>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-orange-50 rounded-lg p-3 text-center border border-orange-200">
                <Clock className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-orange-500">{stats.pendingBets}</p>
                <p className="text-[10px] text-gray-600">En cours</p>
              </div>

              <div className="bg-green-50 rounded-lg p-3 text-center border border-green-200">
                <Trophy className="w-5 h-5 text-green-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-green-600">{stats.wonBets}</p>
                <p className="text-[10px] text-gray-600">Gagnés</p>
              </div>

              <div className="bg-red-50 rounded-lg p-3 text-center border border-red-200">
                <TrendingDown className="w-5 h-5 text-red-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-red-600">{stats.lostBets}</p>
                <p className="text-[10px] text-gray-600">Perdus</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Total paris</span>
                <span className="text-lg font-bold text-rugby-gold">{stats.totalBets}</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Taux de réussite</span>
                <span className="text-lg font-bold text-rugby-gold">{winRate}%</span>
              </div>

              {/* ✅ ROI avec tooltip */}
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">ROI</span>
                  {/* ✅ Tooltip explicatif */}
                  <div className="group relative">
                    <Info className="w-4 h-4 text-gray-400 cursor-help" />
                    <div className="invisible group-hover:visible absolute left-0 top-6 w-64 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg z-50">
                      <strong>ROI (Return On Investment) =</strong><br/>
                      ((Total gagné - Total misé) / Total misé) × 100
                      <br/><br/>
                      <strong>Positif :</strong> Vous gagnez plus que vous misez<br/>
                      <strong>Négatif :</strong> Vous perdez de l'argent<br/>
                      <strong>Exemple :</strong> ROI +20% = 20% de profit sur vos mises
                    </div>
                  </div>
                </div>
                <span className={`text-lg font-bold ${
                  roi >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {roi >= 0 ? '+' : ''}{roi}%
                </span>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-700">
              💡 <strong>Astuce :</strong> Diversifiez vos paris et ne misez jamais plus de 10% de votre cagnotte sur un seul match !
            </p>
          </div>

          {/* Bouton retour vers paris */}
          <button
            onClick={() => navigate('/pronos', { state: { activeTab: 'mes-paris' } })}
            className="w-full bg-rugby-gold text-white py-3 rounded-lg font-semibold hover:bg-rugby-bronze transition-colors shadow-md"
          >
            Voir mes paris
          </button>
        </div>
      ) : (
        // Onglet Historique des paris
        <div className="p-6 space-y-4">

          <h2 className="text-lg font-bold text-rugby-gold flex items-center gap-2 mb-4">
            <History className="w-5 h-5" />
            Historique des paris
          </h2>

          {paris.length === 0 ? (
            <div className="p-8 text-center">
              <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Aucun pari pour le moment</p>
            </div>
          ) : (
            paris.map(t => (
              <BetItem
                key={t.id}
                t={t}
                getTransactionIcon={getTransactionIcon}
                getTransactionLabel={getTransactionLabel}
                navigateToBet={navigateToBet}
              />
            ))

          )}

        </div>
      )}

    </div>
  );
}

