import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Target, Trophy } from 'lucide-react';
import MesPronosTab from '../components/MesPronosTab';
import MesParisTab from '../components/MesParisTab';
import MainHeader from '../components/MainHeader';
import { useResetOnActive } from "../hooks/useResetOnActive";

export default function PronosPage() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('a-parier');
  const [headerVisible, setHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const goToMesParis = () => { setActiveTab("mes-paris"); };


  // ✅ Ouvrir l'onglet "Mes paris" si state est passé
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location]);

  // Détection du scroll pour synchroniser avec le header
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < 10) {
        setHeaderVisible(true);
      } else if (currentScrollY < lastScrollY) {
        setHeaderVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 120) {
        setHeaderVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <div className="min-h-screen bg-rugby-white pb-24">
      {/* Header */}
      <MainHeader />

      {/* Onglets - STICKY avec position dynamique */}
      <div 
        className={`sticky bg-rugby-white border-b-2 border-rugby-gray z-40 shadow-sm transition-all duration-300 ${
          headerVisible ? 'top-[120px]' : 'top-0'
        }`}
      >
        <div className="container mx-auto">
          <div className="flex">
            {/* Onglet À parier */}
            <button
              onClick={() => setActiveTab('a-parier')}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 font-medium transition-colors ${
                activeTab === 'a-parier'
                  ? 'text-rugby-gold border-b-4 border-rugby-gold bg-rugby-gold/5'
                  : 'text-rugby-bronze hover:text-rugby-gold hover:bg-rugby-gray/20'
              }`}
            >
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                <span className="font-bold">À parier</span>
              </div>
              <span className="text-xs font-normal text-rugby-bronze">
                Prochains matchs disponibles
              </span>
            </button>

            {/* Onglet Mes paris */}
            <button
              onClick={() => setActiveTab('mes-paris')}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 font-medium transition-colors ${
                activeTab === 'mes-paris'
                  ? 'text-rugby-gold border-b-4 border-rugby-gold bg-rugby-gold/5'
                  : 'text-rugby-bronze hover:text-rugby-gold hover:bg-rugby-gray/20'
              }`}
            >
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                <span className="font-bold">Mes paris</span>
              </div>
              <span className="text-xs font-normal text-rugby-bronze">
                Historique & statistiques
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Contenu - avec padding-top pour le header */}
      <div className="container mx-auto px-4 py-6 pt-6 mt-[120px]">
        {activeTab === 'a-parier' && (
          <MesPronosTab goToMesParis={goToMesParis} />
        )}

        {activeTab === 'mes-paris' && (
          <MesParisTab />
        )}


      </div>
    </div>
  );
}