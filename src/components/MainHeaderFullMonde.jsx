// ============================================================
// MainHeaderFullMonde.jsx
// Header MONDE dédié à la PAGE PARIS (/pronos quand championnat = monde)
// ============================================================
// Variante de MainHeaderMonde (page IA) : même stats (précision + nb matchs),
// titre orienté "paris virtuels".
//
// Couleurs charte MONDE (cf. constants/chartes.js) :
//   - Vert émeraude : #0B6E4F (principale)  •  Émeraude : #34D399 (accent)
//
// API : GET /api/monde/stats/precision
// ============================================================

import { useState, useEffect } from "react";
import axios from "axios";
import { getCharte } from "../constants/chartes";

const API_BASE = "https://top14-api-production.up.railway.app";
const MC = getCharte("monde");
const { vert, emeraude } = MC.base;

/**
 * MainHeaderFullMonde (Rugby International — version paris virtuels)
 * @param {boolean} isVisible - Contrôlé depuis PronosPage. Par défaut true.
 */
export default function MainHeaderFullMonde({ isVisible = true }) {
  const [stats, setStats] = useState({ precision: 0, total: 0 });

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
    <header
      className={`fixed w-full h-[120px] z-50 shadow-md
                  transition-transform duration-300
                  ${isVisible ? "translate-y-0" : "-translate-y-full"}`}
      style={{
        background: MC.header.fond,
        borderBottom: `2px solid ${MC.header.bordure}`,
        top: 'var(--safe-area-top, 0px)',
      }}
    >
      <div className="container mx-auto px-1 py-1 flex flex-col items-center gap-3">

        {/* Titre */}
        <div className="text-center">
          <h1 className="text-lg font-bold flex items-center justify-center gap-2 uppercase tracking-widest"
              style={{ color: vert }}>
            <span style={{ fontSize: '20px', lineHeight: 1 }}>🌍</span>
            INTERNATIONAL · PARIS VIRTUELS
          </h1>
          <p className="text-xs italic mt-1" style={{ color: vert, opacity: 0.7 }}>
            Des cotes fiables, basées sur la réalité du terrain
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 w-full">
          <div className="rounded-lg px-3 py-1 text-center shadow flex items-center gap-1 h-[40px]"
               style={{ backgroundColor: vert, border: `1px solid ${emeraude}` }}>
            <TrophyIcon className="h-4 w-4" style={{ color: emeraude }} />
            <div>
              <p className="text-sm font-bold" style={{ color: "#FFFFFF" }}>
                {stats.precision > 0 ? `${stats.precision}%` : "…"}
              </p>
              <p className="text-[10px]" style={{ color: emeraude }}>Précision moyenne</p>
            </div>
          </div>

          <div className="rounded-lg px-3 py-1 text-center shadow flex items-center gap-1 h-[40px]"
               style={{ backgroundColor: vert, border: `1px solid ${emeraude}` }}>
            <GlobeIcon className="h-4 w-4" style={{ color: emeraude }} />
            <div>
              <p className="text-sm font-bold" style={{ color: "#FFFFFF" }}>
                {stats.total > 0 ? stats.total : "…"}
              </p>
              <p className="text-[10px]" style={{ color: emeraude }}>Matchs analysés</p>
            </div>
          </div>
        </div>
      </div>
    </header>
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
