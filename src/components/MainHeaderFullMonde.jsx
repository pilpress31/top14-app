// ============================================================
// MainHeaderFullMonde.jsx
// Header MONDE dédié à la PAGE PARIS (/pronos quand championnat = monde)
// ============================================================
// Différent de MainHeaderMonde (page IA /ia) :
//   - Affiche les stats UTILISATEURS (paris gagnants/total) au lieu de l'algo
//   - Fallback cold start : si < 200 paris résolus, affiche un CTA
//     "Sois parmi les 1ers à parier !" à la place du ratio paris gagnants
//
// Couleurs charte MONDE : vert émeraude #0B6E4F + émeraude #34D399
// API :
//   - GET /api/monde/stats/precision    (algo)
//   - GET /api/monde/stats/users-bets   (utilisateurs)
//
// NOTE (fix scroll juin 2026) :
//   Le header.fond MONDE est un dégradé qui se termine par une couleur
//   translucide. Sur une couche animée en transform, Android ne repeint
//   pas toujours la zone translucide à droite -> on voyait la page derrière.
//   Fix : on pose un FOND BLANC OPAQUE (backgroundColor) SOUS le dégradé
//   (backgroundImage), + animation sur couche GPU (translate3d / will-change
//   / backface-visibility / perspective) et épinglage left-0 right-0.
// ============================================================

import { useState, useEffect } from "react";
import axios from "axios";
import { getCharte } from "../constants/chartes";

const API_BASE = "https://top14-api-production.up.railway.app";
const M = getCharte("monde");
const { vert, emeraude } = M.base;

// Seuil au-dessus duquel on bascule en "mode mature" (vraies stats users)
const SEUIL_PARIS_AFFICHAGE = 200;

export default function MainHeaderFullMonde({ isVisible = true }) {
  const [algoStats, setAlgoStats] = useState({ precision: 0 });
  const [userStats, setUserStats] = useState({
    total_paris: 0,
    paris_corrects: 0,
    taux_reussite: 0,
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await axios.get(`${API_BASE}/api/monde/stats/precision`);
        setAlgoStats({ precision: parseFloat(res.data.precision) || 0 });
      } catch (e) {
        console.error("Erreur stats algo MONDE:", e);
      }
      try {
        const res = await axios.get(`${API_BASE}/api/monde/stats/users-bets`);
        setUserStats(res.data);
      } catch (e) {
        console.error("Erreur stats users MONDE:", e);
      }
    }
    loadStats();
  }, []);

  const modeMature = userStats.total_paris >= SEUIL_PARIS_AFFICHAGE;

  return (
    <header
      className="fixed left-0 right-0 w-full h-[120px] z-50 shadow-md"
      style={{
        // Fond blanc OPAQUE sous le dégradé (évite le contenu visible à droite au scroll)
        backgroundColor: '#FFFFFF',
        backgroundImage: M.header.fond,
        borderBottom: `2px solid ${M.header.bordure}`,
        top: 'var(--safe-area-top, 0px)',
        // Animation show/hide sur couche GPU
        transform: isVisible ? 'translate3d(0,0,0)' : 'translate3d(0,-100%,0)',
        WebkitTransform: isVisible ? 'translate3d(0,0,0)' : 'translate3d(0,-100%,0)',
        transition: 'transform 300ms ease',
        WebkitTransition: 'transform 300ms ease',
        willChange: 'transform',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        perspective: 1000,
        WebkitPerspective: 1000,
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

          {/* Bloc 1 : Précision moyenne (algo) — toujours affiché */}
          <div className="rounded-lg px-3 py-1 text-center shadow flex items-center gap-1 h-[40px]"
               style={{ backgroundColor: vert, border: `1px solid ${emeraude}` }}>
            <TrophyIcon className="h-4 w-4" style={{ color: emeraude }} />
            <div>
              <p className="text-sm font-bold" style={{ color: "#FFFFFF" }}>
                {algoStats.precision > 0 ? `${algoStats.precision}%` : "…"}
              </p>
              <p className="text-[10px]" style={{ color: emeraude }}>Précision moyenne</p>
            </div>
          </div>

          {/* Bloc 2 : Paris gagnants (mature) OU CTA cold start */}
          {modeMature ? (
            <div className="rounded-lg px-3 py-1 text-center shadow flex items-center gap-1 h-[40px]"
                 style={{ backgroundColor: vert, border: `1px solid ${emeraude}` }}>
              <StarIcon className="h-4 w-4" style={{ color: emeraude }} />
              <div>
                <p className="text-sm font-bold" style={{ color: "#FFFFFF" }}>
                  {userStats.paris_corrects}/{userStats.total_paris}
                </p>
                <p className="text-[10px]" style={{ color: emeraude }}>Paris gagnants</p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg px-3 py-1 shadow flex items-center gap-1 h-[40px]"
                 style={{ backgroundColor: vert, border: `1px solid ${emeraude}` }}>
              <span className="text-base">🚀</span>
              <p className="text-[11px] font-bold leading-tight text-left" style={{ color: emeraude }}>
                Sois parmi<br />les 1<sup>ers</sup> à parier !
              </p>
            </div>
          )}

        </div>
      </div>
    </header>
  );
}

// ============================================================
// Icônes : Trophy + Star
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

function StarIcon({ className, style }) {
  return (
    <svg className={className} style={style} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  );
}
