// ==========================================
// CLASSEMENT MONDE - WRAPPER AVEC SOUS-ONGLETS
// Fichier : src/components/ClassementMondeTabs.jsx
// ==========================================
// Deux sous-onglets sous le segment 🌍 MONDE :
//   - [Classement]  → ClassementMonde (classement mondial World Rugby)  → par défaut
//   - [Palmarès]    → PalmaresMonde (vainqueurs par compétition)
//
// Charte MONDE : émeraude #0B6E4F / #34D399
// ==========================================

import { useState } from 'react';
import { Award, Trophy } from 'lucide-react';
import ClassementMonde from './ClassementMonde';
import PalmaresMonde from './PalmaresMonde';
import ClassementCompetitionsMonde from './ClassementCompetitionsMonde';

const MONDE_VERT = '#0B6E4F';

export default function ClassementMondeTabs() {
  const [activeSubTab, setActiveSubTab] = useState('classement');

  const styleActif = {
    color: MONDE_VERT,
    borderBottom: `4px solid ${MONDE_VERT}`,
    backgroundColor: MONDE_VERT + '12',
    fontWeight: 700,
    marginBottom: '-2px',
  };

  return (
    <div>
      {/* Barre des sous-onglets */}
      <div className="flex items-stretch border-b border-white/10 mb-4">
        {/* Onglet Classement */}
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
            Mondial World Rugby
          </span>
        </button>

        {/* Onglet Palmarès */}
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
            Par compétition
          </span>
        </button>
      </div>

      {/* Contenu actif */}
      {activeSubTab === 'classement' ? (
        <>
          <ClassementMonde />
          <ClassementCompetitionsMonde />
        </>
      ) : (
        <PalmaresMonde />
      )}
    </div>
  );
}
