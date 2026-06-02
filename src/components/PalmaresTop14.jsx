// PalmaresTop14.jsx
// Palmarès du Top 14 / Championnat de France depuis 1905
// Source : GET /api/top14/palmares (palmares_top14.json)

import { useState, useEffect, useRef } from "react";
import { getTeamData } from "../utils/teams";
import { ChevronDown, ChevronUp } from "lucide-react";
import { getCharte } from "../constants/chartes";

const API_BASE = "https://top14-api-production.up.railway.app";

// Charte Top 14 — couleurs d'identité centralisées dans src/constants/chartes.js
const { gold: T14_GOLD, goldDark: T14_GOLD_DARK, goldLight: T14_GOLD_LIGHT } = getCharte("top14").base;

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

// Logo générique pour clubs sans SVG dans teams.ts
function LogoGenerique({ nom, size = 40 }) {
  const initiales = nom
    .replace(/^(US|FC|RC|SC|CA|SA|AS|SU|UA|SO|CO|RO|GS|UBB|ASM|USA)\s+/i, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join("");
  return (
    <div
      className="flex items-center justify-center rounded-full font-black flex-shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: T14_GOLD_DARK,
        color: "#fff",
        fontSize: size * 0.32,
        border: `2px solid ${T14_GOLD}`,
      }}
    >
      {initiales || "?"}
    </div>
  );
}

