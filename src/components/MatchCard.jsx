// ============================================
// CARTE DE MATCH - VERSION OPTIMISÉE
// ============================================

import React, { forwardRef } from "react";
import { CheckCircle, Plus, Edit, Lock } from 'lucide-react';
import { getTeamData } from '../utils/teams';
import { useNavigate } from 'react-router-dom';


// Fonction : Vérifier si le pari est autorisé
const isBettingAllowed = (match) => {
  const matchDate = new Date(match.date_match || match.date);
  const now = new Date();
  
  const hasTime = matchDate.getHours() !== 0 || matchDate.getMinutes() !== 0;
  
  if (hasTime) {
    const fiveMinBefore = new Date(matchDate.getTime() - 5 * 60 * 1000);
    return now < fiveMinBefore;
  } else {
    const midnightMatchDay = new Date(matchDate);
    midnightMatchDay.setHours(0, 0, 0, 0);
    return now < midnightMatchDay;
  }
};

const getBlockingMessage = (match) => {
  const matchDate = new Date(match.date_match || match.date);
  const hasTime = matchDate.getHours() !== 0 || matchDate.getMinutes() !== 0;
  
  if (hasTime) {
    return "Paris fermés (< 5 min avant le match)";
  } else {
    return "Paris fermés (jour du match)";
  }
};

// ⭐ VERSION CORRIGÉE AVEC forwardRef
const MatchCard = forwardRef(function MatchCard(
  { match, existingProno, onBetClick, goToMesParis },
  ref
) {
  const teamDom = getTeamData(match.equipe_domicile);
  const teamExt = getTeamData(match.equipe_exterieure);
  const bettingAllowed = isBettingAllowed(match);

  const hasFT = existingProno?.mise_ft > 0;
  const hasMT = existingProno?.mise_mt > 0;
  const pariComplet = hasFT && hasMT;
  const pariPartiel = (hasFT && !hasMT) || (!hasFT && hasMT);
  const aucunPari = !hasFT && !hasMT;

  const matchDate = new Date(match.date_match || match.date);
  const showTime = matchDate.getHours() !== 0 || matchDate.getMinutes() !== 0;
  const navigate = useNavigate();

  return (
    <div ref={ref} className="px-3 py-3 hover:bg-rugby-gold/5 transition-colors">

      {/* Date */}
      <p className="text-[10px] text-gray-500 mb-2">
        {matchDate.toLocaleDateString('fr-FR', {
          weekday: 'short',
          day: 'numeric',
          month: 'short'
        })}
        {showTime && ` • ${matchDate.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit'
        })}`}
      </p>

      {/* Équipes + Logos */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-1">
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
            <img
              src={teamDom.logo}
              alt={teamDom.name}
              className="w-7 h-7 object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
          <span className="text-base font-bold text-gray-900 truncate">
            {teamDom.name}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-1 justify-end">
          <span className="text-base font-bold text-gray-900 truncate">
            {teamExt.name}
          </span>
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
            <img
              src={teamExt.logo}
              alt={teamExt.name}
              className="w-7 h-7 object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
        </div>
      </div>

      {/* Cotes style bookmaker 1-N-2 */}
      {match.cotes && (
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="flex items-center gap-1.5">
            <div className="bg-blue-50 border border-blue-200 rounded px-3 py-1.5">
              <div className="text-[10px] text-blue-600 font-semibold mb-0.5">1</div>
              <div className="text-sm font-bold text-blue-900">
                {match.cotes.cote_domicile?.toFixed(2)}
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-300 rounded px-3 py-1.5">
              <div className="text-[10px] text-gray-600 font-semibold mb-0.5">N</div>
              <div className="text-sm font-bold text-gray-900">
                {match.cotes.cote_nul?.toFixed(2)}
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded px-3 py-1.5">
              <div className="text-[10px] text-red-600 font-semibold mb-0.5">2</div>
              <div className="text-sm font-bold text-red-900">
                {match.cotes.cote_exterieur?.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className={`w-full flex flex-col items-center gap-2 ${
        existingProno ? 'sm:flex-row sm:justify-between sm:items-center' : ''
      }`}>

        {/* Bloc vert des pronos existants */}
        {existingProno && (
          !bettingAllowed ? (
            <div 
              onClick={() => {
                navigate('/pronos', { 
                  state: { 
                    activeTab: 'mes-paris',
                    scrollToMatchId: match.id
                  } 
                });
              }}
              className="cursor-pointer flex items-center gap-2 px-2 py-1 bg-green-50 rounded border border-green-200 hover:bg-green-100 transition-colors"
            >
              <CheckCircle className="w-3 h-3 text-green-600" />
              <div className="flex flex-col text-xs font-bold text-green-700 whitespace-nowrap">
                {existingProno.score_dom_pronos !== null && existingProno.score_ext_pronos !== null && (
                  <span>
                    Prono FT : {existingProno.score_dom_pronos} - {existingProno.score_ext_pronos} | Mise : {existingProno.mise_ft}
                  </span>
                )}
                {existingProno.score_dom_mt !== null && existingProno.score_ext_mt !== null && (
                  <span>
                    Prono MT : {existingProno.score_dom_mt} - {existingProno.score_ext_mt} | Mise : {existingProno.mise_mt}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-2 py-1 bg-green-50 rounded border border-green-200">
              <CheckCircle className="w-3 h-3 text-green-600" />
              <div className="flex flex-col text-xs font-bold text-green-700 whitespace-nowrap">
                {existingProno.score_dom_pronos !== null && existingProno.score_ext_pronos !== null && (
                  <span>
                    Prono FT : {existingProno.score_dom_pronos} - {existingProno.score_ext_pronos} | Mise : {existingProno.mise_ft}
                  </span>
                )}
                {existingProno.score_dom_mt !== null && existingProno.score_ext_mt !== null && (
                  <span>
                    Prono MT : {existingProno.score_dom_mt} - {existingProno.score_ext_mt} | Mise : {existingProno.mise_mt}
                  </span>
                )}
              </div>
            </div>
          )
        )}

        {/* Bouton d'action */}
        {!bettingAllowed ? (
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg border border-gray-300">
            <Lock className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-semibold text-gray-600">
              {getBlockingMessage(match)}
            </span>
          </div>
        ) : (
          <>
            {aucunPari && (
              <button
                onClick={() => onBetClick(match)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold
                          bg-rugby-gold text-white hover:bg-rugby-gold/80 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Parier</span>
              </button>
            )}

            {pariPartiel && (
              <button
                onClick={() => onBetClick(match)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold
                          bg-rugby-bronze text-white hover:bg-rugby-bronze/80 transition-colors shadow-sm"
              >
                <Edit className="w-4 h-4" />
                <span>Compléter mon pari</span>
              </button>
            )}

            {pariComplet && (
              <button
                onClick={() => {
                  navigate('/pronos', { 
                    state: { 
                      activeTab: 'mes-paris',
                      scrollToMatchId: match.id
                    }
                  });
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold
                          bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200 transition-colors shadow-sm"
              >
                Voir mes paris en cours
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
});

export default MatchCard;
