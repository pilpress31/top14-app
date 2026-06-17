// ============================================================
// MatchCardEcc.jsx
// Carte d'un match European Challenge Cup
// ============================================================
// Calque de MatchCardHcup.jsx, sans TeamPopup / bouton Conseil / favoris
// (non utilisés ailleurs dans le périmètre ECC). Couleurs Challenge Cup
// (vert #2E7D32 + bronze #CD7F32). Les cotes arrivent sous match.cotes
// (remappées par MesPronosEccTab depuis /api/ecc/matchs/a-venir).
// ============================================================

import { useState } from 'react';
import { CheckCircle, Lock, Brain } from 'lucide-react';
import { getTeamData } from '../utils/teams';
import { useNavigate } from 'react-router-dom';
import { getCharte } from '../constants/chartes';

const { vert: ECC_VERT, bronze: ECC_BRONZE } = getCharte('ecc').base;

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

export default function MatchCardEcc({ match, existingProno, onBetClick, goToMesParis, jouable = true }) {
  const teamDom = getTeamData(match.equipe_domicile);
  const teamExt = getTeamData(match.equipe_exterieure);
  const bettingAllowed = isBettingAllowed(match);
  const navigate = useNavigate();

  const pronoFT = existingProno?.find(p =>
    (p.bet_type === 'FT' || p.bet_type === 'WINNER_FT') && p.status !== 'cancelled'
  );

  const isWinnerBet = pronoFT?.bet_type === 'WINNER_FT';
  const hasFT = !!pronoFT;
  const aucunPari = !hasFT;

  const iaFTDom = match.cotes?.score_predit_dom;
  const iaFTExt = match.cotes?.score_predit_ext;
  const hasIAFT = iaFTDom != null && iaFTExt != null;

  const matchDate = new Date(match.date_match || match.date);
  const showTime = matchDate.getHours() !== 0 || matchDate.getMinutes() !== 0;

  const phaseBadge = match.phase || match.round;
  const isPhaseFinale = phaseBadge && !String(phaseBadge).startsWith('Poule');

  const getWinnerName = (predit) => {
    if (predit === 'DOM' || predit === 'domicile') return teamDom.name;
    if (predit === 'EXT' || predit === 'exterieur') return teamExt.name;
    if (predit === 'NUL' || predit === 'nul') return 'Match nul';
    return '?';
  };

  const BlocPronoIA = () => {
    if (!hasIAFT) return null;
    return (
      <div className="w-full flex flex-col px-3 py-2.5 rounded-lg border"
        style={{ backgroundColor: 'rgba(46, 125, 50, 0.05)', borderColor: ECC_VERT }}>
        <div className="flex items-center gap-1 mb-1.5">
          <Brain className="w-3.5 h-3.5 flex-shrink-0" style={{ color: ECC_VERT }} />
          <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: ECC_VERT }}>Prono IA</span>
        </div>
        <div className="leading-tight">
          <span className="text-[10px] font-medium" style={{ color: ECC_VERT, opacity: 0.8 }}>Score FT</span>
          <div className="text-lg font-semibold leading-none" style={{ color: ECC_VERT }}>{iaFTDom} – {iaFTExt}</div>
        </div>
        {match.cotes?.confiance_algo && (
          <span className="text-[9px] mt-1.5" style={{ color: ECC_VERT, opacity: 0.7 }}>
            Confiance {match.cotes.confiance_algo}%
          </span>
        )}
      </div>
    );
  };

  const ZoneMonPari = ({ clickable }) => {
    const ftScore = pronoFT && !isWinnerBet
      ? `${pronoFT.score_dom ?? pronoFT.score_dom_pronos ?? pronoFT.score_domicile ?? '?'} – ${pronoFT.score_ext ?? pronoFT.score_ext_pronos ?? pronoFT.score_exterieur ?? '?'}`
      : null;
    const ftWinner = pronoFT && isWinnerBet ? getWinnerName(pronoFT.winner_predit) : null;
    return (
      <div
        onClick={clickable ? () => navigate('/pronos', { state: { activeTab: 'mes-paris', scrollToMatchId: match.match_id } }) : undefined}
        className={`w-full flex flex-col px-3 py-2.5 bg-green-50 rounded-lg border border-green-200 ${clickable ? 'cursor-pointer hover:bg-green-100 transition-colors' : ''}`}
      >
        <div className="flex items-center gap-1 mb-1.5">
          <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
          <span className="text-[9px] font-bold text-green-600 uppercase tracking-wide">Mon pari</span>
        </div>
        {ftScore && (
          <div className="leading-tight">
            <span className="text-[10px] text-green-600 font-medium">Score FT</span>
            <div className="text-lg font-semibold text-green-800 leading-none">{ftScore}</div>
          </div>
        )}
        {ftWinner && (
          <div className="leading-tight">
            <span className="text-[10px] text-green-600 font-medium">Vainqueur FT</span>
            <div className="text-sm font-semibold text-green-800 leading-tight break-words">{ftWinner}</div>
          </div>
        )}
        {pronoFT && (
          <span className="text-[10px] text-green-600 mt-1.5">{pronoFT.stake} jetons @ {pronoFT.odds?.toFixed(2)}</span>
        )}
      </div>
    );
  };

  return (
    <div className="px-3 py-3 hover:bg-[rgba(46,125,50,0.04)] transition-colors">

      {/* Date + Phase */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] text-gray-500">
          {matchDate.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
          {showTime && ` • ${matchDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`}
        </p>
        {phaseBadge && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isPhaseFinale ? 'animate-pulse' : ''}`}
            style={{
              backgroundColor: isPhaseFinale ? ECC_BRONZE : 'rgba(46, 125, 50, 0.1)',
              color: isPhaseFinale ? '#FFFFFF' : ECC_VERT,
            }}>
            {isPhaseFinale && '🏆 '}{phaseBadge}
          </span>
        )}
      </div>

      {/* Équipes + Logos — grid 3 colonnes */}
      <div className="grid grid-cols-3 items-start px-1 mb-2">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-1.5 shadow-sm">
            <img src={teamDom.logo} alt={teamDom.name} className="w-14 h-14 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          </div>
          <span className="text-sm font-bold text-gray-900 leading-tight break-words line-clamp-2 uppercase">
            {teamDom.name}
          </span>
        </div>

        <div className="flex flex-col items-center justify-start pt-6 gap-0.5">
          <span className="text-xs text-gray-400 font-semibold">VS</span>
        </div>

        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-1.5 shadow-sm">
            <img src={teamExt.logo} alt={teamExt.name} className="w-14 h-14 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          </div>
          <span className="text-sm font-bold text-gray-900 leading-tight break-words line-clamp-2 uppercase">
            {teamExt.name}
          </span>
        </div>
      </div>

      {/* Cotes */}
      {match.cotes && (
        <div className="flex flex-col gap-1.5 w-full bg-slate-50 rounded-xl px-3 py-2.5 mb-3">
          <div className="grid grid-cols-[64px_1fr_1fr_1fr] gap-2 items-center">
            <div />
            <div className="text-center text-[10px] text-gray-400 font-semibold">1</div>
            <div className="text-center text-[10px] text-gray-400 font-semibold">N</div>
            <div className="text-center text-[10px] text-gray-400 font-semibold">2</div>
          </div>
          <div className="grid grid-cols-[64px_1fr_1fr_1fr] gap-2 items-center">
            <div className="text-[10px] text-gray-400 font-semibold text-right">Temps plein</div>
            {[match.cotes.cote_domicile, match.cotes.cote_nul, match.cotes.cote_exterieur].map((cote, i) => {
              const ftClickable = bettingAllowed && !hasFT && jouable;
              const winnerForClick = i === 0 ? 'DOM' : i === 1 ? 'NUL' : 'EXT';
              const preselect = { type: 'FT', choice: winnerForClick };
              const noOdds = cote == null;
              return (
                <div key={i}
                  onClick={() => ftClickable && !noOdds && onBetClick(match, preselect)}
                  className={`${i === 0 ? 'bg-blue-50 border-blue-200 text-blue-900' : i === 1 ? 'bg-gray-50 border-gray-300 text-gray-900' : 'bg-red-50 border-red-200 text-red-900'} border rounded py-1.5 text-center text-sm font-bold ${ftClickable && !noOdds ? 'cursor-pointer hover:opacity-80 transition-opacity' : 'opacity-50 cursor-not-allowed'}`}>
                  {noOdds ? '—' : cote.toFixed(2)}
                </div>
              );
            })}
          </div>
          {isPhaseFinale && (
            <p className="text-[9px] text-gray-500 italic mt-0.5 text-center">
              Pari basé sur le score à <strong>80 min</strong> (hors prolongation)
            </p>
          )}
        </div>
      )}

      {/* Zone actions */}
      <div className="flex flex-col gap-2">
        {!jouable && (
          <div className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 w-fit mx-auto">
            <Lock className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-semibold text-gray-400 text-center">Pari indisponible</span>
          </div>
        )}

        {jouable && !bettingAllowed && (
          <>
            {hasFT && (
              <div className="grid grid-cols-2 gap-2 items-stretch mb-1">
                <ZoneMonPari clickable={true} />
                <BlocPronoIA />
              </div>
            )}
            <div className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 rounded-lg border border-gray-300 w-fit mx-auto">
              <Lock className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-semibold text-gray-600">{getBlockingMessage(match)}</span>
            </div>
          </>
        )}

        {jouable && bettingAllowed && (
          <>
            {hasFT && (
              <div className="grid grid-cols-2 gap-2 items-stretch mb-1">
                <ZoneMonPari clickable={false} />
                <BlocPronoIA />
              </div>
            )}
            {aucunPari && (
              <div className="flex flex-col items-center gap-1.5 w-full mt-1">
                <p className="text-[11px] text-gray-400 italic text-center">👆 Cliquez sur une cote pour parier</p>
                <div className="w-full max-w-[180px]">
                  <BlocPronoIA />
                </div>
              </div>
            )}
            {hasFT && (
              <button
                onClick={() => navigate('/pronos', { state: { activeTab: 'mes-paris', scrollToMatchId: match.match_id } })}
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg text-sm font-semibold text-white hover:shadow-lg transition-all shadow-sm"
                style={{ backgroundColor: ECC_VERT }}
              >
                Voir mon pari en cours
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
