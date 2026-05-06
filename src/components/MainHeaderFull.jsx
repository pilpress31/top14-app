import { useState, useEffect } from 'react';
import { getStats } from "../lib/api";
import axios from 'axios';

/**
 * MainHeaderFull (Top 14 - version paris virtuels)
 * @param {number}  total     - Nombre total de matchs analysés (passé par la page parente).
 * @param {boolean} isVisible - Contrôlé depuis la page parente (IAPage / PronosPage).
 *                              Par défaut true.
 */
export default function MainHeaderFull({ total, isVisible = true }) {
  const [stats, setStats] = useState({
    nombre_matchs_historique: 0,
    precision: { ft: { pourcentage: 0 } }
  });
  const [userStats, setUserStats] = useState({
    total_paris: 0,
    paris_corrects: 0,
    taux_reussite: 0
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await getStats();
        setStats(data);
      } catch (e) {
        console.error("Erreur chargement stats algo:", e);
      }

      try {
        const response = await axios.get('https://top14-api-production.up.railway.app/api/stats/users-bets');
        setUserStats(response.data);
      } catch (e) {
        console.error("Erreur chargement stats users:", e);
      }
    }
    loadStats();
  }, []);

  return (
    <header 
      className={`fixed left-0 w-full h-[120px] bg-gradient-to-r from-black via-gray-900 to-rugby-gold/80 text-white shadow-md z-50 transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
      style={{
        // ✅ Compense la safe-area iOS (notch/Dynamic Island) en mode PWA standalone
        top: 'var(--safe-area-top, 0px)',
      }}
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

          {/* Bloc taux de réussite users */}
          <div className="bg-black/50 rounded-md px-3 py-1 text-center shadow flex items-center gap-1 h-[40px]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-rugby-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 20h16M4 10h4v10H4zm6-6h4v16h-4zm6 8h4v8h-4z" />
            </svg>
            <div>
              <p className="text-sm font-bold text-rugby-gold">
                {userStats.total_paris > 0 ? `${userStats.taux_reussite}%` : '...'}
              </p>
              <p className="text-[10px] text-gray-300">Précision moyenne</p>
            </div>
          </div>

          {/* Bloc paris gagnants / total */}
          <div className="bg-black/50 rounded-md px-3 py-1 text-center shadow flex items-center gap-1 h-[40px]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-rugby-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <div>
              <p className="text-sm font-bold text-rugby-gold">
                {userStats.total_paris > 0 ? `${userStats.paris_corrects}/${userStats.total_paris}` : '...'}
              </p>
              <p className="text-[10px] text-gray-300">Paris gagnants</p>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
