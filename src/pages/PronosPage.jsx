import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Target, Trophy } from 'lucide-react';
import MesPronosTab from '../components/MesPronosTab';
import MesParisTab from '../components/MesParisTab';
import MesPronosHcupTab from '../components/MesPronosHcupTab';
import MesParisHcupTab from '../components/MesParisHcupTab';
import MainHeader from '../components/MainHeaderFull';
import MainHeaderD2 from '../components/MainHeaderFullD2';
import MainHeaderHcup from '../components/MainHeaderFullHcup';
import { useChampionnat } from '../contexts/ChampionnatContext';

const HEADER_HEIGHT = 120;

// Couleurs des 3 championnats pour le carrousel
const CHAMPIONNATS = {
  top14: { label: 'TOP 14', emoji: '🏆', bg: '#FFFFFF', accent: '#D4A017', borderActive: '#FFC72C' },
  prod2: { label: 'PRO D2', emoji: '🥈', bg: '#00174D', accent: '#C0C0C0', borderActive: '#FFC72C' },
  hcup:  { label: 'C.CUP',  emoji: '⭐', bg: '#003E7E', accent: '#FFC72C', borderActive: '#FFC72C' },
};

export default function PronosPage() {
  const location = useLocation();
  const { championnat, setChampionnat } = useChampionnat();
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

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [championnat]);

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

  // Padding fixe (identique à l'original = 120)
  // La hauteur des onglets reste ~65px car le carrousel est compact
  const contentPaddingTop = 120;

  const isD2 = championnat === 'prod2';
  const isHcup = championnat === 'hcup';

  // Style des onglets actifs selon championnat
  const activeTabStyle = isHcup
    ? { color: '#003E7E', borderBottom: '4px solid #FFC72C', backgroundColor: 'rgba(255,199,44,0.05)' }
    : isD2
      ? { color: '#00174D', borderBottom: '4px solid #00174D', backgroundColor: 'rgba(151,193,254,0.1)' }
      : null;

  const activeTabClassName = (!isHcup && !isD2)
    ? 'text-rugby-gold border-b-4 border-rugby-gold bg-rugby-gold/5'
    : '';

  const inactiveTabClassName = isHcup
    ? 'text-gray-500 hover:bg-gray-100'
    : isD2
      ? 'text-gray-500 hover:text-[#00174D] hover:bg-[#97C1FE]/10'
      : 'text-rugby-bronze hover:text-rugby-gold hover:bg-rugby-gray/20';

  const HeaderComponent = isHcup ? MainHeaderHcup : isD2 ? MainHeaderD2 : MainHeader;

  return (
    <div className="min-h-screen bg-rugby-white pb-24">
      <HeaderComponent isVisible={headerVisible} />

      {/* Zone sticky : onglets + carrousel championnat */}
      <div
        className="sticky bg-rugby-white border-b-2 border-rugby-gray z-40 shadow-sm transition-all duration-300"
        style={{ top: `${tabsTop}px` }}
      >
        <div className="container mx-auto">
          <div className="flex items-stretch relative">

            {/* Onglet À parier */}
            <button
              onClick={() => setActiveTab('a-parier')}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 px-2 font-medium transition-colors ${
                activeTab === 'a-parier'
                  ? activeTabClassName
                  : inactiveTabClassName
              }`}
              style={activeTab === 'a-parier' ? activeTabStyle : null}
            >
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                <span className="font-bold">À parier</span>
              </div>
              <span className="text-xs font-normal">Prochains matchs disponibles</span>
            </button>

            {/* CARROUSEL : 3 championnats - compact et centré verticalement */}
            <div className="flex items-center justify-center gap-1 px-1 self-center">
              {Object.entries(CHAMPIONNATS).map(([key, conf]) => {
                const isActive = championnat === key;
                return (
                  <button
                    key={key}
                    onClick={() => setChampionnat(key)}
                    aria-label={`Passer à ${conf.label}`}
                    className="flex flex-col items-center justify-center gap-0.5 rounded-md border-2 font-bold uppercase tracking-wider transition-all duration-200"
                    style={{
                      width: '46px',
                      padding: '4px 3px',
                      fontSize: '9px',
                      backgroundColor: conf.bg,
                      borderColor: isActive ? conf.borderActive : conf.accent,
                      color: conf.accent,
                      transform: isActive ? 'scale(1.05)' : 'scale(0.92)',
                      opacity: isActive ? 1 : 0.55,
                      boxShadow: isActive ? `0 2px 6px ${conf.accent}40` : '0 1px 2px rgba(0,0,0,0.1)',
                    }}
                  >
                    <span style={{ fontSize: '12px', lineHeight: 1 }}>{conf.emoji}</span>
                    <span className="leading-none">{conf.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Onglet Mes paris */}
            <button
              onClick={() => setActiveTab('mes-paris')}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 px-2 font-medium transition-colors ${
                activeTab === 'mes-paris'
                  ? activeTabClassName
                  : inactiveTabClassName
              }`}
              style={activeTab === 'mes-paris' ? activeTabStyle : null}
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

      {/* Contenu - padding-top identique à l'original */}
      <div
        className="container mx-auto px-4 pb-4"
        style={{ paddingTop: `${contentPaddingTop}px` }}
      >
        {activeTab === 'a-parier' && (
          isHcup
            ? <MesPronosHcupTab goToMesParis={goToMesParis} />
            : <MesPronosTab goToMesParis={goToMesParis} />
        )}

        {activeTab === 'mes-paris' && (
          isHcup
            ? <MesParisHcupTab />
            : <MesParisTab />
        )}
      </div>
    </div>
  );
}
