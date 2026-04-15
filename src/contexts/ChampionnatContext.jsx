// ============================================================
// ChampionnatContext.jsx
// Context global pour le switch TOP14 / PRO D2
// Reset à chaque ouverture : toujours TOP14 par défaut
// ============================================================

import { createContext, useContext, useState } from 'react';

const ChampionnatContext = createContext(null);

export function ChampionnatProvider({ children }) {
  // 'top14' | 'prod2' — toujours top14 au démarrage
  const [championnat, setChampionnat] = useState('top14');

  const toggle = () =>
    setChampionnat(prev => prev === 'top14' ? 'prod2' : 'top14');

  const isD2 = championnat === 'prod2';

  return (
    <ChampionnatContext.Provider value={{ championnat, toggle, isD2 }}>
      {children}
    </ChampionnatContext.Provider>
  );
}

export function useChampionnat() {
  const ctx = useContext(ChampionnatContext);
  if (!ctx) throw new Error('useChampionnat doit être utilisé dans ChampionnatProvider');
  return ctx;
}
