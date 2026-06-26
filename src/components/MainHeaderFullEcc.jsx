// ============================================================
// MainHeaderFullEcc.jsx
// Header Challenge Cup dédié à la PAGE PARIS (/pronos quand championnat = ecc)
// ============================================================
// Calque de MainHeaderFullHcup :
//   - Stats UTILISATEURS (paris gagnants/total) + précision algo
//   - Fallback cold-start : si < 200 paris résolus → CTA "Sois parmi les 1ers à parier !"
// Couleurs charte ECC (vert #2E7D32 + bronze #CD7F32).
// API :
//   - GET /api/ecc/stats/precision    (algo)
//   - GET /api/ecc/stats/users-bets   (utilisateurs)
// ============================================================

import { useState, useEffect } from "react";
import axios from "axios";
import { Trophy, Shield } from "lucide-react";
import { getCharte } from "../constants/chartes";

const API_BASE = "https://api.top14pronos.fr";
const EC = getCharte("ecc");
const { vert, bronze } = EC.base;

// Seuil au-dessus duquel on bascule en "mode mature" (vraies stats users)
const SEUIL_PARIS_AFFICHAGE = 200;

export default function MainHeaderFullEcc({ isVisible = true }) {
  const [algoStats, setAlgoStats] = useState({ precision: 0 });
  const [userStats, setUserStats] = useState({
    total_paris: 0,
    paris_corrects: 0,
    taux_reussite: 0,
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await axios.get(`${API_BASE}/api/ecc/stats/precision`);
        setAlgoStats({ precision: parseFloat(res.data.precision) || 0 });
      } catch (e) {
        console.error("Erreur stats algo ECC:", e);
      }

      try {
        const res = await axios.get(`${API_BASE}/api/ecc/stats/users-bets`);
        setUserStats(res.data);
      } catch (e) {
        console.error("Erreur stats users ECC:", e);
      }
    }
    loadStats();
  }, []);

  const modeMature = userStats.total_paris >= SEUIL_PARIS_AFFICHAGE;

  return (
    <header
      className={`fixed w-full h-[120px] z-50 shadow-md
                  transition-transform duration-300
                  ${isVisible ? "translate-y-0" : "-translate-y-full"}`}
      style={{
        background: EC.header.fond,
        borderBottom: `2px solid ${EC.header.bordure}`,
        top: 'var(--safe-area-top, 0px)',
      }}
    >
      <div className="container mx-auto px-1 py-1 flex flex-col items-center gap-3">

        {/* Titre */}
        <div className="text-center">
          <h1 className="text-lg font-bold flex items-center justify-center gap-2 uppercase tracking-widest"
              style={{ color: vert }}>
            <img
              src="/images/ballon-logo.png"
              alt="Ballon de rugby"
              className="object-contain w-6 h-6"
            />
            CHALLENGE CUP PARIS VIRTUELS
          </h1>
          <p className="text-xs italic mt-1" style={{ color: vert, opacity: 0.7 }}>
            Des cotes fiables, basées sur la réalité du terrain
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 w-full">

          {/* Bloc 1 : Précision moyenne (algo) — toujours affiché */}
          <div className="rounded-lg px-3 py-1 text-center shadow flex items-center gap-1 h-[40px]"
               style={{ backgroundColor: vert, border: `1px solid ${bronze}` }}>
            <Trophy className="h-4 w-4" style={{ color: bronze }} />
            <div>
              <p className="text-sm font-bold" style={{ color: "#FFFFFF" }}>
                {algoStats.precision > 0 ? `${algoStats.precision}%` : "…"}
              </p>
              <p className="text-[10px]" style={{ color: bronze }}>Précision moyenne</p>
            </div>
          </div>

          {/* Bloc 2 : Paris gagnants (mature) OU CTA cold start */}
          {modeMature ? (
            <div className="rounded-lg px-3 py-1 text-center shadow flex items-center gap-1 h-[40px]"
                 style={{ backgroundColor: vert, border: `1px solid ${bronze}` }}>
              <Shield className="h-4 w-4" style={{ color: bronze }} />
              <div>
                <p className="text-sm font-bold" style={{ color: "#FFFFFF" }}>
                  {userStats.paris_corrects}/{userStats.total_paris}
                </p>
                <p className="text-[10px]" style={{ color: bronze }}>Paris gagnants</p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg px-3 py-1 shadow flex items-center gap-1 h-[40px]"
                 style={{ backgroundColor: vert, border: `1px solid ${bronze}` }}>
              <span className="text-base">🚀</span>
              <p className="text-[11px] font-bold leading-tight text-left" style={{ color: bronze }}>
                Sois parmi<br />les 1<sup>ers</sup> à parier !
              </p>
            </div>
          )}

        </div>
      </div>
    </header>
  );
}
