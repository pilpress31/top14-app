// ==========================================
// PALMARÈS MONDE (rugby international)
// Fichier : src/components/PalmaresMonde.jsx
// ==========================================
// Sélecteur de compétition + 2 vues : « Par édition » et « Records » (agrégé
// par nation : titres, grands chelems, triples couronnes, cuillères ; pour la
// Coupe du Monde : sacres, finales, 3ᵉs places).
// Source API : GET /api/monde/palmares
// Charte MONDE : émeraude #0B6E4F / #065F46 / #34D399
// ==========================================

import { useState, useEffect, useMemo } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const MONDE_VERT = '#0B6E4F';
const MONDE_FONCE = '#065F46';
const MONDE_EMERAUDE = '#34D399';

export default function PalmaresMonde() {
  const [competitions, setCompetitions] = useState([]);
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [vue, setVue] = useState('editions'); // 'editions' | 'records'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let annule = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/monde/palmares`);
        const json = await res.json();
        if (annule) return;
        if (!json.success) throw new Error(json.error || 'Réponse API invalide');
        setCompetitions(json.competitions || []);
        setRows(json.rows || []);
        setSelected((json.competitions && json.competitions[0]) || null);
      } catch (e) {
        if (!annule) setError(e.message);
      } finally {
        if (!annule) setLoading(false);
      }
    })();
    return () => { annule = true; };
  }, []);

  const editions = useMemo(
    () => rows.filter((r) => r.competition === selected),
    [rows, selected]
  );
  const isCdM = selected === 'Coupe du Monde';

  // Agrégat par nation
  const records = useMemo(() => {
    const m = {};
    const get = (n) => (m[n] = m[n] || { nation: n, titres: 0, gc: 0, tc: 0, cb: 0, finales: 0, troisiemes: 0 });
    for (const e of editions) {
      if (e.champion) { get(e.champion).titres++; if (e.grand_chelem) get(e.champion).gc++; }
      if (isCdM) {
        if (e.champion) get(e.champion).finales++;
        if (e.finaliste) get(e.finaliste).finales++;
        if (e.troisieme) get(e.troisieme).troisiemes++;
      } else {
        if (e.triple_couronne) get(e.triple_couronne).tc++;
        if (e.cuillere_bois) get(e.cuillere_bois).cb++;
      }
    }
    return Object.values(m).sort(
      (a, b) => b.titres - a.titres || b.gc - a.gc || b.finales - a.finales || a.nation.localeCompare(b.nation)
    );
  }, [editions, isCdM]);

  const hasTC = records.some((r) => r.tc > 0);
  const hasCB = records.some((r) => r.cb > 0);
  const hasThird = records.some((r) => r.troisiemes > 0);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: MONDE_VERT }} />
        <p className="text-sm text-slate-400 mt-3">Chargement du palmarès…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-lg p-4 text-center" style={{ backgroundColor: '#FEE2E2' }}>
        <p className="text-sm font-semibold text-red-800">Erreur de chargement</p>
        <p className="text-xs text-red-600 mt-1">{error}</p>
      </div>
    );
  }
  if (!competitions.length) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-slate-400">Aucun palmarès disponible.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* En-tête émeraude */}
      <div className="rounded-xl p-4 text-white shadow-sm" style={{ background: `linear-gradient(135deg, ${MONDE_FONCE}, ${MONDE_VERT})` }}>
        <div className="flex items-center gap-2">
          <span className="text-xl">🏆</span>
          <h2 className="font-bold text-base">Palmarès</h2>
        </div>
        <p className="text-[11px] mt-1" style={{ color: '#A7F3D0' }}>
          Vainqueurs et records — rugby international
        </p>
      </div>

      {/* Filtre compétition */}
      <div className="flex items-center gap-2">
        <label htmlFor="palmares-comp" className="text-xs font-semibold text-gray-500 flex-shrink-0">Compétition</label>
        <select
          id="palmares-comp"
          value={selected || ''}
          onChange={(e) => setSelected(e.target.value)}
          className="flex-1 rounded-lg border px-3 py-2 text-sm font-bold bg-white appearance-none"
          style={{ borderColor: '#A7F3D0', color: MONDE_FONCE }}
        >
          {competitions.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Bascule Par édition / Records */}
      <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: '#A7F3D0' }}>
        {[['editions', 'Par édition'], ['records', 'Records']].map(([k, label]) => (
          <button
            key={k}
            onClick={() => setVue(k)}
            className="flex-1 py-2 text-sm font-bold transition-colors"
            style={vue === k
              ? { backgroundColor: MONDE_VERT, color: 'white' }
              : { backgroundColor: 'white', color: MONDE_FONCE }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ===== VUE PAR ÉDITION ===== */}
      {vue === 'editions' && (
        editions.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-8">Aucune édition pour cette compétition.</p>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100 overflow-hidden">
            {editions.map((e) => (
              <div key={`${e.competition}-${e.annee}`} className="flex items-start gap-3 px-3 py-2.5">
                <span className="flex-shrink-0 mt-0.5 inline-flex items-center justify-center min-w-[44px] h-6 px-1.5 rounded-md text-[11px] font-bold" style={{ backgroundColor: MONDE_VERT + '12', color: MONDE_FONCE }}>
                  {e.annee}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-base">🏆</span>
                    <span className="font-bold text-gray-800 truncate">{e.champion || '—'}</span>
                    {e.grand_chelem && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: MONDE_EMERAUDE, color: '#053B2C' }}>GRAND CHELEM</span>
                    )}
                    {e.partage && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-600">PARTAGÉ</span>
                    )}
                  </div>
                  {isCdM ? (
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {e.finaliste ? <>bat <span className="font-semibold text-gray-700">{e.finaliste}</span>{e.score_finale ? ` (${e.score_finale})` : ''}</> : null}
                      {e.troisieme ? <span className="text-gray-400"> · 3ᵉ : {e.troisieme}</span> : null}
                    </p>
                  ) : (
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {e.triple_couronne ? <>Triple Couronne : <span className="font-semibold text-gray-700">{e.triple_couronne}</span></> : null}
                      {e.cuillere_bois ? <span className="text-gray-400">{e.triple_couronne ? ' · ' : ''}🥄 Cuillère de bois : {e.cuillere_bois}</span> : null}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ===== VUE RECORDS (agrégat par nation) ===== */}
      {vue === 'records' && (
        records.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-8">Aucun record pour cette compétition.</p>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
            <table className="w-full text-xs whitespace-nowrap">
              <thead>
                <tr style={{ backgroundColor: MONDE_VERT + '10' }}>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600">Nation</th>
                  <th className="px-2 py-2 text-center font-bold" style={{ color: MONDE_FONCE }} title="Titres">🏆</th>
                  {isCdM ? (
                    <>
                      <th className="px-2 py-2 text-center font-semibold text-gray-600" title="Finales jouées">Fin.</th>
                      {hasThird && <th className="px-2 py-2 text-center font-semibold text-gray-600" title="3ᵉs places">3ᵉs</th>}
                    </>
                  ) : (
                    <>
                      <th className="px-2 py-2 text-center font-semibold text-gray-600" title="Grands Chelems">GC</th>
                      {hasTC && <th className="px-2 py-2 text-center font-semibold text-gray-600" title="Triples Couronnes">TC</th>}
                      {hasCB && <th className="px-2 py-2 text-center font-semibold text-gray-600" title="Cuillères de bois">🥄</th>}
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.nation} className="border-t border-gray-100">
                    <td className="px-3 py-2 font-semibold text-gray-800">{r.nation}</td>
                    <td className="px-2 py-2 text-center font-bold tabular-nums" style={{ color: MONDE_FONCE }}>{r.titres || '–'}</td>
                    {isCdM ? (
                      <>
                        <td className="px-2 py-2 text-center tabular-nums text-gray-600">{r.finales || '–'}</td>
                        {hasThird && <td className="px-2 py-2 text-center tabular-nums text-gray-600">{r.troisiemes || '–'}</td>}
                      </>
                    ) : (
                      <>
                        <td className="px-2 py-2 text-center tabular-nums text-gray-600">{r.gc || '–'}</td>
                        {hasTC && <td className="px-2 py-2 text-center tabular-nums text-gray-600">{r.tc || '–'}</td>}
                        {hasCB && <td className="px-2 py-2 text-center tabular-nums text-gray-600">{r.cb || '–'}</td>}
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {vue === 'records' && records.length > 0 && (
        <p className="text-center text-[10px] text-gray-400 leading-relaxed">
          {isCdM
            ? '🏆 Sacres · Fin. Finales jouées · 3ᵉs places'
            : '🏆 Titres · GC Grands Chelems · TC Triples Couronnes · 🥄 Cuillères de bois'}
        </p>
      )}

      <p className="text-center text-[10px] text-gray-400">
        {editions.length} édition{editions.length > 1 ? 's' : ''} — {selected}
      </p>
    </div>
  );
}
