// ==========================================
// CLASSEMENT PRO D2 - WRAPPER AVEC SOUS-ONGLETS
// ==========================================
// Wrapper qui ajoute 2 sous-onglets sous le bouton PRO D2 :
//   - [Classement]  → tableau classement saison en cours  (par défaut)
//   - [Palmarès]    → PalmaresD2 (toutes les finales depuis 1925)
//
// Charte Pro D2 : #00174D / #C0C0C0 / #97C1FE
// ==========================================

import { useState } from 'react';
import { Award, Trophy } from 'lucide-react';
import PalmaresD2 from './PalmaresD2';
import { getCharte } from '../constants/chartes';

const { navy: D2_NAVY, blue: D2_BLUE } = getCharte('prod2').base;

export default function ClassementD2Tabs({ children }) {
  const [activeSubTab, setActiveSubTab] = useState('classement');

  return (
    <div>
      {/* Barre des sous-onglets */}
      <div className="flex items-stretch border-b-2 border-gray-200 mb-4">

        {/* Onglet Classement */}
        <button
          onClick={() => setActiveSubTab('classement')}
          className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 px-2 font-medium transition-colors"
          style={
            activeSubTab === 'classement'
              ? { color: D2_NAVY, borderBottom: '4px solid ' + D2_NAVY, backgroundColor: D2_BLUE + '30', fontWeight: 700, marginBottom: '-2px' }
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
              ? { color: D2_NAVY, borderBottom: '4px solid ' + D2_NAVY, backgroundColor: D2_BLUE + '30', fontWeight: 700, marginBottom: '-2px' }
              : { color: '#9ca3af' }
          }
        >
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            <span className="font-bold text-sm">Palmarès</span>
          </div>
          <span className="text-xs font-normal" style={{ color: '#9ca3af' }}>
            Depuis 1925
          </span>
        </button>
      </div>

      {/* Contenu actif */}
      {activeSubTab === 'classement' ? children : <PalmaresD2 />}
    </div>
  );
}
