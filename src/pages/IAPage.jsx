import { useState, useEffect, useRef } from 'react';
import { useChampionnat } from '../contexts/ChampionnatContext';
import { Brain, Clock } from 'lucide-react';
import AlgoPronosTab from '../components/AlgoPronosTab';
import HistoriqueTab from '../components/HistoriqueTab';
import AlgoPronosHcupTab from '../components/AlgoPronosHcupTab';
import HistoriqueHcupTab from '../components/HistoriqueHcupTab';
import AlgoPronosMondeTab from '../components/AlgoPronosMondeTab';
import HistoriqueMondeTab from '../components/HistoriqueMondeTab';
import MainHeader from '../components/MainHeader';
import MainHeaderD2 from '../components/MainHeaderD2';
import MainHeaderHcup from '../components/MainHeaderHcup';
import MainHeaderMonde from '../components/MainHeaderMonde';
import AlgoPronosEccTab from '../components/AlgoPronosEccTab';
import HistoriqueEccTab from '../components/HistoriqueEccTab';
import MainHeaderEcc from '../components/MainHeaderEcc';
import { getStats } from "../lib/api";
import { useNavigate } from "react-router-dom";

const HEADER_HEIGHT = 120;

// Couleurs des 4 championnats pour le carrousel
const CHAMPIONNATS = {
  top14: { label: 'TOP 14', emoji: '🏆', bg: '#FFFFFF', accent: '#D4A017', borderActive: '#FFC72C' },
  prod2: { label: 'PRO D2', emoji: '🥈', bg: '#00174D', accent: '#C0C0C0', borderActive: '#FFC72C' },
  hcup:  { label: 'C.CUP',  emoji: '⭐', bg: '#003E7E', accent: '#FFC72C', borderActive: '#FFC72C' },
  ecc:   { label: 'CHALL.', emoji: '🛡️', bg: '#1B5E20', accent: '#CD7F32', borderActive: '#CD7F32' },
  monde: { label: 'MONDE',  emoji: '🌍', bg: '#064E3B', accent: '#34D399', borderActive: '#34D399' },
};

export default function IAPage() {
  const navigate = useNavigate();
  const { championnat, setChampionnat } = useChampionnat();
  const [activeTab, setActiveTab] = useState('algorithme');
  const [stats, setStats] = useState({
    nombre_matchs_historique: 3651,
    precision: { ft: { pourcentage: 0 } }
  });
  const [headerVisible, setHeaderVisible] = useState(true);

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
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [championnat]);

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
  }, []);

  const tabsTop = headerVisible ? HEADER_HEIGHT : 0;
  // Padding fixe = identique à l'original (125)
  const contentPadding = 125;

  const isD2 = championnat === 'prod2';
  const isHcup = championnat === 'hcup';
  const isMonde = championnat === 'monde';
  const isEcc = championnat === 'ecc';

  // Choisir le header selon le championnat actif (toujours le header "algo" sur la page IA)
  // Note : MainHeaderFull et ses variants D2/Hcup/Monde sont réservés à la page Paris (/pronos),
  // car ils affichent les stats users (paris gagnants), pas la précision algo.
  const renderHeader = () => {
    if (isMonde) return <MainHeaderMonde isVisible={headerVisible} />;
    if (isEcc) return <MainHeaderEcc isVisible={headerVisible} />;
    if (isHcup) return <MainHeaderHcup isVisible={headerVisible} />;
    if (isD2) return <MainHeaderD2 isVisible={headerVisible} />;
    return <MainHeader isVisible={headerVisible} />;
  };

  const champConf = CHAMPIONNATS[championnat] || CHAMPIONNATS.top14;
  const activeTabStyle = {
    color: champConf.accent,
    borderBottom: `4px solid ${champConf.borderActive}`,
    backgroundColor: 'rgba(255,255,255,0.05)',
  };
  const inactiveTabStyle = { color: '#94a3b8', borderBottom: '4px solid transparent' };

  return (
    <div className="min-h-screen bg-[#0c1322] pb-32">
      {renderHeader()}

      {/* Onglets - STICKY - z-40 (sous le header en z-50, comme PronosPage) */}
      <div
        className="sticky bg-[#0c1322] border-b border-white/10 z-40 shadow-md transition-all duration-300"
        style={{ top: `${tabsTop}px` }}
      >
        <div className="container mx-auto">
          <div className="flex items-stretch">

            {/* Onglet Algorithme */}
            <button
              onClick={() => setActiveTab('algorithme')}
              className="flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 py-2.5 px-1 font-medium transition-colors hover:bg-white/5"
              style={activeTab === 'algorithme' ? activeTabStyle : inactiveTabStyle}
            >
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                <span className="font-bold">Algorithme</span>
              </div>
              <span className="text-[10px] font-normal leading-tight text-gray-500">
                Prédictions des prochains matchs
              </span>
            </button>

            {/* Onglet Historique */}
            <button
              onClick={() => setActiveTab('historique')}
              className="flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 py-2.5 px-1 font-medium transition-colors hover:bg-white/5"
              style={activeTab === 'historique' ? activeTabStyle : inactiveTabStyle}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span className="font-bold">Historique</span>
              </div>
              <span className="text-[10px] font-normal leading-tight text-gray-500">
                Matchs déjà joués
              </span>
            </button>
          </div>

          {/* Ligne 2 : sélecteur de championnat (segmented control pleine largeur) */}
          <div className="px-3 pt-1 pb-2">
            <div className="flex items-center gap-1 rounded-full bg-white/5 p-1">
              {Object.entries(CHAMPIONNATS).map(([key, conf]) => {
                const isActive = championnat === key;
                return (
                  <button
                    key={key}
                    onClick={() => setChampionnat(key)}
                    aria-label={`Passer à ${conf.label}`}
                    className="flex-1 min-w-0 flex items-center justify-center gap-1 rounded-full px-1 py-1.5 text-[10px] font-bold uppercase tracking-tight whitespace-nowrap transition-all"
                    style={isActive ? { backgroundColor: conf.accent, color: '#0c1322' } : { color: '#94a3b8' }}
                  >
                    <span style={{ fontSize: '12px', lineHeight: 1 }}>{conf.emoji}</span>
                    {conf.label}
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* Contenu - padding-top identique à l'original (125) */}
      <div
        className="container mx-auto px-4 py-6"
        style={{ paddingTop: `${contentPadding}px` }}
      >
        {activeTab === 'algorithme' ? (
          isMonde
            ? <AlgoPronosMondeTab />
            : isEcc
            ? <AlgoPronosEccTab />
            : isHcup
            ? <AlgoPronosHcupTab />
            : <AlgoPronosTab onMatchClick={handleMatchClick} isD2={isD2} />
        ) : (
          isMonde
            ? <HistoriqueMondeTab />
            : isEcc
            ? <HistoriqueEccTab />
            : isHcup
            ? <HistoriqueHcupTab />
            : <HistoriqueTab headerVisible={headerVisible} isD2={isD2} />
        )}
      </div>
    </div>
  );
}
