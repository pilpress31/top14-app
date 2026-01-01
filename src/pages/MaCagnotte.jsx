import { useState, useEffect, useRef } from 'react';
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
function TransactionItem({ trans, navigateToBet, getTeamData }) {
  const isPositive = trans.amount > 0;
  const isFT = trans.description?.includes('FT');
  const isMT = trans.description?.includes('MT');
  const periodLabel = isFT ? 'Temps plein' : isMT ? 'Mi-temps' : '';

  // Extraire les détails du match depuis bets.matches si disponible
  const match = trans.bets?.matches;
  const odds = trans.bets?.odds || trans.metadata?.odds;
  const stake = trans.bets?.stake;
  const payout = trans.metadata?.payout;

  // ✅ Extraire les vrais noms depuis external_id
  let homeTeam = match?.home_team;
  let awayTeam = match?.away_team;

  if (match?.external_id) {
    const parts = match.external_id.split('_');
    if (parts.length >= 4) {
      const teams = parts.slice(2).join('_');
      const possibleTeams = teams.split('_');
      
      // Essayer toutes les combinaisons
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
    weekday: "short",
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
      case 'monthly_distribution':
        return 'Distribution mensuelle';
      case 'initial_capital':
        return 'Bonus de bienvenue';
      default:
        return 'Transaction';
    }
  };

  return (
    <div 
      className="p-4 bg-white border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer"
      onClick={() => trans.bet_id && navigateToBet(trans)}
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
            {/* Journée + Date/Heure */}
            <p className="text-xs text-gray-500 mt-1">
              {match?.round && <span className="font-medium">Journée {match.round} du </span>}
              {dateStr} <span className="mx-1">•</span> {timeStr}
            </p>
          </div>
        </div>
        <span className={`font-bold text-lg flex-shrink-0 ml-2 ${
          isPositive ? "text-green-600" : "text-red-600"
        }`}>
          {isPositive && '+'}{trans.amount}
        </span>
      </div>

      {/* Détails du match si disponible */}
      {match && (
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

      {/* Solde après */}
      <div className="mt-2 text-xs text-gray-400 pl-7 flex justify-end">
        Solde: {trans.balance_after}
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
        "https://top14-api-production.up.railway.app/api/user/credits",
        { headers: { "x-user-id": userId } }
      );
      setUserCredits(creditsResponse.data);

      // Données V2
      const v2Response = await axios.get(
        "https://top14-api-production.up.railway.app/api/user/bets/v2",
        { headers: { "x-user-id": userId } }
      );

      console.log('API JSON =', v2Response.data);
      console.log('BETS[0].matches =', v2Response.data.bets?.[0]?.matches);

      const txList = v2Response.data.transactions || [];
      const betsList = v2Response.data.bets || [];

      setTransactions(txList);
      setBets(betsList);

      // Calculer les stats depuis transactions
      const betPlaced = txList.filter(t => t.type === 'bet_placed');
      const betWon = txList.filter(t => t.type === 'bet_won');
      const betLost = txList.filter(t => t.type === 'bet_lost');
      
      console.log('📊 DEBUG STATS:');
      console.log('Total bet_placed:', betPlaced.length);
      console.log('Total bet_won:', betWon.length);
      console.log('Total bet_lost:', betLost.length);
      
      // ✅ Paris en cours = bets avec status 'placed' ET match pas terminé
      const pendingBets = betsList.filter(b => {
        const match = b.matches;
        const isPending = b.status === 'placed' && 
               (match?.status === 'scheduled' || match?.score_home === null);
        
        if (b.status === 'placed') {
          console.log('Bet:', b.id.substring(0, 8), 
                     'Match status:', match?.status, 
                     'Score:', match?.score_home, 
                     'isPending:', isPending);
        }
        
        return isPending;
      }).length;
      
      console.log('📊 Pending bets:', pendingBets);
      
      // ✅ Paris gagnés = transactions bet_won
      const wonBets = betWon.length;
      
      // ✅ Paris perdus explicites dans transactions
      const lostBetsExplicit = betLost.length;
      
      // ✅ Paris perdus calculés = (total placés) - (en cours) - (gagnés)
      const totalPlaced = betPlaced.length;
      const lostBetsCalculated = totalPlaced - pendingBets - wonBets;
      
      console.log('📊 Lost bets calculated:', lostBetsCalculated);
      
      // Prendre le max entre explicites et calculés
      const lostBets = Math.max(lostBetsExplicit, lostBetsCalculated > 0 ? lostBetsCalculated : 0);

      const totalStaked = betPlaced.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const totalWon = betWon.reduce((sum, t) => sum + t.amount, 0);

      const nbDistributions = txList.filter(t => t.type === 'monthly_distribution').length;

      setStats({
        totalBets: totalPlaced,
        pendingBets,
        wonBets,
        lostBets: lostBets,
        totalStaked,
        totalWon,
        netProfit: totalWon - totalStaked,
        nbDistributions
      });

      setLoading(false);
    } catch (error) {
      console.error("Erreur loadData:", error);
      setLoading(false);
    }
  };

  // Navigation vers un pari
  const navigateToBet = (transaction) => {
    // Essayer de récupérer le match_id
    let matchId = null;

    // 1. Depuis metadata
    if (transaction.metadata?.match_id) {
      matchId = transaction.metadata.match_id;
    }
    // 2. Depuis bets.matches
    else if (transaction.bets?.matches?.external_id) {
      matchId = transaction.bets.matches.external_id;
    }
    // 3. Depuis bets.match_id (uuid)
    else if (transaction.bets?.match_id) {
      // Chercher dans bets pour avoir l'external_id
      const bet = bets.find(b => b.id === transaction.bet_id);
      if (bet?.matches?.external_id) {
        matchId = bet.matches.external_id;
      }
    }

    if (matchId) {
      window.location.href = `/pronos?scrollToMatchId=${encodeURIComponent(matchId)}`;
    }
  };

  // Fonction pour extraire les vrais noms d'équipes depuis external_id
  const extractTeamsFromExternalId = (externalId) => {
    if (!externalId) return null;
    
    const parts = externalId.split('_');
    if (parts.length < 4) return null;
    
    // Format: 2025-2026_13_RACING_92_US_MONTAUBAN
    const teams = parts.slice(2).join('_');
    const possibleTeams = teams.split('_');
    
    // Essayer toutes les combinaisons possibles
    for (let i = 1; i < possibleTeams.length; i++) {
      const testHome = possibleTeams.slice(0, i).join(' ');
      const testAway = possibleTeams.slice(i).join(' ');
      
      const homeData = getTeamData(testHome);
      const awayData = getTeamData(testAway);
      
      if (homeData?.logo !== '/logos/default.svg' && 
          awayData?.logo !== '/logos/default.svg') {
        return {
          home: homeData.name,
          away: awayData.name
        };
      }
    }
    
    return null;
  };

  // Normalisation des équipes avec teams.ts
  const normalizeTeam = (name) => {
    if (!name) return "";
    
    // Chercher dans TEAMS_DATA la clé qui correspond
    const teamData = getTeamData(name);
    if (teamData && teamData.logo !== '/logos/default.svg') {
      return teamData.name;
    }
    
    // Sinon retourner le nom original normalisé
    return name.trim();
  };

  // Liste des équipes pour le filtre - extraire depuis external_id
  const teams = Array.from(
    new Set(
      transactions
        .filter(t => t.bets?.matches?.external_id)
        .flatMap(t => {
          const extracted = extractTeamsFromExternalId(t.bets.matches.external_id);
          return extracted ? [extracted.home, extracted.away] : [];
        })
        .filter(Boolean)
    )
  ).sort();

  // Filtrer les transactions
  const filteredTransactions = transactions
    .filter(t => {
      // Filtre par équipe
      if (teamFilter) {
        const match = t.bets?.matches;
        if (!match?.external_id) return false;
        
        const extracted = extractTeamsFromExternalId(match.external_id);
        if (!extracted) return false;
        
        return extracted.home === teamFilter || extracted.away === teamFilter;
      }
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return sortMode === "recent" ? dateB - dateA : dateA - dateB;
    });

  // Stats
  const winRate = stats.totalBets > 0 
    ? ((stats.wonBets / stats.totalBets) * 100).toFixed(1)
    : 0;

  const roi = stats.totalStaked > 0
    ? Math.round(((stats.totalWon - stats.totalStaked) / stats.totalStaked) * 100)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-rugby-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-rugby-gold"></div>
      </div>
    );
  }

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

        {/* Solde */}
        <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
          <p className="text-white/80 text-sm mb-1">Solde actuel</p>
          <p className="text-white text-4xl font-bold">
            {userCredits?.credits || 0}
          </p>
          <p className="text-white/70 text-xs mt-1">jetons</p>
        </div>
      </div>

      {/* Onglets */}
      <div className="bg-white border-b-2 border-rugby-gray sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto flex">
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
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
