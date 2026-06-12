// ==========================================
// PALMARÈS MONDE (rugby international)
// Fichier : src/components/PalmaresMonde.jsx
// ==========================================
// Sélecteur de compétition + palmarès par édition.
// Source API : GET /api/monde/palmares
//   → { success, competitions: [...], rows: [{ competition, annee, champion,
//        finaliste, score_finale, troisieme, grand_chelem, triple_couronne,
//        partage, cuillere_bois }] }
// Rendu adapté : Coupe du Monde (finale) vs Tournois (grand chelem / cuillère).
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
      <div
        className="rounded-xl p-4 text-white shadow-sm"
        style={{ background: `linear-gradient(135deg, ${MONDE_FONCE}, ${MONDE_VERT})` }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">🏆</span>
          <h2 className="font-bold text-base">Palmarès</h2>
        </div>
        <p className="text-[11px] mt-1" style={{ color: '#A7F3D0' }}>
          Vainqueurs par édition — rugby international
        </p>
      </div>

      {/* Sélecteur de compétition (défilement horizontal) */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {competitions.map((c) => {
          const isActive = c === selected;
          return (
            <button
              key={c}
              onClick={() => setSelected(c)}
              className="flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-colors border"
              style={isActive
                ? { backgroundColor: MONDE_VERT, color: '#FFFFFF', borderColor: MONDE_VERT }
                : { backgroundColor: '#FFFFFF', color: MONDE_FONCE, borderColor: '#D1FAE5' }}
            >
              {c}
            </button>
          );
        })}
      </div>

      {/* Palmarès de la compétition sélectionnée */}
      {editions.length === 0 ? (
        <p className="text-center text-sm text-slate-400 py-8">Aucune édition pour cette compétition.</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100 overflow-hidden">
          {editions.map((e) => (
            <div key={`${e.competition}-${e.annee}`} className="flex items-start gap-3 px-3 py-2.5">
              {/* Année */}
              <span
                className="flex-shrink-0 mt-0.5 inline-flex items-center justify-center min-w-[44px] h-6 px-1.5 rounded-md text-[11px] font-bold"
                style={{ backgroundColor: MONDE_VERT + '12', color: MONDE_FONCE }}
              >
                {e.annee}
              </span>

              {/* Détails */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-base">🏆</span>
                  <span className="font-bold text-gray-800 truncate">{e.champion || '—'}</span>
                  {e.grand_chelem && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: MONDE_EMERAUDE, color: '#053B2C' }}>
                      GRAND CHELEM
                    </span>
                  )}
                  {e.partage && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-600">
                      PARTAGÉ
                    </span>
                  )}
                </div>

                {/* Ligne secondaire selon le format */}
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
      )}

      <p className="text-center text-[10px] text-gray-400">
        {editions.length} édition{editions.length > 1 ? 's' : ''} — {selected}
      </p>
    </div>
  );
}
