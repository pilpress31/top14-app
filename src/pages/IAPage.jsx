import { useState, useEffect, useRef } from 'react';
import { useChampionnat } from '../contexts/ChampionnatContext';
import { Brain, Clock } from 'lucide-react';
import AlgoPronosTab from '../components/AlgoPronosTab';
import HistoriqueTab from '../components/HistoriqueTab';
import { getConfig, getStats } from "../lib/api";
import MainHeader from '../components/MainHeader';
import MainHeaderFull from '../components/MainHeaderFull';
import MainHeaderD2 from '../components/MainHeaderD2';
// 🆕 HCup : header dédié (à créer si pas encore fait — fallback ci-dessous)
// import MainHeaderHcup from '../components/MainHeaderHcup';
import { useResetOnActive } from "../hooks/useResetOnActive";
import { useNavigate } from "react-router-dom";

const HEADER_HEIGHT = 120;

// ============================================================
// 🆕 Configuration des championnats — facile à étendre
// ============================================================
const CHAMPIONNATS = [
  {
    id: 'top14',
    label: 'TOP 14',
    emoji: '🏆',
    bg: '#D4A017',           // or
    text: '#FFFFFF',
    shadowRgba: '212, 160, 23',
  },
  {
    id: 'prod2',
    label: 'PRO D2',
    emoji: '🥈',
    bg: '#00174D',           // bleu marine
    text: '#97C1FE',
    shadowRgba: '0, 23, 77',
  },
  {
    id: 'hcup',
    label: 'C.CUP',
    emoji: '⭐',
    bg: '#003E7E',           // bleu EPCR
    text: '#FFC72C',         // accent or
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
  const contentPadding = 125;

  // ============================================================
  // 🎨 Couleurs dynamiques de la barre d'onglets selon championnat
  // ============================================================
  const stickyBarStyle = (() => {
    if (isHcup) {
      return { top: `${tabsTop}px`, backgroundColor: '#003E7E', borderBottom: '2px solid #FFC72C' };
    }
    if (isD2) {
      return { top: `${tabsTop}px`, backgroundColor: '#00174D', borderBottom: '2px solid #C0C0C0' };
    }
    return { top: `${tabsTop}px`, backgroundColor: '#FFFFFF', borderBottom: '2px solid #e5e7eb' };
  })();

  // Style des onglets (Algorithme / Historique) selon championnat
  const tabActiveStyle = (() => {
    if (isHcup) return { color: '#FFFFFF', borderBottom: '4px solid #FFC72C', backgroundColor: 'rgba(255,199,44,0.12)', fontWeight: 700 };
    if (isD2)   return { color: '#FFFFFF', borderBottom: '4px solid #C0C0C0', backgroundColor: 'rgba(255,255,255,0.12)', fontWeight: 700 };
    return null; // Top14 utilise les classes Tailwind
  })();

  const tabInactiveStyle = (() => {
    if (isHcup) return { color: '#FFC72C' };
    if (isD2)   return { color: '#97C1FE' };
    return null;
  })();

  const subtitleStyle = (() => {
    if (isHcup) return { color: 'rgba(255,199,44,0.8)' };
    if (isD2)   return { color: 'rgba(192,192,192,0.8)' };
    return { color: '#9ca3af' };
  })();

  const dividerStyle = (() => {
    if (isHcup) return { borderColor: 'rgba(255,199,44,0.3)' };
    if (isD2)   return { borderColor: 'rgba(192,192,192,0.3)' };
    return { borderColor: 'rgba(156,163,175,0.3)' };
  })();

  // ============================================================
  // 🎯 Choix du Header selon championnat
  // ============================================================
  const renderHeader = () => {
    if (isHcup) {
      // TODO: remplacer par <MainHeaderHcup /> une fois créé
      return <MainHeaderD2 />;
    }
    if (isD2) return <MainHeaderD2 />;
    return <MainHeader />;
  };

  // ============================================================
  // 🎯 Choix du contenu selon championnat
  // ============================================================
  const renderContent = () => {
    if (isHcup) {
      // TODO : composants HCup spécifiques pour Algorithme + Historique
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

    // Top14 + D2 (le composant gère isD2 en interne)
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
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 font-medium transition-colors ${
                activeTab === 'algorithme'
                  ? (isD2 || isHcup ? '' : 'text-rugby-gold border-b-4 border-rugby-gold bg-rugby-gold/5')
                  : (isD2 || isHcup ? '' : 'text-rugby-bronze hover:text-rugby-gold hover:bg-rugby-gray/20')
              }`}
              style={
                (isD2 || isHcup)
                  ? (activeTab === 'algorithme' ? tabActiveStyle : tabInactiveStyle)
                  : {}
              }
            >
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                <span className="font-bold">Algorithme</span>
              </div>
              <span className="text-xs font-normal" style={(isD2 || isHcup) ? subtitleStyle : { color: '#9ca3af' }}>
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
                        // ✨ Actif = scale + ombre + bord doré
                        transform: isActive ? 'scale(1.08)' : 'scale(0.92)',
                        opacity: isActive ? 1 : 0.55,
                        boxShadow: isActive
                          ? `0 4px 12px rgba(${champ.shadowRgba}, 0.5)`
                          : 'none',
                        border: isActive
                          ? `2px solid #FFC72C`   // bordure or sur l'actif
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
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 font-medium transition-colors ${
                activeTab === 'historique'
                  ? (isD2 || isHcup ? '' : 'text-rugby-gold border-b-4 border-rugby-gold bg-rugby-gold/5')
                  : (isD2 || isHcup ? '' : 'text-rugby-bronze hover:text-rugby-gold hover:bg-rugby-gray/20')
              }`}
              style={
                (isD2 || isHcup)
                  ? (activeTab === 'historique' ? tabActiveStyle : tabInactiveStyle)
                  : {}
              }
            >
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span className="font-bold">Historique</span>
              </div>
              <span className="text-xs font-normal" style={(isD2 || isHcup) ? subtitleStyle : { color: '#9ca3af' }}>
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
        {renderContent()}
      </div>
    </div>
  );
}
