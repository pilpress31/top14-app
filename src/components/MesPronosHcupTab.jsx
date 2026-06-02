// ============================================================
// MesPronosHcupTab.jsx
// Onglet "À parier" pour la Champions Cup
// ============================================================
// Différences avec MesPronosTab.jsx :
// - Pas de "journées" : groupement par PHASE/ROUND (Poules, Quarts, Demis, Finale)
// - Pas de table user_pronos_view : tout passe par /api/hcup/user/bets/detailed
// - Couleurs HCup (bleu EPCR + or)
// - Pas de blocage par "journée incomplète" (chaque match est indépendant)
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronDown, ChevronUp, Coins, TrendingUp, FileText, Trophy } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import axios from 'axios';
import BettingModalHcup from './BettingModalHcup';
import MatchCardHcup from './MatchCardHcup';
import ReglementModal from './ReglementModal';
import { useRealtimeSync } from '../hooks/useRealtimeSync';
import { getCharte } from '../constants/chartes';

const API_BASE = 'https://top14-api-production.up.railway.app';

// Couleurs charte HCup — centralisées dans src/constants/chartes.js
const { bleu: HCUP_BLUE, or: HCUP_GOLD } = getCharte('hcup').base;

// Ordre des rounds pour le tri (du plus tôt au plus tard dans une saison)
const ROUND_ORDER = {
  'Poule J1': 1,
  'Poule J2': 2,
  'Poule J3': 3,
  'Poule J4': 4,
  'Poule J5': 5,
  'Poule J6': 6,
  '8e de finale': 7,
  'Quart de finale': 8,
  'Demi-finale': 9,
  'Finale': 10,
};

