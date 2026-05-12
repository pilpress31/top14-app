// PalmaresD2.jsx
// Palmarès de la 2e division rugby français depuis 1925
// Source : GET /api/d2/palmares (palmares_d2.json)

import { useState, useEffect, useRef } from "react";
import { getTeamData } from "../utils/teams";
import { ChevronDown, ChevronUp } from "lucide-react";

const API_BASE = "https://top14-api-production.up.railway.app";

// Charte D2
const D2_NAVY   = "#00174D";
const D2_SILVER = "#C0C0C0";
const D2_BLUE   = "#97C1FE";

const PODIUM = [
  { bg: "#97C1FE", text: "#00174D", border: "#6AA8FD" }, // 1er — bleu clair D2
  { bg: "#C0C0C0", text: "#1a1a1a", border: "#A0A0A0" }, // 2e — argent
  { bg: "#7A9BBF", text: "#FFFFFF", border: "#5C7FA0" }, // 3e — bleu-gris
];
const MEDALS  = ["🥇", "🥈", "🥉"];
const HEIGHTS = [120, 88, 72];

function anneeFinale(saison) {
  if (!saison) return "";
  const parts = saison.split("-");
  return parts[parts.length - 1];
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
        backgroundColor: D2_NAVY,
        color: D2_BLUE,
        fontSize: size * 0.32,
        border: `2px solid ${D2_SILVER}`,
      }}
    >
      {initiales || "?"}
    </div>
  );
}

// Logo club : SVG si dispo, sinon générique
function LogoClub({ club, size = 40 }) {
  const [error, setError] = useState(false);
  const teamData = getTeamData(club);
  const hasLogo = teamData && teamData.logo && !error;

  if (!hasLogo) return <LogoGenerique nom={club} size={size} />;
  return (
    <img
      src={teamData.logo}
      alt={club}
      className="object-contain flex-shrink-0"
      style={{ width: size, height: size }}
      onError={() => setError(true)}
    />
  );
}

