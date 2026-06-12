// ============================================================
// MesPronosMondeTab.jsx
// Onglet "À parier" pour le Rugby International (MONDE)
// ============================================================
// Calque de MesPronosHcupTab :
//   - groupement par DATE (pas de round/poule)
//   - tout passe par /api/monde/* (matchs/a-venir, user/bets/detailed)
//   - couleurs charte MONDE (vert émeraude)
//   - chaque match indépendant (toujours pariable tant que 'a_jouer')
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronDown, ChevronUp, Coins, TrendingUp, FileText } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import axios from 'axios';
import BettingModalMonde from './BettingModalMonde';
import MatchCardMonde from './MatchCardMonde';
import ReglementModal from './ReglementModal';
import { useRealtimeSync } from '../hooks/useRealtimeSync';
import { getCharte } from '../constants/chartes';

const API_BASE = 'https://top14-api-production.up.railway.app';

// Couleurs charte MONDE — centralisées dans src/constants/chartes.js
const { vert: MONDE_GREEN, emeraude: MONDE_ACCENT } = getCharte('monde').base;

// Clé de date robuste (YYYY-MM-DD) sans décalage de fuseau
const dateKeyOf = (m) => {
  const s = String(m.date_match || m.date || '');
  const iso = s.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : 'date-inconnue';
};

const labelDate = (key) => {
  if (key === 'date-inconnue') return 'Date à confirmer';
  const d = new Date(key + 'T12:00:00');
  const txt = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return txt.charAt(0).toUpperCase() + txt.slice(1);
};

