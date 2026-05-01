import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Target, Trophy } from 'lucide-react';
import MesPronosTab from '../components/MesPronosTab';
import MesParisTab from '../components/MesParisTab';
import MainHeader from '../components/MainHeaderFull';
import MainHeaderD2 from '../components/MainHeaderD2';
// 🆕 HCup : header dédié (à créer si pas encore fait — fallback ci-dessous)
// import MainHeaderHcup from '../components/MainHeaderHcup';
// 🆕 HCup : tabs dédiées (à créer)
// import MesPronosHcupTab from '../components/MesPronosHcupTab';
// import MesParisHcupTab from '../components/MesParisHcupTab';
import { useChampionnat } from '../contexts/ChampionnatContext';

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
    activeTab: 'text-rugby-gold border-b-4 border-rugby-gold bg-rugby-gold/5',
    inactiveTab: 'text-rugby-bronze hover:text-rugby-gold hover:bg-rugby-gray/20',
  },
  {
    id: 'prod2',
    label: 'PRO D2',
    emoji: '🥈',
    bg: '#00174D',           // bleu marine
    text: '#97C1FE',
    shadowRgba: '0, 23, 77',
    activeTab: 'text-[#00174D] border-b-4 border-[#00174D] bg-[#97C1FE]/10',
    inactiveTab: 'text-gray-500 hover:text-[#00174D] hover:bg-[#97C1FE]/10',
  },
  {
    id: 'hcup',
    label: 'CHAMP. CUP',
    emoji: '⭐',
    bg: '#003E7E',           // bleu EPCR
    text: '#FFC72C',         // accent or
    shadowRgba: '0, 62, 126',
    activeTab: 'text-[#003E7E] border-b-4 border-[#FFC72C] bg-[#003E7E]/5',
    inactiveTab: 'text-gray-500 hover:text-[#003E7E] hover:bg-[#FFC72C]/10',
  },
];

export default function PronosPage() {
  const location = useLocation();
  const { championnat, isD2, isHcup, setChampionnat } = useChampionnat();
  const [activeTab, setActiveTab] = useState('a-parier');
  const [headerVisible, setHeaderVisible] = useState(true);

  const lastScrollY = useRef(0);

  const goToMesParis = () => { setActiveTab("mes-paris"); };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (activeTab === 'a-parier') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeTab]);

  // 🆕 N'applique location.state.activeTab QU'UNE seule fois par navigation.
  const lastHandledKey = useRef(null);
  useEffect(() => {
    if (location.key === lastHandledKey.current) return;
    lastHandledKey.current = location.key;

    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.key, location.state]);

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
  const contentPaddingTop = 120;

  // ============================================================
  // 🎨 Couleurs dynamiques : récupération depuis la config
  // ============================================================
  const currentConfig = CHAMPIONNATS.find(c => c.id === championnat) || CHAMPIONNATS[0];
  const activeTabColor = currentConfig.activeTab;
  const inactiveTabColor = currentConfig.inactiveTab;

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
      // TODO : créer MesPronosHcupTab et MesParisHcupTab
      // Pour l'instant on affiche un placeholder
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-6xl mb-4">⭐</div>
          <h2 className="text-2xl font-bold text-[#003E7E] mb-2">Champions Cup</h2>
          <p className="text-gray-600 mb-6">
            Bientôt disponible !
            <br />
            La page de paris HCup arrive très prochainement.
          </p>
          <div className="bg-[#003E7E]/5 border border-[#FFC72C] rounded-xl p-4 max-w-md">
            <p className="text-sm text-[#003E7E] font-semibold mb-2">📅 Prochaines demi-finales</p>
            <p className="text-xs text-gray-700">
              🏉 Sam 02/05 — LEINSTER vs TOULON
              <br />
              🏉 Dim 03/05 — BORDEAUX vs BATH
            </p>
          </div>
        </div>
      );
    }

    // Top 14 + D2 : composants existants (gèrent déjà isD2 en interne via le context)
    if (activeTab === 'a-parier') return <MesPronosTab goToMesParis={goToMesParis} />;
    if (activeTab === 'mes-paris') return <MesParisTab />;
    return null;
  };

  return (
    <div className="min-h-screen bg-rugby-white pb-24">
      {renderHeader()}

      {/* Zone sticky : onglets + carrousel central de bascule championnat */}
      <div
        className="sticky bg-rugby-white border-b-2 border-rugby-gray z-40 shadow-sm transition-all duration-300"
        style={{ top: `${tabsTop}px` }}
      >
        <div className="container mx-auto">
          <div className="flex items-stretch relative">

            {/* Onglet À parier */}
            <button
              onClick={() => setActiveTab('a-parier')}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 font-medium transition-colors ${
                activeTab === 'a-parier' ? activeTabColor : inactiveTabColor
              }`}
            >
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                <span className="font-bold">À parier</span>
              </div>
              <span className="text-xs font-normal">Prochains matchs disponibles</span>
            </button>

            {/* ============================================================ */}
            {/* 🆕 CARROUSEL 3 RECTANGLES — TOP 14 / PRO D2 / CHAMP. CUP     */}
            {/* ============================================================ */}
            <div className="self-center flex gap-1 mx-1">
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
                      // Largeur fixe pour les 3, un peu plus large quand actif via scale
                      width: '64px',
                      padding: '8px 4px',
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
                    <span className="text-base">{champ.emoji}</span>
                    <span className="text-[9px] whitespace-nowrap">{champ.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Onglet Mes paris */}
            <button
              onClick={() => setActiveTab('mes-paris')}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 font-medium transition-colors ${
                activeTab === 'mes-paris' ? activeTabColor : inactiveTabColor
              }`}
            >
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                <span className="font-bold">Mes paris</span>
              </div>
              <span className="text-xs font-normal">Historique &amp; statistiques</span>
            </button>

          </div>
        </div>
      </div>

      {/* Contenu */}
      <div
        className="container mx-auto px-4 pb-4"
        style={{ paddingTop: `${contentPaddingTop}px` }}
      >
        {renderContent()}
      </div>
    </div>
  );
}
