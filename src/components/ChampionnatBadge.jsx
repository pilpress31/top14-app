// ============================================================
// ChampionnatBadge.jsx
// Badge cliquable en haut à gauche pour switcher Top14 / Pro D2
// ============================================================

import { useChampionnat } from '../contexts/ChampionnatContext';

export default function ChampionnatBadge() {
  const { championnat, toggle, isD2 } = useChampionnat();

  return (
    <button
      onClick={toggle}
      className={`
        fixed top-3 left-3 z-50
        flex items-center gap-1.5
        px-3 py-1.5
        rounded-md border-2
        font-bold text-xs tracking-wide
        transition-all duration-200
        shadow-sm
        ${isD2
          ? 'bg-blue-700 border-blue-500 text-white hover:bg-blue-600'
          : 'bg-white border-rugby-gold text-rugby-gold hover:bg-rugby-gold/10'
        }
      `}
      title={`Passer en ${isD2 ? 'TOP 14' : 'PRO D2'}`}
    >
      {/* Icône rugbyball */}
      <span className="text-sm">🏉</span>
      <span>{isD2 ? 'PRO D2' : 'TOP 14'}</span>
      {/* Flèche indiquant que c'est cliquable */}
      <svg
        className="w-3 h-3 opacity-70"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    </button>
  );
}
