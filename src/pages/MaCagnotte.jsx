import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Coins, TrendingUp, TrendingDown, Trophy, 
  DollarSign, History, Gift, Award, Clock, Info, X
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import axios from 'axios';
import { ChevronDown, ChevronRight, Check } from "lucide-react";
import { getTeamData } from '../utils/teams';
import { useRealtimeSync } from '../hooks/useRealtimeSync';
import { getSaisonCourante } from '../utils/season';
import { useChampionnat } from '../contexts/ChampionnatContext';


// ---------------------------------------------------------
// Helper : nom canonique d'équipe (dédup "Bordeaux" vs "Union Bordeaux Bègles", etc.)
// Utilise getTeamData pour mapper toutes les variantes vers un seul nom.
// ---------------------------------------------------------
function canonicalTeamName(raw) {
  if (!raw) return null;
  try {
    const td = getTeamData(raw);
    return td?.name || raw;
  } catch {
    return raw;
  }
}


// ---------------------------------------------------------
// Dropdown Premium
// ---------------------------------------------------------
function PremiumDropdown({ label, value, onChange, options, fullWidthMenu = false }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

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
          {/* 🆕 Affiche le label de l'option sélectionnée (pas juste la value brute) */}
          {value ? (options.find(o => o.value === value)?.label || value) : label}
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
// Transaction Item Component - AMÉLIORÉ AVEC DÉTAILS
// ---------------------------------------------------------
function TransactionItem({ trans, navigateToBet, getTeamData, bets }) {
  const isPositive = trans.amount > 0;

  // ✅ Chercher le pari complet AVANT de calculer isFT/isMT
  // L'API utilise reference_id (pas bet_id) pour lier transactions → paris
  const fullBetById = bets?.find(b => b.id === (trans.bet_id || trans.reference_id));
  const fullBetByMatch = bets?.find(b => 
    b.match_id === trans.bets?.match_id && 
    b.bet_type === trans.bets?.bet_type
  );
  // Pour les transactions orphelines (pas de bet_id ni match_id) : déduire depuis description
  // Description format: "Gain pari MT J15 ..." ou "Pari gagné MT ..."
  const betTypeFromDesc = trans.description?.includes('MT') ? 'MT' : trans.description?.includes('FT') ? 'FT' : null;
  const fullBetByDesc = (!fullBetById && !fullBetByMatch && betTypeFromDesc)
    ? bets?.find(b => 
        b.bet_type === betTypeFromDesc && 
        b.status === 'won' &&
        // Correspondance approximative par date (même jour)
        b.result_at && trans.created_at &&
        Math.abs(new Date(b.result_at) - new Date(trans.created_at)) < 24 * 60 * 60 * 1000 &&
        // Pas déjà utilisé par une autre transaction
        !bets?.some((_, __) => false) // placeholder
      )
    : null;
  const fullBet = fullBetById || fullBetByMatch || fullBetByDesc || trans.bets;

  // ✅ Calculer isFT/isMT/isWinnerFT/isWinnerMT depuis toutes les sources disponibles
  const betType = trans.bets?.bet_type || fullBet?.bet_type; // trans.bets prime : source de vérité
  // 🆕 v3 : on cherche aussi WINNER_FT dans la description (pour transactions D2)
  // betType est la source de vérité (trans.bets?.bet_type prime - cf. ligne 115)
  // Pas de fallback description pour éviter les faux positifs (ex: 'MT J24' dans description)
  const isWinnerMT = betType === 'WINNER_MT';
  const isWinnerFT = betType === 'WINNER_FT';
  const isFT = !isWinnerFT && !isWinnerMT && (betType === 'FT' || trans.description?.includes('FT'));
  const isMT = !isWinnerMT && (betType === 'MT' || trans.description?.includes('MT'));
  const periodLabel = isWinnerFT ? 'Vainqueur FT' : isWinnerMT ? 'Vainqueur MT' : isFT ? 'Temps plein' : isMT ? 'Mi-temps' : '';
  
  // 🆕 v3 : récupérer winner_predit pour les paris WINNER_FT
  const winnerPredit = fullBet?.winner_predit ?? trans.bets?.winner_predit;

  // ✅ Le match peut venir du pari trouvé OU directement de trans.bets
  const match = fullBet?.matches || trans.bets?.matches;
  const odds = fullBet?.odds || trans.bets?.odds || trans.metadata?.odds;
  const stake = fullBet?.stake || trans.bets?.stake;
  const payout = fullBet?.payout || trans.metadata?.payout;

  // Scores du pari et du match réel
  const pronoHome = fullBet?.score_domicile ?? trans.bets?.score_domicile;
  const pronoAway = fullBet?.score_exterieur ?? trans.bets?.score_exterieur;
  // ✅ Pour un pari MT, afficher le score de mi-temps (champs match_results)
  const isMTPari = isMT;
  const realHome = isMTPari
    ? (match?.score_ht_home ?? match?.score_ht_domicile ?? match?.score_home)
    : match?.score_home;
  const realAway = isMTPari
    ? (match?.score_ht_away ?? match?.score_ht_exterieur ?? match?.score_away)
    : match?.score_away;

  // Calculer l'écart
  const hasRealScore = realHome !== null && realHome !== undefined;
  const ecartProno = hasRealScore ? Math.abs((pronoHome - pronoAway) - (realHome - realAway)) : null;

  // Extraire les noms d'équipes - essayer toutes les sources disponibles
  let homeTeam = match?.home_team || fullBet?.matches?.home_team || 'Équipe domicile';
  let awayTeam = match?.away_team || fullBet?.matches?.away_team || 'Équipe extérieure';

  const extractTeamsFromId = (id) => {
    if (!id) return null;
    
    const parts = id.split('_');
    if (parts.length < 4) return null;
    
    const teams = parts.slice(2).join('_');
    const possibleTeams = teams.split('_');
    
    for (let i = 1; i < possibleTeams.length; i++) {
      const testHome = possibleTeams.slice(0, i).join(' ');
      const testAway = possibleTeams.slice(i).join(' ');
      
      const homeData = getTeamData(testHome);
      const awayData = getTeamData(testAway);
      
      if (homeData?.logo !== '/logos/default.svg' && 
          awayData?.logo !== '/logos/default.svg') {
        return { home: homeData.name, away: awayData.name };
      }
    }
    return null;
  };

  let extracted = null;
  // Essayer toutes les sources d'external_id/match_id disponibles
  const externalId = match?.external_id || fullBet?.matches?.external_id;
  const matchIdStr = trans.bets?.match_id || fullBet?.match_id;

  if (externalId) {
    extracted = extractTeamsFromId(externalId);
  }
  if (!extracted && matchIdStr) {
    extracted = extractTeamsFromId(matchIdStr);
  }

  if (extracted) {
    homeTeam = extracted.home;
    awayTeam = extracted.away;
  }

  // ✅ Dernier recours : extraire depuis la description de la transaction
  if ((homeTeam === 'Équipe domicile' || awayTeam === 'Équipe extérieure') && trans.description) {
    const vsMatch = trans.description.match(/([A-Za-z\s]+)\s+vs\.?\s+([A-Za-z\s]+)/i);
    if (vsMatch) {
      homeTeam = vsMatch[1].trim();
      awayTeam = vsMatch[2].trim();
    }
  }

  // 🆕 Normalisation MAJUSCULES : uniformiser l'affichage des noms d'équipes
  // (certaines sources retournent "La Rochelle", d'autres "LA ROCHELLE", d'autres "STADE TOULOUSAIN")
  // On force toUpperCase() pour cohérence visuelle, sauf pour les placeholders par défaut.
  if (homeTeam && homeTeam !== 'Équipe domicile') {
    homeTeam = homeTeam.toUpperCase();
  }
  if (awayTeam && awayTeam !== 'Équipe extérieure') {
    awayTeam = awayTeam.toUpperCase();
  }

  const dateObj = new Date(trans.created_at);
  const dateStr = dateObj.toLocaleDateString("fr-FR", { 
    weekday: 'short',
    day: "2-digit", 
    month: "short",
    year: "numeric"
  });
  const timeStr = dateObj.toLocaleTimeString("fr-FR", { 
    hour: "2-digit", 
    minute: "2-digit" 
  });

  const getIcon = () => {
    switch(trans.type) {
      case 'bet_won':
        return <Trophy className="w-5 h-5 text-green-500" />;
      case 'bet_lost':
        return <X className="w-5 h-5 text-red-500" />;
      case 'monthly_distribution':
        return <Gift className="w-5 h-5 text-blue-500" />;
      case 'initial_capital':
        return <Award className="w-5 h-5 text-purple-500" />;
      default:
        return <Coins className="w-5 h-5 text-gray-400" />;
    }
  };

  const getTitle = () => {
    switch(trans.type) {
      case 'bet_won':
        return 'Pari gagné';
      case 'bet_lost':
        return 'Pari perdu';
      case 'monthly_distribution':
        return 'Distribution mensuelle';
      case 'initial_capital':
        return 'Bonus de bienvenue';
      default:
        return 'Régularisation système';
    }
  };

  const isPari = trans.type === 'bet_won' || trans.type === 'bet_lost';

  return (
    <div 
      className={`p-4 bg-white border-l-4 hover:bg-gray-50 transition cursor-pointer mb-3 rounded-lg shadow-sm ${
        trans.type === 'bet_won' ? 'border-green-500' :
        trans.type === 'bet_lost' ? 'border-red-500' :
        trans.type === 'monthly_distribution' ? 'border-blue-500' :
        'border-purple-500'
      }`}
      onClick={() => (trans.type === 'bet_won' || trans.type === 'bet_lost') && trans.bet_id && navigateToBet(trans)}
    >
      {/* En-tête */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2 flex-1">
          {getIcon()}
          <div className="flex-1">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm">{getTitle()}</span>
                {periodLabel && (
                  <span className="px-2 py-0.5 text-[10px] rounded-full bg-gray-100 text-gray-600 border">
                    {periodLabel}
                  </span>
                )}
              </div>
              {/* Date et journée sous le titre */}
              <div className="flex items-center gap-1 text-xs text-gray-500">
                {match?.round && (
                  <>
                    {/* 🆕 v4 : préfixe "J" uniquement si round est un nombre (Top14/D2)
                         Pour HCup, le round est déjà textuel (ex: "Demi-finale") */}
                    <span className="font-semibold text-rugby-gold">
                      {/^\d+$/.test(String(match.round)) ? `J${match.round}` : match.round}
                    </span>
                    <span>•</span>
                  </>
                )}
                <span>{dateStr}</span>
                <span>•</span>
                <span>{timeStr}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Colonne droite : Montant + Solde */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
          <span className={`font-bold text-lg ${
            isPositive ? "text-green-600" : "text-red-600"
          }`}>
            {isPositive && '+'}{trans.amount}
          </span>
          {trans.balance_after !== null && trans.balance_after !== undefined && (
            <p className="text-xs text-gray-400">
              Solde: {trans.balance_after}
            </p>
          )}
        </div>
      </div>

      {/* Détails du match pour les paris */}
      {isPari && homeTeam && awayTeam && homeTeam !== 'Équipe domicile' && (
        <div className="space-y-2 mb-2">
          {/* Noms des équipes */}
          <div className="flex items-center gap-1 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg p-2">
            <span className="flex-1 truncate text-left" title={homeTeam}>{homeTeam}</span>
            <span className="text-gray-400 text-xs flex-shrink-0 px-1">vs</span>
            <span className="flex-1 truncate text-right" title={awayTeam}>{awayTeam}</span>
          </div>

          {/* Scores */}
          <div className="grid grid-cols-2 gap-2">
            {/* Ton pronostic */}
            <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
              <p className="text-[10px] text-blue-700 font-semibold mb-1">Ton pronostic</p>
              {/* 🆕 v3 : pari vainqueur → nom de l'équipe choisie */}
              {/* 🆕 v4 : supporter aussi DOM/EXT/NUL (HCup) en plus de domicile/exterieur/nul (Top14/D2) */}
              {/* 🆕 v5 : WINNER_MT traité comme WINNER_FT pour l'affichage du nom d'équipe */}
              {(isWinnerFT || isWinnerMT) ? (
                <p className="text-base font-bold text-blue-900 text-center">
                  🎯 {(winnerPredit === 'domicile' || winnerPredit === 'DOM') ? homeTeam
                    : (winnerPredit === 'exterieur' || winnerPredit === 'EXT') ? awayTeam
                    : (winnerPredit === 'nul' || winnerPredit === 'NUL') ? 'Match nul'
                    : '-'}
                  {isWinnerMT && <span className="block text-[10px] text-blue-600 font-normal mt-0.5">(mi-temps)</span>}
                </p>
              ) : (
                <p className="text-lg font-bold text-blue-900 text-center">
                  {pronoHome} - {pronoAway}
                </p>
              )}
            </div>

            {/* Score réel / Résultat */}
            {hasRealScore && (() => {
              // 🆕 v3 : calculer le vrai vainqueur pour les paris WINNER_FT
              // 🆕 v5 : idem pour WINNER_MT
              let realWinnerName = null;
              if (isWinnerFT || isWinnerMT) {
                if (realHome > realAway) realWinnerName = homeTeam;
                else if (realAway > realHome) realWinnerName = awayTeam;
                else realWinnerName = 'Match nul';
              }
              const isWon = trans.type === 'bet_won';
              return (
                <div className={`rounded-lg p-2 border ${
                  isWon 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <p className={`text-[10px] font-semibold mb-1 ${
                    isWon ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {(isWinnerFT || isWinnerMT) ? 'Résultat' : 'Score réel'}
                  </p>
                  {realWinnerName ? (
                    <>
                      <p className={`text-base font-bold text-center ${
                        isWon ? 'text-green-900' : 'text-red-900'
                      }`}>
                        {isWon ? '🎉' : '❌'} {realWinnerName}
                      </p>
                      <p className={`text-xs text-center ${
                        isWon ? 'text-green-700' : 'text-red-700'
                      }`}>
                        ({realHome} - {realAway})
                      </p>
                    </>
                  ) : (
                    <p className={`text-lg font-bold text-center ${
                      isWon ? 'text-green-900' : 'text-red-900'
                    }`}>
                      {realHome} - {realAway}
                    </p>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Détails du pari (cote, mise) */}
      {(odds || stake) && (
        <div className="flex flex-wrap gap-3 text-xs text-gray-600 bg-gray-50 rounded-lg p-2">
          {stake && (
            <span className="flex items-center gap-1">
              <span className="font-semibold">Mise:</span>
              <span className="font-bold text-gray-800">{stake} jetons</span>
            </span>
          )}
          {odds && (
            <span className="flex items-center gap-1">
              <span className="font-semibold">Cote:</span>
              <span className="font-bold text-gray-800">×{parseFloat(odds).toFixed(2)}</span>
            </span>
          )}
          {payout && (
            <span className="flex items-center gap-1">
              <span className="font-semibold">Gain:</span>
              <span className="font-bold text-green-600">{payout} jetons</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------
// Main Component
// ---------------------------------------------------------
export default function MaCagnotte() {
  const navigate = useNavigate();
  const { championnat, setChampionnat } = useChampionnat();
  const isD2 = championnat === 'prod2';
  const isHcup = championnat === 'hcup';
  const [user, setUser] = useState(null);
  const [userCredits, setUserCredits] = useState(null);
  const [userPoints, setUserPoints] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const loadingRef = useRef(false); // guard anti-boucle Realtime
  const [activeTab, setActiveTab] = useState("overview");
  
  const [sortMode, setSortMode] = useState("recent");
  const [teamFilter, setTeamFilter] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [stats, setStats] = useState({
    totalBets: 0,
    pendingBets: 0,
    wonBets: 0,
    lostBets: 0,
    totalStaked: 0,
    totalWonFromBets: 0,
    netProfit: 0,
    nbDistributions: 0
  });

  // ✅ userId dans un ref → stable entre les renders, pas de re-subscribe intempestif
  const userIdRef = useRef(null);
  useEffect(() => {
    userIdRef.current = user?.id ?? null;
  }, [user?.id]);

  // ✅ Refs stables pour le debounce
  const realtimeDebounceRef = useRef(null);
  const lastLoadAtRef = useRef(0);

  // ✅ debouncedLoadData dans un ref → référence stable pour useMemo ci-dessous
  // Pattern "always-fresh ref" : le ref est stable, .current pointe toujours sur
  // la dernière version de la fonction sans la mettre en dépendance de useMemo.
  const debouncedLoadDataRef = useRef(null);
  debouncedLoadDataRef.current = () => {
    const userId = userIdRef.current;
    if (!userId) return;
    if (realtimeDebounceRef.current) clearTimeout(realtimeDebounceRef.current);
    realtimeDebounceRef.current = setTimeout(() => {
      // Skip si chargement déjà en cours OU si dernier load < 2s
      const now = Date.now();
      if (loadingRef.current || now - lastLoadAtRef.current < 2000) {
        realtimeDebounceRef.current = null;
        return;
      }
      lastLoadAtRef.current = now;
      loadData(userId);
      realtimeDebounceRef.current = null;
    }, 1000);
  };

  // ✅ Tableau mémoïsé avec deps vides → référence stable pour toute la vie du composant.
  // CORRIGE le bug de boucle infinie : sans useMemo, un nouveau tableau était créé à
  // chaque render → useRealtimeSync re-subscribait à chaque render → accumulation de
  // channels Supabase → chaque event DB déclenchait N×5 callbacks → setLoading(true)
  // en boucle → scroll to top + spinner sans fin.
  const realtimeSubscriptions = useMemo(() => [
    { table: 'user_credits',        onUpdate: () => debouncedLoadDataRef.current() },
    { table: 'user_bets',           onUpdate: () => debouncedLoadDataRef.current() },
    { table: 'user_bets_d2',        onUpdate: () => debouncedLoadDataRef.current() },
    { table: 'user_bets_hcup',      onUpdate: () => debouncedLoadDataRef.current() },
    { table: 'credit_transactions', onUpdate: () => debouncedLoadDataRef.current() },
  ], []); // deps vides intentionnels — la stabilité est assurée par les refs

  useRealtimeSync(realtimeSubscriptions);

  // 🔧 Cleanup du timeout de debounce au démontage du composant
  useEffect(() => {
    return () => {
      if (realtimeDebounceRef.current) clearTimeout(realtimeDebounceRef.current);
    };
  }, []);

  // 🆕 Bouton "remonter en haut"
  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.pageYOffset > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  useEffect(() => {
    if (!user?.id) return;
    loadData(user.id);
  }, [user]);

  const loadData = async (userId) => {
    try {
      loadingRef.current = true;
      setLoading(true);

      const creditsResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/user/credits`,
        { headers: { "x-user-id": userId } }
      );
      setUserCredits(creditsResponse.data.credits || 0);

      const { data: userStatsData, error: statsError } = await supabase
        .from('user_stats')
        .select('total_points')
        .eq('user_id', userId)
        .eq('saison', getSaisonCourante())
        .single();

      if (!statsError && userStatsData) {
        setUserPoints(userStatsData.total_points || 0);
      }

      const API_BASE_D2 = 'https://top14-api-production.up.railway.app';
      const API_BASE_HCUP = 'https://top14-api-production.up.railway.app';

      // ✅ Charger paris Top 14 + Pro D2 + HCup en parallèle
      const [historyResponse, betsD2Response, betsHcupResponse] = await Promise.all([
        axios.get(
          `${import.meta.env.VITE_API_URL}/user/bets/detailed`,
          { headers: { "x-user-id": userId } }
        ),
        axios.get(
          `${API_BASE_D2}/api/d2/user/bets/detailed`,
          { headers: { "x-user-id": userId } }
        ).catch(() => ({ data: { bets: [] } })),
        axios.get(
          `${API_BASE_HCUP}/api/hcup/user/bets/detailed`,
          { headers: { "x-user-id": userId } }
        ).catch(() => ({ data: { bets: [] } })),
      ]);

      const txs = (historyResponse.data.transactions || []).map(t => {
        // 🆕 Normaliser les types HCup pour qu'ils soient traités comme des paris standards
        // (la fonction trigger SQL HCup utilise 'gain_pari_hcup' au lieu de 'bet_won')
        if (t.type === 'gain_pari_hcup') {
          return { ...t, type: 'bet_won', _championnat: 'hcup' };
        }
        if (t.type === 'perte_pari_hcup' || t.type === 'mise_pari_hcup') {
          // mise_pari_hcup : équivalent du bet_placed (sera filtré ensuite)
          // perte_pari_hcup : équivalent du bet_lost
          return { ...t, type: t.type === 'mise_pari_hcup' ? 'bet_placed' : 'bet_lost', _championnat: 'hcup' };
        }
        return t;
      });
      const betsTop14 = historyResponse.data.bets || [];

      // ✅ Normaliser les paris D2 au format attendu par le reste du composant
      const betsD2 = (betsD2Response.data.bets || []).map(b => ({
        ...b,
        championnat: 'prod2',
        placed_at: b.placed_at || b.created_at,
        result_at: b.result_at || b.resolved_at,
        matches: {
          id: b.match_id,
          home_team: b.equipe_domicile,
          away_team: b.equipe_exterieure,
          match_date: b.date_match,
          round: b.journee,
          score_domicile: b.score_reel_dom,
          score_exterieur: b.score_reel_ext,
          score_home: b.score_reel_dom,
          score_away: b.score_reel_ext,
          score_ht_domicile: null,
          score_ht_exterieur: null,
        }
      }));

      // ✅ Normaliser les paris HCup au format attendu par le reste du composant
      const betsHcup = (betsHcupResponse.data.bets || []).map(b => ({
        ...b,
        championnat: 'hcup',
        placed_at: b.placed_at || b.created_at,
        result_at: b.result_at || b.resolved_at,
        matches: {
          id: b.match_id,
          home_team: b.equipe_domicile,
          away_team: b.equipe_exterieure,
          match_date: b.date_match,
          round: b.round,
          // Utiliser le score à 80' pour la résolution des paris (cohérent avec la convention HCup)
          score_domicile: b.score_reel_dom ?? b.score_dom_80min,
          score_exterieur: b.score_reel_ext ?? b.score_ext_80min,
          score_home: b.score_reel_dom ?? b.score_dom_80min,
          score_away: b.score_reel_ext ?? b.score_ext_80min,
          // Score final officiel (pour info, en cas de prolongation)
          score_final_domicile: b.score_final_domicile,
          score_final_exterieur: b.score_final_exterieur,
          prolongation: b.prolongation,
          score_ht_domicile: null,
          score_ht_exterieur: null,
        }
      }));

      // ✅ Fusion Top 14 + Pro D2 + HCup
      const allBets = [
        ...betsTop14.map(b => ({ ...b, championnat: b.championnat || 'top14' })),
        ...betsD2,
        ...betsHcup,
      ];

      // ✅ Charger les match_results pour avoir les scores MT (score_ht_domicile / score_ht_exterieur)
      const matchIds = [...new Set(allBets.map(b => b.match_id).filter(Boolean))];
      let matchResultsMap = {};
      if (matchIds.length > 0) {
        const { data: matchResults } = await supabase
          .from('matchs_results')
          .select('id, score_ht_domicile, score_ht_exterieur, score_domicile, score_exterieur')
          .in('id', matchIds);
        if (matchResults) {
          matchResults.forEach(mr => {
            matchResultsMap[mr.id] = mr;
          });
        }
      }

      // ✅ Enrichir allBets avec les données match_results
      const enrichedBets = allBets.map(bet => {
        const mr = matchResultsMap[bet.match_id];
        if (!mr) return bet;
        return {
          ...bet,
          matches: {
            ...bet.matches,
            score_ht_domicile: mr.score_ht_domicile,
            score_ht_exterieur: mr.score_ht_exterieur,
          }
        };
      });

      // ✅ Filtrer les transactions existantes ET enrichir les orphelines
      const linkedBetIds = new Set(txs.filter(t => t.bet_id || t.reference_id).map(t => t.bet_id || t.reference_id));

      const transactionsFiltered = txs
        .filter(trans => trans.type !== 'bet_placed')
        .map(trans => {
          // Enrichir avec scores HT pour TOUTES les transactions qui ont un match lié
          const txBetId = trans.bet_id || trans.reference_id;
          const matchId = trans.bets?.match_id || 
            (txBetId ? enrichedBets.find(b => b.id === txBetId)?.match_id : null);
          const mr = matchId ? matchResultsMap[matchId] : null;

          if (mr) {
            // Transaction avec match déjà chargé → ajouter les scores HT
            if (trans.bets?.matches?.home_team) {
              return {
                ...trans,
                bets: {
                  ...trans.bets,
                  matches: {
                    ...trans.bets.matches,
                    score_ht_domicile: mr.score_ht_domicile,
                    score_ht_exterieur: mr.score_ht_exterieur,
                  }
                }
              };
            }
            // Transaction avec bet_id/reference_id mais sans match dans bets → enrichir depuis enrichedBets
            if (trans.bet_id || trans.reference_id) {
              const bet = enrichedBets.find(b => b.id === (trans.bet_id || trans.reference_id));
              if (bet) {
                return {
                  ...trans,
                  bets: {
                    ...bet,
                    matches: {
                      ...(bet.matches || {}),
                      score_ht_domicile: mr.score_ht_domicile,
                      score_ht_exterieur: mr.score_ht_exterieur,
                    }
                  }
                };
              }
              return trans;
            }
          }

          // Transaction avec bet_id/reference_id mais pas de match_results → enrichir depuis enrichedBets seulement
          if (trans.bet_id || trans.reference_id) {
            const bet = enrichedBets.find(b => b.id === (trans.bet_id || trans.reference_id));
            if (bet?.matches?.home_team) {
              return { ...trans, bets: bet };
            }
            return trans;
          }
          
          // Transaction orpheline (pas de bet_id) : chercher le pari correspondant
          if (trans.type === 'bet_won') {
            const betTypeFromDesc = trans.description?.includes('MT') ? 'MT' 
              : trans.description?.includes('FT') ? 'FT' : null;
            
            // Stratégie 1 : même type dans ±6h
            let matchingBet = betTypeFromDesc ? enrichedBets.find(b => 
              b.bet_type === betTypeFromDesc && 
              b.status === 'won' &&
              !linkedBetIds.has(b.id) &&
              b.result_at &&
              Math.abs(new Date(b.result_at) - new Date(trans.created_at)) < 6 * 60 * 60 * 1000
            ) : null;

            // Stratégie 2 : même montant de gain, même jour
            if (!matchingBet) {
              const txDate = new Date(trans.created_at).toDateString();
              matchingBet = enrichedBets.find(b => 
                b.status === 'won' &&
                !linkedBetIds.has(b.id) &&
                b.result_at &&
                new Date(b.result_at).toDateString() === txDate &&
                (b.payout || Math.floor(b.stake * (b.odds || 1))) === trans.amount
              );
            }

            // Stratégie 3 : même type, même jour (toute heure)
            if (!matchingBet && betTypeFromDesc) {
              const txDate = new Date(trans.created_at).toDateString();
              matchingBet = enrichedBets.find(b => 
                b.bet_type === betTypeFromDesc &&
                b.status === 'won' &&
                !linkedBetIds.has(b.id) &&
                (b.result_at || b.placed_at) &&
                new Date(b.result_at || b.placed_at).toDateString() === txDate
              );
            }

            if (matchingBet) {
              linkedBetIds.add(matchingBet.id);
              
              return {
                ...trans,
                bet_id: matchingBet.id,
                bets: { ...matchingBet, matches: matchingBet.matches }
              };
            } else {
              // 🔧 console.warn retiré pour éviter de polluer la console en cas de boucle
              // (les orphelines non résolues sont gérées silencieusement par le code en aval)
            }
          }
          return trans;
        });

      // ✅ AJOUTER les paris perdus manuellement (TOUS championnats : Top14 + Pro D2 + HCup)
      // 🆕 v7 : on inclut désormais Pro D2 et HCup car aucune credit_transaction native
      //         n'existe en BDD pour ces championnats (le commentaire historique "déjà
      //         des credit_transactions" était faux pour ces tables). Avec garde-fou
      //         anti-doublon basé sur bet_id, au cas où des transactions natives seraient
      //         créées plus tard via trigger SQL.
      const coveredLostBetIds = new Set(
        transactionsFiltered
          .filter(t => t.type === 'bet_lost' || t.type === 'perte_pari_hcup')
          .map(t => t.bet_id || t.reference_id)
          .filter(Boolean)
      );
      const lostBetsToAdd = enrichedBets.filter(b => b.status === 'lost');

      lostBetsToAdd.forEach(bet => {
        if (coveredLostBetIds.has(bet.id)) return;

        const placedTx = txs.find(t => t.type === 'bet_placed' && t.bet_id === bet.id);
        // balance_after pour un pari perdu = balance après la mise (= le solde déduit de la mise)
        // placedTx.balance_after est le solde APRES déduction de la mise → c'est le bon solde "résultant"
        // Pour HCup/Pro D2 : pas de bet_placed côté credit_transactions → balanceAfter = null
        const balanceAfter = placedTx?.balance_after ?? null;
        
        transactionsFiltered.push({
          id: `lost_${bet.id}`,
          type: 'bet_lost',
          amount: -bet.stake,
          balance_after: balanceAfter,
          created_at: bet.result_at || bet.placed_at,
          bet_id: bet.id,
          bets: {
            ...bet,
            matches: bet.matches, // déjà enrichi avec score_ht_* via enrichedBets
          }
        });
      });

      // ✅ AJOUTER les paris gagnés UNIQUEMENT s'ils n'ont pas déjà une transaction
      // Construire un Set complet des bet_ids déjà couverts (après enrichissement des orphelines)
      // 🆕 v4 : on regarde aussi reference_id (utilisé par les transactions HCup)
      const coveredWonBetIds = new Set(
        transactionsFiltered
          .filter(t => t.type === 'bet_won')
          .map(t => t.bet_id || t.reference_id)
          .filter(Boolean)
      );

      // ✅ Reconstruire les transactions bet_won manquantes pour les paris won orphelins
      // 🆕 v7 : on inclut désormais Pro D2 et HCup pour les mêmes raisons que ci-dessus.
      //         Le commentaire "D2/HCup ont déjà des credit_transactions" était faux.
      const wonBetsInBets = enrichedBets.filter(b => b.status === 'won');
      
      wonBetsInBets.forEach(bet => {
        if (coveredWonBetIds.has(bet.id)) return;
        
        const placedTx = txs.find(t => t.type === 'bet_placed' && t.bet_id === bet.id);
        const payout = bet.payout || Math.floor(bet.stake * (bet.odds || 1));
        const isTop14 = !bet.championnat || bet.championnat === 'top14';
        
        // Top14 : bet_placed existe en BDD → la mise est déjà déduite du solde
        //         → on affiche le payout brut (gain total)
        // HCup/Pro D2 : pas de bet_placed → la mise n'a pas été tracée séparément
        //               → on affiche le gain NET (payout - stake)
        const amount = isTop14 ? payout : (payout - bet.stake);
        
        transactionsFiltered.push({
          id: `won_${bet.id}`,
          type: 'bet_won',
          amount: amount,
          balance_after: placedTx?.balance_after ? placedTx.balance_after + payout : null,
          created_at: bet.result_at || bet.placed_at,
          bet_id: bet.id,
          bets: {
            ...bet,
            matches: bet.matches,
          }
        });
      });
      // 🔧 console.log retirés pour éviter de polluer la console

      setTransactions(transactionsFiltered);
      setBets(enrichedBets);

      const wonTxs = transactionsFiltered.filter((t) => t.type === "bet_won");
      const distributions = transactionsFiltered.filter((t) => t.type === "monthly_distribution");
      const totalDistributions = distributions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
      const bonusInitial = transactionsFiltered.find((t) => t.type === "initial_capital")?.amount || 0;
      // ✅ Utiliser bet.payout depuis enrichedBets (source de vérité = BDD)
      const totalWonFromBets = enrichedBets
        .filter(b => b.status === 'won')
        .reduce((sum, b) => sum + (b.payout || 0), 0);
      const totalStaked = enrichedBets.reduce((sum, b) => sum + (b.stake || 0), 0);

      const wonBets = enrichedBets.filter(b => b.status === 'won').length;
      const lostBets = enrichedBets.filter(b => b.status === 'lost').length;
      const pendingBets = enrichedBets.filter(b => b.status === 'pending').length;

      setStats({
        totalBets: wonBets + lostBets,
        pendingBets,
        wonBets,
        lostBets,
        totalStaked,
        totalWonFromBets,
        netProfit: totalWonFromBets - totalStaked,
        nbDistributions: distributions.length,
        totalDistributions,
        bonusInitial
      });

      loadingRef.current = false;
      setLoading(false);
    } catch (err) {
      console.error("Erreur chargement cagnotte:", err);
      loadingRef.current = false;
      setLoading(false);
    }
  };

  const navigateToBet = (trans) => {
    const matchId = trans.bets?.matches?.id;
    if (!matchId) return;
    const filterStatus = trans.type === 'bet_lost' ? 'lost' : 'won';

    // ✅ Détecter le championnat du pari et basculer si nécessaire
    const targetChampionnat = trans.bets?.championnat || 'top14';
    if (targetChampionnat !== championnat) {
      setChampionnat(targetChampionnat);
    }

    navigate(`/pronos?scrollToMatchId=${matchId}`, {
      state: { activeTab: "mes-paris", filterStatus },
    });
  };

  // Filtrer les transactions (SANS les paris en cours)
  const filteredTransactions = useMemo(() => {
    const filtered = transactions.filter((t) => {
      // ❌ Exclure les bet_placed (paris en cours)
      if (t.type === 'bet_placed') return false;
      
      // Filtrer par équipe si nécessaire (compare via le nom canonique)
      if (!teamFilter) return true;
      const match = t.bets?.matches;
      if (!match) return false;
      return (
        canonicalTeamName(match.home_team) === teamFilter ||
        canonicalTeamName(match.away_team) === teamFilter
      );
    });

    // ✅ Dédoublonner : une seule transaction par (match_id + bet_type + user)
    // 🆕 v4 : si on a un bet_id (ou reference_id), on l'utilise en priorité comme clé
    //         (plus fiable que match_id + bet_type, surtout pour HCup où bet_type peut être absent)
    // Garder celle avec le balance_after le plus élevé (la plus récente en cas de doublon)
    const seen = new Map();
    const deduped = filtered.filter(tx => {
      const txBetId = tx.bet_id || tx.reference_id;
      const matchId = tx.bets?.match_id || tx.bet_id;
      const betType = tx.bets?.bet_type || (tx.description?.includes('MT') ? 'MT' : tx.description?.includes('FT') ? 'FT' : null);

      // Pas un pari → toujours garder
      if (tx.type === 'monthly_distribution' || tx.type === 'initial_capital' || tx.type === 'system_adjustment') return true;

      // 🆕 Pour les paris : clé = (bet_id si dispo) ou (match_id + bet_type + type)
      const key = txBetId
        ? `bet_${txBetId}_${tx.type}`
        : (matchId ? `${matchId}_${betType}_${tx.type}` : null);

      if (!key) return true; // pas de clé → on garde

      if (seen.has(key)) {
        // Garder celui avec le balance_after le plus grand, ou le plus récent
        const prev = seen.get(key);
        const prevBalance = prev.balance_after || 0;
        const currBalance = tx.balance_after || 0;
        if (currBalance > prevBalance || new Date(tx.created_at) > new Date(prev.created_at)) {
          seen.set(key, tx);
        }
        return false;
      }
      seen.set(key, tx);
      return true;
    });

    const sortByBalanceCoherence = (a, b) => {
      const dateDiff = new Date(b.created_at) - new Date(a.created_at);
      if (dateDiff !== 0) return dateDiff;
      const ba = a.balance_after ?? -Infinity;
      const bb = b.balance_after ?? -Infinity;
      return bb - ba;
    };

    if (sortMode === "placed") {
      const getPlacedAt = (tx) => tx.bets?.placed_at || tx.created_at;
      deduped.sort((a, b) => new Date(getPlacedAt(b)) - new Date(getPlacedAt(a)));
      return deduped;
    }

    if (sortMode === "ancient") {
      // Ancien → Récent : tri ASC, balance_after ASC pour même timestamp
      deduped.sort((a, b) => {
        const dateDiff = new Date(a.created_at) - new Date(b.created_at);
        if (dateDiff !== 0) return dateDiff;
        return (a.balance_after ?? Infinity) - (b.balance_after ?? Infinity);
      });
      return deduped; // balance_after DB réelles — cohérentes au sein de chaque batch
    }

    // Récent → Ancien (défaut) : tri DESC + recalcul cohérent depuis userCredits
    // (la 1ère ligne = ton vrai solde, chaque ligne suivante = solde précédent - gain)
    deduped.sort(sortByBalanceCoherence);
    return deduped.reduce((acc, tx) => {
      if (acc.length === 0) {
        acc.push({ ...tx, balance_after: userCredits });
      } else {
        const prev = acc[acc.length - 1];
        acc.push({ ...tx, balance_after: (prev.balance_after ?? userCredits) - (prev.amount ?? 0) });
      }
      return acc;
    }, []);
  }, [transactions, teamFilter, sortMode, userCredits]);

  // 🆕 Dédup intelligente via getTeamData : "Bordeaux" et "Union Bordeaux Bègles"
  // (et variantes de casse / accents) sont mappés vers le même nom canonique.
  // canonicalTeamName est défini au niveau du fichier (top du module).
  //
  // 🆕 On garde TOUTES les équipes vues dans les paris (bets), pas seulement celles
  //    avec une transaction associée. Permet à Yoan de toujours voir l'équipe dans
  //    le dropdown même si elle n'a pas (encore) de transaction.
  //    Le compteur de transactions affiché sous le dropdown sert au diagnostic
  //    (cohérence avec Supabase).
  const teams = [...new Set(
    bets
      .map((b) => b.matches?.home_team)
      .concat(bets.map((b) => b.matches?.away_team))
      .filter(Boolean)
      .map(canonicalTeamName)
  )].sort();

  // 🆕 Comptage des transactions par équipe canonique (pour affichage dans le dropdown)
  //    Une transaction compte pour ses 2 équipes (home + away).
  //    Les bet_placed sont exclus car on les filtre dans le useMemo principal.
  const teamCounts = useMemo(() => {
    const counts = {};
    transactions.forEach(t => {
      if (t.type === 'bet_placed') return;
      const match = t.bets?.matches;
      if (!match) return;
      const home = canonicalTeamName(match.home_team);
      const away = canonicalTeamName(match.away_team);
      if (home) counts[home] = (counts[home] || 0) + 1;
      if (away && away !== home) counts[away] = (counts[away] || 0) + 1;
    });
    return counts;
  }, [transactions]);

  // 🆕 Trier les équipes par nombre de transactions décroissant (puis alphabétique)
  const teamsSorted = [...teams].sort((a, b) => {
    const ca = teamCounts[a] || 0;
    const cb = teamCounts[b] || 0;
    if (cb !== ca) return cb - ca;
    return a.localeCompare(b);
  });

  // 🆕 Décomposition par championnat (pour diagnostic du total)
  const transactionsByChamp = useMemo(() => {
    const stats = { top14: 0, prod2: 0, hcup: 0, autre: 0 };
    transactions.forEach(t => {
      const champ = t.bets?.championnat || t._championnat;
      if (champ === 'prod2') stats.prod2++;
      else if (champ === 'hcup') stats.hcup++;
      else if (champ === 'top14' || !champ) stats.top14++;
      else stats.autre++;
    });
    return stats;
  }, [transactions]);

  const winRate = stats.totalBets > 0
    ? ((stats.wonBets / stats.totalBets) * 100).toFixed(1)
    : 0;
  const roi = stats.totalStaked > 0
    ? (((stats.totalWonFromBets - stats.totalStaked) / stats.totalStaked) * 100).toFixed(1)
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

        <div className="max-w-md mx-auto px-4 pb-4 grid grid-cols-2 gap-3">
          {/* 🆕 Clic sur Jetons → bascule sur l'onglet Historique des transactions */}
          <button
            type="button"
            onClick={() => setActiveTab("transactions")}
            className="group bg-white/20 backdrop-blur-sm rounded-lg p-3 border-2 border-white/40 hover:bg-white/30 hover:border-white/60 hover:shadow-lg active:scale-95 transition-all text-left cursor-pointer"
            aria-label="Voir l'historique des transactions"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-white" />
                <p className="text-xs text-white/90 font-semibold">Jetons</p>
              </div>
              <ChevronRight className="w-4 h-4 text-white/70 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
            </div>
            <p className="text-2xl font-bold text-white">{userCredits || 0}</p>
            <p className="text-[10px] text-white/80 mt-0.5">Voir l'historique →</p>
          </button>

          {/* 🆕 Clic sur Points → ouvre la page dédiée /mes-points */}
          <button
            type="button"
            onClick={() => navigate('/mes-points')}
            className="group bg-white/20 backdrop-blur-sm rounded-lg p-3 border-2 border-white/40 hover:bg-white/30 hover:border-white/60 hover:shadow-lg active:scale-95 transition-all text-left cursor-pointer"
            aria-label="Voir l'historique des points"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-white" />
                <p className="text-xs text-white/90 font-semibold">Points</p>
              </div>
              <ChevronRight className="w-4 h-4 text-white/70 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
            </div>
            <p className="text-2xl font-bold text-white">{userPoints}</p>
            <p className="text-[10px] text-white/80 mt-0.5">Voir le détail →</p>
          </button>
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
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <p className="text-xs text-green-700 font-semibold">Total gagné</p>
              </div>
              <p className="text-2xl font-bold text-green-600">{stats.totalWonFromBets}</p>
            </div>

            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-5 h-5 text-red-600" />
                <p className="text-xs text-red-700 font-semibold">Total misé</p>
              </div>
              <p className="text-2xl font-bold text-red-600">{stats.totalStaked}</p>
            </div>
          </div>

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

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-semibold text-gray-700">Distributions mensuelles</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-blue-600">{stats.nbDistributions}</span>
                <span className="text-lg font-semibold text-blue-500 ml-2">/ {stats.totalDistributions}</span>
              </div>
            </div>
            <p className="text-xs text-gray-600">reçues / jetons cumulés</p>
            {stats.bonusInitial > 0 && (
              <p className="text-xs text-gray-500 mt-1">Solde de bienvenue : {stats.bonusInitial}</p>
            )}
          </div>

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

          <button
            onClick={() => navigate('/pronos', { state: { activeTab: 'mes-paris' } })}
            className="w-full bg-rugby-gold text-white py-3 rounded-lg font-semibold hover:bg-rugby-bronze transition-colors shadow-md"
          >
            Voir mes paris
          </button>
        </div>
      ) : (
        <div className="p-6 space-y-4">
          <div className="sticky top-16 z-30 bg-white/90 backdrop-blur-md border-b border-gray-200 pb-3 pt-4 -mx-6 px-6">
            <h2 className="text-lg font-bold text-rugby-gold flex items-center gap-2 mb-3">
              <History className="w-5 h-5" />
              Historique des transactions
            </h2>

            <div className="mb-3 max-w-md mx-auto">
              <PremiumDropdown
                label="Toutes les équipes"
                value={teamFilter}
                onChange={setTeamFilter}
                fullWidthMenu={true}
                options={[
                  { value: "", label: `Toutes les équipes (${Object.values(teamCounts).reduce((a, b) => a + b, 0)})` },
                  ...teamsSorted.map(t => ({
                    value: t,
                    label: `${(t || '').toUpperCase()} (${teamCounts[t] || 0})`
                  }))
                ]}
              />
            </div>

            {/* 🆕 Compteur de diagnostic enrichi : total + décomposition par championnat */}
            <div className="text-center text-xs text-gray-500 mb-3">
              <div>
                {transactions.length} transactions chargées au total
                {teamFilter && (
                  <>
                    {' '}•{' '}
                    <strong className="text-rugby-gold">
                      {filteredTransactions.length}
                    </strong>
                    {' '}pour <strong>{teamFilter.toUpperCase()}</strong>
                  </>
                )}
              </div>
              <div className="mt-0.5 text-[10px] text-gray-400">
                Top14: {transactionsByChamp.top14}
                {' • '}Pro D2: {transactionsByChamp.prod2}
                {' • '}HCup: {transactionsByChamp.hcup}
                {transactionsByChamp.autre > 0 && <> {' • '}Autre: {transactionsByChamp.autre}</>}
              </div>
            </div>

            {/* ✅ BANDEAUX PARIS EN COURS — séparés par championnat */}
            {(() => {
              const pendingTop14 = bets.filter(b => b.status === 'pending' && (!b.championnat || b.championnat === 'top14'));
              const pendingD2    = bets.filter(b => b.status === 'pending' && b.championnat === 'prod2');
              const pendingHcup  = bets.filter(b => b.status === 'pending' && b.championnat === 'hcup');

              const stakeTop14 = pendingTop14.reduce((sum, b) => sum + (b.stake || 0), 0);
              const stakeD2    = pendingD2.reduce((sum, b) => sum + (b.stake || 0), 0);
              const stakeHcup  = pendingHcup.reduce((sum, b) => sum + (b.stake || 0), 0);

              // Handler pour aller vers l'onglet Mes paris d'un championnat précis
              const goToMesParis = (targetChampionnat) => {
                if (targetChampionnat !== championnat) {
                  setChampionnat(targetChampionnat);
                }
                navigate('/pronos', {
                  state: { activeTab: 'mes-paris', filterStatus: 'pending' }
                });
              };

              if (pendingTop14.length === 0 && pendingD2.length === 0 && pendingHcup.length === 0) return null;

              return (
                <div className="space-y-2 mb-4">
                  {/* Bandeau Top 14 */}
                  {pendingTop14.length > 0 && (
                    <div className="bg-orange-50 border-l-4 border-orange-500 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="w-5 h-5 text-orange-500" />
                          <div>
                            <p className="text-sm font-semibold text-orange-900">
                              🏆 Top 14 — {pendingTop14.length} pari{pendingTop14.length > 1 ? 's' : ''} en cours
                            </p>
                            <p className="text-xs text-orange-700">
                              Mise totale : {stakeTop14} jetons
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => goToMesParis('top14')}
                          className="px-3 py-1.5 bg-orange-500 text-white text-xs font-semibold rounded-lg hover:bg-orange-600 transition"
                        >
                          Voir
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Bandeau Pro D2 */}
                  {pendingD2.length > 0 && (
                    <div
                      className="border-l-4 rounded-lg p-3"
                      style={{ backgroundColor: '#97C1FE1A', borderColor: '#00174D' }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="w-5 h-5" style={{ color: '#00174D' }} />
                          <div>
                            <p className="text-sm font-semibold" style={{ color: '#00174D' }}>
                              🥈 Pro D2 — {pendingD2.length} pari{pendingD2.length > 1 ? 's' : ''} en cours
                            </p>
                            <p className="text-xs" style={{ color: '#002D6B' }}>
                              Mise totale : {stakeD2} jetons
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => goToMesParis('prod2')}
                          className="px-3 py-1.5 text-white text-xs font-semibold rounded-lg transition"
                          style={{ backgroundColor: '#00174D' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#002D6B'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#00174D'}
                        >
                          Voir
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Bandeau Champions Cup */}
                  {pendingHcup.length > 0 && (
                    <div
                      className="border-l-4 rounded-lg p-3"
                      style={{ backgroundColor: '#FFC72C1A', borderColor: '#003E7E' }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="w-5 h-5" style={{ color: '#003E7E' }} />
                          <div>
                            <p className="text-sm font-semibold" style={{ color: '#003E7E' }}>
                              ⭐ Champions Cup — {pendingHcup.length} pari{pendingHcup.length > 1 ? 's' : ''} en cours
                            </p>
                            <p className="text-xs" style={{ color: '#002857' }}>
                              Mise totale : {stakeHcup} jetons
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => goToMesParis('hcup')}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg transition"
                          style={{ backgroundColor: '#003E7E', color: '#FFC72C' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#002857'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#003E7E'}
                        >
                          Voir
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Liste */}
          {filteredTransactions.length === 0 ? (
            <div className="p-8 text-center">
              <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Aucune transaction</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map(trans => (
                <TransactionItem 
                  key={trans.id} 
                  trans={trans} 
                  navigateToBet={navigateToBet}
                  getTeamData={getTeamData}
                  bets={bets}  // ✅ Ajouter cette prop
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 🆕 Bouton remonter en haut */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-24 right-4 z-50 w-11 h-11 rounded-full bg-rugby-gold text-white shadow-lg flex items-center justify-center hover:bg-rugby-bronze transition-all duration-200 active:scale-95"
          aria-label="Remonter en haut"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>
      )}
    </div>
  );
}