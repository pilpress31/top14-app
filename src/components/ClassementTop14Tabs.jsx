// ==========================================
// CLASSEMENT TOP 14 - WRAPPER AVEC SOUS-ONGLETS
// ==========================================
// Wrapper qui ajoute 2 sous-onglets sous le bouton TOP 14 :
//   - [Classement]  → tableau classement saison en cours  (par défaut)
//   - [Palmarès]    → PalmaresTop14 (toutes les finales depuis 1905)
//
// Charte Top 14 : rugby-gold #CBA135
// ==========================================

import { useState } from 'react';
import { Award, Trophy } from 'lucide-react';
import PalmaresTop14 from './PalmaresTop14';
import { getCharte } from '../constants/chartes';

const GOLD = getCharte('top14').rubrique.accent; // or UI Top 14 = rugby-gold #CBA135

// Le contenu "Classement" est passé en prop depuis ClassementPage
// pour ne pas dupliquer toute la logique (tableau, stats, etc.)
export default function ClassementTop14Tabs({ children, isD2 = false }) {
  const [activeSubTab, setActiveSubTab] = useState('classement');

  // Pro D2 : pas de sous-onglet Palmarès, on rend directement
  if (isD2) return <>{children}</>;

  return (
    <div>
      {/* Barre des sous-onglets */}
      <div className="flex items-stretch border-b border-white/10 mb-4">

        {/* Onglet Classement */}
        <button
          onClick={() => setActiveSubTab('classement')}
          className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 px-2 font-medium transition-colors"
          style={
            activeSubTab === 'classement'
              ? { color: GOLD, borderBottom: '4px solid ' + GOLD, backgroundColor: GOLD + '18', fontWeight: 700, marginBottom: '-2px' }
              : { color: '#9ca3af' }
          }
        >
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4" />
            <span className="font-bold text-sm">Classement</span>
          </div>
          <span className="text-xs font-normal" style={{ color: '#9ca3af' }}>
            Saison en cours
          </span>
        </button>

        {/* Onglet Palmarès */}
        <button
          onClick={() => setActiveSubTab('palmares')}
          className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 px-2 font-medium transition-colors"
          style={
            activeSubTab === 'palmares'
              ? { color: GOLD, borderBottom: '4px solid ' + GOLD, backgroundColor: GOLD + '18', fontWeight: 700, marginBottom: '-2px' }
              : { color: '#9ca3af' }
          }
        >
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            <span className="font-bold text-sm">Palmarès</span>
          </div>
          <span className="text-xs font-normal" style={{ color: '#9ca3af' }}>
            Toutes les finales
          </span>
        </button>
      </div>

      {/* Contenu actif */}
      {activeSubTab === 'classement' ? children : <PalmaresTop14 />}
    </div>
  );
}