export default function MesPronosMondeTab({ goToMesParis, scrollToMatchId, onScrollDone }) {
  const [matchsDisponibles, setMatchsDisponibles] = useState([]);
  const [mesPronos, setMesPronos] = useState([]);
  const [userCredits, setUserCredits] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showReglementModal, setShowReglementModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [preselectedWinner, setPreselectedWinner] = useState(null);
  const [expandedDates, setExpandedDates] = useState(new Set());
  const [filtreCompet, setFiltreCompet] = useState('toutes');
  const matchRefs = useRef({});
  const dateRefs = useRef({});

  // Scroll vers le match cible après chargement
  useEffect(() => {
    if (!scrollToMatchId || loading) return;
    const match = matchsDisponibles.find(m => m.match_id === scrollToMatchId);
    if (!match) return;
    setExpandedDates(prev => new Set([...prev, dateKeyOf(match)]));
    setTimeout(() => {
      const el = matchRefs.current[scrollToMatchId];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        onScrollDone?.();
      }
    }, 400);
  }, [scrollToMatchId, loading]);

  // ✅ Realtime sur les tables MONDE
  useRealtimeSync([
    { table: 'user_bets_monde',  onUpdate: () => loadData() },
    { table: 'user_credits',     onUpdate: () => loadData() },
    { table: 'match_cotes_monde', onUpdate: () => loadData() },
  ]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filtre "vivant" : si la compétition sélectionnée n'a plus de match à venir
  // (ex. après MAJ de l'Excel), on revient automatiquement sur "toutes".
  useEffect(() => {
    if (filtreCompet === 'toutes') return;
    const comps = new Set(matchsDisponibles.map(m => m.competition).filter(Boolean));
    if (!comps.has(filtreCompet)) setFiltreCompet('toutes');
  }, [matchsDisponibles, filtreCompet]);

  const loadData = async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      // 1. Matchs MONDE à venir (cotes aplaties dans la réponse)
      const matchsResponse = await axios.get(`${API_BASE}/api/monde/matchs/a-venir`);
      const matchsData = matchsResponse.data.matchs || [];

      // 2. Mapping match → cotes
      const matchsAvecCotes = matchsData.map(match => ({
        ...match,
        match_id: match.match_id || match.id,
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

      // 3. Ouvrir la première date si rien d'ouvert
      if (matchsAvecCotes.length > 0) {
        const dates = [...new Set(matchsAvecCotes.map(dateKeyOf))].sort();
        if (dates.length > 0) {
          setExpandedDates(prev => prev.size === 0 ? new Set([dates[0]]) : prev);
        }
      }

      // 4. Mes paris MONDE
      try {
        const betsRes = await axios.get(`${API_BASE}/api/monde/user/bets/detailed`, {
          headers: { 'x-user-id': user.id }
        });
        const pronosMonde = (betsRes.data.bets || []).map(b => ({
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
        setMesPronos(pronosMonde);
      } catch (e) {
        console.error('Erreur chargement paris MONDE:', e);
        setMesPronos([]);
      }

      // 5. Crédits + total gagné (agrégé sur les 4 championnats)
      try {
        const creditsResponse = await axios.get(`${API_BASE}/api/user/credits`, {
          headers: { 'x-user-id': user.id }
        });

        const [{ data: wonTop14 }, { data: wonD2 }, { data: wonHcup }, { data: wonMonde }] = await Promise.all([
          supabase.from('user_bets').select('payout').eq('user_id', user.id).eq('status', 'won'),
          supabase.from('user_bets_d2').select('payout').eq('user_id', user.id).eq('status', 'won'),
          supabase.from('user_bets_hcup').select('payout').eq('user_id', user.id).eq('status', 'won'),
          supabase.from('user_bets_monde').select('payout').eq('user_id', user.id).eq('status', 'won'),
        ]);

        const totalWonFromBets =
          (wonTop14 || []).reduce((s, b) => s + (b.payout || 0), 0) +
          (wonD2 || []).reduce((s, b) => s + (b.payout || 0), 0) +
          (wonHcup || []).reduce((s, b) => s + (b.payout || 0), 0) +
          (wonMonde || []).reduce((s, b) => s + (b.payout || 0), 0);

        setUserCredits({
          credits: creditsResponse.data.credits ?? 0,
          totalWonFromBets,
        });
      } catch (e) {
        console.error('Erreur chargement crédits:', e);
      }

    } catch (error) {
      console.error('Erreur chargement MONDE:', error);
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

  const toggleDate = (key) => {
    // Accordéon exclusif
    const opening = !expandedDates.has(key);
    setExpandedDates(opening ? new Set([key]) : new Set());
    // À l'ouverture, recentrer (sinon la fermeture du précédent fait remonter trop haut).
    if (opening) {
      setTimeout(() => {
        const el = dateRefs.current[key];
        if (el) {
          const y = el.getBoundingClientRect().top + window.scrollY - 110;
          window.scrollTo({ top: y < 0 ? 0 : y, behavior: 'smooth' });
        }
      }, 60);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4" style={{ borderColor: MONDE_GREEN }} />
      </div>
    );
  }

  // Compétitions présentes dans les matchs à venir (liste "vivante")
  const competitions = [...new Set(matchsDisponibles.map(m => m.competition).filter(Boolean))].sort();
  // Si la compétition filtrée n'a plus aucun match à venir → retour à "toutes"
  const filtreActif = (filtreCompet !== 'toutes' && competitions.includes(filtreCompet)) ? filtreCompet : 'toutes';

  const matchsVisibles = filtreActif === 'toutes'
    ? matchsDisponibles
    : matchsDisponibles.filter(m => m.competition === filtreActif);

  // Groupement par date (sur les matchs visibles)
  const matchsParDate = matchsVisibles.reduce((acc, match) => {
    const key = dateKeyOf(match);
    if (!acc[key]) acc[key] = [];
    acc[key].push(match);
    return acc;
  }, {});

  const dateKeys = Object.keys(matchsParDate).sort();

  // Verrouillage : un match n'est pariable que s'il est le 1er match à venir
  // de CHACUNE de ses 2 équipes (les cotes d'un 2e match seraient calculées
  // sur un ELO périmé, avant le résultat du 1er). Se déverrouille tout seul
  // quand le match précédent sort de 'a_jouer'.
  const earliestByTeam = {};
  for (const m of matchsDisponibles) {
    const d = dateKeyOf(m);
    for (const t of [m.equipe_domicile, m.equipe_exterieure]) {
      if (t && (!earliestByTeam[t] || d < earliestByTeam[t])) earliestByTeam[t] = d;
    }
  }
  const isJouable = (m) => {
    const d = dateKeyOf(m);
    return earliestByTeam[m.equipe_domicile] === d && earliestByTeam[m.equipe_exterieure] === d;
  };

  const bandeauStyle = {
    background: `linear-gradient(to right, ${MONDE_GREEN}, ${MONDE_GREEN}dd, ${MONDE_ACCENT}66)`,
  };

  return (
    <div className="space-y-3">

      {/* BANDEAU CAGNOTTE */}
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

      {/* Filtre "vivant" des compétitions (dérivé des matchs à venir) */}
      {competitions.length > 1 && (
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wide flex-shrink-0" style={{ color: MONDE_GREEN }}>
            Compétition
          </span>
          <select
            value={filtreActif}
            onChange={(e) => setFiltreCompet(e.target.value)}
            className="flex-1 min-w-0 rounded-lg px-3 py-2 text-sm font-semibold bg-white border focus:outline-none"
            style={{ borderColor: 'rgba(11,110,79,0.35)', color: MONDE_GREEN }}
          >
            <option value="toutes">Toutes ({matchsDisponibles.length})</option>
            {competitions.map(c => {
              const n = matchsDisponibles.filter(m => m.competition === c).length;
              return <option key={c} value={c}>{c} ({n})</option>;
            })}
          </select>
        </div>
      )}

      {/* Liste des dates */}
      {dateKeys.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-6 text-center border border-gray-200">
          <p className="text-gray-500">Aucun match international à venir</p>
          <p className="text-xs text-gray-400 mt-2">Reviens bientôt pour les prochaines fenêtres internationales</p>
        </div>
      ) : (
        <div className="space-y-2">
          {dateKeys.map(key => {
            const isExpanded = expandedDates.has(key);
            const matchsDate = matchsParDate[key];
            const compsDuJour = [...new Set(matchsDate.map(m => m.competition).filter(Boolean))];
            const compUnique = compsDuJour.length === 1 ? compsDuJour[0] : null;

            return (
              <div key={key} ref={el => { dateRefs.current[key] = el; }} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden scroll-mt-2">
                <button
                  onClick={() => toggleDate(key)}
                  className="w-full px-3 py-2 border-b border-gray-200 transition-colors"
                  style={{ backgroundColor: 'rgba(11,110,79,0.08)' }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 flex-shrink-0" style={{ color: MONDE_GREEN }} />
                        <span className="font-bold text-sm" style={{ color: MONDE_GREEN }}>
                          {labelDate(key)}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({matchsDate.length} match{matchsDate.length > 1 ? 's' : ''})
                        </span>
                      </div>
                      {compUnique && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full self-start ml-6 truncate max-w-full"
                          style={{ backgroundColor: 'rgba(11,110,79,0.12)', color: MONDE_GREEN }}>
                          {compUnique}
                        </span>
                      )}
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" style={{ color: MONDE_GREEN }} />
                    ) : (
                      <ChevronDown className="w-4 h-4" style={{ color: MONDE_GREEN }} />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="divide-y divide-gray-200">
                    {matchsDate.map(match => {
                      const existingProno = mesPronos.filter(p =>
                        p.match_id === match.match_id && p.status !== 'cancelled'
                      );
                      return (
                        <div key={match.match_id} ref={el => matchRefs.current[match.match_id] = el}>
                          <MatchCardMonde
                            match={match}
                            existingProno={existingProno}
                            onBetClick={ouvrirModal}
                            goToMesParis={goToMesParis}
                            jouable={isJouable(match)}
                            lockMessage="Pariable après le match précédent de l'équipe"
                            hideCompetition={!!compUnique}
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

      {/* Modal de pari MONDE */}
      {showModal && selectedMatch && (
        <BettingModalMonde
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
