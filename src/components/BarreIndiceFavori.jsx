// ==========================================
// COMPOSANT PARTAGÉ : Barre « Indice favori »
// ==========================================
// Fichier : src/components/BarreIndiceFavori.jsx
//
// Factorise la barre d'indice favori et son tooltip, jusque-là dupliqués
// entre AlgoPronosTab (Top 14 / Pro D2) et AlgoPronosHcupTab (Champions Cup).
//
// Exports :
//   - default : BarreIndiceFavori({ pct, variant, showInfo })
//   - nommés  : PulsingInfoButton, InfoConfiance
//
// Couleurs pilotées par la prop `variant` :
//   top14 → label or sombre / pourcentage or clair
//   prod2 → label bleu argent / pourcentage argent
//   hcup  → label or sombre / pourcentage or EPCR (#FFC72C)
// ==========================================

import { useState, useEffect, useRef } from 'react';

const VARIANTS = {
  top14: { label: '#9a7d3a', pct: '#CBA135' },
  prod2: { label: '#97C1FE', pct: '#C0C0C0' },
  hcup:  { label: '#9a7d3a', pct: '#FFC72C' },
  monde: { label: '#0B6E4F', pct: '#059669' },
};

// ============================================
// PulsingInfoButton (icône i / 💡 alternant)
// ============================================
export function PulsingInfoButton({ onClick, label }) {
  const [showBulb, setShowBulb] = useState(false);

  useEffect(() => {
    // Alterne entre i et 💡 toutes les 2 secondes
    const interval = setInterval(() => {
      setShowBulb(prev => !prev);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="relative w-6 h-6 rounded-full flex items-center justify-center transition-all duration-700 focus:outline-none"
      style={{
        backgroundColor: showBulb ? '#fde68a' : '#e5e7eb',
        boxShadow: showBulb ? '0 0 8px 2px rgba(251,191,36,0.5)' : 'none',
      }}
    >
      <span
        className="leading-none transition-all duration-700"
        style={{
          fontSize: showBulb ? '14px' : '11px',
          transform: showBulb ? 'scale(1.1)' : 'scale(1)',
        }}
      >
        {showBulb ? '💡' : <span className="font-bold text-gray-600 text-[11px]">i</span>}
      </span>
    </button>
  );
}

// ============================================
// InfoConfiance (popup explicative de l'indice favori)
// ============================================
export function InfoConfiance() {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!visible) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setVisible(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [visible]);

  return (
    <div ref={ref} className="relative flex items-center">
      <PulsingInfoButton
        onClick={(e) => { e.stopPropagation(); setVisible(v => !v); }}
        label="Explication de l'indice favori"
      />
      {visible && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-50 w-[88vw] max-w-sm bg-white rounded-xl shadow-xl border border-gray-200 p-4 text-left"
          style={{ top: ref.current ? ref.current.getBoundingClientRect().bottom + 8 : 80 }}
        >
          <p className="text-[11px] font-bold text-gray-800 mb-2 uppercase tracking-wide">
            Indice favori — Comment le lire ?
          </p>
          <p className="text-[11px] text-gray-600 leading-relaxed mb-3">
            Ce pourcentage mesure la <span className="font-semibold">domination attendue du favori</span> sur cet adversaire, calculée à partir de l'historique Elo, des statistiques des équipes et des scores prédits.
          </p>
          <div className="space-y-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-16 h-2 rounded-full bg-gradient-to-r from-red-400 to-red-500 flex-shrink-0" />
              <p className="text-[11px] text-gray-600"><span className="font-semibold text-red-500">50–60%</span> — match très serré, les deux équipes sont proches</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-16 h-2 rounded-full bg-gradient-to-r from-orange-400 to-yellow-400 flex-shrink-0" />
              <p className="text-[11px] text-gray-600"><span className="font-semibold text-yellow-500">60–70%</span> — une équipe est clairement favorite</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-16 h-2 rounded-full bg-gradient-to-r from-yellow-400 to-green-500 flex-shrink-0" />
              <p className="text-[11px] text-gray-600"><span className="font-semibold text-green-500">70–80%</span> — une équipe est nettement favorite</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-16 h-2 rounded-full bg-gradient-to-r from-green-500 to-green-700 flex-shrink-0" />
              <p className="text-[11px] text-gray-600"><span className="font-semibold text-green-700">80%</span> — favori écrasant</p>
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <p className="text-[11px] text-amber-700 leading-relaxed">
              ⚠️ Ce n'est <span className="font-semibold">pas</span> la probabilité que le score prédit soit exact — c'est uniquement une mesure de la domination attendue du favori sur cet adversaire.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// BarreIndiceFavori (barre + graduations + animation interne)
// ============================================
export default function BarreIndiceFavori({ pct = 0, variant = 'top14', showInfo = true }) {
  const [animatedWidth, setAnimatedWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedWidth(pct), 100);
    return () => clearTimeout(timer);
  }, [pct]);

  const theme = VARIANTS[variant] || VARIANTS.top14;

  return (
    <div className="mt-4 mb-5 px-4">
      <div className="flex justify-between text-xs mb-2" style={{ color: theme.label }}>
        <div className="flex items-center gap-1.5">
          <span className="font-medium">Indice favori</span>
          {showInfo && <InfoConfiance />}
        </div>
        <span className="font-bold" style={{ color: theme.pct }}>{pct}%</span>
      </div>
      <div className="relative w-full bg-gray-200 rounded-full h-[4px]">
        <div className="absolute top-0 left-1/4 w-px h-full bg-gray-300"></div>
        <div className="absolute top-0 left-1/2 w-px h-full bg-gray-300"></div>
        <div className="absolute top-0 left-3/4 w-px h-full bg-gray-300"></div>
        <div className="absolute left-1/4 text-[9px] text-gray-500 transform -translate-x-1/2" style={{ bottom: '-14px' }}>25%</div>
        <div className="absolute left-1/2 text-[9px] text-gray-500 transform -translate-x-1/2" style={{ bottom: '-14px' }}>50%</div>
        <div className="absolute left-3/4 text-[9px] text-gray-500 transform -translate-x-1/2" style={{ bottom: '-14px' }}>75%</div>
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${animatedWidth}%`,
            background: 'linear-gradient(to right, #ef4444, #f59e0b, #22c55e)',
          }}
        />
      </div>
    </div>
  );
}
