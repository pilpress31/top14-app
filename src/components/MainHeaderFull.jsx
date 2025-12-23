import { useState, useEffect, useRef } from 'react';
import { getConfig, getStats } from "../lib/api";

export default function MainHeaderFull({ total }) {
  const [stats, setStats] = useState({
    nombre_matchs_historique: 0,
    precision: { ft: { pourcentage: 0 } }
  });

  const [isVisible, setIsVisible] = useState(true);

  // 🔥 Correction : useRef au lieu de useState
  const lastScrollY = useRef(0);

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

  // 🔥 Scroll stable, sans clignotement
  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY;
      const previous = lastScrollY.current;
      const threshold = 5; // évite les micro-oscillations

      // Toujours visible tout en haut
      if (current < 10) {
        setIsVisible(true);
      }
      // Scroll vers le haut → montrer
      else if (previous - current > threshold) {
        setIsVisible(true);
      }
      // Scroll vers le bas → cacher
      else if (current - previous > threshold && current > 120) {
        setIsVisible(false);
      }

      lastScrollY.current = current;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []); // 👈 IMPORTANT : tableau vide

  const precision = stats.precision.ft.pourcentage;
  const matchesAnalyses = stats.nombre_matchs_historique;

  return (
    <header 
      className={`fixed top-0 left-0 w-full h-[120px] bg-gradient-to-r from-black via-gray-900 to-rugby-gold/80 text-white shadow-md z-50 transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
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
            Pronostics TOP 14
          </h1>
          <p className="text-xs italic text-gray-300 mt-1">Système Elo + Machine Learning</p>
        </div>

        {/* Blocs statistiques centrés */}
        <div className="flex justify-center gap-2">
          
          {/* Bloc précision */}
          <div className="bg-black/50 rounded-md px-3 py-1 text-center shadow flex items-center gap-1 h-[40px]">
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

          {/* Bloc matchs analysés */}
          <div className="bg-black/50 rounded-md px-3 py-1 text-center shadow flex items-center gap-1 h-[40px]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-rugby-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <ellipse cx="12" cy="5" rx="8" ry="3" />
              <path d="M4 5v4c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
              <path d="M4 9v4c0 1.7 3.6 3 8 3s8-1.3 8-3V9" />
              <path d="M4 13v4c0 1.7 3.6 3 8 3s8-1.3 8-3V13" />
            </svg>
            <div>
              <p className="text-sm font-bold text-rugby-gold">
                {matchesAnalyses > 0 ? matchesAnalyses.toLocaleString("fr-FR") : '...'}
              </p>
              <p className="text-[10px] text-gray-300">Matchs analysés</p>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
