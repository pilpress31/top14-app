import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";

// Mapping des équipes vers leurs logos
const TEAMS_DATA = {
  'STADE TOULOUSAIN': { logo: '/logos/toulouse.svg', name: 'Toulouse' },
  'TOULOUSE': { logo: '/logos/toulouse.svg', name: 'Toulouse' },
  'UNION BORDEAUX BÈGLES': { logo: '/logos/ubb.svg', name: 'Bordeaux' },
  'BORDEAUX BÈGLES': { logo: '/logos/ubb.svg', name: 'Bordeaux' },
  'LA ROCHELLE': { logo: '/logos/la-rochelle.svg', name: 'La Rochelle' },
  'STADE ROCHELAIS': { logo: '/logos/la-rochelle.svg', name: 'La Rochelle' },
  'RACING 92': { logo: '/logos/racing92.svg', name: 'Racing 92' },
  'ASM CLERMONT': { logo: '/logos/clermont.svg', name: 'Clermont' },
  'CLERMONT AUVERGNE': { logo: '/logos/clermont.svg', name: 'Clermont' },
  'CASTRES OLYMPIQUE': { logo: '/logos/castres.svg', name: 'Castres' },
  'CASTRES': { logo: '/logos/castres.svg', name: 'Castres' },
  'US MONTAUBAN': { logo: '/logos/montauban.svg', name: 'Montauban' },
  'MONTAUBAN': { logo: '/logos/montauban.svg', name: 'Montauban' },
  'MONTPELLIER HR': { logo: '/logos/montpellier.svg', name: 'Montpellier' },
  'MONTPELLIER': { logo: '/logos/montpellier.svg', name: 'Montpellier' },
  'MONTPELLIER HÉRAULT RUGBY': { logo: '/logos/montpellier.svg', name: 'Montpellier' },
  'STADE FRANÇAIS': { logo: '/logos/paris.svg', name: 'Stade Français' },
  'STADE FRANÇAIS PARIS': { logo: '/logos/paris.svg', name: 'Stade Français' },
  'LYON': { logo: '/logos/lyon.svg', name: 'Lyon' },
  'LOU RUGBY': { logo: '/logos/lyon.svg', name: 'Lyon' },
  'LYON OU': { logo: '/logos/lyon.svg', name: 'Lyon' },
  'TOULON': { logo: '/logos/toulon.svg', name: 'Toulon' },
  'RC TOULON': { logo: '/logos/toulon.svg', name: 'Toulon' },
  'PERPIGNAN': { logo: '/logos/perpignan.svg', name: 'Perpignan' },
  'USA PERPIGNAN': { logo: '/logos/perpignan.svg', name: 'Perpignan' },
  'USAP': { logo: '/logos/perpignan.svg', name: 'Perpignan' },
  'BAYONNE': { logo: '/logos/bayonne.svg', name: 'Bayonne' },
  'AVIRON BAYONNAIS': { logo: '/logos/bayonne.svg', name: 'Bayonne' },
  'PAU': { logo: '/logos/pau.svg', name: 'Pau' },
  'SECTION PALOISE': { logo: '/logos/pau.svg', name: 'Pau' },
  'AGEN': { logo: '/logos/agen.svg', name: 'Agen' },
  'SU AGEN': { logo: '/logos/agen.svg', name: 'Agen' },
  'US DAX': { logo: '/logos/dax.svg', name: 'Dax' },
  'DAX': { logo: '/logos/dax.svg', name: 'Dax' },
  'MONT DE MARSAN': { logo: '/logos/mont-de-marsan.svg', name: 'Mont-de-Marsan' },
  'MONT-DE-MARSAN': { logo: '/logos/mont-de-marsan.svg', name: 'Mont-de-Marsan' },
  'STADE MONTOIS': { logo: '/logos/mont-de-marsan.svg', name: 'Mont-de-Marsan' },
  'BOURGOIN': { logo: '/logos/bourgoin.svg', name: 'Bourgoin-Jallieu' },
  'BOURGOIN-JALLIEU': { logo: '/logos/bourgoin.svg', name: 'Bourgoin-Jallieu' },
  'CS BOURGOIN-JALLIEU': { logo: '/logos/bourgoin.svg', name: 'Bourgoin-Jallieu' },
  'AUCH': { logo: '/logos/auch.svg', name: 'Auch' },
  'RC AUCH': { logo: '/logos/auch.svg', name: 'Auch' },
  'BRIVE': { logo: '/logos/brive.svg', name: 'Brive' },
  'CA BRIVE': { logo: '/logos/brive.svg', name: 'Brive' },
  'VANNES': { logo: '/logos/vannes.svg', name: 'Vannes' },
  'RC VANNES': { logo: '/logos/vannes.svg', name: 'Vannes' },
  'BIARRITZ': { logo: '/logos/biarritz.svg', name: 'Biarritz' },
  'BIARRITZ OLYMPIQUE': { logo: '/logos/biarritz.svg', name: 'Biarritz' },
  'COLOMIERS': { logo: '/logos/colomiers.svg', name: 'Colomiers' },
  'FC GRENOBLE': { logo: '/logos/grenoble.svg', name: 'Grenoble' },
  'OYONNAX': { logo: '/logos/oyonnax.svg', name: 'Oyonnax' },
  'NEVERS': { logo: '/logos/nevers.svg', name: 'Nevers' },
  'USON NEVERS': { logo: '/logos/nevers.svg', name: 'Nevers' },
  'CARCASSONNE': { logo: '/logos/carcassonne.svg', name: 'Carcassonne' },
  'US CARCASSONNE': { logo: '/logos/carcassonne.svg', name: 'Carcassonne' },
  'AURILLAC': { logo: '/logos/aurillac.svg', name: 'Aurillac' },
  'STADE AURILLACOIS': { logo: '/logos/aurillac.svg', name: 'Aurillac' },
  'PROVENCE': { logo: '/logos/provence.svg', name: 'Provence' },
  'PROVENCE RUGBY': { logo: '/logos/provence.svg', name: 'Provence' },
  'ROUEN': { logo: '/logos/rouen.svg', name: 'Rouen' },
  'ROUEN NORMANDIE': { logo: '/logos/rouen.svg', name: 'Rouen' },
  'SOYAUX-ANGOULÊME': { logo: '/logos/soyaux-angouleme.svg', name: 'Soyaux-Angoulême' },
  'MASSY': { logo: '/logos/massy.svg', name: 'Massy' },
  'RC MASSY': { logo: '/logos/massy.svg', name: 'Massy' },
  'VALENCE-ROMANS': { logo: '/logos/valence-romans.svg', name: 'Valence Romans' },
  'VALENCE ROMANS': { logo: '/logos/valence-romans.svg', name: 'Valence Romans' },
  'NARBONNE': { logo: '/logos/narbonne.svg', name: 'Narbonne' },
  'RC NARBONNE': { logo: '/logos/narbonne.svg', name: 'Narbonne' },
  'ALBI': { logo: '/logos/albi.svg', name: 'Albi' },
  'SC ALBI': { logo: '/logos/albi.svg', name: 'Albi' },
  'TARBES': { logo: '/logos/tarbes.svg', name: 'Tarbes' },
  'STADO TARBES': { logo: '/logos/tarbes.svg', name: 'Tarbes' }
};

