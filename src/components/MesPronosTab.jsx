// ============================================
// MES PRONOS - VERSION AVEC SUPPORT PRO D2
// ============================================

import { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronDown, ChevronUp, Coins, TrendingUp, FileText } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import axios from 'axios';
import BettingModal from './BettingModal';
import MatchCard from './MatchCard';
import ReglementModal from './ReglementModal';
import { useRealtimeSync } from '../hooks/useRealtimeSync';
import { useChampionnat } from '../contexts/ChampionnatContext';

const API_BASE = 'https://top14-api-production.up.railway.app';

export default function MesPronosTab({ goToMesParis }) {
  const { isD2 } = useChampionnat();  // ✅ Lecture du championnat actif

  const [matchsDisponibles, setMatchsDisponibles] = useState([]);
  const [mesPronos, setMesPronos] = useState([]);
  const [userCredits, setUserCredits] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showReglementModal, setShowReglementModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  // 🆕 v3 : valeur préselectionnée pour le mode vainqueur (D2 only)
  const [preselectedWinner, setPreselectedWinner] = useState(null);
  const [expandedJournees, setExpandedJournees] = useState(new Set());
  const [headerVisible, setHeaderVisible] = useState(true);
  const [parisOuverts, setParisOuverts] = useState(true);
  const [journeeIncomplete, setJourneeIncomplete] = useState(null);
  const lastScrollY = useRef(0);

  // Ref stable pour capturer isD2 dans les closures async
  const isD2Ref = useRef(isD2);
  useEffect(() => { isD2Ref.current = isD2; }, [isD2]);

  // ✅ Realtime — tables différentes selon championnat
  useRealtimeSync([
    { table: isD2 ? 'user_bets_d2' : 'user_bets', onUpdate: () => loadData() },
    { table: 'user_credits', onUpdate: () => loadData() },
    { table: isD2 ? 'match_cotes_d2' : 'match_cotes', onUpdate: () => loadData() },
    ...(isD2 ? [] : [{ table: 'matchs_results', onUpdate: () => loadData() }]),
  ]);

  useEffect(() => {
    loadData();
    setExpandedJournees(new Set()); // Reset à chaque switch championnat
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isD2]);

  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY;
      const threshold = 5;
      if (current < 10) setHeaderVisible(true);
      else if (current - lastScrollY.current > threshold) setHeaderVisible(false);
      else if (lastScrollY.current - current > threshold) setHeaderVisible(true);
      lastScrollY.current = current;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const loadData = async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const useD2 = isD2Ref.current;

      // ✅ URLs selon championnat
      const matchsUrl = useD2 ? `${API_BASE}/api/d2/matchs/a-venir` : `${API_BASE}/api/matchs/a-venir`;
      const cotesUrl  = useD2 ? `${API_BASE}/api/d2/cotes/all`     : `${API_BASE}/api/cotes/all`;

      const [matchsResponse, cotesResponse] = await Promise.all([
        axios.get(matchsUrl),
        axios.get(cotesUrl),
      ]);

      const cotesArray = Array.isArray(cotesResponse.data)
        ? cotesResponse.data
        : (cotesResponse.data?.cotes || []);

      const cotesMap = {};
      cotesArray.forEach(cote => {
        cotesMap[cote.match_id] = useD2
          ? {
              // Pro D2 : FT uniquement
              cote_domicile:     cote.cote_domicile,
              cote_exterieur:    cote.cote_exterieur,
              cote_nul:          cote.cote_nul,
              proba_domicile:    cote.proba_domicile,
              proba_exterieur:   cote.proba_exterieure,
              score_predit_dom:  cote.score_predit_dom,
              score_predit_ext:  cote.score_predit_ext,
            }
          : {
              // Top 14 : FT + MT
              cote_domicile:        cote.cote_domicile,
              cote_exterieur:       cote.cote_exterieur,
              cote_nul:             cote.cote_nul,
              proba_domicile:       cote.proba_domicile,
              proba_exterieur:      cote.proba_exterieur,
              score_predit_dom:     cote.score_predit_dom,
              score_predit_ext:     cote.score_predit_ext,
              cote_mt_domicile:     cote.cote_mt_domicile,
              cote_mt_exterieur:    cote.cote_mt_exterieur,
              cote_mt_nul:          cote.cote_mt_nul,
              proba_mt_domicile:    cote.proba_mt_domicile,
              proba_mt_exterieur:   cote.proba_mt_exterieur,
              score_predit_mt_dom:  cote.score_predit_mt_dom,
              score_predit_mt_ext:  cote.score_predit_mt_ext,
              match_start_time:     cote.match_start_time,
              halftime_start_time:  cote.halftime_start_time,
              halftime_duration:    cote.halftime_duration,
            };
      });

      const matchsAvecCotes = (matchsResponse.data.matchs || []).map(match => ({
        ...match,
        match_id: match.id || match.match_id,
        date_match: match.date || match.date_match,
        cotes: cotesMap[match.id || match.match_id] || null,
      }));

      setMatchsDisponibles(matchsAvecCotes);

      // Expand la première journée UNIQUEMENT si aucune n'est ouverte
      // (au premier chargement OU après un switch de championnat qui a reset le Set)
      if (matchsAvecCotes.length > 0) {
        const matchsParJournee = matchsAvecCotes.reduce((acc, m) => {
          if (!acc[m.journee]) acc[m.journee] = [];
          acc[m.journee].push(m);
          return acc;
        }, {});
        const journees = Object.keys(matchsParJournee).sort((a, b) =>
          parseInt(String(a).replace('J', '')) - parseInt(String(b).replace('J', ''))
        );
        if (journees.length > 0) {
          // ✅ setter fonctionnel pour lire la valeur à jour (après le reset sur switch championnat)
          setExpandedJournees(prev => prev.size === 0 ? new Set([journees[0]]) : prev);
        }
      }

      // ✅ Mes pronos selon championnat
      if (useD2) {
        try {
          const betsRes = await axios.get(`${API_BASE}/api/d2/user/bets/detailed`, {
            headers: { 'x-user-id': user.id }
          });
          // Transforme les paris D2 pour correspondre au format attendu par MatchCard
          const pronosD2 = (betsRes.data.bets || []).map(b => ({
            match_id: b.match_id,
            bet_type: b.bet_type,
            status: b.status,
            score_dom_pronos: b.score_domicile,
            score_ext_pronos: b.score_exterieur,
            score_domicile: b.score_domicile,
            score_exterieur: b.score_exterieur,
            winner_predit: b.winner_predit,  // 🆕 pour pari WINNER_FT
            odds: b.odds,                     // 🆕 utile pour affichage
            stake: b.stake,                   // 🆕 utile pour affichage
            potential_win: b.potential_win,   // 🆕 utile pour affichage
          }));
          setMesPronos(pronosD2);
        } catch (e) {
          console.error('Erreur chargement paris D2:', e);
          setMesPronos([]);
        }
      } else {
        const { data: pronos, error } = await supabase
          .from('user_pronos_view')
          .select('*')
          .eq('user_id', user.id)
          .neq('status', 'cancelled')
          .order('journee', { ascending: true });
        if (!error) setMesPronos(pronos || []);
      }

      // Crédits (communs Top14 + D2)
      try {
        const creditsResponse = await axios.get(`${API_BASE}/api/user/credits`, {
          headers: { 'x-user-id': user.id }
        });

        // Total gagné : agréger user_bets + user_bets_d2
        const [{ data: wonTop14 }, { data: wonD2 }] = await Promise.all([
          supabase.from('user_bets').select('payout').eq('user_id', user.id).eq('status', 'won'),
          supabase.from('user_bets_d2').select('payout').eq('user_id', user.id).eq('status', 'won'),
        ]);

        const totalWonFromBets =
          (wonTop14 || []).reduce((s, b) => s + (b.payout || 0), 0) +
          (wonD2 || []).reduce((s, b) => s + (b.payout || 0), 0);

        setUserCredits({ ...creditsResponse.data, totalWonFromBets });
      } catch {
        setUserCredits({ credits: 1000, total_earned: 0, totalWonFromBets: 0 });
      }

      // Statut paris ouverts (Top 14 uniquement pour l'instant)
      if (!useD2) {
        try {
          const statutRes = await axios.get(`${API_BASE}/api/paris/statut`);
          setParisOuverts(statutRes.data.ouverts);
          setJourneeIncomplete(statutRes.data.journee_incomplete);
        } catch {
          setParisOuverts(true);
        }
      } else {
        setParisOuverts(true);
        setJourneeIncomplete(null);
      }

    } catch (error) {
      console.error('Erreur chargement data:', error);
    } finally {
      setLoading(false);
    }
  };

  const ouvrirModal = (match, clickedWinner = null) => {
    if (!parisOuverts) return;

    const journeesSorted = [...new Set(matchsDisponibles.map(m => m.journee))]
      .sort((a, b) => parseInt(String(a).replace('J', '')) - parseInt(String(b).replace('J', '')));
    const prochaineJournee = journeesSorted[0];
    if (match.journee !== prochaineJournee) return;

    const dejaPronos = mesPronos.filter(p =>
      p.match_id === match.match_id && p.status !== 'cancelled'
    );
    // 🆕 Détection : un pari FT OU WINNER_FT bloque tout autre pari sur ce match
    const hasFT = dejaPronos.some(p => p.bet_type === 'FT' || p.bet_type === 'WINNER_FT');
    const hasMT = !isD2 && dejaPronos.some(p => p.bet_type === 'MT');

    // En D2 : si un pari (FT ou WINNER_FT) déjà pris, on ouvre Mes Paris
    // En Top14 : si FT + MT pris, on ouvre Mes Paris
    if (isD2 ? hasFT : (hasFT && hasMT)) {
      goToMesParis?.();
      return;
    }

    // 🆕 v3 : stocker le vainqueur cliqué pour pré-sélection (D2 only)
    setPreselectedWinner(clickedWinner);
    setSelectedMatch(match);
    setShowModal(true);
  };

  const fermerModal = () => {
    setShowModal(false);
    setSelectedMatch(null);
    setPreselectedWinner(null);
  };

  const toggleJournee = (journee) => {
    // ✅ Accordéon exclusif : ferme toutes les autres journées, n'en garde qu'une
    // Si on re-clique sur la journée déjà ouverte, on la ferme (Set vide)
    setExpandedJournees(prev => {
      if (prev.has(journee)) {
        return new Set(); // toutes fermées
      }
      return new Set([journee]); // uniquement celle-ci ouverte
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-rugby-gold"></div>
      </div>
    );
  }

  const matchsParJournee = matchsDisponibles.reduce((acc, match) => {
    if (!acc[match.journee]) acc[match.journee] = [];
    acc[match.journee].push(match);
    return acc;
  }, {});

  const journees = Object.keys(matchsParJournee).sort((a, b) =>
    parseInt(String(a).replace('J', '')) - parseInt(String(b).replace('J', ''))
  );

  const journeesSorted = [...new Set(matchsDisponibles.map(m => m.journee))]
    .sort((a, b) => parseInt(String(a).replace('J', '')) - parseInt(String(b).replace('J', '')));
  const prochaineJournee = journeesSorted[0];

  // Couleurs selon championnat
  const bandeauBg = isD2
    ? 'bg-gradient-to-r from-[#00174D] to-[#97C1FE]'
    : 'bg-gradient-to-r from-rugby-gold to-rugby-bronze';

  const headerBg = isD2 ? 'bg-[#97C1FE]/10 hover:bg-[#97C1FE]/20' : 'bg-rugby-gold/10 hover:bg-rugby-gold/20';
  const headerIconColor = isD2 ? 'text-[#97C1FE]' : 'text-rugby-gold';

  return (
    <div className="space-y-3">

      {/* BANDEAU CAGNOTTE */}
      <div className={`${bandeauBg} rounded-lg p-4 shadow-lg`}>
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
              {userCredits?.totalWonFromBets || 0}
            </p>
          </button>
        </div>
      </div>

      {/* Badge championnat en mode D2 */}
      {isD2 && (
        <div className="flex items-center justify-center gap-2 px-4 py-2 bg-[#00174D] rounded-lg w-fit mx-auto">
          <span className="text-xs font-bold text-[#C0C0C0] uppercase tracking-wide">🏉 Mode Pro D2 — Paris FT uniquement</span>
        </div>
      )}

      {/* Message blocage paris (Top 14 uniquement) */}
      {!isD2 && !parisOuverts && journeeIncomplete && (
        <div className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-50 rounded-lg border border-orange-200 w-fit mx-auto mb-3">
          <span className="text-lg">🔒</span>
          <span className="text-xs font-semibold text-orange-700 text-center">
            Paris ouverts après la fin de la J{journeeIncomplete}
          </span>
        </div>
      )}

      {/* Liste des journées */}
      {journees.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-6 text-center border border-rugby-gray">
          <p className="text-gray-500">
            {isD2 ? 'Aucun match Pro D2 à venir' : 'Aucun match à venir'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {journees.map(journee => {
            const isExpanded = expandedJournees.has(journee);
            const matchsJournee = matchsParJournee[journee];

            return (
              <div key={journee} className="bg-white rounded-lg shadow-sm border border-rugby-gray overflow-hidden">
                <button
                  onClick={() => toggleJournee(journee)}
                  className={`w-full ${headerBg} px-3 py-2 border-b border-rugby-gray transition-colors`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className={`w-4 h-4 ${headerIconColor}`} />
                      <span className="font-bold text-rugby-black text-sm">{journee}</span>
                      <span className="text-xs text-gray-500">({matchsJournee.length} matchs)</span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className={`w-4 h-4 ${headerIconColor}`} />
                    ) : (
                      <ChevronDown className={`w-4 h-4 ${headerIconColor}`} />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="divide-y divide-rugby-gray">
                    {matchsJournee.map(match => {
                      const existingProno = mesPronos.filter(p =>
                        p.match_id === match.match_id && p.status !== 'cancelled'
                      );

                      return (
                        <MatchCard
                          key={match.match_id}
                          match={match}
                          existingProno={existingProno}
                          onBetClick={ouvrirModal}
                          goToMesParis={goToMesParis}
                          jouable={match.journee === prochaineJournee}
                          prochaineJournee={prochaineJournee}
                          isD2={isD2}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showModal && selectedMatch && (
        <BettingModal
          match={selectedMatch}
          existingProno={mesPronos.filter(p => p.match_id === selectedMatch.match_id)}
          preselectedWinner={preselectedWinner}
          userCredits={userCredits?.credits || 0}
          isD2={isD2}
          onClose={fermerModal}
          onSuccess={() => {
            fermerModal();
            loadData();
          }}
        />
      )}

      {/* Bouton Règlement en bas de page */}
      <div className="flex justify-center mt-6 mb-4">
        <button
          onClick={() => setShowReglementModal(true)}
          className={`flex items-center gap-2 ${isD2 ? 'bg-gradient-to-r from-[#00174D] to-[#97C1FE]' : 'bg-gradient-to-r from-rugby-gold to-rugby-bronze'} text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all`}
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
