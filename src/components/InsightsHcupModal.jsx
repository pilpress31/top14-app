// ============================================
// INSIGHTS - CHAMPIONS CUP
// Modal affichant head-to-head + forme des 5 derniers matchs
// Source : GET /api/hcup/insights?equipe_dom=&equipe_ext=
// Couleurs : bleu EPCR #003E7E + or #FFC72C
// ============================================

import { useState, useEffect } from 'react';
import { X, Swords, TrendingUp, Trophy, Calendar, Loader2 } from 'lucide-react';
import axios from 'axios';
import { getTeamData } from '../utils/teams';

const API_BASE = 'https://api.top14pronos.fr';

const HCUP_BLEU = '#003E7E';
const HCUP_OR = '#FFC72C';

export default function InsightsHcupModal({ isOpen, onClose, equipeDom, equipeExt }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && equipeDom && equipeExt) {
      loadInsights();
    } else {
      // Reset au close
      setInsights(null);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, equipeDom, equipeExt]);

  const loadInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `${API_BASE}/api/hcup/insights?equipe_dom=${encodeURIComponent(equipeDom)}&equipe_ext=${encodeURIComponent(equipeExt)}`;
      const response = await axios.get(url);
      setInsights(response.data);
    } catch (err) {
      console.error('Erreur insights HCup:', err);
      setError('Impossible de charger les statistiques.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const teamDomData = getTeamData(equipeDom);
  const teamExtData = getTeamData(equipeExt);

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 px-4 py-3 flex items-center justify-between rounded-t-2xl"
          style={{ background: `linear-gradient(135deg, ${HCUP_BLEU} 0%, #002857 100%)` }}
        >
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5" style={{ color: HCUP_OR }} />
            <span className="text-sm font-bold uppercase tracking-wide" style={{ color: HCUP_OR }}>
              Statistiques du match
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bandeau équipes */}
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-3 items-center gap-2">
            <div className="flex flex-col items-center text-center">
              <img
                src={teamDomData.logo}
                alt={teamDomData.name}
                className="w-12 h-12 object-contain mb-1"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <span className="text-xs font-bold text-gray-800 line-clamp-2">{equipeDom}</span>
            </div>
            <div className="text-center">
              <span className="text-xs font-bold uppercase" style={{ color: HCUP_BLEU }}>VS</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <img
                src={teamExtData.logo}
                alt={teamExtData.name}
                className="w-12 h-12 object-contain mb-1"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <span className="text-xs font-bold text-gray-800 line-clamp-2">{equipeExt}</span>
            </div>
          </div>
        </div>

        {/* Contenu */}
        <div className="p-4">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: HCUP_BLEU }} />
            </div>
          )}

          {error && !loading && (
            <div className="text-center py-8">
              <p className="text-red-600 text-sm">{error}</p>
              <button
                onClick={loadInsights}
                className="mt-3 text-sm font-semibold px-4 py-2 rounded-lg border"
                style={{ borderColor: HCUP_BLEU, color: HCUP_BLEU }}
              >
                Réessayer
              </button>
            </div>
          )}

          {!loading && !error && insights && (
            <>
              {/* HEAD-TO-HEAD */}
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <Trophy className="w-4 h-4" style={{ color: HCUP_OR }} />
                  <h3 className="font-bold text-sm uppercase tracking-wide" style={{ color: HCUP_BLEU }}>
                    Confrontations directes
                  </h3>
                </div>

                {insights.h2h.nb_matchs === 0 ? (
                  <p className="text-sm text-gray-500 italic text-center py-4 bg-gray-50 rounded-lg">
                    Aucune confrontation entre ces deux équipes en Champions Cup.
                  </p>
                ) : (
                  <>
                    {/* Stats agrégées */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="bg-blue-50 rounded-lg p-2 text-center border border-blue-200">
                        <p className="text-[10px] text-blue-700">Victoires {equipeDom.split(' ')[0]}</p>
                        <p className="text-xl font-bold" style={{ color: HCUP_BLEU }}>
                          {insights.h2h.victoires_dom}
                        </p>
                      </div>
                      <div className="bg-gray-100 rounded-lg p-2 text-center border border-gray-300">
                        <p className="text-[10px] text-gray-600">Nuls</p>
                        <p className="text-xl font-bold text-gray-700">
                          {insights.h2h.nuls}
                        </p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-2 text-center border border-blue-200">
                        <p className="text-[10px] text-blue-700">Victoires {equipeExt.split(' ')[0]}</p>
                        <p className="text-xl font-bold" style={{ color: HCUP_BLEU }}>
                          {insights.h2h.victoires_ext}
                        </p>
                      </div>
                    </div>

                    {/* Moyennes */}
                    {insights.h2h.moyenne_pts_dom != null && (
                      <div className="bg-yellow-50 rounded-lg p-2 mb-3 border border-yellow-200">
                        <p className="text-[10px] text-yellow-800 mb-1">Moyenne points marqués</p>
                        <div className="flex items-center justify-between text-sm font-bold">
                          <span className="text-gray-800">{equipeDom.split(' ')[0]} : {insights.h2h.moyenne_pts_dom}</span>
                          <span className="text-gray-400">|</span>
                          <span className="text-gray-800">{equipeExt.split(' ')[0]} : {insights.h2h.moyenne_pts_ext}</span>
                        </div>
                      </div>
                    )}

                    {/* Derniers matchs */}
                    {insights.h2h.derniers_matchs && insights.h2h.derniers_matchs.length > 0 && (
                      <div>
                        <p className="text-[11px] font-semibold text-gray-600 mb-2 uppercase">
                          Dernières confrontations ({insights.h2h.nb_matchs})
                        </p>
                        <div className="space-y-1.5">
                          {insights.h2h.derniers_matchs.slice(0, 5).map((m, i) => {
                            const isDomHomeNow = m.equipe_domicile === equipeDom;
                            const ptsDomNow = isDomHomeNow ? m.score_domicile : m.score_exterieur;
                            const ptsExtNow = isDomHomeNow ? m.score_exterieur : m.score_domicile;
                            const dateStr = m.date_match ? new Date(m.date_match).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' }) : '';

                            const winnerEquipe = ptsDomNow > ptsExtNow ? equipeDom
                              : ptsExtNow > ptsDomNow ? equipeExt
                              : null;

                            return (
                              <div key={i} className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                                <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
                                  <span>{m.saison} • {m.round}</span>
                                  <span>{dateStr}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className={`text-xs font-semibold ${winnerEquipe === equipeDom ? 'text-green-700' : 'text-gray-700'}`}>
                                    {equipeDom.split(' ')[0]}
                                  </span>
                                  <span className="text-sm font-bold" style={{ color: HCUP_BLEU }}>
                                    {ptsDomNow} - {ptsExtNow}
                                  </span>
                                  <span className={`text-xs font-semibold ${winnerEquipe === equipeExt ? 'text-green-700' : 'text-gray-700'}`}>
                                    {equipeExt.split(' ')[0]}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* FORME (5 derniers matchs HCup) */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4" style={{ color: HCUP_OR }} />
                  <h3 className="font-bold text-sm uppercase tracking-wide" style={{ color: HCUP_BLEU }}>
                    Forme récente en HCup
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormeBox label={equipeDom.split(' ')[0]} forme={insights.forme_dom} />
                  <FormeBox label={equipeExt.split(' ')[0]} forme={insights.forme_ext} />
                </div>

                <p className="text-[10px] text-gray-400 italic text-center mt-3">
                  V = Victoire | N = Nul | D = Défaite (5 derniers matchs HCup)
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Composant interne : box de forme V/D/N
function FormeBox({ label, forme }) {
  const hasData = Array.isArray(forme) && forme.length > 0;

  return (
    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
      <p className="text-[11px] font-bold text-gray-700 mb-2 truncate">{label}</p>
      {hasData ? (
        <div className="flex items-center gap-1">
          {forme.map((res, i) => (
            <div
              key={i}
              className={`w-7 h-7 rounded flex items-center justify-center text-xs font-bold text-white ${
                res === 'V' ? 'bg-green-500' :
                res === 'N' ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
            >
              {res}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-gray-400 italic">Pas assez de matchs</p>
      )}
    </div>
  );
}
