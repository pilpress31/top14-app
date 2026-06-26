// ============================================================
// BettingModalMonde.jsx
// Modal pour placer un pari sur un match international (MONDE)
// ============================================================
// Calque de BettingModalHcup :
//   - FT (score exact, bonus +500) + WINNER_FT (1/N/2)
//   - winner_predit en MAJUSCULES (DOM/EXT/NUL)
//   - couleurs charte MONDE (vert émeraude / émeraude)
//   - endpoint : /api/monde/bets
//   - noms d'équipes = nations (depuis le match) ; logo best-effort via getTeamData
//   - pas de mention "80 min / prolongation" (les scores MONDE sont déjà finaux)
// ============================================================

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Globe, Coins, Target, Hash, Brain, Sparkles } from 'lucide-react';
import axios from 'axios';
import { supabase } from '../lib/supabaseClient';
import { getTeamData } from '../utils/teams';
import { getCharte } from '../constants/chartes';

const API_BASE = 'https://api.top14pronos.fr';

// Couleurs charte MONDE — centralisées dans src/constants/chartes.js
const { vert: MONDE_GREEN, emeraude: MONDE_ACCENT } = getCharte('monde').base;

const PHASE_FINALE = (p) => {
  const s = (p || '').toString().toLowerCase();
  return s.includes('finale') || s.includes('quart') || s.includes('demi')
      || s.includes('barrage') || s.includes('huiti') || s.includes('8e');
};

const toInt = (v) => parseInt(v) || 0;

