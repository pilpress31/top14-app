// ============================================
// MODAL DE PARI - ADAPTÉ POUR USER_BETS UNIQUEMENT
// ============================================

import { useState, useRef, useEffect } from 'react';
import { Trophy, X, Coins } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import axios from 'axios';
import { getTeamData } from '../utils/teams';
import { validateBet, validateScoreInput, toInt } from '../utils/validationUtils';

export default function BettingModal({ match, existingProno, userCredits, onClose, onSuccess }) {
  // États des scores
  const [scoreDomFT, setScoreDomFT] = useState('');
  const [scoreExtFT, setScoreExtFT] = useState('');
  const [scoreDomMT, setScoreDomMT] = useState('');
  const [scoreExtMT, setScoreExtMT] = useState('');
  
  // États des mises
  const [stakeFT, setStakeFT] = useState('10');
  const [stakeMT, setStakeMT] = useState('10');
  const [betOnFT, setBetOnFT] = useState(true);
  const [betOnMT, setBetOnMT] = useState(false);
  
  // États UI
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [errorsFT, setErrorsFT] = useState([]);
  const [errorsMT, setErrorsMT] = useState([]);
  const [errorsGeneral, setErrorsGeneral] = useState([]);

  // Refs pour la navigation entre champs
  const domFTRef = useRef(null);
  const extFTRef = useRef(null);
  const domMTRef = useRef(null);
  const extMTRef = useRef(null);

  // ============================================
  // 🔥 NOUVELLE LOGIQUE : existingProno = tableau
  // ============================================

  const existingFT = existingProno?.find(p => p.bet_type === 'FT') || null;
  const existingMT = existingProno?.find(p => p.bet_type === 'MT') || null;

  const hasFT = !!existingFT;
  const hasMT = !!existingMT;

  // 🔍 DEBUG
  console.log('🎯 BettingModal - existingFT:', existingFT);
  console.log('🎯 BettingModal - existingMT:', existingMT);
  console.log('🎯 BettingModal - hasFT:', hasFT, 'hasMT:', hasMT);
  console.log("🟦 match_id du modal :", match.match_id);


  // Données équipes
  const teamDom = getTeamData(match.equipe_domicile);
  const teamExt = getTeamData(match.equipe_exterieure);

  // Date du match
  const matchDate = new Date(match.date_match || match.date);
  const showTime = matchDate.getHours() !== 0 || matchDate.getMinutes() !== 0;

  // ============================================
  // 🔥 Initialisation avec prono existant
  // ============================================
  useEffect(() => {
    if (existingFT) {
      if (existingFT.score_dom_pronos !== null) setScoreDomFT(existingFT.score_dom_pronos.toString());
      if (existingFT.score_ext_pronos !== null) setScoreExtFT(existingFT.score_ext_pronos.toString());
      setStakeFT('10');
      setBetOnFT(false);
    }

    if (existingMT) {
      if (existingMT.score_dom_mt !== null) setScoreDomMT(existingMT.score_dom_mt.toString());
      if (existingMT.score_ext_mt !== null) setScoreExtMT(existingMT.score_ext_mt.toString());
      setStakeMT('10');
      setBetOnMT(false);
    }

  }, [existingFT, existingMT]);

  // ============================================
  // 🔥 Validation en temps réel (inchangée)
  // ============================================
  useEffect(() => {
    const validation = validateBet({
      betOnFT,
      betOnMT,
      scoreDomFT,
      scoreExtFT,
      scoreDomMT,
      scoreExtMT,
      stakeFT,
      stakeMT,
      userCredits,
      hasFT,
      hasMT
    });

    setValidationErrors(validation.allMessages);

    const ftErrors = validation.allMessages.filter(err => {
      if (err.field?.includes('FT') || err.field === 'scoreFT') return true;
      if (err.message.includes('FT') || err.message.includes('Temps Plein')) return true;
      if (err.type === 'stake' && betOnFT && !betOnMT && !err.message.includes('MT')) return true;
      return false;
    });

    const mtErrors = validation.allMessages.filter(err => {
      if (err.field?.includes('MT') || err.field === 'scoreMT') return true;
      if (err.message.includes('MT') || err.message.includes('Mi-temps')) return true;
      if (err.type === 'stake' && betOnMT && !betOnFT && !err.message.includes('FT')) return true;
      return false;
    });

    const coherenceErrors = validation.allMessages.filter(err => err.type === 'coherence');

    const generalErrors = validation.allMessages.filter(err => {
      if (err.type === 'credits') return true;
      if (err.type === 'missing') return true;
      if (err.type === 'stake' && betOnFT && betOnMT && !err.message.includes('FT') && !err.message.includes('MT')) return true;
      
      const isFT = err.field?.includes('FT') || err.field === 'scoreFT' || err.message.includes('FT');
      const isMT = err.field?.includes('MT') || err.field === 'scoreMT' || err.message.includes('MT');
      const isCoherence = err.type === 'coherence';
      
      return !isFT && !isMT && !isCoherence;
    });

    setErrorsFT([...ftErrors, ...coherenceErrors]);
    setErrorsMT(mtErrors);
    setErrorsGeneral(generalErrors);

  }, [betOnFT, betOnMT, scoreDomFT, scoreExtFT, scoreDomMT, scoreExtMT, stakeFT, stakeMT, userCredits, hasFT, hasMT]);

  const handleScoreBlur = (score, field, refToFocus) => {
    const error = validateScoreInput(score, field);
    if (error) {
      setTimeout(() => refToFocus?.current?.focus(), 100);
    }
  };

  // Calcul des cotes
  const getCoteFT = () => {
    if (!scoreDomFT || !scoreExtFT || !match.cotes) return null;
    const dom = toInt(scoreDomFT);
    const ext = toInt(scoreExtFT);
    if (dom === null || ext === null) return null;
    if (dom > ext) return match.cotes.cote_domicile;
    if (ext > dom) return match.cotes.cote_exterieur;
    return match.cotes.cote_nul;
  };

  const getCoteMT = () => {
    if (!scoreDomMT || !scoreExtMT || !match.cotes) return null;
    const dom = toInt(scoreDomMT);
    const ext = toInt(scoreExtMT);
    if (dom === null || ext === null) return null;
    if (dom > ext) return match.cotes.cote_mt_domicile;
    if (ext > dom) return match.cotes.cote_mt_exterieur;
    return match.cotes.cote_mt_nul;
  };

  const coteFT = getCoteFT();
  const coteMT = getCoteMT();

  const potentialWinFT = coteFT && stakeFT ? Math.floor(toInt(stakeFT) * coteFT) : 0;
  const potentialWinMT = coteMT && stakeMT ? Math.floor(toInt(stakeMT) * coteMT) : 0;
  const totalPotentialWin = (betOnFT ? potentialWinFT : 0) + (betOnMT ? potentialWinMT : 0);

  const totalStake = 
    (betOnFT && !hasFT ? toInt(stakeFT) || 0 : 0) +
    (betOnMT && !hasMT ? toInt(stakeMT) || 0 : 0);

  // ============================================
  // ✅ FONCTION DE SAUVEGARDE - USER_BETS UNIQUEMENT
  // ============================================
  const handleSave = async () => {
    const validation = validateBet({
      betOnFT, betOnMT, scoreDomFT, scoreExtFT, scoreDomMT, scoreExtMT,
      stakeFT, stakeMT, userCredits, hasFT, hasMT
    });

    if (!validation.isValid) {
      return;
    }

    try {
      setSaving(true);
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Non connecté');

      const dFT = toInt(scoreDomFT);
      const eFT = toInt(scoreExtFT);
      const dMT = toInt(scoreDomMT);
      const eMT = toInt(scoreExtMT);
      const stakeFTNum = betOnFT ? toInt(stakeFT) : 0;
      const stakeMTNum = betOnMT ? toInt(stakeMT) : 0;

      // ✅ Créer les paris dans user_bets via l'API
      // L'API s'occupe de tout : déduction des jetons, création dans user_bets, transactions
      
      if (betOnFT && !hasFT) {
        await axios.post(`${import.meta.env.VITE_API_URL}/bets`, {
          match_id: match.match_id,
          bet_type: 'FT',
          score_domicile: dFT,
          score_exterieur: eFT,
          stake: stakeFTNum
        }, { headers: { 'x-user-id': user.id } });
      }

      if (betOnMT && !hasMT) {
        await axios.post(`${import.meta.env.VITE_API_URL}/bets`, {
          match_id: match.match_id,
          bet_type: 'MT',
          score_domicile: dMT,
          score_exterieur: eMT,
          stake: stakeMTNum
        }, { headers: { 'x-user-id': user.id } });
      }

      onSuccess();
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      setErrorsGeneral([{
        type: 'error',
        message: error.response?.data?.error || 'Erreur lors de la sauvegarde'
      }]);
    } finally {
      setSaving(false);
    }
  };

  
  const blockingErrors = validationErrors.filter(e => e.type !== 'warning');
  const canSave = blockingErrors.length === 0 && totalStake >= 10 && totalStake <= userCredits;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl border-2 border-rugby-gold my-8">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-rugby-gold to-rugby-bronze p-4 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trophy className="w-5 h-5 text-white" />
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-lg font-bold text-white">Placer un pari</h2>
                    <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
                      <Coins className="w-4 h-4 text-white" />
                      <span className="text-sm font-bold text-white">{userCredits}</span>
                    </div>
                  </div>
                  <p className="text-sm text-white/80">Mise min : 10 jetons par pari</p>
                </div>
              </div>
              <button onClick={onClose} className="text-white hover:bg-white/20 rounded-full p-1 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-3">
            
            {/* Erreurs générales */}
            {errorsGeneral.length > 0 && (
              <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-3 space-y-1">
                {errorsGeneral.map((err, idx) => (
                  <p key={idx} className="text-sm text-red-700 font-medium flex items-start gap-2">
                    <span className="text-red-500 font-bold mt-0.5">⚠️</span>
                    <span>{err.message}</span>
                  </p>
                ))}
              </div>
            )}

            {/* Info match */}
            <div className="bg-rugby-gold/10 rounded-lg p-3 border border-rugby-gold/30">
              <p className="text-xs text-gray-600 mb-2">
                {match.journee} • {matchDate.toLocaleDateString('fr-FR', {
                  weekday: 'short', day: 'numeric', month: 'short'
                })}
                {showTime && ` • ${matchDate.toLocaleTimeString('fr-FR', {
                  hour: '2-digit', minute: '2-digit'
                })}`}
              </p>
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

            {/* Section TEMPS PLEIN */}
            <div className={`border-2 rounded-lg p-2 transition-colors ${
              betOnFT ? 'border-rugby-gold bg-white' : 'border-gray-300 bg-gray-50'
            }`}>
              <div className="flex items-start justify-between mb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={betOnFT}
                    disabled={hasFT}
                    onChange={(e) => setBetOnFT(e.target.checked)}
                    className="w-4 h-4 text-rugby-gold focus:ring-rugby-gold"
                  />
                  <span className={`font-bold text-sm ${betOnFT ? 'text-gray-900' : 'text-gray-500'}`}>
                    🏉 TEMPS PLEIN (80 min)
                  </span>
                </label>
              </div>

              {errorsFT.length > 0 && (
                <div className="bg-red-50 border-l-4 border-red-500 rounded p-2 mb-2 space-y-1">
                  {errorsFT.map((err, idx) => (
                    <p key={idx} className="text-xs text-red-700 font-medium flex items-start gap-1.5">
                      <span className="text-red-500 font-bold mt-0.5">⚠️</span>
                      <span>{err.message}</span>
                    </p>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 items-start mb-1">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-700 mb-1 text-center truncate">
                    {teamDom.name}
                  </label>
                  <input
                    ref={domFTRef}
                    type="text"
                    inputMode="numeric"
                    maxLength="2"
                    value={scoreDomFT}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                      setScoreDomFT(val);
                      if (val.length === 2) extFTRef.current?.focus();
                    }}
                    onBlur={() => handleScoreBlur(scoreDomFT, 'scoreDomFT', domFTRef)}
                    onFocus={(e) => e.target.select()}
                    disabled={hasFT || !betOnFT}
                    className="w-full px-2 py-2 border-2 border-rugby-gray rounded-lg text-center text-lg font-bold focus:ring-2 focus:ring-rugby-gold focus:border-rugby-gold disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-700 mb-1 text-center truncate">
                    {teamExt.name}
                  </label>
                  <input
                    ref={extFTRef}
                    type="text"
                    inputMode="numeric"
                    maxLength="2"
                    value={scoreExtFT}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                      setScoreExtFT(val);
                    }}
                    onBlur={() => handleScoreBlur(scoreExtFT, 'scoreExtFT', extFTRef)}
                    onFocus={(e) => e.target.select()}
                    disabled={hasFT || !betOnFT}
                    className="w-full px-2 py-2 border-2 border-rugby-gray rounded-lg text-center text-lg font-bold focus:ring-2 focus:ring-rugby-gold focus:border-rugby-gold disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="0"
                  />
                </div>

                {match.cotes?.score_predit_dom && (
                  <div className="flex flex-col items-center justify-start">
                    <p className="text-xs font-semibold text-gray-700 mb-0.5 text-center">Prono IA</p>
                    <p className="text-base font-bold text-gray-800 text-center">
                      💡 {match.cotes.score_predit_dom}-{match.cotes.score_predit_ext}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 items-end -mt-6 mb-1">
                <div className="col-span-2 flex justify-center gap-2">
                  <div className="bg-blue-100 rounded h-6 w-24 flex items-center justify-center">
                    <span className="text-xs font-mono font-bold text-blue-900">
                      {match.cotes?.cote_domicile?.toFixed(2)}
                    </span>
                  </div>
                  <div className="bg-white border border-gray-300 rounded h-6 w-24 flex items-center justify-center">
                    <span className="text-xs font-mono font-bold text-black">
                      {match.cotes?.cote_nul?.toFixed(2)}
                    </span>
                  </div>
                  <div className="bg-red-100 rounded h-6 w-24 flex items-center justify-center">
                    <span className="text-xs font-mono font-bold text-red-600">
                      {match.cotes?.cote_exterieur?.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="w-24 flex flex-col items-center justify-end">
                  <div className="w-full h-12 flex flex-col items-center justify-start border-2 border-rugby-gray rounded-lg focus-within:ring-2 focus-within:ring-rugby-gold focus-within:border-rugby-gold">
                    <span className="text-[10px] font-semibold text-gray-700">Mise</span>
                    <input
                      type="number"
                      min="0"
                      value={stakeFT}
                      onChange={(e) => setStakeFT(e.target.value)}
                      onFocus={(e) => e.target.select()}
                      disabled={hasFT || !betOnFT}
                      className="w-full text-center text-sm font-bold disabled:bg-gray-100 disabled:cursor-not-allowed border-none focus:outline-none focus:ring-0"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {betOnFT && coteFT && (
                <div className="bg-green-50 rounded p-2 text-xs">
                  <span className="text-green-700">💎 Gain: </span>
                  <span className="font-bold text-green-600">{potentialWinFT} jetons</span>
                  <span className="text-green-600"> (×{coteFT.toFixed(2)})</span>
                </div>
              )}
            </div>

            {/* Section MI-TEMPS */}
            <div className={`border-2 rounded-lg p-2 transition-colors ${
              betOnMT ? 'border-rugby-gold bg-white' : 'border-gray-300 bg-gray-50'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={betOnMT}
                    disabled={hasMT}
                    onChange={(e) => setBetOnMT(e.target.checked)}
                    className="w-4 h-4 text-rugby-gold focus:ring-rugby-gold"
                  />
                  <span className={`font-bold text-sm ${betOnMT ? 'text-gray-900' : 'text-gray-500'}`}>
                    ⏱️ MI-TEMPS (40 min)
                  </span>
                </label>
              </div>

              {errorsMT.length > 0 && (
                <div className="bg-red-50 border-l-4 border-red-500 rounded p-2 mb-2 space-y-1">
                  {errorsMT.map((err, idx) => (
                    <p key={idx} className="text-xs text-red-700 font-medium flex items-start gap-1.5">
                      <span className="text-red-500 font-bold mt-0.5">⚠️</span>
                      <span>{err.message}</span>
                    </p>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 items-start mb-1">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-700 mb-1 text-center truncate">
                    {teamDom.name}
                  </label>
                  <input
                    ref={domMTRef}
                    type="text"
                    inputMode="numeric"
                    maxLength="2"
                    value={scoreDomMT}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                      setScoreDomMT(val);
                      if (val.length === 2) extMTRef.current?.focus();
                    }}
                    onBlur={() => handleScoreBlur(scoreDomMT, 'scoreDomMT', domMTRef)}
                    onFocus={(e) => e.target.select()}
                    disabled={hasMT || !betOnMT}
                    className="w-full px-2 py-2 border-2 border-rugby-gray rounded-lg text-center text-lg font-bold focus:ring-2 focus:ring-rugby-gold focus:border-rugby-gold disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-700 mb-1 text-center truncate">
                    {teamExt.name}
                  </label>
                  <input
                    ref={extMTRef}
                    type="text"
                    inputMode="numeric"
                    maxLength="2"
                    value={scoreExtMT}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                      setScoreExtMT(val);
                    }}
                    onBlur={() => handleScoreBlur(scoreExtMT, 'scoreExtMT', extMTRef)}
                    onFocus={(e) => e.target.select()}
                    disabled={hasMT || !betOnMT}
                    className="w-full px-2 py-2 border-2 border-rugby-gray rounded-lg text-center text-lg font-bold focus:ring-2 focus:ring-rugby-gold focus:border-rugby-gold disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="0"
                  />
                </div>

                {match.cotes?.score_predit_mt_dom && (
                  <div className="flex flex-col items-center justify-start">
                    <p className="text-xs font-semibold text-gray-700 mb-0.5 text-center">Prono IA</p>
                    <p className="text-base font-bold text-gray-800 text-center">
                      💡 {match.cotes.score_predit_mt_dom}-{match.cotes.score_predit_mt_ext}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 items-end -mt-6 mb-1">
                <div className="col-span-2 flex justify-center gap-2">
                  <div className="bg-blue-100 rounded h-6 w-24 flex items-center justify-center">
                    <span className="text-xs font-mono font-bold text-blue-900">
                      {match.cotes?.cote_mt_domicile?.toFixed(2)}
                    </span>
                  </div>
                  <div className="bg-white border border-gray-300 rounded h-6 w-24 flex items-center justify-center">
                    <span className="text-xs font-mono font-bold text-black">
                      {match.cotes?.cote_mt_nul?.toFixed(2)}
                    </span>
                  </div>
                  <div className="bg-red-100 rounded h-6 w-24 flex items-center justify-center">
                    <span className="text-xs font-mono font-bold text-red-600">
                      {match.cotes?.cote_mt_exterieur?.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="w-24 flex flex-col items-center justify-end">
                  <div className="w-full h-12 flex flex-col items-center justify-start border-2 border-rugby-gray rounded-lg focus-within:ring-2 focus-within:ring-rugby-gold focus-within:border-rugby-gold">
                    <span className="text-[10px] font-semibold text-gray-700">Mise</span>
                    <input
                      type="number"
                      min="0"
                      value={stakeMT}
                      onChange={(e) => setStakeMT(e.target.value)}
                      onFocus={(e) => e.target.select()}
                      disabled={hasMT || !betOnMT}
                      className="w-full text-center text-sm font-bold disabled:bg-gray-100 disabled:cursor-not-allowed border-none focus:outline-none focus:ring-0"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {betOnMT && coteMT && (
                <div className="bg-green-50 rounded p-2 text-xs">
                  <span className="text-green-700">💎 Gain: </span>
                  <span className="font-bold text-green-600">{potentialWinMT} jetons</span>
                  <span className="text-green-600"> (×{coteMT.toFixed(2)})</span>
                </div>
              )}
            </div>

            {/* Résumé */}
            <div className="bg-rugby-gold/10 rounded-lg p-2.5 border border-rugby-gold/30">
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold">Gains potentiels:</span>
                <span className="font-bold text-green-600">{totalPotentialWin} jetons</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="font-semibold">Restant:</span>
                <span className="font-bold">{userCredits - totalStake} jetons</span>
              </div>
            </div>

            {/* Boutons */}
            <div className="flex gap-2">
              <button
                onClick={onClose}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 font-semibold text-sm"
              >
                Annuler
              </button>

              <button
                onClick={handleSave}
                disabled={saving || !canSave}
                className={`flex-1 px-4 py-3 rounded-lg font-semibold text-sm shadow-md transition-colors ${
                  saving || !canSave
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-rugby-gold text-white hover:bg-rugby-bronze"
                }`}
              >
                {saving ? "Validation..." : `Valider (${totalStake} jetons)`}
              </button>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}