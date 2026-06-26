// ============================================
// ALGO PRONOS - CHAMPIONS CUP (v3)
// Source : GET /api/hcup/matchs/a-venir
//          GET /api/hcup/insights?equipe_dom=&equipe_ext=
//          GET /api/hcup/historique?limit=&offset=&equipe=
// Couleurs : bleu EPCR #003E7E + or #FFC72C
//
// Pattern aligné sur Pro D2 :
//   - Indice favori (à la place de "Confiance algo")
//   - Dropdown "Duel & Forme" (h2h + forme récente fusionnés)
//     → Si nb_matchs === 0 (aucune confrontation directe) :
//       affiche un PALMARES narratif des 2 équipes en HCup
//   - Dropdown "Historique des confrontations"
//   - PAS de bloc cotes (les cotes sont sur la page Paris uniquement)
// ============================================

import { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronDown, ChevronUp, Globe, Trophy, Loader2, Newspaper, Swords, BarChart2, Bot, MessageSquare } from 'lucide-react';
import axios from 'axios';
import { getTeamData } from '../utils/teams';
import RubriqueHeader, { RUBRIQUE_THEMES, ACTU_SECTION_COLORS } from './RubriqueHeader';
import { CompoEtBlessesSection } from './ActuTab';
import PourquoiCePronostic from './PourquoiCePronostic';
import { useRealtimeSync } from '../hooks/useRealtimeSync';
import BarreIndiceFavori from './BarreIndiceFavori';
import TeamPopup from './TeamPopup';
import { getCharte, texteReprise } from '../constants/chartes';

const API_BASE = 'https://api.top14pronos.fr';

const HCUP_BLEU = '#003E7E';
const HCUP_OR = '#FFC72C';
const HCUP_BLEU_SOFT = '#EEF5FF';
const HCUP_BLEU_BORDER = '#B0CFE8';

// Ordre des rounds pour le tri
const ROUND_ORDER = {
  'Poule J1': 1,
  'Poule J2': 2,
  'Poule J3': 3,
  'Poule J4': 4,
  'Poule J5': 5,
  'Poule J6': 6,
  '8e de finale': 10,
  'Quart de finale': 11,
  'Demi-finale': 12,
  'Finale': 13,
};

const PHASE_FINALE_ROUNDS = ['8e de finale', 'Quart de finale', 'Demi-finale', 'Finale'];

// Helper : libellé d'un round pour le palmarès
function libelleRound(round) {
  const map = {
    '8e de finale': '8e de finale',
    'Quart de finale': 'Quart de finale',
    'Demi-finale': 'Demi-finale',
    'Finale': 'Finale',
  };
  return map[round] || 'Phase de poules';
}

// Libellé COURT d'un round pour l'historique des confrontations (colonne étroite).
// Phase finale abrégée façon Top 14 ; poules affichées telles quelles ("Poule J1").
function libelleRoundCourt(round) {
  const map = {
    '8e de finale':    '8ᵉ',
    'Quart de finale': '¼',
    'Demi-finale':     '½',
    'Finale':          'Finale',
    'Barrage':         'Barrage',
  };
  return map[round] || round || '';
}

// Helper : formate une saison "2024-2025" -> "2024-25"
function saisonShort(saison) {
  if (!saison) return '';
  const parts = saison.split('-');
  if (parts.length !== 2) return saison;
  return `${parts[0]}-${parts[1].slice(2)}`;
}

