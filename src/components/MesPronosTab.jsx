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
import { getCharte, texteReprise } from '../constants/chartes';

const API_BASE = 'https://top14-api-production.up.railway.app';

export default function MesPronosTab({ goToMesParis, scrollToMatchId, onScrollDone }) {
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
  const matchRefs = useRef({});

  // Ref stable pour capturer isD2 dans les closures async
  const isD2Ref = useRef(isD2);
  useEffect(() => { isD2Ref.current = isD2; }, [isD2]);

  // Scroll vers le match cible après chargement
  useEffect(() => {
    if (!scrollToMatchId || loading) return;
    const match = matchsDisponibles.find(m => m.match_id === scrollToMatchId);
    if (!match) return;
    setExpandedJournees(prev => new Set([...prev, match.journee]));
    setTimeout(() => {
      const el = matchRefs.current[scrollToMatchId];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        onScrollDone?.();
      }
    }, 400);
  }, [scrollToMatchId, loading]);

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
              round:             cote.round,
              journee:           cote.journee,
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
        round: cotesMap[match.id || match.match_id]?.round || match.round,
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

  // 🆕 clickedWinner peut être :
  //   - une string : 'domicile'|'nul'|'exterieur' (legacy D2 → applique à FT)
  //   - un objet : { type: 'FT'|'MT', choice: 'domicile'|'nul'|'exterieur' } (Top 14)
  const ouvrirModal = (match, clickedWinner = null) => {
    if (!parisOuverts) return;

    const journeesSorted = [...new Set(matchsDisponibles.map(m => m.journee))]
      .sort((a, b) => parseInt(String(a).replace('J', '')) - parseInt(String(b).replace('J', '')));
    const prochaineJournee = journeesSorted[0];
    if (match.journee !== prochaineJournee) return;

    const dejaPronos = mesPronos.filter(p =>
      p.match_id === match.match_id && p.status !== 'cancelled'
    );
    // 🆕 Détection : FT/WINNER_FT pour le slot FT, MT/WINNER_MT pour le slot MT
    const hasFT = dejaPronos.some(p => p.bet_type === 'FT' || p.bet_type === 'WINNER_FT');
    const hasMT = !isD2 && dejaPronos.some(p => p.bet_type === 'MT' || p.bet_type === 'WINNER_MT');

    // En D2 : si un pari FT/WINNER_FT déjà pris, on ouvre Mes Paris
    // En Top14 : si FT ET MT pris, on ouvre Mes Paris
    if (isD2 ? hasFT : (hasFT && hasMT)) {
      goToMesParis?.();
      return;
    }

    // 🆕 stocker la pré-sélection (string en D2 = legacy, objet en Top 14)
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
    ? 'bg-gradient-to-r from-d2-navy to-d2-blue'
    : 'bg-gradient-to-r from-rugby-gold to-rugby-bronze';

  const headerBg = isD2 ? 'bg-d2-blue/10 hover:bg-d2-blue/20' : 'bg-rugby-gold/10 hover:bg-rugby-gold/20';
  const headerIconColor = isD2 ? 'text-d2-blue' : 'text-rugby-gold';

  return (
    <div className="space-y-3">

      {/* BANDEAU CAGNOTTE (compact) */}
      <div className={`${bandeauBg} rounded-lg px-4 py-2 shadow-md`}>
        <div className="flex items-center justify-between">
          <button
            onClick={() => window.location.href = '/ma-cagnotte'}
            className="flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Coins className="w-6 h-6 text-white flex-shrink-0" />
            <div className="text-left leading-tight">
              <p className="text-white/80 text-[10px] font-medium uppercase tracking-wide">Ma cagnotte</p>
              <p className="text-white text-xl font-bold leading-none">{(userCredits?.credits ?? 0).toLocaleString('fr-FR')}</p>
            </div>
          </button>

          <div className="w-px self-stretch bg-white/25 mx-2" />

          <button
            onClick={() => window.location.href = '/ma-cagnotte'}
            className="flex items-center hover:opacity-90 transition-opacity"
          >
            <div className="text-right leading-tight">
              <p className="text-white/80 text-[10px] font-medium uppercase tracking-wide">Total gagné</p>
              <p className="text-white text-xl font-bold leading-none flex items-center gap-1 justify-end">
                <TrendingUp className="w-3.5 h-3.5" />
                +{(userCredits?.totalWonFromBets ?? 0).toLocaleString('fr-FR')}
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Badge championnat en mode D2 */}
      {isD2 && (
        <div className="flex items-center justify-center gap-2 px-4 py-2 bg-d2-navy rounded-lg w-fit mx-auto">
          <span className="text-xs font-bold text-d2-silver uppercase tracking-wide">🏉 Mode Pro D2 — Paris FT uniquement</span>
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
          <div className="text-4xl mb-2">{getCharte(isD2 ? 'prod2' : 'top14').icon}</div>
          <p className="text-gray-700 font-semibold">Pas de paris à venir</p>
          <p className="text-sm text-gray-500 mt-1">Saison courante terminée.</p>
          {texteReprise(isD2 ? 'prod2' : 'top14') && (
            <p className="text-xs text-gray-400 mt-1">{texteReprise(isD2 ? 'prod2' : 'top14')}</p>
          )}
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
                      <span className="font-bold text-rugby-black text-sm">{(() => {
                        const r = matchsJournee[0]?.round;
                        const PLAYOFF_LABELS = {
                          'Barrage 1': 'Barrages', 'Barrage 2': 'Barrages',
                          'Barrage': 'Barrages', 'Barrages': 'Barrages', 'Accession': "Match d'accession",
                          'Demi': 'Demi-finales', 'Demi-finale': 'Demi-finales', 'Demi-finales': 'Demi-finales',
                          'Demi-finale 1': 'Demi-finales', 'Demi-finale 2': 'Demi-finales',
                          'Finale': 'Finale',
                          'Access Match Pro D2': "Match d'accession Pro D2",
                          'Access Match Top 14': "Match d'accession Top 14",
                        };
                        return (r && PLAYOFF_LABELS[r]) ? PLAYOFF_LABELS[r] : String(journee);
                      })()}</span>
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
                        <div key={match.match_id} ref={el => matchRefs.current[match.match_id] = el}>
                          <MatchCard
                            match={match}
                            existingProno={existingProno}
                            onBetClick={ouvrirModal}
                            goToMesParis={goToMesParis}
                            jouable={match.journee === prochaineJournee}
                            prochaineJournee={prochaineJournee}
                            isD2={isD2}
                          />
                        </div>
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
          className={`flex items-center gap-2 ${isD2 ? 'bg-gradient-to-r from-d2-navy to-d2-blue' : 'bg-gradient-to-r from-rugby-gold to-rugby-bronze'} text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all`}
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
