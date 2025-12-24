import { useState } from 'react';
import { Trophy, Users } from 'lucide-react';
import ClassementTop14Tab from "../components/ClassementTop14Tab";
import ClassementCommunauteTab from "../components/ClassementCommunauteTab";

export default function ClassementPageWithTabs() {
  const [activeTab, setActiveTab] = useState<'top14' | 'communaute'>('top14');

  return (
    <div className="min-h-screen bg-rugby-white pb-24">
      {/* Onglets */}
      <div className="bg-rugby-white border-b-2 border-rugby-gray sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto">
          <div className="flex">
            {/* Onglet Top 14 */}
            <button
              onClick={() => setActiveTab('top14')}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 font-medium transition-colors ${
                activeTab === 'top14'
                  ? 'text-rugby-gold border-b-4 border-rugby-gold bg-rugby-gold/5'
                  : 'text-rugby-bronze hover:text-rugby-gold hover:bg-rugby-gray/20'
              }`}
            >
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                <span className="font-bold">Top 14</span>
              </div>
              <span className="text-xs font-normal text-rugby-bronze">
                Classement officiel
              </span>
            </button>

            {/* Onglet Communauté */}
            <button
              onClick={() => setActiveTab('communaute')}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 font-medium transition-colors ${
                activeTab === 'communaute'
                  ? 'text-rugby-gold border-b-4 border-rugby-gold bg-rugby-gold/5'
                  : 'text-rugby-bronze hover:text-rugby-gold hover:bg-rugby-gray/20'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span className="font-bold">Communauté</span>
              </div>
              <span className="text-xs font-normal text-rugby-bronze">
                Classement des utilisateurs
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="container mx-auto px-4 py-6">
        {activeTab === 'top14' ? (
          <ClassementTop14Tab />
        ) : (
          <ClassementCommunauteTab />
        )}
      </div>
    </div>
  );
}