// Logo club : SVG si dispo, sinon générique
function LogoClub({ club, size = 40 }) {
  const [imgError, setImgError] = useState(false);
  const teamData = getTeamData(club);
  const hasLogo = teamData && teamData.logo && !imgError;

  if (hasLogo) {
    return (
      <img
        src={teamData.logo}
        alt={teamData.name}
        style={{ width: size, height: size }}
        className="object-contain flex-shrink-0"
        onError={() => setImgError(true)}
      />
    );
  }
  return <LogoGenerique nom={club} size={size} />;
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
  const [openFilter, setOpenFilter]   = useState(false);
  const filterRef                      = useRef(null);

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

  // Helper : récupérer le nombre de défaites en finale pour un club.
  // palmares[i] contient déjà { club, titres, finales, defaites }
  const getDefaites = club => {
    const p = palmares.find(x => x.club === club);
    return p?.defaites || 0;
  };

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

      {/* Toggle : Palmarès / Toutes les finales */}
      <div className="px-3 mb-3">
        <div className="flex rounded-xl p-1" style={{ backgroundColor: T14_GOLD_LIGHT, border: `1px solid ${T14_GOLD}` }}>
          <button
            onClick={() => setViewMode("palmares")}
            className="flex-1 py-2 text-sm font-semibold rounded-lg transition-colors"
            style={viewMode === "palmares"
              ? { backgroundColor: T14_GOLD, color: '#fff' }
              : { backgroundColor: 'transparent', color: T14_GOLD_DARK }}
          >
            🏆 Palmarès
          </button>
          <button
            onClick={() => setViewMode("finales")}
            className="flex-1 py-2 text-sm font-semibold rounded-lg transition-colors"
            style={viewMode === "finales"
              ? { backgroundColor: T14_GOLD, color: '#fff' }
              : { backgroundColor: 'transparent', color: T14_GOLD_DARK }}
          >
            📋 Toutes les finales
          </button>
        </div>
      </div>

      {/* ═══ VUE PALMARÈS ═══ */}
      {viewMode === "palmares" && (
        <>
          {/* Podium top 3 */}
          {palmares.length >= 3 && (
            <div className="px-4 py-2">
              <div className="flex items-end justify-center gap-2 mb-6">
                {[1, 0, 2].map((rank) => {
                  const club = palmares[rank];
                  const config = PODIUM[rank];
                  const isExpanded = expandedPodium === club.club;
                  return (
                    <div key={club.club} className="flex flex-col items-center">
                      <button
                        onClick={() => setExpandedPodium(isExpanded ? null : club.club)}
                        className="flex flex-col items-center"
                      >
                        <LogoClub club={club.club} size={48} />
                        <div
                          className="rounded-t-lg mt-2 flex flex-col items-center justify-center px-2 transition-all"
                          style={{
                            backgroundColor: config.bg,
                            color: config.text,
                            border: `2px solid ${config.border}`,
                            borderBottom: 'none',
                            width: 92,
                            height: HEIGHTS[rank],
                          }}
                        >
                          <span className="text-2xl">{MEDALS[rank]}</span>
                          <span className="text-xs font-bold leading-tight text-center mt-1">
                            {displayName(club.club)}
                          </span>
                          <span className="text-sm font-extrabold mt-1">
                            {club.titres} {club.titres > 1 ? 'titres' : 'titre'}
                          </span>
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>

              {expandedPodium && (() => {
                const club = palmares.find(p => p.club === expandedPodium);
                if (!club) return null;
                const clubFinales = finales.filter(
                  f => f.champion === club.club || f.finaliste === club.club
                );
                return (
                  <div className="bg-white rounded-xl border border-gray-200 p-3 mb-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <LogoClub club={club.club} size={28} />
                      <span className="text-sm font-bold text-gray-800">
                        {displayName(club.club)} — {club.titres} {club.titres > 1 ? 'titres' : 'titre'}
                      </span>
                    </div>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {clubFinales.map(f => (
                        <div key={f.saison + f.champion} className="flex items-center gap-2 text-xs">
                          <span className="text-gray-500 w-12 flex-shrink-0">{anneeFinale(f.saison)}</span>
                          <span className={f.champion === expandedPodium ? "text-rugby-gold flex-shrink-0" : "flex-shrink-0"}>
                            {f.champion === expandedPodium ? "🏆" : "🥈"}
                          </span>
                          <span className="text-gray-700 truncate">
                            {f.score_domicile != null
                              ? (f.champion === f.equipe_domicile
                                  ? `${f.score_domicile}-${f.score_exterieur}`
                                  : `${f.score_exterieur}-${f.score_domicile}`)
                              : ""}
                            {" vs "}
                            {displayName(f.champion === expandedPodium ? f.finaliste : f.champion)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Liste complète à partir du rang 4 */}
          <div className="px-3 space-y-2">
            {displayedPalmares.slice(3).map((club, idx) => {
              const isExpanded = expandedClub === club.club;
              const clubFinales = finales.filter(
                f => f.champion === club.club || f.finaliste === club.club
              );
              return (
                <div key={club.club} className="bg-white rounded-xl shadow-sm border border-gray-100">
                  <button
                    onClick={() => setExpandedClub(isExpanded ? null : club.club)}
                    className="w-full flex items-center gap-3 p-3 text-left"
                  >
                    <span className="text-xs font-bold w-6 text-gray-400">#{idx + 4}</span>
                    <LogoClub club={club.club} size={36} />
                    <span className="flex-1 text-sm font-semibold text-gray-800 truncate">
                      {displayName(club.club)}
                    </span>
                    <span className="text-sm font-bold text-rugby-gold flex items-center gap-1">
                      {club.titres} 🏆
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </button>

                  {isExpanded && (
                    <div className="px-3 pb-3 border-t border-gray-100 pt-2">
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {clubFinales.map(f => (
                          <div key={f.saison + f.champion} className="flex items-center gap-2 text-xs">
                            <span className="text-gray-500 w-12 flex-shrink-0">{anneeFinale(f.saison)}</span>
                            <span className={f.champion === club.club ? "text-rugby-gold flex-shrink-0" : "flex-shrink-0"}>
                              {f.champion === club.club ? "🏆" : "🥈"}
                            </span>
                            <span className="text-gray-700 truncate">
                              {f.score_domicile != null
                                ? (f.champion === f.equipe_domicile
                                    ? `${f.score_domicile}-${f.score_exterieur}`
                                    : `${f.score_exterieur}-${f.score_domicile}`)
                                : ""}
                              {" vs "}
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

          {!showAll && palmares.length > 10 && (
            <div className="px-3 mt-3">
              <button
                onClick={() => setShowAll(true)}
                className="w-full py-2 text-sm font-semibold rounded-xl border-2 transition-colors"
                style={{ backgroundColor: '#fff', color: T14_GOLD_DARK, borderColor: T14_GOLD }}
              >
                Voir tout le palmarès ({palmares.length} clubs)
              </button>
            </div>
          )}
        </>
      )}

      {/* ═══ VUE TOUTES LES FINALES ═══ */}
      {viewMode === "finales" && (
        <div className="px-3">

          {/* Filtre club — custom dropdown intégré (charte Top 14 gold) */}
          <div className="mb-3 relative" ref={filterRef}>
            {/* Bouton trigger */}
            <button
              onClick={() => setOpenFilter(!openFilter)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold"
              style={{ backgroundColor: T14_GOLD_LIGHT, color: T14_GOLD_DARK, border: `2px solid ${T14_GOLD}` }}
            >
              <div className="flex items-center gap-2">
                {filterClub ? (
                  <>
                    <LogoClub club={filterClub} size={22} />
                    <span>
                      {displayName(filterClub)}
                      {" ("}
                      {palmares.find(p => p.club === filterClub)?.titres || 0} 🏆
                      {getDefaites(filterClub) > 0 && (
                        <> / {getDefaites(filterClub)} 🥈</>
                      )}
                      {")"}
                    </span>
                  </>
                ) : (
                  <><span>🏆</span><span>Toutes les finales</span></>
                )}
              </div>
              {openFilter ? <ChevronUp className="w-4 h-4 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 flex-shrink-0" />}
            </button>

            {/* Liste déroulante intégrée */}
            {openFilter && (
              <div className="mt-1 rounded-xl overflow-hidden shadow-lg"
                style={{ border: `2px solid ${T14_GOLD}`, backgroundColor: '#fff', maxHeight: 280, overflowY: 'auto' }}>
                {/* Option "Toutes" */}
                <button
                  onClick={() => { setFilterClub(""); setOpenFilter(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-left transition-colors"
                  style={!filterClub
                    ? { backgroundColor: T14_GOLD_LIGHT, color: T14_GOLD_DARK }
                    : { backgroundColor: '#fff', color: '#374151' }}
                >
                  <span>🏆</span> Toutes les finales
                </button>
                <div style={{ borderTop: `1px solid ${T14_GOLD}40` }} />
                {[...palmares]
                  .sort((a, b) => displayName(a.club).localeCompare(displayName(b.club)))
                  .map(p => {
                    const d = p.defaites || 0;
                    return (
                      <button
                        key={p.club}
                        onClick={() => { setFilterClub(p.club); setOpenFilter(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors"
                        style={filterClub === p.club
                          ? { backgroundColor: T14_GOLD_LIGHT, color: T14_GOLD_DARK }
                          : { backgroundColor: '#fff', color: '#374151' }}
                      >
                        <LogoClub club={p.club} size={22} />
                        <span className="flex-1 truncate font-medium">{displayName(p.club)}</span>
                        <span className="text-xs opacity-60 flex-shrink-0">
                          {p.titres} 🏆{d > 0 && <> / {d} 🥈</>}
                        </span>
                      </button>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Liste des finales */}
          <div className="space-y-2">
            {finalesFiltrees.map((f, idx) => {
              const champData = getTeamData(f.champion);
              const finalData = getTeamData(f.finaliste);
              return (
                <div key={`${f.id || f.saison}-${f.champion}-${idx}`} className="bg-white rounded-xl shadow-sm border border-gray-100 p-3">
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
