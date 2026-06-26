// ============================================================
// MesPronosEccTab.jsx
// Onglet "À parier" pour l'European Challenge Cup
// ============================================================
// Calque de MesPronosHcupTab.jsx :
// - Groupement par PHASE/ROUND (Poules, 16e, Quarts, Demis, Finale)
// - Source paris : /api/ecc/user/bets/detailed (vue v_user_bets_ecc_detailed)
//   ⚠️ la vue ECC expose b.score_domicile / b.score_exterieur (pas bet_score_*)
// - Cotes : /api/ecc/matchs/a-venir (champ `phase`, cotes plates → remappées en match.cotes)
// - Couleurs Challenge Cup (vert #2E7D32 + bronze #CD7F32)
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronDown, ChevronUp, Coins, TrendingUp, FileText, Trophy } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import axios from 'axios';
import BettingModalEcc from './BettingModalEcc';
import MatchCardEcc from './MatchCardEcc';
import ReglementModal from './ReglementModal';
import { useRealtimeSync } from '../hooks/useRealtimeSync';
import { getCharte, texteReprise } from '../constants/chartes';

const API_BASE = 'https://api.top14pronos.fr';

// Couleurs charte ECC — centralisées dans src/constants/chartes.js
const { vert: ECC_VERT, bronze: ECC_BRONZE } = getCharte('ecc').base;

// Ordre des rounds pour le tri (du plus tôt au plus tard dans une saison)
const ROUND_ORDER = {
  'Poule J1': 1,
  'Poule J2': 2,
  'Poule J3': 3,
  'Poule J4': 4,
  'Poule J5': 5,
  'Poule J6': 6,
  '16e de finale': 7,
  '8e de finale': 8,
  'Quart de finale': 9,
  'Demi-finale': 10,
  'Finale': 11,
};

