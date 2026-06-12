import { useState, useEffect, useRef, useCallback } from "react";
import { getClassement } from "../lib/api";
import { getTeamData } from "../utils/teams";
import type { EquipeStats } from "../types/rugby";
import ClassementHcupTabs from "../components/ClassementHcupTabs";
import ClassementTop14Tabs from "../components/ClassementTop14Tabs";
import ClassementD2Tabs from "../components/ClassementD2Tabs";
import ClassementMonde from "../components/ClassementMonde";


const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

type Championnat = 'top14' | 'prod2' | 'hcup' | 'monde';

function ClassementPage() {
  const [championnat, setChampionnat] = useState<Championnat>('top14');
  const [classement, setClassement] = useState<EquipeStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEquipe, setSelectedEquipe] = useState<EquipeStats | null>(null);
  const [statsDetaillees, setStatsDetaillees] = useState<any>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const detailsHeaderRef = useRef<HTMLDivElement | null>(null);

  const isD2 = championnat === 'prod2';
  const isHcup = championnat === 'hcup';
  const isMonde = championnat === 'monde';

  // Couleurs adaptées selon championnat
  const themeColors = {
    primary: isHcup ? 'text-hcup-blue' : isD2 ? 'text-d2-navy' : 'text-rugby-gold',
    primaryBg: isHcup ? 'bg-hcup-blue' : isD2 ? 'bg-d2-navy' : 'bg-rugby-gold',
    primaryBgHover: isHcup ? 'hover:bg-hcup-blue-dark' : isD2 ? 'hover:bg-d2-navy-dark' : 'hover:bg-rugby-bronze',
    secondaryText: isHcup ? 'text-hcup-gold' : isD2 ? 'text-d2-navy-dark' : 'text-rugby-bronze',
    rowHover: isHcup ? 'hover:bg-hcup-blue/10' : isD2 ? 'hover:bg-d2-navy/10' : 'hover:bg-rugby-gold/10',
  };

  const loadClassement = useCallback(async () => {
    // 🆕 HCup / MONDE : gérés par des composants dédiés (fetch propre)
    if (championnat === 'hcup' || championnat === 'monde') {
      setClassement([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      if (championnat === 'top14') {
        const data = await getClassement();
        setClassement(data.classement || []);
      } else {
        // Charger le classement Pro D2 depuis le nouvel endpoint
        const response = await fetch(`${API_URL}/d2/classement-officiel`);
        const data = await response.json();
        if (data.success && data.classement) {
          // Adapter le format pour qu'il matche EquipeStats
          const adapted = data.classement.map((eq: any) => ({
            rang: eq.rang,
            equipe: eq.equipe,
            saison: '2025-2026',
            points_classement: eq.points_classement,
            matchs_joues: eq.matchs_joues,
            victoires: eq.victoires,
            nuls: eq.nuls,
            defaites: eq.defaites,
            points_pour: eq.points_pour,
            points_contre: eq.points_contre,
            differentiel: eq.difference,
            forme: eq.forme || [],
            points_moy_pour: eq.points_moy_pour,
            points_moy_contre: eq.points_moy_contre,
            taux_victoires: eq.taux_victoires,
            bonus: eq.bonus,
            pct_victoires_domicile: null,
            pct_victoires_exterieur: null,
            serie_en_cours: null,
          }));
          setClassement(adapted);
        } else {
          setClassement([]);
        }
      }
    } catch (e) {
      console.error(`Erreur chargement classement ${championnat}:`, e);
      setClassement([]);
    } finally {
      setLoading(false);
    }
  }, [championnat]);

  useEffect(() => {
    loadClassement();
    setSelectedEquipe(null); // reset sélection au changement de championnat
    setStatsDetaillees(null);
  }, [loadClassement]);

  useEffect(() => {
    async function loadStatsDetaillees() {
      // Les stats détaillées ne sont disponibles que pour le Top 14
      if (selectedEquipe && !isD2) {
        try {
          const response = await fetch(
            `https://top14-api-production.up.railway.app/api/stats/detaillees?equipe=${encodeURIComponent(selectedEquipe.equipe)}`
          );
          const data = await response.json();
          setStatsDetaillees(data);
        } catch (e) {
          console.error("Erreur chargement stats détaillées:", e);
          setStatsDetaillees(null);
        }
      } else {
        setStatsDetaillees(null);
      }
    }
    loadStatsDetaillees();
  }, [selectedEquipe, isD2]);

  useEffect(() => {
    if (selectedEquipe && detailsHeaderRef.current) {
      setTimeout(() => {
        const headerOffset = 100;
        const elementPosition = detailsHeaderRef.current!.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
      }, 100);
    }
  }, [selectedEquipe, statsDetaillees]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.pageYOffset > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="pt-1 pb-24">
      {/* ═══════════════════════════════════════════════════════
          TOGGLE Top 14 / Pro D2 / Champions Cup
          ═══════════════════════════════════════════════════════ */}
      <div className="pb-2">
        <div className="flex items-center gap-1 rounded-full bg-white/5 p-1">
          {([
            { key: 'top14', emoji: '🏆', label: 'TOP 14', accent: '#CBA135' },
            { key: 'prod2', emoji: '🥈', label: 'PRO D2', accent: '#C0C0C0' },
            { key: 'hcup',  emoji: '⭐', label: 'C.CUP',  accent: '#FFC72C' },
            { key: 'monde', emoji: '🌍', label: 'MONDE',  accent: '#34D399' },
          ] as const).map((c) => {
            const isActive = championnat === c.key;
            return (
              <button
                key={c.key}
                onClick={() => setChampionnat(c.key)}
                aria-label={`Passer à ${c.label}`}
                className="flex-1 flex items-center justify-center gap-1 rounded-full px-2 py-1.5 text-[11px] font-bold uppercase tracking-wide transition-all"
                style={isActive ? { backgroundColor: c.accent, color: '#0c1322' } : { color: '#94a3b8' }}
              >
                <span style={{ fontSize: '12px', lineHeight: 1 }}>{c.emoji}</span>
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          MODE C.CUP : on rend un composant dédié
          (4 pools × 6 équipes, scraping RugbyPass via /api/hcup/classement-officiel)
          → on s'arrête ici, le reste de la page (titre + tableau Top14/Pro D2)
            n'est pas pertinent dans ce mode.
          ═══════════════════════════════════════════════════════ */}
      {isHcup && <ClassementHcupTabs />}

      {isMonde && <ClassementMonde />}

      {!isHcup && !isD2 && !isMonde && (
        <ClassementTop14Tabs>
      {/* Titre */}
      {(
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold mb-2 whitespace-nowrap">
          <span className={themeColors.primary}>
            Classement Top 14
          </span>
          {classement[0]?.saison && (
            <span className="text-slate-400 text-sm ml-2">{classement[0].saison}</span>
          )}
        </h2>
        <p className="text-xs text-slate-400 italic">
          💡 Cliquez sur une équipe pour voir ses statistiques détaillées
        </p>
      </div>
      )}

      {!isHcup && !isD2 && (loading ? (
        <div className="p-6 text-center text-slate-400">🔄 Chargement du classement…</div>
      ) : classement.length === 0 ? (
        <div className="p-6 text-center text-slate-400">Aucune donnée disponible</div>
      ) : (
        <>
          {/* ═══════════════════════════════════════════════════════
              MENTION ROTATION (mobile uniquement)
              ═══════════════════════════════════════════════════════ */}
          <p className="md:hidden text-[11px] text-slate-400 italic text-center mb-2">
            🔄 Tournez l'écran pour voir toutes les colonnes
          </p>

          {/* ═══════════════════════════════════════════════════════
              TABLEAU DU CLASSEMENT
              ═══════════════════════════════════════════════════════ */}
          <div className="overflow-x-auto bg-white rounded-lg shadow-sm">
            <table className="w-full">
              <thead className={`${themeColors.primaryBg} text-white`}>
                <tr>
                  <th className="px-2 py-3 text-left text-xs font-bold uppercase">#</th>
                  <th className="px-3 py-3 text-left text-xs font-bold uppercase">Équipe</th>
                  <th className="px-2 py-3 text-center text-xs font-bold uppercase">Pts</th>
                  <th className="px-2 py-3 text-center text-xs font-bold uppercase">MJ</th>
                  <th className="px-2 py-3 text-center text-xs font-bold uppercase hidden md:table-cell">V</th>
                  <th className="px-2 py-3 text-center text-xs font-bold uppercase hidden md:table-cell">N</th>
                  <th className="px-2 py-3 text-center text-xs font-bold uppercase hidden md:table-cell">D</th>
                  <th className="px-2 py-3 text-center text-xs font-bold uppercase hidden md:table-cell">+/-</th>
                  <th className={`${isD2 ? 'px-1' : 'px-2'} py-3 text-center text-xs font-bold uppercase`}>Forme</th>
                </tr>
              </thead>
              <tbody>
                {classement.map((equipe, index) => {
                  const teamData = getTeamData(equipe.equipe);
                  const bgColor = index % 2 === 0 ? "bg-gray-50" : "bg-white";
                  const isTop6 = equipe.rang <= 6;
                  // Spécifique Pro D2 : le 16ème est relégué, le 15ème fait l'access match
                  const isRelegation = isD2 && equipe.rang === 16;
                  const isAccessMatch = isD2 && equipe.rang === 15;
                  
                  return (
                    <tr 
                      key={equipe.equipe} 
                      className={`${bgColor} ${themeColors.rowHover} cursor-pointer transition-colors ${
                        isTop6 ? 'border-l-4 border-green-500' : 
                        isRelegation ? 'border-l-4 border-red-500' :
                        isAccessMatch ? 'border-l-4 border-orange-500' : ''
                      }`}
                      onClick={() => setSelectedEquipe(selectedEquipe?.equipe === equipe.equipe ? null : equipe)}
                    >
                      <td className={`${isD2 ? 'px-1' : 'px-1'} py-3 text-sm font-bold ${themeColors.primary}`}>
                        {equipe.rang}
                      </td>

                      <td className={`${isD2 ? 'px-1' : 'px-1'} py-3`}>
                        <div className={`flex items-center ${isD2 ? 'gap-1' : 'gap-2'}`}>
                          <div className={`${isD2 ? 'w-6 h-6' : 'w-8 h-8'} bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0`}>
                            <img
                              src={teamData.logo}
                              alt={teamData.name}
                              className={`${isD2 ? 'w-5 h-5' : 'w-6 h-6'} object-contain`}
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          </div>
                          <span className={`${isD2 ? 'text-xs' : 'text-sm'} font-semibold text-gray-800 leading-tight`}>
                            {teamData.name}
                          </span>
                        </div>
                      </td>

                      <td className={`${isD2 ? 'px-1' : 'px-2'} py-3 text-center text-sm font-bold ${themeColors.secondaryText}`}>
                        {equipe.points_classement || 0}
                      </td>

                      <td className={`${isD2 ? 'px-1' : 'px-2'} py-3 text-center text-sm text-gray-700`}>
                        {equipe.matchs_joues}
                      </td>

                      <td className="px-2 py-3 text-center text-sm font-semibold text-green-600 hidden md:table-cell">
                        {equipe.victoires}
                      </td>

                      <td className="px-2 py-3 text-center text-sm text-gray-600 hidden md:table-cell">
                        {equipe.nuls}
                      </td>

                      <td className="px-2 py-3 text-center text-sm font-semibold text-red-600 hidden md:table-cell">
                        {equipe.defaites}
                      </td>

                      <td className={`px-2 py-3 text-center text-sm font-bold hidden md:table-cell ${
                        (equipe.differentiel || 0) > 0 ? 'text-green-600' : 
                        (equipe.differentiel || 0) < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {(equipe.differentiel || 0) > 0 ? '+' : ''}{equipe.differentiel || 0}
                      </td>

                      <td className={`${isD2 ? 'px-1' : 'px-2'} py-3`}>
                        <div className="flex justify-center gap-0.5">
                          {equipe.forme && equipe.forme.length > 0 ? (
                            equipe.forme.map((resultat, i) => (
                              <div
                                key={i}
                                className={`${isD2 ? 'w-3.5 h-3.5' : 'w-4 h-4'} rounded-full flex items-center justify-center text-[9px] font-bold text-white ${
                                  resultat === 'V' ? 'bg-green-500' :
                                  resultat === 'D' ? 'bg-red-500' :
                                  'bg-gray-400'
                                }`}
                                title={resultat === 'V' ? 'Victoire' : resultat === 'D' ? 'Défaite' : 'Nul'}
                              >
                                {resultat}
                              </div>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ═══════════════════════════════════════════════════════
              LÉGENDE
              ═══════════════════════════════════════════════════════ */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">
              <span className="inline-block w-3 h-3 bg-green-500 rounded mr-1"></span>
              Les 6 premiers sont qualifiés pour les phases finales
            </p>
            {isD2 && (
              <>
                <p className="text-xs text-gray-600 mt-1">
                  <span className="inline-block w-3 h-3 bg-orange-500 rounded mr-1"></span>
                  15ème : Access match contre le finaliste de Nationale
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  <span className="inline-block w-3 h-3 bg-red-500 rounded mr-1"></span>
                  16ème : Relégué directement en Nationale
                </p>
              </>
            )}
            <p className="text-xs text-gray-600 mt-1">
              <span className="font-semibold">Pts</span> = Points de classement (4 pts victoire + bonus)
            </p>
            {isD2 && (
              <p className="text-xs text-slate-400 italic mt-1">
                Source : <a href="https://prod2.lnr.fr/classement" target="_blank" rel="noopener noreferrer" className="underline hover:text-d2-navy">LNR Pro D2</a>
              </p>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════
              DÉTAILS ÉQUIPE SÉLECTIONNÉE
              ═══════════════════════════════════════════════════════ */}
          {selectedEquipe && (
            <div className="mt-4 bg-white rounded-lg shadow-md p-4 animate-fade-in">
              <div ref={detailsHeaderRef} className="flex items-center gap-3 mb-3">
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
                  <img
                    src={getTeamData(selectedEquipe.equipe).logo}
                    alt={selectedEquipe.equipe}
                    className="w-11 h-11 object-contain"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${themeColors.primary}`}>
                    {selectedEquipe.equipe}
                  </h3>
                  <p className="text-xs text-gray-600">
                    #{selectedEquipe.rang} • {selectedEquipe.points_classement} points
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <p className="text-[10px] text-gray-700 uppercase mb-1 font-semibold">Points marqués</p>
                  <p className={`text-xl font-bold ${themeColors.secondaryText}`}>
                    {selectedEquipe.points_pour}
                  </p>
                  <p className="text-[10px] text-gray-600 mt-0.5">
                    Moy: {selectedEquipe.points_moy_pour?.toFixed(1)}/match
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <p className="text-[10px] text-gray-700 uppercase mb-1 font-semibold">Points encaissés</p>
                  <p className="text-xl font-bold text-gray-700">{selectedEquipe.points_contre}</p>
                  <p className="text-[10px] text-gray-600 mt-0.5">
                    Moy: {selectedEquipe.points_moy_contre?.toFixed(1)}/match
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <p className="text-[10px] text-gray-700 uppercase mb-1 font-semibold">Bilan</p>
                  <p className="text-sm font-semibold text-gray-800">
                    <span className="text-green-600">{selectedEquipe.victoires}V</span> - 
                    <span className="text-gray-500">{selectedEquipe.nuls}N</span> - 
                    <span className="text-red-600">{selectedEquipe.defaites}D</span>
                  </p>
                  <p className="text-[10px] text-gray-600 mt-0.5">
                    Taux: {selectedEquipe.taux_victoires ? `${(selectedEquipe.taux_victoires * 100).toFixed(0)}%` : '-'}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <p className="text-[10px] text-gray-700 uppercase mb-1 font-semibold">Différentiel</p>
                  <p className={`text-xl font-bold ${
                    (selectedEquipe.differentiel || 0) > 0 ? 'text-green-600' :
                    (selectedEquipe.differentiel || 0) < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {(selectedEquipe.differentiel || 0) > 0 ? '+' : ''}{selectedEquipe.differentiel || 0}
                  </p>
                  {!isD2 && selectedEquipe.serie_en_cours && (
                    <p className="text-[10px] text-gray-600 mt-0.5">
                      {selectedEquipe.serie_en_cours}
                    </p>
                  )}
                  {isD2 && (
                    <p className="text-[10px] text-gray-600 mt-0.5">
                      Bonus : {(selectedEquipe as any).bonus || 0}
                    </p>
                  )}
                </div>

                {/* Performance domicile/extérieur - Top 14 uniquement */}
                {!isD2 && (
                  <div className="bg-gray-50 rounded-lg p-2 text-center col-span-2">
                    <p className="text-[10px] text-gray-700 uppercase mb-1 font-semibold">Performance domicile/extérieur</p>
                    <div className="flex justify-around mt-1">
                      <div>
                        <p className="text-[10px] text-gray-600">Domicile</p>
                        <p className="text-base font-bold text-green-600">
                          {selectedEquipe.pct_victoires_domicile ? `${(selectedEquipe.pct_victoires_domicile * 100).toFixed(0)}%` : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-600">Extérieur</p>
                        <p className="text-base font-bold text-blue-600">
                          {selectedEquipe.pct_victoires_exterieur ? `${(selectedEquipe.pct_victoires_exterieur * 100).toFixed(0)}%` : '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Section Analyse de régularité - Top 14 uniquement */}
                {!isD2 && (
                  <div className="col-span-2 md:col-span-4 bg-gradient-to-br from-blue-50 to-green-50 rounded-xl p-3 border-2 border-blue-100">
                    <h4 className="text-xs font-bold text-gray-800 mb-2 flex items-center gap-2">
                      <span className="text-base">📊</span>
                      Analyse de régularité
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div className="md:col-span-2 grid grid-cols-2 gap-2">
                        <div className="bg-white rounded-lg p-2 text-center shadow-sm">
                          <p className="text-[10px] text-gray-700 uppercase mb-1 font-semibold">Indice de régularité</p>
                          {statsDetaillees && statsDetaillees.regularite !== undefined && statsDetaillees.regularite > 0 ? (
                            <>
                              <p className="text-xl font-bold text-rugby-gold">
                                {statsDetaillees.regularite.toFixed(1)}
                              </p>
                              <p className="text-[9px] text-gray-600 mt-0.5">Écart-type performances</p>
                            </>
                          ) : (
                            <>
                              <p className="text-xl font-bold text-gray-400">
                                {statsDetaillees ? statsDetaillees.regularite?.toFixed(1) || 'N/A' : '...'}
                              </p>
                              <p className="text-[9px] text-gray-600 mt-0.5">
                                {statsDetaillees ? 'Données insuffisantes' : 'Chargement...'}
                              </p>
                            </>
                          )}
                        </div>

                        {statsDetaillees && statsDetaillees.moyenne_championnat_regularite !== undefined && (
                          <div className="bg-white rounded-lg p-2 text-center shadow-sm">
                            <p className="text-[10px] text-gray-700 uppercase mb-1 font-semibold">Moy. championnat</p>
                            <p className="text-xl font-bold text-blue-600">
                              {statsDetaillees.moyenne_championnat_regularite.toFixed(1)}
                            </p>
                            <p className="text-[9px] text-gray-600 mt-0.5">
                              Indice moyen Top 14
                            </p>
                          </div>
                        )}
                      </div>

                      {statsDetaillees && statsDetaillees.rang_regularite !== undefined && (
                        <div className="bg-white rounded-lg p-2 text-center shadow-sm">
                          <p className="text-[10px] text-gray-700 uppercase mb-1 font-semibold">Rang régularité</p>
                          <p className="text-xl font-bold text-green-600">
                            {statsDetaillees.rang_regularite || 0}/{statsDetaillees.total_equipes_top14 || 14}
                          </p>
                          <p className="text-[9px] text-gray-600 mt-0.5">
                            1 = le plus régulier
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-[9px] text-gray-600 mt-2 text-center italic">
                      Plus l'indice est faible, plus l'équipe est régulière. Valeur élevée = performances variables.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      ))}

        </ClassementTop14Tabs>
      )}

      {/* ═══════════════════════════════════════════════════════
          MODE PRO D2
          ═══════════════════════════════════════════════════════ */}
      {isD2 && (
        <ClassementD2Tabs>
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold mb-2 whitespace-nowrap">
              <span style={{ color: '#C0C0C0' }}>Classement Pro D2</span>
              {classement[0]?.saison && (
                <span className="text-slate-400 text-sm ml-2">{classement[0].saison}</span>
              )}
            </h2>
            <p className="text-xs text-slate-400 italic">
              💡 Cliquez sur une équipe pour voir ses statistiques détaillées
            </p>
          </div>

          {loading ? (
            <div className="p-6 text-center text-slate-400">🔄 Chargement du classement…</div>
          ) : classement.length === 0 ? (
            <div className="p-6 text-center text-slate-400">
              Classement Pro D2 indisponible pour le moment. Réessayez dans quelques instants.
            </div>
          ) : (
            <>
              <p className="md:hidden text-[11px] text-slate-400 italic text-center mb-2">
                🔄 Tournez l'écran pour voir toutes les colonnes
              </p>
              <div className="overflow-x-auto bg-white rounded-lg shadow-sm">
                <table className="w-full">
                  <thead className={`${themeColors.primaryBg} text-white`}>
                    <tr>
                      <th className="px-1 py-3 text-left text-xs font-bold uppercase">#</th>
                      <th className="px-1 py-3 text-left text-xs font-bold uppercase">Équipe</th>
                      <th className="px-1 py-3 text-center text-xs font-bold uppercase">Pts</th>
                      <th className="px-1 py-3 text-center text-xs font-bold uppercase">MJ</th>
                      <th className="px-2 py-3 text-center text-xs font-bold uppercase hidden md:table-cell">V</th>
                      <th className="px-2 py-3 text-center text-xs font-bold uppercase hidden md:table-cell">N</th>
                      <th className="px-2 py-3 text-center text-xs font-bold uppercase hidden md:table-cell">D</th>
                      <th className="px-2 py-3 text-center text-xs font-bold uppercase hidden md:table-cell">+/-</th>
                      <th className="px-1 py-3 text-center text-xs font-bold uppercase">Forme</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classement.map((equipe, index) => {
                      const teamData = getTeamData(equipe.equipe);
                      const bgColor = index % 2 === 0 ? "bg-gray-50" : "bg-white";
                      const isTop6 = equipe.rang <= 6;
                      const isRelegation = equipe.rang === 16;
                      const isAccessMatch = equipe.rang === 15;
                      return (
                        <tr
                          key={equipe.equipe}
                          className={`${bgColor} ${themeColors.rowHover} cursor-pointer transition-colors ${
                            isTop6 ? 'border-l-4 border-green-500' :
                            isRelegation ? 'border-l-4 border-red-500' :
                            isAccessMatch ? 'border-l-4 border-orange-500' : ''
                          }`}
                          onClick={() => setSelectedEquipe(selectedEquipe?.equipe === equipe.equipe ? null : equipe)}
                        >
                          <td className="px-1 py-3 text-sm font-bold" style={{ color: '#00174D' }}>{equipe.rang}</td>
                          <td className="px-1 py-3">
                            <div className="flex items-center gap-1">
                              <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <img src={teamData.logo} alt={teamData.name} className="w-5 h-5 object-contain"
                                  onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                              </div>
                              <span className="text-xs font-semibold text-gray-800 leading-tight">{teamData.name}</span>
                            </div>
                          </td>
                          <td className="px-1 py-3 text-center text-sm font-bold" style={{ color: '#002A7D' }}>{equipe.points_classement || 0}</td>
                          <td className="px-1 py-3 text-center text-sm text-gray-700">{equipe.matchs_joues}</td>
                          <td className="px-2 py-3 text-center text-sm font-semibold text-green-600 hidden md:table-cell">{equipe.victoires}</td>
                          <td className="px-2 py-3 text-center text-sm text-gray-600 hidden md:table-cell">{equipe.nuls}</td>
                          <td className="px-2 py-3 text-center text-sm font-semibold text-red-600 hidden md:table-cell">{equipe.defaites}</td>
                          <td className={`px-2 py-3 text-center text-sm font-bold hidden md:table-cell ${
                            (equipe.differentiel || 0) > 0 ? 'text-green-600' :
                            (equipe.differentiel || 0) < 0 ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {(equipe.differentiel || 0) > 0 ? '+' : ''}{equipe.differentiel || 0}
                          </td>
                          <td className="px-1 py-3">
                            <div className="flex justify-center gap-0.5">
                              {equipe.forme && equipe.forme.length > 0 ? (
                                equipe.forme.map((resultat, i) => (
                                  <div key={i} className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${
                                    resultat === 'V' ? 'bg-green-500' : resultat === 'D' ? 'bg-red-500' : 'bg-gray-400'
                                  }`}>{resultat}</div>
                                ))
                              ) : <span className="text-xs text-gray-400">-</span>}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">
                  <span className="inline-block w-3 h-3 bg-green-500 rounded mr-1"></span>
                  Les 6 premiers sont qualifiés pour les phases finales
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  <span className="inline-block w-3 h-3 bg-orange-500 rounded mr-1"></span>
                  15ème : Access match contre le finaliste de Nationale
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  <span className="inline-block w-3 h-3 bg-red-500 rounded mr-1"></span>
                  16ème : Relégation en Nationale
                </p>
              </div>

              {selectedEquipe && (
                <div ref={detailsHeaderRef} className="mt-4 bg-white rounded-xl shadow-md p-4 border-2" style={{ borderColor: '#00174D' }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <img src={getTeamData(selectedEquipe.equipe).logo} alt={selectedEquipe.equipe}
                        className="w-11 h-11 object-contain"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold" style={{ color: '#00174D' }}>{selectedEquipe.equipe}</h3>
                      <p className="text-xs text-gray-600">#{selectedEquipe.rang} • {selectedEquipe.points_classement} points</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-[10px] text-gray-700 uppercase mb-1 font-semibold">Points marqués</p>
                      <p className="text-xl font-bold" style={{ color: '#002A7D' }}>{selectedEquipe.points_pour}</p>
                      <p className="text-[10px] text-gray-600 mt-0.5">Moy: {selectedEquipe.points_moy_pour?.toFixed(1)}/match</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-[10px] text-gray-700 uppercase mb-1 font-semibold">Points encaissés</p>
                      <p className="text-xl font-bold text-gray-700">{selectedEquipe.points_contre}</p>
                      <p className="text-[10px] text-gray-600 mt-0.5">Moy: {selectedEquipe.points_moy_contre?.toFixed(1)}/match</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-[10px] text-gray-700 uppercase mb-1 font-semibold">Bilan</p>
                      <p className="text-sm font-semibold text-gray-800">
                        <span className="text-green-600">{selectedEquipe.victoires}V</span> -
                        <span className="text-gray-500">{selectedEquipe.nuls}N</span> -
                        <span className="text-red-600">{selectedEquipe.defaites}D</span>
                      </p>
                      <p className="text-[10px] text-gray-600 mt-0.5">
                        Taux: {selectedEquipe.taux_victoires ? `${(selectedEquipe.taux_victoires * 100).toFixed(0)}%` : '-'}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-[10px] text-gray-700 uppercase mb-1 font-semibold">Différentiel</p>
                      <p className={`text-xl font-bold ${
                        (selectedEquipe.differentiel || 0) > 0 ? 'text-green-600' :
                        (selectedEquipe.differentiel || 0) < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {(selectedEquipe.differentiel || 0) > 0 ? '+' : ''}{selectedEquipe.differentiel || 0}
                      </p>
                      <p className="text-[10px] text-gray-600 mt-0.5">
                        Bonus : {(selectedEquipe as any).bonus || 0}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </ClassementD2Tabs>
      )}

      {/* Bouton retour en haut */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className={`fixed bottom-24 right-4 z-50 ${themeColors.primaryBg} ${themeColors.primaryBgHover}
                     text-white p-3 rounded-full shadow-lg transition-all duration-300
                     hover:scale-110 animate-fade-in`}
          aria-label="Remonter en haut"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default ClassementPage;
