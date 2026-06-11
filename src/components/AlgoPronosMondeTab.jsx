// ============================================
// ALGO PRONOS - RUGBY INTERNATIONAL (MONDE)
// Source : GET /api/monde/matchs/a-venir
// Vitrine des prédictions de l'algo (pas de betting ici → page Paris).
// Groupé par date, barre de probabilité, badge phase finale.
// Couleurs : charte MONDE (vert émeraude / émeraude)
// ============================================

import { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronDown, ChevronUp, Brain, Trophy } from 'lucide-react';
import axios from 'axios';
import { getTeamData } from '../utils/teams';
import { useRealtimeSync } from '../hooks/useRealtimeSync';
import { getCharte } from '../constants/chartes';

const API_BASE = 'https://top14-api-production.up.railway.app';
const { vert: MONDE_GREEN, emeraude: MONDE_ACCENT } = getCharte('monde').base;

const PHASE_FINALE = (p) => {
  const s = (p || '').toString().toLowerCase();
  return s.includes('finale') || s.includes('quart') || s.includes('demi')
      || s.includes('barrage') || s.includes('huiti') || s.includes('8e');
};

const dateKeyOf = (m) => {
  const s = String(m.date_match || m.date || '');
  const iso = s.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : 'date-inconnue';
};
const labelDate = (key) => {
  if (key === 'date-inconnue') return 'Date à confirmer';
  const d = new Date(key + 'T12:00:00');
  const t = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return t.charAt(0).toUpperCase() + t.slice(1);
};

