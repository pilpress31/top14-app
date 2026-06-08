import { useState, useEffect } from 'react';
import { getStats } from "../lib/api";

/**
 * MainHeaderFull (Top 14 - version paris virtuels)
 * Affiche la précision algo + CTA "Sois parmi les 1ers à parier !"
 * Identique au comportement de MainHeaderFullD2 / MainHeaderFullHcup.
 */
export default function MainHeaderFull({ total, isVisible = true }) {
  const [precision, setPrecision] = useState(0);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await getStats();
        setPrecision(data?.precision?.ft?.pourcentage ?? 0);
      } catch (e) {
        console.error("Erreur chargement stats algo:", e);
      }
    }
    loadStats();
  }, []);

  return (
    <header
      className={`fixed left-0 w-full h-[120px] bg-gradient-to-r from-black via-gray-900 to-rugby-gold/80 text-white shadow-md z-50 transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
      style={{ top: 'var(--safe-area-top, 0px)' }}
    >
      <div className="container mx-auto px-1 py-1 flex flex-col items-center gap-3">

        {/* Bloc titre */}
        <div className="text-center">
          <h1 className="text-lg font-bold flex items-center justify-center gap-2 text-rugby-gold uppercase tracking-widest">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-rugby-gold" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="2" />
              <circle cx="12" cy="12" r="2" fill="currentColor" />
            </svg>
            TOP 14 PARIS VIRTUELS
          </h1>
          <p className="text-xs italic text-gray-300 mt-1">Des cotes fiables, basées sur la réalité du terrain</p>
        </div>

        {/* Blocs statistiques */}
        <div className="flex justify-center gap-2">

          {/* Bloc précision algo */}
          <div className="bg-black/50 border border-rugby-gold/40 rounded-lg px-3 py-1 text-center shadow flex items-center gap-1 h-[40px]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-rugby-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 20h16M4 10h4v10H4zm6-6h4v16h-4zm6 8h4v8h-4z" />
            </svg>
            <div>
              <p className="text-sm font-bold text-rugby-gold">
                {precision > 0 ? `${precision}%` : '...'}
              </p>
              <p className="text-[10px] text-gray-300">Précision moyenne</p>
            </div>
          </div>

          {/* Bloc CTA */}
          <div className="bg-black/50 border border-rugby-gold/40 rounded-lg px-3 py-1 text-center shadow flex items-center gap-1 h-[40px]">
            <span className="text-rugby-gold text-base">🚀</span>
            <div>
              <p className="text-[11px] font-bold text-rugby-gold leading-tight">
                Sois parmi<br />les 1ers à parier !
              </p>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
