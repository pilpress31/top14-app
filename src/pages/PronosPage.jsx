import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Target, Trophy } from 'lucide-react';
import MesPronosTab from '../components/MesPronosTab';
import MesParisTab from '../components/MesParisTab';
import MesPronosHcupTab from '../components/MesPronosHcupTab';
import MesParisHcupTab from '../components/MesParisHcupTab';
import MesPronosMondeTab from '../components/MesPronosMondeTab';
import MesParisMondeTab from '../components/MesParisMondeTab';
import MainHeader from '../components/MainHeaderFull';
import MainHeaderD2 from '../components/MainHeaderFullD2';
import MainHeaderHcup from '../components/MainHeaderFullHcup';
import MainHeaderMonde from '../components/MainHeaderFullMonde';
import { useChampionnat } from '../contexts/ChampionnatContext';

const HEADER_HEIGHT = 120;

// Couleurs des 4 championnats pour le carrousel
const CHAMPIONNATS = {
  top14: { label: 'TOP 14', emoji: '🏆', bg: '#FFFFFF', accent: '#D4A017', borderActive: '#FFC72C' },
  prod2: { label: 'PRO D2', emoji: '🥈', bg: '#00174D', accent: '#C0C0C0', borderActive: '#FFC72C' },
  hcup:  { label: 'C.CUP',  emoji: '⭐', bg: '#003E7E', accent: '#FFC72C', borderActive: '#FFC72C' },
  monde: { label: 'MONDE',  emoji: '🌍', bg: '#064E3B', accent: '#34D399', borderActive: '#34D399' },
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
  const [scrollToMatchId, setScrollToMatchId] = useState(null);

  useEffect(() => {
    if (location.key === lastHandledKey.current) return;
    lastHandledKey.current = location.key;

    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
    if (location.state?.championnat) {
      const champMap = { top14: 'top14', d2: 'prod2', hcup: 'hcup', monde: 'monde' };
      const mapped = champMap[location.state.championnat];
      if (mapped) setChampionnat(mapped);
    }
    if (location.state?.scrollToMatchId) {
      setScrollToMatchId(location.state.scrollToMatchId);
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
  const isMonde = championnat === 'monde';

  // Couleur d'accent du championnat courant (onglets actifs sur fond sombre)
  const champConf = CHAMPIONNATS[championnat] || CHAMPIONNATS.top14;

  const activeTabStyle = {
    color: champConf.accent,
    borderBottom: `4px solid ${champConf.borderActive}`,
    backgroundColor: 'rgba(255,255,255,0.05)',
  };
  const inactiveTabStyle = { color: '#94a3b8', borderBottom: '4px solid transparent' };

  const HeaderComponent = isMonde ? MainHeaderMonde : isHcup ? MainHeaderHcup : isD2 ? MainHeaderD2 : MainHeader;

  return (
    <div className="min-h-screen bg-[#0c1322] pb-24">
      <HeaderComponent isVisible={headerVisible} />

      {/* Zone sticky : onglets + carrousel championnat */}
      <div
        className="sticky bg-[#0c1322] border-b border-white/10 z-40 shadow-md transition-all duration-300"
        style={{ top: `${tabsTop}px` }}
      >
        <div className="container mx-auto">
          <div className="flex items-stretch">

            {/* Onglet À parier */}
            <button
              onClick={() => setActiveTab('a-parier')}
              className="flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 py-2.5 px-1 font-medium transition-colors hover:bg-white/5"
              style={activeTab === 'a-parier' ? activeTabStyle : inactiveTabStyle}
            >
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                <span className="font-bold">À parier</span>
              </div>
              <span className="text-[10px] font-normal leading-tight text-gray-500">Prochains matchs disponibles</span>
            </button>

            {/* Onglet Mes paris */}
            <button
              onClick={() => setActiveTab('mes-paris')}
              className="flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 py-2.5 px-1 font-medium transition-colors hover:bg-white/5"
              style={activeTab === 'mes-paris' ? activeTabStyle : inactiveTabStyle}
            >
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                <span className="font-bold">Mes paris</span>
              </div>
              <span className="text-[10px] font-normal leading-tight text-gray-500">Historique &amp; statistiques</span>
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
                    className="flex-1 flex items-center justify-center gap-1 rounded-full px-2 py-1.5 text-[11px] font-bold uppercase tracking-wide transition-all"
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

      {/* Contenu - padding-top identique à l'original */}
      <div
        className="container mx-auto px-4 pb-4"
        style={{ paddingTop: `${contentPaddingTop}px` }}
      >
        {activeTab === 'a-parier' && (
          isMonde
            ? <MesPronosMondeTab goToMesParis={goToMesParis} scrollToMatchId={scrollToMatchId} onScrollDone={() => setScrollToMatchId(null)} />
            : isHcup
            ? <MesPronosHcupTab goToMesParis={goToMesParis} scrollToMatchId={scrollToMatchId} onScrollDone={() => setScrollToMatchId(null)} />
            : <MesPronosTab goToMesParis={goToMesParis} scrollToMatchId={scrollToMatchId} onScrollDone={() => setScrollToMatchId(null)} />
        )}

        {activeTab === 'mes-paris' && (
          isMonde
            ? <MesParisMondeTab />
            : isHcup
            ? <MesParisHcupTab />
            : <MesParisTab />
        )}
      </div>
    </div>
  );
}
