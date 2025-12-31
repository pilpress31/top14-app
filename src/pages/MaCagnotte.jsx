import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Coins, TrendingUp, TrendingDown, Trophy, 
  DollarSign, History, Gift, Award, Calendar, Clock, ExternalLink, Info 
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import axios from 'axios';
import { useLocation } from "react-router-dom";

// ---------------------------------------------------------
// Dropdown Premium (réutilisable)
// ---------------------------------------------------------
import { ChevronDown, Check } from "lucide-react";

function PremiumDropdown({ label, value, onChange, options }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative w-full">
      {/* Bouton */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 border rounded-lg bg-white shadow-sm hover:shadow-md transition-all"
      >
        <span className="text-sm text-gray-700">
          {value ? value : label}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Menu */}
      {open && (
        <div
          className="absolute mt-2 w-full bg-white border rounded-lg shadow-lg z-50 
                     animate-[fadeIn_0.15s_ease-out]"
        >
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`px-3 py-2 text-sm cursor-pointer flex items-center justify-between
                          hover:bg-gray-100 transition ${
                            value === opt.value ? "bg-gray-50" : ""
                          }`}
            >
              <span>{opt.label}</span>
              {value === opt.value && (
                <Check className="w-4 h-4 text-rugby-gold" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------
// BET ITEM — Composant enfant + normalisation locale
// ---------------------------------------------------------
function BetItem({ t, getTransactionIcon, getTransactionLabel, navigateToBet }) {
  console.log("BET ITEM t =", t);
  
  const bet = t.bets;
  const match = bet?.matches;
  const isBet = !!bet;

  // Normalisation locale (obligatoire pour éviter l’erreur)
  const normalizeTeam = (name) => {
    if (!name) return "";
    const n = name.toUpperCase().replace(/\s+/g, "").trim();

    const map = {
      // TOP 14
      "RACING": "RACING 92",
      "92": "RACING 92",
      "RACING92": "RACING 92",
      "R92": "RACING 92",

      "CASTRES": "CASTRES OLYMPIQUE",
      "OLYMPIQUE": "CASTRES OLYMPIQUE",
      "CASTRESOLYMPIQUE": "CASTRES OLYMPIQUE",
      "CO": "CASTRES OLYMPIQUE",

      "TOULOUSE": "STADE TOULOUSAIN",
      "STADETOULOUSAIN": "STADE TOULOUSAIN",
      "ST": "STADE TOULOUSAIN",

      "STADEFRANCAIS": "STADE FRANÇAIS",
      "PARIS": "STADE FRANÇAIS",

      "TOULON": "RC TOULON",
      "RCT": "RC TOULON",

      "MONTPELLIER": "MONTPELLIER HÉRAULT",
      "MHR": "MONTPELLIER HÉRAULT",

      "CLERMONT": "ASM CLERMONT AUVERGNE",
      "ASM": "ASM CLERMONT AUVERGNE",

      "BORDEAUX": "BORDEAUX-BÈGLES",
      "UBB": "BORDEAUX-BÈGLES",

      "LYON": "LYON OU",
      "LOU": "LYON OU",

      "PAU": "SECTION PALOISE",
      "SECTIONPALOISE": "SECTION PALOISE",

      "PERPIGNAN": "USAP PERPIGNAN",
      "USAP": "USAP PERPIGNAN",

      "BAYONNE": "AVIRON BAYONNAIS",
      "AB": "AVIRON BAYONNAIS",

      // PRO D2
      "AGEN": "SU AGEN",
      "SUA": "SU AGEN",

      "AURILLAC": "STADE AURILLACOIS",

      "BEZIERS": "AS BEZIERS",
      "ASBH": "AS BEZIERS",

      "BIARRITZ": "BIARRITZ OLYMPIQUE",
      "BO": "BIARRITZ OLYMPIQUE",

      "CARCASSONNE": "US CARCASSONNE",
      "USC": "US CARCASSONNE",

      "COLOMIERS": "COLOMIERS RUGBY",

      "DAX": "US DAX",

      "GRENOBLE": "FC GRENOBLE",
      "FCG": "FC GRENOBLE",

      "MONTDEMARSAN": "STADO MONTOIS",
      "MONTOIS": "STADO MONTOIS",

      "NEVERS": "USON NEVERS",

      "PROVENCE": "PROVENCE RUGBY",

      "ROUEN": "ROUEN NORMANDIE",

      "VALENCEROMANS": "VALENCE-ROMANS",
      "VRDR": "VALENCE-ROMANS",

      "VANNES": "RC VANNES",
      "RCV": "RC VANNES",

      // MONTAUBAN
      "MONTAUBAN": "US MONTAUBAN",
      "USMONTAUBAN": "US MONTAUBAN",
      "USM": "US MONTAUBAN",
      "SAPIAC": "US MONTAUBAN",
      "USMSAPIAC": "US MONTAUBAN",
    };

    if (map[n]) return map[n];
    for (const key in map) if (n.includes(key)) return map[key];
    return name.trim();
  };

  const home = normalizeTeam(match?.home_team);
  const away = normalizeTeam(match?.away_team);

  // Format date premium
  const dateObj = new Date(t.created_at);
  const dateStr = dateObj.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
  const timeStr = dateObj.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="p-4 hover:bg-gray-50 transition cursor-pointer" onClick={() => navigateToBet(t)}>
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-2">
          {getTransactionIcon(t.type)}
          <span className="font-semibold">{getTransactionLabel(t.type)}</span>

          {isBet && (
            <span className="ml-2 px-2 py-0.5 text-[10px] rounded-full bg-gray-100 text-gray-600 border border-gray-300">
              {t.user_bets?.bet_type === "FT" ? "Temps plein" : "Mi‑temps"}
            </span>
          )}
        </div>

        <span className={`font-bold ${t.amount > 0 ? "text-green-600" : "text-red-600"}`}>
          {t.amount > 0 ? `+${t.amount}` : t.amount} jetons
        </span>
      </div>

      
      {isBet && (
        <div className="mt-2 text-sm text-gray-700">

          {/* Journée + date + heure */}
          {match.round && (
            <div className="text-gray-500 mb-1">
              Journée {match.round} — {dateStr} • {timeStr}
            </div>
          )}

          {/* Score */}
          <div className="font-semibold">
            {home} {match.score_home ?? ""} {match.score_home !== null ? "–" : "vs"} {match.score_away ?? ""} {away}
          </div>

          {/* Cote / Mise / Gain */}
          <div className="text-gray-500">
            Cote {bet.odds} • Mise {bet.stake}
            {bet.payout && t.type === "bet_won" && <> • Gain {bet.payout}</>}
          </div>

        </div>
      )}


      <div className="mt-2 text-xs text-gray-500 flex justify-end">
        Solde après transaction : <span className="font-semibold ml-1">{t.balance_after}</span>
      </div>

      <div className="mt-4 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
    </div>
  );
}

// ---------------------------------------------------------
// Fin de partie 01
// ---------------------------------------------------------
// ---------------------------------------------------------
// MA CAGNOTTE — Début du composant
// ---------------------------------------------------------
export default function MaCagnotte() {
  const navigate = useNavigate();

  // États principaux
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
  const [activeTab, setActiveTab] = useState("overview");

  // Tri + filtre
  const [sortMode, setSortMode] = useState("Plus récent");
  const [teamFilter, setTeamFilter] = useState("");

  // Charger l’utilisateur
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

  // Charger les données quand user.id existe
  useEffect(() => {
    if (!user?.id) return;
    loadData(user.id);
  }, [user]);
// ---------------------------------------------------------
// Fin de partie 02
// ---------------------------------------------------------
  // ---------------------------------------------------------
  // Chargement des données utilisateur (crédits + paris + stats)
  // ---------------------------------------------------------
  const loadData = async (userId) => {
    try {
      // Crédits
      const creditsResponse = await axios.get(
        "https://top14-api-production.up.railway.app/api/user/credits",
        { headers: { "x-user-id": userId } }
      );
      setUserCredits(creditsResponse.data);

      // Paris enrichis
      const parisResponse = await axios.get(
        "https://top14-api-production.up.railway.app/api/user/bets/v2",
        { headers: { "x-user-id": userId } }
      );

      const parisList = Array.isArray(parisResponse.data)
        ? parisResponse.data
        : [];

      setParis(parisList);

      // Statistiques
      const pending = parisList.filter((b) => b.bets?.status === "pending").length;
      const won = parisList.filter((b) => b.bets?.status === "won").length;
      const lost = parisList.filter((b) => b.bets?.status === "lost").length;

      const totalStaked = parisList.reduce(
        (sum, b) => sum + (b.bets?.stake || 0),
        0
      );

      const totalWon = parisList
        .filter((b) => b.bets?.status === "won")
        .reduce((sum, b) => sum + (b.bets?.payout || 0), 0);

      setStats({
        totalBets: parisList.length,
        pendingBets: pending,
        wonBets: won,
        lostBets: lost,
        totalStaked,
        totalWon,
        netProfit: totalWon - totalStaked,
        totalBonus: parisList.filter((t) => t.type === "bonus").length,
        nbDistributions: parisList.filter((t) => t.type === "monthly_distribution").length
      });

      setLoading(false);
    } catch (error) {
      console.error("Erreur loadData:", error);
      setLoading(false);
    }
  };


  // ---------------------------------------------------------
  // Navigation vers un pari (depuis l’historique)
  // ---------------------------------------------------------
  const navigateToBet = (transaction) => {
    let matchId = null;

    if (transaction.metadata?.match_id) {
      matchId = transaction.metadata.match_id;

    } else if (transaction.reference_id) {
      const bet = paris.find((p) => p.id === transaction.reference_id);
      if (bet?.match_id) matchId = bet.match_id;

    } else if (transaction.description) {
      const match = transaction.description.match(/! (.+?) \d+-\d+ (.+?)$/);
      if (match) {
        const [_, team1, team2] = match;

        const bet = paris.find((p) => {
          const parts = p.match_id?.split("_") || [];
          const teams = parts.slice(2).join("_");
          return (
            teams.includes(team1.replace(/ /g, "_")) ||
            teams.includes(team2.replace(/ /g, "_"))
          );
        });

        if (bet?.match_id) matchId = bet.match_id;
      }
    }

    if (matchId) {
      window.location.href = `/pronos?match=${encodeURIComponent(matchId)}`;
    }
  };


  // ---------------------------------------------------------
  // Icônes des transactions
  // ---------------------------------------------------------
  const getTransactionIcon = (type) => {
    switch (type) {
      case "bet_placed":
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      case "bet_won":
        return <Trophy className="w-5 h-5 text-green-500" />;
      case "bet_lost":
        return <TrendingDown className="w-5 h-5 text-gray-400" />;
      case "monthly_distribution":
        return <Gift className="w-5 h-5 text-blue-500" />;
      case "bonus":
      case "bonus_exact_score":
        return <Award className="w-5 h-5 text-purple-500" />;
      case "initial_capital":
        return <Gift className="w-5 h-5 text-blue-500" />;
      default:
        return <Coins className="w-5 h-5 text-gray-400" />;
    }
  };


  // ---------------------------------------------------------
  // Libellés des transactions
  // ---------------------------------------------------------
  const getTransactionLabel = (type) => {
    switch (type) {
      case "bet_placed":
        return "Pari placé";
      case "bet_won":
        return "Pari gagné";
      case "bet_lost":
        return "Pari perdu";
      case "monthly_distribution":
        return "Distribution mensuelle";
      case "bonus_exact_score":
        return "Bonus score exact";
      case "bonus":
        return "Bonus";
      case "initial_capital":
        return "Bonus de bienvenue";
      default:
        return "Transaction";
    }
  };
// ---------------------------------------------------------
// Fin de partie 03
// ---------------------------------------------------------
  // ---------------------------------------------------------
  // Loading screen
  // ---------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-rugby-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-rugby-gold"></div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // Calculs statistiques
  // ---------------------------------------------------------
  const winRate =
    stats.totalBets > 0
      ? ((stats.wonBets / stats.totalBets) * 100).toFixed(1)
      : 0;

  const roi =
    stats.totalStaked > 0
      ? Math.round(((stats.totalWon - stats.totalStaked) / stats.totalStaked) * 100)
      : 0;


  // ---------------------------------------------------------
  // Normalisation des équipes (version globale pour le FILTRE)
  // ---------------------------------------------------------
  const normalizeTeam = (name) => {
    if (!name) return "";
    const n = name.toUpperCase().replace(/\s+/g, "").trim();

    const map = {
      // TOP 14
      "RACING": "RACING 92",
      "92": "RACING 92",
      "RACING92": "RACING 92",
      "R92": "RACING 92",

      "CASTRES": "CASTRES OLYMPIQUE",
      "OLYMPIQUE": "CASTRES OLYMPIQUE",
      "CASTRESOLYMPIQUE": "CASTRES OLYMPIQUE",
      "CO": "CASTRES OLYMPIQUE",

      "TOULOUSE": "STADE TOULOUSAIN",
      "STADETOULOUSAIN": "STADE TOULOUSAIN",
      "ST": "STADE TOULOUSAIN",

      "STADEFRANCAIS": "STADE FRANÇAIS",
      "PARIS": "STADE FRANÇAIS",

      "TOULON": "RC TOULON",
      "RCT": "RC TOULON",

      "MONTPELLIER": "MONTPELLIER HÉRAULT",
      "MHR": "MONTPELLIER HÉRAULT",

      "CLERMONT": "ASM CLERMONT AUVERGNE",
      "ASM": "ASM CLERMONT AUVERGNE",

      "BORDEAUX": "BORDEAUX-BÈGLES",
      "UBB": "BORDEAUX-BÈGLES",

      "LYON": "LYON OU",
      "LOU": "LYON OU",

      "PAU": "SECTION PALOISE",
      "SECTIONPALOISE": "SECTION PALOISE",

      "PERPIGNAN": "USAP PERPIGNAN",
      "USAP": "USAP PERPIGNAN",

      "BAYONNE": "AVIRON BAYONNAIS",
      "AB": "AVIRON BAYONNAIS",

      // PRO D2
      "AGEN": "SU AGEN",
      "SUA": "SU AGEN",

      "AURILLAC": "STADE AURILLACOIS",

      "BEZIERS": "AS BEZIERS",
      "ASBH": "AS BEZIERS",

      "BIARRITZ": "BIARRITZ OLYMPIQUE",
      "BO": "BIARRITZ OLYMPIQUE",

      "CARCASSONNE": "US CARCASSONNE",
      "USC": "US CARCASSONNE",

      "COLOMIERS": "COLOMIERS RUGBY",

      "DAX": "US DAX",

      "GRENOBLE": "FC GRENOBLE",
      "FCG": "FC GRENOBLE",

      "MONTDEMARSAN": "STADO MONTOIS",
      "MONTOIS": "STADO MONTOIS",

      "NEVERS": "USON NEVERS",

      "PROVENCE": "PROVENCE RUGBY",

      "ROUEN": "ROUEN NORMANDIE",

      "VALENCEROMANS": "VALENCE-ROMANS",
      "VRDR": "VALENCE-ROMANS",

      "VANNES": "RC VANNES",
      "RCV": "RC VANNES",

      // MONTAUBAN
      "MONTAUBAN": "US MONTAUBAN",
      "USMONTAUBAN": "US MONTAUBAN",
      "USM": "US MONTAUBAN",
      "SAPIAC": "US MONTAUBAN",
      "USMSAPIAC": "US MONTAUBAN",
    };

    if (map[n]) return map[n];
    for (const key in map) if (n.includes(key)) return map[key];
    return name.trim();
  };


  // ---------------------------------------------------------
  // Liste des équipes normalisées pour le filtre
  // ---------------------------------------------------------
  const teams = Array.from(
    new Set(
      paris
        .filter((t) => t.bets?.matches)
        .flatMap((t) => [
          normalizeTeam(t.bets.matches.home_team),
          normalizeTeam(t.bets.matches.away_team),
        ])
        .filter(Boolean)
    )
  ).sort();

// ---------------------------------------------------------
// Fin de partie 04
// ---------------------------------------------------------
  return (
    <div className="min-h-screen bg-rugby-white pb-24">
      
      {/* ----------------------------------------------------- */}
      {/* HEADER                                                */}
      {/* ----------------------------------------------------- */}
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


      {/* ----------------------------------------------------- */}
      {/* ONGLET OVERVIEW / TRANSACTIONS                       */}
      {/* ----------------------------------------------------- */}
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
            Historique
          </button>
        </div>
      </div>


      {/* ----------------------------------------------------- */}
      {/* CONTENU OVERVIEW                                      */}
      {/* ----------------------------------------------------- */}
      {activeTab === "overview" ? (
        <div className="p-6 space-y-4">

          {/* Gains / Pertes */}
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

          {/* ----------------------------------------------------- */}
          {/* BÉNÉFICE NET                                           */}
          {/* ----------------------------------------------------- */}
          <div
            className={`rounded-lg p-4 border ${
              stats.netProfit >= 0
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p
                    className={`text-xs font-semibold ${
                      stats.netProfit >= 0 ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    Bénéfice net
                  </p>

                  <div className="group relative">
                    <Info className="w-4 h-4 text-gray-400 cursor-help" />
                    <div className="invisible group-hover:visible absolute left-0 top-6 w-64 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg z-50">
                      <strong>Bénéfice net =</strong> Total gagné - Total misé
                      <br /><br />
                      Représente votre profit/perte global sur tous vos paris.
                    </div>
                  </div>
                </div>

                <p
                  className={`text-3xl font-bold ${
                    stats.netProfit >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {stats.netProfit >= 0 ? "+" : ""}
                  {stats.netProfit}
                </p>
              </div>

              <DollarSign
                className={`w-12 h-12 ${
                  stats.netProfit >= 0 ? "text-green-300" : "text-red-300"
                }`}
              />
            </div>
          </div>


          {/* ----------------------------------------------------- */}
          {/* BONUS & DISTRIBUTIONS                                 */}
          {/* ----------------------------------------------------- */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-purple-600" />
                <p className="text-xs text-purple-700 font-semibold">
                  Bonus gagnés
                </p>
              </div>
              <p className="text-2xl font-bold text-purple-600">
                {stats.totalBonus}
              </p>
              <p className="text-[10px] text-purple-500 mt-1">jetons</p>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Gift className="w-5 h-5 text-blue-600" />
                <p className="text-xs text-blue-700 font-semibold">
                  Distributions
                </p>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {stats.nbDistributions}
              </p>
              <p className="text-[10px] text-blue-500 mt-1">reçues</p>
            </div>
          </div>


          {/* ----------------------------------------------------- */}
          {/* STATISTIQUES PARIS — Début                            */}
          {/* ----------------------------------------------------- */}
          <div className="bg-white rounded-lg shadow-sm border border-rugby-gray p-4">
            <h2 className="text-lg font-bold text-rugby-gold mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Statistiques Paris
            </h2>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-orange-50 rounded-lg p-3 text-center border border-orange-200">
                <Clock className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-orange-500">
                  {stats.pendingBets}
                </p>
                <p className="text-[10px] text-gray-600">En cours</p>
              </div>

              <div className="bg-green-50 rounded-lg p-3 text-center border border-green-200">
                <Trophy className="w-5 h-5 text-green-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-green-600">
                  {stats.wonBets}
                </p>
                <p className="text-[10px] text-gray-600">Gagnés</p>
              </div>

              <div className="bg-red-50 rounded-lg p-3 text-center border border-red-200">
                <TrendingDown className="w-5 h-5 text-red-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-red-600">
                  {stats.lostBets}
                </p>
                <p className="text-[10px] text-gray-600">Perdus</p>
              </div>
            </div>
            {/* Suite des statistiques paris */}
            <div className="space-y-2">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Total paris</span>
                <span className="text-lg font-bold text-rugby-gold">
                  {stats.totalBets}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Taux de réussite</span>
                <span className="text-lg font-bold text-rugby-gold">
                  {winRate}%
                </span>
              </div>

              {/* ROI */}
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">ROI</span>

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

          {/* Astuce */}
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
        /* ----------------------------------------------------- */
        /* PARTIE TRANSACTIONS                                   */
        /* ----------------------------------------------------- */
        <div className="p-6 space-y-4">

          {/* HEADER STICKY TRANSACTIONS */}
          <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 pb-3 pt-4">
            <h2 className="text-lg font-bold text-rugby-gold flex items-center gap-2 px-1 mb-3">
              <History className="w-5 h-5" />
              Historique des paris
            </h2>

            <div className="flex gap-3 px-1">
              {/* Dropdown équipe */}
              <div className="w-56">
                <PremiumDropdown
                  label="Toutes les équipes"
                  value={teamFilter}
                  onChange={(v) => setTeamFilter(v)}
                  options={[
                    { value: "", label: "Toutes les équipes" },
                    ...teams.map((t) => ({ value: t, label: t }))
                  ]}
                />
              </div>

              {/* Dropdown tri */}
              <div className="w-48">
                <PremiumDropdown
                  label="Trier par"
                  value={sortMode}
                  onChange={(v) => setSortMode(v)}
                  options={[
                    { value: "recent", label: "Récent → Ancien" },
                    { value: "ancien", label: "Ancien → Récent" }
                  ]}
                />
              </div>
            </div>
          </div>


          

          {/* Liste des transactions */}
          {paris.length === 0 ? (
            <div className="p-8 text-center">
              <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Aucun pari pour le moment</p>
            </div>
          ) : (
            [...paris]
              .sort((a, b) => {
                const da = new Date(a.created_at);
                const db = new Date(b.created_at);

                // Nouveau tri basé sur "recent" / "ancien"
                if (sortMode === "ancien") {
                  return da - db; // plus ancien en premier
                } else {
                  return db - da; // plus récent en premier
                }
              })
              .filter(t => {
                if (!teamFilter) return true;
                const match = t.bets?.matches;
                if (!match) return false;
                return (
                  normalizeTeam(match.home_team) === teamFilter ||
                  normalizeTeam(match.away_team) === teamFilter
                );
              })
              .map(t => (
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



