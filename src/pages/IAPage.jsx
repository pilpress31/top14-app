import { useState, useEffect, useRef } from 'react';
import { useChampionnat } from '../contexts/ChampionnatContext';
import { Brain, Clock } from 'lucide-react';
import AlgoPronosTab from '../components/AlgoPronosTab';
import HistoriqueTab from '../components/HistoriqueTab';
import AlgoPronosHcupTab from '../components/AlgoPronosHcupTab';
import HistoriqueHcupTab from '../components/HistoriqueHcupTab';
import MainHeader from '../components/MainHeader';
import MainHeaderD2 from '../components/MainHeaderD2';
import MainHeaderHcup from '../components/MainHeaderHcup';
import { useNavigate } from "react-router-dom";

const HEADER_HEIGHT = 120;

// Couleurs des 3 championnats pour le carrousel
const CHAMPIONNATS = {
  top14: { label: 'TOP 14', emoji: '🏆', bg: '#FFFFFF', accent: '#D4A017', borderActive: '#FFC72C' },
  prod2: { label: 'PRO D2', emoji: '🥈', bg: '#00174D', accent: '#C0C0C0', borderActive: '#FFC72C' },
  hcup:  { label: 'C.CUP',  emoji: '⭐', bg: '#003E7E', accent: '#FFC72C', borderActive: '#FFC72C' },
};

export default function IAPage() {
  const navigate = useNavigate();
  const { championnat, setChampionnat } = useChampionnat();
  const [activeTab, setActiveTab] = useState('algorithme');
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

  // Réinitialiser scroll quand on change de championnat
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [championnat]);

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
  const contentPadding = 200;

  const isD2 = championnat === 'prod2';
  const isHcup = championnat === 'hcup';

  // Choisir le header
  const HeaderComponent = isHcup ? MainHeaderHcup : isD2 ? MainHeaderD2 : MainHeader;

  return (
    <div className="min-h-screen bg-rugby-white pb-24">
      <HeaderComponent />

      {/* Onglets - sticky */}
      <div
        className="sticky z-40 shadow-sm transition-all duration-300"
        style={{
          top: `${tabsTop}px`,
          backgroundColor: '#FFFFFF',
          borderBottom: '2px solid #e5e7eb'
        }}
      >
        <div className="container mx-auto">
          <div className="flex items-stretch">

            {/* Onglet Algorithme */}
            <button
              onClick={() => setActiveTab('algorithme')}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-3 font-medium transition-colors"
              style={activeTab === 'algorithme'
                ? isHcup
                  ? { color: '#003E7E', borderBottom: '4px solid #FFC72C', backgroundColor: 'rgba(255,199,44,0.05)', fontWeight: 700 }
                  : isD2
                    ? { color: '#00174D', borderBottom: '4px solid #00174D', backgroundColor: 'rgba(151,193,254,0.1)', fontWeight: 700 }
                    : { color: '#CBA135', borderBottom: '4px solid #CBA135', backgroundColor: 'rgba(203,161,53,0.05)', fontWeight: 700 }
                : { color: '#9ca3af' }}
            >
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                <span className="font-bold">Algorithme</span>
              </div>
              <span className="text-xs font-normal" style={{ color: '#9ca3af' }}>
                Prédictions des prochains matchs
              </span>
            </button>

            {/* CARROUSEL : 3 championnats */}
            <div className="flex items-center justify-center gap-1 px-2">
              {Object.entries(CHAMPIONNATS).map(([key, conf]) => {
                const isActive = championnat === key;
                return (
                  <button
                    key={key}
                    onClick={() => setChampionnat(key)}
                    aria-label={`Passer à ${conf.label}`}
                    className="flex flex-col items-center justify-center gap-0.5 rounded-md border-2 font-bold text-[10px] uppercase tracking-wider transition-all duration-200"
                    style={{
                      width: '52px',
                      padding: '6px 4px',
                      backgroundColor: conf.bg,
                      borderColor: isActive ? conf.borderActive : conf.accent,
                      color: conf.accent,
                      transform: isActive ? 'scale(1.08)' : 'scale(0.92)',
                      opacity: isActive ? 1 : 0.55,
                      boxShadow: isActive ? `0 4px 12px ${conf.accent}40` : '0 1px 3px rgba(0,0,0,0.1)',
                    }}
                  >
                    <span style={{ fontSize: '14px', lineHeight: 1 }}>{conf.emoji}</span>
                    <span className="leading-none">{conf.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Onglet Historique */}
            <button
              onClick={() => setActiveTab('historique')}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-3 font-medium transition-colors"
              style={activeTab === 'historique'
                ? isHcup
                  ? { color: '#003E7E', borderBottom: '4px solid #FFC72C', backgroundColor: 'rgba(255,199,44,0.05)', fontWeight: 700 }
                  : isD2
                    ? { color: '#00174D', borderBottom: '4px solid #00174D', backgroundColor: 'rgba(151,193,254,0.1)', fontWeight: 700 }
                    : { color: '#CBA135', borderBottom: '4px solid #CBA135', backgroundColor: 'rgba(203,161,53,0.05)', fontWeight: 700 }
                : { color: '#9ca3af' }}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span className="font-bold">Historique</span>
              </div>
              <span className="text-xs font-normal" style={{ color: '#9ca3af' }}>
                Matchs déjà joués
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Contenu : dispatch sur le bon composant */}
      <div
        className="container mx-auto px-4 py-6"
        style={{ paddingTop: `${contentPadding}px` }}
      >
        {activeTab === 'algorithme' ? (
          isHcup
            ? <AlgoPronosHcupTab />
            : <AlgoPronosTab onMatchClick={handleMatchClick} isD2={isD2} />
        ) : (
          isHcup
            ? <HistoriqueHcupTab />
            : <HistoriqueTab headerVisible={headerVisible} isD2={isD2} />
        )}
      </div>
    </div>
  );
}
