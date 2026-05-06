import { useState, useEffect } from "react";
import { getConfig, getStats } from "../lib/api";

/**
 * MainHeader (Top 14)
 * @param {boolean} isVisible - Contrôlé depuis la page parente (IAPage, etc.) pour synchro
 *                              avec une éventuelle barre d'onglets sticky.
 *                              Par défaut true (utile si on importe le header sans contrôle externe).
 */
function MainHeader({ isVisible = true }) {
  const [config, setConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [stats, setStats] = useState({
    nombre_matchs_historique: 3651,
    precision: { ft: { pourcentage: 0 } }
  });

  // Chargement config
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoadingConfig(true);
        const data = await getConfig();
        setConfig(data);
      } catch (e) {
        console.error("Erreur chargement config", e);
        setConfig(null);
      } finally {
        setLoadingConfig(false);
      }
    };
    loadConfig();
  }, []);

  // Chargement stats
  useEffect(() => {
    async function loadStats() {
      try {
        const data = await getStats();
        setStats(data);
      } catch (e) {
        console.error("Erreur chargement stats:", e);
      }
    }
    loadStats();
  }, []);

  return (
    <header
      className={`fixed w-full h-[120px] z-50 text-white shadow-md
                  bg-gradient-to-r from-black via-gray-900 to-rugby-gold/80
                  transition-transform duration-300
                  ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}
      style={{
        // ✅ Compense la safe-area iOS (notch/Dynamic Island) en mode PWA standalone
        top: 'var(--safe-area-top, 0px)',
      }}
    >
      <div className="container mx-auto px-1 py-1 flex flex-col items-center gap-3">

        {/* Bloc titre */}
        <div className="text-center">
          <h1 className="text-lg font-bold flex items-center justify-center gap-2 text-rugby-gold uppercase tracking-widest">
            <img
              src="/images/ballon-logo.png"
              alt="Ballon de rugby"
              className="object-contain w-6 h-6"
            />
            TOP 14 PRONOS
          </h1>
          <p className="text-xs italic text-gray-300 mt-1">
            Prédictions sportives boostées par l'IA
          </p>
        </div>

        {/* Blocs statistiques */}
        <div className="flex justify-center gap-2">
          <div className="bg-black/50 rounded-md px-3 py-1 text-center shadow flex items-center gap-1">
            <ChartIcon className="h-4 w-4 text-rugby-gold" />
            <div>
              <p className="text-sm font-bold text-rugby-gold">
                {stats.precision.ft.pourcentage}%
              </p>
              <p className="text-[10px] text-gray-300">Précision moyenne</p>
            </div>
          </div>

          <div className="bg-black/50 rounded-md px-3 py-1 text-center shadow flex items-center gap-1">
            <DatabaseIcon className="h-4 w-4 text-rugby-gold" />
            <div>
              <p className="text-sm font-bold text-rugby-gold">
                {loadingConfig ? "…" : stats.nombre_matchs_historique}
              </p>
              <p className="text-[10px] text-gray-300">Matchs analysés</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function ChartIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M4 20h16M4 10h4v10H4zm6-6h4v16h-4zm6 8h4v8h-4z" />
    </svg>
  );
}

function DatabaseIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5" />
    </svg>
  );
}

export default MainHeader;
