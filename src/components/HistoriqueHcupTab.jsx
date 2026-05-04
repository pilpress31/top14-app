// ============================================
// HISTORIQUE - CHAMPIONS CUP
// Source : GET /api/hcup/historique?saison=&round=&phase=
// Couleurs : bleu EPCR #003E7E + or #FFC72C
// ============================================

import { useState, useEffect, useMemo } from 'react';
import { Globe, Trophy, Calendar, ChevronDown, ChevronUp, Filter, Check, X, History } from 'lucide-react';
import axios from 'axios';
import { getTeamData } from '../utils/teams';

const API_BASE = 'https://top14-api-production.up.railway.app';

const HCUP_BLEU = '#003E7E';
const HCUP_OR = '#FFC72C';

// Ordre d'affichage : phase finale EN HAUT, poules en bas
// (ordre inverse pour voir d'abord les matchs les plus prestigieux)
const ROUND_ORDER = {
  'Finale': 1,
  'Demi-finale': 2,
  'Quart de finale': 3,
  '8e de finale': 4,
  'Poule J6': 10,
  'Poule J5': 11,
  'Poule J4': 12,
  'Poule J3': 13,
  'Poule J2': 14,
  'Poule J1': 15,
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

// Liste des saisons (12 saisons, 2014→2026)
const SAISONS_OPTIONS = [
  '2025-2026', '2024-2025', '2023-2024', '2022-2023', '2021-2022', '2020-2021',
  '2019-2020', '2018-2019', '2017-2018', '2016-2017', '2015-2016', '2014-2015',
];

export default function HistoriqueHcupTab() {
  const [matchs, setMatchs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtreSaison, setFiltreSaison] = useState('toutes');
  const [filtreRound, setFiltreRound] = useState('Tous');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedSaisons, setExpandedSaisons] = useState(new Set());
  // 🆕 Groupes (round ou poule) ouverts/fermés. Clé = "saison|groupKey"
  const [expandedGroupes, setExpandedGroupes] = useState(new Set());

  useEffect(() => {
    loadHistorique();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtreSaison, filtreRound]);

  const loadHistorique = async () => {
    try {
      setLoading(true);

      const params = { limit: 1000 };
      if (filtreSaison !== 'toutes') params.saison = filtreSaison;
      if (filtreRound !== 'Tous') {
        if (filtreRound === 'Poules') params.phase = 'Poules';
        else params.round = filtreRound;
      }

      const response = await axios.get(`${API_BASE}/api/hcup/historique`, { params });
      const matchsData = response.data.matchs || [];

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

  // 🆕 Groupement par saison ET sous-groupes (phases finales + poules)
  // Structure : { saison: { groupes: [{ key, label, type, matchs }], total } }
  const matchsParSaison = useMemo(() => {
    const result = {};

    matchs.forEach(m => {
      if (!result[m.saison]) {
        result[m.saison] = { _byGroup: {}, _order: [], total: 0 };
      }
      const seasonData = result[m.saison];
      seasonData.total++;

      const isPhaseFinale = PHASE_FINALE_ROUNDS.includes(m.round);
      let groupKey, groupLabel, groupOrder, groupType;

      if (isPhaseFinale) {
        // Phase finale : 1 groupe par round (Finale, Demi, Quart, 8e)
        groupKey = `phase:${m.round}`;
        groupLabel = m.round;
        groupOrder = ROUND_ORDER[m.round] ?? 99;
        groupType = 'phase';
      } else if (m.poule) {
        // Phase de poule avec poule renseignée → groupe par poule
        groupKey = `poule:${m.poule}`;
        groupLabel = `Poule ${m.poule}`;
        // Ordre : poule 1 avant poule 2 (mais après phase finale)
        groupOrder = 100 + parseInt(m.poule, 10);
        groupType = 'poule';
      } else {
        // Phase de poule sans poule renseignée → fallback par round (J1, J2…)
        groupKey = `round:${m.round}`;
        groupLabel = m.round;
        groupOrder = ROUND_ORDER[m.round] ?? 99;
        groupType = 'round';
      }

      if (!seasonData._byGroup[groupKey]) {
        seasonData._byGroup[groupKey] = {
          key: groupKey,
          label: groupLabel,
          type: groupType,
          order: groupOrder,
          matchs: [],
        };
        seasonData._order.push(groupKey);
      }
      seasonData._byGroup[groupKey].matchs.push(m);
    });

    // Convertir en tableau ordonné de groupes par saison
    Object.keys(result).forEach(saison => {
      const groupes = Object.values(result[saison]._byGroup)
        .sort((a, b) => a.order - b.order);

      // Trier les matchs au sein d'un groupe par date
      groupes.forEach(g => {
        g.matchs.sort((a, b) => new Date(a.date_match) - new Date(b.date_match));
      });

      result[saison] = { groupes, total: result[saison].total };
    });

    return result;
  }, [matchs]);

  // Stats globales :
  //   - "total" : nombre de matchs AFFICHÉS (peut être filtré par saison)
  //   - "okCount/nbPredictions/precision" : calculés UNIQUEMENT sur la SAISON COURANTE
  //     (= test set du modèle XGBoost, hors-échantillon).
  //   Calculer sur tout l'historique gonflerait artificiellement la précision car
  //   le modèle a été entraîné sur 2014-2024 (data leakage).
  const stats = useMemo(() => {
    const total = matchs.length;

    // Détecter dynamiquement la saison courante = la saison max présente dans les matchs
    // (alphabétiquement, "2025-2026" > "2024-2025" donc OK)
    const saisonCourante = matchs.length > 0
      ? matchs.map(m => m.saison).sort().reverse()[0]
      : null;

    let okCount = 0;
    let nbPredictions = 0;

    matchs.forEach(m => {
      // On ne compte que les matchs de la saison courante (test set du modèle)
      if (m.saison !== saisonCourante) return;
      // Une prédiction est OK si winner_predit (calculé backend) == vainqueur réel sur 80'
      if (m.score_domicile != null && m.score_exterieur != null && m.winner_predit) {
        nbPredictions++;
        const realWinner = m.score_domicile > m.score_exterieur ? 'DOM'
          : m.score_exterieur > m.score_domicile ? 'EXT'
          : 'NUL';
        if (realWinner === m.winner_predit) okCount++;
      }
    });

    const precision = nbPredictions > 0 ? Math.round((okCount / nbPredictions) * 100) : 0;
    return { total, okCount, nbPredictions, precision, saisonCourante };
  }, [matchs]);

  const toggleSaison = (saison) => {
    setExpandedSaisons(prev => {
      const newSet = new Set(prev);
      if (newSet.has(saison)) newSet.delete(saison);
      else newSet.add(saison);
      return newSet;
    });
  };

  // 🆕 Toggle d'un sous-groupe (phase finale ou poule)
  const toggleGroupe = (saison, groupKey) => {
    const fullKey = `${saison}|${groupKey}`;
    setExpandedGroupes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fullKey)) newSet.delete(fullKey);
      else newSet.add(fullKey);
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
      {/* Header HCup avec stats */}
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
                {SAISONS_OPTIONS.map(s => (
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

      {/* Loading overlay */}
      {loading && matchs.length > 0 && (
        <div className="text-center py-2">
          <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2" style={{ borderColor: HCUP_BLEU }}></div>
        </div>
      )}

      {/* Liste des matchs */}
      {matchs.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-6 text-center border border-rugby-gray">
          <p className="text-gray-500">Aucun match trouvé pour ces filtres</p>
        </div>
      ) : (
        <div className="space-y-2">
          {Object.entries(matchsParSaison).map(([saison, seasonData]) => {
            const isExpanded = expandedSaisons.has(saison);
            const { groupes, total } = seasonData;

            return (
              <div
                key={saison}
                className="bg-white rounded-lg shadow-sm border border-rugby-gray overflow-hidden"
              >
                {/* En-tête saison */}
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
                        ({total} {total > 1 ? 'matchs' : 'match'})
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" style={{ color: HCUP_OR }} />
                    ) : (
                      <ChevronDown className="w-4 h-4" style={{ color: HCUP_OR }} />
                    )}
                  </div>
                </button>

                {/* Sous-groupes : phases finales puis poules */}
                {isExpanded && (
                  <div className="p-2 space-y-1.5">
                    {groupes.map(groupe => {
                      const groupFullKey = `${saison}|${groupe.key}`;
                      const isGroupExpanded = expandedGroupes.has(groupFullKey);
                      const isPhase = groupe.type === 'phase';

                      return (
                        <div
                          key={groupe.key}
                          className="rounded-md overflow-hidden border"
                          style={{
                            borderColor: isPhase ? 'rgba(255,199,44,0.4)' : 'rgba(0,62,126,0.15)',
                          }}
                        >
                          {/* Bouton du sous-groupe */}
                          <button
                            onClick={() => toggleGroupe(saison, groupe.key)}
                            className="w-full px-3 py-1.5 transition-colors flex items-center justify-between"
                            style={{
                              backgroundColor: isPhase
                                ? 'rgba(255,199,44,0.12)'
                                : 'rgba(0,62,126,0.05)',
                            }}
                          >
                            <div className="flex items-center gap-2">
                              {isPhase
                                ? <Trophy className="w-3.5 h-3.5" style={{ color: HCUP_OR }} />
                                : <span
                                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                                    style={{ backgroundColor: HCUP_BLEU, color: HCUP_OR }}
                                  >
                                    {groupe.label.replace('Poule ', '')}
                                  </span>
                              }
                              <span
                                className="font-semibold text-xs"
                                style={{ color: isPhase ? HCUP_BLEU : HCUP_BLEU }}
                              >
                                {groupe.label}
                              </span>
                              <span className="text-[10px] text-gray-500">
                                ({groupe.matchs.length})
                              </span>
                            </div>
                            {isGroupExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" style={{ color: HCUP_OR }} />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" style={{ color: HCUP_OR }} />
                            )}
                          </button>

                          {/* Matchs du sous-groupe */}
                          {isGroupExpanded && (
                            <div className="p-2 space-y-2 bg-white">
                              {groupe.matchs.map(match => (
                                <MatchHistoriqueCard key={match.match_id} match={match} />
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
          })}
        </div>
      )}
    </div>
  );
}

// ============================================
// COMPOSANT : MatchHistoriqueCard
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

  // Scores prédits (champs réels du backend)
  const scorePreditDom = match.score_predit_dom;
  const scorePreditExt = match.score_predit_ext;

  // Prédiction OK/KO sur le score 80'
  let predictionOK = null;
  if (scoreDom80 != null && scoreExt80 != null && match.winner_predit) {
    const realWinner = scoreDom80 > scoreExt80 ? 'DOM'
      : scoreExt80 > scoreDom80 ? 'EXT'
      : 'NUL';
    predictionOK = realWinner === match.winner_predit;
  }

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

        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-base font-bold" style={{ color: HCUP_BLEU }}>
            <span>{scoreDom80 ?? '-'}</span>
            <span className="text-gray-400">-</span>
            <span>{scoreExt80 ?? '-'}</span>
          </div>
          {hasProlongation && (scoreFinalDom !== scoreDom80 || scoreFinalExt !== scoreExt80) && (
            <p className="text-[9px] italic text-gray-500 mt-0.5">
              Final : {scoreFinalDom}-{scoreFinalExt} (a.p.)
            </p>
          )}
        </div>

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

      {/* Prédiction algo */}
      {scorePreditDom != null && scorePreditExt != null && (
        <div className="mt-2 pt-2 border-t border-gray-200 flex items-center justify-between text-[10px] text-gray-500">
          <span>Algo : {scorePreditDom}-{scorePreditExt}</span>
          {match.confiance_algo != null && (
            <span>Confiance : {Math.round(match.confiance_algo)}%</span>
          )}
        </div>
      )}
    </div>
  );
}
