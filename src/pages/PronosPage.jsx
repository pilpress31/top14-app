import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Target, Trophy } from 'lucide-react';
import MesPronosTab from '../components/MesPronosTab';
import MesParisTab from '../components/MesParisTab';
import MainHeader from '../components/MainHeaderFull';
import { useChampionnat } from '../contexts/ChampionnatContext';

const HEADER_HEIGHT = 120;

export default function PronosPage() {
  const location = useLocation();
  const { isD2, toggle } = useChampionnat();
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
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location]);

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

  // Hauteur des onglets ≈ 65px — on laisse cet espacement sous la zone sticky
  // pour que le 1er élément de contenu (bandeau cagnotte) ne soit pas masqué.
  const contentPaddingTop = 65;

  // Couleurs dynamiques des onglets selon championnat
  const activeTabColor = isD2
    ? 'text-[#00174D] border-b-4 border-[#00174D] bg-[#97C1FE]/10'
    : 'text-rugby-gold border-b-4 border-rugby-gold bg-rugby-gold/5';

  const inactiveTabColor = isD2
    ? 'text-gray-500 hover:text-[#00174D] hover:bg-[#97C1FE]/10'
    : 'text-rugby-bronze hover:text-rugby-gold hover:bg-rugby-gray/20';

  return (
    <div className="min-h-screen bg-rugby-white pb-24">
      <MainHeader />

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

            {/* ✅ BOUTON CENTRAL : bascule Top 14 ↔ Pro D2 */}
            <button
              onClick={toggle}
              aria-label={isD2 ? 'Basculer vers Top 14' : 'Basculer vers Pro D2'}
              className={`self-center mx-1 px-3 py-2 rounded-lg font-bold text-xs uppercase tracking-wider shadow-md transition-all active:scale-95 ${
                isD2
                  ? 'bg-[#00174D] text-[#97C1FE] hover:bg-[#001a5c]'
                  : 'bg-rugby-gold text-white hover:bg-rugby-bronze'
              }`}
            >
              {isD2 ? (
                <div className="flex flex-col items-center gap-0.5 leading-none">
                  <span>🥈</span>
                  <span className="text-[10px]">PRO D2</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-0.5 leading-none">
                  <span>🏆</span>
                  <span className="text-[10px]">TOP 14</span>
                </div>
              )}
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

      {/* ✅ Contenu avec padding-top = hauteur des onglets pour que Ma Cagnotte soit visible */}
      <div
        className="container mx-auto px-4 pb-4"
        style={{ paddingTop: `${contentPaddingTop}px` }}
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