export default function AlgoPronosHcupTab() {
  const [pronos, setPronos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRounds, setExpandedRounds] = useState(new Set());
  const [activePanel, setActivePanel] = useState(null);
  const roundRefs = useRef({});
  const isFirstLoad = useRef(true);

  useRealtimeSync([
    { table: 'match_cotes_hcup', onUpdate: () => loadPronos() },
    { table: 'matchs_hcup', onUpdate: () => loadPronos() },
  ]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setLoading(true);
    setPronos([]);
    setExpandedRounds(new Set());
    isFirstLoad.current = true;
    loadPronos();
  }, []);

  const loadPronos = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/hcup/matchs/a-venir`);
      const raw = response.data.matchs || [];

      const pronosData = raw.map(m => {
        let winner_predit = m.winner_predit ?? null;
        if (!winner_predit && m.score_predit_dom != null && m.score_predit_ext != null) {
          winner_predit = m.score_predit_dom > m.score_predit_ext ? 'DOM'
                        : m.score_predit_dom < m.score_predit_ext ? 'EXT' : 'NUL';
        }
        return { ...m, winner_predit };
      });

      pronosData.sort((a, b) => {
        const orderA = ROUND_ORDER[a.round] ?? 99;
        const orderB = ROUND_ORDER[b.round] ?? 99;
        if (orderA !== orderB) return orderA - orderB;
        return new Date(a.date_match) - new Date(b.date_match);
      });

      setPronos(pronosData);

      if (isFirstLoad.current && pronosData.length > 0) {
        const firstRound = pronosData[0].round;
        if (firstRound) setExpandedRounds(new Set([firstRound]));
        isFirstLoad.current = false;
      }
    } catch (error) {
      console.error('Erreur chargement pronos HCup:', error);
      setPronos([]);
    } finally {
      setLoading(false);
    }
  };

  const scrollToRound = (round) => {
    setTimeout(() => {
      const element = roundRefs.current[round];
      if (element) {
        const headerOffset = 200;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }
    }, 100);
  };

  const toggleRound = (round) => {
    setExpandedRounds(prev => {
      const newSet = new Set();
      if (!prev.has(round)) {
        newSet.add(round);
        scrollToRound(round);
      }
      return newSet;
    });
  };

  const handleTogglePanel = (matchId, panel) => {
    setActivePanel(prev => {
      if (prev?.matchId === matchId && prev.panel === panel) {
        return null;
      }
      return { matchId, panel };
    });
  };

  const rounds = pronos.length > 0
    ? [...new Set(pronos.map(p => p.round))].sort((a, b) =>
        (ROUND_ORDER[a] ?? 99) - (ROUND_ORDER[b] ?? 99)
      )
    : [];

  const pronosParRound = pronos.reduce((acc, prono) => {
    if (!acc[prono.round]) acc[prono.round] = [];
    acc[prono.round].push(prono);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4" style={{ borderColor: HCUP_BLEU }}></div>
      </div>
    );
  }

  if (rounds.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 text-center border border-rugby-gray">
        <div className="text-4xl mb-2">{getCharte('hcup').icon}</div>
        <p className="text-gray-700 font-semibold">Pas de pronostics à venir</p>
        <p className="text-sm text-gray-500 mt-1">Saison courante terminée.</p>
        {texteReprise('hcup') && (
          <p className="text-xs text-gray-400 mt-1">{texteReprise('hcup')}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {rounds.map(round => {
        const isExpanded = expandedRounds.has(round);
        const pronosRound = pronosParRound[round] || [];
        const isPhaseFinale = PHASE_FINALE_ROUNDS.includes(round);
        const now = new Date();
        const DUREE_MAX_MS = 3 * 60 * 60 * 1000; // 3h max (prolongations incluses)
        const nbAVenir = pronosRound.filter(m => new Date(m.date_match) > now).length;
        const nbEnCours = pronosRound.filter(m => {
          const d = new Date(m.date_match);
          return d <= now && d > new Date(now - DUREE_MAX_MS);
        }).length;
        const nbTermines = pronosRound.filter(m => new Date(m.date_match) <= new Date(now - DUREE_MAX_MS)).length;
        const labelParts = [];
        if (nbAVenir > 0) labelParts.push(`${nbAVenir} à venir`);
        if (nbEnCours > 0) labelParts.push(`${nbEnCours} en cours 🔴`);
        if (nbTermines > 0) labelParts.push(`${nbTermines} terminé${nbTermines > 1 ? 's' : ''} ✅`);
        const matchsLabel = labelParts.length > 0 ? labelParts.join(' · ') : `${pronosRound.length} match${pronosRound.length > 1 ? 's' : ''}`;

        return (
          <div
            key={round}
            ref={el => roundRefs.current[round] = el}
            className="bg-white rounded-lg shadow-sm border border-rugby-gray overflow-hidden"
          >
            <button
              onClick={() => toggleRound(round)}
              className="w-full px-3 py-2 border-b transition-colors"
              style={{
                backgroundColor: 'rgba(0,62,126,0.08)',
                borderColor: 'rgba(255,199,44,0.3)'
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isPhaseFinale ? (
                    <Trophy className="w-4 h-4" style={{ color: HCUP_OR }} />
                  ) : (
                    <Calendar className="w-4 h-4" style={{ color: HCUP_OR }} />
                  )}
                  <span className="font-bold text-sm" style={{ color: HCUP_BLEU }}>
                    {round}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({matchsLabel})
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" style={{ color: HCUP_OR }} />
                ) : (
                  <ChevronDown className="w-4 h-4" style={{ color: HCUP_OR }} />
                )}
              </div>
            </button>

            {isExpanded && (
              <div className="p-3 space-y-4">
                {pronosRound.map(prono => (
                  <PronoCardHcup
                    key={prono.match_id}
                    match={prono}
                    openPanel={activePanel?.matchId === prono.match_id ? activePanel.panel : null}
                    onTogglePanel={(panel) => handleTogglePanel(prono.match_id, panel)}
                  />
                ))}

                {isPhaseFinale && (
                  <p className="text-[11px] italic text-gray-500 text-center pt-2 border-t border-gray-100">
                    Pari basé sur le score à 80 min, hors prolongation
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// (PulsingInfoButton déplacé dans ./BarreIndiceFavori)

// (InfoConfiance déplacé dans ./BarreIndiceFavori)

// ============================================
// COMPOSANT : PalmaresEquipe
// Affiche le palmarès narratif d'une équipe en HCup
// ============================================
function PalmaresEquipe({ palmares, isDom }) {
  if (!palmares) return null;

  const {
    equipe,
    nb_participations,
    nb_titres,
    saisons_titres,
    nb_finales,
    dernier_titre,
    derniere_finale,
    meilleur_round,
    est_tenant_du_titre,
    est_premiere_finale,
    finale_courante,
  } = palmares;

  // Choisir l'icône / titre selon le profil de l'équipe
  let titreEquipe = null;
  if (nb_titres >= 3) titreEquipe = 'Géant historique de la HCup';
  else if (nb_titres >= 1) titreEquipe = `Champion d'Europe`;
  else if (nb_finales >= 1) titreEquipe = 'Habituée des phases finales';
  else if (nb_participations >= 5) titreEquipe = 'Régulier de la compétition';
  else titreEquipe = 'Outsider de la compétition';

  // Helper formater liste de saisons (max 5 affichées)
  const formatSaisons = (saisons) => {
    if (!saisons || saisons.length === 0) return '';
    const courtes = saisons.map(saisonShort);
    if (courtes.length <= 5) return courtes.join(', ');
    return courtes.slice(0, 4).join(', ') + ` + ${courtes.length - 4} autres`;
  };

  return (
    <div className="rounded-lg p-3" style={{ backgroundColor: HCUP_BLEU_SOFT, border: `1px solid ${HCUP_BLEU_BORDER}` }}>
      {/* En-tête équipe */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">🏆</span>
        <div className="flex-1">
          <p className="text-sm font-bold uppercase tracking-wide" style={{ color: HCUP_BLEU }}>
            {equipe}
          </p>
          <p className="text-[10px] italic" style={{ color: HCUP_BLEU, opacity: 0.7 }}>
            {titreEquipe}
          </p>
        </div>
        {est_tenant_du_titre && (
          <span className="text-[9px] px-2 py-1 rounded-full font-bold" style={{ backgroundColor: HCUP_OR, color: HCUP_BLEU }}>
            🏆 Tenant du titre
          </span>
        )}
      </div>

      {/* Stats clés sous forme de bullets */}
      <ul className="space-y-1 ml-1">
        <li className="text-[11px]" style={{ color: HCUP_BLEU }}>
          • <span className="font-semibold">{nb_participations}</span>
          {nb_participations <= 1 ? 'ère' : 'e'} participation à la Champions Cup
        </li>

        {nb_titres > 0 ? (
          <li className="text-[11px]" style={{ color: HCUP_BLEU }}>
            • <span className="font-semibold">{nb_titres}</span> titre{nb_titres > 1 ? 's' : ''} remporté{nb_titres > 1 ? 's' : ''}
            {saisons_titres.length > 0 && (
              <span className="text-gray-600 ml-1">({formatSaisons(saisons_titres)})</span>
            )}
          </li>
        ) : (
          <li className="text-[11px]" style={{ color: HCUP_BLEU }}>
            • Aucun titre remporté
          </li>
        )}

        {nb_finales > 0 ? (
          <li className="text-[11px]" style={{ color: HCUP_BLEU }}>
            • <span className="font-semibold">{nb_finales}</span> finale{nb_finales > 1 ? 's' : ''} jouée{nb_finales > 1 ? 's' : ''}
          </li>
        ) : null}

        {/* Dernière finale */}
        {derniere_finale && (
          <li className="text-[11px]" style={{ color: HCUP_BLEU }}>
            • Dernière finale : <span className="font-semibold">{saisonShort(derniere_finale.saison)}</span>{' '}
            <span className={derniere_finale.gagne ? 'text-green-700 font-semibold' : 'text-red-600'}>
              ({derniere_finale.gagne ? 'victoire' : 'défaite'} {derniere_finale.score})
            </span>
            {derniere_finale.prolongation && (
              <span className="text-gray-500 ml-1">après prolongation</span>
            )}
            <span className="text-gray-500 ml-1">vs {derniere_finale.adversaire}</span>
          </li>
        )}

        {/* Cas spéciaux */}
        {est_premiere_finale && finale_courante && (
          <li className="text-[12px] font-semibold mt-1" style={{ color: HCUP_OR }}>
            🔥 Première finale historique en Champions Cup !
          </li>
        )}

        {!est_premiere_finale && finale_courante && (
          <li className="text-[11px] font-semibold mt-1" style={{ color: HCUP_OR }}>
            🎯 En finale cette saison !
          </li>
        )}

        {/* Meilleur résultat si pas de finale */}
        {nb_finales === 0 && !finale_courante && meilleur_round && meilleur_round !== 'Phase de poules' && (
          <li className="text-[11px]" style={{ color: HCUP_BLEU }}>
            • Meilleur résultat : <span className="font-semibold">{libelleRound(meilleur_round)}</span>
          </li>
        )}
      </ul>
    </div>
  );
}

