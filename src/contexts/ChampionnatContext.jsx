// ============================================================
// ChampionnatContext.jsx
// Context global pour le switch TOP14 / PRO D2 / CHAMPIONS CUP / MONDE
// Le choix est PERSISTÉ (localStorage) : on reste sur le même
// championnat après un refresh ou une réouverture de l'app.
// ============================================================
//
// API exposée :
//   - championnat   : 'top14' | 'prod2' | 'hcup' | 'monde'
//   - setChampionnat(name) : forcer un championnat précis (persiste)
//   - nextChampionnat()    : passer au suivant (T14 → D2 → HCup → MONDE → T14...)
//   - toggle()             : alias rétro-compat de nextChampionnat()
//   - isTop14, isD2, isHcup, isMonde : booléens (isD2 conservé pour rétro-compat)
// ============================================================

import { createContext, useContext, useState } from 'react';

const ChampionnatContext = createContext(null);

// Ordre du carrousel — modifiable si besoin
const ORDER = ['top14', 'prod2', 'hcup', 'monde'];
const STORAGE_KEY = 'top14pronos.championnat';

// Lecture du dernier championnat choisi (fallback top14)
function getInitialChampionnat() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && ORDER.includes(saved)) return saved;
  } catch (_) { /* localStorage indisponible (SSR / mode privé) */ }
  return 'top14';
}

export function ChampionnatProvider({ children }) {
  // 'top14' | 'prod2' | 'hcup' | 'monde' — restauré depuis localStorage
  const [championnat, setChampionnatState] = useState(getInitialChampionnat);

  // Setter qui persiste le choix
  const setChampionnat = (name) => {
    if (!ORDER.includes(name)) return;
    setChampionnatState(name);
    try { localStorage.setItem(STORAGE_KEY, name); } catch (_) { /* ignore */ }
  };

  // Passer au championnat suivant dans le carrousel
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
