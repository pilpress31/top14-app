// ============================================================
// ChampionnatContext.jsx
// Context global pour le switch TOP14 / PRO D2 / CHAMPIONS CUP
// Reset à chaque ouverture : toujours TOP14 par défaut
// ============================================================
//
// API exposée :
//   - championnat   : 'top14' | 'prod2' | 'hcup'
//   - setChampionnat(name) : forcer un championnat précis
//   - nextChampionnat()    : passer au suivant (T14 → D2 → HCup → T14...)
//   - toggle()             : alias rétro-compat de nextChampionnat()
//   - isTop14, isD2, isHcup : booléens (isD2 conservé pour rétro-compat)
// ============================================================

import { createContext, useContext, useState } from 'react';

const ChampionnatContext = createContext(null);

// Ordre du carrousel — modifiable si besoin
const ORDER = ['top14', 'prod2', 'hcup'];

export function ChampionnatProvider({ children }) {
  // 'top14' | 'prod2' | 'hcup' — toujours top14 au démarrage
  const [championnat, setChampionnat] = useState('top14');

  // Passer au championnat suivant dans le carrousel
  const nextChampionnat = () => {
    setChampionnat(prev => {
      const idx = ORDER.indexOf(prev);
      const nextIdx = (idx + 1) % ORDER.length;
      return ORDER[nextIdx];
    });
  };

  // Alias rétro-compat (l'ancien nom 'toggle' existe encore pour ne pas casser le code existant)
  const toggle = nextChampionnat;

  // Booléens dérivés
  const isTop14 = championnat === 'top14';
  const isD2 = championnat === 'prod2';
  const isHcup = championnat === 'hcup';

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
