import { useState, useEffect } from "react";
import { getTeamData } from "../utils/teams";
import { ChevronDown } from "lucide-react";
import { useRealtimeSync } from '../hooks/useRealtimeSync';
import { useRef } from "react"; // ← à ajouter dans l'import du haut

interface MatchHistorique {
  id: string;
  date: string;
  saison: string;
  journee: number;
  round?: string;  // 🆕 'Journée' | 'Barrage' | 'Demi' | 'Finale'
  equipe_domicile: string;
  equipe_exterieure: string;
  score_domicile: number;
  score_exterieur: number;
  score_ht_domicile?: number;
  score_ht_exterieur?: number;
  vainqueur?: string;
  prono_ft?: { domicile: number | null; exterieur: number | null; };
  prono_ht?: { domicile: number | null; exterieur: number | null; };
  prono_text?: string;
  comp_ft?: string;
  comp_ht?: string;
}

interface HistoriqueTabProps {
  headerVisible?: boolean;
  isD2?: boolean;
}

export default function HistoriqueTab({ headerVisible = true, isD2 = false }: HistoriqueTabProps) {
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
  const [totalD2, setTotalD2] = useState<number>(0);
  const [d2Page, setD2Page] = useState<number>(1);
  const [totalTop14, setTotalTop14] = useState<number>(0);
  const [t14Page, setT14Page] = useState<number>(1);
  const [saisonsD2, setSaisonsD2] = useState<string[]>([]);
  const [journeesD2, setJourneesD2] = useState<{journee: number, date_match: string, round?: string, label?: string}[]>([]);
  const [equipesD2, setEquipesD2] = useState<string[]>([]);
  // ✅ NOUVEAU : états dédiés Top 14 pour les listes complètes
  const [saisonsT14, setSaisonsT14] = useState<string[]>([]);
  const [equipesT14, setEquipesT14] = useState<string[]>([]);
  const [journeesT14, setJourneesT14] = useState<{journee: number, date_match: string, round?: string, label?: string}[]>([]);

  // ✅ Garde-fou : empêche le Realtime d'écraser les filtres au premier montage
  const initialLoadDone = useRef(false);

  const loadHistorique = async (forceIsD2?: boolean, page?: number, equipe?: string, saison?: string, journee?: string) => {
    const useD2 = forceIsD2 !== undefined ? forceIsD2 : isD2;
    try {
      let raw: any[] = [];
      if (useD2) {
        const pageNum = (page !== undefined && page !== null) ? page : 1;
        const offset = (pageNum - 1) * matchesPerPage;
        const params = new URLSearchParams({ limit: String(matchesPerPage), offset: String(offset) });
        if (equipe) params.set('equipe', equipe);
        if (saison) params.set('saison', saison);
        if (journee) params.set('journee', journee);
        const url = `https://top14-api-production.up.railway.app/api/d2/historique?${params}`;
        const response = await fetch(url);
        const data = await response.json();
        raw = data.matchs || [];
        if (data.stats?.total !== undefined) setTotalD2(data.stats.total);
      } else {
        const pageNum = (page !== undefined && page !== null) ? page : 1;
        const offset = (pageNum - 1) * matchesPerPage;
        const params = new URLSearchParams({ limit: String(matchesPerPage), offset: String(offset) });
        if (equipe) params.set('equipe', equipe);
        if (saison) params.set('saison', saison);
        if (journee) params.set('journee', journee);
        const url = `https://top14-api-production.up.railway.app/api/matchs/historique?${params}`;
        const response = await fetch(url);
        const data = await response.json();
        raw = data.matchs || [];
        if (data.total !== undefined) setTotalTop14(data.total);
      }
      const normalized: MatchHistorique[] = useD2
        ? raw.map((m: any) => ({
            ...m,
            id: m.id || m.match_id,
            date: m.date_match,
            score_domicile: m.score_reel_dom ?? 0,
            score_exterieur: m.score_reel_ext ?? 0,
            prono_ft: m.score_predit_dom != null ? { domicile: m.score_predit_dom, exterieur: m.score_predit_ext } : undefined,
            comp_ft: m.prediction_correcte === true ? 'OK' : m.prediction_correcte === false ? 'KO' : undefined,
          }))
        : raw;
      setMatches(normalized);
    } catch (e) {
      console.error("Erreur chargement historique:", e);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSaisonsD2 = async () => {
    try {
      const res = await fetch("https://top14-api-production.up.railway.app/api/d2/saisons");
      const data = await res.json();
      setSaisonsD2([...(data.saisons || [])].reverse());
      setEquipesD2(data.equipes || []);
    } catch (e) {
      console.error("Erreur saisons D2:", e);
    }
  };

  const loadJourneesD2 = async (saison: string) => {
    try {
      const res = await fetch(`https://top14-api-production.up.railway.app/api/d2/journees?saison=${saison}`);
      const data = await res.json();
      setJourneesD2(data.journees || []);
    } catch (e) {
      console.error('Erreur journées D2:', e);
    }
  };

  // ✅ NOUVEAU : chargement complet des saisons et équipes Top 14
  const loadSaisonsT14 = async () => {
    try {
      const res = await fetch("https://top14-api-production.up.railway.app/api/matchs/saisons");
      const data = await res.json();
      setSaisonsT14([...(data.saisons || [])].reverse());
      setEquipesT14(data.equipes || []);
    } catch (e) {
      console.error("Erreur saisons T14:", e);
    }
  };

  const loadJourneesT14 = async (saison: string) => {
    try {
      const res = await fetch(`https://top14-api-production.up.railway.app/api/matchs/journees?saison=${saison}`);
      const data = await res.json();
      setJourneesT14(data.journees || []);
    } catch (e) {
      console.error('Erreur journées T14:', e);
    }
  };

  // ✅ Realtime — respecte les filtres actifs ET ignore les updates avant le chargement initial
  useRealtimeSync([
    ...(isD2 ? [] : [{
      table: 'matchs_results',
      onUpdate: () => {
        if (!initialLoadDone.current) return;
        loadHistorique(
          false,
          t14Page,
          selectedTeam !== 'all' ? selectedTeam : undefined,
          selectedSaison !== 'all' ? selectedSaison : undefined,
          selectedJournee !== 'all' ? selectedJournee : undefined
        );
      }
    }]),
  ]);

  useEffect(() => {
    setLoading(true);
    setMatches([]);
    setCurrentPage(1);
    setD2Page(1);
    setT14Page(1);
    setTotalD2(0);
    setTotalTop14(0);
    setSelectedTeam('all');
    setSelectedSaison('all');
    setSelectedJournee('all');
    setJourneesD2([]);
    setJourneesT14([]);
    initialLoadDone.current = false;
    if (isD2) loadSaisonsD2();
    else loadSaisonsT14();
    loadHistorique(isD2, 1).then(() => {
      initialLoadDone.current = true;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isD2]);

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

  // ✅ FIX : utilise les listes complètes des deux championnats
  const equipes = isD2 ? equipesD2 : equipesT14;
  const saisons = isD2 ? saisonsD2 : saisonsT14;

  const getJourneesForSaison = (saison: string) => {
    const source = isD2 ? journeesD2 : journeesT14;
    return source.map(({ journee, date_match, round, label }) => {
      const isPhaseFinale = round && round !== 'Journée';
      const dateFormatted = new Date(date_match).toLocaleDateString('fr-FR', {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
      });
      return {
        journee,
        date: date_match,
        round: round || 'Journée',
        // 🆕 phases finales → label Round, journées normales → "J N - date"
        label: isPhaseFinale
          ? `${label || round} - ${dateFormatted}`
          : `J ${journee} - ${dateFormatted}`
      };
    });
  };

  // Pagination serveur — les données arrivent déjà filtrées
  let filteredMatches = matches;

  filteredMatches = filteredMatches.sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
  });

  const totalPages = isD2
    ? Math.max(1, Math.ceil(totalD2 / matchesPerPage))
    : Math.max(1, Math.ceil(totalTop14 / matchesPerPage));
  const paginatedMatches = filteredMatches;

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
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white flex items-center justify-between transition-colors" style={isD2 ? { borderColor: '#97C1FE' } : {}}
            >
              <span className="text-gray-700">
                {selectedTeam === "all" ? "Toutes les équipes" : selectedTeam}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${teamDropdownOpen ? 'rotate-180' : ''}`} style={isD2 ? { color: '#97C1FE' } : { color: '#CBA135' }} />
            </button>
            
            {teamDropdownOpen && (
              <div className="absolute top-full mt-1 w-full bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto z-40">
                <button
                  onClick={() => {
                    setSelectedTeam("all");
                    setTeamDropdownOpen(false);
                    setCurrentPage(1);
                    setD2Page(1);
                    setT14Page(1);
                    setLoading(true);
                    loadHistorique(isD2, 1, undefined, selectedSaison !== 'all' ? selectedSaison : undefined, selectedJournee !== 'all' ? selectedJournee : undefined);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-opacity-10 transition-colors ${
                    selectedTeam === "all" ? (isD2 ? "font-semibold" : "bg-rugby-gold bg-opacity-20 font-semibold") : ""
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
                      setD2Page(1);
                      setT14Page(1);
                      setLoading(true);
                      loadHistorique(isD2, 1, team, selectedSaison !== 'all' ? selectedSaison : undefined, selectedJournee !== 'all' ? selectedJournee : undefined);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-opacity-10 transition-colors ${
                      selectedTeam === team ? (isD2 ? "font-semibold" : "bg-rugby-gold bg-opacity-20 font-semibold") : ""
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
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white flex items-center justify-between transition-colors" style={isD2 ? { borderColor: '#97C1FE' } : {}}
            >
              <span className="text-gray-700">
                {selectedSaison === "all" 
                  ? "Toutes les saisons" 
                  : selectedJournee === "all"
                    ? `Saison ${selectedSaison}`
                    // 🆕 Si phase finale, afficher le label Round, sinon J{num}
                    : ['Barrage', 'Demi', 'Finale'].includes(selectedJournee)
                      ? `${selectedSaison} - ${selectedJournee}`
                      : `${selectedSaison} - J${selectedJournee}`
                }
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${saisonDropdownOpen ? 'rotate-180' : ''}`} style={isD2 ? { color: '#97C1FE' } : { color: '#CBA135' }} />
            </button>
            
            {saisonDropdownOpen && (
              <div className="absolute top-full mt-1 w-full bg-white border border-gray-300 rounded shadow-lg max-h-80 overflow-y-auto z-40">
                <button
                  onClick={() => {
                    setSelectedSaison("all");
                    setSelectedJournee("all");
                    setSaisonDropdownOpen(false);
                    setCurrentPage(1);
                    setD2Page(1);
                    setT14Page(1);
                    setLoading(true);
                    loadHistorique(isD2, 1, selectedTeam !== 'all' ? selectedTeam : undefined, undefined);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-opacity-10 transition-colors ${
                    selectedSaison === "all" ? (isD2 ? "font-semibold" : "bg-rugby-gold bg-opacity-20 font-semibold") : ""
                  }`}
                >
                  Toutes les saisons
                </button>
                
                {saisons.map(saison => (
                  <div key={saison}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const newSaison = selectedSaison === saison ? "all" : saison;
                        setSelectedSaison(newSaison);
                        setSelectedJournee("all");
                        setCurrentPage(1);
                        setD2Page(1);
                        setT14Page(1);
                        // ✅ FIX : charge les journées dans les deux championnats
                        if (isD2 && newSaison !== 'all') loadJourneesD2(newSaison);
                        else if (isD2) setJourneesD2([]);
                        else if (!isD2 && newSaison !== 'all') loadJourneesT14(newSaison);
                        else setJourneesT14([]);
                        setLoading(true);
                        loadHistorique(isD2, 1, selectedTeam !== 'all' ? selectedTeam : undefined, newSaison !== 'all' ? newSaison : undefined);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm font-semibold hover:bg-opacity-10 transition-colors border-t border-gray-100 ${
                        selectedSaison === saison ? (isD2 ? "text-[#97C1FE] font-semibold" : "bg-rugby-gold bg-opacity-20 text-rugby-gold") : "text-gray-800"
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
                            setD2Page(1);
                            setT14Page(1);
                            setLoading(true);
                            loadHistorique(isD2, 1, selectedTeam !== 'all' ? selectedTeam : undefined, saison);
                          }}
                          className={`w-full text-left px-6 py-1.5 text-xs hover:bg-opacity-10 transition-colors ${
                            selectedJournee === "all" ? (isD2 ? "font-semibold" : "bg-rugby-gold bg-opacity-30 font-semibold") : ""
                          }`}
                        >
                          Toutes les journées
                        </button>
                        {journeesOptions.map(({ journee, label, round }) => {
                          // 🆕 Pour les phases finales, on filtre par round (texte), pas par numéro de journée
                          const isPhaseFinale = round && round !== 'Journée';
                          const filterValue = isPhaseFinale ? round! : String(journee);
                          return (
                          <button
                            key={filterValue}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedJournee(filterValue);
                              setSaisonDropdownOpen(false);
                              setCurrentPage(1);
                              setD2Page(1);
                              setT14Page(1);
                              setLoading(true);
                              loadHistorique(isD2, 1, selectedTeam !== 'all' ? selectedTeam : undefined, saison, filterValue);
                            }}
                            className={`w-full text-left px-6 py-1.5 text-xs hover:bg-opacity-10 transition-colors ${
                              selectedJournee === filterValue ? (isD2 ? "font-semibold" : "bg-rugby-gold bg-opacity-30 font-semibold") : ""
                            } ${isPhaseFinale ? "italic text-rugby-gold" : ""}`}
                          >
                            {label}
                          </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sélecteur de tri */}
          <div className="relative flex-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSortDropdownOpen(!sortDropdownOpen);
                setTeamDropdownOpen(false);
                setSaisonDropdownOpen(false);
              }}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white flex items-center justify-between transition-colors" style={isD2 ? { borderColor: '#97C1FE' } : {}}
            >
              <span className="text-gray-700">
                {sortOrder === "desc" ? "Plus récents d'abord" : "Plus anciens d'abord"}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${sortDropdownOpen ? 'rotate-180' : ''}`} style={isD2 ? { color: '#97C1FE' } : { color: '#CBA135' }} />
            </button>
            {sortDropdownOpen && (
              <div className="absolute top-full mt-1 w-full bg-white border border-gray-300 rounded shadow-lg z-40">
                <button
                  onClick={() => { setSortOrder("desc"); setSortDropdownOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-sm ${sortOrder === "desc" ? (isD2 ? "font-semibold" : "bg-rugby-gold bg-opacity-20 font-semibold") : ""}`}
                >
                  Plus récents d'abord
                </button>
                <button
                  onClick={() => { setSortOrder("asc"); setSortDropdownOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-sm ${sortOrder === "asc" ? (isD2 ? "font-semibold" : "bg-rugby-gold bg-opacity-20 font-semibold") : ""}`}
                >
                  Plus anciens d'abord
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Liste des matchs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 px-2 pb-32">
        {paginatedMatches.map(m => {
          const teamDomData = getTeamData(m.equipe_domicile);
          const teamExtData = getTeamData(m.equipe_exterieure);
          const pronoOK = m.comp_ft && (m.comp_ft.includes('OK') || m.comp_ft === 'OK');
          const ecartDom = m.prono_ft?.domicile != null ? m.score_domicile - m.prono_ft.domicile : null;
          const ecartExt = m.prono_ft?.exterieur != null ? m.score_exterieur - m.prono_ft.exterieur! : null;

          return (
            <div key={m.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-3">
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] font-bold uppercase tracking-wider" style={isD2 ? { color: '#97C1FE' } : { color: '#CBA135' }}>
                  Saison {m.saison} · {m.round && m.round !== 'Journée' ? (
                    <span style={{color: '#DC2626'}}>{m.round}</span>
                  ) : `J${m.journee}`}
                </div>
                <div className="text-[10px] text-gray-400">
                  {new Date(m.date).toLocaleDateString("fr-FR", {
                    day: "numeric", month: "short", year: "numeric"
                  })}
                </div>
              </div>

              {/* Équipes */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 flex-1">
                  <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <img src={teamDomData.logo} alt={teamDomData.name} className="w-7 h-7 object-contain"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  </div>
                  <span className="text-xs font-semibold text-gray-800 leading-tight line-clamp-2">{m.equipe_domicile}</span>
                </div>
                <span className="text-[10px] font-bold text-gray-400 px-2 flex-shrink-0">VS</span>
                <div className="flex items-center gap-2 flex-1 justify-end">
                  <span className="text-xs font-semibold text-gray-800 leading-tight line-clamp-2 text-right">{m.equipe_exterieure}</span>
                  <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <img src={teamExtData.logo} alt={teamExtData.name} className="w-7 h-7 object-contain"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  </div>
                </div>
              </div>

              {/* Grille scores */}
              <div className="border border-gray-100 rounded-lg overflow-hidden">
                
                {/* Header grille */}
                <div className="grid grid-cols-4 bg-gray-50 border-b border-gray-100">
                  <div className="px-2 py-1 text-[10px] text-gray-400 font-semibold"></div>
                  <div className="px-2 py-1 text-[10px] text-gray-400 font-semibold text-center">Réel</div>
                  <div className="px-2 py-1 text-[10px] text-gray-400 font-semibold text-center">Prédit</div>
                  <div className="px-2 py-1 text-[10px] text-gray-400 font-semibold text-center">Résultat</div>
                </div>

                {/* Ligne Temps plein */}
                <div className="grid grid-cols-4 items-center border-b border-gray-100">
                  <div className="px-2 py-2 text-[10px] text-gray-500 font-semibold">Temps plein</div>
                  <div className="px-2 py-2 text-center font-bold text-sm" style={isD2 ? { color: '#C0C0C0' } : { color: '#f97316' }}>
                    {m.score_domicile} - {m.score_exterieur}
                  </div>
                  <div className="px-2 py-2 text-center text-sm text-gray-500">
                    {m.prono_ft?.domicile !== null && m.prono_ft?.domicile !== undefined
                      ? `${m.prono_ft.domicile} - ${m.prono_ft.exterieur}`
                      : '—'}
                  </div>
                  <div className="px-2 py-2 flex flex-col items-center gap-0.5">
                    {m.prono_ft?.domicile !== null && m.prono_ft?.domicile !== undefined ? (
                      <>
                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${pronoOK ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {pronoOK ? '✓ OK' : '✗ KO'}
                        </span>
                        {ecartDom !== null && (
                          <span className="text-[9px] text-gray-400">
                            {ecartDom > 0 ? `+${ecartDom}` : ecartDom}/{ecartExt! > 0 ? `+${ecartExt}` : ecartExt}
                          </span>
                        )}
                      </>
                    ) : <span className="text-gray-300">—</span>}
                  </div>
                </div>

                {/* Ligne Mi-temps */}
                {m.score_ht_domicile !== undefined && m.score_ht_domicile !== null && (
                  <div className="grid grid-cols-4 items-center">
                    <div className="px-2 py-2 text-[10px] text-gray-500 font-semibold">Mi-temps</div>
                    <div className="px-2 py-2 text-center font-bold text-rugby-bronze text-sm">
                      {m.score_ht_domicile} - {m.score_ht_exterieur}
                    </div>
                    <div className="px-2 py-2 text-center text-sm text-gray-500">
                      {m.prono_ht?.domicile !== null && m.prono_ht?.domicile !== undefined
                        ? `${m.prono_ht.domicile} - ${m.prono_ht.exterieur}`
                        : '—'}
                    </div>
                    <div className="px-2 py-2 flex flex-col items-center gap-0.5">
                      {m.prono_ht?.domicile !== null && m.prono_ht?.domicile !== undefined ? (
                        <>
                          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                            m.comp_ht && (m.comp_ht.includes('OK') || m.comp_ht === 'OK')
                              ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {m.comp_ht && (m.comp_ht.includes('OK') || m.comp_ht === 'OK') ? '✓ OK' : '✗ KO'}
                          </span>
                          <span className="text-[9px] text-gray-400">
                            {m.score_ht_domicile - m.prono_ht.domicile! > 0
                              ? `+${m.score_ht_domicile - m.prono_ht.domicile!}`
                              : m.score_ht_domicile - m.prono_ht.domicile!}/{m.score_ht_exterieur! - m.prono_ht.exterieur! > 0
                              ? `+${m.score_ht_exterieur! - m.prono_ht.exterieur!}`
                              : m.score_ht_exterieur! - m.prono_ht.exterieur!}
                          </span>
                        </>
                      ) : <span className="text-gray-300">—</span>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      <div className="fixed left-0 w-full flex justify-center items-center gap-4 py-2 shadow-md z-50 bottom-[60px]" style={isD2 ? { backgroundColor: '#00174D', borderTop: '1px solid rgba(192,192,192,0.3)' } : { backgroundColor: '#FFFFFF' }}>
        <button
          onClick={() => {
            if (isD2) {
              const newPage = Math.max(1, d2Page - 1);
              setD2Page(newPage);
              setLoading(true);
              loadHistorique(true, newPage,
                selectedTeam !== 'all' ? selectedTeam : undefined,
                selectedSaison !== 'all' ? selectedSaison : undefined,
                selectedJournee !== 'all' ? selectedJournee : undefined);
            } else {
              const newPage = Math.max(1, t14Page - 1);
              setT14Page(newPage);
              setCurrentPage(newPage);
              setLoading(true);
              loadHistorique(false, newPage,
                selectedTeam !== 'all' ? selectedTeam : undefined,
                selectedSaison !== 'all' ? selectedSaison : undefined,
                selectedJournee !== 'all' ? selectedJournee : undefined);
            }
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          disabled={isD2 ? d2Page === 1 : t14Page === 1}
          className="px-4 py-2 rounded font-semibold transition-colors shadow-md"
          style={isD2
            ? { backgroundColor: '#00174D', color: '#C0C0C0', border: '1px solid #C0C0C0' }
            : { backgroundColor: '#CBA135', color: '#FFFFFF' }}
        >
          ◀ Précédent
        </button>

        <span className="px-4 py-2 font-semibold" style={isD2 ? { color: '#C0C0C0' } : { color: '#CBA135' }}>
          Page {isD2 ? d2Page : t14Page} / {totalPages}
        </span>

        <button
          onClick={() => {
            if (isD2) {
              const newPage = Math.min(totalPages, d2Page + 1);
              setD2Page(newPage);
              setLoading(true);
              loadHistorique(true, newPage,
                selectedTeam !== 'all' ? selectedTeam : undefined,
                selectedSaison !== 'all' ? selectedSaison : undefined,
                selectedJournee !== 'all' ? selectedJournee : undefined);
            } else {
              const newPage = Math.min(totalPages, t14Page + 1);
              setT14Page(newPage);
              setCurrentPage(newPage);
              setLoading(true);
              loadHistorique(false, newPage,
                selectedTeam !== 'all' ? selectedTeam : undefined,
                selectedSaison !== 'all' ? selectedSaison : undefined,
                selectedJournee !== 'all' ? selectedJournee : undefined);
            }
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          disabled={isD2 ? d2Page === totalPages : t14Page === totalPages}
          className="px-4 py-2 rounded font-semibold transition-colors shadow-md"
          style={isD2
            ? { backgroundColor: '#C0C0C0', color: '#00174D', fontWeight: 700 }
            : { backgroundColor: '#CBA135', color: '#FFFFFF' }}
        >
          Suivant ▶
        </button>
      </div>
    </div>
  );
}