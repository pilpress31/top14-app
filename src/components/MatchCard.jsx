// ============================================
// CARTE DE MATCH - VERSION avec support Pro D2
// + Bouton Conseil personnalisé (mai 2026)
// ============================================

import { useState, useEffect } from 'react';
import { CheckCircle, Edit, Lock, Brain, Lightbulb, X, Loader, Star } from 'lucide-react';
import { getTeamData } from '../utils/teams';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useChampionnat } from '../contexts/ChampionnatContext';
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

// ── Popup Conseil personnalisé ──────────────────────────────
const ConseilPopup = ({ match, isD2, onClose }) => {
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
      const championnat = isD2 ? 'd2' : 'top14';
      const res = await axios.post(`${API_BASE}/api/insights/conseil-personnalise`, {
        match_id: match.match_id,
        equipe_domicile: match.equipe_domicile,
        equipe_exterieure: match.equipe_exterieure,
        championnat,
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

  // Charger au montage
  useState(() => { chargerConseils(); }, []);

  // Couleurs selon championnat
  const accentColor = isD2 ? '#00174D' : '#D4A017';
  const bgColor = isD2 ? '#E8EFF7' : '#FFF8E7';
  const badgeBg = isD2 ? '#00174D' : '#D4A017';
  const badgeText = '#FFFFFF';

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
          style={{ backgroundColor: bgColor, borderBottom: `3px solid ${accentColor}` }}
        >
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" style={{ color: accentColor }} />
            <div>
              <p className="font-bold text-sm" style={{ color: accentColor }}>Conseil personnalisé</p>
              <p className="text-xs text-gray-500">{match.equipe_domicile} vs {match.equipe_exterieure}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/10 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Contenu scrollable */}
        <div className="overflow-y-auto flex-1">

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader className="w-8 h-8 animate-spin" style={{ color: accentColor }} />
              <p className="text-sm text-gray-500">Analyse de ton profil en cours...</p>
            </div>
          )}

          {/* Erreur */}
          {error && !loading && (
            <div className="p-5">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                <p className="text-sm text-red-600">{error}</p>
                <button
                  onClick={() => { setLoaded(false); chargerConseils(); }}
                  className="mt-3 text-xs font-semibold text-red-700 underline"
                >
                  Réessayer
                </button>
              </div>
            </div>
          )}

          {/* Conseils */}
          {data && !loading && (
            <div className="p-4 space-y-3">

              {/* Badge profil + résumé */}
              <div
                className="rounded-xl px-4 py-3 flex items-start gap-3"
                style={{ backgroundColor: bgColor }}
              >
                <span
                  className="text-[11px] font-bold px-2 py-1 rounded-full flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: badgeBg, color: badgeText }}
                >
                  {styleLabel}
                </span>
                <p className="text-xs text-gray-600 leading-relaxed">{data.resume_profil}</p>
              </div>

              {/* Stats rapides */}
              {data.nb_paris > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 rounded-xl px-3 py-2 text-center border border-gray-200">
                    <p className="text-xs text-gray-500">Taux de réussite</p>
                    <p className="text-lg font-bold" style={{ color: accentColor }}>{data.profil_taux}%</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl px-3 py-2 text-center border border-gray-200">
                    <p className="text-xs text-gray-500">Paris joués</p>
                    <p className="text-lg font-bold" style={{ color: accentColor }}>{data.nb_paris}</p>
                  </div>
                </div>
              )}

              {/* Conseils */}
              {data.conseils?.map((conseil, i) => (
                <div
                  key={i}
                  className="rounded-xl border p-4 space-y-1"
                  style={{
                    borderColor: accentColor + '40',
                    backgroundColor: i % 2 === 0 ? bgColor : 'white',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{conseil.emoji}</span>
                    <p className="font-bold text-sm text-gray-800">{conseil.titre}</p>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed pl-7">{conseil.texte}</p>
                </div>
              ))}

              {/* Disclaimer */}
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
            style={{ backgroundColor: accentColor }}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default function MatchCard({ match, existingProno, onBetClick, goToMesParis, jouable = true, prochaineJournee, isD2 = false }) {
  const teamDom = getTeamData(match.equipe_domicile);
  const teamExt = getTeamData(match.equipe_exterieure);
  const bettingAllowed = isBettingAllowed(match);
  const navigate = useNavigate();
  const [teamPopup, setTeamPopup] = useState(null);
  const [showConseil, setShowConseil] = useState(false);
  const { user } = useAuth();
  const { isFavori, toggleFavori } = useFavorites();

  // ✅ En Pro D2, pas de paris MT du tout
  const pronoFT = existingProno?.find(p => 
    (p.bet_type === 'FT' || p.bet_type === 'WINNER_FT') && p.status !== 'cancelled'
  );
  const pronoMT = isD2 ? null : existingProno?.find(p => 
    (p.bet_type === 'MT' || p.bet_type === 'WINNER_MT') && p.status !== 'cancelled'
  );
  
  const isWinnerBet = pronoFT?.bet_type === 'WINNER_FT';
  const hasFT = !!pronoFT;
  const hasMT = !!pronoMT;
  const pariComplet = isD2 ? hasFT : (hasFT && hasMT);
  const pariPartiel = isD2 ? false : ((hasFT && !hasMT) || (!hasFT && hasMT));
  const aucunPari = !hasFT && !hasMT;

  const iaFTDom = match.cotes?.score_predit_dom;
  const iaFTExt = match.cotes?.score_predit_ext;
  const iaMTDom = match.cotes?.score_predit_mt_dom;
  const iaMTExt = match.cotes?.score_predit_mt_ext;
  const hasIAFT = iaFTDom != null && iaFTExt != null;
  const hasIAMT = !isD2 && iaMTDom != null && iaMTExt != null;

  const matchDate = new Date(match.date_match || match.date);
  const showTime = matchDate.getHours() !== 0 || matchDate.getMinutes() !== 0;

  // Couleurs selon championnat
  const accentColor = isD2 ? '#00174D' : '#D4A017';

  const BlocPronoIA = ({ showFT, showMT }) => {
    const displayMT = showMT && !isD2 && hasIAMT;
    if (!showFT && !displayMT) return null;
    return (
      <div className="flex flex-col items-center px-3 py-2 bg-indigo-50 rounded-lg border border-indigo-200 min-w-[110px]">
        <div className="flex items-center gap-1 mb-1">
          <Brain className="w-3 h-3 text-indigo-500" />
          <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-wide">Prono IA</span>
        </div>
        {showFT && hasIAFT && (
          <span className="text-xs font-bold text-indigo-700 whitespace-nowrap">FT : {iaFTDom} - {iaFTExt}</span>
        )}
        {displayMT && (
          <span className="text-xs font-bold text-indigo-700 whitespace-nowrap">MT : {iaMTDom} - {iaMTExt}</span>
        )}
      </div>
    );
  };

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
        {pronoFT && !isWinnerBet && (
          <span className="text-xs font-bold text-green-700 whitespace-nowrap">
            🏉 Score FT : {pronoFT.score_dom ?? pronoFT.score_dom_pronos ?? pronoFT.score_domicile ?? '?'} - {pronoFT.score_ext ?? pronoFT.score_ext_pronos ?? pronoFT.score_exterieur ?? '?'}
          </span>
        )}
        {pronoFT && isWinnerBet && (
          <span className="text-xs font-bold text-green-700 whitespace-nowrap">
            🎯 Vainqueur FT : {pronoFT.winner_predit === 'domicile' ? teamDom.name 
              : pronoFT.winner_predit === 'exterieur' ? teamExt.name 
              : 'Match nul'}
          </span>
        )}
        {pronoMT && pronoMT.bet_type !== 'WINNER_MT' && (
          <span className="text-xs font-bold text-green-700 whitespace-nowrap">
            ⏱️ Score MT : {pronoMT.score_dom ?? pronoMT.score_dom_mt ?? '?'} - {pronoMT.score_ext ?? pronoMT.score_ext_mt ?? '?'}
          </span>
        )}
        {pronoMT && pronoMT.bet_type === 'WINNER_MT' && (
          <span className="text-xs font-bold text-green-700 whitespace-nowrap">
            🎯 Vainqueur MT : {pronoMT.winner_predit === 'domicile' ? teamDom.name 
              : pronoMT.winner_predit === 'exterieur' ? teamExt.name 
              : 'Match nul'}
          </span>
        )}
      </div>
    );
  };

  const hoverColor = isD2 ? 'hover:bg-d2-blue/5' : 'hover:bg-rugby-gold/5';

  return (
    <div className={`px-3 py-3 ${hoverColor} transition-colors`}>

      {/* Date + bouton Conseil */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] text-gray-500">
          {matchDate.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
          {showTime && ` • ${matchDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`}
        </p>
        {/* Bouton Conseil personnalisé — discret */}
        <button
          onClick={() => setShowConseil(true)}
          className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold transition-all hover:opacity-80"
          style={{
            backgroundColor: accentColor + '15',
            color: accentColor,
            border: `1px solid ${accentColor}40`,
          }}
        >
          <Lightbulb className="w-3 h-3" />
          Conseil
        </button>
      </div>

      {/* Équipes + Logos — layout identique à la page IA (grid 3 colonnes) */}
      <div className="grid grid-cols-3 items-start px-1 mb-2">

        {/* Équipe domicile */}
        <button
          onClick={() => setTeamPopup(match.equipe_domicile)}
          className="flex flex-col items-center text-center hover:opacity-80 transition-opacity"
        >
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-1.5 shadow-sm">
            <img src={teamDom.logo} alt={teamDom.name} className="w-10 h-10 object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          </div>
          <span className="text-sm font-bold text-gray-900 leading-tight break-words line-clamp-2 underline decoration-dotted underline-offset-2 uppercase">
            {teamDom.name}
          </span>
        </button>

        {/* Centre — étoiles favoris + VS */}
        <div className="flex flex-col items-center justify-start pt-1 gap-0.5">
          <div className="flex gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); toggleFavori(match.equipe_domicile, isD2 ? 'd2' : 'top14'); }}
              className="p-1"
              title={isFavori(match.equipe_domicile) ? "Retirer des favoris" : "Ajouter aux favoris"}
            >
              <Star className={`w-4 h-4 ${isFavori(match.equipe_domicile) ? 'text-rugby-gold fill-rugby-gold' : 'text-gray-300'}`} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); toggleFavori(match.equipe_exterieure, isD2 ? 'd2' : 'top14'); }}
              className="p-1"
              title={isFavori(match.equipe_exterieure) ? "Retirer des favoris" : "Ajouter aux favoris"}
            >
              <Star className={`w-4 h-4 ${isFavori(match.equipe_exterieure) ? 'text-rugby-gold fill-rugby-gold' : 'text-gray-300'}`} />
            </button>
          </div>
          <span className="text-xs text-gray-400 font-semibold mt-1">VS</span>
        </div>

        {/* Équipe extérieure */}
        <button
          onClick={() => setTeamPopup(match.equipe_exterieure)}
          className="flex flex-col items-center text-center hover:opacity-80 transition-opacity"
        >
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-1.5 shadow-sm">
            <img src={teamExt.logo} alt={teamExt.name} className="w-10 h-10 object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          </div>
          <span className="text-sm font-bold text-gray-900 leading-tight break-words line-clamp-2 underline decoration-dotted underline-offset-2 uppercase">
            {teamExt.name}
          </span>
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
              const winnerForClick = i === 0 ? 'domicile' : i === 1 ? 'nul' : 'exterieur';
              const preselect = isD2 ? winnerForClick : { type: 'FT', choice: winnerForClick };
              return (
                <div key={i}
                  onClick={() => ftClickable && onBetClick(match, preselect)}
                  className={`${i === 0 ? 'bg-blue-50 border-blue-200 text-blue-900' : i === 1 ? 'bg-gray-50 border-gray-300 text-gray-900' : 'bg-red-50 border-red-200 text-red-900'} border rounded w-14 py-1.5 text-center text-sm font-bold ${ftClickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : 'opacity-50 cursor-not-allowed'}`}
                >
                  {cote?.toFixed(2)}
                </div>
              );
            })}
          </div>

          {/* Ligne Mi-temps — UNIQUEMENT EN TOP 14 */}
          {!isD2 && match.cotes.cote_mt_domicile && (
            <div className="flex items-center gap-1.5">
              <div className="w-16 text-[10px] text-gray-400 font-semibold text-right">Mi-temps</div>
              {[match.cotes.cote_mt_domicile, match.cotes.cote_mt_nul, match.cotes.cote_mt_exterieur].map((cote, i) => {
                const mtClickable = bettingAllowed && !hasMT && jouable;
                const winnerForClick = i === 0 ? 'domicile' : i === 1 ? 'nul' : 'exterieur';
                const preselect = { type: 'MT', choice: winnerForClick };
                return (
                  <div key={i}
                    onClick={() => mtClickable && onBetClick(match, preselect)}
                    className={`${i === 0 ? 'bg-blue-50 border-blue-200 text-blue-900' : i === 1 ? 'bg-gray-50 border-gray-300 text-gray-900' : 'bg-red-50 border-red-200 text-red-900'} border rounded w-14 py-1.5 text-center text-sm font-bold ${mtClickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : 'opacity-50 cursor-not-allowed'}`}
                  >
                    {cote?.toFixed(2)}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Zone actions */}
      <div className="flex flex-col gap-2">
        {!jouable && (
          <div className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 w-fit mx-auto">
            <Lock className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-semibold text-gray-400 text-center">
              Paris disponibles après J{parseInt(String(match.journee).replace('J', '')) - 1}
            </span>
          </div>
        )}

        {!bettingAllowed && (
          <>
            {(hasFT || hasMT) && (
              <div className="flex justify-center gap-3">
                <ZoneMonPari clickable={true} />
                <BlocPronoIA showFT={hasFT} showMT={hasMT} />
              </div>
            )}
            <div className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 rounded-lg border border-gray-300 w-fit mx-auto">
              <Lock className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-semibold text-gray-600">{getBlockingMessage(match)}</span>
            </div>
          </>
        )}

        {bettingAllowed && (
          <>
            {(hasFT || hasMT) && (
              <div className="flex justify-center gap-3">
                <ZoneMonPari clickable={false} />
                <BlocPronoIA showFT={hasFT} showMT={hasMT} />
              </div>
            )}
            {aucunPari && (
              <div className="flex flex-col items-center gap-1.5 w-full mt-1">
                <p className="text-[11px] text-gray-400 italic text-center">
                  👆 Cliquez sur une cote pour parier
                </p>
                <BlocPronoIA showFT={true} showMT={true} />
              </div>
            )}
            {pariPartiel && (
              <button
                onClick={() => onBetClick(match)}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-rugby-bronze text-white hover:bg-rugby-bronze/80 transition-colors shadow-sm w-fit mx-auto"
              >
                <Edit className="w-4 h-4" />
                <span>Compléter mon pari</span>
              </button>
            )}
            {pariComplet && (
              <button
                onClick={() => navigate('/pronos', { state: { activeTab: 'mes-paris', scrollToMatchId: match.match_id } })}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200 transition-colors shadow-sm w-fit mx-auto"
              >
                Voir mes paris en cours
              </button>
            )}
          </>
        )}
      </div>

      {/* Popup fiche équipe */}
      {teamPopup && (
        <TeamPopup
          equipeNom={teamPopup}
          isD2={isD2}
          onClose={() => setTeamPopup(null)}
        />
      )}

      {/* Popup conseil personnalisé */}
      {showConseil && (
        <ConseilPopup
          match={match}
          isD2={isD2}
          onClose={() => setShowConseil(false)}
        />
      )}
    </div>
  );
}
