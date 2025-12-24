import { useState, useEffect, useRef } from "react";
import { getConfig, getStats } from "../lib/api";
import { getTeamData } from "../utils/teams";
import type { EquipeStats } from "../types/rugby";
import { useResetOnActive } from "../hooks/useResetOnActive";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function ClassementPage() {
  const [classement, setClassement] = useState<EquipeStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEquipe, setSelectedEquipe] = useState<EquipeStats | null>(null);
  const [statsDetaillees, setStatsDetaillees] = useState<any>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const detailsHeaderRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function loadClassement() {
      try {
        const data = await getClassement();
        console.log("Classement chargé:", data);
        setClassement(data.classement || []);
      } catch (e) {
        console.error("Erreur chargement classement:", e);
      } finally {
        setLoading(false);
      }
    }
    loadClassement();
  }, []);

  useEffect(() => {
    async function loadStatsDetaillees() {
      if (selectedEquipe) {
        try {
          const response = await fetch(`https://top14-api-production.up.railway.app/api/stats/detaillees?equipe=${encodeURIComponent(selectedEquipe.equipe)}`);
          const data = await response.json();
          console.log("Stats détaillées chargées pour", selectedEquipe.equipe, ":", data);
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
  }, [selectedEquipe]);

  useEffect(() => {
    if (selectedEquipe && statsDetaillees && detailsHeaderRef.current) {
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

  if (loading) {
    return <div className="p-6 text-center text-gray-500">🔄 Chargement du classement…</div>;
  }

  if (classement.length === 0) {
    return <div className="p-6 text-center text-gray-500">Aucune donnée disponible</div>;
  }

  return (
    <div className="px-2 py-4 pb-24">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold mb-2">
          <span className="text-rugby-gold">Classement</span>
          <span className="text-gray-600 text-sm ml-2">- Saison {classement[0]?.saison}</span>
        </h2>
        <p className="text-xs text-gray-500 italic">💡 Cliquez sur une équipe pour voir ses statistiques détaillées</p>
      </div>
      
      {/* Tableau classement */}
      <div className="overflow-x-auto bg-white rounded-lg shadow-sm">
        <table className="w-full">
          <thead className="bg-rugby-gold text-white">
            <tr>
              <th className="px-2 py-3 text-left text-xs font-bold uppercase">#</th>
              <th className="px-3 py-3 text-left text-xs font-bold uppercase">Équipe</th>
              <th className="px-2 py-3 text-center text-xs font-bold uppercase">Pts</th>
              <th className="px-2 py-3 text-center text-xs font-bold uppercase">MJ</th>
              <th className="px-2 py-3 text-center text-xs font-bold uppercase hidden md:table-cell">V</th>
              <th className="px-2 py-3 text-center text-xs font-bold uppercase hidden md:table-cell">N</th>
              <th className="px-2 py-3 text-center text-xs font-bold uppercase hidden md:table-cell">D</th>
              <th className="px-2 py-3 text-center text-xs font-bold uppercase hidden md:table-cell">+/-</th>
              <th className="px-2 py-3 text-center text-xs font-bold uppercase">Forme</th>
            </tr>
          </thead>
          <tbody>
            {classement.map((equipe, index) => {
              const teamData = getTeamData(equipe.equipe);
              const bgColor = index % 2 === 0 ? "bg-gray-50" : "bg-white";
              const isTop6 = equipe.rang <= 6;
              
              return (
                <tr 
                  key={equipe.equipe} 
                  className={`${bgColor} hover:bg-rugby-orange/10 cursor-pointer transition-colors ${
                    isTop6 ? 'border-l-4 border-green-500' : ''
                  }`}
                  onClick={() => setSelectedEquipe(selectedEquipe?.equipe === equipe.equipe ? null : equipe)}
                >
                  <td className="px-1 py-3 text-sm font-bold text-rugby-gold">
                    {equipe.rang}
                  </td>

                  <td className="px-1 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <img
                          src={teamData.logo}
                          alt={teamData.name}
                          className="w-6 h-6 object-contain"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-800">
                        {teamData.name}
                      </span>
                    </div>
                  </td>

                  <td className="px-2 py-3 text-center text-sm font-bold text-rugby-orange">
                    {equipe.points_classement || 0}
                  </td>

                  <td className="px-2 py-3 text-center text-sm text-gray-700">
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

                  <td className="px-2 py-3">
                    <div className="flex justify-center gap-0.5">
                      {equipe.forme && equipe.forme.length > 0 ? (
                        equipe.forme.map((resultat, i) => (
                          <div
                            key={i}
                            className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
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
    
      {/* Légende */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600">
          <span className="inline-block w-3 h-3 bg-green-500 rounded mr-1"></span>
          Les 6 premiers sont qualifiés pour les phases finales
        </p>
        <p className="text-xs text-gray-600 mt-1">
          <span className="font-semibold">Pts</span> = Points de classement (4 pts victoire + bonus)
        </p>
      </div>

      {/* Détails équipe sélectionnée */}
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
              <h3 className="text-lg font-bold text-rugby-gold">{selectedEquipe.equipe}</h3>
              <p className="text-xs text-gray-600">
                #{selectedEquipe.rang} • {selectedEquipe.points_classement} points
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-gray-50 rounded-lg p-2 text-center">
              <p className="text-[10px] text-gray-700 uppercase mb-1 font-semibold">Points marqués</p>
              <p className="text-xl font-bold text-rugby-orange">{selectedEquipe.points_pour}</p>
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
              <p className="text-[10px] text-gray-600 mt-0.5">
                {selectedEquipe.serie_en_cours || 'Aucune série'}
              </p>
            </div>

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

            {/* Section Analyse de régularité - version compacte */}
            <div className="col-span-2 md:col-span-4 bg-gradient-to-br from-blue-50 to-green-50 rounded-xl p-3 border-2 border-blue-100">
              <h4 className="text-xs font-bold text-gray-800 mb-2 flex items-center gap-2">
                <span className="text-base">📊</span>
                Analyse de régularité
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {/* Ligne 1 : Indice + Moyenne championnat */}
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

                {/* Rang régularité */}
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
          </div>
        </div>
      )}

      {/* Bouton retour en haut */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-24 right-4 z-50 bg-rugby-gold hover:bg-rugby-bronze 
                     text-white p-3 rounded-full shadow-lg transition-all duration-300
                     hover:scale-110 animate-fade-in"
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
