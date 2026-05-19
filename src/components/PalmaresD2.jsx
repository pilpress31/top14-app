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

  if (hasLogo) {
    return (
      <img
        src={teamData.logo}
        alt={teamData.name}
        style={{ width: size, height: size }}
        className="object-contain flex-shrink-0"
        onError={() => setError(true)}
      />
    );
  }
  return <LogoGenerique nom={club} size={size} />;
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

  // ─────────────────────────────────────────────────────────────────
  // Calcul des défaites en finale par club (depuis palmares = finales)
  // Pro D2 stats[i] n'a que { club, titres, saisons } → defaites
  // doit être calculé à la volée
  // ─────────────────────────────────────────────────────────────────
  const defaitesParClub = {};
  palmares.forEach(f => {
    if (!f.finaliste) return;
    if (f.finaliste.startsWith('PAS DE') || f.finaliste.startsWith('COMPÉTITION')) return;
    if (f.finaliste === '—') return;
    // Une défaite = être finaliste mais pas champion
    if (f.finaliste !== f.champion) {
      defaitesParClub[f.finaliste] = (defaitesParClub[f.finaliste] || 0) + 1;
    }
  });
  const getDefaites = club => defaitesParClub[club] || 0;

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
        <p className="text-xs" style={{ color: D2_SILVER }}>
          {data.total_saisons} saisons &bull; 1925 &rarr; aujourd'hui
        </p>
      </div>

      {/* Toggle : Palmarès / Toutes les finales */}
      <div className="px-3 mb-3">
        <div className="flex rounded-xl p-1" style={{ backgroundColor: D2_NAVY }}>
          <button
            onClick={() => setViewMode("palmares")}
            className="flex-1 py-2 text-sm font-semibold rounded-lg transition-colors"
            style={viewMode === "palmares"
              ? { backgroundColor: '#fff', color: D2_NAVY }
              : { backgroundColor: 'transparent', color: D2_BLUE }}
          >
            🏆 Palmarès
          </button>
          <button
            onClick={() => setViewMode("finales")}
            className="flex-1 py-2 text-sm font-semibold rounded-lg transition-colors"
            style={viewMode === "finales"
              ? { backgroundColor: '#fff', color: D2_NAVY }
              : { backgroundColor: 'transparent', color: D2_BLUE }}
          >
            📋 Toutes les finales
          </button>
        </div>
      </div>

      {/* ═══ VUE PALMARÈS ═══ */}
      {viewMode === "palmares" && (
        <>
          {/* Podium top 3 */}
          {stats.length >= 3 && (
            <div className="px-4 py-2">
              <div className="flex items-end justify-center gap-2 mb-6">
                {[1, 0, 2].map((rank) => {
                  const club = stats[rank];
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
                const club = stats.find(s => s.club === expandedPodium);
                if (!club) return null;
                const clubFinales = palmares.filter(
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
                          <span className={f.champion === expandedPodium ? "flex-shrink-0" : "flex-shrink-0"}
                            style={f.champion === expandedPodium ? { color: D2_BLUE } : {}}>
                            {f.champion === expandedPodium ? "🏆" : "🥈"}
                          </span>
                          <span className="text-gray-700 truncate">
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
            {displayedStats.slice(3).map((club, idx) => {
              const isExpanded = expandedClub === club.club;
              const clubFinales = palmares.filter(
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
                    <span className="text-sm font-bold flex items-center gap-1" style={{ color: D2_BLUE }}>
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
                            <span className={f.champion === club.club ? "flex-shrink-0" : "flex-shrink-0"}
                              style={f.champion === club.club ? { color: D2_BLUE } : {}}>
                              {f.champion === club.club ? "🏆" : "🥈"}
                            </span>
                            <span className="text-gray-700 truncate">
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

          {!showAll && stats.length > 10 && (
            <div className="px-3 mt-3">
              <button
                onClick={() => setShowAll(true)}
                className="w-full py-2 text-sm font-semibold rounded-xl border-2 transition-colors"
                style={{ backgroundColor: '#fff', color: D2_NAVY, borderColor: D2_NAVY }}
              >
                Voir tout le palmarès ({stats.length} clubs)
              </button>
            </div>
          )}
        </>
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
                    <span>
                      {displayName(filterClub)}
                      {" ("}
                      {stats.find(s => s.club === filterClub)?.titres || 0} 🏆
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
                  .map(s => {
                    const d = getDefaites(s.club);
                    return (
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
                        <span className="text-xs opacity-60 flex-shrink-0">
                          {s.titres} 🏆{d > 0 && <> / {d} 🥈</>}
                        </span>
                      </button>
                    );
                  })}
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
