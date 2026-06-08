// ==========================================
// CLASSEMENT HCUP — 4 pools × 6 équipes + phases finales
// ==========================================
// Fichier : src/components/ClassementHcup.jsx
//
// Affiche le classement officiel de la Champions Cup,
// scraping RugbyPass via /api/hcup/classement-officiel,
// puis le tableau de phase finale de la saison en cours
// via /api/hcup/phases-finales.
//
// Format poules : 4 cartes empilées (1 par pool), chaque carte montre les
// 6 équipes triées par rang avec colonnes : # / Équipe / MJ / V / N / D / Diff / BO / BD / PTS.
//
// Format phases finales : section groupée par round (8es → quarts → demies → finale),
// chaque match en carte 2 lignes avec vainqueur surligné.
//
// Couleurs : charte HCup (bleu #003E7E + or #FFC72C)
// ==========================================

import { useState, useEffect } from 'react';
import { getTeamData } from '../utils/teams';
import { getCharte } from '../constants/chartes';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const { bleu: HCUP_BLEU, or: HCUP_OR } = getCharte('hcup').base;

// Libellés d'affichage des rounds de phase finale (pluriel quand plusieurs matchs)
const ROUND_LABEL_PF = {
  '8e de finale':    '8es de finale',
  'Quart de finale': 'Quarts de finale',
  'Demi-finale':     'Demi-finales',
  'Finale':          'Finale',
};

// Rendu d'un match de phase finale (carte 2 lignes, vainqueur surligné)
function renderMatchPF(m) {
  const sDom = m.score_final_domicile ?? m.score_domicile;
  const sExt = m.score_final_exterieur ?? m.score_exterieur;
  const winDom = m.vainqueur && m.vainqueur === m.equipe_domicile;
  const winExt = m.vainqueur && m.vainqueur === m.equipe_exterieure;
  const teamDom = getTeamData ? getTeamData(m.equipe_domicile) : null;
  const teamExt = getTeamData ? getTeamData(m.equipe_exterieure) : null;
  const dateStr = m.date_match
    ? new Date(m.date_match).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

  const ligne = (equipe, logo, score, win, borderTop, champion) => (
    <div
      className={`flex items-center justify-between px-3 py-1.5 ${borderTop ? 'border-t border-gray-100' : ''}`}
      style={win ? { backgroundColor: HCUP_OR + '22' } : {}}
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
          <span className="flex-shrink-0 text-sm" title="Champion d'Europe">🏆</span>
        )}
      </div>
      <span
        className={`tabular-nums text-sm ml-2 ${win ? 'font-bold' : 'text-gray-500'}`}
        style={win ? { color: HCUP_BLEU } : {}}
      >
        {score}
      </span>
    </div>
  );

  return (
    <div key={m.id} className="rounded-lg border border-gray-200 overflow-hidden bg-white">
      {ligne(m.equipe_domicile, teamDom?.logo, sDom, winDom, false, winDom && m.round === 'Finale')}
      {ligne(m.equipe_exterieure, teamExt?.logo, sExt, winExt, true, winExt && m.round === 'Finale')}
      <div className="px-3 py-1 bg-gray-50 flex items-center justify-between text-[10px] text-gray-500">
        <span>{dateStr}{m.ville ? ` · ${m.ville}` : ''}</span>
        {m.prolongation && (
          <span className="font-semibold" style={{ color: HCUP_BLEU }}>a.p.</span>
        )}
      </div>
    </div>
  );
}

