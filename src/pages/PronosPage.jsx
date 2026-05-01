import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Target, Trophy } from 'lucide-react';
import MesPronosTab from '../components/MesPronosTab';
import MesParisTab from '../components/MesParisTab';
import MainHeader from '../components/MainHeaderFull';
import MainHeaderD2 from '../components/MainHeaderD2';
// 🆕 HCup : header dédié (à créer si pas encore fait — sinon utilise un fallback)
// import MainHeaderHcup from '../components/MainHeaderHcup';
// 🆕 HCup : tabs dédiées (à créer)
// import MesPronosHcupTab from '../components/MesPronosHcupTab';
// import MesParisHcupTab from '../components/MesParisHcupTab';
import { useChampionnat } from '../contexts/ChampionnatContext';

const HEADER_HEIGHT = 120;

// ============================================================
// Configuration des championnats — facile à étendre
// ============================================================
const CHAMPIONNAT_CONFIG = {
  top14: {
    label: 'TOP 14',
    emoji: '🏆',
    bgClass: 'bg-rugby-gold hover:bg-rugby-bronze',
    textClass: 'text-white',
    activeTabClass: 'text-rugby-gold border-b-4 border-rugby-gold bg-rugby-gold/5',
    inactiveTabClass: 'text-rugby-bronze hover:text-rugby-gold hover:bg-rugby-gray/20',
    dotActiveClass: 'bg-rugby-gold',
  },
  prod2: {
    label: 'PRO D2',
    emoji: '🥈',
    bgClass: 'bg-[#00174D] hover:bg-[#001a5c]',
    textClass: 'text-[#97C1FE]',
    activeTabClass: 'text-[#00174D] border-b-4 border-[#00174D] bg-[#97C1FE]/10',
    inactiveTabClass: 'text-gray-500 hover:text-[#00174D] hover:bg-[#97C1FE]/10',
    dotActiveClass: 'bg-[#00174D]',
  },
  hcup: {
    label: 'CHAMP. CUP',
    emoji: '⭐',
    bgClass: 'bg-[#003E7E] hover:bg-[#002a5c]',
    textClass: 'text-[#FFC72C]',
    activeTabClass: 'text-[#003E7E] border-b-4 border-[#FFC72C] bg-[#003E7E]/5',
    inactiveTabClass: 'text-gray-500 hover:text-[#003E7E] hover:bg-[#FFC72C]/10',
    dotActiveClass: 'bg-[#003E7E]',
  },
};

// Ordre des dots (doit matcher l'ordre du carrousel dans ChampionnatContext)
const DOT_ORDER = ['top14', 'prod2', 'hcup'];

export default function PronosPage() {
  const location = useLocation();
  const { championnat, isD2, isHcup, nextChampionnat } = useChampionnat();
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
  const config = CHAMPIONNAT_CONFIG[championnat] || CHAMPIONNAT_CONFIG.top14;
  const activeTabColor = config.activeTabClass;
  const inactiveTabColor = config.inactiveTabClass;

  // ============================================================
  // 🎯 Choix du Header selon championnat
  // ============================================================
  const renderHeader = () => {
    if (isHcup) {
      // TODO: remplacer par <MainHeaderHcup /> une fois créé
      // Pour l'instant on réutilise MainHeaderD2 comme fallback (couleurs proches)
      return <MainHeaderD2 />;
    }
    if (isD2) return <MainHeaderD2 />;
    return <MainHeader />;
  };

  // ============================================================
  // 🎯 Choix du contenu selon championnat (à compléter pour HCup)
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
            <p className="text-sm text-[#003E7E] font-semibold mb-2">📅 Prochains matchs</p>
            <p className="text-xs text-gray-700">
              🔵 Sam 02/05 — LEINSTER vs TOULON (Demi-finale)
              <br />
              🔴 Dim 03/05 — BORDEAUX vs BATH (Demi-finale)
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

      {/* Zone sticky : onglets + bouton central de bascule championnat */}
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
            {/* 🆕 BOUTON CARROUSEL 3 ÉTATS : TOP 14 → PRO D2 → CHAMP. CUP   */}
            {/* ============================================================ */}
            <button
              onClick={nextChampionnat}
              aria-label={`Championnat actuel : ${config.label}. Cliquer pour changer.`}
              className={`self-center mx-1 px-3 py-2 rounded-lg font-bold text-xs uppercase tracking-wider shadow-md transition-all active:scale-95 ${config.bgClass} ${config.textClass}`}
            >
              <div className="flex flex-col items-center gap-0.5 leading-none">
                <span className="text-base">{config.emoji}</span>
                <span className="text-[10px] whitespace-nowrap">{config.label}</span>
                {/* 🆕 Indicateur de position (3 dots) */}
                <div className="flex gap-1 mt-1">
                  {DOT_ORDER.map(c => (
                    <span
                      key={c}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        c === championnat
                          ? 'bg-current scale-110'
                          : 'bg-current/30'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </button>

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