export default function MesPronosHcupTab({ goToMesParis, scrollToMatchId, onScrollDone }) {
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
    setExpandedRounds(prev => new Set([...prev, match.round]));
    setTimeout(() => {
      const el = matchRefs.current[scrollToMatchId];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        onScrollDone?.();
      }
    }, 400);
  }, [scrollToMatchId, loading]);

  // ✅ Realtime sur les tables HCup
  useRealtimeSync([
    { table: 'user_bets_hcup', onUpdate: () => loadData() },
    { table: 'user_credits',   onUpdate: () => loadData() },
    { table: 'match_cotes_hcup', onUpdate: () => loadData() },
  ]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      // 1. Matchs HCup à venir
      const matchsResponse = await axios.get(`${API_BASE}/api/hcup/matchs/a-venir`);
      const matchsData = matchsResponse.data.matchs || [];

      // 2. Mapping match → cotes (les cotes sont déjà incluses dans /matchs/a-venir)
      const matchsAvecCotes = matchsData.map(match => ({
        ...match,
        match_id: match.id || match.match_id,
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

      // 3. Expand le premier round s'il n'y a rien d'ouvert (ou après reset)
      if (matchsAvecCotes.length > 0) {
        const rounds = [...new Set(matchsAvecCotes.map(m => m.round))]
          .sort((a, b) => (ROUND_ORDER[a] || 99) - (ROUND_ORDER[b] || 99));
        if (rounds.length > 0) {
          setExpandedRounds(prev => prev.size === 0 ? new Set([rounds[0]]) : prev);
        }
      }

      // 4. Mes paris HCup
      try {
        const betsRes = await axios.get(`${API_BASE}/api/hcup/user/bets/detailed`, {
          headers: { 'x-user-id': user.id }
        });
        const pronosHcup = (betsRes.data.bets || []).map(b => ({
          match_id: b.match_id,
          bet_type: b.bet_type,
          status: b.status,
          score_dom_pronos: b.bet_score_domicile,
          score_ext_pronos: b.bet_score_exterieur,
          score_domicile: b.bet_score_domicile,
          score_exterieur: b.bet_score_exterieur,
          winner_predit: b.winner_predit,
          odds: b.odds,
          stake: b.stake,
          potential_win: b.potential_win,
        }));
        setMesPronos(pronosHcup);
      } catch (e) {
        console.error('Erreur chargement paris HCup:', e);
        setMesPronos([]);
      }

      // 5. Crédits + total gagné
      try {
        const creditsResponse = await axios.get(`${API_BASE}/api/user/credits`, {
          headers: { 'x-user-id': user.id }
        });

        // Total gagné agrégé sur les 3 championnats
        const [{ data: wonTop14 }, { data: wonD2 }, { data: wonHcup }] = await Promise.all([
          supabase.from('user_bets').select('payout').eq('user_id', user.id).eq('status', 'won'),
          supabase.from('user_bets_d2').select('payout').eq('user_id', user.id).eq('status', 'won'),
          supabase.from('user_bets_hcup').select('payout').eq('user_id', user.id).eq('status', 'won'),
        ]);

        const totalWonFromBets =
          (wonTop14 || []).reduce((s, b) => s + (b.payout || 0), 0) +
          (wonD2 || []).reduce((s, b) => s + (b.payout || 0), 0) +
          (wonHcup || []).reduce((s, b) => s + (b.payout || 0), 0);

        setUserCredits({
          credits: creditsResponse.data.credits ?? 0,
          totalWonFromBets,
        });
      } catch (e) {
        console.error('Erreur chargement crédits:', e);
      }

    } catch (error) {
      console.error('Erreur chargement HCup:', error);
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
    // Accordéon exclusif
    setExpandedRounds(prev => {
      if (prev.has(round)) return new Set();
      return new Set([round]);
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div
          className="animate-spin rounded-full h-12 w-12 border-b-4"
          style={{ borderColor: HCUP_BLUE }}
        />
      </div>
    );
  }

  // Groupement par round
  const matchsParRound = matchsDisponibles.reduce((acc, match) => {
    const round = match.round || 'Autres';
    if (!acc[round]) acc[round] = [];
    acc[round].push(match);
    return acc;
  }, {});

  // Tri des rounds dans l'ordre logique
  const rounds = Object.keys(matchsParRound).sort(
    (a, b) => (ROUND_ORDER[a] || 99) - (ROUND_ORDER[b] || 99)
  );

  // Couleurs HCup
  const bandeauStyle = {
    background: `linear-gradient(to right, ${HCUP_BLUE}, ${HCUP_BLUE}dd, ${HCUP_GOLD}66)`,
  };

  return (
    <div className="space-y-3">

      {/* BANDEAU CAGNOTTE */}
      <div className="rounded-lg p-4 shadow-lg" style={bandeauStyle}>
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

      

      {/* Liste des rounds */}
      {rounds.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-6 text-center border border-gray-200">
          <p className="text-gray-500">Aucun match Champions Cup à venir</p>
          <p className="text-xs text-gray-400 mt-2">
            La prochaine saison démarre en décembre
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {rounds.map(round => {
            const isExpanded = expandedRounds.has(round);
            const matchsRound = matchsParRound[round];
            const isPhaseFinale = !round.startsWith('Poule');

            return (
              <div key={round} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <button
                  onClick={() => toggleRound(round)}
                  className="w-full px-3 py-2 border-b border-gray-200 transition-colors"
                  style={{
                    backgroundColor: isPhaseFinale
                      ? 'rgba(255, 199, 44, 0.15)'
                      : 'rgba(0, 62, 126, 0.08)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isPhaseFinale ? (
                        <Trophy className="w-4 h-4" style={{ color: HCUP_BLUE }} />
                      ) : (
                        <Calendar className="w-4 h-4" style={{ color: HCUP_BLUE }} />
                      )}
                      <span className="font-bold text-sm" style={{ color: HCUP_BLUE }}>
                        {round}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({matchsRound.length} match{matchsRound.length > 1 ? 's' : ''})
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" style={{ color: HCUP_BLUE }} />
                    ) : (
                      <ChevronDown className="w-4 h-4" style={{ color: HCUP_BLUE }} />
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
                          <MatchCardHcup
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

      {/* Modal de pari HCup */}
      {showModal && selectedMatch && (
        <BettingModalHcup
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
