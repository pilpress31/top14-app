// ==========================================
// CLASSEMENT ECC — European Challenge Cup (3 poules × 6) + phases finales
// ==========================================
// Fichier : src/components/ClassementEcc.jsx
//
// Affiche le classement officiel de la Challenge Cup (scraping RugbyPass via
// /api/ecc/classement-officiel) + le bracket de la saison en cours
// (/api/ecc/phases-finales, lu depuis matchs_ecc).
//
// Format poules : 3 cartes (1 par pool), 6 équipes triées par rang —
//   colonnes : # / Équipe / MJ / V / N / D / Diff / BO / BD / PTS.
// Top 4 de chaque poule → 8es de finale (round of 16).
//
// Charte ECC : vert challenge #2E7D32 + bronze #CD7F32 + 🛡️
// ==========================================

import { useState, useEffect } from 'react';
import { getTeamData } from '../utils/teams';
import { getCharte } from '../constants/chartes';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const { vert: ECC_VERT, bronze: ECC_BRONZE } = getCharte('ecc').base;
const ECC_BRONZE_LIGHT = '#E8B878'; // bronze clair lisible sur fond vert
// RugbyPass renvoie 'Pool N' (anglais) → francisé pour l'affichage.
const frPoule = (name) => (name || '').replace(/^Pool\b/i, 'Poule');

// Saison ECC courante (calendrier européen, départ décembre) — même règle que le backend.
function saisonEccLabel() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  return m >= 8 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

const ROUND_LABEL_PF = {
  '16e de finale':   '16es de finale',
  '8e de finale':    '8es de finale',
  'Quart de finale': 'Quarts de finale',
  'Demi-finale':     'Demi-finales',
  'Finale':          'Finale',
  'Barrage':         'Barrages',
};

// Carte d'un match de phase finale (2 lignes, vainqueur surligné). Vainqueur
// dérivé des scores (matchs_ecc.vainqueur est en casse mixte → on ne s'y fie pas).
function renderMatchPF(m) {
  const sDom = m.score_domicile;
  const sExt = m.score_exterieur;
  const hasScore = sDom != null && sExt != null;
  const winDom = hasScore && sDom > sExt;
  const winExt = hasScore && sExt > sDom;
  const teamDom = getTeamData ? getTeamData(m.equipe_domicile) : null;
  const teamExt = getTeamData ? getTeamData(m.equipe_exterieure) : null;
  const dateStr = m.date_match
    ? new Date(m.date_match).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

  const ligne = (equipe, logo, score, win, borderTop, champion) => (
    <div
      className={`flex items-center justify-between px-3 py-1.5 ${borderTop ? 'border-t border-gray-100' : ''}`}
      style={win ? { backgroundColor: ECC_BRONZE + '22' } : {}}
    >
      <div className="flex items-center gap-2 min-w-0">
        {logo && (
          <img
            src={logo}
            alt={equipe}
            className="w-5 h-5 object-contain flex-shrink-0"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        )}
        <span className={`truncate text-sm ${win ? 'font-bold text-gray-900' : 'font-medium text-gray-600'}`}>
          {equipe}
        </span>
        {champion && (
          <span className="flex-shrink-0 text-sm" title="Vainqueur de la Challenge Cup">🏆</span>
        )}
      </div>
      <span
        className={`tabular-nums text-sm ml-2 ${win ? 'font-bold' : 'text-gray-500'}`}
        style={win ? { color: ECC_VERT } : {}}
      >
        {score ?? '—'}
      </span>
    </div>
  );

  return (
    <div key={m.id} className="rounded-lg border border-gray-200 overflow-hidden bg-white">
      {ligne(m.equipe_domicile, teamDom?.logo, sDom, winDom, false, winDom && m.round === 'Finale')}
      {ligne(m.equipe_exterieure, teamExt?.logo, sExt, winExt, true, winExt && m.round === 'Finale')}
      <div className="px-3 py-1 bg-gray-50 flex items-center justify-between text-[10px] text-gray-500">
        <span>{dateStr}{m.ville ? ` · ${m.ville}` : ''}</span>
      </div>
    </div>
  );
}

