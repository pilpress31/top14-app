// ==========================================
// TABLES DE COMPÉTITIONS MONDE
// Fichier : src/components/ClassementCompetitionsMonde.jsx
// ==========================================
// Sélecteur de compétition + classement(s) officiel(s) scrapé(s) depuis
// Wikipédia, avec bonus (BO/BD). Gère les compétitions à POULES MULTIPLES
// (Rugby Europe, Nations Championship, Coupe du Monde…) → plusieurs groupes.
// ==========================================

import { useState, useEffect } from 'react';
import { getTeamData } from '../utils/teams';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const MONDE_VERT = '#0B6E4F';
const MONDE_FONCE = '#065F46';

function GroupeTable({ label, rows }) {
  return (
    <div className="space-y-2">
      {label && (
        <h3 className="text-sm font-bold px-1" style={{ color: MONDE_FONCE }}>{label}</h3>
      )}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-xs whitespace-nowrap">
          <thead>
            <tr style={{ backgroundColor: MONDE_VERT + '10' }}>
              <th className="px-2 py-2 text-left font-semibold text-gray-600">#</th>
              <th className="px-2 py-2 text-left font-semibold text-gray-600">Nation</th>
              <th className="px-1.5 py-2 text-center font-semibold text-gray-600">MJ</th>
              <th className="px-1.5 py-2 text-center font-semibold text-gray-600">V</th>
              <th className="px-1.5 py-2 text-center font-semibold text-gray-600">N</th>
              <th className="px-1.5 py-2 text-center font-semibold text-gray-600">D</th>
              <th className="px-1.5 py-2 text-center font-semibold text-gray-600">Diff</th>
              <th className="px-1.5 py-2 text-center font-semibold text-gray-600" title="Bonus offensif">BO</th>
              <th className="px-1.5 py-2 text-center font-semibold text-gray-600" title="Bonus défensif">BD</th>
              <th className="px-2 py-2 text-center font-bold" style={{ color: MONDE_FONCE }}>Pts</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const team = getTeamData ? getTeamData(r.equipe) : null;
              const nom = team?.name || r.equipe;
              return (
                <tr key={`${r.equipe}-${i}`} className="border-t border-gray-100">
                  <td className="px-2 py-2 text-gray-500 font-semibold">{r.pos ?? i + 1}</td>
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-1.5">
                      {team?.logo && <img src={team.logo} alt={nom} className="w-4 h-4 object-contain flex-shrink-0" />}
                      <span className="font-semibold text-gray-800">{nom}</span>
                    </div>
                  </td>
                  <td className="px-1.5 py-2 text-center tabular-nums text-gray-600">{r.mj ?? '–'}</td>
                  <td className="px-1.5 py-2 text-center tabular-nums text-gray-600">{r.v ?? '–'}</td>
                  <td className="px-1.5 py-2 text-center tabular-nums text-gray-600">{r.n ?? '–'}</td>
                  <td className="px-1.5 py-2 text-center tabular-nums text-gray-600">{r.d ?? '–'}</td>
                  <td className="px-1.5 py-2 text-center tabular-nums text-gray-600">
                    {r.diff != null ? (r.diff > 0 ? `+${r.diff}` : r.diff) : '–'}
                  </td>
                  <td className="px-1.5 py-2 text-center tabular-nums text-gray-600">{r.bo ?? '–'}</td>
                  <td className="px-1.5 py-2 text-center tabular-nums text-gray-600">{r.bd ?? '–'}</td>
                  <td className="px-2 py-2 text-center font-bold tabular-nums" style={{ color: MONDE_FONCE }}>{r.pts ?? '–'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ClassementCompetitionsMonde() {
  const [dispo, setDispo] = useState([]);
  const [selected, setSelected] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingTable, setLoadingTable] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let annule = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/monde/classement-competition/disponibles`);
        const json = await res.json();
        if (annule) return;
        const list = json.disponibles || [];
        setDispo(list);
        setSelected(list[0] || null);
      } catch {
        if (!annule) setDispo([]);
      } finally {
        if (!annule) setLoadingList(false);
      }
    })();
    return () => { annule = true; };
  }, []);

  useEffect(() => {
    if (!selected) { setGroups([]); return; }
    let annule = false;
    (async () => {
      try {
        setLoadingTable(true);
        setError(null);
        const q = `competition=${encodeURIComponent(selected.competition)}&annee=${selected.annee}`;
        const res = await fetch(`${API_URL}/monde/classement-competition?${q}`);
        const json = await res.json();
        if (annule) return;
        if (!json.success) throw new Error(json.error || 'Indisponible');
        const grs = json.groups || (json.rows ? [{ label: null, rows: json.rows }] : []);
        setGroups(grs);
      } catch (e) {
        if (!annule) { setError(e.message); setGroups([]); }
      } finally {
        if (!annule) setLoadingTable(false);
      }
    })();
    return () => { annule = true; };
  }, [selected]);

  if (!loadingList && dispo.length === 0) return null;

  return (
    <div className="space-y-3 mt-6">
      <div className="rounded-xl p-4 text-white shadow-sm" style={{ background: `linear-gradient(135deg, ${MONDE_FONCE}, ${MONDE_VERT})` }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">📊</span>
          <h2 className="font-bold text-base">Classements des compétitions</h2>
        </div>
        {dispo.length > 0 && (
          <select
            value={selected ? `${selected.competition}__${selected.annee}` : ''}
            onChange={(e) => {
              const i = e.target.value.lastIndexOf('__');
              setSelected({ competition: e.target.value.slice(0, i), annee: Number(e.target.value.slice(i + 2)) });
            }}
            className="w-full rounded-lg px-3 py-2 text-sm font-bold bg-white appearance-none"
            style={{ color: MONDE_FONCE }}
          >
            {dispo.map((d) => (
              <option key={`${d.competition}__${d.annee}`} value={`${d.competition}__${d.annee}`}>
                {d.competition} {d.annee}
              </option>
            ))}
          </select>
        )}
      </div>

      {loadingList || loadingTable ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: MONDE_VERT }} />
        </div>
      ) : error ? (
        <p className="text-center text-sm text-slate-400 py-6">Classement indisponible pour cette édition.</p>
      ) : groups.length === 0 ? (
        <p className="text-center text-sm text-slate-400 py-6">Aucune donnée de classement.</p>
      ) : (
        <div className="space-y-4">
          {groups.map((g, i) => (
            <GroupeTable key={g.label || i} label={g.label} rows={g.rows} />
          ))}
        </div>
      )}

      {!loadingTable && !error && groups.length > 0 && (
        <p className="text-center text-[10px] text-gray-400">
          Source : Wikipédia · BO = bonus offensif, BD = bonus défensif
        </p>
      )}
    </div>
  );
}
