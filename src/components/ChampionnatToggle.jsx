// ============================================
// ChampionnatToggle.jsx
// Composant bouton bascule TOP 14 / PRO D2
// 
// À PLACER dans : src/components/ChampionnatToggle.jsx
// ============================================

import { useChampionnat } from '../contexts/ChampionnatContext';

export default function ChampionnatToggle({ className = '' }) {
  const { isD2, toggle } = useChampionnat();

  return (
    <div className={`flex items-center justify-center gap-0.5 bg-gray-100 p-1 rounded-lg ${className}`}>
      <button
        onClick={() => { if (isD2) toggle(); }}
        className={`flex-1 px-4 py-2 rounded-md text-sm font-bold transition-all ${
          !isD2
            ? 'bg-gradient-to-r from-rugby-gold to-rugby-bronze text-white shadow-sm'
            : 'text-gray-600 hover:bg-white/50'
        }`}
      >
        🏆 TOP 14
      </button>
      <button
        onClick={() => { if (!isD2) toggle(); }}
        className={`flex-1 px-4 py-2 rounded-md text-sm font-bold transition-all ${
          isD2
            ? 'bg-gradient-to-r from-[#00174D] to-[#97C1FE] text-white shadow-sm'
            : 'text-gray-600 hover:bg-white/50'
        }`}
      >
        🥈 PRO D2
      </button>
    </div>
  );
}


// ═════════════════════════════════════════════════════════════
// UTILISATION DANS PronosPage.jsx
// ═════════════════════════════════════════════════════════════
//
// Ajouter l'import en haut :
//    import ChampionnatToggle from '../components/ChampionnatToggle';
//
// Et placer le composant juste avant ou au-dessus des onglets "À parier" / "Mes paris" :
//
//    <div className="px-4 pt-3">
//      <ChampionnatToggle className="mb-3" />
//    </div>
//    {/* ...tes onglets existants... */}
//
// ═════════════════════════════════════════════════════════════
