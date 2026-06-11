// ============================================
// HISTORIQUE - RUGBY INTERNATIONAL (MONDE)
// Source : GET /api/monde/historique
// Filtres : année / compétition / équipe + recherche ; pagination.
// Prono correct = vainqueur prédit == vainqueur réel (à 80 min).
// Affiche le score 80' + score final (a.p.) si prolongation.
// Couleurs : charte MONDE (vert émeraude / émeraude)
// ============================================

import { useState, useEffect, useMemo } from 'react';
import { Filter } from 'lucide-react';
import axios from 'axios';
import { getTeamData } from '../utils/teams';
import { getCharte } from '../constants/chartes';

const API_BASE = 'https://top14-api-production.up.railway.app';
const { vert: MONDE_GREEN, emeraude: MONDE_ACCENT } = getCharte('monde').base;

const PHASE_FINALE = (p) => {
  const s = (p || '').toString().toLowerCase();
  return s.includes('finale') || s.includes('quart') || s.includes('demi')
      || s.includes('barrage') || s.includes('huiti') || s.includes('8e');
};

const winnerOf = (d, e) => (d == null || e == null) ? null : (d > e ? 'DOM' : d < e ? 'EXT' : 'NUL');

const PER_PAGE = 21;

export default function HistoriqueMondeTab() {
  const [matchs, setMatchs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [annee, setAnnee] = useState('toutes');
  const [competition, setCompetition] = useState('toutes');
  const [equipe, setEquipe] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE}/api/monde/historique`, { params: { limit: 6000 } });
        const data = res.data.matchs || [];
        data.sort((a, b) => new Date(b.date_match) - new Date(a.date_match));
        setMatchs(data);
      } catch (e) {
        console.error('Erreur chargement historique MONDE:', e);
        setMatchs([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Options de filtres dérivées des données
  const annees = useMemo(
    () => [...new Set(matchs.map(m => m.annee).filter(Boolean))].sort((a, b) => b - a),
    [matchs]
  );
  const competitions = useMemo(
    () => [...new Set(matchs.map(m => m.competition).filter(Boolean))].sort(),
    [matchs]
  );
  const equipes = useMemo(
    () => [...new Set(matchs.flatMap(m => [m.equipe_domicile, m.equipe_exterieure]).filter(Boolean))].sort(),
    [matchs]
  );

  const filtered = useMemo(() => {
    let r = matchs;
    if (annee !== 'toutes') r = r.filter(m => String(m.annee) === String(annee));
    if (competition !== 'toutes') r = r.filter(m => m.competition === competition);
    if (equipe !== 'all') r = r.filter(m => m.equipe_domicile === equipe || m.equipe_exterieure === equipe);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(m =>
        (m.equipe_domicile || '').toLowerCase().includes(q) ||
        (m.equipe_exterieure || '').toLowerCase().includes(q) ||
        (m.competition || '').toLowerCase().includes(q) ||
        String(m.annee || '').includes(q)
      );
    }
    return r;
  }, [matchs, annee, competition, equipe, search]);

  // reset page si les filtres réduisent la liste
  useEffect(() => { setPage(1); }, [annee, competition, equipe, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const pageSafe = Math.min(page, totalPages);
  const start = (pageSafe - 1) * PER_PAGE;
  const pageItems = filtered.slice(start, start + PER_PAGE);

  // Stats de précision sur la sélection courante
  const stats = useMemo(() => {
    let evalues = 0, bons = 0;
    for (const m of filtered) {
      const rw = winnerOf(m.score_domicile, m.score_exterieur);
      if (!rw || !m.winner_predit) continue;
      evalues++;
      if (rw === m.winner_predit) bons++;
    }
    return { evalues, bons, pct: evalues ? Math.round((bons / evalues) * 1000) / 10 : null };
  }, [filtered]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4" style={{ borderColor: MONDE_GREEN }} />
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-24">

      {/* Barre filtres */}
      <button
        onClick={() => setShowFilters(s => !s)}
        className="flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-lg w-full justify-between"
        style={{ backgroundColor: 'rgba(11,110,79,0.08)', color: MONDE_GREEN }}
      >
        <span className="flex items-center gap-2"><Filter className="w-4 h-4" /> Filtres</span>
        <span className="text-xs font-normal text-gray-500">
          {filtered.length} match{filtered.length > 1 ? 's' : ''}
          {stats.pct != null && ` · prono ${stats.pct}%`}
        </span>
      </button>

      {showFilters && (
        <div className="flex flex-col gap-2 bg-white rounded-lg border border-gray-200 p-3">
          <div className="grid grid-cols-2 gap-2">
            <select value={annee} onChange={e => setAnnee(e.target.value)}
              className="border border-gray-300 rounded px-2 py-2 text-sm">
              <option value="toutes">Toutes les années</option>
              {annees.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <select value={competition} onChange={e => setCompetition(e.target.value)}
              className="border border-gray-300 rounded px-2 py-2 text-sm">
              <option value="toutes">Toutes compétitions</option>
              {competitions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <select value={equipe} onChange={e => setEquipe(e.target.value)}
            className="border border-gray-300 rounded px-2 py-2 text-sm">
            <option value="all">Toutes les équipes</option>
            {equipes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input
            type="text" placeholder="Rechercher (équipe, compétition, année)…"
            value={search} onChange={e => setSearch(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm"
          />
        </div>
      )}

      {/* Liste */}
      {pageItems.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-6 text-center border border-gray-200">
          <p className="text-gray-500">Aucun match pour cette sélection</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {pageItems.map(m => {
            const teamDom = getTeamData(m.equipe_domicile);
            const teamExt = getTeamData(m.equipe_exterieure);
            const realWinner = winnerOf(m.score_domicile, m.score_exterieur);
            const hasPred = m.score_predit_dom != null && m.score_predit_ext != null;
            const correct = hasPred && realWinner && m.winner_predit === realWinner;
            const hasProlong = m.prolongation === true &&
              m.score_final_domicile != null && m.score_final_exterieur != null &&
              (m.score_final_domicile !== m.score_domicile || m.score_final_exterieur !== m.score_exterieur);

            return (
              <div key={m.match_id} className="w-full bg-white rounded-lg shadow-sm border border-gray-200 py-3 px-3">
                {/* Entête */}
                <div className="flex justify-between items-center mb-2 gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {PHASE_FINALE(m.phase) && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: '#FCD34D', color: '#064E3B' }}>🏆 {m.phase}</span>
                    )}
                    {m.competition && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: 'rgba(11,110,79,0.1)', color: MONDE_GREEN }}>{m.competition}</span>
                    )}
                  </div>
                  <div className="text-[10px] text-gray-600 font-semibold text-right flex-shrink-0">
                    {new Date(m.date_match).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 items-start">
                  {/* Domicile */}
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-1">
                      <img src={teamDom.logo} alt={m.equipe_domicile} className="w-10 h-10 object-contain"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    </div>
                    <div className="text-[11px] font-semibold text-gray-800 leading-tight line-clamp-2">{m.equipe_domicile}</div>
                  </div>

                  {/* Centre : scores */}
                  <div className="flex flex-col items-center justify-center gap-1">
                    <div className="text-[10px] text-gray-500 uppercase">Score réel</div>
                    <div className="text-2xl font-bold" style={{ color: MONDE_GREEN }}>
                      {m.score_domicile} - {m.score_exterieur}
                    </div>
                    {hasProlong && (
                      <div className="text-[9px] text-gray-400 italic">Final {m.score_final_domicile}-{m.score_final_exterieur} (a.p.)</div>
                    )}
                    {hasPred && (
                      <>
                        <div className="text-[10px] text-gray-400 uppercase mt-1">Prédit</div>
                        <div className="text-sm font-semibold text-gray-600">
                          {m.score_predit_dom} - {m.score_predit_ext}
                        </div>
                        <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          correct ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {correct ? '✓ Prono correct' : '✗ Prono incorrect'}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Extérieur */}
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-1">
                      <img src={teamExt.logo} alt={m.equipe_exterieure} className="w-10 h-10 object-contain"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    </div>
                    <div className="text-[11px] font-semibold text-gray-800 leading-tight line-clamp-2">{m.equipe_exterieure}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 pt-2">
          <button
            onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            disabled={pageSafe === 1}
            className="px-4 py-2 rounded font-semibold text-white disabled:bg-gray-300 disabled:text-gray-500 transition-colors shadow-sm"
            style={pageSafe === 1 ? {} : { backgroundColor: MONDE_GREEN }}
          >◀ Précédent</button>
          <span className="px-2 font-semibold text-sm" style={{ color: MONDE_GREEN }}>Page {pageSafe} / {totalPages}</span>
          <button
            onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            disabled={pageSafe === totalPages}
            className="px-4 py-2 rounded font-semibold text-white disabled:bg-gray-300 disabled:text-gray-500 transition-colors shadow-sm"
            style={pageSafe === totalPages ? {} : { backgroundColor: MONDE_GREEN }}
          >Suivant ▶</button>
        </div>
      )}
    </div>
  );
}
