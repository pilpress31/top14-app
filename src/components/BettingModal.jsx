// ============================================
// MODAL DE PARI
// Support Top 14 (FT + MT, chacun en mode Score ou Vainqueur)
// Support Pro D2 (FT uniquement, mode Score ou Vainqueur)
// ============================================

import { useState, useRef, useEffect } from 'react';
import { Trophy, X, Coins, Target, Hash } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import axios from 'axios';
import { getTeamData } from '../utils/teams';
import { validateBet, validateScoreInput, toInt } from '../utils/validationUtils';

const API_BASE = 'https://top14-api-production.up.railway.app';

export default function BettingModal({ match, existingProno, userCredits, isD2 = false, preselectedWinner = null, onClose, onSuccess }) {
  // 🆕 Mode de pari pour FT — 'score' (saisie scores) ou 'winner' (1/N/2)
  // Disponible en D2 ET Top 14
  // Mémorisé en localStorage (clé séparée par championnat)
  const [betModeFT, setBetModeFT] = useState(() => {
    if (typeof window === 'undefined') return 'winner';
    const key = isD2 ? 'betModeFT_D2' : 'betModeFT_T14';
    return localStorage.getItem(key) || 'winner';
  });

  // 🆕 Mode de pari pour MT — Top 14 uniquement
  const [betModeMT, setBetModeMT] = useState(() => {
    if (typeof window === 'undefined') return 'winner';
    if (isD2) return 'score'; // Pas utilisé en D2
    return localStorage.getItem('betModeMT_T14') || 'winner';
  });

  // 🆕 choix vainqueur ('domicile' | 'nul' | 'exterieur') quand mode='winner'
  const [winnerChoiceFT, setWinnerChoiceFT] = useState(null);
  const [winnerChoiceMT, setWinnerChoiceMT] = useState(null);

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

  // Refs
  const domFTRef = useRef(null);
  const extFTRef = useRef(null);
  const domMTRef = useRef(null);
  const extMTRef = useRef(null);

  // ============================================
  // Pari existant (format tableau)
  // 🆕 On considère FT + WINNER_FT comme "même slot FT"
  //         et MT + WINNER_MT comme "même slot MT"
  // ============================================
  const existingFT = existingProno?.find(p => p.bet_type === 'FT' || p.bet_type === 'WINNER_FT') || null;
  const existingMT = isD2 ? null : (existingProno?.find(p => p.bet_type === 'MT' || p.bet_type === 'WINNER_MT') || null);

  const hasFT = !!existingFT;
  const hasMT = !!existingMT;

  // Données équipes
  const teamDom = getTeamData(match.equipe_domicile);
  const teamExt = getTeamData(match.equipe_exterieure);

  // Date du match
  const matchDate = new Date(match.date_match || match.date);
  const showTime = matchDate.getHours() !== 0 || matchDate.getMinutes() !== 0;

  // ============================================
  // Initialisation avec prono existant
  // ============================================
  useEffect(() => {
    if (existingFT) {
      if (existingFT.score_dom_pronos != null) setScoreDomFT(existingFT.score_dom_pronos.toString());
      else if (existingFT.score_domicile != null) setScoreDomFT(existingFT.score_domicile.toString());
      if (existingFT.score_ext_pronos != null) setScoreExtFT(existingFT.score_ext_pronos.toString());
      else if (existingFT.score_exterieur != null) setScoreExtFT(existingFT.score_exterieur.toString());
      setStakeFT('10');
      setBetOnFT(false);
    }

    if (existingMT) {
      if (existingMT.score_dom_mt != null) setScoreDomMT(existingMT.score_dom_mt.toString());
      if (existingMT.score_ext_mt != null) setScoreExtMT(existingMT.score_ext_mt.toString());
      setStakeMT('10');
      setBetOnMT(false);
    }

    // ✅ En Pro D2 : jamais de pari MT
    if (isD2) {
      setBetOnMT(false);
    }
  }, [existingFT, existingMT, isD2]);

  // 🆕 Persister les modes en localStorage à chaque changement
  useEffect(() => {
    const key = isD2 ? 'betModeFT_D2' : 'betModeFT_T14';
    localStorage.setItem(key, betModeFT);
  }, [betModeFT, isD2]);

  useEffect(() => {
    if (!isD2) {
      localStorage.setItem('betModeMT_T14', betModeMT);
    }
  }, [betModeMT, isD2]);

  // 🆕 Pré-sélection du vainqueur si l'user a cliqué sur une cote depuis MesPronosTab
  // preselectedWinner peut être :
  //   - une string : 'domicile' | 'nul' | 'exterieur' (legacy D2 → applique à FT)
  //   - un objet : { type: 'FT'|'MT', choice: 'domicile'|'nul'|'exterieur' } (Top 14)
  useEffect(() => {
    if (!preselectedWinner) return;

    // Format objet (nouveau)
    if (typeof preselectedWinner === 'object' && preselectedWinner.choice) {
      if (preselectedWinner.type === 'MT') {
        setWinnerChoiceMT(preselectedWinner.choice);
      } else {
        setWinnerChoiceFT(preselectedWinner.choice);
      }
      return;
    }

    // Format string (legacy) → applique à FT
    if (typeof preselectedWinner === 'string') {
      setWinnerChoiceFT(preselectedWinner);
    }
  }, [preselectedWinner]);

  // 🆕 Si l'user change de mode FT, on reset les inputs de l'autre mode
  useEffect(() => {
    if (betModeFT === 'winner') {
      // En mode winner : reset des scores FT (mais pas du stake)
      setScoreDomFT('');
      setScoreExtFT('');
    } else {
      // En mode score : on ne reset le choix vainqueur QUE si pas de pré-sélection
      const hasPreselectFT = preselectedWinner && (
        typeof preselectedWinner === 'string' ||
        (typeof preselectedWinner === 'object' && preselectedWinner.type !== 'MT')
      );
      if (!hasPreselectFT) {
        setWinnerChoiceFT(null);
      }
    }
  }, [betModeFT, preselectedWinner]);

  // 🆕 Idem pour MT (Top 14 uniquement)
  useEffect(() => {
    if (isD2) return;

    if (betModeMT === 'winner') {
      setScoreDomMT('');
      setScoreExtMT('');
    } else {
      const hasPreselectMT = preselectedWinner &&
        typeof preselectedWinner === 'object' &&
        preselectedWinner.type === 'MT';
      if (!hasPreselectMT) {
        setWinnerChoiceMT(null);
      }
    }
  }, [betModeMT, isD2, preselectedWinner]);

  // ============================================
  // Validation en temps réel
  // ============================================
  useEffect(() => {
    const errs = [];
    const stakeFTNum = toInt(stakeFT) || 0;
    const stakeMTNum = toInt(stakeMT) || 0;

    // ────────────────────────────────────────────
    // Validation FT (mode winner OU score)
    // ────────────────────────────────────────────
    const ftErrs = [];
    if (betOnFT && !hasFT) {
      if (betModeFT === 'winner') {
        if (!winnerChoiceFT) {
          ftErrs.push({ type: 'missing', message: 'Choisis un vainqueur (1, N ou 2) pour le temps plein' });
        }
      } else {
        // Mode score : utiliser validateBet pour FT uniquement
        const validation = validateBet({
          betOnFT: true,
          betOnMT: false,
          scoreDomFT, scoreExtFT,
          scoreDomMT: '', scoreExtMT: '',
          stakeFT, stakeMT: '0',
          userCredits, hasFT: false, hasMT: true
        });
        validation.allMessages.forEach(err => {
          if (err.field?.includes('FT') || err.field === 'scoreFT' ||
              err.message.includes('FT') || err.message.includes('Temps Plein')) {
            ftErrs.push(err);
          }
        });
      }

      if (stakeFTNum < 10) {
        ftErrs.push({ type: 'stake', message: 'Mise FT minimum 10 jetons' });
      }
    }

    // ────────────────────────────────────────────
    // Validation MT (Top 14 uniquement, mode winner OU score)
    // ────────────────────────────────────────────
    const mtErrs = [];
    if (!isD2 && betOnMT && !hasMT) {
      if (betModeMT === 'winner') {
        if (!winnerChoiceMT) {
          mtErrs.push({ type: 'missing', message: 'Choisis un vainqueur (1, N ou 2) pour la mi-temps' });
        }
      } else {
        const validation = validateBet({
          betOnFT: false,
          betOnMT: true,
          scoreDomFT: '', scoreExtFT: '',
          scoreDomMT, scoreExtMT,
          stakeFT: '0', stakeMT,
          userCredits, hasFT: true, hasMT: false
        });
        validation.allMessages.forEach(err => {
          if (err.field?.includes('MT') || err.field === 'scoreMT' ||
              err.message.includes('MT') || err.message.includes('Mi-temps')) {
            mtErrs.push(err);
          }
        });
      }

      if (stakeMTNum < 10) {
        mtErrs.push({ type: 'stake', message: 'Mise MT minimum 10 jetons' });
      }
    }

    // ────────────────────────────────────────────
    // Validation générale (crédits)
    // ────────────────────────────────────────────
    const generalErrs = [];
    const totalStakeCheck =
      (betOnFT && !hasFT ? stakeFTNum : 0) +
      (!isD2 && betOnMT && !hasMT ? stakeMTNum : 0);

    if (totalStakeCheck > userCredits) {
      generalErrs.push({ type: 'credits', message: `Jetons insuffisants (max ${userCredits})` });
    }

    if (!betOnFT && !betOnMT) {
      generalErrs.push({ type: 'missing', message: 'Active au moins un type de pari (FT ou MT)' });
    }

    setErrorsFT(ftErrs);
    setErrorsMT(mtErrs);
    setErrorsGeneral(generalErrs);
    setValidationErrors([...ftErrs, ...mtErrs, ...generalErrs]);

  }, [
    betOnFT, betOnMT,
    scoreDomFT, scoreExtFT, scoreDomMT, scoreExtMT,
    stakeFT, stakeMT,
    userCredits, hasFT, hasMT,
    isD2, betModeFT, betModeMT,
    winnerChoiceFT, winnerChoiceMT
  ]);

  const handleScoreBlur = (score, field, refToFocus) => {
    const error = validateScoreInput(score, field);
    if (error) {
      setTimeout(() => refToFocus?.current?.focus(), 100);
    }
  };

  // ============================================
  // Calcul des cotes dynamiques selon le score saisi
  // ============================================
  const getCoteFT = () => {
    // Mode winner — la cote dépend de winnerChoiceFT
    if (betModeFT === 'winner') {
      if (!winnerChoiceFT || !match.cotes) return null;
      if (winnerChoiceFT === 'domicile') return match.cotes.cote_domicile;
      if (winnerChoiceFT === 'exterieur') return match.cotes.cote_exterieur;
      if (winnerChoiceFT === 'nul') return match.cotes.cote_nul;
      return null;
    }
    // Mode score (FT classique)
    if (!scoreDomFT || !scoreExtFT || !match.cotes) return null;
    const dom = toInt(scoreDomFT);
    const ext = toInt(scoreExtFT);
    if (dom === null || ext === null) return null;
    if (dom > ext) return match.cotes.cote_domicile;
    if (ext > dom) return match.cotes.cote_exterieur;
    return match.cotes.cote_nul;
  };

  const getCoteMT = () => {
    if (isD2) return null;  // ✅ pas de MT en D2

    // 🆕 Mode winner MT — la cote dépend de winnerChoiceMT
    if (betModeMT === 'winner') {
      if (!winnerChoiceMT || !match.cotes) return null;
      if (winnerChoiceMT === 'domicile') return match.cotes.cote_mt_domicile;
      if (winnerChoiceMT === 'exterieur') return match.cotes.cote_mt_exterieur;
      if (winnerChoiceMT === 'nul') return match.cotes.cote_mt_nul;
      return null;
    }

    // Mode score classique
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
  const totalPotentialWin = (betOnFT ? potentialWinFT : 0) + (!isD2 && betOnMT ? potentialWinMT : 0);

  const totalStake =
    (betOnFT && !hasFT ? toInt(stakeFT) || 0 : 0) +
    (!isD2 && betOnMT && !hasMT ? toInt(stakeMT) || 0 : 0);

  // ============================================
  // Sauvegarde : appel API avec endpoint adapté
  // ============================================
  const handleSave = async () => {
    // Vérifier qu'au moins un pari est actif
    if (!betOnFT && (!betOnMT || isD2)) {
      setErrorsGeneral([{ type: 'missing', message: 'Active au moins un type de pari' }]);
      return;
    }

    // Validation FT
    if (betOnFT && !hasFT) {
      if (betModeFT === 'winner' && !winnerChoiceFT) {
        setErrorsGeneral([{ type: 'missing', message: 'Choisis un vainqueur pour le temps plein' }]);
        return;
      }
      if (betModeFT === 'score') {
        const validation = validateBet({
          betOnFT: true, betOnMT: false,
          scoreDomFT, scoreExtFT, scoreDomMT: '', scoreExtMT: '',
          stakeFT, stakeMT: '0',
          userCredits, hasFT: false, hasMT: true
        });
        if (!validation.isValid) return;
      }
    }

    // Validation MT (Top 14 uniquement)
    if (!isD2 && betOnMT && !hasMT) {
      if (betModeMT === 'winner' && !winnerChoiceMT) {
        setErrorsGeneral([{ type: 'missing', message: 'Choisis un vainqueur pour la mi-temps' }]);
        return;
      }
      if (betModeMT === 'score') {
        const validation = validateBet({
          betOnFT: false, betOnMT: true,
          scoreDomFT: '', scoreExtFT: '', scoreDomMT, scoreExtMT,
          stakeFT: '0', stakeMT,
          userCredits, hasFT: true, hasMT: false
        });
        if (!validation.isValid) return;
      }
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
      const stakeMTNum = !isD2 && betOnMT ? toInt(stakeMT) : 0;

      // ✅ Endpoints selon championnat
      const endpointBet = isD2
        ? `${API_BASE}/api/d2/bets`
        : `${import.meta.env.VITE_API_URL}/bets`;

      // ── Pari FT ──
      if (betOnFT && !hasFT) {
        if (betModeFT === 'winner') {
          if (!winnerChoiceFT) throw new Error('Choisis un vainqueur (1, N ou 2)');
          let oddsWinner = 1.00;
          if (winnerChoiceFT === 'domicile') oddsWinner = match.cotes.cote_domicile;
          else if (winnerChoiceFT === 'exterieur') oddsWinner = match.cotes.cote_exterieur;
          else if (winnerChoiceFT === 'nul') oddsWinner = match.cotes.cote_nul;

          await axios.post(endpointBet, {
            match_id: match.match_id,
            bet_type: 'WINNER_FT',
            winner_predit: winnerChoiceFT,
            stake: stakeFTNum,
            odds: oddsWinner
          }, { headers: { 'x-user-id': user.id } });
        } else {
          // Mode score classique
          let oddsFT = 1.00;
          if (match.cotes) {
            if (dFT > eFT) oddsFT = match.cotes.cote_domicile;
            else if (eFT > dFT) oddsFT = match.cotes.cote_exterieur;
            else oddsFT = match.cotes.cote_nul;
          }

          await axios.post(endpointBet, {
            match_id: match.match_id,
            bet_type: 'FT',
            score_domicile: dFT,
            score_exterieur: eFT,
            stake: stakeFTNum,
            odds: oddsFT
          }, { headers: { 'x-user-id': user.id } });
        }
      }

      // ── Pari MT (uniquement Top 14) ──
      if (!isD2 && betOnMT && !hasMT) {
        if (betModeMT === 'winner') {
          if (!winnerChoiceMT) throw new Error('Choisis un vainqueur MT (1, N ou 2)');
          let oddsWinnerMT = 1.00;
          if (winnerChoiceMT === 'domicile') oddsWinnerMT = match.cotes.cote_mt_domicile;
          else if (winnerChoiceMT === 'exterieur') oddsWinnerMT = match.cotes.cote_mt_exterieur;
          else if (winnerChoiceMT === 'nul') oddsWinnerMT = match.cotes.cote_mt_nul;

          await axios.post(`${import.meta.env.VITE_API_URL}/bets`, {
            match_id: match.match_id,
            bet_type: 'WINNER_MT',
            winner_predit: winnerChoiceMT,
            stake: stakeMTNum,
            odds: oddsWinnerMT
          }, { headers: { 'x-user-id': user.id } });
        } else {
          // Mode score classique MT
          let oddsMT = 1.00;
          if (match.cotes) {
            if (dMT > eMT) oddsMT = match.cotes.cote_mt_domicile;
            else if (eMT > dMT) oddsMT = match.cotes.cote_mt_exterieur;
            else oddsMT = match.cotes.cote_mt_nul;
          }

          await axios.post(`${import.meta.env.VITE_API_URL}/bets`, {
            match_id: match.match_id,
            bet_type: 'MT',
            score_domicile: dMT,
            score_exterieur: eMT,
            stake: stakeMTNum,
            odds: oddsMT
          }, { headers: { 'x-user-id': user.id } });
        }
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

  // ============================================
  // Calcul de canSave (dépend du mode actif)
  // ============================================
  const stakeFTNum = toInt(stakeFT) || 0;
  const stakeMTNum = toInt(stakeMT) || 0;

  // Au moins un pari actif
  const atLeastOneActive = (betOnFT && !hasFT) || (!isD2 && betOnMT && !hasMT);

  // FT valide ?
  const ftValid = !betOnFT || hasFT || (
    stakeFTNum >= 10 &&
    (
      (betModeFT === 'winner' && !!winnerChoiceFT) ||
      (betModeFT === 'score' && !!scoreDomFT && !!scoreExtFT)
    )
  );

  // MT valide ?
  const mtValid = isD2 || !betOnMT || hasMT || (
    stakeMTNum >= 10 &&
    (
      (betModeMT === 'winner' && !!winnerChoiceMT) ||
      (betModeMT === 'score' && !!scoreDomMT && !!scoreExtMT)
    )
  );

  // Crédits suffisants
  const creditsOk = totalStake <= userCredits && totalStake >= 10;

  const finalCanSave = atLeastOneActive && ftValid && mtValid && creditsOk;

  // ============================================
  // Couleurs selon le championnat
  // ============================================
  const headerBg = isD2
    ? 'bg-gradient-to-r from-[#00174D] to-[#97C1FE]'
    : 'bg-gradient-to-r from-rugby-gold to-rugby-bronze';
  const borderColor = isD2 ? 'border-[#97C1FE]' : 'border-rugby-gold';
  const sectionBorderOn = isD2 ? 'border-[#97C1FE]' : 'border-rugby-gold';
  const infoBg = isD2 ? 'bg-[#97C1FE]/10 border-[#97C1FE]/30' : 'bg-rugby-gold/10 border-rugby-gold/30';
  const summaryBg = isD2 ? 'bg-[#97C1FE]/10 border-[#97C1FE]/30' : 'bg-rugby-gold/10 border-rugby-gold/30';
  const validBtnBg = isD2
    ? 'bg-[#00174D] text-white hover:bg-[#97C1FE]'
    : 'bg-rugby-gold text-white hover:bg-rugby-bronze';
  const inputFocusRing = isD2 ? 'focus:ring-[#97C1FE] focus:border-[#97C1FE]' : 'focus:ring-rugby-gold focus:border-rugby-gold';
  const toggleActiveBg = isD2 ? 'bg-[#00174D]' : 'bg-rugby-gold';

  return (
    <>
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-60 p-4 overflow-y-auto">
        <div className={`bg-white rounded-xl max-w-lg w-full shadow-2xl border-2 ${borderColor} my-8`}>

          {/* Header */}
          <div className={`${headerBg} p-4 rounded-t-xl`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trophy className="w-5 h-5 text-white" />
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-lg font-bold text-white">
                      Placer un pari {isD2 && <span className="text-xs font-normal opacity-80">• Pro D2</span>}
                    </h2>
                    <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
                      <Coins className="w-4 h-4 text-white" />
                      <span className="text-sm font-bold text-white">{userCredits}</span>
                    </div>
                  </div>
                  <p className="text-sm text-white/80">
                    {isD2 ? 'Pari FT uniquement • Mise min : 10 jetons' : 'Mise min : 10 jetons par pari'}
                  </p>
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
            <div className={`${infoBg} rounded-lg p-3 border`}>
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

            {/* ═══════════════════════════════════════════
                Section TEMPS PLEIN
                ═══════════════════════════════════════════ */}
            <div className={`border-2 rounded-lg p-2 transition-colors ${
              betOnFT ? `${sectionBorderOn} bg-white` : 'border-gray-300 bg-gray-50'
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

              {/* 🆕 TOGGLE Score / Vainqueur — D2 ET Top 14 — toujours visible si pas de pari FT existant */}
              {!hasFT && (
                <div className="flex gap-1 mb-2 bg-gray-100 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => setBetModeFT('winner')}
                    className={`flex-1 px-3 py-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      betModeFT === 'winner'
                        ? `${toggleActiveBg} text-white shadow-sm`
                        : 'bg-transparent text-gray-600 hover:bg-white/50'
                    }`}
                  >
                    <Target className="w-3.5 h-3.5" />
                    Vainqueur
                  </button>
                  <button
                    type="button"
                    onClick={() => setBetModeFT('score')}
                    className={`flex-1 px-3 py-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      betModeFT === 'score'
                        ? `${toggleActiveBg} text-white shadow-sm`
                        : 'bg-transparent text-gray-600 hover:bg-white/50'
                    }`}
                  >
                    <Hash className="w-3.5 h-3.5" />
                    Score exact
                  </button>
                </div>
              )}

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

              {/* Mode VAINQUEUR FT — boutons 1/N/2 + mise */}
              {betModeFT === 'winner' && !hasFT ? (
                <>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {/* Bouton DOMICILE (1) */}
                    <button
                      type="button"
                      onClick={() => { setWinnerChoiceFT('domicile'); if (!hasFT) setBetOnFT(true); }}
                      className={`p-2 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-1 ${
                        winnerChoiceFT === 'domicile'
                          ? 'border-blue-500 bg-blue-50 shadow-md scale-105'
                          : 'border-gray-300 bg-white hover:border-gray-400'
                      }`}
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
                      onClick={() => { setWinnerChoiceFT('nul'); if (!hasFT) setBetOnFT(true); }}
                      className={`p-2 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-1 ${
                        winnerChoiceFT === 'nul'
                          ? 'border-gray-700 bg-gray-100 shadow-md scale-105'
                          : 'border-gray-300 bg-white hover:border-gray-400'
                      }`}
                    >
                      <span className="text-[10px] font-bold text-gray-500">N (Nul)</span>
                      <span className="text-2xl">🤝</span>
                      <span className="text-[10px] font-semibold text-gray-700">Match nul</span>
                      <span className="text-base font-bold text-gray-800">
                        {match.cotes?.cote_nul?.toFixed(2)}
                      </span>
                    </button>

                    {/* Bouton EXTÉRIEUR (2) */}
                    <button
                      type="button"
                      onClick={() => { setWinnerChoiceFT('exterieur'); if (!hasFT) setBetOnFT(true); }}
                      className={`p-2 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-1 ${
                        winnerChoiceFT === 'exterieur'
                          ? 'border-red-500 bg-red-50 shadow-md scale-105'
                          : 'border-gray-300 bg-white hover:border-gray-400'
                      }`}
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

                  {/* Mise FT (mode winner) */}
                  <div className="flex items-center justify-center gap-3 mb-1">
                    <span className="text-xs font-semibold text-gray-700">Mise :</span>
                    <div className={`w-24 h-12 flex flex-col items-center justify-start border-2 border-rugby-gray rounded-lg focus-within:ring-2 ${inputFocusRing}`}>
                      <span className="text-[10px] font-semibold text-gray-700">Jetons</span>
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
                </>
              ) : (
              <>
              {/* Mode SCORE FT — saisie scores */}
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
                      if (val && !hasFT) setBetOnFT(true);
                      if (val.length === 2) extFTRef.current?.focus();
                    }}
                    onBlur={() => handleScoreBlur(scoreDomFT, 'scoreDomFT', domFTRef)}
                    onFocus={(e) => e.target.select()}
                    disabled={hasFT || !betOnFT}
                    className={`w-full px-2 py-2 border-2 border-rugby-gray rounded-lg text-center text-lg font-bold focus:ring-2 ${inputFocusRing} disabled:bg-gray-100 disabled:cursor-not-allowed`}
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
                      if (val && !hasFT) setBetOnFT(true);
                    }}
                    onBlur={() => handleScoreBlur(scoreExtFT, 'scoreExtFT', extFTRef)}
                    onFocus={(e) => e.target.select()}
                    disabled={hasFT || !betOnFT}
                    className={`w-full px-2 py-2 border-2 border-rugby-gray rounded-lg text-center text-lg font-bold focus:ring-2 ${inputFocusRing} disabled:bg-gray-100 disabled:cursor-not-allowed`}
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
                  <div className={`w-full h-12 flex flex-col items-center justify-start border-2 border-rugby-gray rounded-lg focus-within:ring-2 ${inputFocusRing}`}>
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

              </>
              )}

              {betOnFT && coteFT && (
                <div className="bg-green-50 rounded p-2 text-xs">
                  <span className="text-green-700">💎 Gain: </span>
                  <span className="font-bold text-green-600">{potentialWinFT} jetons</span>
                  <span className="text-green-600"> (×{coteFT.toFixed(2)})</span>
                </div>
              )}
            </div>

            {/* ═══════════════════════════════════════════
                Section MI-TEMPS
                Affichée UNIQUEMENT en Top 14
                ═══════════════════════════════════════════ */}
            {!isD2 && (
              <div className={`border-2 rounded-lg p-2 transition-colors ${
                betOnMT ? `${sectionBorderOn} bg-white` : 'border-gray-300 bg-gray-50'
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

                {/* 🆕 TOGGLE Score / Vainqueur MT — toujours visible si pas de pari MT existant */}
                {!hasMT && (
                  <div className="flex gap-1 mb-2 bg-gray-100 rounded-lg p-1">
                    <button
                      type="button"
                      onClick={() => setBetModeMT('winner')}
                      className={`flex-1 px-3 py-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        betModeMT === 'winner'
                          ? `${toggleActiveBg} text-white shadow-sm`
                          : 'bg-transparent text-gray-600 hover:bg-white/50'
                      }`}
                    >
                      <Target className="w-3.5 h-3.5" />
                      Vainqueur
                    </button>
                    <button
                      type="button"
                      onClick={() => setBetModeMT('score')}
                      className={`flex-1 px-3 py-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        betModeMT === 'score'
                          ? `${toggleActiveBg} text-white shadow-sm`
                          : 'bg-transparent text-gray-600 hover:bg-white/50'
                      }`}
                    >
                      <Hash className="w-3.5 h-3.5" />
                      Score exact
                    </button>
                  </div>
                )}

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

                {/* Mode VAINQUEUR MT — boutons 1/N/2 + mise */}
                {betModeMT === 'winner' && !hasMT ? (
                  <>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {/* Bouton DOMICILE (1) MT */}
                      <button
                        type="button"
                        onClick={() => { setWinnerChoiceMT('domicile'); if (!hasMT) setBetOnMT(true); }}
                        className={`p-2 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-1 ${
                          winnerChoiceMT === 'domicile'
                            ? 'border-blue-500 bg-blue-50 shadow-md scale-105'
                            : 'border-gray-300 bg-white hover:border-gray-400'
                        }`}
                      >
                        <span className="text-[10px] font-bold text-gray-500">1 (Domicile)</span>
                        <img src={teamDom.logo} alt={teamDom.name} className="w-7 h-7 object-contain"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        <span className="text-[10px] font-semibold text-gray-700 truncate max-w-full">
                          {teamDom.name}
                        </span>
                        <span className="text-base font-bold text-blue-700">
                          {match.cotes?.cote_mt_domicile?.toFixed(2)}
                        </span>
                      </button>

                      {/* Bouton NUL (N) MT */}
                      <button
                        type="button"
                        onClick={() => { setWinnerChoiceMT('nul'); if (!hasMT) setBetOnMT(true); }}
                        className={`p-2 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-1 ${
                          winnerChoiceMT === 'nul'
                            ? 'border-gray-700 bg-gray-100 shadow-md scale-105'
                            : 'border-gray-300 bg-white hover:border-gray-400'
                        }`}
                      >
                        <span className="text-[10px] font-bold text-gray-500">N (Nul)</span>
                        <span className="text-2xl">🤝</span>
                        <span className="text-[10px] font-semibold text-gray-700">Match nul</span>
                        <span className="text-base font-bold text-gray-800">
                          {match.cotes?.cote_mt_nul?.toFixed(2)}
                        </span>
                      </button>

                      {/* Bouton EXTÉRIEUR (2) MT */}
                      <button
                        type="button"
                        onClick={() => { setWinnerChoiceMT('exterieur'); if (!hasMT) setBetOnMT(true); }}
                        className={`p-2 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-1 ${
                          winnerChoiceMT === 'exterieur'
                            ? 'border-red-500 bg-red-50 shadow-md scale-105'
                            : 'border-gray-300 bg-white hover:border-gray-400'
                        }`}
                      >
                        <span className="text-[10px] font-bold text-gray-500">2 (Extérieur)</span>
                        <img src={teamExt.logo} alt={teamExt.name} className="w-7 h-7 object-contain"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        <span className="text-[10px] font-semibold text-gray-700 truncate max-w-full">
                          {teamExt.name}
                        </span>
                        <span className="text-base font-bold text-red-700">
                          {match.cotes?.cote_mt_exterieur?.toFixed(2)}
                        </span>
                      </button>
                    </div>

                    {/* Mise MT (mode winner) */}
                    <div className="flex items-center justify-center gap-3 mb-1">
                      <span className="text-xs font-semibold text-gray-700">Mise :</span>
                      <div className={`w-24 h-12 flex flex-col items-center justify-start border-2 border-rugby-gray rounded-lg focus-within:ring-2 ${inputFocusRing}`}>
                        <span className="text-[10px] font-semibold text-gray-700">Jetons</span>
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
                  </>
                ) : (
                <>
                {/* Mode SCORE MT — saisie scores */}
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
                        if (val && !hasMT) setBetOnMT(true);
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
                        if (val && !hasMT) setBetOnMT(true);
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
                </>
                )}

                {betOnMT && coteMT && (
                  <div className="bg-green-50 rounded p-2 text-xs">
                    <span className="text-green-700">💎 Gain: </span>
                    <span className="font-bold text-green-600">{potentialWinMT} jetons</span>
                    <span className="text-green-600"> (×{coteMT.toFixed(2)})</span>
                  </div>
                )}
              </div>
            )}

            {/* Résumé */}
            <div className={`${summaryBg} rounded-lg p-2.5 border`}>
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
                disabled={saving || !finalCanSave}
                className={`flex-1 px-4 py-3 rounded-lg font-semibold text-sm shadow-md transition-colors ${
                  saving || !finalCanSave
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : validBtnBg
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
