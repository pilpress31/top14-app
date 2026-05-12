// PalmaresTop14.jsx
// Palmarès du Top 14 / Championnat de France depuis 1905
// Source : GET /api/top14/palmares (palmares_top14.json)

import { useState, useEffect } from "react";
import { getTeamData } from "../utils/teams";
import { ChevronDown, ChevronUp } from "lucide-react";

const API_BASE = "https://top14-api-production.up.railway.app";

// Podium : couleurs + contraste texte soigné
const PODIUM = [
  { bg: "#FFD700", text: "#5C3D00", border: "#E6C200" }, // Or
  { bg: "#D0D0D0", text: "#2A2A2A", border: "#B0B0B0" }, // Argent
  { bg: "#B87333", text: "#FFFFFF", border: "#A0622A" }, // Bronze
];
const MEDALS   = ["🥇", "🥈", "🥉"];
const HEIGHTS  = [120, 88, 72]; // px — assez hauts pour afficher "24 titres"

function anneeFinale(saison) {
  if (!saison) return "";
  const parts = saison.split("-");
  return parts[parts.length - 1];
}

// Nom affiché : getTeamData si logo connu, sinon capitaliser joliment
function displayName(club) {
  if (!club) return "";
  const td = getTeamData(club);
  // getTeamData retourne le vrai nom affiché si le club est connu
  if (td && td.name && td.name !== club) return td.name;
  // Fallback : Title Case en préservant les accents
  return club
    .split(" ")
    .map(w => {
      if (w.length === 0) return w;
      // Garder les acronymes en majuscules (FC, US, ASM, RC...)
      if (w.length <= 3 && w === w.toUpperCase()) return w;
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ");
}

export default function PalmaresTop14() {
  const [data, setData]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [expandedClub, setExpandedClub] = useState(null);
  const [expandedPodium, setExpandedPodium] = useState(null);
  const [showAll, setShowAll]         = useState(false);
  const [viewMode, setViewMode]       = useState("palmares");
  const [filterClub, setFilterClub]   = useState("");

  useEffect(() => {
    fetch(API_BASE + "/api/top14/palmares")
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
    <div className="p-6 text-center text-red-500">Impossible de charger le palmarès.</div>
  );

  const { palmares, finales, meta } = data;
  const displayedPalmares = showAll ? palmares : palmares.slice(0, 10);
  const finalesFiltrees = filterClub
    ? finales.filter(f => f.champion === filterClub || f.finaliste === filterClub)
    : finales;

  return (
    <div className="pb-24">

      {/* En-tête */}
      <div className="text-center py-3 px-4">
        <div className="flex items-center justify-center gap-2 mb-0.5">
          <span className="text-2xl">🏆</span>
          <h2 className="text-xl font-bold text-rugby-gold">Palmarès Top 14</h2>
          <span className="text-2xl">🏆</span>
        </div>
        <p className="text-xs text-gray-500">
          {meta.total_finales} finales &bull;{" "}
          {meta.premiere_finale ? meta.premiere_finale.split("-")[1] : ""}{" "}
          &rarr;{" "}
          {meta.derniere_finale ? meta.derniere_finale.split("-")[1] : ""}
        </p>
      </div>

      {/* Toggle Palmarès / Toutes les finales */}
      <div className="flex justify-center mb-5 px-4">
        <div className="inline-flex rounded-lg border-2 border-gray-200 overflow-hidden shadow-sm">
          <button
            onClick={() => setViewMode("palmares")}
            className="px-4 py-2 text-sm font-bold transition-colors"
            style={viewMode === "palmares"
              ? { backgroundColor: "#CBA135", color: "#fff" }
              : { backgroundColor: "#fff", color: "#CBA135" }}
          >
            🏆 Palmarès
          </button>
          <button
            onClick={() => setViewMode("finales")}
            className="px-4 py-2 text-sm font-bold transition-colors"
            style={viewMode === "finales"
              ? { backgroundColor: "#CBA135", color: "#fff" }
              : { backgroundColor: "#fff", color: "#CBA135" }}
          >
            📋 Toutes les finales
          </button>
        </div>
      </div>

      {/* ═══ VUE PALMARES ═══ */}
      {viewMode === "palmares" && (
        <div className="px-3">

          {/* ── Podium Top 3 ── */}
          <div className="flex items-end justify-center gap-2 mb-6 px-1">
            {palmares.slice(0, 3).map((club, idx) => {
              const teamData = getTeamData(club.club);
              const p = PODIUM[idx];
              // Ordre visuel : 2e à gauche, 1er au centre, 3e à droite
              const orderClass = idx === 0 ? "order-2" : idx === 1 ? "order-1" : "order-3";
              const logoSize   = idx === 0 ? 56 : 44;
              const nameSize   = idx === 0 ? 11 : 9;
              const titleSize  = idx === 0 ? 26 : 20;
              const labelSize  = idx === 0 ? 11 : 10;
              return (
                <div
                  key={club.club}
                  className={"flex flex-col items-center " + orderClass}
                  style={{ flex: idx === 0 ? "0 0 40%" : "0 0 28%" }}
                >
                  <img
                    src={teamData.logo}
                    alt={teamData.name}
                    className="mb-1 object-contain"
                    style={{ width: logoSize, height: logoSize }}
                    onError={e => { e.currentTarget.style.display = "none"; }}
                  />
                  {/* Nom cliquable */}
                  <button
                    className="w-full text-center leading-tight px-1 mb-1"
                    style={{ fontSize: nameSize, fontWeight: 700, color: '#374151' }}
                    onClick={() => setExpandedPodium(expandedPodium === club.club ? null : club.club)}
                  >
                    {displayName(club.club)}
                    <span className="ml-1 text-gray-400" style={{ fontSize: nameSize - 1 }}>
                      {expandedPodium === club.club ? "▲" : "▼"}
                    </span>
                  </button>
                  {/* Socle podium */}
                  <div
                    className="w-full flex flex-col items-center justify-center rounded-t-lg"
                    style={{
                      height: HEIGHTS[idx],
                      backgroundColor: p.bg,
                      border: "2px solid " + p.border,
                    }}
                  >
                    <span style={{ fontSize: idx === 0 ? 28 : 22 }}>{MEDALS[idx]}</span>
                    <span
                      className="font-black leading-none mt-1"
                      style={{ fontSize: titleSize, color: p.text }}
                    >
                      {club.titres}
                    </span>
                    <span
                      className="font-semibold mt-0.5"
                      style={{ fontSize: labelSize, color: p.text }}
                    >
                      titre{club.titres > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Accordéon podium ── */}
          {expandedPodium && (() => {
            const club = palmares.find(p => p.club === expandedPodium);
            if (!club) return null;
            const clubFinales = finales.filter(
              f => f.champion === club.club || f.finaliste === club.club
            );
            return (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4">
                <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Finales jouées — {displayName(expandedPodium)}
                  </p>
                  <button onClick={() => setExpandedPodium(null)} className="text-gray-400 text-xs">✕</button>
                </div>
                <div className="px-3 py-2 space-y-1">
                  {clubFinales.map(f => (
                    <div key={f.saison + f.champion} className="flex items-center gap-2 text-xs">
                      <span className="text-gray-400 w-10 flex-shrink-0">{anneeFinale(f.saison)}</span>
                      <span className={f.champion === expandedPodium ? "text-rugby-gold flex-shrink-0" : "flex-shrink-0"}>
                        {f.champion === expandedPodium ? "🏆" : "🥈"}
                      </span>
                      <span className="text-gray-700 truncate">
                        {f.score_domicile != null ? (
                          f.champion === f.equipe_domicile
                            ? (f.score_domicile + "-" + f.score_exterieur)
                            : (f.score_exterieur + "-" + f.score_domicile)
                        ) : "?"}{" "}
                        <span className="text-gray-400">vs</span>{" "}
                        {displayName(f.champion === expandedPodium ? f.finaliste : f.champion)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* ── Liste rang 4+ ── */}
          <div className="space-y-2">
            {displayedPalmares.slice(3).map((club, idx) => {
              const teamData  = getTeamData(club.club);
              const isExpanded = expandedClub === club.club;
              const clubFinales = finales.filter(
                f => f.champion === club.club || f.finaliste === club.club
              );
              return (
                <div key={club.club} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <button
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
                    onClick={() => setExpandedClub(isExpanded ? null : club.club)}
                  >
                    <span className="text-xs font-bold text-gray-400 w-5 text-center flex-shrink-0">
                      {idx + 4}
                    </span>
                    <img
                      src={teamData.logo}
                      alt={teamData.name}
                      className="w-8 h-8 object-contain flex-shrink-0"
                      onError={e => { e.currentTarget.style.display = "none"; }}
                    />
                    <div className="flex-1 min-w-0">
                      {/* Fix point 2 : nom affiché via displayName */}
                      <p className="text-sm font-semibold text-gray-800 leading-tight">
                        {displayName(club.club)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {club.finales} finale{club.finales > 1 ? "s" : ""}
                        {/* Fix point 4 : n'afficher les défaites que si > 0 */}
                        {club.defaites > 0
                          ? " \u00b7 " + club.defaites + " d\u00e9faite" + (club.defaites > 1 ? "s" : "")
                          : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-center">
                        <span className="text-lg font-black text-rugby-gold">{club.titres}</span>
                        <p className="text-xs text-gray-400">titre{club.titres > 1 ? "s" : ""}</p>
                      </div>
                      {isExpanded
                        ? <ChevronUp className="w-4 h-4 text-gray-400" />
                        : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-gray-100 px-3 py-2 bg-gray-50">
                      <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                        Finales jouées
                      </p>
                      <div className="space-y-1">
                        {clubFinales.map(f => (
                          <div key={f.saison + f.champion} className="flex items-center gap-2 text-xs">
                            <span className="text-gray-400 w-10 flex-shrink-0">{anneeFinale(f.saison)}</span>
                            <span className={f.champion === club.club ? "text-rugby-gold flex-shrink-0" : "flex-shrink-0"}>
                              {f.champion === club.club ? "🏆" : "🥈"}
                            </span>
                            <span className="text-gray-700 truncate">
                              {f.score_domicile != null ? (
                                f.champion === f.equipe_domicile
                                  ? (f.score_domicile + "-" + f.score_exterieur)
                                  : (f.score_exterieur + "-" + f.score_domicile)
                              ) : "?"}{" "}
                              <span className="text-gray-400">vs</span>{" "}
                              {/* Fix point 2 : displayName sur l'adversaire aussi */}
                              {displayName(f.champion === club.club ? f.finaliste : f.champion)}
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

          {/* Voir plus/moins */}
          {palmares.length > 10 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full mt-3 py-2.5 text-sm font-semibold text-rugby-gold border border-rugby-gold rounded-xl hover:bg-yellow-50 transition-colors"
            >
              {showAll ? "Voir moins ▲" : ("Voir tous les " + palmares.length + " clubs ▼")}
            </button>
          )}
        </div>
      )}

      {/* ═══ VUE TOUTES LES FINALES ═══ */}
      {viewMode === "finales" && (
        <div className="px-3">

          {/* Filtre club */}
          <div className="mb-3">
            <select
              value={filterClub}
              onChange={e => setFilterClub(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-700"
            >
              <option value="">Tous les clubs</option>
              {palmares.map(p => (
                <option key={p.club} value={p.club}>
                  {displayName(p.club)} ({p.titres} 🏆)
                </option>
              ))}
            </select>
          </div>

          {/* Liste des finales */}
          <div className="space-y-2">
            {finalesFiltrees.map(f => {
              const champData = getTeamData(f.champion);
              const finalData = getTeamData(f.finaliste);
              return (
                <div key={f.saison + f.champion} className="bg-white rounded-xl shadow-sm border border-gray-100 p-3">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-rugby-gold">{anneeFinale(f.saison)}</span>
                    <span className="text-xs text-gray-400 truncate max-w-xs text-right">{f.lieu}</span>
                  </div>
                  {/* Équipes + Score */}
                  <div className="flex items-center gap-2">
                    {/* Champion */}
                    <div className="flex flex-col items-center flex-1 min-w-0">
                      <div className="w-12 h-12 flex items-center justify-center mb-1">
                        <img
                          src={champData.logo}
                          alt={champData.name}
                          className="w-10 h-10 object-contain"
                          onError={e => { e.currentTarget.style.display = "none"; }}
                        />
                      </div>
                      {/* Fix point 5 : fond blanc + padding pour que les lettres soient visibles */}
                      <p className="text-xs font-semibold text-center text-gray-800 leading-tight w-full">
                        {displayName(f.champion)}
                      </p>
                      <span className="text-xs text-rugby-gold font-bold mt-0.5">🏆 Champion</span>
                    </div>
                    {/* Score */}
                    <div className="flex flex-col items-center flex-shrink-0 px-1">
                      <span className="text-base font-semibold text-gray-800">
                        {f.score_domicile != null ? (
                          f.champion === f.equipe_domicile
                            ? (f.score_domicile + " - " + f.score_exterieur)
                            : (f.score_exterieur + " - " + f.score_domicile)
                        ) : "? - ?"}
                      </span>
                      {f.score_mt_dom != null && (
                        <span className="text-xs text-gray-400">
                          MT : {f.champion === f.equipe_domicile
                            ? `${f.score_mt_dom} - ${f.score_mt_ext}`
                            : `${f.score_mt_ext} - ${f.score_mt_dom}`}
                        </span>
                      )}
                      <span className="text-xs text-gray-300 mt-0.5">Finale</span>
                    </div>
                    {/* Finaliste */}
                    <div className="flex flex-col items-center flex-1 min-w-0">
                      <div className="w-12 h-12 flex items-center justify-center mb-1">
                        <img
                          src={finalData.logo}
                          alt={finalData.name}
                          className="w-10 h-10 object-contain"
                          onError={e => { e.currentTarget.style.display = "none"; }}
                        />
                      </div>
                      <p className="text-xs font-semibold text-center text-gray-800 leading-tight w-full">
                        {displayName(f.finaliste)}
                      </p>
                      <span className="text-xs text-gray-400 font-bold mt-0.5">🥈 Finaliste</span>
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
