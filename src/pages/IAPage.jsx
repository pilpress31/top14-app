import { useState, useEffect, useRef } from 'react';
import { Brain, Clock } from 'lucide-react';
import AlgoPronosTab from '../components/AlgoPronosTab';
import HistoriqueTab from '../components/HistoriqueTab';
import { getConfig, getStats } from "../lib/api";
import MainHeader from '../components/MainHeader';
import MainHeaderFull from '../components/MainHeaderFull';
import { useResetOnActive } from "../hooks/useResetOnActive";
import { useNavigate } from "react-router-dom";

const HEADER_HEIGHT = 120;

export default function IAPage() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [activeTab, setActiveTab] = useState('algorithme');
  const [stats, setStats] = useState({
    nombre_matchs_historique: 3651,
    precision: { ft: { pourcentage: 0 } }
  });
  const [headerVisible, setHeaderVisible] = useState(true);

  // ✅ useRef au lieu de useState pour lastScrollY (évite les re-renders)
  const lastScrollY = useRef(0);

  const handleMatchClick = (matchInfo) => {
    navigate("/pronos", {
      state: {
        activeTab: "a-parier",
        targetMatch: matchInfo
      }
    });
  };

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

  // ✅ Scroll stable avec useRef
  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY;
      const previous = lastScrollY.current;
      const threshold = 5;

      if (current < 10) {
        setHeaderVisible(true);
      } else if (previous - current > threshold) {
        setHeaderVisible(true);
      } else if (current - previous > threshold && current > HEADER_HEIGHT) {
        setHeaderVisible(false);
      }

      lastScrollY.current = current;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []); // ✅ tableau vide — stable

  // Position sticky des onglets selon visibilité du header
  const tabsTop = headerVisible ? HEADER_HEIGHT : 0;
  // Padding top du contenu = onglets seuls (le header fixed est hors flux)
  const contentPadding = 80;

  return (
    <div className="min-h-screen bg-rugby-white pb-24">
      {/* Header */}
      {activeTab === 'algorithme' ? (
        <MainHeader />
      ) : (
        <MainHeaderFull total={stats.nombre_matchs_historique} />
      )}

      {/* Onglets - STICKY avec position dynamique calculée */}
      <div
        className="sticky bg-rugby-white border-b-2 border-rugby-gray z-40 shadow-sm transition-all duration-300"
        style={{ top: `${tabsTop}px` }}
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

      {/* Contenu - padding-top dynamique = header + onglets */}
      <div
        className="container mx-auto px-4 py-6"
        style={{ paddingTop: `${contentPadding}px` }}
      >
        {activeTab === 'algorithme' ? (
          <AlgoPronosTab onMatchClick={handleMatchClick} />
        ) : (
          <HistoriqueTab headerVisible={headerVisible} />
        )}
      </div>
    </div>
  );
}
