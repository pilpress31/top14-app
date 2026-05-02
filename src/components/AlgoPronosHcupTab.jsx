// ============================================
// ALGO PRONOS - CHAMPIONS CUP
// Source : GET /api/hcup/matchs/a-venir
// Couleurs : bleu EPCR #003E7E + or #FFC72C
// ============================================

import { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronDown, ChevronUp, Globe, Trophy } from 'lucide-react';
import axios from 'axios';
import { getTeamData } from '../utils/teams';
import { useRealtimeSync } from '../hooks/useRealtimeSync';

const API_BASE = 'https://top14-api-production.up.railway.app';

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

export default function AlgoPronosHcupTab() {
  const [pronos, setPronos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRounds, setExpandedRounds] = useState(new Set());
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

      // Normaliser : calculer winner_predit côté frontend si pas envoyé
      const pronosData = raw.map(m => {
        let winner_predit = m.winner_predit ?? null;
        if (!winner_predit && m.score_predit_dom != null && m.score_predit_ext != null) {
          winner_predit = m.score_predit_dom > m.score_predit_ext ? 'DOM'
                        : m.score_predit_dom < m.score_predit_ext ? 'EXT' : 'NUL';
        }
        return { ...m, winner_predit };
      });

      // Tri : round → date
      pronosData.sort((a, b) => {
        const orderA = ROUND_ORDER[a.round] ?? 99;
        const orderB = ROUND_ORDER[b.round] ?? 99;
        if (orderA !== orderB) return orderA - orderB;
        return new Date(a.date_match) - new Date(b.date_match);
      });

      setPronos(pronosData);

      // Au 1er chargement : ouvrir le 1er round
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
        <Globe className="w-12 h-12 mx-auto mb-2" style={{ color: HCUP_BLEU, opacity: 0.5 }} />
        <p className="text-gray-500">Aucun pronostic Champions Cup disponible</p>
        <p className="text-xs text-gray-400 mt-1">Reviens plus tard pour les prochains matchs</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      

      {rounds.map(round => {
        const isExpanded = expandedRounds.has(round);
        const pronosRound = pronosParRound[round] || [];
        const isPhaseFinale = PHASE_FINALE_ROUNDS.includes(round);

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
                    ({pronosRound.length} {pronosRound.length > 1 ? 'matchs' : 'match'})
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
                  <PronoCardHcup key={prono.match_id} match={prono} />
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

// ============================================
// COMPOSANT : PronoCardHcup
// ============================================
function PronoCardHcup({ match }) {
  const equipeDom = match.equipe_domicile || 'Équipe 1';
  const equipeExt = match.equipe_exterieure || 'Équipe 2';

  // Champs réels du backend : score_predit_dom, score_predit_ext, confiance_algo
  // Note : le backend retourne cote_exterieur (sans e) pas cote_exterieure
  const scoreDom = match.score_predit_dom ?? 0;
  const scoreExt = match.score_predit_ext ?? 0;

  // confiance_algo est en % (50 à 100 selon contrainte SQL)
  const confidencePct = Math.round(match.confiance_algo ?? 0);
  const [animatedWidth, setAnimatedWidth] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setAnimatedWidth(confidencePct), 100);
    return () => clearTimeout(timer);
  }, [confidencePct]);

  // Format date
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

      {/* Date + Heure */}
      <div className="flex justify-between items-center px-4 mb-3">
        <div className="text-xs font-semibold" style={{ color: '#9a7d3a' }}>{dateFormatted}</div>
        {heureFormatted && (
          <div className="text-xs font-bold" style={{ color: HCUP_OR }}>{heureFormatted}</div>
        )}
      </div>

      {/* Équipes + scores */}
      <div className="grid grid-cols-3 items-start px-4 mb-2">
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mb-2 shadow-sm">
            <img
              src={teamDomData.logo}
              alt={teamDomData.name}
              className="w-12 h-12 object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
          <div className="text-base font-bold leading-tight break-words line-clamp-2" style={{ color: HCUP_BLEU }}>
            {equipeDom}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-1">
          <div className="text-xs font-medium mb-1" style={{ color: '#9a7d3a' }}>Score prédit</div>
          <div className="flex items-center gap-2 text-[1.65rem] font-bold" style={{ color: HCUP_OR }}>
            {scoreDom} - {scoreExt}
          </div>

          {winnerLabel && (
            <div className="text-[10px] mt-1 px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: HCUP_BLEU, color: HCUP_OR }}>
              🎯 {winnerLabel}
            </div>
          )}
        </div>

        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mb-2 shadow-sm">
            <img
              src={teamExtData.logo}
              alt={teamExtData.name}
              className="w-12 h-12 object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
          <div className="text-base font-bold leading-tight break-words line-clamp-2" style={{ color: HCUP_BLEU }}>
            {equipeExt}
          </div>
        </div>
      </div>

      {/* Barre confiance algo */}
      <div className="mt-4 px-4">
        <div className="flex justify-between text-xs mb-2" style={{ color: '#9a7d3a' }}>
          <span className="font-medium">Confiance algo</span>
          <span className="font-bold" style={{ color: HCUP_OR }}>{confidencePct}%</span>
        </div>
        <div className="relative w-full bg-gray-200 rounded-full h-[7px]">
          <div className="absolute top-0 left-1/4 w-px h-full bg-gray-300"></div>
          <div className="absolute top-0 left-1/2 w-px h-full bg-gray-300"></div>
          <div className="absolute top-0 left-3/4 w-px h-full bg-gray-300"></div>
          <div className="absolute -bottom-3 left-1/4 text-[10px] text-gray-500 transform -translate-x-1/2">25%</div>
          <div className="absolute -bottom-3 left-1/2 text-[10px] text-gray-500 transform -translate-x-1/2">50%</div>
          <div className="absolute -bottom-3 left-3/4 text-[10px] text-gray-500 transform -translate-x-1/2">75%</div>
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${animatedWidth}%`,
              background: 'linear-gradient(to right, #ef4444, #f59e0b, #22c55e)',
            }}
          />
        </div>
      </div>

      {/* Cotes 1-N-2 (note : backend retourne cote_exterieur sans 'e') */}
      {(match.cote_domicile || match.cote_nul || match.cote_exterieur) && (
        <div className="mt-6 px-4">
          <div className="text-xs font-semibold mb-2" style={{ color: '#9a7d3a' }}>Cotes</div>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white rounded-lg p-2 border border-gray-200 text-center">
              <p className="text-[10px] text-gray-500 mb-0.5">Domicile</p>
              <p className="text-sm font-bold" style={{ color: HCUP_BLEU }}>
                ×{match.cote_domicile?.toFixed(2) || '-'}
              </p>
              {match.proba_domicile != null && (
                <p className="text-[9px] text-gray-400">
                  {Math.round(match.proba_domicile * 100)}%
                </p>
              )}
            </div>

            <div className="bg-white rounded-lg p-2 border border-gray-200 text-center">
              <p className="text-[10px] text-gray-500 mb-0.5">Nul</p>
              <p className="text-sm font-bold" style={{ color: HCUP_BLEU }}>
                ×{match.cote_nul?.toFixed(2) || '-'}
              </p>
              {match.proba_nul != null && (
                <p className="text-[9px] text-gray-400">
                  {Math.round(match.proba_nul * 100)}%
                </p>
              )}
            </div>

            <div className="bg-white rounded-lg p-2 border border-gray-200 text-center">
              <p className="text-[10px] text-gray-500 mb-0.5">Extérieur</p>
              <p className="text-sm font-bold" style={{ color: HCUP_BLEU }}>
                ×{match.cote_exterieur?.toFixed(2) || '-'}
              </p>
              {match.proba_exterieure != null && (
                <p className="text-[9px] text-gray-400">
                  {Math.round(match.proba_exterieure * 100)}%
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
