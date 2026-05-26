import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Trophy, Users, Shield } from 'lucide-react';
import ClassementTop14Tab from "../components/ClassementTop14Tab";
import ClassementCommunauteTab from "../components/ClassementCommunauteTab";
import MesLiguesTab from "../components/MesLiguesTab";

type TabKey = 'top14' | 'communaute' | 'ligues';

export default function ClassementPageWithTabs() {
  const [activeTab, setActiveTab] = useState<TabKey>('top14');
  const [searchParams, setSearchParams] = useSearchParams();

  // Lien d'invitation : /classement?ligue=CODE -> ouvre l'onglet Mes Ligues.
  // Le code est transmis à MesLiguesTab qui pré-remplit le champ « rejoindre ».
  const codeInvitation = searchParams.get('ligue');

  useEffect(() => {
    if (codeInvitation) {
      setActiveTab('ligues');
    }
  }, [codeInvitation]);

  // Une fois le code consommé par MesLiguesTab, on nettoie l'URL.
  const consommerCodeInvitation = () => {
    if (searchParams.has('ligue')) {
      searchParams.delete('ligue');
      setSearchParams(searchParams, { replace: true });
    }
  };

  const ongletClass = (key: TabKey) =>
    `flex-1 flex flex-col items-center justify-center gap-1 py-3 font-medium transition-colors ${
      activeTab === key
        ? 'text-rugby-gold border-b-4 border-rugby-gold bg-rugby-gold/5'
        : 'text-rugby-bronze hover:text-rugby-gold hover:bg-rugby-gray/20'
    }`;

  return (
    <div className="min-h-screen bg-rugby-white pb-24">
      {/* Onglets */}
      <div className="bg-rugby-white border-b-2 border-rugby-gray sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto">
          <div className="flex">
            {/* Onglet Top 14 */}
            <button onClick={() => setActiveTab('top14')} className={ongletClass('top14')}>
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                <span className="font-bold">Top 14</span>
              </div>
              <span className="text-xs font-normal text-rugby-bronze">
                Classement officiel
              </span>
            </button>

            {/* Onglet Communauté */}
            <button onClick={() => setActiveTab('communaute')} className={ongletClass('communaute')}>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span className="font-bold">Communauté</span>
              </div>
              <span className="text-xs font-normal text-rugby-bronze">
                Tous les joueurs
              </span>
            </button>

            {/* Onglet Mes Ligues */}
            <button onClick={() => setActiveTab('ligues')} className={ongletClass('ligues')}>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                <span className="font-bold">Mes Ligues</span>
              </div>
              <span className="text-xs font-normal text-rugby-bronze">
                Entre amis
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="container mx-auto px-4 py-6">
        {activeTab === 'top14' && <ClassementTop14Tab />}
        {activeTab === 'communaute' && <ClassementCommunauteTab />}
        {activeTab === 'ligues' && (
          <MesLiguesTab
            codeInvitation={codeInvitation}
            onCodeConsomme={consommerCodeInvitation}
          />
        )}
      </div>
    </div>
  );
}