function displayName(club) {
  if (!club) return "";
  const td = getTeamData(club);
  if (td && td.name && td.name !== club) return td.name;
  return club
    .split(" ")
    .map(w => {
      if (!w) return w;
      if (w.length <= 3 && w === w.toUpperCase()) return w;
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ");
}

export default function PalmaresD2() {
  const [data, setData]                   = useState(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [expandedClub, setExpandedClub]   = useState(null);
  const [expandedPodium, setExpandedPodium] = useState(null);
  const [showAll, setShowAll]             = useState(false);
  const [viewMode, setViewMode]           = useState("palmares");
  const [filterClub, setFilterClub]       = useState("");
  const [openFilter, setOpenFilter]       = useState(false);
  const filterRef                          = useRef(null);

  useEffect(() => {
    fetch(API_BASE + "/api/d2/palmares")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="text-center">
        <div className="text-4xl mb-3">🏉</div>
        <p className="text-sm" style={{ color: D2_SILVER }}>Chargement du palmarès...</p>
      </div>
    </div>
  );

  if (error || !data) return (
    <div className="p-6 text-center text-red-500">Impossible de charger le palmarès D2.</div>
  );

  const { palmares, stats } = data;
  const displayedStats = showAll ? stats : stats.slice(0, 10);

  // Finales pour la vue "Toutes les finales"
  const finalesFiltrees = filterClub
    ? palmares.filter(f => f.champion === filterClub || f.finaliste === filterClub)
    : palmares;

  return (
    <div className="pb-24">

      {/* En-tête */}
      <div className="text-center py-3 px-4">
        <div className="flex items-center justify-center gap-2 mb-0.5">
          <span className="text-2xl">🏆</span>
          <h2 className="text-xl font-bold" style={{ color: D2_BLUE }}>Palmarès Pro D2</h2>
          <span className="text-2xl">🏆</span>
        </div>
        <p className="text-xs text-gray-400">
          {data.total_saisons} saisons &bull; 1925 &rarr; aujourd'hui
        </p>
      </div>

      {/* Toggle Palmarès / Toutes les finales */}
      <div className="flex justify-center mb-5 px-4">
        <div className="inline-flex rounded-lg overflow-hidden shadow-sm" style={{ border: `2px solid ${D2_NAVY}` }}>
          <button
            onClick={() => setViewMode("palmares")}
            className="px-4 py-2 text-sm font-bold transition-colors"
            style={viewMode === "palmares"
              ? { backgroundColor: D2_NAVY, color: D2_BLUE }
              : { backgroundColor: "#fff", color: D2_NAVY }}
          >
            🏆 Palmarès
          </button>
          <button
            onClick={() => setViewMode("finales")}
            className="px-4 py-2 text-sm font-bold transition-colors"
            style={viewMode === "finales"
              ? { backgroundColor: D2_NAVY, color: D2_BLUE }
              : { backgroundColor: "#fff", color: D2_NAVY }}
          >
            📋 Toutes les finales
          </button>
        </div>
      </div>

      {/* ═══ VUE PALMARES ═══ */}
      {viewMode === "palmares" && (
        <div className="px-3">

          {/* Podium Top 3 */}
          <div className="flex items-end justify-center gap-2 mb-6 px-1">
            {stats.slice(0, 3).map((club, idx) => {
              const p = PODIUM[idx];
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
                  <LogoClub club={club.club} size={logoSize} />
                  <button
                    className="w-full text-center leading-tight px-1 my-1"
                    style={{ fontSize: nameSize, fontWeight: 700, color: '#374151' }}
                    onClick={() => setExpandedPodium(expandedPodium === club.club ? null : club.club)}
                  >
                    {displayName(club.club)}
                    <span className="ml-1 text-gray-400" style={{ fontSize: nameSize - 1 }}>
                      {expandedPodium === club.club ? "▲" : "▼"}
                    </span>
                  </button>
                  <div
                    className="w-full flex flex-col items-center justify-center rounded-t-lg"
                    style={{ height: HEIGHTS[idx], backgroundColor: p.bg, border: `2px solid ${p.border}` }}
                  >
                    <span style={{ fontSize: idx === 0 ? 28 : 22 }}>{MEDALS[idx]}</span>
                    <span className="font-black leading-none mt-1" style={{ fontSize: titleSize, color: p.text }}>
                      {club.titres}
                    </span>
                    <span className="font-semibold mt-0.5" style={{ fontSize: labelSize, color: p.text }}>
                      titre{club.titres > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Accordéon podium */}
          {expandedPodium && (() => {
            const club = stats.find(s => s.club === expandedPodium);
            if (!club) return null;
            return (
              <div className="mb-4 rounded-xl p-3 shadow-sm" style={{ backgroundColor: '#F0F6FF', border: `1px solid ${D2_BLUE}` }}>
                <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: D2_NAVY }}>
                  {displayName(club.club)} — Titres
                </p>
                <div className="flex flex-wrap gap-1">
                  {club.saisons.map(s => (
                    <span key={s} className="px-2 py-0.5 rounded-full text-xs font-bold"
                      style={{ backgroundColor: D2_NAVY, color: D2_BLUE }}>
                      {anneeFinale(s)}
                    </span>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Liste rang 4+ */}
          <div className="space-y-2">
            {displayedStats.slice(3).map((club, idx) => {
              const isExpanded = expandedClub === club.club;
              const clubFinales = palmares.filter(
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
                    <LogoClub club={club.club} size={32} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 leading-tight">
                        {displayName(club.club)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {club.saisons.length} titre{club.saisons.length > 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-center">
                        <span className="text-lg font-black" style={{ color: D2_BLUE }}>{club.titres}</span>
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
                        Saisons titrées
                      </p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {club.saisons.map(s => (
                          <span key={s} className="px-2 py-0.5 rounded-full text-xs font-bold"
                            style={{ backgroundColor: D2_NAVY, color: D2_BLUE }}>
                            {anneeFinale(s)}
                          </span>
                        ))}
                      </div>
                      {clubFinales.some(f => f.finaliste === club.club) && (
                        <>
                          <p className="text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wide">
                            Finales perdues
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {clubFinales
                              .filter(f => f.finaliste === club.club)
                              .map(f => (
                                <span key={f.saison} className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-200 text-gray-600">
                                  {anneeFinale(f.saison)}
                                </span>
                              ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Voir plus/moins */}
          {stats.length > 10 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full mt-3 py-2.5 text-sm font-semibold rounded-xl transition-colors"
              style={{ border: `1px solid ${D2_NAVY}`, color: D2_NAVY }}
            >
              {showAll ? "Voir moins ▲" : `Voir tous les ${stats.length} clubs ▼`}
            </button>
          )}
        </div>
      )}

      {/* ═══ VUE TOUTES LES FINALES ═══ */}
      {viewMode === "finales" && (
        <div className="px-3">

          {/* Filtre club — custom dropdown intégré */}
          <div className="mb-3 relative" ref={filterRef}>
            {/* Bouton trigger */}
            <button
              onClick={() => setOpenFilter(!openFilter)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold"
              style={{ backgroundColor: D2_NAVY, color: D2_BLUE, border: `2px solid ${D2_BLUE}` }}
            >
              <div className="flex items-center gap-2">
                {filterClub ? (
                  <>
                    <LogoClub club={filterClub} size={22} />
                    <span>{displayName(filterClub)} ({stats.find(s => s.club === filterClub)?.titres} 🏆)</span>
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
                style={{ border: `2px solid ${D2_NAVY}`, backgroundColor: '#fff', maxHeight: 280, overflowY: 'auto' }}>
                {/* Option "Toutes" */}
                <button
                  onClick={() => { setFilterClub(""); setOpenFilter(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-left transition-colors"
                  style={!filterClub
                    ? { backgroundColor: D2_NAVY, color: D2_BLUE }
                    : { backgroundColor: '#fff', color: '#374151' }}
                >
                  <span>🏆</span> Toutes les finales
                </button>
                <div style={{ borderTop: `1px solid ${D2_NAVY}20` }} />
                {[...stats]
                  .sort((a, b) => displayName(a.club).localeCompare(displayName(b.club)))
                  .map(s => (
                    <button
                      key={s.club}
                      onClick={() => { setFilterClub(s.club); setOpenFilter(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors"
                      style={filterClub === s.club
                        ? { backgroundColor: D2_NAVY, color: D2_BLUE }
                        : { backgroundColor: '#fff', color: '#374151' }}
                    >
                      <LogoClub club={s.club} size={22} />
                      <span className="flex-1 truncate font-medium">{displayName(s.club)}</span>
                      <span className="text-xs opacity-60 flex-shrink-0">{s.titres} 🏆</span>
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Liste des finales */}
          <div className="space-y-2">
            {[...finalesFiltrees].reverse().map((f, i) => {
              // Ignorer les entrées sans champion réel
              if (!f.champion || f.champion.startsWith('PAS DE') || f.champion.startsWith('COMPÉTITION')) return null;
              return (
                <div key={f.saison + i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold" style={{ color: D2_BLUE }}>{anneeFinale(f.saison)}</span>
                  </div>
                  {/* Corps de la carte selon le type */}
                  {f.type === 'classement' ? (
                    <div className="flex items-center justify-center gap-2 py-2">
                      <LogoClub club={f.champion} size={40} />
                      <div className="text-center">
                        <p className="text-sm font-semibold text-gray-800">{displayName(f.champion)}</p>
                        <span className="text-xs font-bold mt-0.5" style={{ color: D2_BLUE }}>🏆 Champion</span>
                        <p className="text-xs text-gray-400 mt-1 italic">
                          {f.saison === '2019-2020' ? 'Saison arrêtée (Covid)' : 'Titre sur classement régulier'}
                        </p>
                      </div>
                    </div>
                  ) : (
                  <div className="flex items-center gap-2">
                    {/* Champion */}
                    <div className="flex flex-col items-center flex-1 min-w-0">
                      <LogoClub club={f.champion} size={40} />
                      <p className="text-xs font-semibold text-center text-gray-800 leading-tight mt-1 w-full">
                        {displayName(f.champion)}
                      </p>
                      <span className="text-xs font-bold mt-0.5" style={{ color: D2_BLUE }}>🏆 Champion</span>
                    </div>
                    {/* Séparateur */}
                    <div className="flex flex-col items-center flex-shrink-0 px-1">
                      <span className="text-base font-semibold text-gray-600">
                        {f.score_finale && !f.score_finale.includes('—') ? f.score_finale : 'vs'}
                      </span>
                      <span className="text-xs text-gray-300 mt-0.5">Finale</span>
                    </div>
                    {/* Finaliste */}
                    <div className="flex flex-col items-center flex-1 min-w-0">
                      {f.finaliste && !f.finaliste.startsWith('PAS DE') && !f.finaliste.startsWith('COMPÉTITION') && f.finaliste !== '—'
                        ? <>
                            <LogoClub club={f.finaliste} size={40} />
                            <p className="text-xs font-semibold text-center text-gray-800 leading-tight mt-1 w-full">
                              {displayName(f.finaliste)}
                            </p>
                            <span className="text-xs text-gray-400 font-bold mt-0.5">🥈 Finaliste</span>
                          </>
                        : <span className="text-xs text-gray-400 text-center">Finaliste<br/>inconnu</span>
                      }
                    </div>
                  </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
