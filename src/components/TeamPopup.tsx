// ============================================
// COMPOSANT : Popup fiche équipe
// Réutilisable depuis AlgoPronosTab et MatchCard
// ============================================

import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { getTeamData } from '../utils/teams';

const API_URL = 'https://top14-api-production.up.railway.app/api';

interface TeamPopupProps {
  equipeNom: string;
  equipeStats?: any; // stats saison en cours (optionnel, depuis classement)
  onClose: () => void;
}

export default function TeamPopup({ equipeNom, equipeStats, onClose }: TeamPopupProps) {
  const [statsDetaillees, setStatsDetaillees] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const overlayRef = useRef<HTMLDivElement>(null);

  const teamData = getTeamData(equipeNom);

  // Charger les stats détaillées
  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/stats/detaillees?equipe=${encodeURIComponent(equipeNom)}`);
        const data = await response.json();
        setStatsDetaillees(data);
      } catch (e) {
        console.error('Erreur stats détaillées:', e);
        setStatsDetaillees(null);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [equipeNom]);

  // Fermer au clic en dehors
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  // Fermer avec Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Bloquer le scroll du body
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
    >
      <div className="bg-white w-full max-w-lg h-[90vh] flex flex-col rounded-t-2xl shadow-2xl">

        {/* Header sticky */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <img
                src={teamData.logo}
                alt={teamData.name}
                className="w-8 h-8 object-contain"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
            <div>
              <h3 className="text-base font-bold text-rugby-gold leading-tight">{teamData.name}</h3>
              {equipeStats && (
                <p className="text-xs text-gray-500">
                  #{equipeStats.rang} • {equipeStats.points_classement} pts
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto p-4">

          {loading && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rugby-gold" />
            </div>
          )}

          {!loading && (
            <>
              {/* Stats saison en cours */}
              {equipeStats && (
                <div className="mb-4">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Saison en cours</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-[10px] text-gray-500 uppercase mb-1 font-semibold">Points marqués</p>
                      <p className="text-xl font-bold text-rugby-gold">{equipeStats.points_pour}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Moy: {equipeStats.points_moy_pour?.toFixed(1)}/match</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-[10px] text-gray-500 uppercase mb-1 font-semibold">Points encaissés</p>
                      <p className="text-xl font-bold text-gray-700">{equipeStats.points_contre}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Moy: {equipeStats.points_moy_contre?.toFixed(1)}/match</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-[10px] text-gray-500 uppercase mb-1 font-semibold">Bilan</p>
                      <p className="text-sm font-semibold">
                        <span className="text-green-600">{equipeStats.victoires}V</span>
                        <span className="text-gray-400"> - </span>
                        <span className="text-gray-500">{equipeStats.nuls}N</span>
                        <span className="text-gray-400"> - </span>
                        <span className="text-red-600">{equipeStats.defaites}D</span>
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        Taux: {equipeStats.taux_victoires ? `${(equipeStats.taux_victoires * 100).toFixed(0)}%` : '-'}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-[10px] text-gray-500 uppercase mb-1 font-semibold">Différentiel</p>
                      <p className={`text-xl font-bold ${
                        (equipeStats.differentiel || 0) > 0 ? 'text-green-600' :
                        (equipeStats.differentiel || 0) < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {(equipeStats.differentiel || 0) > 0 ? '+' : ''}{equipeStats.differentiel || 0}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{equipeStats.serie_en_cours || '-'}</p>
                    </div>

                    {/* Dom / Ext */}
                    <div className="bg-gray-50 rounded-lg p-2 text-center col-span-2">
                      <p className="text-[10px] text-gray-500 uppercase mb-1 font-semibold">Performance domicile / extérieur</p>
                      <div className="flex justify-around mt-1">
                        <div>
                          <p className="text-[10px] text-gray-500">Domicile</p>
                          <p className="text-base font-bold text-green-600">
                            {equipeStats.pct_victoires_domicile ? `${(equipeStats.pct_victoires_domicile * 100).toFixed(0)}%` : '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500">Extérieur</p>
                          <p className="text-base font-bold text-blue-600">
                            {equipeStats.pct_victoires_exterieur ? `${(equipeStats.pct_victoires_exterieur * 100).toFixed(0)}%` : '-'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Forme */}
                    {equipeStats.forme && equipeStats.forme.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-2 col-span-2">
                        <p className="text-[10px] text-gray-500 uppercase mb-2 font-semibold">Forme récente</p>
                        <div className="flex justify-center gap-1.5">
                          {equipeStats.forme.map((r: string, i: number) => (
                            <div key={i} className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                              r === 'V' ? 'bg-green-500' : r === 'D' ? 'bg-red-500' : 'bg-gray-400'
                            }`}>
                              {r}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Analyse de régularité (stats historiques) */}
              {statsDetaillees && (
                <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-xl p-3 border border-blue-100">
                  <h4 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">
                    <span>📊</span> Analyse de régularité (historique)
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white rounded-lg p-2 text-center shadow-sm">
                      <p className="text-[10px] text-gray-500 uppercase mb-1 font-semibold">Indice</p>
                      <p className="text-lg font-bold text-rugby-gold">
                        {statsDetaillees.regularite > 0 ? statsDetaillees.regularite.toFixed(1) : 'N/A'}
                      </p>
                      <p className="text-[9px] text-gray-500 mt-0.5">Écart-type</p>
                    </div>
                    {statsDetaillees.moyenne_championnat_regularite !== undefined && (
                      <div className="bg-white rounded-lg p-2 text-center shadow-sm">
                        <p className="text-[10px] text-gray-500 uppercase mb-1 font-semibold">Moy. champ.</p>
                        <p className="text-lg font-bold text-blue-600">
                          {statsDetaillees.moyenne_championnat_regularite.toFixed(1)}
                        </p>
                        <p className="text-[9px] text-gray-500 mt-0.5">Top 14</p>
                      </div>
                    )}
                    {statsDetaillees.rang_regularite !== undefined && (
                      <div className="bg-white rounded-lg p-2 text-center shadow-sm">
                        <p className="text-[10px] text-gray-500 uppercase mb-1 font-semibold">Rang</p>
                        <p className="text-lg font-bold text-green-600">
                          {statsDetaillees.rang_regularite}/{statsDetaillees.total_equipes_top14 || 14}
                        </p>
                        <p className="text-[9px] text-gray-500 mt-0.5">1 = + régulier</p>
                      </div>
                    )}
                  </div>
                  <p className="text-[9px] text-gray-500 mt-2 text-center italic">
                    Plus l'indice est faible, plus l'équipe est régulière.
                  </p>
                </div>
              )}

              {!statsDetaillees && !equipeStats && (
                <p className="text-center text-gray-400 text-sm py-4">Aucune donnée disponible</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
