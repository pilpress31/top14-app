import { useState, useEffect } from "react";
import axios from "axios";
import StatsAlgoModal from "./StatsAlgoModal";
import { getCharte } from "../constants/chartes";

const API_BASE = "https://top14-api-production.up.railway.app";
const D2C = getCharte("prod2");
const { navy, silver, blue } = D2C.base;

/**
 * MainHeaderD2 (Pro D2)
 * @param {boolean} isVisible - Contrôlé depuis la page parente (IAPage / PronosPage).
 *                              Par défaut true.
 */
export default function MainHeaderD2({ isVisible = true }) {
  const [stats, setStats] = useState({ precision: 0, total: 0 });

  // 🆕 État d'ouverture du popup stats algo
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await axios.get(`${API_BASE}/api/d2/stats/precision`);
        setStats({
          precision: parseFloat(res.data.precision) || 0,
          total: res.data.total_matchs || 0,
        });
      } catch (e) {
        console.error("Erreur stats D2:", e);
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
        // 🎨 Fond blanc avec léger dégradé bleu pour identifier D2
        background: D2C.header.fond,
        borderBottom: `2px solid ${D2C.header.bordure}`,
        // ✅ Compense la safe-area iOS (notch/Dynamic Island) en mode PWA standalone
        top: 'var(--safe-area-top, 0px)',
      }}
    >
      <div className="container mx-auto px-1 py-1 flex flex-col items-center gap-3">

        {/* Titre */}
        <div className="text-center">
          <h1 className="text-lg font-bold flex items-center justify-center gap-2 uppercase tracking-widest"
              style={{ color: navy }}>
            <img
              src="/images/ballon-logo.png"
              alt="Ballon de rugby"
              className="object-contain w-6 h-6"
            />
            PRO D2 PRONOS
          </h1>
          <p className="text-xs italic mt-1" style={{ color: navy, opacity: 0.7 }}>
            Prédictions sportives boostées par l'IA
          </p>
        </div>

        {/* Stats — 🆕 cliquables, ouvrent le popup stats algo */}
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          aria-label="Voir les statistiques détaillées de l'algorithme"
          className="grid grid-cols-2 gap-2 w-full cursor-pointer bg-transparent border-0 p-0 m-0
                     transition-transform duration-150 hover:scale-[1.03] active:scale-95"
        >
          <div className="rounded-lg px-3 py-1 text-center shadow flex items-center gap-1"
               style={{ backgroundColor: navy, border: `1px solid ${silver}` }}>
            <ChartIcon className="h-4 w-4" style={{ color: silver }} />
            <div>
              <p className="text-sm font-bold" style={{ color: "#FFFFFF" }}>
                {stats.precision > 0 ? `${stats.precision}%` : "…"}
              </p>
              <p className="text-[10px]" style={{ color: blue }}>Précision moyenne</p>
            </div>
          </div>

          <div className="rounded-lg px-3 py-1 text-center shadow flex items-center gap-1"
               style={{ backgroundColor: navy, border: `1px solid ${silver}` }}>
            <DatabaseIcon className="h-4 w-4" style={{ color: silver }} />
            <div>
              <p className="text-sm font-bold" style={{ color: "#FFFFFF" }}>
                {stats.total > 0 ? stats.total : "…"}
              </p>
              <p className="text-[10px]" style={{ color: blue }}>Matchs analysés</p>
            </div>
          </div>
        </button>
      </div>

      {/* 🆕 Popup stats algo (Pro D2) */}
      <StatsAlgoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        championnat="prod2"
        theme={D2C.modal}
        globalStats={{ precision: stats.precision, total: stats.total }}
        apiBase={API_BASE}
      />
    </header>
  );
}

function ChartIcon({ className, style }) {
  return (
    <svg className={className} style={style} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M4 20h16M4 10h4v10H4zm6-6h4v16h-4zm6 8h4v8h-4z" />
    </svg>
  );
}

function DatabaseIcon({ className, style }) {
  return (
    <svg className={className} style={style} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5" />
    </svg>
  );
}
