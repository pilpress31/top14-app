// ============================================================
// BettingModalHcup.jsx
// Modal pour placer un pari Champions Cup
// ============================================================
// Différences avec BettingModal.jsx (Top14/D2) :
// - FT uniquement (pas de mi-temps)
// - winner_predit en MAJUSCULES côté backend (DOM/EXT/NUL)
// - Couleurs HCup (bleu EPCR + or)
// - Modal simplifié (pas de section MT)
// - Endpoint : /api/hcup/bets
// ============================================================

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Trophy, Coins, Target, Hash, Brain, Sparkles } from 'lucide-react';
import axios from 'axios';
import { supabase } from '../lib/supabaseClient';
import { getTeamData } from '../utils/teams';
import { getCharte } from '../constants/chartes';

const API_BASE = 'https://top14-api-production.up.railway.app';

// Couleurs charte HCup — centralisées dans src/constants/chartes.js
const { bleu: HCUP_BLUE, or: HCUP_GOLD } = getCharte('hcup').base;

const toInt = (v) => parseInt(v) || 0;

export default function BettingModalHcup({ match, existingProno, userCredits, preselectedWinner = null, onClose, onSuccess }) {
  const teamDom = getTeamData(match.equipe_domicile);
  const teamExt = getTeamData(match.equipe_exterieure);

  // ── Mode pari : 'winner' (1/N/2) ou 'score' (score exact) ──
  // Persistance dans localStorage (clé HCup spécifique)
  const [betMode, setBetMode] = useState(() => {
    return localStorage.getItem('betMode_HCup') || 'winner';
  });
  useEffect(() => {
    localStorage.setItem('betMode_HCup', betMode);
  }, [betMode]);

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

  // ── Préselection automatique ──
  useEffect(() => {
    if (hasBet) return;
    if (!preselectedWinner) return;

    // Format objet { type, choice }
    if (typeof preselectedWinner === 'object' && preselectedWinner.type === 'FT') {
      const choice = preselectedWinner.choice;
      // Normaliser en MAJUSCULES (le backend attend DOM/EXT/NUL)
      const choiceMaj = choice === 'domicile' ? 'DOM'
                      : choice === 'exterieur' ? 'EXT'
                      : choice === 'nul' ? 'NUL'
                      : choice;  // déjà en majuscules
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
      // Mode score exact : la cote dépend du vainqueur déduit du score
      const dom = toInt(scoreDom);
      const ext = toInt(scoreExt);
      if (!scoreDom || !scoreExt) return null;
      if (dom > ext) return match.cotes.cote_domicile;
      if (ext > dom) return match.cotes.cote_exterieur;
      return match.cotes.cote_nul;
    }
  }, [betMode, winnerChoice, scoreDom, scoreExt, match.cotes]);

  // ── Gain potentiel ──
  const stakeNum = toInt(stake);
  const potentialWin = cote && stakeNum ? Math.floor(stakeNum * cote) : 0;

  // ── Validation en live ──
  const validateBet = () => {
    const errs = [];

    if (stakeNum < 10) {
      errs.push('Mise minimum 10 jetons');
    }
    if (stakeNum > 1000) {
      errs.push('Mise maximum 1000 jetons');
    }
    if (stakeNum > userCredits) {
      errs.push(`Solde insuffisant (${userCredits} jetons disponibles)`);
    }

    if (betMode === 'winner') {
      if (!winnerChoice) {
        errs.push('Choisis un vainqueur (1, N ou 2)');
      }
    } else {
      // Mode score
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

  // ── Sauvegarde du pari ──
  const handleSubmit = async () => {
    const errs = validateBet();
    if (errs.length > 0) {
      setErrors(errs);
      return;
    }

    try {
      setSaving(true);
      setErrors([]);

      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Non connecté');

      let body;
      if (betMode === 'winner') {
        body = {
          match_id: match.match_id,
          bet_type: 'WINNER_FT',
          winner_predit: winnerChoice,  // DOM/EXT/NUL
          stake: stakeNum,
          odds: cote,
        };
      } else {
        body = {
          match_id: match.match_id,
          bet_type: 'FT',
          score_domicile: toInt(scoreDom),
          score_exterieur: toInt(scoreExt),
          stake: stakeNum,
          odds: cote,
        };
      }

      await axios.post(`${API_BASE}/api/hcup/bets`, body, {
        headers: { 'x-user-id': user.id }
      });

      onSuccess();
    } catch (error) {
      console.error('Erreur sauvegarde HCup:', error);
      setErrors([
        error.response?.data?.error || 'Erreur lors de la sauvegarde'
      ]);
    } finally {
      setSaving(false);
    }
  };

  // ── Date du match ──
  const matchDate = new Date(match.date_match || match.date);
  const showTime = matchDate.getHours() !== 0 || matchDate.getMinutes() !== 0;

  // ── Phase finale ? (pour le texte d'avertissement prolongation) ──
  const isPhaseFinale = match.phase === 'Phase finale'
    || (match.round && !match.round.startsWith('Poule'));

  // ── Validité ──
  const canSave = !hasBet && validateBet().length === 0 && cote != null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 overflow-y-auto"
      style={{ zIndex: 9999 }}
    >
      <div
        className="bg-white rounded-xl max-w-lg w-full shadow-2xl border-2 my-8"
        style={{ borderColor: HCUP_BLUE }}
      >

        {/* Header */}
        <div
          className="p-4 rounded-t-xl"
          style={{ background: `linear-gradient(to right, ${HCUP_BLUE}, #002a5c)` }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="w-5 h-5" style={{ color: HCUP_GOLD }} />
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-lg font-bold text-white">
                    Placer un pari <span className="text-xs font-normal" style={{ color: HCUP_GOLD }}>• Champions Cup</span>
                  </h2>
                  <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
                    <Coins className="w-4 h-4 text-white" />
                    <span className="text-sm font-bold text-white">{userCredits}</span>
                  </div>
                </div>
                <p className="text-sm" style={{ color: HCUP_GOLD, opacity: 0.85 }}>
                  Mise min : 10 jetons • Bonus +500 si score exact
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-3">

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
          <div
            className="rounded-lg p-3 border"
            style={{
              backgroundColor: 'rgba(0, 62, 126, 0.05)',
              borderColor: 'rgba(0, 62, 126, 0.3)',
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-600">
                {match.round || match.phase}
                {' • '}
                {matchDate.toLocaleDateString('fr-FR', {
                  weekday: 'short', day: 'numeric', month: 'short'
                })}
                {showTime && ` • ${matchDate.toLocaleTimeString('fr-FR', {
                  hour: '2-digit', minute: '2-digit'
                })}`}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="flex items-center gap-2">
                <img src={teamDom.logo} alt={teamDom.name} className="w-6 h-6 object-contain"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                <span className="font-bold text-gray-900 text-sm">{teamDom.name}</span>
              </div>
              <span className="text-gray-400 font-semibold">vs</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900 text-sm">{teamExt.name}</span>
                <img src={teamExt.logo} alt={teamExt.name} className="w-6 h-6 object-contain"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              </div>
            </div>
          </div>

          {/* Pari existant — afficher état non modifiable */}
          {hasBet && (
            <div className="bg-green-50 border-2 border-green-500 rounded-lg p-3">
              <p className="text-sm font-bold text-green-800 mb-1">
                ✅ Pari déjà placé sur ce match
              </p>
              <p className="text-xs text-green-700">
                {existingBet.bet_type === 'WINNER_FT'
                  ? `Vainqueur prédit : ${existingBet.winner_predit === 'DOM' ? teamDom.name : existingBet.winner_predit === 'EXT' ? teamExt.name : 'Match nul'}`
                  : `Score prédit : ${existingBet.score_domicile} - ${existingBet.score_exterieur}`}
                {' '}× {existingBet.stake} jetons @ {existingBet.odds?.toFixed(2)}
              </p>
              <p className="text-xs text-green-600 mt-1">
                Gain potentiel : {existingBet.potential_win} jetons
              </p>
            </div>
          )}

          {/* ═══════════════════════════════════════════
              Section TEMPS PLEIN
              ═══════════════════════════════════════════ */}
          {!hasBet && (
            <div
              className="border-2 rounded-lg p-3 transition-colors"
              style={{ borderColor: HCUP_BLUE, backgroundColor: 'white' }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="w-4 h-4" style={{ color: HCUP_BLUE }} />
                <span className="font-bold text-sm" style={{ color: HCUP_BLUE }}>
                  🏉 RÉSULTAT FINAL
                </span>
              </div>

              {/* 🆕 Précision : pari basé sur score à 80 min (important pour phases finales) */}
              <p className="text-[10px] text-gray-500 italic mb-3">
                {isPhaseFinale
                  ? 'Pari basé sur le score à 80 min, hors prolongation'
                  : 'Pari basé sur le score à 80 min de jeu'}
              </p>

              {/* Toggle Score / Vainqueur */}
              <div className="flex gap-1 mb-3 bg-gray-100 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setBetMode('winner')}
                  className="flex-1 px-3 py-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                  style={
                    betMode === 'winner'
                      ? { backgroundColor: HCUP_BLUE, color: 'white' }
                      : { backgroundColor: 'transparent', color: '#6b7280' }
                  }
                >
                  <Target className="w-3.5 h-3.5" />
                  Vainqueur
                </button>
                <button
                  type="button"
                  onClick={() => setBetMode('score')}
                  className="flex-1 px-3 py-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                  style={
                    betMode === 'score'
                      ? { backgroundColor: HCUP_BLUE, color: 'white' }
                      : { backgroundColor: 'transparent', color: '#6b7280' }
                  }
                >
                  <Hash className="w-3.5 h-3.5" />
                  Score exact
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded font-bold ml-1"
                    style={{
                      backgroundColor: betMode === 'score' ? 'rgba(255,255,255,0.3)' : HCUP_GOLD,
                      color: betMode === 'score' ? 'white' : HCUP_BLUE,
                    }}
                  >
                    +500
                  </span>
                </button>
              </div>

              {/* Mode VAINQUEUR : boutons 1/N/2 */}
              {betMode === 'winner' && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {/* Bouton DOMICILE (1) */}
                  <button
                    type="button"
                    onClick={() => setWinnerChoice('DOM')}
                    className="p-2 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-1"
                    style={
                      winnerChoice === 'DOM'
                        ? { borderColor: '#3b82f6', backgroundColor: '#eff6ff', transform: 'scale(1.05)', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }
                        : { borderColor: '#d1d5db', backgroundColor: 'white' }
                    }
                  >
                    <span className="text-[10px] font-bold text-gray-500">1 (Domicile)</span>
                    <img src={teamDom.logo} alt={teamDom.name} className="w-7 h-7 object-contain"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    <span className="text-[10px] font-semibold text-gray-700 truncate max-w-full">
                      {teamDom.name}
                    </span>
                    <span className="text-base font-bold text-blue-700">
                      {match.cotes?.cote_domicile?.toFixed(2)}
                    </span>
                  </button>

                  {/* Bouton NUL (N) */}
                  <button
                    type="button"
                    onClick={() => setWinnerChoice('NUL')}
                    className="p-2 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-1"
                    style={
                      winnerChoice === 'NUL'
                        ? { borderColor: '#374151', backgroundColor: '#f3f4f6', transform: 'scale(1.05)', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }
                        : { borderColor: '#d1d5db', backgroundColor: 'white' }
                    }
                  >
                    <span className="text-[10px] font-bold text-gray-500">N (Nul)</span>
                    <span className="text-2xl">⚖️</span>
                    <span className="text-[10px] font-semibold text-gray-700">Match nul</span>
                    <span className="text-base font-bold text-gray-700">
                      {match.cotes?.cote_nul?.toFixed(2) ?? '—'}
                    </span>
                  </button>

                  {/* Bouton EXTÉRIEUR (2) */}
                  <button
                    type="button"
                    onClick={() => setWinnerChoice('EXT')}
                    className="p-2 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-1"
                    style={
                      winnerChoice === 'EXT'
                        ? { borderColor: '#ef4444', backgroundColor: '#fef2f2', transform: 'scale(1.05)', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }
                        : { borderColor: '#d1d5db', backgroundColor: 'white' }
                    }
                  >
                    <span className="text-[10px] font-bold text-gray-500">2 (Extérieur)</span>
                    <img src={teamExt.logo} alt={teamExt.name} className="w-7 h-7 object-contain"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    <span className="text-[10px] font-semibold text-gray-700 truncate max-w-full">
                      {teamExt.name}
                    </span>
                    <span className="text-base font-bold text-red-700">
                      {match.cotes?.cote_exterieur?.toFixed(2)}
                    </span>
                  </button>
                </div>
              )}

              {/* Mode SCORE EXACT : 2 inputs */}
              {betMode === 'score' && (
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">
                      Score {teamDom.name}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="200"
                      value={scoreDom}
                      onChange={(e) => setScoreDom(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-center text-lg font-bold focus:outline-none"
                      style={{ borderColor: scoreDom ? HCUP_BLUE : '#d1d5db' }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">
                      Score {teamExt.name}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="200"
                      value={scoreExt}
                      onChange={(e) => setScoreExt(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-center text-lg font-bold focus:outline-none"
                      style={{ borderColor: scoreExt ? HCUP_BLUE : '#d1d5db' }}
                    />
                  </div>
                </div>
              )}

              {/* Mise */}
              <div className="mb-2">
                <label className="text-xs font-semibold text-gray-600 mb-1 block">
                  Mise (jetons)
                </label>
                <input
                  type="number"
                  min="10"
                  max="1000"
                  step="10"
                  value={stake}
                  onChange={(e) => setStake(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-center font-bold focus:outline-none"
                  style={{ borderColor: stakeNum >= 10 ? HCUP_BLUE : '#d1d5db', fontSize: '16px' }}
                />
              </div>

              {/* Récap */}
              {cote != null && stakeNum >= 10 && (
                <div
                  className="rounded-lg p-3 border"
                  style={{
                    backgroundColor: 'rgba(255, 199, 44, 0.1)',
                    borderColor: HCUP_GOLD,
                  }}
                >
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-700">Cote :</span>
                    <span className="font-bold" style={{ color: HCUP_BLUE }}>
                      {cote.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-700">Mise :</span>
                    <span className="font-bold">{stakeNum} jetons</span>
                  </div>
                  <div
                    className="flex items-center justify-between text-base pt-2 border-t"
                    style={{ borderColor: 'rgba(255, 199, 44, 0.3)' }}
                  >
                    <span className="font-semibold" style={{ color: HCUP_BLUE }}>
                      Gain potentiel :
                    </span>
                    <span className="font-bold text-lg" style={{ color: HCUP_BLUE }}>
                      {potentialWin} jetons
                    </span>
                  </div>
                  {betMode === 'score' && (
                    <p className="text-[10px] text-gray-600 mt-2 italic flex items-center gap-1">
                      <Sparkles className="w-3 h-3" style={{ color: HCUP_GOLD }} />
                      +500 jetons bonus si score exact !
                    </p>
                  )}
                </div>
              )}

              {/* Prono IA */}
              {match.cotes?.score_predit_dom != null && (
                <div
                  className="mt-2 rounded-lg p-2 border flex items-center gap-2"
                  style={{
                    backgroundColor: 'rgba(99, 102, 241, 0.05)',
                    borderColor: 'rgba(99, 102, 241, 0.3)',
                  }}
                >
                  <Brain className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-indigo-500 uppercase">Prédiction IA</p>
                    <p className="text-xs font-semibold text-indigo-700">
                      {match.cotes.score_predit_dom} - {match.cotes.score_predit_ext}
                      {match.cotes.confiance_algo && (
                        <span className="text-indigo-500 font-normal ml-2">
                          ({match.cotes.confiance_algo}% de confiance)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Boutons Action */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
            >
              {hasBet ? 'Fermer' : 'Annuler'}
            </button>
            {!hasBet && (
              <button
                onClick={handleSubmit}
                disabled={!canSave || saving}
                className="flex-1 px-4 py-2 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: canSave && !saving ? HCUP_BLUE : '#d1d5db',
                  color: 'white',
                }}
              >
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
