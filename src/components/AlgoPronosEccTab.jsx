// ============================================
// ALGO PRONOS - CHALLENGE CUP (ECC)
// Source : GET /api/ecc/matchs/a-venir
//          GET /api/ecc/insights?equipe_dom=&equipe_ext=
//          GET /api/ecc/historique?equipe=&adversaire=
// Vitrine des prédictions (paris → page Paris). Groupé par date.
// Panneaux : Indice favori, Pourquoi ce pronostic ?, Duel & Forme, Historique.
// (« Pourquoi ce pronostic ? » branché via /api/explication/ecc.)
// ============================================

import { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronDown, ChevronUp, Brain, BarChart2, Swords, Loader2 } from 'lucide-react';
import axios from 'axios';
import { getTeamData } from '../utils/teams';
import { useRealtimeSync } from '../hooks/useRealtimeSync';
import { getCharte, texteReprise } from '../constants/chartes';
import RubriqueHeader, { RUBRIQUE_THEMES } from './RubriqueHeader';
import BarreIndiceFavori from './BarreIndiceFavori';
import PourquoiCePronostic from './PourquoiCePronostic';
import TeamPopup from './TeamPopup';

const API_BASE = 'https://top14-api-production.up.railway.app';
const { vert: ECC_GREEN, bronze: ECC_BRONZE } = getCharte('ecc').base;
const ECC_SOFT = '#EEF7EE';
const ECC_BORDER = '#BFE3C2';

const PHASE_FINALE = (p) => {
  const s = (p || '').toString().toLowerCase();
  return s.includes('finale') || s.includes('quart') || s.includes('demi')
      || s.includes('barrage') || s.includes('huiti') || s.includes('8e') || s.includes('16e');
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

// ── Résumé de forme V/N/D (mini-bar + série en cours) ──
function SerieBlocs({ forme }) {
  if (!Array.isArray(forme) || forme.length === 0) {
    return <span className="text-[11px] italic text-gray-400">Pas assez de matchs européens récents</span>;
  }
  const counts = { V: 0, N: 0, D: 0 };
  forme.forEach(r => { if (counts[r] !== undefined) counts[r]++; });
  const last = forme[forme.length - 1];
  let streak = 1;
  for (let i = forme.length - 2; i >= 0; i--) { if (forme[i] === last) streak++; else break; }
  let streakLabel, streakColor = '#6b7280';
  if (streak >= 3 && last === 'V') { streakLabel = `🔥 ${streak} victoires consécutives`; streakColor = '#16a34a'; }
  else if (streak >= 3 && last === 'D') { streakLabel = `❄️ ${streak} défaites consécutives`; streakColor = '#dc2626'; }
  else if (last === 'V') { streakLabel = '✓ Vient de gagner'; streakColor = '#16a34a'; }
  else if (last === 'D') { streakLabel = '✗ Vient de perdre'; streakColor = '#dc2626'; }
  else { streakLabel = '≈ Match nul récent'; }
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-3 text-[11px] flex-wrap">
        {counts.V > 0 && <span className="font-semibold" style={{ color: '#16a34a' }}>{counts.V}V</span>}
        {counts.N > 0 && <span className="font-semibold" style={{ color: '#6b7280' }}>{counts.N}N</span>}
        {counts.D > 0 && <span className="font-semibold" style={{ color: '#dc2626' }}>{counts.D}D</span>}
        <span className="text-gray-400 text-[10px]">sur les {forme.length} derniers</span>
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden bg-gray-100">
        {counts.V > 0 && <div style={{ width: `${(counts.V / forme.length) * 100}%`, backgroundColor: '#22c55e' }} />}
        {counts.N > 0 && <div style={{ width: `${(counts.N / forme.length) * 100}%`, backgroundColor: '#9ca3af' }} />}
        {counts.D > 0 && <div style={{ width: `${(counts.D / forme.length) * 100}%`, backgroundColor: '#ef4444' }} />}
      </div>
      <p className="text-[10px] font-semibold" style={{ color: streakColor }}>{streakLabel}</p>
    </div>
  );
}

