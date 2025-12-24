import { useState, useEffect } from "react";
import { getTeamData } from "../utils/teams";

interface MatchHistorique {
  id: string;
  date: string;
  saison: string;
  journee: number;
  equipe_domicile: string;
  equipe_exterieure: string;
  score_domicile: number;
  score_exterieur: number;
  score_ht_domicile?: number;
  score_ht_exterieur?: number;
  vainqueur?: string;
  prono_ft?: {
    domicile: number | null;
    exterieur: number | null;
  };
  prono_text?: string;
  comp_ft?: string;
}

interface HistoriqueTabProps {
  headerVisible?: boolean;
}

export default function HistoriqueTab({ headerVisible = true }: HistoriqueTabProps) {
  const [matches, setMatches] = useState<MatchHistorique[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const matchesPerPage = 21;

  useEffect(() => {
    const loadHistorique = async () => {
      try {
        const response = await fetch("https://top14-api-production.up.railway.app/api/matchs/historique/all");
        const data = await response.json();
        
        console.log("Historique chargé:", data);
        setMatches(data.matchs || []);
      } catch (e) {
        console.error("Erreur chargement historique:", e);
        setMatches([]);
      } finally {
        setLoading(false);
      }
    };
    loadHistorique();
  }, []);

  const equipes = Array.from(
    new Set(matches.flatMap(m => [m.equipe_domicile, m.equipe_exterieure]))
  ).sort();

  let filteredMatches =
    selectedTeam === "all"
      ? matches
      : matches.filter(
          m =>
            m.equipe_domicile === selectedTeam ||
            m.equipe_exterieure === selectedTeam
        );

  if (searchQuery.trim() !== "") {
    const query = searchQuery.toLowerCase();
    filteredMatches = filteredMatches.filter(
      m =>
        m.equipe_domicile.toLowerCase().includes(query) ||
        m.equipe_exterieure.toLowerCase().includes(query) ||
        m.date.toLowerCase().includes(query)
    );
  }

  filteredMatches = filteredMatches.sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
  });

  const totalPages = Math.ceil(filteredMatches.length / matchesPerPage);
  const startIndex = (currentPage - 1) * matchesPerPage;
  const paginatedMatches = filteredMatches.slice(
    startIndex,
    startIndex + matchesPerPage
  );

  if (loading) {
    return <div className="p-6 text-center text-rugby-gray">🔄 Chargement de l'historique…</div>;
  }

  if (matches.length === 0) {
    return <div className="p-6 text-center text-rugby-gray">Aucun match historique disponible</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filtres - STICKY avec position dynamique sous les onglets */}
      <div className={`sticky bg-rugby-white z-30 pb-4 pt-2 shadow-sm border-b border-gray-200 transition-all duration-300`}
           style={{ top: headerVisible ? '200px' : '80px' }}>
        <div className="flex flex-col md:flex-row gap-4">
          <select
            value={selectedTeam}
            onChange={(e) => {
              setSelectedTeam(e.target.value);
              setCurrentPage(1);
            }}
            className="border border-rugby-gray rounded px-3 py-2 text-sm"
          >
            <option value="all">Toutes les équipes</option>
            {equipes.map(team => (
              <option key={team} value={team}>{team}</option>
            ))}
          </select>

          <select
            value={sortOrder}
            onChange={(e) => {
              setSortOrder(e.target.value as "asc" | "desc");
              setCurrentPage(1);
            }}
            className="border border-rugby-gray rounded px-3 py-2 text-sm"
          >
            <option value="desc">Date décroissante (récent → ancien)</option>
            <option value="asc">Date croissante (ancien → récent)</option>
          </select>

          <input
            type="text"
            placeholder="Rechercher par équipe ou date..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="border border-rugby-gray rounded px-3 py-2 text-sm flex-1"
          />
        </div>
      </div>

      {/* Liste des matchs */}
      <div className="grid gap-4 pb-20">
        {paginatedMatches.map((m) => {
          const teamDomData = getTeamData(m.equipe_domicile);
          const teamExtData = getTeamData(m.equipe_exterieure);
          
          const pronoOK = m.comp_ft && (m.comp_ft.includes('OK') || m.comp_ft === 'OK');
          
          const ecartDom = m.prono_ft?.domicile !== null && m.prono_ft?.domicile !== undefined
            ? m.score_domicile - m.prono_ft.domicile
            : null;
          const ecartExt = m.prono_ft?.exterieur !== null && m.prono_ft?.exterieur !== undefined
            ? m.score_exterieur - m.prono_ft.exterieur
            : null;

          return (
            <div key={m.id} className="w-full bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow py-4 px-3 border border-gray-200">
              {/* Entête */}
              <div className="flex justify-between items-start mb-3">
                <div className="text-xs text-rugby-orange font-bold uppercase tracking-wide">
                  JOURNÉE {m.journee}
                </div>
                <div className="text-xs text-gray-700 font-semibold text-right">
                  {new Date(m.date).toLocaleDateString("fr-FR", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  }).toUpperCase()}
                </div>
              </div>

              {/* Contenu */}
              <div className="grid grid-cols-3 gap-3 items-start">
                {/* Équipe domicile */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-1">
                    <img
                      src={teamDomData.logo}
                      alt={teamDomData.name}
                      className="w-10 h-10 object-contain"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  </div>
                  <div className="text-xs font-semibold text-gray-800 leading-tight line-clamp-2">
                    {m.equipe_domicile}
                  </div>
                </div>

                {/* Scores */}
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="text-center">
                    <div className="text-[10px] text-gray-500 uppercase mb-1">Score réel</div>
                    <div className="text-2xl font-bold text-rugby-orange">
                      {m.score_domicile} - {m.score_exterieur}
                    </div>
                  </div>

                  {m.prono_ft && m.prono_ft.domicile !== null && m.prono_ft.exterieur !== null && (
                    <>
                      <div className="text-center">
                        <div className="text-[10px] text-gray-400 uppercase mb-1">Prédit</div>
                        <div className="text-lg font-semibold text-gray-600">
                          {m.prono_ft.domicile} - {m.prono_ft.exterieur}
                        </div>
                      </div>

                      {(ecartDom !== null || ecartExt !== null) && (
                        <div className="text-[10px] text-gray-500 italic">
                          Écart: {ecartDom !== null ? (ecartDom > 0 ? `+${ecartDom}` : ecartDom) : '?'} / {ecartExt !== null ? (ecartExt > 0 ? `+${ecartExt}` : ecartExt) : '?'}
                        </div>
                      )}

                      <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                        pronoOK ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {pronoOK ? '✓ Prono correct' : '✗ Prono incorrect'}
                      </div>
                    </>
                  )}
                </div>

                {/* Équipe extérieure */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-1">
                    <img
                      src={teamExtData.logo}
                      alt={teamExtData.name}
                      className="w-10 h-10 object-contain"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  </div>
                  <div className="text-xs font-semibold text-gray-800 leading-tight line-clamp-2">
                    {m.equipe_exterieure}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      <div
        className="fixed left-0 w-full flex justify-center items-center gap-4 bg-white py-2 shadow-md z-50"
        style={{ bottom: "var(--bottom-nav-height, 60px)" }}
      >
        <button
          onClick={() => {
            setCurrentPage(p => Math.max(1, p - 1));
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          disabled={currentPage === 1}
          className="px-4 py-2 rounded font-semibold text-white
                    bg-rugby-gold hover:bg-rugby-bronze
                    disabled:bg-gray-300 disabled:text-gray-500
                    transition-colors shadow-md"
        >
          ◀ Précédent
        </button>

        <span className="px-4 py-2 font-semibold text-rugby-gold">
          Page {currentPage} / {totalPages}
        </span>

        <button
          onClick={() => {
            setCurrentPage(p => Math.min(totalPages, p + 1));
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          disabled={currentPage === totalPages}
          className="px-4 py-2 rounded font-semibold text-white
                    bg-rugby-gold hover:bg-rugby-bronze
                    disabled:bg-gray-300 disabled:text-gray-500
                    transition-colors shadow-md"
        >
          Suivant ▶
        </button>
      </div>
    </div>
  );
}
