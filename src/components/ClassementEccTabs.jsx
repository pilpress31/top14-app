// ==========================================
// CLASSEMENT ECC — WRAPPER AVEC SOUS-ONGLETS
// Fichier : src/components/ClassementEccTabs.jsx
// ==========================================
// Deux sous-onglets sous le segment 🛡️ CHALL. :
//   - [Classement]  → ClassementEcc (3 poules + phases finales)  → par défaut
//   - [Palmarès]    → PalmaresEcc (vainqueurs par saison)
//
// Charte ECC : vert challenge #2E7D32 + bronze #CD7F32
// ==========================================

import { useState } from 'react';
import { Award, Trophy } from 'lucide-react';
import ClassementEcc from './ClassementEcc';
import PalmaresEcc from './PalmaresEcc';
import { getCharte } from '../constants/chartes';

const { vert: ECC_VERT } = getCharte('ecc').base;

export default function ClassementEccTabs() {
  const [activeSubTab, setActiveSubTab] = useState('classement');

  const styleActif = {
    color: ECC_VERT,
    borderBottom: `4px solid ${ECC_VERT}`,
    backgroundColor: ECC_VERT + '12',
    fontWeight: 700,
    marginBottom: '-2px',
  };

  return (
    <div>
      {/* Barre des sous-onglets */}
      <div className="flex items-stretch border-b border-white/10 mb-4">
        <button
          onClick={() => setActiveSubTab('classement')}
          className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 px-2 font-medium transition-colors"
          style={activeSubTab === 'classement' ? styleActif : { color: '#9ca3af' }}
        >
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4" />
            <span className="font-bold text-sm">Classement</span>
          </div>
          <span className="text-[10px] font-normal" style={{ color: '#9ca3af' }}>
            Saison en cours
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('palmares')}
          className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 px-2 font-medium transition-colors"
          style={activeSubTab === 'palmares' ? styleActif : { color: '#9ca3af' }}
        >
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            <span className="font-bold text-sm">Palmarès</span>
          </div>
          <span className="text-[10px] font-normal" style={{ color: '#9ca3af' }}>
            Vainqueurs par saison
          </span>
        </button>
      </div>

      {/* Contenu actif */}
      {activeSubTab === 'classement' ? <ClassementEcc /> : <PalmaresEcc />}
    </div>
  );
}
