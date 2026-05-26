import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Trophy, Users, Shield } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import axios from 'axios';
import ClassementTop14Tab from "../components/ClassementTop14Tab";
import ClassementCommunauteTab from "../components/ClassementCommunauteTab";
import MesLiguesTab from "../components/MesLiguesTab";

const API_BASE = 'https://top14-api-production.up.railway.app';

type TabKey = 'top14' | 'communaute' | 'ligues';

export default function ClassementPageWithTabs() {
  const [activeTab, setActiveTab] = useState<TabKey>('top14');
  const [searchParams, setSearchParams] = useSearchParams();
  const [nbInvitations, setNbInvitations] = useState(0);

  // Compte des invitations de ligue en attente — alimente la pastille
  // de l'onglet « Mes Ligues ». Source de vérité unique, partagée avec
  // MesLiguesTab (qui appelle rafraichirInvitations après accept/refus).
  const rafraichirInvitations = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) { setNbInvitations(0); return; }
      const res = await axios.get(`${API_BASE}/api/leagues/invitations`, {
        headers: { 'x-user-id': user.id },
        params: { _: Date.now() },
      });
      setNbInvitations(Array.isArray(res.data) ? res.data.length : 0);
    } catch {
      setNbInvitations(0);
    }
  }, []);

  useEffect(() => { rafraichirInvitations(); }, [rafraichirInvitations]);

  // Lien d'invitation : /classement?ligue=CODE -> ouvre l'onglet Mes Ligues.
  // Le code est transmis à MesLiguesTab qui pré-remplit le champ « rejoindre ».
  const codeInvitation = searchParams.get('ligue');
  // Lien direct vers un onglet : /classement?tab=ligues (depuis la page Plus).
  const tabDemande = searchParams.get('tab');

  useEffect(() => {
    if (codeInvitation || tabDemande === 'ligues') {
      setActiveTab('ligues');
    } else if (tabDemande === 'communaute') {
      setActiveTab('communaute');
    } else if (tabDemande === 'top14') {
      setActiveTab('top14');
    }
    // Le paramètre tab a été appliqué -> on le retire de l'URL (sans toucher
    // à « ligue », encore nécessaire à MesLiguesTab).
    if (tabDemande) {
      searchParams.delete('tab');
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeInvitation, tabDemande]);

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
              <div className="flex items-center gap-2 relative">
                <Shield className="w-5 h-5" />
                <span className="font-bold">Mes Ligues</span>
                {nbInvitations > 0 && (
                  <span
                    className="absolute -top-2 -right-3 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold"
                    title={`${nbInvitations} invitation${nbInvitations > 1 ? 's' : ''} en attente`}
                  >
                    {nbInvitations}
                  </span>
                )}
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
            onInvitationsChange={rafraichirInvitations}
          />
        )}
      </div>
    </div>
  );
}
