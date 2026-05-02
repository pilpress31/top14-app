// ============================================================
// MatchCardHcup.jsx
// Carte d'un match Champions Cup
// ============================================================
// Différences avec MatchCard.jsx (Top14/D2) :
// - Couleurs HCup : bleu EPCR #003E7E + or #FFC72C
// - winner_predit en MAJUSCULES côté backend (DOM/EXT/NUL)
// - Pas de mi-temps (FT uniquement, comme D2)
// - Affiche la phase / le round (Poule J1, Demi-finale, etc.)
// ============================================================

import { useState } from 'react';
import { CheckCircle, Edit, Lock, Brain, Trophy } from 'lucide-react';
import { getTeamData } from '../utils/teams';
import { useNavigate } from 'react-router-dom';
import TeamPopup from './TeamPopup';

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

// Couleurs HCup
const HCUP_BLUE = '#003E7E';
const HCUP_GOLD = '#FFC72C';

export default function MatchCardHcup({ match, existingProno, onBetClick, goToMesParis, jouable = true }) {
  const teamDom = getTeamData(match.equipe_domicile);
  const teamExt = getTeamData(match.equipe_exterieure);
  const bettingAllowed = isBettingAllowed(match);
  const navigate = useNavigate();
  const [teamPopup, setTeamPopup] = useState(null);

  // 🆕 HCup : 1 seul pari par match (FT ou WINNER_FT)
  const pronoFT = existingProno?.find(p =>
    (p.bet_type === 'FT' || p.bet_type === 'WINNER_FT') && p.status !== 'cancelled'
  );

  const isWinnerBet = pronoFT?.bet_type === 'WINNER_FT';
  const hasFT = !!pronoFT;
  const aucunPari = !hasFT;

  // Scores prédits IA
  const iaFTDom = match.cotes?.score_predit_dom;
  const iaFTExt = match.cotes?.score_predit_ext;
  const hasIAFT = iaFTDom != null && iaFTExt != null;

  const matchDate = new Date(match.date_match || match.date);
  const showTime = matchDate.getHours() !== 0 || matchDate.getMinutes() !== 0;

  // Helper : convertir 'DOM'/'EXT'/'NUL' en nom d'équipe (si pari WINNER_FT)
  const getWinnerName = (predit) => {
    if (predit === 'DOM' || predit === 'domicile') return teamDom.name;
    if (predit === 'EXT' || predit === 'exterieur') return teamExt.name;
    if (predit === 'NUL' || predit === 'nul') return 'Match nul';
    return '?';
  };

  // ── Bloc Prono IA ───────────────────────────────────────────────
  const BlocPronoIA = () => {
    if (!hasIAFT) return null;
    return (
      <div
        className="flex flex-col items-center px-3 py-2 rounded-lg border min-w-[110px]"
        style={{
          backgroundColor: 'rgba(0, 62, 126, 0.05)',
          borderColor: HCUP_BLUE,
        }}
      >
        <div className="flex items-center gap-1 mb-1">
          <Brain className="w-3 h-3" style={{ color: HCUP_BLUE }} />
          <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: HCUP_BLUE }}>
            Prono IA
          </span>
        </div>
        <span className="text-xs font-bold whitespace-nowrap" style={{ color: HCUP_BLUE }}>
          FT : {iaFTDom} - {iaFTExt}
        </span>
        {match.cotes?.confiance_algo && (
          <span className="text-[9px] mt-0.5" style={{ color: HCUP_BLUE, opacity: 0.7 }}>
            Confiance {match.cotes.confiance_algo}%
          </span>
        )}
      </div>
    );
  };

  // ── Zone Mon pari ────────────────────────────────────────────────
  const ZoneMonPari = ({ clickable }) => {
    return (
      <div
        onClick={clickable ? () => navigate('/pronos', {
          state: { activeTab: 'mes-paris', scrollToMatchId: match.match_id }
        }) : undefined}
        className={`flex flex-col items-center px-3 py-2 bg-green-50 rounded-lg border border-green-200 min-w-[110px] ${clickable ? 'cursor-pointer hover:bg-green-100 transition-colors' : ''}`}
      >
        <div className="flex items-center gap-1 mb-1">
          <CheckCircle className="w-3 h-3 text-green-600" />
          <span className="text-[9px] font-bold text-green-600 uppercase tracking-wide">Mon pari</span>
        </div>
        {pronoFT && !isWinnerBet && (
          <span className="text-xs font-bold text-green-700 whitespace-nowrap">
            FT : {pronoFT.score_dom ?? pronoFT.score_dom_pronos ?? pronoFT.score_domicile ?? '?'}
            {' - '}
            {pronoFT.score_ext ?? pronoFT.score_ext_pronos ?? pronoFT.score_exterieur ?? '?'}
          </span>
        )}
        {pronoFT && isWinnerBet && (
          <span className="text-xs font-bold text-green-700 whitespace-nowrap">
            🎯 {getWinnerName(pronoFT.winner_predit)}
          </span>
        )}
        {pronoFT && (
          <span className="text-[9px] text-green-600 mt-0.5">
            {pronoFT.stake} jetons @ {pronoFT.odds?.toFixed(2)}
          </span>
        )}
      </div>
    );
  };

  // Hover color HCup
  const hoverColor = 'hover:bg-[rgba(0,62,126,0.04)]';

  // Badge phase/round
  const isPhaseFinale = match.phase === 'Phase finale';
  const phaseBadge = match.round || match.phase;

  return (
    <div className={`px-3 py-3 ${hoverColor} transition-colors`}>

      {/* Date + Phase */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] text-gray-500">
          {matchDate.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
          {showTime && ` • ${matchDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`}
        </p>
        {phaseBadge && (
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isPhaseFinale ? 'animate-pulse' : ''}`}
            style={{
              backgroundColor: isPhaseFinale ? HCUP_GOLD : 'rgba(0, 62, 126, 0.1)',
              color: isPhaseFinale ? HCUP_BLUE : HCUP_BLUE,
            }}
          >
            {isPhaseFinale && '🏆 '}{phaseBadge}
          </span>
        )}
      </div>

      {/* Équipes + Logos — cliquables */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <button
          onClick={() => setTeamPopup(match.equipe_domicile)}
          className="flex items-center gap-2 flex-1 hover:opacity-75 transition-opacity"
        >
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
            <img src={teamDom.logo} alt={teamDom.name} className="w-7 h-7 object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          </div>
          <span className="text-base font-bold text-gray-900 truncate underline decoration-dotted underline-offset-2">
            {teamDom.name}
          </span>
        </button>
        <button
          onClick={() => setTeamPopup(match.equipe_exterieure)}
          className="flex items-center gap-2 flex-1 justify-end hover:opacity-75 transition-opacity"
        >
          <span className="text-base font-bold text-gray-900 truncate underline decoration-dotted underline-offset-2">
            {teamExt.name}
          </span>
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
            <img src={teamExt.logo} alt={teamExt.name} className="w-7 h-7 object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          </div>
        </button>
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

          {/* Ligne Temps plein */}
          <div className="flex items-center gap-1.5">
            <div className="w-16 text-[10px] text-gray-400 font-semibold text-right">Temps plein</div>
            {[match.cotes.cote_domicile, match.cotes.cote_nul, match.cotes.cote_exterieur].map((cote, i) => {
              const ftClickable = bettingAllowed && !hasFT && jouable;
              const winnerForClick = i === 0 ? 'DOM' : i === 1 ? 'NUL' : 'EXT';
              // 🆕 HCup : objet avec type FT (comme Top14)
              const preselect = { type: 'FT', choice: winnerForClick };
              const noOdds = cote == null;
              return (
                <div key={i}
                  onClick={() => ftClickable && !noOdds && onBetClick(match, preselect)}
                  className={`${
                    i === 0 ? 'bg-blue-50 border-blue-200 text-blue-900'
                    : i === 1 ? 'bg-gray-50 border-gray-300 text-gray-900'
                    : 'bg-red-50 border-red-200 text-red-900'
                  } border rounded w-14 py-1.5 text-center text-sm font-bold ${
                    ftClickable && !noOdds
                      ? 'cursor-pointer hover:opacity-80 transition-opacity'
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                >
                  {noOdds ? '—' : cote.toFixed(2)}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── ZONE ACTIONS ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">

        {/* Match non jouable (jamais bloqué pour HCup, mais on garde l'API au cas où) */}
        {!jouable && (
          <div className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 w-fit mx-auto">
            <Lock className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-semibold text-gray-400 text-center">
              Pari indisponible
            </span>
          </div>
        )}

        {/* Paris fermés */}
        {jouable && !bettingAllowed && (
          <>
            {hasFT && (
              <div className="flex justify-center gap-3">
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

        {/* Paris ouverts */}
        {jouable && bettingAllowed && (
          <>
            {hasFT && (
              <div className="flex justify-center gap-3">
                <ZoneMonPari clickable={false} />
                <BlocPronoIA />
              </div>
            )}

            {aucunPari && (
              <div className="flex flex-col items-center gap-1.5 w-full mt-1">
                <p className="text-[11px] text-gray-400 italic text-center">
                  👆 Cliquez sur une cote pour parier
                </p>
                <BlocPronoIA />
              </div>
            )}

            {/* Bouton voir mes paris si pari déjà placé */}
            {hasFT && (
              <button
                onClick={() => navigate('/pronos', { state: { activeTab: 'mes-paris', scrollToMatchId: match.match_id } })}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold
                          bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200 transition-colors shadow-sm w-fit mx-auto"
              >
                Voir mon pari en cours
              </button>
            )}
          </>
        )}
      </div>

      {/* Popup fiche équipe */}
      {teamPopup && (
        <TeamPopup
          equipeNom={teamPopup}
          isD2={false}  // HCup utilise les équipes Top14/D2/Internationales
          onClose={() => setTeamPopup(null)}
        />
      )}
    </div>
  );
}
