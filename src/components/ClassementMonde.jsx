// ==========================================
// CLASSEMENT MONDIAL OFFICIEL (World Rugby)
// Fichier : src/components/ClassementMonde.jsx
// ==========================================
// Table unique des nations triées par rang officiel World Rugby.
// Source API : GET /api/monde/classement-officiel
//   → { ranking: [{ pos, equipe, points, evolution }], updated_at, source }
// Colonnes : # / Nation (logo) / Points / Évolution (vs semaine précédente)
// Charte MONDE : émeraude #0B6E4F / #065F46 / #34D399
// ==========================================

import { useState, useEffect } from 'react';
import { getTeamData } from '../utils/teams';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const MONDE_VERT = '#0B6E4F';
const MONDE_FONCE = '#065F46';
const MONDE_EMERAUDE = '#34D399';

// Petit indicateur d'évolution (vs classement précédent)
function Evolution({ value }) {
  if (value > 0) {
    return <span className="font-bold" style={{ color: '#16A34A' }}>▲ {value}</span>;
  }
  if (value < 0) {
    return <span className="font-bold" style={{ color: '#DC2626' }}>▼ {Math.abs(value)}</span>;
  }
  return <span className="text-gray-400">–</span>;
}

export default function ClassementMonde() {
  const [ranking, setRanking] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let annule = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/monde/classement-officiel`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (annule) return;
        setRanking(data.ranking || []);
        setUpdatedAt(data.updated_at || null);
      } catch (e) {
        if (!annule) setError(e.message);
      } finally {
        if (!annule) setLoading(false);
      }
    })();
    return () => { annule = true; };
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div
          className="inline-block animate-spin rounded-full h-10 w-10 border-b-2"
          style={{ borderColor: MONDE_VERT }}
        />
        <p className="text-sm text-slate-400 mt-3">Chargement du classement…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg p-4 text-center" style={{ backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }}>
        <p className="text-sm font-semibold text-red-800">Erreur de chargement</p>
        <p className="text-xs text-red-600 mt-1">{error}</p>
      </div>
    );
  }

  if (!ranking || ranking.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-slate-400">Aucun classement disponible.</p>
      </div>
    );
  }

  const dateMaj = updatedAt
    ? new Date(updatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="space-y-4">
      {/* En-tête émeraude */}
      <div
        className="rounded-xl p-4 text-white shadow-sm"
        style={{ background: `linear-gradient(135deg, ${MONDE_FONCE}, ${MONDE_VERT})` }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">🌍</span>
          <h2 className="font-bold text-base">Classement mondial</h2>
        </div>
        <p className="text-[11px] mt-1" style={{ color: '#A7F3D0' }}>
          Classement officiel World Rugby{dateMaj ? ` — mis à jour le ${dateMaj}` : ''}
        </p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ backgroundColor: MONDE_VERT + '10' }}>
              <th className="px-2 py-2 text-left font-semibold text-gray-600 w-8">#</th>
              <th className="px-2 py-2 text-left font-semibold text-gray-600">Nation</th>
              <th className="px-2 py-2 text-right font-semibold text-gray-600">Points</th>
              <th className="px-2 py-2 text-center font-semibold text-gray-600 w-14">Évol.</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((row) => {
              const team = getTeamData ? getTeamData(row.equipe) : null;
              const nom = team?.name || row.equipe;
              const isTop = row.pos <= 3;
              return (
                <tr key={row.pos} className="border-t border-gray-100">
                  <td className="px-2 py-2">
                    <span
                      className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold"
                      style={isTop
                        ? { backgroundColor: MONDE_EMERAUDE, color: '#053B2C' }
                        : { color: '#6B7280' }}
                    >
                      {row.pos}
                    </span>
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-2">
                      {team?.logo && (
                        <img src={team.logo} alt={nom} className="w-5 h-5 object-contain flex-shrink-0" />
                      )}
                      <span className="font-semibold text-gray-800">{nom}</span>
                    </div>
                  </td>
                  <td className="px-2 py-2 text-right font-bold tabular-nums" style={{ color: MONDE_FONCE }}>
                    {row.points != null ? row.points.toFixed(2) : '–'}
                  </td>
                  <td className="px-2 py-2 text-center tabular-nums">
                    <Evolution value={row.evolution || 0} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-center text-[10px] text-gray-400">
        Évolution = variation de rang depuis la dernière publication World Rugby.
      </p>
    </div>
  );
}
