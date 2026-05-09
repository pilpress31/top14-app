// ==========================================
// PALMARÈS HCUP — Toutes les finales depuis 1995-1996
// ==========================================
// Fichier : src/components/PalmaresHcup.jsx
//
// Affiche le palmarès historique de la Champions Cup :
//   - Stats globales (éditions, vainqueurs distincts, club record)
//   - Top 10 des palmarès (clubs avec le plus de titres)
//   - Liste complète des finales (récente → ancienne)
//
// Source : /api/hcup/palmares (cache backend 24h, tri récent → ancien)
// Charte HCup officielle : bleu #003E7E + or #FFC72C
// ==========================================

import { useState, useEffect } from 'react';
import { Trophy, ChevronDown, ChevronUp, Crown, Star } from 'lucide-react';
import { getTeamData } from '../utils/teams';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const HCUP_BLEU = '#003E7E';
const HCUP_OR   = '#FFC72C';

// Format saison '2024-2025' → '2024-25'
function formatSaisonShort(saison) {
  if (!saison || !saison.includes('-')) return saison || '';
  const [debut, fin] = saison.split('-');
  return `${debut}-${fin.slice(2)}`;
}

// Format date ISO → '23 mai 2026'
function formatDateFr(dateIso) {
  if (!dateIso) return '';
  try {
    const d = new Date(dateIso);
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

// ==========================================
// Composant : ligne du Top 10 palmarès
// ==========================================
function PalmaresLigne({ rang, item }) {
  const team = getTeamData ? getTeamData(item.club) : null;
  const logoUrl = team?.logo;

  // Médailles or/argent/bronze pour le top 3
  const rangBadge = rang === 1 ? '🥇' : rang === 2 ? '🥈' : rang === 3 ? '🥉' : `${rang}`;
  const isTop3 = rang <= 3;

  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
    >
      {/* Rang */}
      <div className="flex-shrink-0 w-8 text-center font-bold text-sm">
        {isTop3 ? (
          <span className="text-lg">{rangBadge}</span>
        ) : (
          <span className="text-gray-400">{rangBadge}</span>
        )}
      </div>

      {/* Logo + nom */}
      <div className="flex-1 min-w-0 flex items-center gap-2">
        {logoUrl && (
          <img
            src={logoUrl}
            alt={item.club}
            className="w-7 h-7 object-contain flex-shrink-0"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        )}
        <div className="min-w-0">
          <p className="font-semibold text-sm text-gray-800 truncate">{item.club}</p>
          {item.derniere_victoire && (
            <p className="text-[10px] text-gray-500">
              dern. {formatSaisonShort(item.derniere_victoire)}
              {item.finales_perdues > 0 && (
                <span className="ml-1 text-gray-400">
                  · {item.finales_totales} finale{item.finales_totales > 1 ? 's' : ''}
                </span>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Titres */}
      <div className="flex-shrink-0 text-right">
        <p
          className="font-bold text-base leading-none"
          style={{ color: HCUP_BLEU }}
        >
          {item.titres}
        </p>
        <p className="text-[9px] text-gray-500 uppercase tracking-wide leading-none mt-0.5">
          titre{item.titres > 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}

// ==========================================
// Composant : carte d'une finale dans la liste
// ==========================================
function FinaleCard({ finale }) {
  const teamDom = getTeamData ? getTeamData(finale.equipe_dom) : null;
  const teamExt = getTeamData ? getTeamData(finale.equipe_ext) : null;
  const logoDom = teamDom?.logo;
  const logoExt = teamExt?.logo;

  // Cas finale non encore jouée
  if (finale.non_jouee) {
    return (
      <div
        className="rounded-lg border-2 px-3 py-3 mb-2"
        style={{
          borderColor: HCUP_OR,
          backgroundColor: HCUP_OR + '15',
          borderStyle: 'dashed',
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-xs" style={{ color: HCUP_BLEU }}>
            {formatSaisonShort(finale.saison)}
          </span>
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded" style={{ backgroundColor: HCUP_OR, color: HCUP_BLEU }}>
            ⏳ À VENIR
          </span>
        </div>
        <div className="flex items-center justify-center gap-3">
          <div className="flex items-center gap-1.5">
            {logoDom && <img src={logoDom} alt={finale.equipe_dom} className="w-6 h-6 object-contain" />}
            <span className="font-semibold text-sm">{finale.equipe_dom}</span>
          </div>
          <span className="text-xs text-gray-500 font-bold">vs</span>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-sm">{finale.equipe_ext}</span>
            {logoExt && <img src={logoExt} alt={finale.equipe_ext} className="w-6 h-6 object-contain" />}
          </div>
        </div>
        {finale.date_match && (
          <p className="text-[10px] text-gray-600 text-center mt-2 italic">
            📅 {formatDateFr(finale.date_match)}
            {finale.stade && ` · ${finale.stade}`}
            {finale.ville && `, ${finale.ville}`}
          </p>
        )}
      </div>
    );
  }

  // Cas vrai nul (tirs au but)
  if (finale.nul) {
    return (
      <div className="rounded-lg border border-gray-300 px-3 py-2.5 mb-2 bg-white">
        <div className="flex items-center justify-between mb-1">
          <span className="font-bold text-xs text-gray-600">
            {formatSaisonShort(finale.saison)}
          </span>
          <span className="text-[10px] text-gray-500 italic">décidé aux tirs au but</span>
        </div>
        <div className="flex items-center justify-center gap-2 text-sm">
          <span className="font-semibold">{finale.equipe_dom}</span>
          <span className="font-bold">{finale.score_dom}-{finale.score_ext}</span>
          <span className="font-semibold">{finale.equipe_ext}</span>
        </div>
        {finale.stade && (
          <p className="text-[10px] text-gray-500 text-center mt-1">
            {finale.stade}{finale.ville ? `, ${finale.ville}` : ''}
          </p>
        )}
      </div>
    );
  }

  // Cas finale normale (gagnée)
  const vainqueurEstDom = finale.vainqueur === finale.equipe_dom;
  const logoVainqueur = vainqueurEstDom ? logoDom : logoExt;
  const logoFinaliste = vainqueurEstDom ? logoExt : logoDom;

  return (
    <div
      className="rounded-lg border px-3 py-2.5 mb-2 bg-white hover:shadow-md transition-shadow"
      style={{ borderColor: HCUP_BLEU + '30' }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-bold text-xs" style={{ color: HCUP_BLEU }}>
          {formatSaisonShort(finale.saison)}
        </span>
        {finale.prolongation && (
          <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">
            après prolongation
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Vainqueur */}
        <div className="flex-1 flex items-center gap-1.5 min-w-0">
          <Trophy className="w-3.5 h-3.5 flex-shrink-0" style={{ color: HCUP_OR }} />
          {logoVainqueur && (
            <img src={logoVainqueur} alt={finale.vainqueur} className="w-6 h-6 object-contain flex-shrink-0" />
          )}
          <span className="font-bold text-sm truncate" style={{ color: HCUP_BLEU }}>
            {finale.vainqueur}
          </span>
        </div>

        {/* Score */}
        <div className="flex-shrink-0 px-2 py-0.5 rounded font-bold text-sm" style={{ backgroundColor: HCUP_BLEU, color: HCUP_OR }}>
          {finale.score_vainqueur}-{finale.score_finaliste}
        </div>

        {/* Finaliste */}
        <div className="flex-1 flex items-center gap-1.5 justify-end min-w-0">
          <span className="font-medium text-xs text-gray-600 truncate text-right">
            {finale.finaliste}
          </span>
          {logoFinaliste && (
            <img src={logoFinaliste} alt={finale.finaliste} className="w-5 h-5 object-contain opacity-70 flex-shrink-0" />
          )}
        </div>
      </div>

      {finale.stade && (
        <p className="text-[10px] text-gray-500 mt-1.5 truncate">
          {finale.stade}{finale.ville ? `, ${finale.ville}` : ''}
        </p>
      )}
    </div>
  );
}

// ==========================================
// Composant principal
// ==========================================
export default function PalmaresHcup() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAllFinales, setShowAllFinales] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${API_URL}/hcup/palmares`);
        const json = await response.json();
        if (cancelled) return;
        if (!json.success) {
          throw new Error(json.error || 'Réponse API invalide');
        }
        setData(json);
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
        <p className="text-sm text-gray-600 mt-3">Chargement du palmarès…</p>
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

  if (!data || !data.finales || data.finales.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-gray-500">Aucune finale disponible.</p>
      </div>
    );
  }

  const { stats, top_palmares, finales } = data;
  const finalesAffichees = showAllFinales ? finales : finales.slice(0, 5);

  return (
    <div className="space-y-4">
      {/* ───────────────────────────────── */}
      {/* En-tête + stats globales        */}
      {/* ───────────────────────────────── */}
      <div className="text-center mb-2 px-2">
        <h2 className="text-xl sm:text-2xl font-bold leading-tight">
          <span style={{ color: HCUP_BLEU }}>Palmarès Champions Cup</span>
        </h2>
        <p className="text-xs text-gray-500 italic mt-1">
          {stats.total_editions} éditions · {stats.vainqueurs_distincts} vainqueurs différents
        </p>
      </div>

      {/* Carte "Le record" */}
      {stats.club_record && (
        <div
          className="rounded-lg p-4 text-center shadow-md"
          style={{ background: `linear-gradient(135deg, ${HCUP_BLEU} 0%, #002857 100%)` }}
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <Crown className="w-5 h-5" style={{ color: HCUP_OR }} />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: HCUP_OR }}>
              Le record
            </span>
            <Crown className="w-5 h-5" style={{ color: HCUP_OR }} />
          </div>
          <p className="text-2xl font-bold text-white mt-1">{stats.club_record.nom}</p>
          <p className="text-sm font-semibold mt-0.5" style={{ color: HCUP_OR }}>
            {stats.club_record.titres} titres
          </p>
        </div>
      )}

      {/* ───────────────────────────────── */}
      {/* Top 10 des palmarès             */}
      {/* ───────────────────────────────── */}
      <div className="rounded-lg border overflow-hidden shadow-sm" style={{ borderColor: HCUP_BLEU + '40' }}>
        <div
          className="px-3 py-2 flex items-center justify-between"
          style={{ backgroundColor: HCUP_BLEU }}
        >
          <span className="font-bold text-sm uppercase flex items-center gap-1.5" style={{ color: HCUP_OR }}>
            <Star className="w-4 h-4" />
            Top 10 des palmarès
          </span>
        </div>
        <div className="bg-white">
          {top_palmares.map((item, idx) => (
            <PalmaresLigne key={item.club} rang={idx + 1} item={item} />
          ))}
        </div>
      </div>

      {/* ───────────────────────────────── */}
      {/* Liste des finales               */}
      {/* ───────────────────────────────── */}
      <div className="rounded-lg border overflow-hidden shadow-sm" style={{ borderColor: HCUP_BLEU + '40' }}>
        <div
          className="px-3 py-2 flex items-center justify-between"
          style={{ backgroundColor: HCUP_BLEU }}
        >
          <span className="font-bold text-sm uppercase flex items-center gap-1.5" style={{ color: HCUP_OR }}>
            <Trophy className="w-4 h-4" />
            {showAllFinales ? 'Toutes les finales' : '5 dernières finales'}
          </span>
          <span className="text-[10px]" style={{ color: HCUP_OR, opacity: 0.85 }}>
            {finales.length} éditions
          </span>
        </div>
        <div className="bg-gray-50 p-2">
          {finalesAffichees.map((f, idx) => (
            <FinaleCard key={`${f.saison}-${idx}`} finale={f} />
          ))}
        </div>

        {/* Bouton "voir toutes / réduire" */}
        {finales.length > 5 && (
          <button
            onClick={() => setShowAllFinales(!showAllFinales)}
            className="w-full py-2.5 text-xs font-bold uppercase tracking-wide transition-colors flex items-center justify-center gap-1.5 hover:bg-gray-100"
            style={{ color: HCUP_BLEU, borderTop: `1px solid ${HCUP_BLEU}30` }}
          >
            {showAllFinales ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Réduire à 5 finales
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Voir toutes les finales ({finales.length})
              </>
            )}
          </button>
        )}
      </div>

      {/* Note source */}
      <p className="text-[9px] text-gray-400 text-center italic">
        Source : matchs_hcup · 31 finales depuis 1995-1996 · Mis à jour automatiquement
      </p>
    </div>
  );
}
