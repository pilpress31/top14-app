import { useState, useEffect } from 'react';
import { Brain, Clock } from 'lucide-react';
import AlgoPronosTab from '../components/AlgoPronosTab';
import HistoriqueTab from '../components/HistoriqueTab';
import { getConfig, getStats } from "../lib/api";
import MainHeader from '../components/MainHeader';
import MainHeaderFull from '../components/MainHeaderFull';
import { useResetOnActive } from "../hooks/useResetOnActive";

export default function IAPage() {
  const [activeTab, setActiveTab] = useState('algorithme');
  const [stats, setStats] = useState({
    nombre_matchs_historique: 3651,
    precision: { ft: { pourcentage: 0 } }
  });
  const [headerVisible, setHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await getStats();
        setStats(data);
      } catch (e) {
        console.error("Erreur chargement stats:", e);
      }
    }
    loadStats();
  }, []);

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
      {/* Header variable selon l'onglet */}
      {activeTab === 'algorithme' ? (
        <MainHeader />
      ) : (
        <MainHeaderFull total={stats.nombre_matchs_historique} />
      )}

      {/* Onglets - STICKY avec position dynamique */}
      <div 
        className={`sticky bg-rugby-white border-b-2 border-rugby-gray z-40 shadow-sm transition-all duration-300 ${
          headerVisible ? 'top-[120px]' : 'top-0'
        }`}
      >
        <div className="container mx-auto">
          <div className="flex">
            {/* Onglet Algorithme */}
            <button
              onClick={() => setActiveTab('algorithme')}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 font-medium transition-colors ${
                activeTab === 'algorithme'
                  ? 'text-rugby-gold border-b-4 border-rugby-gold bg-rugby-gold/5'
                  : 'text-rugby-bronze hover:text-rugby-gold hover:bg-rugby-gray/20'
              }`}
            >
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                <span className="font-bold">Algorithme</span>
              </div>
              <span className="text-xs font-normal text-rugby-bronze">
                Prédictions des prochains matchs
              </span>
            </button>

            {/* Onglet Historique */}
            <button
              onClick={() => setActiveTab('historique')}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 font-medium transition-colors ${
                activeTab === 'historique'
                  ? 'text-rugby-gold border-b-4 border-rugby-gold bg-rugby-gold/5'
                  : 'text-rugby-bronze hover:text-rugby-gold hover:bg-rugby-gray/20'
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span className="font-bold">Historique</span>
              </div>
              <span className="text-xs font-normal text-rugby-bronze">
                Matchs déjà joués
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Contenu - avec padding-top pour le header */}
      <div className="container mx-auto px-4 py-6 pt-6 mt-[120px]">
        {activeTab === 'algorithme' ? (
          <AlgoPronosTab />
        ) : (
          <HistoriqueTab headerVisible={headerVisible} />
        )}
      </div>
    </div>
  );
}