export default function MesPronosEccTab({ goToMesParis, scrollToMatchId, onScrollDone }) {
  const [matchsDisponibles, setMatchsDisponibles] = useState([]);
  const [mesPronos, setMesPronos] = useState([]);
  const [userCredits, setUserCredits] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showReglementModal, setShowReglementModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [preselectedWinner, setPreselectedWinner] = useState(null);
  const [expandedRounds, setExpandedRounds] = useState(new Set());
  const matchRefs = useRef({});

  // Scroll vers le match cible après chargement
  useEffect(() => {
    if (!scrollToMatchId || loading) return;
    const match = matchsDisponibles.find(m => m.match_id === scrollToMatchId);
    if (!match) return;
    setExpandedRounds(prev => new Set([...prev, match.phase]));
    setTimeout(() => {
      const el = matchRefs.current[scrollToMatchId];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        onScrollDone?.();
      }
    }, 400);
  }, [scrollToMatchId, loading]);

  // ✅ Realtime sur les tables ECC
  useRealtimeSync([
    { table: 'user_bets_ecc', onUpdate: () => loadData() },
    { table: 'user_credits',  onUpdate: () => loadData() },
    { table: 'match_cotes_ecc', onUpdate: () => loadData() },
  ]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      // 1. Matchs ECC à venir (cotes incluses, à plat → remappées en match.cotes)
      const matchsResponse = await axios.get(`${API_BASE}/api/ecc/matchs/a-venir`);
      const matchsData = matchsResponse.data.matchs || [];

      const matchsAvecCotes = matchsData.map(match => ({
        ...match,
        match_id: match.match_id,
        date_match: match.date_match,
        cotes: {
          cote_domicile: match.cote_domicile,
          cote_exterieur: match.cote_exterieur,
          cote_nul: match.cote_nul,
          score_predit_dom: match.score_predit_dom,
          score_predit_ext: match.score_predit_ext,
          confiance_algo: match.confiance_algo,
          proba_domicile: match.proba_domicile,
          proba_exterieure: match.proba_exterieure,
        },
      }));

      setMatchsDisponibles(matchsAvecCotes);

      // 2. Expand la 1re phase si rien d'ouvert
      if (matchsAvecCotes.length > 0) {
        const rounds = [...new Set(matchsAvecCotes.map(m => m.phase))]
          .sort((a, b) => (ROUND_ORDER[a] || 99) - (ROUND_ORDER[b] || 99));
        if (rounds.length > 0) {
          setExpandedRounds(prev => prev.size === 0 ? new Set([rounds[0]]) : prev);
        }
      }

      // 3. Mes paris ECC (vue v_user_bets_ecc_detailed : b.score_domicile / b.score_exterieur)
      try {
        const betsRes = await axios.get(`${API_BASE}/api/ecc/user/bets/detailed`, {
          headers: { 'x-user-id': user.id }
        });
        const pronosEcc = (betsRes.data.bets || []).map(b => ({
          match_id: b.match_id,
          bet_type: b.bet_type,
          status: b.status,
          score_dom_pronos: b.score_domicile,
          score_ext_pronos: b.score_exterieur,
          score_domicile: b.score_domicile,
          score_exterieur: b.score_exterieur,
          winner_predit: b.winner_predit,
          odds: b.odds,
          stake: b.stake,
          potential_win: b.potential_win,
        }));
        setMesPronos(pronosEcc);
      } catch (e) {
        console.error('Erreur chargement paris ECC:', e);
        setMesPronos([]);
      }

      // 4. Crédits + total gagné (agrégé sur tous les championnats)
      try {
        const creditsResponse = await axios.get(`${API_BASE}/api/user/credits`, {
          headers: { 'x-user-id': user.id }
        });

        const [{ data: wonTop14 }, { data: wonD2 }, { data: wonHcup }, { data: wonMonde }, { data: wonEcc }] =
          await Promise.all([
            supabase.from('user_bets').select('payout').eq('user_id', user.id).eq('status', 'won'),
            supabase.from('user_bets_d2').select('payout').eq('user_id', user.id).eq('status', 'won'),
            supabase.from('user_bets_hcup').select('payout').eq('user_id', user.id).eq('status', 'won'),
            supabase.from('user_bets_monde').select('payout').eq('user_id', user.id).eq('status', 'won'),
            supabase.from('user_bets_ecc').select('payout').eq('user_id', user.id).eq('status', 'won'),
          ]);

        const totalWonFromBets = [wonTop14, wonD2, wonHcup, wonMonde, wonEcc]
          .reduce((acc, arr) => acc + (arr || []).reduce((s, b) => s + (b.payout || 0), 0), 0);

        setUserCredits({
          credits: creditsResponse.data.credits ?? 0,
          totalWonFromBets,
        });
      } catch (e) {
        console.error('Erreur chargement crédits:', e);
      }

    } catch (error) {
      console.error('Erreur chargement ECC:', error);
    } finally {
      setLoading(false);
    }
  };

  const ouvrirModal = (match, clickedWinner = null) => {
    setPreselectedWinner(clickedWinner);
    setSelectedMatch(match);
    setShowModal(true);
  };

  const fermerModal = () => {
    setShowModal(false);
    setSelectedMatch(null);
    setPreselectedWinner(null);
  };

  const toggleRound = (round) => {
    setExpandedRounds(prev => {
      if (prev.has(round)) return new Set();
      return new Set([round]);
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4" style={{ borderColor: ECC_VERT }} />
      </div>
    );
  }

  // Groupement par phase
  const matchsParRound = matchsDisponibles.reduce((acc, match) => {
    const round = match.phase || 'Autres';
    if (!acc[round]) acc[round] = [];
    acc[round].push(match);
    return acc;
  }, {});

  const rounds = Object.keys(matchsParRound).sort(
    (a, b) => (ROUND_ORDER[a] || 99) - (ROUND_ORDER[b] || 99)
  );

  const bandeauStyle = {
    background: `linear-gradient(to right, ${ECC_VERT}, ${ECC_VERT}dd, ${ECC_BRONZE}66)`,
  };

  return (
    <div className="space-y-3">

      {/* BANDEAU CAGNOTTE (compact) */}
      <div className="rounded-lg px-4 py-2 shadow-md" style={bandeauStyle}>
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

      {/* Liste des rounds */}
      {rounds.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-6 text-center border border-gray-200">
          <div className="text-4xl mb-2">{getCharte('ecc').icon}</div>
          <p className="text-gray-700 font-semibold">Pas de paris à venir</p>
          <p className="text-sm text-gray-500 mt-1">Saison courante terminée.</p>
          {texteReprise('ecc') && (
            <p className="text-xs text-gray-400 mt-2">{texteReprise('ecc')}</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {rounds.map(round => {
            const isExpanded = expandedRounds.has(round);
            const matchsRound = matchsParRound[round];
            const isPhaseFinale = !String(round).startsWith('Poule');

            return (
              <div key={round} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <button
                  onClick={() => toggleRound(round)}
                  className="w-full px-3 py-2 border-b border-gray-200 transition-colors"
                  style={{
                    backgroundColor: isPhaseFinale
                      ? 'rgba(205, 127, 50, 0.15)'
                      : 'rgba(46, 125, 50, 0.08)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isPhaseFinale ? (
                        <Trophy className="w-4 h-4" style={{ color: ECC_VERT }} />
                      ) : (
                        <Calendar className="w-4 h-4" style={{ color: ECC_VERT }} />
                      )}
                      <span className="font-bold text-sm" style={{ color: ECC_VERT }}>
                        {round}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({matchsRound.length} match{matchsRound.length > 1 ? 's' : ''})
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" style={{ color: ECC_VERT }} />
                    ) : (
                      <ChevronDown className="w-4 h-4" style={{ color: ECC_VERT }} />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="divide-y divide-gray-200">
                    {matchsRound.map(match => {
                      const existingProno = mesPronos.filter(p =>
                        p.match_id === match.match_id && p.status !== 'cancelled'
                      );

                      return (
                        <div key={match.match_id} ref={el => matchRefs.current[match.match_id] = el}>
                          <MatchCardEcc
                            match={match}
                            existingProno={existingProno}
                            onBetClick={ouvrirModal}
                            goToMesParis={goToMesParis}
                            jouable={true}
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

      {/* Modal de pari ECC */}
      {showModal && selectedMatch && (
        <BettingModalEcc
          match={selectedMatch}
          existingProno={mesPronos.filter(p => p.match_id === selectedMatch.match_id)}
          preselectedWinner={preselectedWinner}
          userCredits={userCredits?.credits || 0}
          onClose={fermerModal}
          onSuccess={() => {
            fermerModal();
            loadData();
          }}
        />
      )}

      {/* Bouton Règlement */}
      <div className="flex justify-center mt-6 mb-4">
        <button
          onClick={() => setShowReglementModal(true)}
          className="flex items-center gap-2 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all"
          style={bandeauStyle}
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
