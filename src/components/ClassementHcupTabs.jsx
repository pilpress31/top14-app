// ==========================================
// CLASSEMENT HCUP - WRAPPER AVEC SOUS-ONGLETS
// ==========================================
// Fichier : src/components/ClassementHcupTabs.jsx
//
// Wrapper qui ajoute 2 sous-onglets sous le bouton C.CUP de la page Classement :
//   - [Classement]  → ClassementHcup (4 pools, scraping RugbyPass)  → par défaut
//   - [Palmarès]    → PalmaresHcup (toutes les finales depuis 1995-96)
//
// Charte HCup officielle : bleu #003E7E + or #FFC72C
// ==========================================

import { useState } from 'react';
import { Trophy, Award } from 'lucide-react';
import ClassementHcup from './ClassementHcup';
import PalmaresHcup from './PalmaresHcup';

const HCUP_BLEU = '#003E7E';
const HCUP_OR   = '#FFC72C';

export default function ClassementHcupTabs() {
  const [activeSubTab, setActiveSubTab] = useState('classement');

  return (
    <div>
      {/* ─────────────────────────────────────── */}
      {/* Barre des sous-onglets                  */}
      {/* ─────────────────────────────────────── */}
      <div className="flex items-stretch border-b-2 border-gray-200 mb-4">
        {/* Onglet Classement (par défaut) */}
        <button
          onClick={() => setActiveSubTab('classement')}
          className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 px-2 font-medium transition-colors"
          style={
            activeSubTab === 'classement'
              ? {
                  color: HCUP_BLEU,
                  borderBottom: `4px solid ${HCUP_OR}`,
                  backgroundColor: HCUP_OR + '10',
                  fontWeight: 700,
                  marginBottom: '-2px',
                }
              : { color: '#9ca3af' }
          }
        >
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4" />
            <span className="font-bold text-sm">Classement</span>
          </div>
          <span className="text-[10px] font-normal" style={{ color: '#9ca3af' }}>
            Saison en cours
          </span>
        </button>

        {/* Onglet Palmarès */}
        <button
          onClick={() => setActiveSubTab('palmares')}
          className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 px-2 font-medium transition-colors"
          style={
            activeSubTab === 'palmares'
              ? {
                  color: HCUP_BLEU,
                  borderBottom: `4px solid ${HCUP_OR}`,
                  backgroundColor: HCUP_OR + '10',
                  fontWeight: 700,
                  marginBottom: '-2px',
                }
              : { color: '#9ca3af' }
          }
        >
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            <span className="font-bold text-sm">Palmarès</span>
          </div>
          <span className="text-[10px] font-normal" style={{ color: '#9ca3af' }}>
            Toutes les finales
          </span>
        </button>
      </div>

      {/* ─────────────────────────────────────── */}
      {/* Contenu actif                           */}
      {/* ─────────────────────────────────────── */}
      {activeSubTab === 'classement' ? <ClassementHcup /> : <PalmaresHcup />}
    </div>
  );
}
