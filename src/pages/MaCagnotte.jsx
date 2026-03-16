import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Coins, TrendingUp, TrendingDown, Trophy, 
  DollarSign, History, Gift, Award, Clock, Info, X
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

  // ✅ Calculer isFT/isMT depuis toutes les sources disponibles
  const betType = fullBet?.bet_type || trans.bets?.bet_type;
  const isFT = betType === 'FT' || trans.description?.includes('FT');
  const isMT = betType === 'MT' || trans.description?.includes('MT');
  const periodLabel = isFT ? 'Temps plein' : isMT ? 'Mi-temps' : '';

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
      onClick={() => trans.type === 'bet_won' && trans.bet_id && navigateToBet(trans)}
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
                    <span className="font-semibold text-rugby-gold">J{match.round}</span>
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
          <div className="flex items-center justify-between text-sm font-medium text-gray-700 bg-gray-50 rounded-lg p-2">
            <span>{homeTeam}</span>
            <span className="text-gray-400">vs</span>
            <span>{awayTeam}</span>
          </div>

          {/* Scores */}
          <div className="grid grid-cols-2 gap-2">
            {/* Ton pronostic */}
            <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
              <p className="text-[10px] text-blue-700 font-semibold mb-1">Ton pronostic</p>
              <p className="text-lg font-bold text-blue-900 text-center">
                {pronoHome} - {pronoAway}
              </p>
            </div>

            {/* Score réel */}
            {hasRealScore && (
              <div className={`rounded-lg p-2 border ${
                trans.type === 'bet_won' 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <p className={`text-[10px] font-semibold mb-1 ${
                  trans.type === 'bet_won' ? 'text-green-700' : 'text-red-700'
                }`}>
                  Score réel
                </p>
                <p className={`text-lg font-bold text-center ${
                  trans.type === 'bet_won' ? 'text-green-900' : 'text-red-900'
                }`}>
                  {realHome} - {realAway}
                </p>
              </div>
            )}
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

  const [user, setUser] = useState(null);
  const [userCredits, setUserCredits] = useState(null);
  const [userPoints, setUserPoints] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  
  const [sortMode, setSortMode] = useState("recent");
  const [teamFilter, setTeamFilter] = useState("");

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
        .eq('saison', '2025-2026')
        .single();

      if (!statsError && userStatsData) {
        setUserPoints(userStatsData.total_points || 0);
      }

      const historyResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/user/bets/detailed`,
        { headers: { "x-user-id": userId } }
      );

      const txs = historyResponse.data.transactions || [];
      const allBets = historyResponse.data.bets || [];

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
              console.log('✅ Orpheline enrichie:', trans.id, '→', matchingBet.id, matchingBet.bet_type);
              return {
                ...trans,
                bet_id: matchingBet.id,
                bets: { ...matchingBet, matches: matchingBet.matches }
              };
            } else {
              console.warn('⚠️ Orpheline non résolue:', trans.id, 
                '| desc:', trans.description, 
                '| date:', trans.created_at, 
                '| amount:', trans.amount,
                '| paris MT won disponibles:', enrichedBets.filter(b => b.status==='won' && b.bet_type==='MT' && !linkedBetIds.has(b.id)).map(b => ({id:b.id.slice(0,8), result_at:b.result_at}))
              );
            }
          }
          return trans;
        });

      // ✅ AJOUTER les paris perdus manuellement
      const lostBetsToAdd = enrichedBets.filter(b => b.status === 'lost');
      
      lostBetsToAdd.forEach(bet => {
        const placedTx = txs.find(t => t.type === 'bet_placed' && t.bet_id === bet.id);
        // balance_after pour un pari perdu = balance après la mise (= le solde déduit de la mise)
        // placedTx.balance_after est le solde APRES déduction de la mise → c'est le bon solde "résultant"
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
      const coveredWonBetIds = new Set(
        transactionsFiltered
          .filter(t => t.type === 'bet_won' && t.bet_id)
          .map(t => t.bet_id)
      );

      const wonBetsInBets = enrichedBets.filter(b => b.status === 'won');
      
      wonBetsInBets.forEach(bet => {
        if (coveredWonBetIds.has(bet.id)) {
          // Déjà couvert → pas de doublon
          return;
        }
        
        console.log('⚠️ Transaction bet_won manquante pour pari:', bet.id, bet.bet_type);
        const placedTx = txs.find(t => t.type === 'bet_placed' && t.bet_id === bet.id);
        const payout = bet.payout || Math.floor(bet.stake * (bet.odds || 1));
        
        transactionsFiltered.push({
          id: `won_${bet.id}`,
          type: 'bet_won',
          amount: payout,
          balance_after: placedTx?.balance_after ? placedTx.balance_after + payout : null,
          created_at: bet.result_at || bet.placed_at,
          bet_id: bet.id,
          bets: {
            ...bet,
            matches: bet.matches,
          }
        });
      });

      console.log('🔍 DEBUG - Transactions après ajout lost:', transactionsFiltered.length);
      console.log('🔍 DEBUG - Types après ajout:', [...new Set(transactionsFiltered.map(t => t.type))]);

      setTransactions(transactionsFiltered);
      setBets(enrichedBets);

      const wonTxs = transactionsFiltered.filter((t) => t.type === "bet_won");
      const distributions = transactionsFiltered.filter((t) => t.type === "monthly_distribution");
      const totalDistributions = distributions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
      const bonusInitial = transactionsFiltered.find((t) => t.type === "initial_capital")?.amount || 0;
      const totalWonFromBets = wonTxs.reduce((sum, tx) => sum + (tx.amount || 0), 0);
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

  // Filtrer les transactions (SANS les paris en cours)
  const filteredTransactions = useMemo(() => {
    const filtered = transactions.filter((t) => {
      // ❌ Exclure les bet_placed (paris en cours)
      if (t.type === 'bet_placed') return false;
      
      // Filtrer par équipe si nécessaire
      if (!teamFilter) return true;
      const match = t.bets?.matches;
      if (!match) return false;
      return (
        match.home_team?.includes(teamFilter) ||
        match.away_team?.includes(teamFilter)
      );
    });

    // ✅ Dédoublonner : une seule transaction par (match_id + bet_type + user)
    // Garder celle avec le balance_after le plus élevé (la plus récente en cas de doublon)
    const seen = new Map();
    const deduped = filtered.filter(tx => {
      const matchId = tx.bets?.match_id || tx.bet_id;
      const betType = tx.bets?.bet_type || (tx.description?.includes('MT') ? 'MT' : tx.description?.includes('FT') ? 'FT' : null);
      // Pas un pari → toujours garder
      if (!matchId || tx.type === 'monthly_distribution' || tx.type === 'initial_capital' || tx.type === 'system_adjustment') return true;
      const key = `${matchId}_${betType}_${tx.type}`;
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

    if (sortMode === "recent") {
      deduped.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else {
      deduped.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    }

    // ✅ Recalculer les soldes de façon cohérente
    // Trier chronologiquement pour recalculer, puis remettre dans l'ordre voulu
    const chronological = [...deduped].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    
    // Trouver le solde de départ (le plus ancien solde connu)
    let runningBalance = null;
    for (const tx of chronological) {
      if (tx.balance_after !== null && tx.balance_after !== undefined) {
        runningBalance = tx.balance_after - tx.amount;
        break;
      }
    }

    // Recalculer tous les balance_after en partant du début
    if (runningBalance !== null) {
      const balanceMap = {};
      for (const tx of chronological) {
        runningBalance += tx.amount;
        balanceMap[tx.id] = runningBalance;
      }
      // Appliquer les soldes recalculés
      return deduped.map(tx => ({
        ...tx,
        balance_after: balanceMap[tx.id] ?? tx.balance_after
      }));
    }

    return deduped;
  }, [transactions, teamFilter, sortMode]);

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
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
            <div className="flex items-center gap-2 mb-1">
              <Coins className="w-4 h-4 text-white" />
              <p className="text-xs text-white/90 font-semibold">Jetons</p>
            </div>
            <p className="text-2xl font-bold text-white">{userCredits || 0}</p>
          </div>

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

            <div className="grid grid-cols-2 gap-3 mb-3">
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

            {/* ✅ BANDEAU PARIS EN COURS */}
            {(() => {
              const pendingBets = bets.filter(b => b.status === 'pending');
              const totalStakePending = pendingBets.reduce((sum, b) => sum + (b.stake || 0), 0);
              
              if (pendingBets.length === 0) return null;
              
              return (
                <div className="bg-orange-50 border-l-4 border-orange-500 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-orange-500" />
                      <div>
                        <p className="text-sm font-semibold text-orange-900">
                          {pendingBets.length} pari{pendingBets.length > 1 ? 's' : ''} en cours
                        </p>
                        <p className="text-xs text-orange-700">
                          Mise totale : {totalStakePending} jetons
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate('/pronos', { state: { activeTab: 'mes-paris', filterStatus: 'pending' } })}
                      className="px-3 py-1.5 bg-orange-500 text-white text-xs font-semibold rounded-lg hover:bg-orange-600 transition"
                    >
                      Voir
                    </button>
                  </div>
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
    </div>
  );
}