export default function BettingModalMonde({ match, existingProno, userCredits, preselectedWinner = null, onClose, onSuccess }) {
  // Noms toujours fiables (depuis le match) ; logo best-effort (peut être absent)
  const domName = match.equipe_domicile;
  const extName = match.equipe_exterieure;
  const domLogo = getTeamData(domName)?.logo;
  const extLogo = getTeamData(extName)?.logo;

  // ── Mode pari : 'winner' (1/N/2) ou 'score' (score exact) ──
  const [betMode, setBetMode] = useState(() => localStorage.getItem('betMode_Monde') || 'winner');
  useEffect(() => { localStorage.setItem('betMode_Monde', betMode); }, [betMode]);

  // ── Pari existant ──
  const existingBet = existingProno?.find(p =>
    (p.bet_type === 'FT' || p.bet_type === 'WINNER_FT') && p.status !== 'cancelled'
  ) || null;
  const hasBet = !!existingBet;

  // ── State ──
  const [winnerChoice, setWinnerChoice] = useState(null);  // 'DOM' | 'EXT' | 'NUL'
  const [scoreDom, setScoreDom] = useState('');
  const [scoreExt, setScoreExt] = useState('');
  const [stake, setStake] = useState('10');
  const [errors, setErrors] = useState([]);
  const [saving, setSaving] = useState(false);

  // ── Préselection automatique (clic sur une cote) ──
  useEffect(() => {
    if (hasBet) return;
    if (!preselectedWinner) return;
    if (typeof preselectedWinner === 'object' && preselectedWinner.type === 'FT') {
      const choice = preselectedWinner.choice;
      const choiceMaj = choice === 'domicile' ? 'DOM'
                      : choice === 'exterieur' ? 'EXT'
                      : choice === 'nul' ? 'NUL'
                      : choice;
      setWinnerChoice(choiceMaj);
      setBetMode('winner');
    }
  }, [preselectedWinner, hasBet]);

  // ── Cote sélectionnée selon le mode ──
  const cote = useMemo(() => {
    if (!match.cotes) return null;
    if (betMode === 'winner') {
      if (winnerChoice === 'DOM') return match.cotes.cote_domicile;
      if (winnerChoice === 'EXT') return match.cotes.cote_exterieur;
      if (winnerChoice === 'NUL') return match.cotes.cote_nul;
      return null;
    } else {
      const dom = toInt(scoreDom);
      const ext = toInt(scoreExt);
      if (!scoreDom || !scoreExt) return null;
      if (dom > ext) return match.cotes.cote_domicile;
      if (ext > dom) return match.cotes.cote_exterieur;
      return match.cotes.cote_nul;
    }
  }, [betMode, winnerChoice, scoreDom, scoreExt, match.cotes]);

  const stakeNum = toInt(stake);
  const potentialWin = cote && stakeNum ? Math.floor(stakeNum * cote) : 0;

  // ── Validation ──
  const validateBet = () => {
    const errs = [];
    if (stakeNum < 10) errs.push('Mise minimum 10 jetons');
    if (stakeNum > 1000) errs.push('Mise maximum 1000 jetons');
    if (stakeNum > userCredits) errs.push(`Solde insuffisant (${userCredits} jetons disponibles)`);
    if (betMode === 'winner') {
      if (!winnerChoice) errs.push('Choisis un vainqueur (1, N ou 2)');
    } else {
      if (scoreDom === '' || scoreExt === '') {
        errs.push('Renseigne les deux scores');
      } else {
        const dom = toInt(scoreDom);
        const ext = toInt(scoreExt);
        if (dom < 0 || dom > 200) errs.push('Score domicile entre 0 et 200');
        if (ext < 0 || ext > 200) errs.push('Score extérieur entre 0 et 200');
      }
    }
    return errs;
  };

  // ── Sauvegarde ──
  const handleSubmit = async () => {
    const errs = validateBet();
    if (errs.length > 0) { setErrors(errs); return; }
    try {
      setSaving(true);
      setErrors([]);
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Non connecté');

      const body = betMode === 'winner'
        ? { match_id: match.match_id, bet_type: 'WINNER_FT', winner_predit: winnerChoice, stake: stakeNum, odds: cote }
        : { match_id: match.match_id, bet_type: 'FT', score_domicile: toInt(scoreDom), score_exterieur: toInt(scoreExt), stake: stakeNum, odds: cote };

      await axios.post(`${API_BASE}/api/monde/bets`, body, { headers: { 'x-user-id': user.id } });
      onSuccess();
    } catch (error) {
      console.error('Erreur sauvegarde MONDE:', error);
      setErrors([error.response?.data?.error || 'Erreur lors de la sauvegarde']);
    } finally {
      setSaving(false);
    }
  };

  const matchDate = new Date(match.date_match || match.date);
  const canSave = !hasBet && validateBet().length === 0 && cote != null;

  return createPortal(
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 overflow-y-auto" style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl border-2 my-8" style={{ borderColor: MONDE_GREEN }}>

        {/* Header */}
        <div className="p-4 rounded-t-xl" style={{ background: `linear-gradient(to right, ${MONDE_GREEN}, #064E3B)` }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5" style={{ color: MONDE_ACCENT }} />
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-lg font-bold text-white">
                    Placer un pari <span className="text-xs font-normal" style={{ color: MONDE_ACCENT }}>• International</span>
                  </h2>
                  <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
                    <Coins className="w-4 h-4 text-white" />
                    <span className="text-sm font-bold text-white">{userCredits}</span>
                  </div>
                </div>
                <p className="text-sm" style={{ color: MONDE_ACCENT, opacity: 0.9 }}>
                  Mise min : 10 jetons • Bonus +500 si score exact
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-white hover:bg-white/20 rounded-full p-1 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-3">

          {/* Match hors fenêtre de classement → jetons sans points */}
          {match && match.compte_points === false && (
            <div className="rounded-lg p-3 border-l-4" style={{ backgroundColor: '#FEF3C7', borderColor: '#D97706' }}>
              <p className="text-sm font-semibold" style={{ color: '#92400E' }}>⚠️ Hors période de classement</p>
              <p className="text-xs mt-0.5 leading-snug" style={{ color: '#92400E' }}>
                Ce match international ne rapporte <strong>aucun point</strong> au classement MONDE (le comptage démarre à la Nations Championship). Tu joues uniquement pour les <strong>jetons</strong>.
              </p>
            </div>
          )}

          {/* Erreurs */}
          {errors.length > 0 && (
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-3 space-y-1">
              {errors.map((err, idx) => (
                <p key={idx} className="text-sm text-red-700 font-medium flex items-start gap-2">
                  <span className="text-red-500 font-bold mt-0.5">⚠️</span>
                  <span>{err}</span>
                </p>
              ))}
            </div>
          )}

          {/* Info match */}
          <div className="rounded-lg p-3 border"
            style={{ backgroundColor: 'rgba(11,110,79,0.05)', borderColor: 'rgba(11,110,79,0.3)' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-600">
                {match.competition}
                {PHASE_FINALE(match.phase) && <span className="font-bold" style={{ color: MONDE_GREEN }}> • 🏆 {match.phase}</span>}
                {' • '}
                {matchDate.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="flex items-center gap-2">
                {domLogo && <img src={domLogo} alt={domName} className="w-6 h-6 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
                <span className="font-bold text-gray-900 text-sm">{domName}</span>
              </div>
              <span className="text-gray-400 font-semibold">vs</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900 text-sm">{extName}</span>
                {extLogo && <img src={extLogo} alt={extName} className="w-6 h-6 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
              </div>
            </div>
          </div>

          {/* Pari existant */}
          {hasBet && (
            <div className="bg-green-50 border-2 border-green-500 rounded-lg p-3">
              <p className="text-sm font-bold text-green-800 mb-1">✅ Pari déjà placé sur ce match</p>
              <p className="text-xs text-green-700">
                {existingBet.bet_type === 'WINNER_FT'
                  ? `Vainqueur prédit : ${existingBet.winner_predit === 'DOM' ? domName : existingBet.winner_predit === 'EXT' ? extName : 'Match nul'}`
                  : `Score prédit : ${existingBet.score_domicile} - ${existingBet.score_exterieur}`}
                {' '}× {existingBet.stake} jetons @ {existingBet.odds?.toFixed(2)}
              </p>
              <p className="text-xs text-green-600 mt-1">Gain potentiel : {existingBet.potential_win} jetons</p>
            </div>
          )}

          {/* Section RÉSULTAT FINAL */}
          {!hasBet && (
            <div className="border-2 rounded-lg p-3 transition-colors" style={{ borderColor: MONDE_GREEN, backgroundColor: 'white' }}>
              <div className="flex items-center gap-2 mb-1">
                <Globe className="w-4 h-4" style={{ color: MONDE_GREEN }} />
                <span className="font-bold text-sm" style={{ color: MONDE_GREEN }}>🏉 RÉSULTAT FINAL</span>
              </div>
              <p className="text-[10px] text-gray-500 italic mb-3">Pari sur le résultat final du match</p>

              {/* Toggle Vainqueur / Score exact */}
              <div className="flex gap-1 mb-3 bg-gray-100 rounded-lg p-1">
                <button type="button" onClick={() => setBetMode('winner')}
                  className="flex-1 px-3 py-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                  style={betMode === 'winner' ? { backgroundColor: MONDE_GREEN, color: 'white' } : { backgroundColor: 'transparent', color: '#6b7280' }}>
                  <Target className="w-3.5 h-3.5" />
                  Vainqueur
                </button>
                <button type="button" onClick={() => setBetMode('score')}
                  className="flex-1 px-3 py-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                  style={betMode === 'score' ? { backgroundColor: MONDE_GREEN, color: 'white' } : { backgroundColor: 'transparent', color: '#6b7280' }}>
                  <Hash className="w-3.5 h-3.5" />
                  Score exact
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-bold ml-1"
                    style={{ backgroundColor: betMode === 'score' ? 'rgba(255,255,255,0.3)' : MONDE_ACCENT, color: betMode === 'score' ? 'white' : MONDE_GREEN }}>
                    +500
                  </span>
                </button>
              </div>

              {/* Mode VAINQUEUR */}
              {betMode === 'winner' && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <button type="button" onClick={() => setWinnerChoice('DOM')}
                    className="p-2 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-1"
                    style={winnerChoice === 'DOM'
                      ? { borderColor: '#3b82f6', backgroundColor: '#eff6ff', transform: 'scale(1.05)', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }
                      : { borderColor: '#d1d5db', backgroundColor: 'white' }}>
                    <span className="text-[10px] font-bold text-gray-500">1 (Domicile)</span>
                    {domLogo && <img src={domLogo} alt={domName} className="w-7 h-7 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
                    <span className="text-[10px] font-semibold text-gray-700 truncate max-w-full">{domName}</span>
                    <span className="text-base font-bold text-blue-700">{match.cotes?.cote_domicile?.toFixed(2)}</span>
                  </button>

                  <button type="button" onClick={() => setWinnerChoice('NUL')}
                    className="p-2 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-1"
                    style={winnerChoice === 'NUL'
                      ? { borderColor: '#374151', backgroundColor: '#f3f4f6', transform: 'scale(1.05)', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }
                      : { borderColor: '#d1d5db', backgroundColor: 'white' }}>
                    <span className="text-[10px] font-bold text-gray-500">N (Nul)</span>
                    <span className="text-2xl">⚖️</span>
                    <span className="text-[10px] font-semibold text-gray-700">Match nul</span>
                    <span className="text-base font-bold text-gray-700">{match.cotes?.cote_nul?.toFixed(2) ?? '—'}</span>
                  </button>

                  <button type="button" onClick={() => setWinnerChoice('EXT')}
                    className="p-2 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-1"
                    style={winnerChoice === 'EXT'
                      ? { borderColor: '#ef4444', backgroundColor: '#fef2f2', transform: 'scale(1.05)', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }
                      : { borderColor: '#d1d5db', backgroundColor: 'white' }}>
                    <span className="text-[10px] font-bold text-gray-500">2 (Extérieur)</span>
                    {extLogo && <img src={extLogo} alt={extName} className="w-7 h-7 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
                    <span className="text-[10px] font-semibold text-gray-700 truncate max-w-full">{extName}</span>
                    <span className="text-base font-bold text-red-700">{match.cotes?.cote_exterieur?.toFixed(2)}</span>
                  </button>
                </div>
              )}

              {/* Mode SCORE EXACT */}
              {betMode === 'score' && (
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Score {domName}</label>
                    <input type="number" min="0" max="200" value={scoreDom} onChange={(e) => setScoreDom(e.target.value)} placeholder="0"
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-center text-lg font-bold focus:outline-none"
                      style={{ borderColor: scoreDom ? MONDE_GREEN : '#d1d5db' }} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Score {extName}</label>
                    <input type="number" min="0" max="200" value={scoreExt} onChange={(e) => setScoreExt(e.target.value)} placeholder="0"
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-center text-lg font-bold focus:outline-none"
                      style={{ borderColor: scoreExt ? MONDE_GREEN : '#d1d5db' }} />
                  </div>
                </div>
              )}

              {/* Mise */}
              <div className="mb-2">
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Mise (jetons)</label>
                <input type="number" min="10" max="1000" step="10" value={stake} onChange={(e) => setStake(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-center font-bold focus:outline-none"
                  style={{ borderColor: stakeNum >= 10 ? MONDE_GREEN : '#d1d5db', fontSize: '16px' }} />
              </div>

              {/* Récap */}
              {cote != null && stakeNum >= 10 && (
                <div className="rounded-lg p-3 border" style={{ backgroundColor: 'rgba(52,211,153,0.12)', borderColor: MONDE_ACCENT }}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-700">Cote :</span>
                    <span className="font-bold" style={{ color: MONDE_GREEN }}>{cote.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-700">Mise :</span>
                    <span className="font-bold">{stakeNum} jetons</span>
                  </div>
                  <div className="flex items-center justify-between text-base pt-2 border-t" style={{ borderColor: 'rgba(52,211,153,0.3)' }}>
                    <span className="font-semibold" style={{ color: MONDE_GREEN }}>Gain potentiel :</span>
                    <span className="font-bold text-lg" style={{ color: MONDE_GREEN }}>{potentialWin} jetons</span>
                  </div>
                  {betMode === 'score' && (
                    <p className="text-[10px] text-gray-600 mt-2 italic flex items-center gap-1">
                      <Sparkles className="w-3 h-3" style={{ color: MONDE_ACCENT }} />
                      +500 jetons bonus si score exact !
                    </p>
                  )}
                </div>
              )}

              {/* Prono IA */}
              {match.cotes?.score_predit_dom != null && (
                <div className="mt-2 rounded-lg p-2 border flex items-center gap-2"
                  style={{ backgroundColor: 'rgba(99, 102, 241, 0.05)', borderColor: 'rgba(99, 102, 241, 0.3)' }}>
                  <Brain className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-indigo-500 uppercase">Prédiction IA</p>
                    <p className="text-xs font-semibold text-indigo-700">
                      {match.cotes.score_predit_dom} - {match.cotes.score_predit_ext}
                      {match.cotes.confiance_algo && (
                        <span className="text-indigo-500 font-normal ml-2">({match.cotes.confiance_algo}% de confiance)</span>
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Boutons Action */}
          <div className="flex gap-2 pt-2">
            <button onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors">
              {hasBet ? 'Fermer' : 'Annuler'}
            </button>
            {!hasBet && (
              <button onClick={handleSubmit} disabled={!canSave || saving}
                className="flex-1 px-4 py-2 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: canSave && !saving ? MONDE_GREEN : '#d1d5db', color: 'white' }}>
                {saving ? 'Enregistrement...' : `Parier ${stakeNum} jetons`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
