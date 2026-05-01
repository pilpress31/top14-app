import { useState, useEffect, useRef } from 'react';
import { useChampionnat } from '../contexts/ChampionnatContext';
import { Brain, Clock } from 'lucide-react';
import AlgoPronosTab from '../components/AlgoPronosTab';
import HistoriqueTab from '../components/HistoriqueTab';
import { getConfig, getStats } from "../lib/api";
import MainHeader from '../components/MainHeader';
import MainHeaderFull from '../components/MainHeaderFull';
import MainHeaderD2 from '../components/MainHeaderD2';
import MainHeaderHcup from '../components/MainHeaderHcup';
import { useResetOnActive } from "../hooks/useResetOnActive";
import { useNavigate } from "react-router-dom";

const HEADER_HEIGHT = 120;

// ============================================================
// 🆕 Configuration des championnats
// ============================================================
const CHAMPIONNATS = [
  {
    id: 'top14',
    label: 'TOP 14',
    emoji: '🏆',
    bg: '#D4A017',
    text: '#FFFFFF',
    shadowRgba: '212, 160, 23',
  },
  {
    id: 'prod2',
    label: 'PRO D2',
    emoji: '🥈',
    bg: '#00174D',
    text: '#97C1FE',
    shadowRgba: '0, 23, 77',
  },
  {
    id: 'hcup',
    label: 'C.CUP',
    emoji: '⭐',
    bg: '#003E7E',
    text: '#FFC72C',
    shadowRgba: '0, 62, 126',
  },
];

export default function IAPage() {
  const navigate = useNavigate();
  const { championnat, isD2, isHcup, setChampionnat } = useChampionnat();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
  const contentPadding = 125;

  // ============================================================
  // 🎨 Couleurs dynamiques des onglets selon championnat
  // (depuis que les headers D2/HCup sont blancs, on s'aligne sur le pattern Top14)
  // ============================================================
  const championnatColors = {
    top14: {
      activeColor: '#D4A017',
      activeBg: 'rgba(212, 160, 23, 0.05)',
      inactiveColor: '#9ca3af',
    },
    prod2: {
      activeColor: '#00174D',
      activeBg: 'rgba(0, 23, 77, 0.05)',
      inactiveColor: '#9ca3af',
    },
    hcup: {
      activeColor: '#003E7E',
      activeBg: 'rgba(0, 62, 126, 0.05)',
      inactiveColor: '#9ca3af',
    },
  };

  const colors = championnatColors[championnat] || championnatColors.top14;

  // Style barre d'onglets : maintenant TOUJOURS blanc (cohérent avec headers blancs)
  const stickyBarStyle = {
    top: `${tabsTop}px`,
    backgroundColor: '#FFFFFF',
    borderBottom: '2px solid #e5e7eb',
  };

  const tabActiveStyle = {
    color: colors.activeColor,
    borderBottom: `4px solid ${colors.activeColor}`,
    backgroundColor: colors.activeBg,
    fontWeight: 700,
  };

  const tabInactiveStyle = {
    color: colors.inactiveColor,
  };

  const subtitleStyle = {
    color: '#9ca3af',
  };

  const dividerStyle = {
    borderColor: 'rgba(156,163,175,0.3)',
  };

  // ============================================================
  // 🎯 Choix du Header selon championnat
  // ============================================================
  const renderHeader = () => {
    if (isHcup) return <MainHeaderHcup />;
    if (isD2)   return <MainHeaderD2 />;
    return <MainHeader />;
  };

  // ============================================================
  // 🎯 Choix du contenu selon championnat
  // ============================================================
  const renderContent = () => {
    if (isHcup) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-6xl mb-4">⭐</div>
          <h2 className="text-2xl font-bold text-[#003E7E] mb-2">Champions Cup</h2>
          <p className="text-gray-600 mb-6">
            Algorithme XGBoost calibré — précision <span className="font-bold text-[#003E7E]">78.3%</span>
            <br />
            <span className="text-sm">Page d'analyse en cours de développement</span>
          </p>
          <div className="bg-[#003E7E]/5 border border-[#FFC72C] rounded-xl p-4 max-w-md">
            <p className="text-sm text-[#003E7E] font-semibold mb-2">📅 Prochaines demi-finales</p>
            <p className="text-xs text-gray-700">
              🏉 Sam 02/05 — LEINSTER vs TOULON (algo : Leinster 78%)
              <br />
              🏉 Dim 03/05 — BORDEAUX vs BATH (algo : Bordeaux 85%)
            </p>
          </div>
        </div>
      );
    }

    if (activeTab === 'algorithme') return <AlgoPronosTab onMatchClick={handleMatchClick} isD2={isD2} />;
    return <HistoriqueTab headerVisible={headerVisible} isD2={isD2} />;
  };

  return (
    <div className="min-h-screen bg-rugby-white pb-24">
      {/* Header */}
      {renderHeader()}

      {/* Onglets - STICKY avec position dynamique calculée */}
      <div
        className="sticky z-40 shadow-sm transition-all duration-300"
        style={stickyBarStyle}
      >
        <div className="container mx-auto">
          <div className="flex items-stretch">
            {/* Onglet Algorithme */}
            <button
              onClick={() => setActiveTab('algorithme')}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-3 font-medium transition-colors"
              style={activeTab === 'algorithme' ? tabActiveStyle : tabInactiveStyle}
            >
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                <span className="font-bold">Algorithme</span>
              </div>
              <span className="text-xs font-normal" style={subtitleStyle}>
                Prédictions des prochains matchs
              </span>
            </button>

            {/* ============================================================ */}
            {/* 🆕 CARROUSEL 3 RECTANGLES — TOP 14 / PRO D2 / C.CUP          */}
            {/* ============================================================ */}
            <div className="flex items-center justify-center px-1 border-x" style={dividerStyle}>
              <div className="flex gap-0.5">
                {CHAMPIONNATS.map(champ => {
                  const isActive = champ.id === championnat;
                  return (
                    <button
                      key={champ.id}
                      onClick={() => setChampionnat(champ.id)}
                      aria-label={`Basculer vers ${champ.label}`}
                      aria-pressed={isActive}
                      className="rounded-lg font-bold uppercase tracking-wider transition-all duration-300 active:scale-95 flex flex-col items-center justify-center gap-0.5 leading-none"
                      style={{
                        width: '52px',
                        padding: '6px 3px',
                        backgroundColor: champ.bg,
                        color: champ.text,
                        transform: isActive ? 'scale(1.08)' : 'scale(0.92)',
                        opacity: isActive ? 1 : 0.55,
                        boxShadow: isActive
                          ? `0 4px 12px rgba(${champ.shadowRgba}, 0.5)`
                          : 'none',
                        border: isActive
                          ? `2px solid #FFC72C`
                          : '2px solid transparent',
                      }}
                    >
                      <span className="text-sm">{champ.emoji}</span>
                      <span className="text-[8px] whitespace-nowrap">{champ.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Onglet Historique */}
            <button
              onClick={() => setActiveTab('historique')}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-3 font-medium transition-colors"
              style={activeTab === 'historique' ? tabActiveStyle : tabInactiveStyle}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span className="font-bold">Historique</span>
              </div>
              <span className="text-xs font-normal" style={subtitleStyle}>
                Matchs déjà joués
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div
        className="container mx-auto px-4 py-6"
        style={{ paddingTop: `${contentPadding}px` }}
      >
        {renderContent()}
      </div>
    </div>
  );
}