function getTeamData(teamName: string) {
  const normalizedName = teamName?.toUpperCase().trim();
  return TEAMS_DATA[normalizedName as keyof typeof TEAMS_DATA] || {
    logo: '/logos/default.svg',
    name: teamName
  };
}

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
  const [selectedSaison, setSelectedSaison] = useState<string>("all");
  const [selectedJournee, setSelectedJournee] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [teamDropdownOpen, setTeamDropdownOpen] = useState(false);
  const [saisonDropdownOpen, setSaisonDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
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

  // Fermer les dropdowns au clic extérieur
  useEffect(() => {
    const handleClickOutside = () => {
      setTeamDropdownOpen(false);
      setSaisonDropdownOpen(false);
      setSortDropdownOpen(false);
    };
    if (teamDropdownOpen || saisonDropdownOpen || sortDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [teamDropdownOpen, saisonDropdownOpen, sortDropdownOpen]);

  const equipes = Array.from(
    new Set(matches.flatMap(m => [m.equipe_domicile, m.equipe_exterieure]))
  ).sort();

  const saisons = Array.from(new Set(matches.map(m => m.saison))).sort().reverse();

  const getJourneesForSaison = (saison: string) => {
    const matchesSaison = matches.filter(m => m.saison === saison);
    const journeesMap = new Map<number, string>();
    
    matchesSaison.forEach(m => {
      if (!journeesMap.has(m.journee)) {
        journeesMap.set(m.journee, m.date);
      } else {
        const existingDate = new Date(journeesMap.get(m.journee)!);
        const currentDate = new Date(m.date);
        if (currentDate < existingDate) {
          journeesMap.set(m.journee, m.date);
        }
      }
    });

    return Array.from(journeesMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([journee, date]) => ({
        journee,
        date,
        label: `J ${journee} - ${new Date(date).toLocaleDateString("fr-FR", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        })}`
      }));
  };

  let filteredMatches = matches;

  if (selectedTeam !== "all") {
    filteredMatches = filteredMatches.filter(
      m => m.equipe_domicile === selectedTeam || m.equipe_exterieure === selectedTeam
    );
  }

  if (selectedSaison !== "all") {
    filteredMatches = filteredMatches.filter(m => m.saison === selectedSaison);
  }

  if (selectedJournee !== "all") {
    filteredMatches = filteredMatches.filter(m => m.journee === parseInt(selectedJournee));
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

  const journeesOptions = selectedSaison !== "all" ? getJourneesForSaison(selectedSaison) : [];

  if (loading) {
    return <div className="p-6 text-center text-gray-600">🔄 Chargement de l'historique…</div>;
  }

  if (matches.length === 0) {
    return <div className="p-6 text-center text-gray-600">Aucun match historique disponible</div>;
  }

  return (
    <div className="space-y-4">
      <div className={`sticky bg-white z-30 pb-4 pt-2 shadow-sm border-b border-gray-200 transition-all duration-300 ${
        headerVisible ? 'top-[200px]' : 'top-[80px]'
      }`}>
        <div className="flex flex-col md:flex-row gap-4">
          {/* Sélecteur d'équipe */}
          <div className="relative flex-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setTeamDropdownOpen(!teamDropdownOpen);
                setSaisonDropdownOpen(false);
              }}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white flex items-center justify-between hover:border-rugby-gold transition-colors"
            >
              <span className="text-gray-700">
                {selectedTeam === "all" ? "Toutes les équipes" : selectedTeam}
              </span>
              <ChevronDown className={`w-4 h-4 text-rugby-gold transition-transform ${teamDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {teamDropdownOpen && (
              <div className="absolute top-full mt-1 w-full bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto z-40">
                <button
                  onClick={() => {
                    setSelectedTeam("all");
                    setTeamDropdownOpen(false);
                    setCurrentPage(1);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-rugby-gold hover:bg-opacity-10 transition-colors ${
                    selectedTeam === "all" ? "bg-rugby-gold bg-opacity-20 font-semibold" : ""
                  }`}
                >
                  Toutes les équipes
                </button>
                {equipes.map(team => (
                  <button
                    key={team}
                    onClick={() => {
                      setSelectedTeam(team);
                      setTeamDropdownOpen(false);
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-rugby-gold hover:bg-opacity-10 transition-colors ${
                      selectedTeam === team ? "bg-rugby-gold bg-opacity-20 font-semibold" : ""
                    }`}
                  >
                    {team}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sélecteur de saison/journée */}
          <div className="relative flex-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSaisonDropdownOpen(!saisonDropdownOpen);
                setTeamDropdownOpen(false);
              }}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white flex items-center justify-between hover:border-rugby-gold transition-colors"
            >
              <span className="text-gray-700">
                {selectedSaison === "all" 
                  ? "Toutes les saisons" 
                  : selectedJournee === "all"
                    ? `Saison ${selectedSaison}`
                    : `${selectedSaison} - J${selectedJournee}`
                }
              </span>
              <ChevronDown className={`w-4 h-4 text-rugby-gold transition-transform ${saisonDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {saisonDropdownOpen && (
              <div className="absolute top-full mt-1 w-full bg-white border border-gray-300 rounded shadow-lg max-h-80 overflow-y-auto z-40">
                <button
                  onClick={() => {
                    setSelectedSaison("all");
                    setSelectedJournee("all");
                    setSaisonDropdownOpen(false);
                    setCurrentPage(1);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-rugby-gold hover:bg-opacity-10 transition-colors ${
                    selectedSaison === "all" ? "bg-rugby-gold bg-opacity-20 font-semibold" : ""
                  }`}
                >
                  Toutes les saisons
                </button>
                
                {saisons.map(saison => (
                  <div key={saison}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (selectedSaison === saison) {
                          setSelectedSaison("all");
                          setSelectedJournee("all");
                        } else {
                          setSelectedSaison(saison);
                          setSelectedJournee("all");
                        }
                        setCurrentPage(1);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm font-semibold hover:bg-rugby-gold hover:bg-opacity-10 transition-colors border-t border-gray-100 ${
                        selectedSaison === saison ? "bg-rugby-gold bg-opacity-20 text-rugby-gold" : "text-gray-800"
                      }`}
                    >
                      Saison {saison}
                    </button>
                    
                    {selectedSaison === saison && (
                      <div className="bg-gray-50">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedJournee("all");
                            setSaisonDropdownOpen(false);
                            setCurrentPage(1);
                          }}
                          className={`w-full text-left px-6 py-1.5 text-xs hover:bg-rugby-gold hover:bg-opacity-10 transition-colors ${
                            selectedJournee === "all" ? "bg-rugby-gold bg-opacity-30 font-semibold" : ""
                          }`}
                        >
                          Toutes les journées
                        </button>
                        {getJourneesForSaison(saison).map(({ journee, label }) => (
                          <button
                            key={journee}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedJournee(journee.toString());
                              setSaisonDropdownOpen(false);
                              setCurrentPage(1);
                            }}
                            className={`w-full text-left px-6 py-1.5 text-xs hover:bg-rugby-gold hover:bg-opacity-10 transition-colors ${
                              selectedJournee === journee.toString() ? "bg-rugby-gold bg-opacity-30 font-semibold" : ""
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tri par date */}
          <div className="relative md:w-64">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSortDropdownOpen(!sortDropdownOpen);
                setTeamDropdownOpen(false);
                setSaisonDropdownOpen(false);
              }}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white flex items-center justify-between hover:border-rugby-gold transition-colors"
            >
              <span className="text-gray-700">
                {sortOrder === "desc" ? "Date décroissante (récent → ancien)" : "Date croissante (ancien → récent)"}
              </span>
              <ChevronDown className={`w-4 h-4 text-rugby-gold transition-transform ${sortDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {sortDropdownOpen && (
              <div className="absolute top-full mt-1 w-full bg-white border border-gray-300 rounded shadow-lg z-40">
                <button
                  onClick={() => {
                    setSortOrder("desc");
                    setSortDropdownOpen(false);
                    setCurrentPage(1);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-rugby-gold hover:bg-opacity-10 transition-colors ${
                    sortOrder === "desc" ? "bg-rugby-gold bg-opacity-20 font-semibold" : ""
                  }`}
                >
                  Date décroissante (récent → ancien)
                </button>
                <button
                  onClick={() => {
                    setSortOrder("asc");
                    setSortDropdownOpen(false);
                    setCurrentPage(1);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-rugby-gold hover:bg-opacity-10 transition-colors ${
                    sortOrder === "asc" ? "bg-rugby-gold bg-opacity-20 font-semibold" : ""
                  }`}
                >
                  Date croissante (ancien → récent)
                </button>
              </div>
            )}
          </div>
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

              <div className="grid grid-cols-3 gap-3 items-start">
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
      <div className="fixed left-0 w-full flex justify-center items-center gap-4 bg-white py-2 shadow-md z-50 bottom-[60px]">
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