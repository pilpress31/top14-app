// ============================================
// CARTE DE MATCH - VERSION OPTIMISÉE
// ============================================

import { CheckCircle, Edit, Lock, Brain } from 'lucide-react';
import { getTeamData } from '../utils/teams';
import { useNavigate } from 'react-router-dom';

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
  return hasTime
    ? "Paris fermés (< 5 min avant le match)"
    : "Paris fermés (jour du match)";
};

export default function MatchCard({ match, existingProno, onBetClick, goToMesParis }) {
  const teamDom = getTeamData(match.equipe_domicile);
  const teamExt = getTeamData(match.equipe_exterieure);
  const bettingAllowed = isBettingAllowed(match);
  const navigate = useNavigate();

  const pronoFT = existingProno?.find(p => p.bet_type === 'FT');
  const pronoMT = existingProno?.find(p => p.bet_type === 'MT');
  const hasFT = !!pronoFT;
  const hasMT = !!pronoMT;
  const pariComplet = hasFT && hasMT;
  const pariPartiel = (hasFT && !hasMT) || (!hasFT && hasMT);
  const aucunPari = !hasFT && !hasMT;

  // Scores prédits IA
  const iaFTDom = match.cotes?.score_predit_dom;
  const iaFTExt = match.cotes?.score_predit_ext;
  const iaMTDom = match.cotes?.score_predit_mt_dom;
  const iaMTExt = match.cotes?.score_predit_mt_ext;
  const hasIAFT = iaFTDom != null && iaFTExt != null;
  const hasIAMT = iaMTDom != null && iaMTExt != null;

  const matchDate = new Date(match.date_match || match.date);
  const showTime = matchDate.getHours() !== 0 || matchDate.getMinutes() !== 0;

  // ── Bloc Prono IA ───────────────────────────────────────────────
  const BlocPronoIA = ({ showFT, showMT }) => {
    if (!showFT && !showMT) return null;
    return (
      <div className="flex flex-col items-center px-3 py-2 bg-indigo-50 rounded-lg border border-indigo-200 min-w-[110px]">
        <div className="flex items-center gap-1 mb-1">
          <Brain className="w-3 h-3 text-indigo-500" />
          <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-wide">Prono IA</span>
        </div>
        {showFT && hasIAFT && (
          <span className="text-xs font-bold text-indigo-700 whitespace-nowrap">FT : {iaFTDom} - {iaFTExt}</span>
        )}
        {showMT && hasIAMT && (
          <span className="text-xs font-bold text-indigo-700 whitespace-nowrap">MT : {iaMTDom} - {iaMTExt}</span>
        )}
      </div>
    );
  };

  // ── Zone Mon pari / Mes paris ────────────────────────────────────
  const ZoneMonPari = ({ clickable }) => {
    const label = pariComplet ? 'Mes paris' : 'Mon pari';
    return (
      <div
        onClick={clickable ? () => navigate('/pronos', {
          state: { activeTab: 'mes-paris', scrollToMatchId: match.match_id }
        }) : undefined}
        className={`flex flex-col items-center px-3 py-2 bg-green-50 rounded-lg border border-green-200 min-w-[110px] ${clickable ? 'cursor-pointer hover:bg-green-100 transition-colors' : ''}`}
      >
        <div className="flex items-center gap-1 mb-1">
          <CheckCircle className="w-3 h-3 text-green-600" />
          <span className="text-[9px] font-bold text-green-600 uppercase tracking-wide">{label}</span>
        </div>
        {pronoFT && (
          <span className="text-xs font-bold text-green-700 whitespace-nowrap">
            FT : {pronoFT.score_dom ?? pronoFT.score_dom_pronos ?? '?'} - {pronoFT.score_ext ?? pronoFT.score_ext_pronos ?? '?'}
          </span>
        )}
        {pronoMT && (
          <span className="text-xs font-bold text-green-700 whitespace-nowrap">
            MT : {pronoMT.score_dom ?? pronoMT.score_dom_mt ?? '?'} - {pronoMT.score_ext ?? pronoMT.score_ext_mt ?? '?'}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="px-3 py-3 hover:bg-rugby-gold/5 transition-colors">

      {/* Date */}
      <p className="text-[10px] text-gray-500 mb-2">
        {matchDate.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
        {showTime && ` • ${matchDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`}
      </p>

      {/* Équipes + Logos */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-1">
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
            <img src={teamDom.logo} alt={teamDom.name} className="w-7 h-7 object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          </div>
          <span className="text-base font-bold text-gray-900 truncate">{teamDom.name}</span>
        </div>
        <div className="flex items-center gap-2 flex-1 justify-end">
          <span className="text-base font-bold text-gray-900 truncate">{teamExt.name}</span>
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
            <img src={teamExt.logo} alt={teamExt.name} className="w-7 h-7 object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          </div>
        </div>
      </div>

      {/* Cotes style bookmaker 1-N-2 */}
      {match.cotes && (
        <div className="flex flex-col items-center gap-1.5 mb-3">
          <div className="flex items-center gap-1.5">
            <div className="w-16" />
            <div className="w-14 text-center text-[10px] text-gray-400 font-semibold">1</div>
            <div className="w-14 text-center text-[10px] text-gray-400 font-semibold">N</div>
            <div className="w-14 text-center text-[10px] text-gray-400 font-semibold">2</div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-16 text-[10px] text-gray-400 font-semibold text-right">Temps plein</div>
            {[match.cotes.cote_domicile, match.cotes.cote_nul, match.cotes.cote_exterieur].map((cote, i) => (
              <div key={i}
                onClick={() => bettingAllowed && onBetClick(match)}
                className={`${i === 0 ? 'bg-blue-50 border-blue-200 text-blue-900' : i === 1 ? 'bg-gray-50 border-gray-300 text-gray-900' : 'bg-red-50 border-red-200 text-red-900'} border rounded w-14 py-1.5 text-center text-sm font-bold ${bettingAllowed ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
              >
                {cote?.toFixed(2)}
              </div>
            ))}
          </div>
          {match.cotes.cote_mt_domicile && (
            <div className="flex items-center gap-1.5">
              <div className="w-16 text-[10px] text-gray-400 font-semibold text-right">Mi-temps</div>
              {[match.cotes.cote_mt_domicile, match.cotes.cote_mt_nul, match.cotes.cote_mt_exterieur].map((cote, i) => (
                <div key={i}
                  onClick={() => bettingAllowed && onBetClick(match)}
                  className={`${i === 0 ? 'bg-blue-50 border-blue-200 text-blue-900' : i === 1 ? 'bg-gray-50 border-gray-300 text-gray-900' : 'bg-red-50 border-red-200 text-red-900'} border rounded w-14 py-1.5 text-center text-sm font-bold ${bettingAllowed ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                >
                  {cote?.toFixed(2)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ZONE ACTIONS ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">

        {/* Paris fermés */}
        {!bettingAllowed && (
          <>
        {/* Cas : pari(s) existant(s) → zone verte + Prono IA côte à côte centrés */}
            {(hasFT || hasMT) && (
              <div className="flex justify-center gap-3">
                <ZoneMonPari clickable={true} />
                <BlocPronoIA showFT={hasFT} showMT={hasMT} />
              </div>
            )}
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg border border-gray-300">
              <Lock className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-semibold text-gray-600">{getBlockingMessage(match)}</span>
            </div>
          </>
        )}

        {/* Paris ouverts */}
        {bettingAllowed && (
          <>
            {/* Cas : pari(s) existant(s) → zone verte + Prono IA côte à côte centrés */}
            {(hasFT || hasMT) && (
              <div className="flex justify-center gap-3">
                <ZoneMonPari clickable={false} />
                <BlocPronoIA showFT={hasFT} showMT={hasMT} />
              </div>
            )}

            {/* Cas : aucun pari → message + Prono IA dessous centré */}
            {aucunPari && (
              <div className="flex flex-col items-center gap-1.5 w-full mt-1">
                <p className="text-[11px] text-gray-400 italic text-center">
                  👆 Cliquez sur une cote pour parier
                </p>
                <BlocPronoIA showFT={true} showMT={true} />
              </div>
            )}

            {/* Bouton compléter si pari partiel */}
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

            {/* Bouton voir mes paris si pari complet */}
            {pariComplet && (
              <button
                onClick={() => navigate('/pronos', { state: { activeTab: 'mes-paris', scrollToMatchId: match.id } })}
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
}
