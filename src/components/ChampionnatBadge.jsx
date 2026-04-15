// ============================================================
// ChampionnatBadge.jsx
// Badge cliquable en haut à gauche pour switcher Top14 / Pro D2
// Couleurs officielles :
//   Top 14  → fond #000000, bordure/texte #CBA135
//   Pro D2  → fond #00174D, bordure #97C1FE, texte #FFFFFF
// ============================================================

import { useChampionnat } from '../contexts/ChampionnatContext';

export default function ChampionnatBadge() {
  const { isD2, toggle } = useChampionnat();

  const styles = isD2
    ? {
        backgroundColor: '#00174D',
        borderColor:     '#97C1FE',
        color:           '#FFFFFF',
      }
    : {
        backgroundColor: '#000000',
        borderColor:     '#CBA135',
        color:           '#CBA135',
      };

  return (
    <button
      onClick={toggle}
      style={styles}
      className="fixed top-3 left-3 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-md border-2 font-bold text-xs tracking-wide shadow-sm transition-opacity duration-200 hover:opacity-85"
      title={`Passer en ${isD2 ? 'TOP 14' : 'PRO D2'}`}
    >
      {/* Icône appli depuis /public */}
      <img
        src="/icon-192.png"
        alt=""
        className="w-4 h-4 rounded-sm object-contain"
      />
      <span className="leading-none">{isD2 ? 'PRO D2' : 'TOP 14'}</span>
      {/* Icône switch */}
      <svg
        className="w-3 h-3 opacity-70"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    </button>
  );
}
