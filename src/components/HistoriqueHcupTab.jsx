// ============================================
// HISTORIQUE - CHAMPIONS CUP
// Affiche l'historique complet des matchs HCup depuis 2014
// avec filtres par saison et round
// Couleurs : bleu EPCR #003E7E + or #FFC72C
// ============================================

import { useState, useEffect, useMemo } from 'react';
import { Globe, Trophy, Calendar, ChevronDown, ChevronUp, Filter, Check, X, History } from 'lucide-react';
import axios from 'axios';
import { getTeamData } from '../utils/teams';

const API_BASE = 'https://top14-api-production.up.railway.app';

// Couleurs Champions Cup
const HCUP_BLEU = '#003E7E';
const HCUP_OR = '#FFC72C';

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

const ROUND_OPTIONS = [
  'Tous',
  'Poules',
  '8e de finale',
  'Quart de finale',
  'Demi-finale',
  'Finale',
];

export default function HistoriqueHcupTab() {
  const [matchs, setMatchs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtreSaison, setFiltreSaison] = useState('toutes');
  const [filtreRound, setFiltreRound] = useState('Tous');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedSaisons, setExpandedSaisons] = useState(new Set());

  useEffect(() => {
    loadHistorique();
  }, [filtreSaison, filtreRound]);

  const loadHistorique = async () => {
    try {
      setLoading(true);

      // Construire les params de l'endpoint
      const params = {};
      if (filtreSaison !== 'toutes') params.saison = filtreSaison;
      if (filtreRound !== 'Tous') {
        if (filtreRound === 'Poules') params.phase = 'Poules';
        else params.round = filtreRound;
      }

      const response = await axios.get(`${API_BASE}/api/hcup/historique`, { params });
      const matchsData = response.data.matchs || response.data || [];

      // Tri : saison desc, puis round, puis date
      matchsData.sort((a, b) => {
        if (a.saison !== b.saison) return b.saison.localeCompare(a.saison);
        const orderA = ROUND_ORDER[a.round] ?? 99;
        const orderB = ROUND_ORDER[b.round] ?? 99;
        if (orderA !== orderB) return orderA - orderB;
        return new Date(a.date_match) - new Date(b.date_match);
      });

      setMatchs(matchsData);

      // Auto-ouvrir la saison la plus récente au 1er chargement
      if (matchsData.length > 0 && expandedSaisons.size === 0) {
        const saisons = [...new Set(matchsData.map(m => m.saison))].sort().reverse();
        if (saisons.length > 0) setExpandedSaisons(new Set([saisons[0]]));
      }
    } catch (error) {
      console.error('Erreur chargement historique HCup:', error);
      setMatchs([]);
    } finally {
      setLoading(false);
    }
  };

  // Liste des saisons disponibles (pour filtre)
  const saisons = useMemo(() => {
    const set = new Set(matchs.map(m => m.saison));
    return [...set].sort().reverse();
  }, [matchs]);

  // Groupement par saison pour affichage
  const matchsParSaison = useMemo(() => {
    return matchs.reduce((acc, m) => {
      if (!acc[m.saison]) acc[m.saison] = [];
      acc[m.saison].push(m);
      return acc;
    }, {});
  }, [matchs]);

  // Stats globales
  const stats = useMemo(() => {
    const total = matchs.length;
    let okCount = 0;
    let nbPredictions = 0;

    matchs.forEach(m => {
      // Une prédiction est OK si winner_predit == vainqueur réel sur score 80'
      if (m.score_domicile != null && m.score_exterieur != null && m.winner_predit) {
        nbPredictions++;
        const realWinner = m.score_domicile > m.score_exterieur ? 'DOM'
          : m.score_exterieur > m.score_domicile ? 'EXT'
          : 'NUL';
        if (realWinner === m.winner_predit) okCount++;
      }
    });

    const precision = nbPredictions > 0 ? Math.round((okCount / nbPredictions) * 100) : 0;
    return { total, okCount, nbPredictions, precision };
  }, [matchs]);

  const toggleSaison = (saison) => {
    setExpandedSaisons(prev => {
      const newSet = new Set(prev);
      if (newSet.has(saison)) newSet.delete(saison);
      else newSet.add(saison);
      return newSet;
    });
  };

  const resetFilters = () => {
    setFiltreSaison('toutes');
    setFiltreRound('Tous');
  };

  if (loading && matchs.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4" style={{ borderColor: HCUP_BLEU }}></div>
      </div>
    );
  }

  const hasActiveFilters = filtreSaison !== 'toutes' || filtreRound !== 'Tous';

  return (
    <div className="space-y-3">
      {/* Badge HCup + stats compactes */}
      <div className="rounded-lg shadow-md p-3" style={{ background: `linear-gradient(135deg, ${HCUP_BLEU} 0%, #002857 100%)` }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5" style={{ color: HCUP_OR }} />
            <span className="text-sm font-bold uppercase" style={{ color: HCUP_OR }}>
              Historique Champions Cup
            </span>
          </div>
          <History className="w-5 h-5" style={{ color: HCUP_OR, opacity: 0.7 }} />
        </div>

        {/* Stats inline */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg px-2 py-1.5">
            <p className="text-[10px] text-white/70">Matchs</p>
            <p className="text-lg font-bold" style={{ color: HCUP_OR }}>{stats.total}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg px-2 py-1.5">
            <p className="text-[10px] text-white/70">Prédictions OK</p>
            <p className="text-lg font-bold" style={{ color: HCUP_OR }}>{stats.okCount}/{stats.nbPredictions}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg px-2 py-1.5">
            <p className="text-[10px] text-white/70">Précision</p>
            <p className="text-lg font-bold" style={{ color: HCUP_OR }}>{stats.precision}%</p>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" style={{ color: HCUP_BLEU }} />
            <span className="font-semibold text-sm text-gray-800">Filtres</span>
            {hasActiveFilters && (
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                style={{ backgroundColor: HCUP_OR, color: HCUP_BLEU }}
              >
                Actifs
              </span>
            )}
          </div>
          {showFilters ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </button>

        {showFilters && (
          <div className="p-4 border-t border-gray-100 space-y-3">
            {/* Filtre Saison */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Saison</label>
              <select
                value={filtreSaison}
                onChange={(e) => setFiltreSaison(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': HCUP_BLEU }}
              >
                <option value="toutes">Toutes les saisons</option>
                {saisons.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Filtre Round */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Phase</label>
              <select
                value={filtreRound}
                onChange={(e) => setFiltreRound(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': HCUP_BLEU }}
              >
                {ROUND_OPTIONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="w-full text-xs font-semibold py-2 rounded-lg border transition-colors hover:bg-gray-50"
                style={{ borderColor: HCUP_BLEU, color: HCUP_BLEU }}
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        )}
      </div>

      {/* Loading overlay si rechargement */}
      {loading && matchs.length > 0 && (
        <div className="text-center py-2">
          <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2" style={{ borderColor: HCUP_BLEU }}></div>
        </div>
      )}

      {/* Liste des matchs groupés par saison */}
      {matchs.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-6 text-center border border-rugby-gray">
          <p className="text-gray-500">Aucun match trouvé pour ces filtres</p>
        </div>
      ) : (
        <div className="space-y-2">
          {Object.entries(matchsParSaison).map(([saison, matchsList]) => {
            const isExpanded = expandedSaisons.has(saison);

            return (
              <div
                key={saison}
                className="bg-white rounded-lg shadow-sm border border-rugby-gray overflow-hidden"
              >
                <button
                  onClick={() => toggleSaison(saison)}
                  className="w-full px-3 py-2 border-b transition-colors"
                  style={{
                    backgroundColor: 'rgba(0,62,126,0.08)',
                    borderColor: 'rgba(255,199,44,0.3)'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" style={{ color: HCUP_OR }} />
                      <span className="font-bold text-sm" style={{ color: HCUP_BLEU }}>Saison {saison}</span>
                      <span className="text-xs text-gray-500">
                        ({matchsList.length} {matchsList.length > 1 ? 'matchs' : 'match'})
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
                  <div className="p-2 space-y-2">
                    {matchsList.map(match => (
                      <MatchHistoriqueCard key={match.match_id || match.id} match={match} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================
// COMPOSANT : MatchHistoriqueCard
// Affichage compact d'un match historique
// ============================================
function MatchHistoriqueCard({ match }) {
  const teamDom = getTeamData(match.equipe_domicile || '');
  const teamExt = getTeamData(match.equipe_exterieure || '');

  const isPhaseFinale = PHASE_FINALE_ROUNDS.includes(match.round);
  const hasProlongation = match.prolongation === true;

  // Score à 80' (résolution paris)
  const scoreDom80 = match.score_domicile;
  const scoreExt80 = match.score_exterieur;

  // Score final
  const scoreFinalDom = match.score_final_domicile ?? scoreDom80;
  const scoreFinalExt = match.score_final_exterieur ?? scoreExt80;

  // Scores prédits
  const scorePreditDom = match.score_dom_predit ?? match.score_predit_dom;
  const scorePreditExt = match.score_ext_predit ?? match.score_predit_ext;

  // Prédiction OK/KO sur le score 80'
  let predictionOK = null;
  if (scoreDom80 != null && scoreExt80 != null && match.winner_predit) {
    const realWinner = scoreDom80 > scoreExt80 ? 'DOM'
      : scoreExt80 > scoreDom80 ? 'EXT'
      : 'NUL';
    predictionOK = realWinner === match.winner_predit;
  }

  // Format date
  let dateFormatted = '';
  if (match.date_match) {
    try {
      dateFormatted = new Date(match.date_match).toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'short'
      });
    } catch {}
  }

  return (
    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
      {/* Header : round + date */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isPhaseFinale && <Trophy className="w-3 h-3" style={{ color: HCUP_OR }} />}
          <span className="text-[11px] font-semibold" style={{ color: HCUP_BLEU }}>
            {match.round}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {dateFormatted && (
            <span className="text-[11px] text-gray-500">{dateFormatted}</span>
          )}
          {predictionOK === true && (
            <span className="px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold flex items-center gap-0.5">
              <Check className="w-3 h-3" /> OK
            </span>
          )}
          {predictionOK === false && (
            <span className="px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold flex items-center gap-0.5">
              <X className="w-3 h-3" /> KO
            </span>
          )}
        </div>
      </div>

      {/* Match : équipes + scores */}
      <div className="grid grid-cols-3 items-center gap-2">
        {/* Domicile */}
        <div className="flex items-center gap-2">
          <img
            src={teamDom.logo}
            alt={teamDom.name}
            className="w-7 h-7 object-contain flex-shrink-0"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <span className="text-xs font-semibold truncate text-gray-800">
            {match.equipe_domicile}
          </span>
        </div>

        {/* Score (centré) */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-base font-bold" style={{ color: HCUP_BLEU }}>
            <span>{scoreDom80 ?? '-'}</span>
            <span className="text-gray-400">-</span>
            <span>{scoreExt80 ?? '-'}</span>
          </div>
          {hasProlongation && (
            <p className="text-[9px] italic text-gray-500 mt-0.5">
              Final : {scoreFinalDom}-{scoreFinalExt} (a.p.)
            </p>
          )}
        </div>

        {/* Extérieur */}
        <div className="flex items-center gap-2 justify-end">
          <span className="text-xs font-semibold truncate text-gray-800 text-right">
            {match.equipe_exterieure}
          </span>
          <img
            src={teamExt.logo}
            alt={teamExt.name}
            className="w-7 h-7 object-contain flex-shrink-0"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </div>
      </div>

      {/* Prédiction algo (si disponible) */}
      {scorePreditDom != null && scorePreditExt != null && (
        <div className="mt-2 pt-2 border-t border-gray-200 flex items-center justify-between text-[10px] text-gray-500">
          <span>Algo : {scorePreditDom}-{scorePreditExt}</span>
          {match.confiance_pct != null && (
            <span>Confiance : {Math.round(match.confiance_pct)}%</span>
          )}
        </div>
      )}
    </div>
  );
}