export default function ClassementEcc() {
  const [pools, setPools] = useState(null);
  const [meta, setMeta] = useState(null);
  const [phasesFinales, setPhasesFinales] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${API_URL}/ecc/classement-officiel`);
        const data = await response.json();
        if (cancelled) return;
        if (!data.success) throw new Error(data.error || 'Réponse API invalide');
        setPools(data.pools || {});
        setMeta({
          competition: data.competition,
          round: data.round,
          last_update: data.last_update,
          from_cache: data.from_cache,
          cache_age_minutes: data.cache_age_minutes,
          warning: data.warning,
        });

        // Bracket de la saison en cours (non bloquant)
        try {
          const rPF = await fetch(`${API_URL}/ecc/phases-finales`);
          const dPF = await rPF.json();
          if (!cancelled && dPF && Array.isArray(dPF.rounds)) setPhasesFinales(dPF);
        } catch {
          /* silencieux — section masquée si pas de données */
        }
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
        <div
          className="inline-block animate-spin rounded-full h-10 w-10 border-b-2"
          style={{ borderColor: ECC_VERT }}
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

  if (!pools || Object.keys(pools).length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-slate-400">Aucun classement disponible.</p>
      </div>
    );
  }

  const poolNames = Object.keys(pools).sort();

  return (
    <div className="space-y-4">
      {/* Titre + meta */}
      <div className="text-center mb-2 px-2">
        <h2 className="text-xl sm:text-2xl font-bold leading-tight">
          <span style={{ color: ECC_BRONZE }}>Classement Challenge Cup</span>
          <span className="text-slate-400 text-sm ml-2 whitespace-nowrap">{saisonEccLabel()}</span>
        </h2>
        {meta?.from_cache && (
          <p className="text-xs text-slate-400 italic mt-1">
            Mis à jour il y a {meta.cache_age_minutes ?? 0} min
          </p>
        )}
        {meta?.warning && (
          <p className="text-[10px] text-orange-600 italic mt-1">⚠ {meta.warning}</p>
        )}
      </div>

      {/* Phases finales de la saison en cours (finale en haut) */}
      {phasesFinales?.rounds?.length > 0 && (
        <div className="rounded-lg shadow-md overflow-hidden border" style={{ borderColor: ECC_VERT + '40' }}>
          <div className="px-3 py-2" style={{ backgroundColor: ECC_VERT }}>
            <span className="font-bold text-sm uppercase" style={{ color: ECC_BRONZE_LIGHT }}>
              🛡️ Phases finales{phasesFinales.saison ? ` ${phasesFinales.saison}` : ''}
            </span>
          </div>
          <div className="p-3 space-y-4 bg-white">
            {[...phasesFinales.rounds].reverse().map((group) => (
              <div key={group.round}>
                <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: ECC_VERT }}>
                  {ROUND_LABEL_PF[group.round] || group.round}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {group.matchs.map(renderMatchPF)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3 cartes (1 par poule) */}
      {poolNames.map((poolName) => {
        const equipes = pools[poolName];
        return (
          <div key={poolName} className="rounded-lg shadow-md overflow-hidden border bg-white" style={{ borderColor: ECC_VERT + '40' }}>
            <div className="px-3 py-2 flex items-center justify-between" style={{ backgroundColor: ECC_VERT }}>
              <span className="font-bold text-sm uppercase" style={{ color: ECC_BRONZE_LIGHT }}>🛡️ {frPoule(poolName)}</span>
              <span className="text-[10px]" style={{ color: ECC_BRONZE_LIGHT, opacity: 0.85 }}>
                {equipes.length} équipes
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-2 py-2 text-left font-semibold text-gray-600">#</th>
                    <th className="px-2 py-2 text-left font-semibold text-gray-600">Équipe</th>
                    <th className="px-1 py-2 text-center font-semibold text-gray-600">MJ</th>
                    <th className="px-1 py-2 text-center font-semibold text-gray-600">V</th>
                    <th className="px-1 py-2 text-center font-semibold text-gray-600">N</th>
                    <th className="px-1 py-2 text-center font-semibold text-gray-600">D</th>
                    <th className="px-1 py-2 text-center font-semibold text-gray-600">Diff</th>
                    <th className="px-1 py-2 text-center font-semibold text-gray-600" title="Bonus offensif (4+ essais)">BO</th>
                    <th className="px-1 py-2 text-center font-semibold text-gray-600" title="Bonus défensif (-7 ou moins)">BD</th>
                    <th className="px-2 py-2 text-center font-semibold" style={{ color: ECC_VERT }}>PTS</th>
                  </tr>
                </thead>
                <tbody>
                  {equipes.map((eq) => {
                    const team = getTeamData ? getTeamData(eq.equipe) : null;
                    const logoUrl = team?.logo;
                    const isQualifie = eq.rank <= 4; // top 4 → 8es de finale

                    return (
                      <tr key={eq.equipe} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                        <td className="px-2 py-2 font-bold">
                          <span
                            className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold"
                            style={isQualifie
                              ? { backgroundColor: ECC_VERT, color: '#FFFFFF' }
                              : { backgroundColor: '#F3F4F6', color: '#6B7280' }}
                          >
                            {eq.rank}
                          </span>
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-2">
                            {logoUrl && (
                              <img
                                src={logoUrl}
                                alt={eq.equipe}
                                className="w-5 h-5 object-contain flex-shrink-0"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                            )}
                            <span className="font-semibold text-gray-800 truncate">{eq.equipe}</span>
                          </div>
                        </td>
                        <td className="px-1 py-2 text-center text-gray-700">{eq.mj}</td>
                        <td className="px-1 py-2 text-center font-semibold text-green-600">{eq.v}</td>
                        <td className="px-1 py-2 text-center text-gray-500">{eq.n}</td>
                        <td className="px-1 py-2 text-center font-semibold text-red-500">{eq.d}</td>
                        <td className="px-1 py-2 text-center font-semibold" style={{ color: eq.diff > 0 ? '#16A34A' : eq.diff < 0 ? '#DC2626' : '#6B7280' }}>
                          {eq.diff > 0 ? '+' : ''}{eq.diff}
                        </td>
                        <td className="px-1 py-2 text-center text-gray-700">{eq.bo}</td>
                        <td className="px-1 py-2 text-center text-gray-700">{eq.bd}</td>
                        <td className="px-2 py-2 text-center font-bold text-base" style={{ color: ECC_VERT }}>{eq.pts}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {/* Légende */}
      <div className="bg-white rounded-lg p-3 text-[10px] text-gray-600 border border-gray-200">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: ECC_VERT }} />
            Top 4 : qualifié pour les 8es de finale
          </span>
        </div>
        <p className="mt-1 italic">
          BO = bonus offensif (4+ essais marqués) · BD = bonus défensif (défaite de -7 ou moins)
        </p>
        <p className="mt-1 text-[9px] text-gray-400">
          Source officielle : RugbyPass · Mis à jour automatiquement (cache 1h)
        </p>
      </div>
    </div>
  );
}
