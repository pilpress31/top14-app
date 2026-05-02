// ============================================
// ALGO PRONOS - CHAMPIONS CUP
// Affiche les pronostics de l'algo XGBoost V3
// pour les matchs HCup à venir, groupés par round
// Couleurs : bleu EPCR #003E7E + or #FFC72C
// ============================================

import { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronDown, ChevronUp, Globe, Trophy, Loader2 } from 'lucide-react';
import axios from 'axios';
import { getTeamData } from '../utils/teams';
import { useRealtimeSync } from '../hooks/useRealtimeSync';

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

export default function AlgoPronosHcupTab() {
  const [pronos, setPronos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRounds, setExpandedRounds] = useState(new Set());
  const roundRefs = useRef({});
  const isFirstLoad = useRef(true);

  // Realtime : refresh quand les cotes ou les matchs changent
  useRealtimeSync([
    { table: 'cotes_hcup', onUpdate: () => loadPronos() },
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
      // L'endpoint /api/hcup/matchs/a-venir retourne les matchs avec leurs cotes
      const response = await axios.get(`${API_BASE}/api/hcup/matchs/a-venir`);
      const raw = response.data.matchs || response.data || [];

      // Normaliser : on a besoin de equipe_domicile, equipe_exterieure, score_predit, confiance
      const pronosData = raw.map(m => ({
        id: m.match_id || m.id,
        match_id: m.match_id || m.id,
        equipe_domicile: m.equipe_domicile,
        equipe_exterieure: m.equipe_exterieure,
        round: m.round,
        date: m.date_match,
        score_predit_dom: m.score_dom_predit ?? m.score_predit_dom ?? 0,
        score_predit_ext: m.score_ext_predit ?? m.score_predit_ext ?? 0,
        confiance_algo: typeof m.confiance_pct === 'number' ? m.confiance_pct
          : typeof m.confiance_algo === 'number' ? (m.confiance_algo > 1 ? m.confiance_algo : m.confiance_algo * 100)
          : 0,
        cote_domicile: m.cote_domicile ?? m.cote_dom ?? null,
        cote_nul: m.cote_nul ?? null,
        cote_exterieure: m.cote_exterieure ?? m.cote_ext ?? null,
        proba_domicile: m.proba_domicile ?? null,
        proba_nul: m.proba_nul ?? null,
        proba_exterieure: m.proba_exterieure ?? null,
        winner_predit: m.winner_predit ?? null,
        prolongation: m.prolongation ?? false,
      }));

      // Tri par round puis par date
      pronosData.sort((a, b) => {
        const orderA = ROUND_ORDER[a.round] ?? 99;
        const orderB = ROUND_ORDER[b.round] ?? 99;
        if (orderA !== orderB) return orderA - orderB;
        return new Date(a.date) - new Date(b.date);
      });

      setPronos(pronosData);

      // Au 1er chargement : ouvrir le 1er round disponible
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

  // Liste des rounds présents, triés
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
      {/* Badge HCup */}
      <div
        className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg w-fit mx-auto mb-3"
        style={{ backgroundColor: HCUP_BLEU }}
      >
        <Globe className="w-4 h-4" style={{ color: HCUP_OR }} />
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: HCUP_OR }}>
          Pronostics Champions Cup
        </span>
      </div>

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
                  <PronoCardHcup key={prono.id} match={prono} />
                ))}

                {/* Mention prolongation pour phase finale */}
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
// Carte de pronostic d'un match HCup
// ============================================
function PronoCardHcup({ match }) {
  const equipeDom = match.equipe_domicile || 'Équipe 1';
  const equipeExt = match.equipe_exterieure || 'Équipe 2';

  const scoreDom = match.score_predit_dom ?? 0;
  const scoreExt = match.score_predit_ext ?? 0;

  const confidencePct = Math.round(match.confiance_algo ?? 0);
  const [animatedWidth, setAnimatedWidth] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setAnimatedWidth(confidencePct), 100);
    return () => clearTimeout(timer);
  }, [confidencePct]);

  // Format date
  let dateFormatted = 'À VENIR';
  let heureFormatted = '';
  if (match.date) {
    try {
      const matchDate = new Date(match.date);
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

  // Vainqueur prédit (DOM/EXT/NUL)
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
        {/* Équipe domicile */}
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

        {/* Score prédit */}
        <div className="flex flex-col items-center justify-center gap-1">
          <div className="text-xs font-medium mb-1" style={{ color: '#9a7d3a' }}>Score prédit</div>
          <div className="flex items-center gap-2 text-[1.65rem] font-bold" style={{ color: HCUP_OR }}>
            {scoreDom} - {scoreExt}
          </div>

          {/* Vainqueur prédit */}
          {winnerLabel && (
            <div className="text-[10px] mt-1 px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: HCUP_BLEU, color: HCUP_OR }}>
              🎯 {winnerLabel}
            </div>
          )}
        </div>

        {/* Équipe extérieure */}
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

      {/* Cotes 1-N-2 (si disponibles) */}
      {(match.cote_domicile || match.cote_nul || match.cote_exterieure) && (
        <div className="mt-6 px-4">
          <div className="text-xs font-semibold mb-2" style={{ color: '#9a7d3a' }}>Cotes</div>
          <div className="grid grid-cols-3 gap-2">
            {/* Cote domicile */}
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

            {/* Cote nul */}
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

            {/* Cote extérieure */}
            <div className="bg-white rounded-lg p-2 border border-gray-200 text-center">
              <p className="text-[10px] text-gray-500 mb-0.5">Extérieur</p>
              <p className="text-sm font-bold" style={{ color: HCUP_BLEU }}>
                ×{match.cote_exterieure?.toFixed(2) || '-'}
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
