import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Target, Trophy } from 'lucide-react';
import MesPronosTab from '../components/MesPronosTab';
import MesParisTab from '../components/MesParisTab';
import MainHeader from '../components/MainHeaderFull';
import ChampionnatToggle from '../components/ChampionnatToggle';
import { useChampionnat } from '../contexts/ChampionnatContext';

const HEADER_HEIGHT = 120;

export default function PronosPage() {
  const location = useLocation();
  const { isD2 } = useChampionnat();
  const [activeTab, setActiveTab] = useState('a-parier');
  const [headerVisible, setHeaderVisible] = useState(true);

  // ✅ useRef au lieu de useState pour lastScrollY (évite les re-renders — comme IAPage)
  const lastScrollY = useRef(0);

  const goToMesParis = () => { setActiveTab("mes-paris"); };

  // ✅ Scroll en haut au montage de la page
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // ✅ Scroll en haut quand on revient sur "À parier"
  useEffect(() => {
    if (activeTab === 'a-parier') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeTab]);

  // ✅ Ouvrir l'onglet "Mes paris" si state est passé
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location]);

  // ✅ Scroll stable avec useRef — même pattern que IAPage
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
  // Padding top du contenu = header + toggle (~50px) + onglets (~65px)
  const contentPadding = 180;

  // ✅ Couleur de l'onglet actif selon le championnat
  const activeTabColor = isD2
    ? 'text-[#00174D] border-b-4 border-[#00174D] bg-[#97C1FE]/10'
    : 'text-rugby-gold border-b-4 border-rugby-gold bg-rugby-gold/5';

  const inactiveTabColor = isD2
    ? 'text-gray-500 hover:text-[#00174D] hover:bg-[#97C1FE]/10'
    : 'text-rugby-bronze hover:text-rugby-gold hover:bg-rugby-gray/20';

  return (
    <div className="min-h-screen bg-rugby-white pb-24">
      {/* Header */}
      <MainHeader />

      {/* ═══════════════════════════════════════════════════════
          Zone sticky : ChampionnatToggle + onglets
          ═══════════════════════════════════════════════════════ */}
      <div
        className="sticky bg-rugby-white border-b-2 border-rugby-gray z-40 shadow-sm transition-all duration-300"
        style={{ top: `${tabsTop}px` }}
      >
        <div className="container mx-auto">

          {/* ✅ BOUTON BASCULE TOP 14 / PRO D2 */}
          <div className="px-4 py-2 border-b border-rugby-gray/50">
            <ChampionnatToggle />
          </div>

          {/* Onglets */}
          <div className="flex">
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
              <span className="text-xs font-normal">
                Prochains matchs disponibles
              </span>
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
              <span className="text-xs font-normal">
                Historique &amp; statistiques
              </span>
            </button>
          </div>

        </div>
      </div>

      {/* Contenu — padding-top dynamique = header + toggle + onglets */}
      <div
        className="container mx-auto px-4 py-6"
        style={{ paddingTop: `${contentPadding}px` }}
      >
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
