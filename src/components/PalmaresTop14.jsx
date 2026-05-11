// PalmaresTop14.jsx
// Palmares du Top 14 / Championnat de France depuis 1905
// Source : GET /api/top14/palmares (palmares_top14.json)

import { useState, useEffect } from "react";
import { getTeamData } from "../utils/teams";
import { Trophy, Medal, ChevronDown, ChevronUp } from "lucide-react";

const API_BASE = "https://top14-api-production.up.railway.app";

// Couleurs podium
const PODIUM_COLORS = [
  { bg: "#FFD700", text: "#7A5200", label: "Or" },
  { bg: "#C0C0C0", text: "#3A3A3A", label: "Argent" },
  { bg: "#CD7F32", text: "#FFFFFF", label: "Bronze" },
];

// Formater saison "2024-2025" -> "2025"
function anneeFinale(saison) {
  if (!saison) return "";
  const parts = saison.split("-");
  return parts[parts.length - 1];
}

export default function PalmaresTop14() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedClub, setExpandedClub] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [viewMode, setViewMode] = useState("palmares"); // "palmares" | "finales"
  const [filterClub, setFilterClub] = useState("");

  useEffect(() => {
    fetch()
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="text-center">
        <div className="text-4xl mb-3">🏆</div>
        <p className="text-gray-500 text-sm">Chargement du palmarès...</p>
      </div>
    </div>
  );

  if (error || !data) return (
    <div className="p-6 text-center text-red-500">
      Impossible de charger le palmarès.
    </div>
  );

  const { palmares, finales, meta } = data;
  const displayedPalmares = showAll ? palmares : palmares.slice(0, 10);

  // Finales filtrées par club
  const finalesFiltrees = filterClub
    ? finales.filter(f => f.champion === filterClub || f.finaliste === filterClub)
    : finales;

  return (
    <div className="pb-24">
      {/* En-tête */}
      <div className="text-center py-4 px-4">
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="text-2xl">🏆</span>
          <h2 className="text-xl font-bold text-rugby-gold">Palmarès Top 14</h2>
          <span className="text-2xl">🏆</span>
        </div>
        <p className="text-xs text-gray-500">
          {meta.total_finales} finales • {meta.premiere_finale?.split("-")[1]} → {meta.derniere_finale?.split("-")[1]}
        </p>
      </div>

      {/* Toggle Palmarès / Finales */}
      <div className="flex justify-center mb-4 px-4">
        <div className="inline-flex rounded-lg border-2 border-gray-200 overflow-hidden shadow-sm">
          <button
            onClick={() => setViewMode("palmares")}
            className={}
          >
            🏆 Palmarès
          </button>
          <button
            onClick={() => setViewMode("finales")}
            className={}
          >
            📋 Toutes les finales
          </button>
        </div>
      </div>

      {/* VUE PALMARES */}
      {viewMode === "palmares" && (
        <div className="px-3">
          {/* Top 3 podium */}
          <div className="flex items-end justify-center gap-2 mb-6 px-2">
            {palmares.slice(0, 3).map((club, idx) => {
              const teamData = getTeamData(club.club);
              const colors = PODIUM_COLORS[idx];
              const heights = ["h-28", "h-20", "h-16"];
              const order = [1, 0, 2]; // 2e, 1er, 3e
              const displayIdx = order.indexOf(idx);
              return (
                <div key={club.club}
                  className={}
                  style={{ flex: idx === 0 ? "0 0 38%" : "0 0 30%" }}
                >
                  <img src={teamData.logo} alt={teamData.name}
                    className="mb-1 object-contain"
                    style={{ width: idx === 0 ? 52 : 40, height: idx === 0 ? 52 : 40 }}
                    onError={e => e.currentTarget.style.display="none"} />
                  <p className="text-[10px] font-bold text-center text-gray-700 mb-1 leading-tight" style={{ fontSize: idx===0 ? 11 : 9 }}>
                    {teamData.name}
                  </p>
                  <div
                    className={}
                    style={{ backgroundColor: colors.bg }}
                  >
                    <span className="text-2xl">{["🥇","🥈","🥉"][idx]}</span>
                    <span className="font-black text-lg" style={{ color: colors.text }}>{club.titres}</span>
                    <span className="text-[9px] font-semibold" style={{ color: colors.text }}>titre{club.titres > 1 ? "s" : ""}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Liste clubs */}
          <div className="space-y-2">
            {displayedPalmares.slice(3).map((club, idx) => {
              const teamData = getTeamData(club.club);
              const isExpanded = expandedClub === club.club;
              const clubFinales = finales.filter(f => f.champion === club.club || f.finaliste === club.club);
              return (
                <div key={club.club} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <button
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
                    onClick={() => setExpandedClub(isExpanded ? null : club.club)}
                  >
                    <span className="text-xs font-bold text-gray-400 w-5 text-center">{idx + 4}</span>
                    <img src={teamData.logo} alt={teamData.name}
                      className="w-8 h-8 object-contain flex-shrink-0"
                      onError={e => e.currentTarget.style.display="none"} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{teamData.name}</p>
                      <p className="text-[10px] text-gray-400">{club.finales} finales · {club.defaites} défaite{club.defaites > 1 ? "s" : ""}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-center">
                        <span className="text-lg font-black text-rugby-gold">{club.titres}</span>
                        <p className="text-[9px] text-gray-400">titre{club.titres > 1 ? "s" : ""}</p>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="border-t border-gray-100 px-3 py-2 bg-gray-50">
                      <p className="text-[10px] font-semibold text-gray-500 mb-2 uppercase tracking-wide">Finales jouées</p>
                      <div className="space-y-1">
                        {clubFinales.map(f => (
                          <div key={f.saison} className="flex items-center gap-2 text-xs">
                            <span className="text-gray-400 w-10 flex-shrink-0">{anneeFinale(f.saison)}</span>
                            <span className={}>
                              {f.champion === club.club ? "🏆" : "🥈"}
                            </span>
                            <span className="text-gray-700 truncate">
                              {f.score_dom != null ?  : "?"}
                              {" "}<span className="text-gray-400">vs</span>{" "}
                              {f.champion === club.club ? f.finaliste : f.champion}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Voir plus */}
          {palmares.length > 10 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full mt-3 py-2.5 text-sm font-semibold text-rugby-gold border border-rugby-gold rounded-xl hover:bg-rugby-gold/10 transition-colors"
            >
              {showAll ? "Voir moins ▲" : }
            </button>
          )}
        </div>
      )}

      {/* VUE TOUTES LES FINALES */}
      {viewMode === "finales" && (
        <div className="px-3">
          {/* Filtre par club */}
          <div className="mb-3">
            <select
              value={filterClub}
              onChange={e => setFilterClub(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-700"
            >
              <option value="">Tous les clubs</option>
              {palmares.map(p => (
                <option key={p.club} value={p.club}>{p.club} ({p.titres} 🏆)</option>
              ))}
            </select>
          </div>

          {/* Liste des finales */}
          <div className="space-y-2">
            {finalesFiltrees.map(f => {
              const champData = getTeamData(f.champion);
              const finalData = getTeamData(f.finaliste);
              return (
                <div key={f.saison} className="bg-white rounded-xl shadow-sm border border-gray-100 p-3">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-rugby-gold">{anneeFinale(f.saison)}</span>
                    <span className="text-[10px] text-gray-400 truncate max-w-[60%] text-right">{f.lieu}</span>
                  </div>
                  {/* Équipes + Score */}
                  <div className="flex items-center gap-2">
                    {/* Champion */}
                    <div className="flex flex-col items-center flex-1">
                      <img src={champData.logo} alt={champData.name}
                        className="w-10 h-10 object-contain mb-1"
                        onError={e => e.currentTarget.style.display="none"} />
                      <p className="text-[10px] font-semibold text-center text-gray-800 leading-tight line-clamp-2">{champData.name}</p>
                      <span className="text-[9px] text-rugby-gold font-bold mt-0.5">🏆 Champion</span>
                    </div>
                    {/* Score */}
                    <div className="flex flex-col items-center flex-shrink-0 px-2">
                      <span className="text-xl font-black text-gray-800">
                        {f.score_dom != null ?  : "? - ?"}
                      </span>
                      {f.score_mt_dom != null && (
                        <span className="text-[10px] text-gray-400">
                          MT : {f.score_mt_dom} - {f.score_mt_ext}
                        </span>
                      )}
                      <span className="text-[9px] text-gray-300 mt-0.5">Finale</span>
                    </div>
                    {/* Finaliste */}
                    <div className="flex flex-col items-center flex-1">
                      <img src={finalData.logo} alt={finalData.name}
                        className="w-10 h-10 object-contain mb-1"
                        onError={e => e.currentTarget.style.display="none"} />
                      <p className="text-[10px] font-semibold text-center text-gray-800 leading-tight line-clamp-2">{finalData.name}</p>
                      <span className="text-[9px] text-gray-400 font-bold mt-0.5">🥈 Finaliste</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}