// ============================================
// COMPOSANT : InsightsHcup (Duel & Forme)
// Source : GET /api/hcup/insights?equipe_dom=&equipe_ext=
// ============================================
function InsightsHcup({ match, isOpen, onToggle }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleToggle = async () => {
    onToggle();
    if (!isOpen && !data && !loading) {
      setLoading(true);
      setError(null);
      try {
        const url = `${API_BASE}/api/hcup/insights?equipe_dom=${encodeURIComponent(match.equipe_domicile)}&equipe_ext=${encodeURIComponent(match.equipe_exterieure)}`;
        const res = await axios.get(url);
        setData(res.data);
      } catch (e) {
        setError('Impossible de charger les insights.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Résumé de forme synthétique :
  // - Détecte la série en cours (X victoires/défaites consécutives à partir du dernier match)
  // - Affiche un compteur V/N/D agrégé + un mini-bar visuel compact
  // Beaucoup plus parlant que 5 lettres alignées (qui sont toutes V pour les finalistes).
  const SerieBlocs = ({ forme }) => {
    if (!Array.isArray(forme) || forme.length === 0) {
      return <span className="text-[11px] italic text-gray-400">Pas assez de matchs HCup récents</span>;
    }

    // Compter V / N / D
    const counts = { V: 0, N: 0, D: 0 };
    forme.forEach(r => { if (counts[r] !== undefined) counts[r]++; });

    // Détecter la série en cours (à partir du DERNIER match = forme[forme.length-1])
    // Le tableau forme est ordonné du plus ancien au plus récent (.reverse() côté backend)
    const last = forme[forme.length - 1];
    let streak = 1;
    for (let i = forme.length - 2; i >= 0; i--) {
      if (forme[i] === last) streak++;
      else break;
    }

    // Texte accrocheur selon la série
    let streakLabel = null;
    let streakColor = '#6b7280';
    if (streak >= 3 && last === 'V') {
      streakLabel = `🔥 ${streak} victoires consécutives`;
      streakColor = '#16a34a';
    } else if (streak >= 3 && last === 'D') {
      streakLabel = `❄️ ${streak} défaites consécutives`;
      streakColor = '#dc2626';
    } else if (last === 'V') {
      streakLabel = `✓ Vient de gagner`;
      streakColor = '#16a34a';
    } else if (last === 'D') {
      streakLabel = `✗ Vient de perdre`;
      streakColor = '#dc2626';
    } else {
      streakLabel = `≈ Match nul récent`;
    }

    return (
      <div className="space-y-1.5">
        {/* Bilan chiffré */}
        <div className="flex items-center gap-3 text-[11px] flex-wrap">
          {counts.V > 0 && (
            <span className="font-semibold" style={{ color: '#16a34a' }}>
              {counts.V}V
            </span>
          )}
          {counts.N > 0 && (
            <span className="font-semibold" style={{ color: '#6b7280' }}>
              {counts.N}N
            </span>
          )}
          {counts.D > 0 && (
            <span className="font-semibold" style={{ color: '#dc2626' }}>
              {counts.D}D
            </span>
          )}
          <span className="text-gray-400 text-[10px]">
            sur les {forme.length} derniers
          </span>
        </div>

        {/* Mini-bar visuel proportionnel V/N/D */}
        <div className="flex h-1.5 rounded-full overflow-hidden bg-gray-100">
          {counts.V > 0 && (
            <div style={{ width: `${(counts.V / forme.length) * 100}%`, backgroundColor: '#22c55e' }} />
          )}
          {counts.N > 0 && (
            <div style={{ width: `${(counts.N / forme.length) * 100}%`, backgroundColor: '#9ca3af' }} />
          )}
          {counts.D > 0 && (
            <div style={{ width: `${(counts.D / forme.length) * 100}%`, backgroundColor: '#ef4444' }} />
          )}
        </div>

        {/* Tendance / série en cours */}
        <p className="text-[10px] font-semibold" style={{ color: streakColor }}>
          {streakLabel}
        </p>
      </div>
    );
  };

  const nb_h2h = data?.h2h?.nb_matchs ?? 0;

  return (
    <div className="mt-3 border-t pt-3" style={{ borderColor: HCUP_BLEU_BORDER }}>
      <RubriqueHeader
        theme={RUBRIQUE_THEMES.hcup}
        icon={BarChart2}
        label="Duel & Forme"
        isOpen={isOpen}
        loading={loading}
        onToggle={handleToggle}
        badge={data && nb_h2h > 0 ? `${nb_h2h} confrontations` : null}
      />

      {isOpen && (
        <div className="mt-3 space-y-3">
          {error && <p className="text-xs text-center py-2 italic" style={{ color: HCUP_BLEU }}>{error}</p>}
          {loading && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: HCUP_OR }} />
            </div>
          )}

          {data && !loading && (
            <>
              {/* ── 🆕 Texte joli du duel (toujours affiché si présent) ── */}
              {data.duel_texte && (
                <div
                  className="rounded-lg p-3"
                  style={{
                    backgroundColor: HCUP_BLEU_SOFT,
                    border: `1px solid ${HCUP_BLEU_BORDER}`,
                  }}
                >
                  <p className="text-[11px] leading-relaxed" style={{ color: HCUP_BLEU }}>
                    {data.duel_texte}
                  </p>
                </div>
              )}

              {/* ── Stats brutes (chiffres) — uniquement si ≥ 3 confrontations ── */}
              {nb_h2h >= 3 ? (
                <div className="rounded-lg p-3" style={{ backgroundColor: HCUP_BLEU_SOFT, border: `1px solid ${HCUP_BLEU_BORDER}` }}>
                  <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: HCUP_BLEU }}>
                    ⚔️ Face-à-face — {nb_h2h} matchs
                  </p>

                  {/* Barre victoires */}
                  <div className="mb-3">
                    <div className="flex justify-between text-[10px] mb-1" style={{ color: HCUP_BLEU }}>
                      <span className="font-bold">{match.equipe_domicile.split(' ')[0]}</span>
                      <span className="text-gray-400">Nuls {data.h2h.nuls}</span>
                      <span className="font-bold">{match.equipe_exterieure.split(' ')[0]}</span>
                    </div>
                    <div className="flex h-2 rounded-full overflow-hidden">
                      <div style={{
                        width: `${Math.round((data.h2h.victoires_dom / nb_h2h) * 100)}%`,
                        backgroundColor: HCUP_BLEU,
                      }} />
                      <div style={{
                        width: `${Math.round((data.h2h.nuls / nb_h2h) * 100)}%`,
                        backgroundColor: '#9CA3AF',
                      }} />
                      <div style={{
                        width: `${Math.round((data.h2h.victoires_ext / nb_h2h) * 100)}%`,
                        backgroundColor: HCUP_OR,
                      }} />
                    </div>
                    <div className="flex justify-between text-[10px] mt-0.5 font-bold">
                      <span style={{ color: HCUP_BLEU }}>
                        {Math.round((data.h2h.victoires_dom / nb_h2h) * 100)}%
                      </span>
                      <span style={{ color: HCUP_OR }}>
                        {Math.round((data.h2h.victoires_ext / nb_h2h) * 100)}%
                      </span>
                    </div>
                  </div>

                  {/* Score moyen */}
                  {data.h2h.moyenne_pts_dom != null && (
                    <div className="rounded p-2 text-center" style={{ backgroundColor: '#FFFFFF', border: `1px solid ${HCUP_BLEU_BORDER}` }}>
                      <p className="text-[11px] font-bold" style={{ color: HCUP_BLEU }}>
                        {data.h2h.moyenne_pts_dom} - {data.h2h.moyenne_pts_ext}
                      </p>
                      <p className="text-[9px] text-gray-500">Score moyen sur les confrontations</p>
                    </div>
                  )}
                </div>
              ) : (
                /* ── 0, 1 ou 2 confrontations → afficher les PALMARÈS pour enrichir le contexte ── */
                <>
                  {data.palmares_dom && (
                    <PalmaresEquipe palmares={data.palmares_dom} isDom={true} />
                  )}
                  {data.palmares_ext && (
                    <PalmaresEquipe palmares={data.palmares_ext} isDom={false} />
                  )}
                </>
              )}

              {/* ── Forme récente (toujours affichée) ── */}
              {[
                { label: match.equipe_domicile.split(' ')[0], forme: data.forme_dom },
                { label: match.equipe_exterieure.split(' ')[0], forme: data.forme_ext },
              ].map((eq, idx) => (
                <div
                  key={idx}
                  className="rounded-lg p-3"
                  style={{ backgroundColor: HCUP_BLEU_SOFT, border: `1px solid ${HCUP_BLEU_BORDER}` }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: HCUP_BLEU }}>
                    🏉 {eq.label} — 5 derniers matchs HCup
                  </p>
                  <SerieBlocs forme={eq.forme} />
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// COMPOSANT : HistoriqueConfrontationsHcup
// ============================================
function HistoriqueConfrontationsHcup({ match, isOpen, onToggle }) {
  const [confrontations, setConfrontations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleToggle = async () => {
    onToggle();
    if (!isOpen && !confrontations && !loading) {
      setLoading(true);
      setError(null);
      try {
        // Confrontations directes filtrées côté serveur (paramètre adversaire),
        // déjà triées par date décroissante, limitées à 10.
        const res = await axios.get(`${API_BASE}/api/hcup/historique`, {
          params: {
            equipe: match.equipe_domicile,
            adversaire: match.equipe_exterieure,
            limit: 10,
          },
        });
        const found = (res.data?.matchs || []).map(m => ({
          ...m,
          score_domicile: m.score_domicile ?? m.score_reel_dom ?? 0,
          score_exterieur: m.score_exterieur ?? m.score_reel_ext ?? 0,
        }));

        setConfrontations(found.slice(0, 10));
      } catch (e) {
        console.error('Erreur historique confrontations HCup:', e);
        setError("Impossible de charger l'historique.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      <RubriqueHeader
        theme={RUBRIQUE_THEMES.hcup}
        icon={Swords}
        label="Historique des confrontations"
        isOpen={isOpen}
        loading={loading}
        onToggle={handleToggle}
        badge={confrontations ? `${confrontations.length} matchs` : null}
      />

      {isOpen && (
        <div className="mt-2">
          {error && <p className="text-xs text-gray-400 text-center py-2 italic">{error}</p>}
          {loading && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: HCUP_OR }} />
            </div>
          )}
          {confrontations && !loading && confrontations.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-3 italic">
              Aucune confrontation trouvée dans l&apos;historique
            </p>
          )}
          {confrontations && !loading && confrontations.length > 0 && (
            <div className="rounded-lg overflow-hidden" style={{ backgroundColor: HCUP_BLEU_SOFT, border: `1px solid ${HCUP_BLEU_BORDER}` }}>
              <div
                className="grid grid-cols-4 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide text-center"
                style={{ backgroundColor: 'rgba(0,62,126,0.12)', color: HCUP_BLEU }}
              >
                <div className="text-left">Saison/R.</div>
                <div>DOM</div>
                <div>FT</div>
                <div>EXT</div>
              </div>

              {confrontations.map((m, i) => {
                const saisonCourt = saisonShort(m.saison || '');
                const round = m.round ? libelleRoundCourt(m.round) : `J${m.journee ?? ''}`;
                const ftScore = `${m.score_domicile}-${m.score_exterieur}`;
                const winnerIsDom = m.score_domicile > m.score_exterieur;
                const winnerIsExt = m.score_exterieur > m.score_domicile;

                return (
                  <div
                    key={i}
                    className="grid grid-cols-4 px-2 py-1.5 text-[10px] text-center items-center border-t"
                    style={{ borderColor: HCUP_BLEU_BORDER }}
                  >
                    <div className="text-left text-gray-500 truncate">
                      {saisonCourt} • {round}
                    </div>
                    <div className={`truncate font-semibold ${winnerIsDom ? 'text-green-700' : 'text-gray-700'}`}>
                      {(m.equipe_domicile || '').split(' ')[0]}
                    </div>
                    <div className="font-bold" style={{ color: HCUP_BLEU }}>
                      {ftScore}
                    </div>
                    <div className={`truncate font-semibold ${winnerIsExt ? 'text-green-700' : 'text-gray-700'}`}>
                      {(m.equipe_exterieure || '').split(' ')[0]}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


// ============================================
// COMPOSANT : ActuMatchHcup (rubrique "Actu du match" Champions Cup)
// ============================================
const ACTU_HCUP_SECTIONS = [
  { key: 'forme_domicile',  label: 'Forme récente',     icon: Trophy,    combine: 'forme_exterieure' },
  { key: 'pronostic_ia',    label: 'Pronostic IA',      icon: Bot },
  { key: 'contexte_match',  label: 'Contexte & Enjeux', icon: Swords },
  { key: 'declarations',    label: 'Déclarations',      icon: MessageSquare },
];

function ActuMatchHcup({ match, isOpen, onToggle }) {
  const [actu, setActu] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openSection, setOpenSection] = useState(null);

  const handleToggle = async () => {
    onToggle();
    if (!isOpen && !actu && !loading) {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`${API_BASE}/api/actu?championnat=hcup`);
        const actus = Array.isArray(res.data) ? res.data : (res.data?.actus || []);
        const found = actus.find(a =>
          a.equipe_domicile === match.equipe_domicile &&
          a.equipe_exterieure === match.equipe_exterieure
        );
        setActu(found || null);
        if (!found) setError('Aucune actualité disponible pour ce match.');
      } catch (e) {
        setError("Impossible de charger l'actualité du match.");
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleSection = (key) => setOpenSection(prev => prev === key ? null : key);

  const majFormatted = actu?.updated_at
    ? new Date(actu.updated_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      <RubriqueHeader
        theme={RUBRIQUE_THEMES.hcup}
        icon={Newspaper}
        label="Actu du match"
        isOpen={isOpen}
        loading={loading}
        onToggle={handleToggle}
        badge={actu && majFormatted ? `màj ${majFormatted}` : null}
      />

      {isOpen && (
        <div className="mt-2 space-y-2">
          {error && <p className="text-xs text-gray-400 text-center py-2 italic">{error}</p>}
          {loading && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: HCUP_OR }} />
            </div>
          )}
          {actu && !loading && (
            <>
              {actu.resume_global && actu.resume_global !== 'Synthèse en cours de génération...' && (
                <p className="text-[11px] text-gray-600 italic leading-relaxed px-1">
                  {actu.resume_global}
                </p>
              )}
              {ACTU_HCUP_SECTIONS.map(section => {
                const Icon = section.icon;
                const colors = ACTU_SECTION_COLORS[section.key];
                const isSectionOpen = openSection === section.key;
                const contenu = section.key === 'forme_domicile'
                  ? `🏠 ${match.equipe_domicile}\n${actu.forme_domicile || ''}\n\n🚌 ${match.equipe_exterieure}\n${actu.forme_exterieure || ''}`
                  : actu[section.key];
                const contenuVide = !contenu
                  || /^(information non disponible|non disponible|aucune (information|d[ée]claration)|n\/?a)\.?$/i.test(contenu.trim());
                if (contenuVide) return null;
                return (
                  <div key={section.key} className={`rounded-lg border ${colors.border} overflow-hidden`}>
                    <button
                      onClick={() => toggleSection(section.key)}
                      className={`w-full flex items-center justify-between px-3 py-2 ${colors.bg} hover:opacity-90 transition-opacity`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={`w-3.5 h-3.5 ${colors.color}`} />
                        <span className={`text-[11px] font-bold uppercase tracking-wide ${colors.color}`}>
                          {section.label}
                        </span>
                      </div>
                      {isSectionOpen
                        ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
                        : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                      }
                    </button>
                    {isSectionOpen && (
                      <div className="px-3 py-2.5 bg-white">
                        {contenu.split('\n').map((line, i) => (
                          line.trim() === ''
                            ? <div key={i} className="h-2" />
                            : <p key={i} className="text-[12px] text-gray-700 leading-relaxed">{line}</p>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {(() => {
                const hasCompo = actu.compo_domicile && actu.compo_domicile !== 'Information non disponible';
                const hasBlesses = (actu.blesses_domicile && actu.blesses_domicile !== 'Aucune absence majeure signalée' && actu.blesses_domicile !== 'Information non disponible')
                                || (actu.blesses_exterieure && actu.blesses_exterieure !== 'Aucune absence majeure signalée' && actu.blesses_exterieure !== 'Information non disponible');
                if (!hasCompo && !hasBlesses) return null;
                return (
                  <div className="space-y-3 pt-1">
                    {[
                      { rawName: match.equipe_domicile, compo: actu.compo_domicile, blesses: actu.blesses_domicile },
                      { rawName: match.equipe_exterieure, compo: actu.compo_exterieure, blesses: actu.blesses_exterieure }
                    ].map(({ rawName, compo, blesses }) => {
                      const td = getTeamData(rawName);
                      return (
                        <CompoEtBlessesSection
                          key={rawName}
                          name={(td && td.name) || rawName}
                          logo={td && td.logo}
                          compo={compo}
                          blesses={blesses}
                        />
                      );
                    })}
                  </div>
                );
              })()}
            </>
          )}
        </div>
      )}
    </div>
  );
}



// ============================================
// COMPOSANT : PronoCardHcup (carte d'un match HCup)
// ============================================
function PronoCardHcup({ match, openPanel, onTogglePanel }) {
  const [teamPopup, setTeamPopup] = useState(null);
  const equipeDom = match.equipe_domicile || 'Équipe 1';
  const equipeExt = match.equipe_exterieure || 'Équipe 2';

  const scoreDom = match.score_predit_dom ?? 0;
  const scoreExt = match.score_predit_ext ?? 0;

  const confidencePct = Math.round(match.confiance_algo ?? 0);

  let dateFormatted = 'À VENIR';
  let heureFormatted = '';
  if (match.date_match) {
    try {
      const matchDate = new Date(match.date_match);
      dateFormatted = matchDate.toLocaleDateString('fr-FR', {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
      }).toUpperCase();
      const hours = matchDate.getHours();
      const minutes = matchDate.getMinutes();
      if (hours !== 0 || minutes !== 0) {
        heureFormatted = `${String(hours).padStart(2, '0')}H${String(minutes).padStart(2, '0')}`;
      }
    } catch (error) {
      console.error('Erreur formatage date:', error);
    }
  }

  const teamDomData = getTeamData(equipeDom);
  const teamExtData = getTeamData(equipeExt);

  const winnerLabel = match.winner_predit === 'DOM' ? equipeDom
    : match.winner_predit === 'EXT' ? equipeExt
    : match.winner_predit === 'NUL' ? 'Match nul'
    : null;

  return (
    <div className="w-full bg-gray-50 rounded-lg py-4 border border-gray-200">

      <div className="flex justify-between items-center px-4 mb-3">
        <div className="text-xs font-semibold" style={{ color: '#9a7d3a' }}>{dateFormatted}</div>
        {heureFormatted && (
          <div className="text-xs font-bold" style={{ color: HCUP_OR }}>{heureFormatted}</div>
        )}
      </div>

      <div className="grid grid-cols-3 items-start px-4 mb-2">
        <button type="button" onClick={() => setTeamPopup(equipeDom)}
          className="flex flex-col items-center text-center bg-transparent border-0 p-0 cursor-pointer hover:opacity-80 transition-opacity">
          <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mb-2 shadow-sm">
            <img
              src={teamDomData.logo}
              alt={teamDomData.name}
              className="w-12 h-12 object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
          <div className="text-xs font-bold leading-tight break-words underline decoration-dotted underline-offset-2" style={{ color: HCUP_BLEU }}>
            {equipeDom}
          </div>
        </button>

        <div className="flex flex-col items-center justify-center gap-1">
          <div className="text-xs font-medium mb-1" style={{ color: '#9a7d3a' }}>Score FT prédit</div>
          <div className="flex items-center gap-2 text-[1.65rem] font-bold" style={{ color: HCUP_OR }}>
            {scoreDom} - {scoreExt}
          </div>

          {winnerLabel && (
            <div className="text-[10px] mt-1 px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: HCUP_BLEU, color: HCUP_OR }}>
              🎯 {winnerLabel}
            </div>
          )}
        </div>

        <button type="button" onClick={() => setTeamPopup(equipeExt)}
          className="flex flex-col items-center text-center bg-transparent border-0 p-0 cursor-pointer hover:opacity-80 transition-opacity">
          <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mb-2 shadow-sm">
            <img
              src={teamExtData.logo}
              alt={teamExtData.name}
              className="w-12 h-12 object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
          <div className="text-xs font-bold leading-tight break-words underline decoration-dotted underline-offset-2" style={{ color: HCUP_BLEU }}>
            {equipeExt}
          </div>
        </button>
      </div>

      <BarreIndiceFavori pct={confidencePct} variant="hcup" />

      <div className="px-4">
        <PourquoiCePronostic
          match={match}
          championnat="hcup"
          isOpen={openPanel === 'pourquoi'}
          onToggle={() => onTogglePanel('pourquoi')}
        />
        <InsightsHcup
          match={match}
          isOpen={openPanel === 'insights'}
          onToggle={() => onTogglePanel('insights')}
        />
        <ActuMatchHcup
          match={match}
          isOpen={openPanel === 'actu'}
          onToggle={() => onTogglePanel('actu')}
        />
      </div>

      {teamPopup && (
        <TeamPopup
          equipeNom={teamPopup}
          isHcup
          onClose={() => setTeamPopup(null)}
        />
      )}
    </div>
  );
}