export default function AlgoPronosMondeTab() {
  const [pronos, setPronos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedDates, setExpandedDates] = useState(new Set());
  const isFirstLoad = useRef(true);

  useRealtimeSync([
    { table: 'match_cotes_monde', onUpdate: () => loadPronos() },
    { table: 'matchs_monde', onUpdate: () => loadPronos() },
  ]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    loadPronos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPronos = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/monde/matchs/a-venir`);
      const raw = response.data.matchs || [];
      const data = raw.map(m => {
        let winner_predit = m.winner_predit ?? null;
        if (!winner_predit && m.score_predit_dom != null && m.score_predit_ext != null) {
          winner_predit = m.score_predit_dom > m.score_predit_ext ? 'DOM'
                        : m.score_predit_dom < m.score_predit_ext ? 'EXT' : 'NUL';
        }
        return { ...m, winner_predit };
      });
      data.sort((a, b) => new Date(a.date_match) - new Date(b.date_match));
      setPronos(data);

      if (isFirstLoad.current && data.length > 0) {
        const dates = [...new Set(data.map(dateKeyOf))].sort();
        if (dates.length > 0) setExpandedDates(new Set([dates[0]]));
        isFirstLoad.current = false;
      }
    } catch (e) {
      console.error('Erreur chargement pronos MONDE:', e);
      setPronos([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleDate = (key) => {
    setExpandedDates(prev => (prev.has(key) ? new Set() : new Set([key])));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4" style={{ borderColor: MONDE_GREEN }} />
      </div>
    );
  }

  if (pronos.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 text-center border border-gray-200">
        <p className="text-gray-500">Aucun match international à venir</p>
        <p className="text-xs text-gray-400 mt-2">Les prédictions s'afficheront dès la prochaine fenêtre internationale</p>
      </div>
    );
  }

  // Groupement par date
  const parDate = pronos.reduce((acc, m) => {
    const k = dateKeyOf(m);
    (acc[k] = acc[k] || []).push(m);
    return acc;
  }, {});
  const dateKeys = Object.keys(parDate).sort();

  const ProbaBar = ({ m }) => {
    const pd = Number(m.proba_domicile) || 0;
    const pn = Number(m.proba_nul) || 0;
    const pe = Number(m.proba_exterieure) || 0;
    const tot = pd + pn + pe;
    if (tot <= 0) return null;
    const wd = Math.round((pd / tot) * 100);
    const wn = Math.round((pn / tot) * 100);
    const we = 100 - wd - wn;
    return (
      <div className="mt-2">
        <div className="flex h-1.5 rounded-full overflow-hidden border border-gray-200">
          <div style={{ width: `${wd}%`, backgroundColor: '#3b82f6' }} title={`1 : ${wd}%`} />
          <div style={{ width: `${wn}%`, backgroundColor: '#9ca3af' }} title={`N : ${wn}%`} />
          <div style={{ width: `${we}%`, backgroundColor: '#ef4444' }} title={`2 : ${we}%`} />
        </div>
        <div className="flex justify-between text-[9px] text-gray-500 mt-0.5">
          <span>1 · {wd}%</span>
          <span>N · {wn}%</span>
          <span>{we}% · 2</span>
        </div>
      </div>
    );
  };

  const Carte = ({ m }) => {
    const teamDom = getTeamData(m.equipe_domicile);
    const teamExt = getTeamData(m.equipe_exterieure);
    const hasPred = m.score_predit_dom != null && m.score_predit_ext != null;
    const winnerName = m.winner_predit === 'DOM' ? m.equipe_domicile
                     : m.winner_predit === 'EXT' ? m.equipe_exterieure
                     : m.winner_predit === 'NUL' ? 'Match nul' : null;
    return (
      <div className="px-3 py-3">
        <div className="flex items-center justify-end gap-1.5 mb-2 flex-wrap">
          {PHASE_FINALE(m.phase) && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse"
              style={{ backgroundColor: '#FCD34D', color: '#064E3B' }}>
              🏆 {m.phase}
            </span>
          )}
          {m.competition && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: 'rgba(11,110,79,0.1)', color: MONDE_GREEN }}>
              {m.competition}
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 items-center px-1">
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-1 shadow-sm">
              <img src={teamDom.logo} alt={m.equipe_domicile} className="w-12 h-12 object-contain"
                onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            </div>
            <span className="text-xs font-bold text-gray-900 leading-tight line-clamp-2 uppercase">{m.equipe_domicile}</span>
          </div>

          <div className="flex flex-col items-center">
            {hasPred ? (
              <>
                <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: MONDE_GREEN }}>Prono IA</span>
                <div className="text-2xl font-bold leading-none" style={{ color: MONDE_GREEN }}>
                  {m.score_predit_dom} – {m.score_predit_ext}
                </div>
                {m.confiance_algo != null && (
                  <span className="text-[9px] text-gray-500 mt-0.5">Confiance {Math.round(m.confiance_algo)}%</span>
                )}
              </>
            ) : (
              <span className="text-xs text-gray-400 font-semibold">VS</span>
            )}
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-1 shadow-sm">
              <img src={teamExt.logo} alt={m.equipe_exterieure} className="w-12 h-12 object-contain"
                onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            </div>
            <span className="text-xs font-bold text-gray-900 leading-tight line-clamp-2 uppercase">{m.equipe_exterieure}</span>
          </div>
        </div>

        {hasPred && (
          <>
            <ProbaBar m={m} />
            {winnerName && (
              <div className="mt-2 flex items-center justify-center gap-1.5 text-[11px] font-semibold" style={{ color: MONDE_GREEN }}>
                <Brain className="w-3.5 h-3.5" />
                Favori : {winnerName}
              </div>
            )}
            {PHASE_FINALE(m.phase) && (
              <p className="text-[9px] text-gray-400 italic text-center mt-1">Prédiction sur le temps réglementaire (80 min)</p>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {dateKeys.map(key => {
        const isExpanded = expandedDates.has(key);
        const matchsDate = parDate[key];
        return (
          <div key={key} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <button
              onClick={() => toggleDate(key)}
              className="w-full px-3 py-2 border-b border-gray-200 transition-colors"
              style={{ backgroundColor: 'rgba(11,110,79,0.08)' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" style={{ color: MONDE_GREEN }} />
                  <span className="font-bold text-sm" style={{ color: MONDE_GREEN }}>{labelDate(key)}</span>
                  <span className="text-xs text-gray-500">({matchsDate.length} match{matchsDate.length > 1 ? 's' : ''})</span>
                </div>
                {isExpanded
                  ? <ChevronUp className="w-4 h-4" style={{ color: MONDE_GREEN }} />
                  : <ChevronDown className="w-4 h-4" style={{ color: MONDE_GREEN }} />}
              </div>
            </button>
            {isExpanded && (
              <div className="divide-y divide-gray-200">
                {matchsDate.map(m => <Carte key={m.match_id} m={m} />)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
