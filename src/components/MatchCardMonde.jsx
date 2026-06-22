// ============================================================
// MatchCardMonde.jsx
// Carte d'un match international (Rugby International / MONDE)
// ============================================================
// Calque allégé de MatchCardHcup :
//   - équipes = nations → logos via getTeamData (codes pays dans public/logos)
//   - badge = compétition (pas de round/poule)
//   - pas de bouton Conseil ni de TeamPopup
//   - toujours pariable (l'API /matchs/a-venir ne renvoie que des 'a_jouer')
//   - couleurs charte MONDE (vert émeraude / émeraude)
// ============================================================

import { useState } from 'react';
import { CheckCircle, Brain, Lock, Star, Lightbulb, X, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { getTeamData } from '../utils/teams';
import { getCharte } from '../constants/chartes';
import axios from 'axios';

const API_BASE = 'https://top14-api-production.up.railway.app';
const _charteMonde = getCharte('monde').base;
const MONDE_GREEN = _charteMonde.vert;
const MONDE_EMERAUDE = _charteMonde.emeraude || '#34D399';

// ── Popup Conseil personnalisé MONDE ─────────────────────────
const ConseilPopupMonde = ({ match, onClose }) => {
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
        championnat: 'monde',
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
        <div
          className="px-5 py-4 flex items-center justify-between"
          style={{ backgroundColor: 'rgba(11,110,79,0.06)', borderBottom: `3px solid ${MONDE_GREEN}` }}
        >
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" style={{ color: MONDE_GREEN }} />
            <div>
              <p className="font-bold text-sm" style={{ color: MONDE_GREEN }}>Conseil personnalisé</p>
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
              <Loader className="w-8 h-8 animate-spin" style={{ color: MONDE_GREEN }} />
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
              <div className="rounded-xl px-4 py-3 flex items-start gap-3" style={{ backgroundColor: 'rgba(11,110,79,0.06)' }}>
                <span className="text-[11px] font-bold px-2 py-1 rounded-full flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: MONDE_GREEN, color: '#FFFFFF' }}>
                  {styleLabel}
                </span>
                <p className="text-xs text-gray-600 leading-relaxed">{data.resume_profil}</p>
              </div>

              {data.nb_paris > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 rounded-xl px-3 py-2 text-center border border-gray-200">
                    <p className="text-xs text-gray-500">Taux de réussite</p>
                    <p className="text-lg font-bold" style={{ color: MONDE_GREEN }}>{data.profil_taux}%</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl px-3 py-2 text-center border border-gray-200">
                    <p className="text-xs text-gray-500">Paris joués</p>
                    <p className="text-lg font-bold" style={{ color: MONDE_GREEN }}>{data.nb_paris}</p>
                  </div>
                </div>
              )}

              {data.conseils?.map((conseil, i) => (
                <div key={i} className="rounded-xl border p-4 space-y-1"
                  style={{ borderColor: MONDE_GREEN + '30', backgroundColor: i % 2 === 0 ? 'rgba(11,110,79,0.04)' : 'white' }}>
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

        <div className="p-4 border-t border-gray-100"
             style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-colors text-white"
            style={{ backgroundColor: MONDE_GREEN }}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

// Détection robuste d'une phase à élimination directe (Coupe du Monde, etc.)
const PHASE_FINALE = (p) => {
  const s = (p || '').toString().toLowerCase();
  return s.includes('finale') || s.includes('quart') || s.includes('demi')
      || s.includes('barrage') || s.includes('huiti') || s.includes('8e');
};

export default function MatchCardMonde({ match, existingProno, onBetClick, goToMesParis, jouable = true, lockMessage = 'Pari indisponible', hideCompetition = false }) {
  const navigate = useNavigate();
  const { isFavori, toggleFavori } = useFavorites();
  const [showConseil, setShowConseil] = useState(false);

  const teamDom = getTeamData(match.equipe_domicile);
  const teamExt = getTeamData(match.equipe_exterieure);

  // L'API ne sert que des matchs 'a_jouer' → toujours pariable
  const bettingAllowed = true;

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

  const getWinnerName = (predit) => {
    if (predit === 'DOM' || predit === 'domicile') return match.equipe_domicile;
    if (predit === 'EXT' || predit === 'exterieur') return match.equipe_exterieure;
    if (predit === 'NUL' || predit === 'nul') return 'Match nul';
    return '?';
  };

  const BlocPronoIA = () => {
    if (!hasIAFT) return null;
    return (
      <div className="w-full flex flex-col px-3 py-2.5 rounded-lg border"
        style={{ backgroundColor: 'rgba(11,110,79,0.06)', borderColor: MONDE_GREEN }}>
        <div className="flex items-center gap-1 mb-1.5">
          <Brain className="w-3.5 h-3.5 flex-shrink-0" style={{ color: MONDE_GREEN }} />
          <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: MONDE_GREEN }}>Prono IA</span>
        </div>
        <div className="leading-tight">
          <span className="text-[10px] font-medium" style={{ color: MONDE_GREEN, opacity: 0.8 }}>Score FT</span>
          <div className="text-lg font-semibold leading-none" style={{ color: MONDE_GREEN }}>{iaFTDom} – {iaFTExt}</div>
        </div>
        {match.cotes?.confiance_algo && (
          <span className="text-[9px] mt-1.5" style={{ color: MONDE_GREEN, opacity: 0.7 }}>
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
    <div className="px-3 py-3 hover:bg-[rgba(11,110,79,0.04)] transition-colors">

      {/* Date + Compétition (+ phase finale si élimination directe) */}
      <div className="flex items-center justify-between mb-2 gap-2">
        <p className="text-[10px] text-gray-500 min-w-0 flex-1 truncate">
          {(() => {
            // Le JOUR est dans l'en-tête d'accordéon et la compétition dans le
            // badge en haut de carte : ici on n'affiche que lieu · heure de Paris 🇫🇷.
            const lieu = [match.ville, match.pays].map(s => (s || '').trim()).filter(Boolean).join(', ');
            const parts = [];
            if (lieu) parts.push(`📍 ${lieu}`);
            if (match.heure_match_fr) parts.push(`🕒 ${match.heure_match_fr} 🇫🇷`);
            return parts.join('  ·  ');
          })()}
        </p>
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {PHASE_FINALE(match.phase) && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse"
              style={{ backgroundColor: '#FCD34D', color: '#064E3B' }}>
              🏆 {match.phase}
            </span>
          )}
          {!hideCompetition && match.competition && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: 'rgba(11,110,79,0.1)', color: MONDE_GREEN }}>
              {match.competition}
            </span>
          )}
          {match.compte_points === false && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: '#FEF3C7', color: '#92400E', border: '1px solid #FCD34D' }}
              title="Ce match ne rapporte pas de points au classement (jetons uniquement)">
              Hors classement
            </span>
          )}
          {/* Bouton Conseil */}
          <button
            onClick={() => setShowConseil(true)}
            className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold transition-all hover:opacity-80"
            style={{ backgroundColor: 'rgba(11,110,79,0.1)', color: MONDE_GREEN, border: '1px solid rgba(11,110,79,0.3)' }}
          >
            <Lightbulb className="w-3 h-3" />
            Conseil
          </button>
        </div>
      </div>

      {/* Équipes (logos nations + noms) */}
      <div className="grid grid-cols-3 items-start px-1 mb-2">

        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-1.5 shadow-sm">
            <img src={teamDom.logo} alt={match.equipe_domicile} className="w-16 h-16 object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          </div>
          <span className="text-sm font-bold text-gray-900 leading-tight break-words line-clamp-2 uppercase">
            {match.equipe_domicile}
          </span>
        </div>

        <div className="flex flex-col items-center justify-start pt-1 gap-0.5">
          <div className="flex gap-1">
            <button onClick={(e) => { e.stopPropagation(); toggleFavori(match.equipe_domicile, 'monde'); }} className="p-1">
              <Star className={`w-4 h-4 ${isFavori(match.equipe_domicile) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); toggleFavori(match.equipe_exterieure, 'monde'); }} className="p-1">
              <Star className={`w-4 h-4 ${isFavori(match.equipe_exterieure) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
            </button>
          </div>
          <span className="text-xs text-gray-400 font-semibold mt-1">VS</span>
        </div>

        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-1.5 shadow-sm">
            <img src={teamExt.logo} alt={match.equipe_exterieure} className="w-16 h-16 object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          </div>
          <span className="text-sm font-bold text-gray-900 leading-tight break-words line-clamp-2 uppercase">
            {match.equipe_exterieure}
          </span>
        </div>

      </div>

      {/* Cotes 3 voies */}
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
          {PHASE_FINALE(match.phase) && (
            <p className="text-[9px] text-gray-500 italic mt-0.5 text-center">
              Pari basé sur le score à <strong>80 min</strong> (hors prolongation)
            </p>
          )}
        </div>
      )}

      {/* Zone actions */}
      <div className="flex flex-col gap-2">
        {!jouable && (
          <div className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 mx-auto">
            <Lock className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-xs font-semibold text-gray-400 text-center">{lockMessage}</span>
          </div>
        )}

        {jouable && (
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
                style={{ backgroundColor: MONDE_GREEN }}
              >
                Voir mon pari en cours
              </button>
            )}
          </>
        )}
      </div>

      {/* Popup conseil personnalisé */}
      {showConseil && (
        <ConseilPopupMonde match={match} onClose={() => setShowConseil(false)} />
      )}
    </div>
  );
}