// ── Panneau Duel & Forme (GET /api/ecc/insights) ──
function InsightsEcc({ match, isOpen, onToggle }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleToggle = async () => {
    onToggle();
    if (!isOpen && !data && !loading) {
      setLoading(true); setError(null);
      try {
        const url = `${API_BASE}/api/ecc/insights?equipe_dom=${encodeURIComponent(match.equipe_domicile)}&equipe_ext=${encodeURIComponent(match.equipe_exterieure)}`;
        const res = await axios.get(url);
        setData(res.data);
      } catch (e) {
        setError('Impossible de charger les insights.');
      } finally { setLoading(false); }
    }
  };

  const nb = data?.h2h?.nb_matchs ?? 0;

  return (
    <div className="mt-3 border-t pt-3" style={{ borderColor: ECC_BORDER }}>
      <RubriqueHeader
        theme={RUBRIQUE_THEMES.ecc}
        icon={BarChart2}
        label="Duel & Forme"
        isOpen={isOpen}
        loading={loading}
        onToggle={handleToggle}
        badge={data && nb > 0 ? `${nb} confrontations` : null}
      />
      {isOpen && (
        <div className="mt-3 space-y-3">
          {error && <p className="text-xs text-center py-2 italic" style={{ color: ECC_GREEN }}>{error}</p>}
          {loading && <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin" style={{ color: ECC_BRONZE }} /></div>}
          {data && !loading && (
            <>
              {data.duel_texte && (
                <div className="rounded-lg p-3" style={{ backgroundColor: ECC_SOFT, border: `1px solid ${ECC_BORDER}` }}>
                  <p className="text-[11px] leading-relaxed" style={{ color: ECC_GREEN }}>{data.duel_texte}</p>
                </div>
              )}

              {nb >= 3 && (
                <div className="rounded-lg p-3" style={{ backgroundColor: ECC_SOFT, border: `1px solid ${ECC_BORDER}` }}>
                  <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: ECC_GREEN }}>
                    ⚔️ Face-à-face — {nb} matchs
                  </p>
                  <div className="mb-3">
                    <div className="flex justify-between text-[10px] mb-1" style={{ color: ECC_GREEN }}>
                      <span className="font-bold">{match.equipe_domicile.split(' ')[0]}</span>
                      <span className="text-gray-400">Nuls {data.h2h.nuls}</span>
                      <span className="font-bold">{match.equipe_exterieure.split(' ')[0]}</span>
                    </div>
                    <div className="flex h-2 rounded-full overflow-hidden">
                      <div style={{ width: `${Math.round((data.h2h.victoires_dom / nb) * 100)}%`, backgroundColor: ECC_GREEN }} />
                      <div style={{ width: `${Math.round((data.h2h.nuls / nb) * 100)}%`, backgroundColor: '#9CA3AF' }} />
                      <div style={{ width: `${Math.round((data.h2h.victoires_ext / nb) * 100)}%`, backgroundColor: ECC_BRONZE }} />
                    </div>
                    <div className="flex justify-between text-[10px] mt-0.5 font-bold">
                      <span style={{ color: ECC_GREEN }}>{Math.round((data.h2h.victoires_dom / nb) * 100)}%</span>
                      <span style={{ color: ECC_BRONZE }}>{Math.round((data.h2h.victoires_ext / nb) * 100)}%</span>
                    </div>
                  </div>
                  {data.h2h.moyenne_pts_dom != null && (
                    <div className="rounded p-2 text-center" style={{ backgroundColor: '#FFFFFF', border: `1px solid ${ECC_BORDER}` }}>
                      <p className="text-[11px] font-bold" style={{ color: ECC_GREEN }}>
                        {data.h2h.moyenne_pts_dom} - {data.h2h.moyenne_pts_ext}
                      </p>
                      <p className="text-[9px] text-gray-500">Score moyen sur les confrontations</p>
                    </div>
                  )}
                </div>
              )}

              {[
                { label: match.equipe_domicile.split(' ')[0], forme: data.forme_dom },
                { label: match.equipe_exterieure.split(' ')[0], forme: data.forme_ext },
              ].map((eq, idx) => (
                <div key={idx} className="rounded-lg p-3" style={{ backgroundColor: ECC_SOFT, border: `1px solid ${ECC_BORDER}` }}>
                  <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: ECC_GREEN }}>
                    🏉 {eq.label} — 5 derniers matchs Challenge Cup
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

// ── Panneau Historique des confrontations (GET /api/ecc/historique) ──
function HistoriqueConfrontationsEcc({ match, isOpen, onToggle }) {
  const [confrontations, setConfrontations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleToggle = async () => {
    onToggle();
    if (!isOpen && !confrontations && !loading) {
      setLoading(true); setError(null);
      try {
        const res = await axios.get(`${API_BASE}/api/ecc/historique`, {
          params: { equipe: match.equipe_domicile, adversaire: match.equipe_exterieure, limit: 12 },
        });
        setConfrontations((res.data?.matchs || []).slice(0, 12));
      } catch (e) {
        console.error('Erreur historique confrontations ECC:', e);
        setError("Impossible de charger l'historique.");
      } finally { setLoading(false); }
    }
  };

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      <RubriqueHeader
        theme={RUBRIQUE_THEMES.ecc}
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
          {loading && <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin" style={{ color: ECC_BRONZE }} /></div>}
          {confrontations && !loading && confrontations.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-3 italic">Aucune confrontation dans l'historique</p>
          )}
          {confrontations && !loading && confrontations.length > 0 && (
            <div className="rounded-lg overflow-hidden" style={{ backgroundColor: ECC_SOFT, border: `1px solid ${ECC_BORDER}` }}>
              <div className="grid grid-cols-4 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide text-center"
                style={{ backgroundColor: 'rgba(46,125,50,0.12)', color: ECC_GREEN }}>
                <div className="text-left">Année</div>
                <div>DOM</div>
                <div>Score</div>
                <div>EXT</div>
              </div>
              {confrontations.map((m, i) => {
                const score = `${m.score_domicile}-${m.score_exterieur}`;
                const winDom = m.score_domicile > m.score_exterieur;
                const winExt = m.score_exterieur > m.score_domicile;
                return (
                  <div key={i} className="grid grid-cols-4 px-2 py-1.5 text-[10px] text-center items-center border-t"
                    style={{ borderColor: ECC_BORDER }}>
                    <div className="text-left text-gray-500 truncate">{m.annee || ''}</div>
                    <div className={`truncate font-semibold ${winDom ? 'text-green-700' : 'text-gray-700'}`}>
                      {(m.equipe_domicile || '').split(' ')[0]}
                    </div>
                    <div className="font-bold" style={{ color: ECC_GREEN }}>{score}</div>
                    <div className={`truncate font-semibold ${winExt ? 'text-green-700' : 'text-gray-700'}`}>
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

// ── Carte d'un match ──
function CarteEcc({ m, openPanel, onTogglePanel }) {
  const [teamPopup, setTeamPopup] = useState(null);
  const teamDom = getTeamData(m.equipe_domicile);
  const teamExt = getTeamData(m.equipe_exterieure);
  const hasPred = m.score_predit_dom != null && m.score_predit_ext != null;
  const winnerName = m.winner_predit === 'DOM' ? m.equipe_domicile
                   : m.winner_predit === 'EXT' ? m.equipe_exterieure
                   : m.winner_predit === 'NUL' ? 'Match nul' : null;
  const indice = m.confiance_algo != null ? Math.round(Number(m.confiance_algo)) : null;

  return (
    <div className="px-3 py-3">
      <div className="flex items-center justify-end gap-1.5 mb-2 flex-wrap">
        {PHASE_FINALE(m.phase) && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse"
            style={{ backgroundColor: ECC_BRONZE, color: '#FFFFFF' }}>🏆 {m.phase}</span>
        )}
        {m.competition && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: 'rgba(46,125,50,0.1)', color: ECC_GREEN }}>{m.competition}</span>
        )}
      </div>

      <div className="grid grid-cols-3 items-center px-1">
        <button type="button" onClick={() => setTeamPopup(m.equipe_domicile)}
          className="flex flex-col items-center text-center bg-transparent border-0 p-0 cursor-pointer hover:opacity-80 transition-opacity">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-1 shadow-sm">
            <img src={teamDom.logo} alt={m.equipe_domicile} className="w-12 h-12 object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          </div>
          <span className="text-xs font-bold text-gray-900 leading-tight break-words uppercase underline decoration-dotted underline-offset-2">{m.equipe_domicile}</span>
        </button>
        <div className="flex flex-col items-center">
          {hasPred ? (
            <>
              <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: ECC_GREEN }}>Prono IA</span>
              <div className="text-2xl font-bold leading-none" style={{ color: ECC_GREEN }}>
                {m.score_predit_dom} – {m.score_predit_ext}
              </div>
              {indice != null && <span className="text-[9px] text-gray-500 mt-0.5">Confiance {indice}%</span>}
            </>
          ) : <span className="text-xs text-gray-400 font-semibold">VS</span>}
        </div>
        <button type="button" onClick={() => setTeamPopup(m.equipe_exterieure)}
          className="flex flex-col items-center text-center bg-transparent border-0 p-0 cursor-pointer hover:opacity-80 transition-opacity">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-1 shadow-sm">
            <img src={teamExt.logo} alt={m.equipe_exterieure} className="w-12 h-12 object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          </div>
          <span className="text-xs font-bold text-gray-900 leading-tight break-words uppercase underline decoration-dotted underline-offset-2">{m.equipe_exterieure}</span>
        </button>
      </div>

      {hasPred && (
        <>
          {winnerName && (
            <div className="mt-1 flex items-center justify-center gap-1.5 text-[11px] font-semibold" style={{ color: ECC_GREEN }}>
              <Brain className="w-3.5 h-3.5" /> Favori : {winnerName}
            </div>
          )}
          {indice != null && <BarreIndiceFavori pct={indice} variant="ecc" />}

          <PourquoiCePronostic
            match={m}
            championnat="ecc"
            isOpen={openPanel === 'conseil'}
            onToggle={() => onTogglePanel('conseil')}
          />
          <InsightsEcc
            match={m}
            isOpen={openPanel === 'insights'}
            onToggle={() => onTogglePanel('insights')}
          />
          <HistoriqueConfrontationsEcc
            match={m}
            isOpen={openPanel === 'historique'}
            onToggle={() => onTogglePanel('historique')}
          />
        </>
      )}

      {teamPopup && (
        <TeamPopup
          equipeNom={teamPopup}
          isEcc
          onClose={() => setTeamPopup(null)}
        />
      )}
    </div>
  );
}

export default function AlgoPronosEccTab() {
  const [pronos, setPronos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedDates, setExpandedDates] = useState(new Set());
  const [activePanel, setActivePanel] = useState(null); // { matchId, panel } | null
  const isFirstLoad = useRef(true);
  const dateRefs = useRef({});
  const cardRefs = useRef({});

  useRealtimeSync([
    { table: 'matchs_ecc', onUpdate: () => loadPronos() },
  ]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    loadPronos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPronos = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/ecc/matchs/a-venir`);
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
      console.error('Erreur chargement pronos ECC:', e);
      setPronos([]);
    } finally { setLoading(false); }
  };

  const toggleDate = (key) => {
    const opening = !expandedDates.has(key);
    setExpandedDates(opening ? new Set([key]) : new Set());
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
  const togglePanel = (matchId, panel) => {
    const estOuvert = activePanel && activePanel.matchId === matchId && activePanel.panel === panel;
    setActivePanel(estOuvert ? null : { matchId, panel });
    if (!estOuvert) {
      setTimeout(() => {
        const el = cardRefs.current[matchId];
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-4" style={{ borderColor: ECC_GREEN }} />
      </div>
    );
  }

  if (pronos.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 text-center border border-gray-200">
        <div className="text-4xl mb-2">{getCharte('ecc').icon}</div>
        <p className="text-gray-700 font-semibold">Pas de pronostics à venir</p>
        <p className="text-sm text-gray-500 mt-1">Saison courante terminée.</p>
        {texteReprise('ecc') && (
          <p className="text-xs text-gray-400 mt-1">{texteReprise('ecc')}</p>
        )}
      </div>
    );
  }

  const parDate = pronos.reduce((acc, m) => {
    const k = dateKeyOf(m);
    (acc[k] = acc[k] || []).push(m);
    return acc;
  }, {});
  const dateKeys = Object.keys(parDate).sort();

  return (
    <div className="space-y-2">
      {dateKeys.map(key => {
        const isExpanded = expandedDates.has(key);
        const matchsDate = parDate[key];
        return (
          <div key={key} ref={el => { dateRefs.current[key] = el; }} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden scroll-mt-2">
            <button onClick={() => toggleDate(key)}
              className="w-full px-3 py-2 border-b border-gray-200 transition-colors"
              style={{ backgroundColor: 'rgba(46,125,50,0.08)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" style={{ color: ECC_GREEN }} />
                  <span className="font-bold text-sm" style={{ color: ECC_GREEN }}>{labelDate(key)}</span>
                  <span className="text-xs text-gray-500">({matchsDate.length} match{matchsDate.length > 1 ? 's' : ''})</span>
                </div>
                {isExpanded
                  ? <ChevronUp className="w-4 h-4" style={{ color: ECC_GREEN }} />
                  : <ChevronDown className="w-4 h-4" style={{ color: ECC_GREEN }} />}
              </div>
            </button>
            {isExpanded && (
              <div className="divide-y divide-gray-200">
                {matchsDate.map(m => (
                  <div key={m.match_id} ref={el => { cardRefs.current[m.match_id] = el; }} className="scroll-mt-2">
                    <CarteEcc
                      m={m}
                      openPanel={activePanel && activePanel.matchId === m.match_id ? activePanel.panel : null}
                      onTogglePanel={(panel) => togglePanel(m.match_id, panel)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
