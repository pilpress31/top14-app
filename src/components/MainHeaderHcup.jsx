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

import { useState, useEffect, useRef } from "react";
import axios from "axios";

const API_BASE = "https://top14-api-production.up.railway.app";

export default function MainHeaderHcup() {
  const [stats, setStats] = useState({ precision: 0, total: 0 });
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

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

  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY;
      const previous = lastScrollY.current;
      const threshold = 5;
      if (current < 10)                                        setIsVisible(true);
      else if (previous - current > threshold)                 setIsVisible(true);
      else if (current - previous > threshold && current > 120) setIsVisible(false);
      lastScrollY.current = current;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 w-full h-[120px] z-50 shadow-md
                  transition-transform duration-300
                  ${isVisible ? "translate-y-0" : "-translate-y-full"}`}
      style={{
        // 🎨 Fond blanc avec léger dégradé doré pour identifier la HCup
        background: "linear-gradient(to right, #FFFFFF, #FFFFFF, #FFF9E6, #FFC72C33)",
        borderBottom: "2px solid #003E7E",
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

        {/* Stats */}
        <div className="flex justify-center gap-2">
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
        </div>
      </div>
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
