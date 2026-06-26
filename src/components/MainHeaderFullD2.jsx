// ============================================================
// MainHeaderFullD2.jsx
// Header Pro D2 dédié à la PAGE PARIS (/pronos quand championnat = prod2)
// ============================================================
// Différent de MainHeaderD2 (qui est utilisé sur la page IA /ia) :
//   - Affiche les stats UTILISATEURS (paris gagnants/total) au lieu de l'algo
//   - Logique fallback intelligent : si < 200 paris résolus, affiche un CTA
//     "Sois parmi les 1ers à parier !" à la place du ratio paris gagnants
//
// Couleurs charte Pro D2 :
//   - Bleu marine : #00174D (couleur principale)
//   - Argent      : #C0C0C0 (bordures, accent)
//   - Bleu clair  : #97C1FE (texte secondaire)
//
// Stats : précision algo (toujours affichée) + paris gagnants OU CTA cold start
// API   :
//   - GET /api/d2/stats/precision    (algo)
//   - GET /api/d2/stats/users-bets   (utilisateurs)
// ============================================================

import { useState, useEffect } from "react";
import axios from "axios";
import { getCharte } from "../constants/chartes";

const API_BASE = "https://api.top14pronos.fr";
const D2C = getCharte("prod2");
const { navy, silver, blue } = D2C.base;

// Seuil au-dessus duquel on bascule en "mode mature" (vraies stats users)
// En dessous, on affiche un CTA "Sois parmi les 1ers à parier !"
const SEUIL_PARIS_AFFICHAGE = 200;

/**
 * MainHeaderFullD2 (Pro D2 - version paris virtuels)
 * @param {boolean} isVisible - Contrôlé depuis la page parente (PronosPage).
 *                              Par défaut true.
 */
export default function MainHeaderFullD2({ isVisible = true }) {
  const [algoStats, setAlgoStats] = useState({ precision: 0 });
  const [userStats, setUserStats] = useState({
    total_paris: 0,
    paris_corrects: 0,
    taux_reussite: 0,
  });

  useEffect(() => {
    async function loadStats() {
      // Stats algo (précision)
      try {
        const res = await axios.get(`${API_BASE}/api/d2/stats/precision`);
        setAlgoStats({ precision: parseFloat(res.data.precision) || 0 });
      } catch (e) {
        console.error("Erreur stats algo D2:", e);
      }

      // Stats utilisateurs (paris)
      try {
        const res = await axios.get(`${API_BASE}/api/d2/stats/users-bets`);
        setUserStats(res.data);
      } catch (e) {
        console.error("Erreur stats users D2:", e);
      }
    }
    loadStats();
  }, []);

  // Détermine si on affiche les vraies stats utilisateurs (mode mature)
  // ou le CTA "Sois parmi les 1ers à parier !" (mode cold start)
  const modeMature = userStats.total_paris >= SEUIL_PARIS_AFFICHAGE;

  return (
    <header
      className={`fixed w-full h-[120px] z-50 shadow-md
                  transition-transform duration-300
                  ${isVisible ? "translate-y-0" : "-translate-y-full"}`}
      style={{
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
            PRO D2 PARIS VIRTUELS
          </h1>
          <p className="text-xs italic mt-1" style={{ color: navy, opacity: 0.7 }}>
            Des cotes fiables, basées sur la réalité du terrain
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 w-full">

          {/* Bloc 1 : Précision moyenne (algo) — toujours affiché */}
          <div className="rounded-lg px-3 py-1 text-center shadow flex items-center gap-1 h-[40px]"
               style={{ backgroundColor: navy, border: `1px solid ${silver}` }}>
            <ChartIcon className="h-4 w-4" style={{ color: silver }} />
            <div>
              <p className="text-sm font-bold" style={{ color: "#FFFFFF" }}>
                {algoStats.precision > 0 ? `${algoStats.precision}%` : "…"}
              </p>
              <p className="text-[10px]" style={{ color: blue }}>Précision moyenne</p>
            </div>
          </div>

          {/* Bloc 2 : Paris gagnants (mature) OU CTA cold start */}
          {modeMature ? (
            <div className="rounded-lg px-3 py-1 text-center shadow flex items-center gap-1 h-[40px]"
                 style={{ backgroundColor: navy, border: `1px solid ${silver}` }}>
              <StarIcon className="h-4 w-4" style={{ color: silver }} />
              <div>
                <p className="text-sm font-bold" style={{ color: "#FFFFFF" }}>
                  {userStats.paris_corrects}/{userStats.total_paris}
                </p>
                <p className="text-[10px]" style={{ color: blue }}>Paris gagnants</p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg px-3 py-1 shadow flex items-center gap-1 h-[40px]"
                 style={{
                   backgroundColor: navy,
                   border: `1px solid ${silver}`,
                 }}>
              <span className="text-base">🚀</span>
              <p className="text-[11px] font-bold leading-tight text-left" style={{ color: blue }}>
                Sois parmi<br />les 1<sup>ers</sup> à parier !
              </p>
            </div>
          )}

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

function StarIcon({ className, style }) {
  return (
    <svg className={className} style={style} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  );
}
