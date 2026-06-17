// ==========================================
// PALMARÈS ECC — vainqueurs de la Challenge Cup par saison
// ==========================================
// Fichier : src/components/PalmaresEcc.jsx
//
// Liste les finales (depuis /api/ecc/palmares, calculé sur matchs_ecc) :
// saison · vainqueur (logo + nom) · score · finaliste · lieu.
// En tête : décompte des titres par club (clubs les plus titrés).
//
// Charte ECC : vert #2E7D32 + bronze #CD7F32 + 🏆
// ==========================================

import { useState, useEffect } from 'react';
import { getTeamData } from '../utils/teams';
import { getCharte } from '../constants/chartes';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const { vert: ECC_VERT, bronze: ECC_BRONZE } = getCharte('ecc').base;

export default function PalmaresEcc() {
  const [palmares, setPalmares] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const r = await fetch(`${API_URL}/ecc/palmares`);
        const d = await r.json();
        if (cancelled) return;
        if (!Array.isArray(d.palmares)) throw new Error(d.error || 'Réponse API invalide');
        setPalmares(d.palmares);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: ECC_VERT }} />
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
  if (!palmares || palmares.length === 0) {
    return <div className="text-center py-12"><p className="text-sm text-slate-400">Aucun palmarès disponible.</p></div>;
  }

  // Décompte des titres par club (les plus titrés en tête)
  const titres = {};
  palmares.forEach((p) => { if (p.vainqueur) titres[p.vainqueur] = (titres[p.vainqueur] || 0) + 1; });
  const topTitres = Object.entries(titres).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="text-center mb-1 px-2">
        <h2 className="text-xl sm:text-2xl font-bold leading-tight">
          <span style={{ color: ECC_BRONZE }}>Palmarès Challenge Cup</span>
        </h2>
        <p className="text-xs text-slate-400 italic mt-1">{palmares.length} finales depuis 1996-1997</p>
      </div>

      {/* Clubs les plus titrés */}
      <div className="rounded-lg shadow-md overflow-hidden border bg-white" style={{ borderColor: ECC_VERT + '40' }}>
        <div className="px-3 py-2" style={{ backgroundColor: ECC_VERT }}>
          <span className="font-bold text-sm uppercase" style={{ color: '#E8B878' }}>🏆 Clubs les plus titrés</span>
        </div>
        <div className="p-3 flex flex-wrap gap-2">
          {topTitres.map(([club, n]) => {
            const team = getTeamData ? getTeamData(club) : null;
            return (
              <div key={club} className="flex items-center gap-1.5 rounded-full px-2.5 py-1" style={{ backgroundColor: ECC_VERT + '12' }}>
                {team?.logo && (
                  <img src={team.logo} alt={club} className="w-4 h-4 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                )}
                <span className="text-xs font-semibold text-gray-800">{club}</span>
                <span className="text-xs font-bold" style={{ color: ECC_VERT }}>{n}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Liste des finales (récent → ancien) */}
      <div className="rounded-lg shadow-md overflow-hidden border bg-white" style={{ borderColor: ECC_VERT + '40' }}>
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-2 py-2 text-left font-semibold text-gray-600">Saison</th>
              <th className="px-2 py-2 text-left font-semibold text-gray-600">Vainqueur</th>
              <th className="px-1 py-2 text-center font-semibold text-gray-600">Score</th>
              <th className="px-2 py-2 text-left font-semibold text-gray-600">Finaliste</th>
            </tr>
          </thead>
          <tbody>
            {palmares.map((p) => {
              const tv = getTeamData ? getTeamData(p.vainqueur) : null;
              return (
                <tr key={p.saison} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                  <td className="px-2 py-2 font-semibold text-gray-700 whitespace-nowrap">{p.saison}</td>
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-2">
                      {tv?.logo && (
                        <img src={tv.logo} alt={p.vainqueur} className="w-5 h-5 object-contain flex-shrink-0" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      )}
                      <span className="font-bold text-gray-900 truncate">{p.vainqueur}</span>
                      <span className="text-sm" title="Vainqueur">🏆</span>
                    </div>
                  </td>
                  <td className="px-1 py-2 text-center tabular-nums font-semibold" style={{ color: ECC_VERT }}>{p.score || '—'}</td>
                  <td className="px-2 py-2 text-gray-500 truncate">{p.finaliste || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[9px] text-gray-400 text-center italic">
        Vainqueurs calculés depuis les finales enregistrées (matchs_ecc).
      </p>
    </div>
  );
}
