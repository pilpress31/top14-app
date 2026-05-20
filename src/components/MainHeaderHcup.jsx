// ============================================================
// MainHeaderHcup.jsx
// Header dédié à la Champions Cup (HCup)
// ============================================================
// Couleurs charte EPCR :
//   - Bleu EPCR : #003E7E (couleur principale)
//   - Or       : #FFC72C (accent)
//
// Stats : précision algo XGBoost calibré + nb matchs analysés
// API   : GET /api/hcup/stats/precision
// ============================================================

import { useState, useEffect } from "react";
import axios from "axios";
import StatsAlgoModal from "./StatsAlgoModal";

const API_BASE = "https://top14-api-production.up.railway.app";

/**
 * MainHeaderHcup (Champions Cup)
 * @param {boolean} isVisible - Contrôlé depuis la page parente (IAPage / PronosPage).
 *                              Par défaut true.
 */
export default function MainHeaderHcup({ isVisible = true }) {
  const [stats, setStats] = useState({ precision: 0, total: 0 });

  // 🆕 État d'ouverture du popup stats algo
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await axios.get(`${API_BASE}/api/hcup/stats/precision`);
        setStats({
          precision: parseFloat(res.data.precision) || 0,
          total: res.data.total_matchs || 0,
        });
      } catch (e) {
        console.error("Erreur stats HCup:", e);
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
        // 🎨 Fond blanc avec léger dégradé doré pour identifier la HCup
        background: "linear-gradient(to right, #FFFFFF, #FFFFFF, #FFF9E6, #FFC72C33)",
        borderBottom: "2px solid #003E7E",
        // ✅ Compense la safe-area iOS (notch/Dynamic Island) en mode PWA standalone
        top: 'var(--safe-area-top, 0px)',
      }}
    >
      <div className="container mx-auto px-1 py-1 flex flex-col items-center gap-3">

        {/* Titre */}
        <div className="text-center">
          <h1 className="text-lg font-bold flex items-center justify-center gap-2 uppercase tracking-widest"
              style={{ color: "#003E7E" }}>
            <img
              src="/images/ballon-logo.png"
              alt="Ballon de rugby"
              className="object-contain w-6 h-6"
            />
            CHAMPIONS CUP PRONOS
          </h1>
          <p className="text-xs italic mt-1" style={{ color: "#003E7E", opacity: 0.7 }}>
            Prédictions européennes boostées par l'IA
          </p>
        </div>

        {/* Stats — 🆕 cliquables, ouvrent le popup stats algo */}
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          aria-label="Voir les statistiques détaillées de l'algorithme"
          className="flex justify-center gap-2 cursor-pointer bg-transparent border-0 p-0 m-0
                     transition-transform duration-150 hover:scale-[1.03] active:scale-95"
        >
          <div className="rounded-md px-3 py-1 text-center shadow flex items-center gap-1"
               style={{ backgroundColor: "#003E7E", border: "1px solid #FFC72C" }}>
            <TrophyIcon className="h-4 w-4" style={{ color: "#FFC72C" }} />
            <div>
              <p className="text-sm font-bold" style={{ color: "#FFFFFF" }}>
                {stats.precision > 0 ? `${stats.precision}%` : "…"}
              </p>
              <p className="text-[10px]" style={{ color: "#FFC72C" }}>Précision moyenne</p>
            </div>
          </div>

          <div className="rounded-md px-3 py-1 text-center shadow flex items-center gap-1"
               style={{ backgroundColor: "#003E7E", border: "1px solid #FFC72C" }}>
            <GlobeIcon className="h-4 w-4" style={{ color: "#FFC72C" }} />
            <div>
              <p className="text-sm font-bold" style={{ color: "#FFFFFF" }}>
                {stats.total > 0 ? stats.total : "…"}
              </p>
              <p className="text-[10px]" style={{ color: "#FFC72C" }}>Matchs analysés</p>
            </div>
          </div>
        </button>
      </div>

      {/* 🆕 Popup stats algo (Champions Cup) */}
      <StatsAlgoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        championnat="hcup"
        theme={{ primary: "#003E7E", accent: "#FFC72C", onPrimary: "#FFFFFF" }}
        globalStats={{ precision: stats.precision, total: stats.total }}
        apiBase={API_BASE}
      />
    </header>
  );
}

// ============================================================
// Icônes : Trophy + Globe (spécifiques HCup, compétition européenne)
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
