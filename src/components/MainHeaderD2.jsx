import { useState, useEffect, useRef } from "react";
import axios from "axios";

const API_BASE = "https://top14-api-production.up.railway.app";

export default function MainHeaderD2() {
  const [stats, setStats] = useState({ precision: 0, total: 0 });
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    async function loadStats() {
      try {
        // Total matchs depuis /api/d2/saisons (rapide, pas de pagination)
        const [resSaisons, resStats] = await Promise.all([
          axios.get(`${API_BASE}/api/d2/saisons`),
          axios.get(`${API_BASE}/api/d2/historique?limit=1&offset=0`)
        ]);
        // Compter le total réel via le COUNT Supabase
        const total = resStats.data.stats?.total || 0;
        // Précision globale : appel dédié sans filtre sur 100 matchs récents
        const resPrec = await axios.get(`${API_BASE}/api/d2/historique?limit=500&offset=0`);
        const taux = resPrec.data.stats?.taux_reussite || 0;
        setStats({ precision: taux, total });
      } catch (e) {
        console.error("Erreur stats D2:", e);
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
      className={`fixed top-0 w-full h-[120px] z-50 text-white shadow-md
                  transition-transform duration-300
                  ${isVisible ? "translate-y-0" : "-translate-y-full"}`}
      style={{ background: "linear-gradient(to right, #00174D, #002D6B, #001F8A, #97C1FE33)" }}
    >
      <div className="container mx-auto px-1 py-1 flex flex-col items-center gap-3">

        {/* Titre */}
        <div className="text-center">
          <h1 className="text-lg font-bold flex items-center justify-center gap-2 uppercase tracking-widest"
              style={{ color: "#C0C0C0" }}>
            <img
              src="/images/ballon-logo.png"
              alt="Ballon de rugby"
              className="object-contain w-6 h-6"
            />
            PRO D2 PRONOS
          </h1>
          <p className="text-xs italic mt-1" style={{ color: "#97C1FE" }}>
            Prédictions sportives boostées par l'IA
          </p>
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-2">
          <div className="rounded-md px-3 py-1 text-center shadow flex items-center gap-1"
               style={{ backgroundColor: "rgba(0,0,0,0.4)", border: "1px solid rgba(192,192,192,0.2)" }}>
            <ChartIcon className="h-4 w-4" style={{ color: "#C0C0C0" }} />
            <div>
              <p className="text-sm font-bold" style={{ color: "#C0C0C0" }}>
                {stats.precision > 0 ? `${stats.precision}%` : "…"}
              </p>
              <p className="text-[10px]" style={{ color: "#97C1FE" }}>Précision moyenne</p>
            </div>
          </div>

          <div className="rounded-md px-3 py-1 text-center shadow flex items-center gap-1"
               style={{ backgroundColor: "rgba(0,0,0,0.4)", border: "1px solid rgba(192,192,192,0.2)" }}>
            <DatabaseIcon className="h-4 w-4" style={{ color: "#C0C0C0" }} />
            <div>
              <p className="text-sm font-bold" style={{ color: "#C0C0C0" }}>
                {stats.total > 0 ? stats.total : "…"}
              </p>
              <p className="text-[10px]" style={{ color: "#97C1FE" }}>Matchs analysés</p>
            </div>
          </div>
        </div>
      </div>
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
