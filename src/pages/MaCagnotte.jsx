import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Coins, TrendingUp, TrendingDown, Trophy, 
  DollarSign, History, Gift, Award, Clock, Info 
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import axios from 'axios';
import { ChevronDown, Check } from "lucide-react";
import { getTeamData } from '../utils/teams';

// ---------------------------------------------------------
// Dropdown Premium
// ---------------------------------------------------------
function PremiumDropdown({ label, value, onChange, options, fullWidthMenu = false }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Fermer au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 border rounded-lg bg-white shadow-sm hover:shadow-md transition-all"
      >
        <span className="text-sm text-gray-700 truncate">
          {value ? value : label}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          className={`absolute mt-2 bg-white border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto ${
            fullWidthMenu ? 'left-0 right-0 min-w-max' : 'w-full'
          }`}
          style={fullWidthMenu ? { minWidth: '300px' } : {}}
        >
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`px-3 py-2 text-sm cursor-pointer flex items-center justify-between hover:bg-gray-100 transition ${
                value === opt.value ? "bg-gray-50" : ""
              }`}
            >
              <span className="truncate">{opt.label}</span>
              {value === opt.value && (
                <Check className="w-4 h-4 text-rugby-gold flex-shrink-0 ml-2" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------
// Transaction Item Component  
// ---------------------------------------------------------
function TransactionItem({ trans, navigateToBet, getTeamData, userCredits }) {
  const isPositive = trans.amount > 0;
  const isPending = trans.type === 'bet_pending';
  const isFT = trans.description?.includes('FT') || trans.bets?.bet_type === 'FT';
  const isMT = trans.description?.includes('MT') || trans.bets?.bet_type === 'MT';
  const periodLabel = isFT ? 'Temps plein' : isMT ? 'Mi-temps' : '';

  // Extraire les détails du match depuis bets.matches si disponible
  const match = trans.bets?.matches;
  const odds = trans.bets?.odds || trans.metadata?.odds;
  const stake = trans.bets?.stake;
  const payout = trans.metadata?.payout;

  

  // Pour les paris en cours, pas de solde (en attente de résolution)
  const calculatedBalance = isPending 
    ? 'En attente'
    : trans.balance_after;

  console.log('DEBUG:', { isPending, userCredits, stake, balance_after: trans.balance_after, calculatedBalance });

  // Pour les paris en cours, le montant à afficher est la mise (négatif)
  const displayAmount = isPending ? -stake : trans.amount;
  const displayIsPositive = isPending ? false : isPositive;

  // ✅ Extraire les vrais noms depuis external_id
  let homeTeam = match?.home_team || 'Équipe domicile';
  let awayTeam = match?.away_team || 'Équipe extérieure';

  // ✅ CORRECTION: Utiliser external_id pour récupérer les vrais noms depuis matchs_results
    if (match?.external_id) {
      const parts = match.external_id.split('_');
      if (parts.length >= 4) {
        // Format: 2025-2026_13_EQUIPE1_EQUIPE2 ou EQUIPE1_AVEC_ESPACES_EQUIPE2
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
            homeTeam = homeData.name;
            awayTeam = awayData.name;
            break;
          }
        }
      }
    }


  const dateObj = new Date(trans.created_at);
  const dateStr = dateObj.toLocaleDateString("fr-FR", { 
    day: "2-digit", 
    month: "short",
    year: "numeric"
  });
  const timeStr = dateObj.toLocaleTimeString("fr-FR", { 
    hour: "2-digit", 
    minute: "2-digit" 
  });

  // Icône selon le type
  const getIcon = () => {
    switch(trans.type) {
      case 'bet_won':
        return <Trophy className="w-5 h-5 text-green-500" />;
      case 'bet_placed':
        return <TrendingDown className="w-5 h-5 text-orange-500" />;
      case 'bet_pending':
        return <Clock className="w-5 h-5 text-orange-500" />;
      case 'monthly_distribution':
        return <Gift className="w-5 h-5 text-blue-500" />;
      case 'initial_capital':
        return <Award className="w-5 h-5 text-purple-500" />;
      default:
        return <Coins className="w-5 h-5 text-gray-400" />;
    }
  };

  // Titre selon le type
  const getTitle = () => {
    switch(trans.type) {
      case 'bet_won':
        return 'Pari gagné';
      case 'bet_placed':
        return 'Pari placé';
      case 'bet_pending':
        return 'Pari placé';
      case 'monthly_distribution':
        return 'Distribution mensuelle';
      case 'initial_capital':
        return 'Bonus de bienvenue';
      default:
        return 'Régularisation système';
    }
  };

  return (
    <div 
      className="p-4 bg-white border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer"
      onClick={() => (trans.type === 'bet_won' || trans.type === 'bet_pending') && trans.bet_id && navigateToBet(trans)}
    >
      {/* En-tête */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          {getIcon()}
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">{getTitle()}</span>
              {periodLabel && (
                <span className="px-2 py-0.5 text-[10px] rounded-full bg-gray-100 text-gray-600 border">
                  {periodLabel}
                </span>
              )}
            </div>
          </div>
        </div>
        <span className={`font-bold text-lg flex-shrink-0 ml-2 ${
          displayIsPositive ? "text-green-600" : "text-red-600"
        }`}>
          {displayIsPositive && '+'}{displayAmount}
        </span>
      </div>

      {/* Détails du match si disponible */}
      {match && homeTeam && awayTeam && (
        <div className="mt-2 text-sm text-gray-700 pl-7">
          <p className="font-medium">
            {homeTeam} {match.score_home !== null ? `${match.score_home} - ${match.score_away}` : 'vs'} {awayTeam}
          </p>
        </div>
      )}

      {/* Détails du pari */}
      {(odds || stake) && (
        <div className="mt-2 text-xs text-gray-500 pl-7">
          {odds && <span>Cote {parseFloat(odds).toFixed(2)}</span>}
          {odds && stake && <span> • </span>}
          {stake && <span>Mise {stake} jetons</span>}
          {payout && <span> • Gain {payout} jetons</span>}
        </div>
      )}

      {/* Date EN BAS */}
      <p className="text-xs text-gray-400 mt-2 flex items-center gap-1 pl-7">
        {match?.round && <span className="font-medium">J{match.round}</span>}
        {match?.round && <span>•</span>}
        <span>{dateStr}</span>
        <span>•</span>
        <span>{timeStr}</span>
      </p>

      {/* Solde après */}
      <div className="mt-2 text-xs text-gray-400 pl-7 flex justify-end">
        Solde: {calculatedBalance}
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// Main Component
// ---------------------------------------------------------
export default function MaCagnotte() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [userCredits, setUserCredits] = useState(null);
  const [userPoints, setUserPoints] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Filtres
  const [sortMode, setSortMode] = useState("recent");
  const [teamFilter, setTeamFilter] = useState("");

  const [stats, setStats] = useState({
    totalBets: 0,
    pendingBets: 0,
    wonBets: 0,
    lostBets: 0,
    totalStaked: 0,
    totalWon: 0,
    netProfit: 0,
    nbDistributions: 0
  });

  // Charger l'utilisateur
  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        navigate("/login");
        return;
      }
      setUser(data.user);
    };
    fetchUser();
  }, []);

  // Charger les données
  useEffect(() => {
    if (!user?.id) return;
    loadData(user.id);
  }, [user]);

  const loadData = async (userId) => {
    try {
      setLoading(true);

      // Crédits actuels
      const creditsResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/user/credits`,
        { headers: { "x-user-id": userId } }
      );
      setUserCredits(creditsResponse.data.credits || 0);

      // Points de classement
      const { data: userStatsData, error: statsError } = await supabase
        .from('user_stats')
        .select('total_points')
        .eq('user_id', userId)
        .eq('saison', '2025-2026')
        .single();

      if (!statsError && userStatsData) {
        setUserPoints(userStatsData.total_points || 0);
      }

      // Historique + Paris (endpoint V2)
      const historyResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/user/bets/detailed`,
        { headers: { "x-user-id": userId } }
      );

      const txs = historyResponse.data.transactions || [];
      const allBets = historyResponse.data.bets || [];

      setTransactions(txs);
      setBets(allBets);

      // Calculer stats
      const wonTxs = txs.filter((t) => t.type === "bet_won");
      const placedTxs = txs.filter((t) => t.type === "bet_placed");
      const distributions = txs.filter((t) => t.type === "monthly_distribution");

      const totalWon = historyResponse.data.user_credits?.total_earned || 0;
      // Total misé = Argent bloqué (en cours + perdus, exclut les gagnés)
      const totalStaked = allBets.reduce((sum, b) => sum + (b.stake || 0), 0);

      // ✅ Calcul identique à MesParisTab
      const wonBets = allBets.filter(b => b.status === 'won').length;
      const lostBets = allBets.filter(b => b.status === 'lost').length;
      const pendingBets = allBets.filter(b => b.status === 'pending').length;

      setStats({
        totalBets: wonBets + lostBets,
        pendingBets,
        wonBets,
        lostBets,
        totalStaked,
        totalWon,
        netProfit: totalWon - totalStaked,
        nbDistributions: distributions.length
      });

      setLoading(false);
    } catch (err) {
      console.error("Erreur chargement cagnotte:", err);
      setLoading(false);
    }
  };

  const navigateToBet = (trans) => {
    const matchId = trans.bets?.matches?.id;
    if (!matchId) return;
    navigate(`/pronos?scrollToMatchId=${matchId}`, {
      state: { activeTab: "mes-paris" },
    });
  };

  // Filtrer et fusionner transactions + paris pending
  const filteredTransactions = useMemo(() => {
    // 1. Récupérer les transactions
    const txList = transactions.filter((t) => {
      if (!teamFilter) return true;
      const match = t.bets?.matches;
      if (!match) return false;
      return (
        match.home_team?.includes(teamFilter) ||
        match.away_team?.includes(teamFilter)
      );
    });

    // DEBUG: Vérifier une transaction bet_won
    const wonTx = transactions.find(t => t.type === 'bet_won');
    console.log('DEBUG TRANSACTION BET_WON:', wonTx);
    console.log('bet_id:', wonTx?.bet_id);
    console.log('bets:', wonTx?.bets);
    console.log('matches:', wonTx?.bets?.matches);


    // 2. Récupérer les paris pending (qui n'ont pas encore de transaction)
    const pendingBetsList = bets
      .filter(b => {
        const matchFinished = b.matches && (b.matches.status === 'finished' || b.matches.score_home !== null);
        return !matchFinished; // Seulement les paris en cours
      })
      .map(b => ({
        id: b.id + '_pending',
        type: 'bet_pending',
        amount: 0,
        created_at: b.placed_at || b.created_at,
        bet_id: b.id,
        bets: {
          id: b.id,
          stake: b.stake,
          odds: b.odds,
          matches: b.matches
        }
      }));

    // 3. Fusionner
    const allItems = [...txList, ...pendingBetsList];

    // 4. Filtrer par équipe si nécessaire
    const filtered = allItems.filter((t) => {
      if (!teamFilter) return true;
      const match = t.bets?.matches;
      if (!match) return false;
      return (
        match.home_team?.includes(teamFilter) ||
        match.away_team?.includes(teamFilter)
      );
    });

    // 5. Trier
    if (sortMode === "recent") {
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else {
      filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    }

    return filtered;
  }, [transactions, bets, teamFilter, sortMode]);

  // Liste équipes depuis les paris (pas les transactions)
  const teams = [...new Set(
    bets
      .map((b) => b.matches?.home_team)
      .concat(bets.map((b) => b.matches?.away_team))
      .filter(Boolean)
  )].sort();

  const winRate = stats.totalBets > 0
    ? ((stats.wonBets / stats.totalBets) * 100).toFixed(1)
    : 0;
  const roi = stats.totalStaked > 0
    ? (((stats.totalWon - stats.totalStaked) / stats.totalStaked) * 100).toFixed(1)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Coins className="w-12 h-12 text-rugby-gold mx-auto mb-3 animate-spin" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-r from-rugby-gold to-rugby-bronze rounded-lg p-4 shadow-lg">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white/10 rounded-full transition"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <div className="flex items-center gap-2">
            <Coins className="w-6 h-6 text-white" />
            <h1 className="text-xl font-bold text-white">Ma Cagnotte</h1>
          </div>
          <div className="w-10" />
        </div>

        {/* Bandeau Credits + Points */}
        <div className="max-w-md mx-auto px-4 pb-4 grid grid-cols-2 gap-3">
          {/* Jetons */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
            <div className="flex items-center gap-2 mb-1">
              <Coins className="w-4 h-4 text-white" />
              <p className="text-xs text-white/90 font-semibold">Jetons</p>
            </div>
            <p className="text-2xl font-bold text-white">{userCredits || 0}</p>
          </div>

          {/* Points */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-4 h-4 text-white" />
              <p className="text-xs text-white/90 font-semibold">Points</p>
            </div>
            <p className="text-2xl font-bold text-white">{userPoints}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-[120px] z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-md mx-auto flex">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex-1 py-3 font-semibold transition-colors ${
              activeTab === "overview"
                ? "text-rugby-gold border-b-4 border-rugby-gold"
                : "text-gray-600 hover:text-rugby-gold"
            }`}
          >
            Vue d'ensemble
          </button>

          <button
            onClick={() => setActiveTab("transactions")}
            className={`flex-1 py-3 font-semibold transition-colors ${
              activeTab === "transactions"
                ? "text-rugby-gold border-b-4 border-rugby-gold"
                : "text-gray-600 hover:text-rugby-gold"
            }`}
          >
            Historique ({filteredTransactions.length})
          </button>
        </div>
      </div>

      {/* Contenu */}
      {activeTab === "overview" ? (
        <div className="p-6 space-y-4">
          {/* Gains / Pertes */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <p className="text-xs text-green-700 font-semibold">Total gagné</p>
              </div>
              <p className="text-2xl font-bold text-green-600">{stats.totalWon}</p>
            </div>

            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-5 h-5 text-red-600" />
                <p className="text-xs text-red-700 font-semibold">Total misé</p>
              </div>
              <p className="text-2xl font-bold text-red-600">{stats.totalStaked}</p>
            </div>
          </div>

          {/* Bénéfice Net */}
          <div className={`rounded-lg p-4 border ${
            stats.netProfit >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className={`text-xs font-semibold ${
                    stats.netProfit >= 0 ? "text-green-700" : "text-red-700"
                  }`}>
                    Bénéfice net
                  </p>
                  <div className="group relative">
                    <Info className="w-4 h-4 text-gray-400 cursor-help" />
                    <div className="invisible group-hover:visible absolute left-0 top-6 w-64 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg z-50">
                      <strong>Bénéfice net =</strong> Total gagné - Total misé
                    </div>
                  </div>
                </div>
                <p className={`text-3xl font-bold ${
                  stats.netProfit >= 0 ? "text-green-600" : "text-red-600"
                }`}>
                  {stats.netProfit >= 0 ? "+" : ""}{stats.netProfit}
                </p>
              </div>
              <DollarSign className={`w-12 h-12 ${
                stats.netProfit >= 0 ? "text-green-300" : "text-red-300"
              }`} />
            </div>
          </div>

          {/* Distributions */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Gift className="w-5 h-5 text-blue-600" />
              <p className="text-xs text-blue-700 font-semibold">Distributions mensuelles</p>
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats.nbDistributions}</p>
            <p className="text-[10px] text-blue-500 mt-1">reçues</p>
          </div>

          {/* Stats Paris */}
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

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">ROI</span>
                  <div className="group relative">
                    <Info className="w-4 h-4 text-gray-400 cursor-help" />
                    <div className="invisible group-hover:visible absolute left-0 top-6 w-64 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg z-50">
                      <strong>ROI =</strong> ((Total gagné - Total misé) / Total misé) × 100
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

          {/* Bouton */}
          <button
            onClick={() => navigate('/pronos', { state: { activeTab: 'mes-paris' } })}
            className="w-full bg-rugby-gold text-white py-3 rounded-lg font-semibold hover:bg-rugby-bronze transition-colors shadow-md"
          >
            Voir mes paris
          </button>
        </div>
      ) : (
        <div className="p-6 space-y-4">
          {/* Filtres */}
          <div className="sticky top-16 z-30 bg-white/90 backdrop-blur-md border-b border-gray-200 pb-3 pt-4 -mx-6 px-6">
            <h2 className="text-lg font-bold text-rugby-gold flex items-center gap-2 mb-3">
              <History className="w-5 h-5" />
              Historique des transactions
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <PremiumDropdown
                label="Toutes les équipes"
                value={teamFilter}
                onChange={setTeamFilter}
                fullWidthMenu={true}
                options={[
                  { value: "", label: "Toutes les équipes" },
                  ...teams.map(t => ({ value: t, label: t }))
                ]}
              />

              <PremiumDropdown
                label="Tri"
                value={sortMode === "recent" ? "Récent → Ancien" : "Ancien → Récent"}
                onChange={(v) => setSortMode(v === "Récent → Ancien" ? "recent" : "ancien")}
                options={[
                  { value: "Récent → Ancien", label: "Récent → Ancien" },
                  { value: "Ancien → Récent", label: "Ancien → Récent" }
                ]}
              />
            </div>
          </div>

          {/* Liste */}
          {filteredTransactions.length === 0 ? (
            <div className="p-8 text-center">
              <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Aucune transaction</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-rugby-gray overflow-hidden">
              {filteredTransactions.map(trans => (
                <TransactionItem 
                  key={trans.id} 
                  trans={trans} 
                  navigateToBet={navigateToBet}
                  getTeamData={getTeamData}
                  userCredits={userCredits}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
