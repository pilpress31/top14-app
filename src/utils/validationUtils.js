// ============================================
// UTILITAIRES DE VALIDATION DES SCORES
// ============================================

// Scores interdits en rugby (1, 2, 4 points impossibles)
export const FORBIDDEN_SCORES = [1, 2, 4];

// Conversion sûre en entier
export const toInt = (value) => {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : null;
};

// Vérifie si un score est interdit
export const isForbiddenScore = (score) => {
  const n = toInt(score);
  return n !== null && FORBIDDEN_SCORES.includes(n);
};

// Vérifie si un écart est interdit
export const isForbiddenDiff = (scoreFT, scoreMT) => {
  const ft = toInt(scoreFT);
  const mt = toInt(scoreMT);
  if (ft === null || mt === null) return false;
  const diff = ft - mt;
  return FORBIDDEN_SCORES.includes(diff);
};

// ============================================
// VALIDATION COMPLÈTE DES PRONOS
// ============================================
export const validateBet = (betData) => {
  const {
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
  } = betData;

  const errors = [];
  const dFT = toInt(scoreDomFT);
  const eFT = toInt(scoreExtFT);
  const dMT = toInt(scoreDomMT);
  const eMT = toInt(scoreExtMT);

  // === VALIDATION TEMPS PLEIN ===
  if (betOnFT && !hasFT) {
    // Vérifier que les scores sont renseignés
    if (scoreDomFT === "" || scoreExtFT === "") {
      errors.push({
        type: 'missing',
        message: 'Renseignez les deux scores TEMPS PLEIN'
      });
    } else {
      // Scores interdits
      if (isForbiddenScore(dFT)) {
        errors.push({
          type: 'forbidden',
          field: 'scoreDomFT',
          message: 'Score domicile TEMPS PLEIN interdit (1, 2 ou 4)'
        });
      }
      if (isForbiddenScore(eFT)) {
        errors.push({
          type: 'forbidden',
          field: 'scoreExtFT',
          message: 'Score extérieur TEMPS PLEIN interdit (1, 2 ou 4)'
        });
      }

      // Alerte 0-0 (non bloquant)
      if (dFT === 0 && eFT === 0) {
        errors.push({
          type: 'warning',
          field: 'scoreFT',
          message: 'Score final 0-0 très rare en rugby : vérifiez votre prono'
        });
      }
    }

    // Validation mise
    const stakeFTNum = toInt(stakeFT);
    if (!stakeFTNum || stakeFTNum < 10) {
      errors.push({
        type: 'stake',
        message: 'Mise TEMPS PLEIN minimum : 10 jetons'
      });
    }
  }

  // === VALIDATION MI-TEMPS ===
  if (betOnMT && !hasMT) {
    // Vérifier que les scores sont renseignés
    if (scoreDomMT === "" || scoreExtMT === "") {
      errors.push({
        type: 'missing',
        message: 'Renseignez les deux scores MI-TEMPS'
      });
    } else {
      // Scores interdits
      if (isForbiddenScore(dMT)) {
        errors.push({
          type: 'forbidden',
          field: 'scoreDomMT',
          message: 'Score domicile MI-TEMPS interdit (1, 2 ou 4)'
        });
      }
      if (isForbiddenScore(eMT)) {
        errors.push({
          type: 'forbidden',
          field: 'scoreExtMT',
          message: 'Score extérieur MI-TEMPS interdit (1, 2 ou 4)'
        });
      }

      // Alerte 0-0 (non bloquant)
      if (dMT === 0 && eMT === 0) {
        errors.push({
          type: 'warning',
          field: 'scoreMT',
          message: 'Score MT 0-0 très rare en rugby : vérifiez votre prono'
        });
      }
    }

    // Validation mise
    const stakeMTNum = toInt(stakeMT);
    if (!stakeMTNum || stakeMTNum < 10) {
      errors.push({
        type: 'stake',
        message: 'Mise MI-TEMPS minimum : 10 jetons'
      });
    }
  }

  // === COHÉRENCE FT/MT ===
    if (betOnFT && betOnMT && dFT !== null && eFT !== null && dMT !== null && eMT !== null) {
    
    // CAS 1 : FT pas encore fait, MT peut-être déjà fait
    if (!hasFT) {
        // MT ne peut pas être supérieur à FT
        if (dMT > dFT) {
        errors.push({
            type: 'coherence',
            message: 'Score domicile MI-TEMPS supérieur à TEMPS PLEIN'
        });
        }
        if (eMT > eFT) {
        errors.push({
            type: 'coherence',
            message: 'Score extérieur MI-TEMPS supérieur à TEMPS PLEIN'
        });
        }

        // Écarts interdits FT-MT
        if (isForbiddenDiff(dFT, dMT)) {
        errors.push({
            type: 'coherence',
            message: 'Écart dom TP/MT interdit (1, 2 ou 4 points)'
        });
        }
        if (isForbiddenDiff(eFT, eMT)) {
        errors.push({
            type: 'coherence',
            message: 'Écart ext TP/MT interdit (1, 2 ou 4 points)'
        });
        }
    }
    
    // CAS 2 : MT pas encore fait, FT peut-être déjà fait
    if (!hasMT) {
        // FT ne peut pas être inférieur à MT (= MT ne peut pas être > FT)
        if (dMT > dFT) {
        errors.push({
            type: 'coherence',
            message: 'Score dom MT ne peut pas être supérieur à TP'
        });
        }
        if (eMT > eFT) {
        errors.push({
            type: 'coherence',
            message: 'Score ext MT ne peut pas être supérieur à TP'
        });
        }

        // Écarts interdits FT-MT
        if (isForbiddenDiff(dFT, dMT)) {
        errors.push({
            type: 'coherence',
            message: 'Écart domicile TP−MT interdit (1, 2 ou 4 points)'
        });
        }
        if (isForbiddenDiff(eFT, eMT)) {
        errors.push({
            type: 'coherence',
            message: 'Écart extérieur TP−MT interdit (1, 2 ou 4 points)'
        });
        }
    }
    }

  // === VALIDATION CRÉDITS ===
  const totalStake = 
    (betOnFT && !hasFT ? toInt(stakeFT) || 0 : 0) +
    (betOnMT && !hasMT ? toInt(stakeMT) || 0 : 0);

  if (totalStake > userCredits) {
    errors.push({
      type: 'credits',
      message: `Jetons insuffisants (disponibles : ${userCredits})`
    });
  }

  // Alerte "Aucune mise" uniquement si aucun pari n'a été fait ET aucune case n'est cochée
  if (totalStake === 0 && (betOnFT || betOnMT) && !hasFT && !hasMT) {
    errors.push({
      type: 'stake',
      message: 'Aucune mise valide (mini 10 jetons par pari)'
    });
  }

  // Séparer les erreurs bloquantes des warnings
  const blockingErrors = errors.filter(e => e.type !== 'warning');
  const warnings = errors.filter(e => e.type === 'warning');

  return {
    isValid: blockingErrors.length === 0,
    errors: blockingErrors,
    warnings,
    allMessages: errors
  };
};

// ============================================
// VALIDATION EN TEMPS RÉEL (pour onBlur)
// ============================================
export const validateScoreInput = (score, field) => {
  if (!score || score.length < 2) return null;
  
  const n = toInt(score);
  if (isForbiddenScore(n)) {
    return {
      field,
      message: `Score ${field.includes('FT') ? 'FT' : 'MT'} interdit (1, 2 ou 4)`
    };
  }
  
  return null;
};