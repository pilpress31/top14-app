// ============================================================
// MainHeaderMonde.jsx
// Header dédié au Rugby International (MONDE) — page IA
// ============================================================
// Couleurs charte MONDE (cf. constants/chartes.js) :
//   - Vert émeraude : #0B6E4F (couleur principale)
//   - Émeraude      : #34D399 (accent)
//
// Stats : précision algo XGBoost (walk-forward) + nb matchs analysés
// API   : GET /api/monde/stats/precision
//
// FIX SCROLL (vrai correctif, juin 2026) :
//   Cause racine = un même élément cumulait position:fixed ET un transform
//   animé. Android gère mal ce cumul -> la zone de droite n'était pas
//   repeinte (artefact translucide au scroll). Solution propre : SÉPARER
//   les rôles -> un conteneur .fixed (stable) + un <header> enfant animé.
// ============================================================

import { useState, useEffect } from "react";
import axios from "axios";
import { getCharte } from "../constants/chartes";
import StatsAlgoModal from "./StatsAlgoModal";

const API_BASE = "https://api.top14pronos.fr";
const MC = getCharte("monde");
const { vert, emeraude } = MC.base;

/**
 * MainHeaderMonde (Rugby International)
 * @param {boolean} isVisible - Contrôlé depuis la page parente (IAPage / PronosPage).
 */
export default function MainHeaderMonde({ isVisible = true }) {
  const [stats, setStats] = useState({ precision: 0, total: 0 });
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await axios.get(`${API_BASE}/api/monde/stats/precision`);
        setStats({
          precision: parseFloat(res.data.precision) || 0,
          total: res.data.total_matchs || 0,
        });
      } catch (e) {
        console.error("Erreur stats MONDE:", e);
      }
    }
    loadStats();
  }, []);

  return (
    // 1) Conteneur FIXE et STABLE : il ne porte aucun transform animé.
    <div
      style={{
        position: 'fixed',
        top: 'var(--safe-area-top, 0px)',
        left: 0,
        right: 0,
        zIndex: 50,
        // Quand le header est masqué, on laisse passer les clics dessous.
        pointerEvents: isVisible ? 'auto' : 'none',
      }}
    >
      {/* 2) Header ANIMÉ : élément non-fixed -> compositing propre, pas d'artefact. */}
      <header
        className="w-full h-[120px] shadow-md"
        style={{
          backgroundColor: '#FFFFFF',
          backgroundImage: MC.header.fond,
          borderBottom: `2px solid ${MC.header.bordure}`,
          transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
          transition: 'transform 300ms ease',
          willChange: 'transform',
        }}
      >
        <div className="container mx-auto px-1 py-1 flex flex-col items-center gap-3">

          {/* Titre */}
          <div className="text-center">
            <h1 className="text-lg font-bold flex items-center justify-center gap-2 uppercase tracking-widest"
                style={{ color: vert }}>
              <span style={{ fontSize: '20px', lineHeight: 1 }}>🌍</span>
              RUGBY INTERNATIONAL
            </h1>
            <p className="text-xs italic mt-1" style={{ color: vert, opacity: 0.7 }}>
              Tests, tournois &amp; coupes du monde — boostés par l'IA
            </p>
          </div>

          {/* Stats — cliquables, ouvrent le popup stats algo */}
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            aria-label="Voir les statistiques détaillées de l'algorithme"
            className="grid grid-cols-2 gap-2 w-full cursor-pointer bg-transparent border-0 p-0 m-0
                       transition-transform duration-150 hover:scale-[1.03] active:scale-95"
          >
            <div className="rounded-lg px-3 py-1 text-center shadow flex items-center gap-1"
                 style={{ backgroundColor: vert, border: `1px solid ${emeraude}` }}>
              <TrophyIcon className="h-4 w-4" style={{ color: emeraude }} />
              <div>
                <p className="text-sm font-bold" style={{ color: "#FFFFFF" }}>
                  {stats.precision > 0 ? `${stats.precision}%` : "…"}
                </p>
                <p className="text-[10px]" style={{ color: emeraude }}>Précision moyenne</p>
              </div>
            </div>

            <div className="rounded-lg px-3 py-1 text-center shadow flex items-center gap-1"
                 style={{ backgroundColor: vert, border: `1px solid ${emeraude}` }}>
              <GlobeIcon className="h-4 w-4" style={{ color: emeraude }} />
              <div>
                <p className="text-sm font-bold" style={{ color: "#FFFFFF" }}>
                  {stats.total > 0 ? stats.total : "…"}
                </p>
                <p className="text-[10px]" style={{ color: emeraude }}>Matchs analysés</p>
              </div>
            </div>
          </button>
        </div>
      </header>

      {/* Popup stats algo (Rugby International) */}
      <StatsAlgoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        championnat="monde"
        theme={MC.modal || { primary: vert, onPrimary: "#FFFFFF" }}
        globalStats={{ precision: stats.precision, total: stats.total }}
        apiBase={API_BASE}
      />
    </div>
  );
}

// ============================================================
// Icônes : Trophy + Globe
// ============================================================
function TrophyIcon({ className, style }) {
  return (
    <svg className={className} style={style} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

function GlobeIcon({ className, style }) {
  return (
    <svg className={className} style={style} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  );
}
