// ============================================================
// ChampionnatContext.jsx
// Context global pour le switch TOP14 / PRO D2 / CHAMPIONS CUP / CHALLENGE CUP / MONDE
// Le choix est PERSISTÉ (localStorage) : on reste sur le même
// championnat après un refresh ou une réouverture de l'app.
// ============================================================
//
// API exposée :
//   - championnat   : 'top14' | 'prod2' | 'hcup' | 'ecc' | 'monde'
//   - setChampionnat(name) : forcer un championnat précis (persiste)
//   - nextChampionnat()    : passer au suivant dans le carrousel
//   - toggle()             : alias rétro-compat de nextChampionnat()
//   - isTop14, isD2, isHcup, isEcc, isMonde : booléens (isD2 conservé pour rétro-compat)
//
// ⚠️ ALLOWED ≠ ORDER :
//   - ALLOWED : valeurs ACCEPTÉES par setChampionnat + la persistance (inclut 'ecc').
//   - ORDER   : carrousel de nextChampionnat()/swipe. 'ecc' en est volontairement
//               EXCLU tant que la Challenge Cup n'est pas câblée sur toutes les pages
//               (Pronos/IA). L'ECC reste joignable par un clic explicite sur le
//               sélecteur des pages qui l'exposent (Classement). → ajouter 'ecc' à
//               ORDER une fois Pronos/IA câblés.
// ============================================================

import { createContext, useContext, useState } from 'react';

const ChampionnatContext = createContext(null);

// Valeurs valides (validation + persistance)
const ALLOWED = ['top14', 'prod2', 'hcup', 'ecc', 'monde'];
// Carrousel (swipe / nextChampionnat) — ECC exclu volontairement (cf. en-tête)
const ORDER = ['top14', 'prod2', 'hcup', 'ecc', 'monde'];
const STORAGE_KEY = 'top14pronos.championnat';

// Lecture du dernier championnat choisi (fallback top14)
function getInitialChampionnat() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && ALLOWED.includes(saved)) return saved;
  } catch (_) { /* localStorage indisponible (SSR / mode privé) */ }
  return 'top14';
}

export function ChampionnatProvider({ children }) {
  // 'top14' | 'prod2' | 'hcup' | 'ecc' | 'monde' — restauré depuis localStorage
  const [championnat, setChampionnatState] = useState(getInitialChampionnat);

  // Setter qui persiste le choix
  const setChampionnat = (name) => {
    if (!ALLOWED.includes(name)) return;
    setChampionnatState(name);
    try { localStorage.setItem(STORAGE_KEY, name); } catch (_) { /* ignore */ }
  };

  // Passer au championnat suivant dans le carrousel.
  // Si le courant est hors ORDER (ex. 'ecc'), indexOf = -1 → on repart sur top14.
  const nextChampionnat = () => {
    const idx = ORDER.indexOf(championnat);
    setChampionnat(ORDER[(idx + 1) % ORDER.length]);
  };

  // Alias rétro-compat
  const toggle = nextChampionnat;

  // Booléens dérivés
  const isTop14 = championnat === 'top14';
  const isD2 = championnat === 'prod2';
  const isHcup = championnat === 'hcup';
  const isEcc = championnat === 'ecc';
  const isMonde = championnat === 'monde';

  return (
    <ChampionnatContext.Provider
      value={{
        championnat,
        setChampionnat,
        nextChampionnat,
        toggle, // rétro-compat
        isTop14,
        isD2,
        isHcup,
        isEcc,
        isMonde,
      }}
    >
      {children}
    </ChampionnatContext.Provider>
  );
}

export function useChampionnat() {
  const ctx = useContext(ChampionnatContext);
  if (!ctx) throw new Error('useChampionnat doit être utilisé dans ChampionnatProvider');
  return ctx;
}
