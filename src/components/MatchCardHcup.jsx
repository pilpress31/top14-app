// ============================================================
// MatchCardHcup.jsx
// Carte d'un match Champions Cup
// + Bouton Conseil personnalisé (mai 2026)
// ============================================================

import { useState, useEffect } from 'react';
import { CheckCircle, Edit, Lock, Brain, Trophy, Lightbulb, X, Loader, Star } from 'lucide-react';
import { getTeamData } from '../utils/teams';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFavorites } from '../contexts/FavoritesContext';
import TeamPopup from './TeamPopup';
import axios from 'axios';

const API_BASE = 'https://top14-api-production.up.railway.app';

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

const HCUP_BLUE = '#003E7E';
const HCUP_GOLD = '#FFC72C';

// ── Popup Conseil personnalisé HCup ──────────────────────────
const ConseilPopupHcup = ({ match, onClose }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loaded, setLoaded] = useState(false);

  const chargerConseils = async () => {
    if (loaded) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${API_BASE}/api/insights/conseil-personnalise`, {
        match_id: match.match_id,
        equipe_domicile: match.equipe_domicile,
        equipe_exterieure: match.equipe_exterieure,
        championnat: 'hcup',
      }, {
        headers: { 'x-user-id': user.id }
      });
      setData(res.data);
      setLoaded(true);
    } catch (err) {
      setError('Impossible de charger les conseils. Réessaie dans quelques instants.');
    } finally {
      setLoading(false);
    }
  };

  useState(() => { chargerConseils(); }, []);

  const styleLabel = data?.profil_style === 'prudent' ? '🛡️ Profil prudent'
    : data?.profil_style === 'agressif' ? '🔥 Profil audacieux'
    : data?.profil_style === 'neutre' ? '🏁 Profil débutant'
    : '⚖️ Profil équilibré';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: 'calc(100vh - 140px - env(safe-area-inset-bottom, 0px))' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-5 py-4 flex items-center justify-between"
          style={{ backgroundColor: 'rgba(0, 62, 126, 0.06)', borderBottom: `3px solid ${HCUP_BLUE}` }}
        >
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" style={{ color: HCUP_BLUE }} />
            <div>
              <p className="font-bold text-sm" style={{ color: HCUP_BLUE }}>Conseil personnalisé</p>
              <p className="text-xs text-gray-500">{match.equipe_domicile} vs {match.equipe_exterieure}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-black/10 transition-colors">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader className="w-8 h-8 animate-spin" style={{ color: HCUP_BLUE }} />
              <p className="text-sm text-gray-500">Analyse de ton profil en cours...</p>
            </div>
          )}

          {error && !loading && (
            <div className="p-5">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                <p className="text-sm text-red-600">{error}</p>
                <button onClick={() => { setLoaded(false); chargerConseils(); }} className="mt-3 text-xs font-semibold text-red-700 underline">
                  Réessayer
                </button>
              </div>
            </div>
          )}

          {data && !loading && (
            <div className="p-4 space-y-3">
              <div className="rounded-xl px-4 py-3 flex items-start gap-3" style={{ backgroundColor: 'rgba(0, 62, 126, 0.06)' }}>
                <span className="text-[11px] font-bold px-2 py-1 rounded-full flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: HCUP_BLUE, color: HCUP_GOLD }}>
                  {styleLabel}
                </span>
                <p className="text-xs text-gray-600 leading-relaxed">{data.resume_profil}</p>
              </div>

              {data.nb_paris > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 rounded-xl px-3 py-2 text-center border border-gray-200">
                    <p className="text-xs text-gray-500">Taux de réussite</p>
                    <p className="text-lg font-bold" style={{ color: HCUP_BLUE }}>{data.profil_taux}%</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl px-3 py-2 text-center border border-gray-200">
                    <p className="text-xs text-gray-500">Paris joués</p>
                    <p className="text-lg font-bold" style={{ color: HCUP_BLUE }}>{data.nb_paris}</p>
                  </div>
                </div>
              )}

              {data.conseils?.map((conseil, i) => (
                <div key={i} className="rounded-xl border p-4 space-y-1"
                  style={{ borderColor: HCUP_BLUE + '30', backgroundColor: i % 2 === 0 ? 'rgba(0,62,126,0.04)' : 'white' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{conseil.emoji}</span>
                    <p className="font-bold text-sm text-gray-800">{conseil.titre}</p>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed pl-7">{conseil.texte}</p>
                </div>
              ))}

              <p className="text-[10px] text-gray-400 text-center italic px-2 pb-2">
                Ces conseils sont générés par l'IA à titre informatif et ne constituent pas une incitation au pari.
              </p>
            </div>
          )}
        </div>

        {/* Bouton Fermer */}
        <div className="p-4 border-t border-gray-100"
             style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-colors text-white"
            style={{ backgroundColor: HCUP_BLUE }}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default function MatchCardHcup({ match, existingProno, onBetClick, goToMesParis, jouable = true }) {
  const teamDom = getTeamData(match.equipe_domicile);
  const teamExt = getTeamData(match.equipe_exterieure);
  const bettingAllowed = isBettingAllowed(match);
  const navigate = useNavigate();
  const [teamPopup, setTeamPopup] = useState(null);
  const [showConseil, setShowConseil] = useState(false);
  const { user } = useAuth();
  const { isFavori, toggleFavori } = useFavorites();

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
        style={{ backgroundColor: 'rgba(0, 62, 126, 0.05)', borderColor: HCUP_BLUE }}>
        <div className="flex items-center gap-1 mb-1.5">
          <Brain className="w-3.5 h-3.5 flex-shrink-0" style={{ color: HCUP_BLUE }} />
          <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: HCUP_BLUE }}>Prono IA</span>
        </div>
        <div className="mb-0.5">
          <span className="text-[9px] font-semibold" style={{ color: HCUP_BLUE }}>FT</span>
          <div className="text-base font-extrabold leading-tight" style={{ color: HCUP_BLUE }}>{iaFTDom} – {iaFTExt}</div>
        </div>
        {match.cotes?.confiance_algo && (
          <span className="text-[9px]" style={{ color: HCUP_BLUE, opacity: 0.7 }}>
            Confiance {match.cotes.confiance_algo}%
          </span>
        )}
      </div>
    );
  };

  const ZoneMonPari = ({ clickable }) => {
    return (
      <div
        onClick={clickable ? () => navigate('/pronos', { state: { activeTab: 'mes-paris', scrollToMatchId: match.match_id } }) : undefined}
        className={`w-full flex flex-col px-3 py-2.5 bg-green-50 rounded-lg border border-green-200 ${clickable ? 'cursor-pointer hover:bg-green-100 transition-colors' : ''}`}
      >
        <div className="flex items-center gap-1 mb-1.5">
          <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
          <span className="text-[9px] font-bold text-green-600 uppercase tracking-wide">Mon pari</span>
        </div>
        {pronoFT && !isWinnerBet && (
          <div className="mb-0.5">
            <span className="text-[9px] font-semibold text-green-600">Score FT</span>
            <div className="text-base font-extrabold text-green-800 leading-tight">
              {pronoFT.score_dom ?? pronoFT.score_dom_pronos ?? pronoFT.score_domicile ?? '?'} – {pronoFT.score_ext ?? pronoFT.score_ext_pronos ?? pronoFT.score_exterieur ?? '?'}
            </div>
          </div>
        )}
        {pronoFT && isWinnerBet && (
          <div className="mb-0.5">
            <span className="text-[9px] font-semibold text-green-600">Vainqueur FT</span>
            <div className="text-xs font-bold text-green-800 leading-tight break-words">
              {getWinnerName(pronoFT.winner_predit)}
            </div>
          </div>
        )}
        {pronoFT && (
          <span className="text-[9px] text-green-600">
            {pronoFT.stake} jetons @ {pronoFT.odds?.toFixed(2)}
          </span>
        )}
      </div>
    );
  };

  const hoverColor = 'hover:bg-[rgba(0,62,126,0.04)]';
  const isPhaseFinale = match.phase === 'Phase finale';
  const phaseBadge = match.round || match.phase;

  return (
    <div className={`px-3 py-3 ${hoverColor} transition-colors`}>

      {/* Date + Phase + Bouton Conseil */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] text-gray-500">
          {matchDate.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
          {showTime && ` • ${matchDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`}
        </p>
        <div className="flex items-center gap-2">
          {phaseBadge && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isPhaseFinale ? 'animate-pulse' : ''}`}
              style={{ backgroundColor: isPhaseFinale ? HCUP_GOLD : 'rgba(0, 62, 126, 0.1)', color: HCUP_BLUE }}>
              {isPhaseFinale && '🏆 '}{phaseBadge}
            </span>
          )}
          {/* Bouton Conseil */}
          <button
            onClick={() => setShowConseil(true)}
            className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold transition-all hover:opacity-80"
            style={{ backgroundColor: 'rgba(0,62,126,0.1)', color: HCUP_BLUE, border: `1px solid rgba(0,62,126,0.3)` }}
          >
            <Lightbulb className="w-3 h-3" />
            Conseil
          </button>
        </div>
      </div>

      {/* Équipes + Logos */}
      {/* Équipes + Logos — grid 3 colonnes identique page IA */}
      <div className="grid grid-cols-3 items-start px-1 mb-2">

        <button onClick={() => setTeamPopup(match.equipe_domicile)}
          className="flex flex-col items-center text-center hover:opacity-80 transition-opacity">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-1.5 shadow-sm">
            <img src={teamDom.logo} alt={teamDom.name} className="w-10 h-10 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          </div>
          <span className="text-sm font-bold text-gray-900 leading-tight break-words line-clamp-2 underline decoration-dotted underline-offset-2 uppercase">
            {teamDom.name}
          </span>
        </button>

        <div className="flex flex-col items-center justify-start pt-1 gap-0.5">
          <div className="flex gap-1">
            <button onClick={(e) => { e.stopPropagation(); toggleFavori(match.equipe_domicile, 'hcup'); }} className="p-1">
              <Star className={`w-4 h-4 ${isFavori(match.equipe_domicile) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); toggleFavori(match.equipe_exterieure, 'hcup'); }} className="p-1">
              <Star className={`w-4 h-4 ${isFavori(match.equipe_exterieure) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
            </button>
          </div>
          <span className="text-xs text-gray-400 font-semibold mt-1">VS</span>
        </div>

        <button onClick={() => setTeamPopup(match.equipe_exterieure)}
          className="flex flex-col items-center text-center hover:opacity-80 transition-opacity">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-1.5 shadow-sm">
            <img src={teamExt.logo} alt={teamExt.name} className="w-10 h-10 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          </div>
          <span className="text-sm font-bold text-gray-900 leading-tight break-words line-clamp-2 underline decoration-dotted underline-offset-2 uppercase">
            {teamExt.name}
          </span>
        </button>

      </div>

      {/* Cotes */}
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
            {[match.cotes.cote_domicile, match.cotes.cote_nul, match.cotes.cote_exterieur].map((cote, i) => {
              const ftClickable = bettingAllowed && !hasFT && jouable;
              const winnerForClick = i === 0 ? 'DOM' : i === 1 ? 'NUL' : 'EXT';
              const preselect = { type: 'FT', choice: winnerForClick };
              const noOdds = cote == null;
              return (
                <div key={i}
                  onClick={() => ftClickable && !noOdds && onBetClick(match, preselect)}
                  className={`${i === 0 ? 'bg-blue-50 border-blue-200 text-blue-900' : i === 1 ? 'bg-gray-50 border-gray-300 text-gray-900' : 'bg-red-50 border-red-200 text-red-900'} border rounded w-14 py-1.5 text-center text-sm font-bold ${ftClickable && !noOdds ? 'cursor-pointer hover:opacity-80 transition-opacity' : 'opacity-50 cursor-not-allowed'}`}>
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
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200 transition-colors shadow-sm w-fit mx-auto"
              >
                Voir mon pari en cours
              </button>
            )}
          </>
        )}
      </div>

      {/* Popup fiche équipe */}
      {teamPopup && (
        <TeamPopup equipeNom={teamPopup} isHcup={true} onClose={() => setTeamPopup(null)} />
      )}

      {/* Popup conseil personnalisé */}
      {showConseil && (
        <ConseilPopupHcup match={match} onClose={() => setShowConseil(false)} />
      )}
    </div>
  );
}