export default function ClassementHcup() {
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
        const response = await fetch(`${API_URL}/hcup/classement-officiel`);
        const data = await response.json();
        if (cancelled) return;
        if (!data.success) {
          throw new Error(data.error || 'Réponse API invalide');
        }
        setPools(data.pools || {});
        setMeta({
          competition: data.competition,
          round: data.round,
          last_update: data.last_update,
          from_cache: data.from_cache,
          cache_age_minutes: data.cache_age_minutes,
          warning: data.warning,
        });

        // 🆕 Phases finales de la saison en cours (non bloquant : si ça échoue,
        // les poules restent affichées normalement).
        try {
          const rPF = await fetch(`${API_URL}/hcup/phases-finales`);
          const dPF = await rPF.json();
          if (!cancelled && dPF && Array.isArray(dPF.rounds)) {
            setPhasesFinales(dPF);
          }
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
          style={{ borderColor: HCUP_BLEU }}
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
          <span style={{ color: HCUP_OR }}>Classement Champions Cup</span>
          <span className="text-slate-400 text-sm ml-2 whitespace-nowrap">2025-2026</span>
        </h2>
        {meta?.round != null && (
          <p className="text-xs text-slate-400 italic mt-1">
            Après J{meta.round - 3}
            {meta.from_cache && (
              <span className="ml-1">· Mis à jour il y a {meta.cache_age_minutes ?? 0} min</span>
            )}
          </p>
        )}
        {meta?.warning && (
          <p className="text-[10px] text-orange-600 italic mt-1">⚠ {meta.warning}</p>
        )}
      </div>

      {/* 🆕 Phases finales de la saison en cours (au-dessus des poules, finale en haut) */}
      {phasesFinales?.rounds?.length > 0 && (
        <div
          className="rounded-lg shadow-md overflow-hidden border"
          style={{ borderColor: HCUP_BLEU + '40' }}
        >
          <div className="px-3 py-2" style={{ backgroundColor: HCUP_BLEU }}>
            <span className="font-bold text-sm uppercase" style={{ color: HCUP_OR }}>
              🏆 Phases finales{phasesFinales.saison ? ` ${phasesFinales.saison}` : ''}
            </span>
          </div>
          <div className="p-3 space-y-4 bg-white">
            {[...phasesFinales.rounds].reverse().map((group) => (
              <div key={group.round}>
                <div
                  className="text-xs font-bold uppercase tracking-wide mb-2"
                  style={{ color: HCUP_BLEU }}
                >
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

      {/* 4 cartes (1 par pool) */}
      {poolNames.map((poolName) => {
        const equipes = pools[poolName];
        return (
          <div
            key={poolName}
            className="rounded-lg shadow-md overflow-hidden border"
            style={{ borderColor: HCUP_BLEU + '40' }}
          >
            {/* Header de la carte (bandeau bleu) */}
            <div
              className="px-3 py-2 flex items-center justify-between"
              style={{ backgroundColor: HCUP_BLEU }}
            >
              <span className="font-bold text-sm uppercase" style={{ color: HCUP_OR }}>
                🏆 {poolName}
              </span>
              <span className="text-[10px]" style={{ color: HCUP_OR, opacity: 0.85 }}>
                {equipes.length} équipes
              </span>
            </div>

            {/* Tableau */}
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
                    <th
                      className="px-1 py-2 text-center font-semibold text-gray-600"
                      title="Bonus offensif (4+ essais)"
                    >
                      BO
                    </th>
                    <th
                      className="px-1 py-2 text-center font-semibold text-gray-600"
                      title="Bonus défensif (-7 ou moins)"
                    >
                      BD
                    </th>
                    <th
                      className="px-2 py-2 text-center font-semibold"
                      style={{ color: HCUP_BLEU }}
                    >
                      PTS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {equipes.map((eq) => {
                    const team = getTeamData ? getTeamData(eq.equipe) : null;
                    const logoUrl = team?.logo;
                    // Top 4 = qualifiés directs (huitièmes), 5e = qualif Challenge
                    const isQualifie = eq.rank <= 4;
                    const isChallenge = eq.rank === 5;

                    return (
                      <tr
                        key={eq.equipe}
                        className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                      >
                        {/* Rang */}
                        <td className="px-2 py-2 font-bold">
                          <span
                            className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold"
                            style={
                              isQualifie
                                ? { backgroundColor: HCUP_BLEU, color: HCUP_OR }
                                : isChallenge
                                ? { backgroundColor: '#9CA3AF', color: '#FFFFFF' }
                                : { backgroundColor: '#F3F4F6', color: '#6B7280' }
                            }
                          >
                            {eq.rank}
                          </span>
                        </td>
                        {/* Équipe (avec logo si dispo) */}
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
                            <span className="font-semibold text-gray-800 truncate">
                              {eq.equipe}
                            </span>
                          </div>
                        </td>
                        <td className="px-1 py-2 text-center text-gray-700">{eq.mj}</td>
                        <td className="px-1 py-2 text-center font-semibold text-green-600">
                          {eq.v}
                        </td>
                        <td className="px-1 py-2 text-center text-gray-500">{eq.n}</td>
                        <td className="px-1 py-2 text-center font-semibold text-red-500">
                          {eq.d}
                        </td>
                        <td
                          className="px-1 py-2 text-center font-semibold"
                          style={{ color: eq.diff > 0 ? '#16A34A' : eq.diff < 0 ? '#DC2626' : '#6B7280' }}
                        >
                          {eq.diff > 0 ? '+' : ''}
                          {eq.diff}
                        </td>
                        <td className="px-1 py-2 text-center text-gray-700">{eq.bo}</td>
                        <td className="px-1 py-2 text-center text-gray-700">{eq.bd}</td>
                        <td
                          className="px-2 py-2 text-center font-bold text-base"
                          style={{ color: HCUP_BLEU }}
                        >
                          {eq.pts}
                        </td>
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
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ backgroundColor: HCUP_BLEU }}
            />
            Top 4 : qualifié pour les 8e de finale
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: '#9CA3AF' }} />
            5e : descend en Challenge Cup (8e)
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
