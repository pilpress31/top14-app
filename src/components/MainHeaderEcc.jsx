// ============================================================
// MainHeaderEcc.jsx
// Header dédié à la Challenge Cup (ECC) — page IA
// ============================================================
// Couleurs charte ECC :
//   - Vert challenge : #2E7D32 (couleur principale)
//   - Bronze         : #CD7F32 (accent)
//
// Stats : précision algo ELO + nb matchs analysés
// API   : GET /api/ecc/stats/precision
// ============================================================

import { useState, useEffect } from "react";
import axios from "axios";
import StatsAlgoModal from "./StatsAlgoModal";
import { getCharte } from "../constants/chartes";

const API_BASE = "https://top14-api-production.up.railway.app";
const EC = getCharte("ecc");
const { vert, bronze } = EC.base;

/**
 * MainHeaderEcc (Challenge Cup)
 * @param {boolean} isVisible - Contrôlé depuis la page parente (IAPage / PronosPage).
 *                              Par défaut true.
 */
export default function MainHeaderEcc({ isVisible = true }) {
  const [stats, setStats] = useState({ precision: 0, total: 0 });
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await axios.get(`${API_BASE}/api/ecc/stats/precision`);
        setStats({
          precision: parseFloat(res.data.precision) || 0,
          total: res.data.total_matchs || 0,
        });
      } catch (e) {
        console.error("Erreur stats ECC:", e);
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
        // 🎨 Fond blanc avec léger dégradé vert pour identifier la Challenge Cup
        background: EC.header.fond,
        borderBottom: `2px solid ${EC.header.bordure}`,
        // ✅ Compense la safe-area iOS (notch/Dynamic Island) en mode PWA standalone
        top: 'var(--safe-area-top, 0px)',
      }}
    >
      <div className="container mx-auto px-1 py-1 flex flex-col items-center gap-3">

        {/* Titre */}
        <div className="text-center">
          <h1 className="text-lg font-bold flex items-center justify-center gap-2 uppercase tracking-widest"
              style={{ color: vert }}>
            <span style={{ fontSize: '20px', lineHeight: 1 }}>🛡️</span>
            CHALLENGE CUP PRONOS
          </h1>
          <p className="text-xs italic mt-1" style={{ color: vert, opacity: 0.7 }}>
            Prédictions européennes boostées par l'IA
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
               style={{ backgroundColor: vert, border: `1px solid ${bronze}` }}>
            <TrophyIcon className="h-4 w-4" style={{ color: bronze }} />
            <div>
              <p className="text-sm font-bold" style={{ color: "#FFFFFF" }}>
                {stats.precision > 0 ? `${stats.precision}%` : "…"}
              </p>
              <p className="text-[10px]" style={{ color: bronze }}>Précision moyenne</p>
            </div>
          </div>

          <div className="rounded-lg px-3 py-1 text-center shadow flex items-center gap-1"
               style={{ backgroundColor: vert, border: `1px solid ${bronze}` }}>
            <GlobeIcon className="h-4 w-4" style={{ color: bronze }} />
            <div>
              <p className="text-sm font-bold" style={{ color: "#FFFFFF" }}>
                {stats.total > 0 ? stats.total : "…"}
              </p>
              <p className="text-[10px]" style={{ color: bronze }}>Matchs analysés</p>
            </div>
          </div>
        </button>
      </div>

      {/* Popup stats algo (Challenge Cup) */}
      <StatsAlgoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        championnat="ecc"
        theme={EC.modal}
        globalStats={{ precision: stats.precision, total: stats.total }}
        apiBase={API_BASE}
      />
    </header>
  );
}

// ============================================================
// Icônes : Trophy + Globe (compétition européenne)
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
