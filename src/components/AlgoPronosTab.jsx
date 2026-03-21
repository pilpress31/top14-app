import { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronDown, ChevronUp, BarChart2, TrendingUp, Clock, Loader2, Newspaper, Bot, Trophy, Swords, Stethoscope } from 'lucide-react';
import axios from 'axios';
import { getTeamData } from '../utils/teams';

const API_BASE = 'https://top14-api-production.up.railway.app';

export default function AlgoPronosTab() {
  const [pronos, setPronos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedJournees, setExpandedJournees] = useState(new Set());
  const journeeRefs = useRef({});

  useEffect(() => {
    loadPronos();
  }, []);

  const loadPronos = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/pronos`);
      const pronosData = response.data.pronos || response.data || [];
      setPronos(pronosData);

      if (pronosData.length > 0) {
        const journees = [...new Set(pronosData.map(p => p.journee))].sort((a, b) => {
          const numA = typeof a === 'string' ? parseInt(a.replace('J', '')) : a;
          const numB = typeof b === 'string' ? parseInt(b.replace('J', '')) : b;
          return numA - numB;
        });
        if (journees.length > 0) setExpandedJournees(new Set([journees[0]]));
      }
    } catch (error) {
      console.error('Erreur chargement pronos:', error);
      setPronos([]);
    } finally {
      setLoading(false);
    }
  };

  const scrollToJournee = (journee) => {
    setTimeout(() => {
      const element = journeeRefs.current[journee];
      if (element) {
        const headerOffset = 200;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }
    }, 100);
  };

  const toggleJournee = (journee) => {
    setExpandedJournees(prev => {
      const newSet = new Set();
      if (!prev.has(journee)) {
        newSet.add(journee);
        scrollToJournee(journee);
      }
      return newSet;
    });
  };

  const journees = pronos.length > 0
    ? [...new Set(pronos.map(p => p.journee))].sort((a, b) => {
        const numA = typeof a === 'string' ? parseInt(a.replace('J', '')) : a;
        const numB = typeof b === 'string' ? parseInt(b.replace('J', '')) : b;
        return numA - numB;
      })
    : [];

  const pronosParJournee = pronos.reduce((acc, prono) => {
    if (!acc[prono.journee]) acc[prono.journee] = [];
    acc[prono.journee].push(prono);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-rugby-gold"></div>
      </div>
    );
  }

  if (journees.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 text-center border border-rugby-gray">
        <p className="text-gray-500">Aucun pronostic disponible</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {journees.map(journee => {
        const isExpanded = expandedJournees.has(journee);
        const pronosJournee = pronosParJournee[journee] || [];

        return (
          <div
            key={journee}
            ref={el => journeeRefs.current[journee] = el}
            className="bg-white rounded-lg shadow-sm border border-rugby-gray overflow-hidden"
          >
            <button
              onClick={() => toggleJournee(journee)}
              className="w-full bg-rugby-gold/10 px-3 py-2 border-b border-rugby-gray hover:bg-rugby-gold/20 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-rugby-gold" />
                  <span className="font-bold text-rugby-black text-sm">Journée {journee}</span>
                  <span className="text-xs text-gray-500">({pronosJournee.length} {pronosJournee.length > 1 ? 'matchs' : 'match'})</span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-rugby-gold" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-rugby-gold" />
                )}
              </div>
            </button>

            {isExpanded && (
              <div className="p-3 space-y-4">
                {(() => {
                  // State accordéon au niveau journée : { matchId, panel }
                  // On utilise un composant intermédiaire pour gérer le state
                  return <JourneeCards pronosJournee={pronosJournee} />;
                })()}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// COMPOSANT : JourneeCards — gère l'accordéon
// inter-matchs au niveau de la journée
// ============================================
function JourneeCards({ pronosJournee }) {
  // { matchId: string, panel: 'analyse' | 'actu' } | null
  const [activePanel, setActivePanel] = useState(null);

  const togglePanel = (matchId, panel) => {
    setActivePanel(prev =>
      prev?.matchId === matchId && prev?.panel === panel
        ? null
        : { matchId, panel }
    );
  };

  return (
    <>
      {pronosJournee.map(prono => (
        <PronoCard
          key={prono.id}
          match={prono}
          openPanel={activePanel?.matchId === prono.id ? activePanel.panel : null}
          onTogglePanel={(panel) => togglePanel(prono.id, panel)}
        />
      ))}
    </>
  );
}

// ============================================
// COMPOSANT : Barre de distribution (une tranche)
// ============================================
function DistributionBar({ label, pct, nb, color }) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 80);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-[11px] text-gray-600">{label}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-gray-400">({nb} matchs)</span>
          <span className="text-[12px] font-bold" style={{ color }}>{pct}%</span>
        </div>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-[6px] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${width}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ============================================
// COMPOSANT : Popup explicative ℹ️
// Clic sur mobile, hover sur desktop
// ============================================
function InfoPopup() {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  // Fermer si clic en dehors
  useEffect(() => {
    if (!visible) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setVisible(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [visible]);

  return (
    <div ref={ref} className="relative flex items-center">
      {/* Icône ℹ️ — plus grande pour le touch */}
      <button
        onClick={(e) => { e.stopPropagation(); setVisible(v => !v); }}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        className="w-6 h-6 rounded-full bg-gray-200 hover:bg-rugby-gold/60 flex items-center justify-center transition-colors focus:outline-none"
        aria-label="Explication des statistiques"
      >
        <span className="text-[11px] font-bold text-gray-600 leading-none">i</span>
      </button>

      {/* Popup — centrée sous le bouton, fixée à gauche de l'écran */}
      {visible && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-50 w-[88vw] max-w-sm bg-white rounded-xl shadow-xl border border-gray-200 p-4 text-left"
          style={{ top: ref.current ? ref.current.getBoundingClientRect().bottom + 8 : 80 }}
          onMouseEnter={() => setVisible(true)}
          onMouseLeave={() => setVisible(false)}
        >

          <p className="text-[11px] font-bold text-gray-800 mb-2 uppercase tracking-wide">
            Comment lire ces chiffres ?
          </p>

          {/* Écart moyen */}
          <div className="mb-3">
            <p className="text-[11px] font-semibold text-rugby-gold mb-1">
              Écart moyen score final / mi-temps
            </p>
            <p className="text-[11px] text-gray-600 leading-relaxed">
              Sur tous les matchs historiques de ces deux équipes, à quel point l'algorithme a prédit le bon écart de points. Plus le % est élevé, plus les prédictions étaient proches du résultat réel.
            </p>
          </div>

          {/* Distribution */}
          <div>
            <p className="text-[11px] font-semibold text-gray-700 mb-1">
              Distribution écart score final / mi-temps
            </p>
            <p className="text-[11px] text-gray-600 leading-relaxed mb-2">
              Sur les matchs passés où l'algo avait prédit un écart similaire (±5 pts), voici ce qui s'est réellement passé :
            </p>
            <div className="space-y-1">
              <div className="flex items-start gap-1.5">
                <span className="text-[11px]">🟢</span>
                <p className="text-[11px] text-gray-600"><span className="font-semibold">Victoire large</span> : l'équipe favorite a gagné avec 10 pts ou plus d'écart</p>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-[11px]">🟡</span>
                <p className="text-[11px] text-gray-600"><span className="font-semibold">Victoire serrée</span> : l'équipe favorite a gagné mais de peu (1 à 9 pts)</p>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-[11px]">⚪</span>
                <p className="text-[11px] text-gray-600"><span className="font-semibold">Match nul</span> : aucune équipe ne s'est démarquée</p>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-[11px]">🔴</span>
                <p className="text-[11px] text-gray-600"><span className="font-semibold">Surprise</span> : l'équipe donnée perdante a finalement gagné</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// COMPOSANT : Bloc analyse historique
// ============================================
function AnalyseHistorique({ match, isOpen, onToggle }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const ecartFT = (match.prono_ft?.domicile ?? 0) - (match.prono_ft?.exterieur ?? 0);
  const ecartMT = (match.prono_ht?.domicile ?? 0) - (match.prono_ht?.exterieur ?? 0);

  const handleToggle = async () => {
    if (!isOpen && !data && !loading) {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          equipe_dom: match.equipe_domicile,
          equipe_ext: match.equipe_exterieure,
          ecart_predit_ft: ecartFT,
          ecart_predit_mt: ecartMT,
        });
        const res = await axios.get(`${API_BASE}/api/stats/proximite-ecart?${params}`);
        setData(res.data);
      } catch (e) {
        setError('Impossible de charger les données historiques.');
      } finally {
        setLoading(false);
      }
    }
    onToggle();
  };

  const COLORS = ['#22c55e', '#f59e0b', '#94a3b8', '#ef4444'];
  const signe = ecartFT >= 0 ? `+${ecartFT}` : `${ecartFT}`;
  const signeMT = ecartMT >= 0 ? `+${ecartMT}` : `${ecartMT}`;

  return (
    <div className="mt-5 border-t border-gray-100 pt-4">
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200 group"
      >
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-rugby-gold" />
          <span className="text-xs font-semibold text-gray-700">Analyse historique</span>
          <InfoPopup />
          {data && (
            <span className="text-[10px] text-gray-400 bg-gray-200 rounded-full px-2 py-0.5">
              {data.nb_matchs_filtres} matchs
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {loading && <Loader2 className="w-3 h-3 text-rugby-gold animate-spin" />}
          {isOpen
            ? <ChevronUp className="w-4 h-4 text-gray-400 group-hover:text-rugby-gold transition-colors" />
            : <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-rugby-gold transition-colors" />
          }
        </div>
      </button>

      {isOpen && (
        <div className="mt-3 space-y-4">

          {error && (
            <p className="text-xs text-red-500 text-center py-2">{error}</p>
          )}

          {loading && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 text-rugby-gold animate-spin" />
            </div>
          )}

          {data && !loading && (
            <>
              {/* Résumé proximité globale */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-rugby-gold/5 rounded-lg p-2.5 text-center border border-rugby-gold/20">
                  <div className="text-[10px] text-gray-500 mb-0.5">Écart moyen score final</div>
                  <div className="text-lg font-bold text-rugby-gold">
                    {data.global?.moyenne_proximite_ft}%
                  </div>
                  <div className="text-[10px] text-gray-400">sur {data.nb_matchs_filtres} matchs</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-2.5 text-center border border-blue-100">
                  <div className="text-[10px] text-gray-500 mb-0.5">Écart moyen mi-temps</div>
                  <div className="text-lg font-bold text-blue-500">
                    {data.global?.moyenne_proximite_mt}%
                  </div>
                  <div className="text-[10px] text-gray-400">sur {data.nb_matchs_filtres} matchs</div>
                </div>
              </div>

              {/* Distribution FT */}
              {data.distribution_ft?.tranches_ft && (
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center gap-1.5 mb-3">
                    <TrendingUp className="w-3.5 h-3.5 text-rugby-gold" />
                    <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">
                      Distribution écart score final
                    </span>
                    <span className="text-[10px] text-gray-400 ml-auto">
                      Écart prédit : <span className="font-semibold text-rugby-gold">{signe} pts</span>
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-400 mb-2.5">
                    {data.distribution_ft.nb_matchs_similaires} matchs similaires (fenêtre {data.distribution_ft.fenetre})
                    {data.distribution_ft.fallback && (
                      <span className="ml-1 text-orange-400 italic">— élargi à ±5 pts (peu de données)</span>
                    )}
                  </div>
                  <div className="space-y-2.5">
                    {data.distribution_ft.tranches_ft.map((t, i) => (
                      <DistributionBar
                        key={i}
                        label={t.label}
                        pct={t.pct}
                        nb={t.nb}
                        color={COLORS[i]}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Distribution MT */}
              {data.distribution_mt?.tranches_mt && (
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center gap-1.5 mb-3">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">
                      Distribution écart score mi-temps
                    </span>
                    <span className="text-[10px] text-gray-400 ml-auto">
                      Écart prédit : <span className="font-semibold text-blue-500">{signeMT} pts</span>
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-400 mb-2.5">
                    {data.distribution_mt.nb_matchs_similaires} matchs similaires (fenêtre {data.distribution_mt.fenetre})
                    {data.distribution_mt.fallback && (
                      <span className="ml-1 text-orange-400 italic">— élargi à ±5 pts (peu de données)</span>
                    )}
                  </div>
                  <div className="space-y-2.5">
                    {data.distribution_mt.tranches_mt.map((t, i) => (
                      <DistributionBar
                        key={i}
                        label={t.label}
                        pct={t.pct}
                        nb={t.nb}
                        color={COLORS[i]}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Message si pas assez de données */}
              {data.distribution_ft?.message && (
                <p className="text-xs text-gray-400 text-center py-1 italic">
                  {data.distribution_ft.message}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// COMPOSANT : Bloc actu match expandable
// ============================================
const ACTU_SECTIONS = [
  { key: 'pronostic_ia',    label: 'Pronostic IA',      icon: Bot,         color: 'text-purple-500',  bg: 'bg-purple-50',  border: 'border-purple-100' },
  { key: 'forme_domicile',  label: 'Forme récente',     icon: Trophy,      color: 'text-rugby-gold',  bg: 'bg-yellow-50',  border: 'border-yellow-100', combine: 'forme_exterieure' },
  { key: 'contexte_match',  label: 'Contexte & Enjeux', icon: Swords,      color: 'text-orange-500',  bg: 'bg-orange-50',  border: 'border-orange-100' },
  { key: 'blesses_domicile',label: 'Blessés / Absents', icon: Stethoscope, color: 'text-red-400',     bg: 'bg-red-50',     border: 'border-red-100',   combine: 'blesses_exterieure' },
];

function ActuMatch({ match, isOpen, onToggle }) {
  const [actu, setActu] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Accordéon : une seule section ouverte à la fois, toutes fermées par défaut
  const [openSection, setOpenSection] = useState(null);

  const handleToggle = async () => {
    if (!isOpen && !actu && !loading) {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`${API_BASE}/api/actu`);
        const actus = res.data || [];
        const found = actus.find(a =>
          a.equipe_domicile === match.equipe_domicile &&
          a.equipe_exterieure === match.equipe_exterieure
        );
        setActu(found || null);
        if (!found) setError('Aucune actualité disponible pour ce match.');
      } catch (e) {
        setError('Impossible de charger l\'actualité du match.');
      } finally {
        setLoading(false);
      }
    }
    onToggle();
  };

  // Accordéon sections : ouvre celle cliquée, ferme les autres
  const toggleSection = (key) => {
    setOpenSection(prev => prev === key ? null : key);
  };

  const majFormatted = actu?.updated_at
    ? new Date(actu.updated_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200 group"
      >
        <div className="flex items-center gap-2">
          <Newspaper className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-semibold text-gray-700">Actu du match</span>
          {actu && majFormatted && (
            <span className="text-[10px] text-gray-400 bg-gray-200 rounded-full px-2 py-0.5">
              màj {majFormatted}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {loading && <Loader2 className="w-3 h-3 text-purple-400 animate-spin" />}
          {isOpen
            ? <ChevronUp className="w-4 h-4 text-gray-400 group-hover:text-purple-400 transition-colors" />
            : <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-purple-400 transition-colors" />
          }
        </div>
      </button>

      {isOpen && (
        <div className="mt-2 space-y-2">
          {error && <p className="text-xs text-gray-400 text-center py-2 italic">{error}</p>}
          {loading && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
            </div>
          )}
          {actu && !loading && (
            <>
              {/* Bandeau météo */}
              {actu.meteo && (
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                  <span className="text-base">🌤️</span>
                  <span className="text-[11px] text-blue-700 font-medium">{actu.meteo}</span>
                </div>
              )}

              {/* 4 sections accordéon */}
              {ACTU_SECTIONS.map(section => {
            const Icon = section.icon;
            const isSectionOpen = openSection === section.key;
            const contenu = section.key === 'forme_domicile'
              ? `🏠 ${match.equipe_domicile}\n${actu.forme_domicile || ''}\n\n🚌 ${match.equipe_exterieure}\n${actu.forme_exterieure || ''}`
              : section.key === 'blesses_domicile'
              ? `🏠 ${match.equipe_domicile}\n${actu.blesses_domicile || 'Aucune absence majeure signalée'}\n\n🚌 ${match.equipe_exterieure}\n${actu.blesses_exterieure || 'Aucune absence majeure signalée'}`
              : actu[section.key];

            if (!contenu) return null;

            return (
              <div key={section.key} className={`rounded-lg border ${section.border} overflow-hidden`}>
                <button
                  onClick={() => toggleSection(section.key)}
                  className={`w-full flex items-center justify-between px-3 py-2 ${section.bg} hover:opacity-90 transition-opacity`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`w-3.5 h-3.5 ${section.color}`} />
                    <span className={`text-[11px] font-bold uppercase tracking-wide ${section.color}`}>
                      {section.label}
                    </span>
                  </div>
                  {isSectionOpen
                    ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
                    : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                  }
                </button>
                {isSectionOpen && (
                  <div className="px-3 py-2.5 bg-white">
                    {contenu.split('\n').map((line, i) => (
                      line.trim() === ''
                        ? <div key={i} className="h-2" />
                        : <p key={i} className="text-[12px] text-gray-700 leading-relaxed">{line}</p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// COMPOSANT : PronoCard
// ============================================
function PronoCard({ match, openPanel, onTogglePanel }) {
  const equipeDom = match.equipe_domicile || 'Équipe 1';
  const equipeExt = match.equipe_exterieure || 'Équipe 2';

  // Refs pour scroller vers le bon panel à l'ouverture
  const analyseRef = useRef(null);
  const actuRef = useRef(null);

  const handleTogglePanel = (panel) => {
    const isOpening = openPanel !== panel;
    onTogglePanel(panel);
    if (isOpening) {
      setTimeout(() => {
        const ref = panel === 'analyse' ? analyseRef : actuRef;
        if (ref.current) {
          // Mesure dynamique de tous les éléments sticky visibles
          const stickyEls = document.querySelectorAll(
            '[class*="sticky"], [class*="fixed"], header, nav'
          );
          let stickyHeight = 0;
          stickyEls.forEach(el => {
            const style = window.getComputedStyle(el);
            const pos = style.position;
            if ((pos === 'sticky' || pos === 'fixed') && el.offsetHeight > 0) {
              // Ne compter que les éléments en haut de page (top < 10px)
              const rect = el.getBoundingClientRect();
              if (rect.top <= 10) {
                stickyHeight = Math.max(stickyHeight, rect.bottom);
              }
            }
          });
          // Marge de confort de 12px
          const offset = stickyHeight + 12;
          const pos = ref.current.getBoundingClientRect().top + window.pageYOffset - offset;
          window.scrollTo({ top: pos, behavior: 'smooth' });
        }
      }, 80);
    }
  };

  const scoreDom = match.prono_ft?.domicile ?? 0;
  const scoreExt = match.prono_ft?.exterieur ?? 0;

  const scoreHtDom = match.prono_ht?.domicile ?? null;
  const scoreHtExt = match.prono_ht?.exterieur ?? null;
  const scoreHtText = (scoreHtDom !== null && scoreHtExt !== null)
    ? `${scoreHtDom} - ${scoreHtExt}`
    : null;

  const confianceFT = match.confiance_algo ?? match.confiance ?? 0;
  const confidencePct = Math.round(confianceFT);
  const [animatedWidth, setAnimatedWidth] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setAnimatedWidth(confidencePct), 100);
    return () => clearTimeout(timer);
  }, [confidencePct]);

  const confianceMT = match.confiance_mt_algo ?? 0;
  const confidenceMTPct = Math.round(confianceMT);
  const [animatedWidthMT, setAnimatedWidthMT] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setAnimatedWidthMT(confidenceMTPct), 100);
    return () => clearTimeout(timer);
  }, [confidenceMTPct]);

  let dateFormatted = 'À VENIR';
  let heureFormatted = '';
  if (match.date) {
    try {
      const matchDate = new Date(match.date);
      dateFormatted = matchDate.toLocaleDateString('fr-FR', {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
      }).toUpperCase();
      const hours = matchDate.getHours();
      const minutes = matchDate.getMinutes();
      if (hours !== 0 || minutes !== 0) {
        heureFormatted = `${String(hours).padStart(2, '0')}H${String(minutes).padStart(2, '0')}`;
      }
    } catch (error) {
      console.error('Erreur formatage date:', error);
    }
  }

  const teamDomData = getTeamData(equipeDom);
  const teamExtData = getTeamData(equipeExt);

  return (
    <div className="w-full bg-gray-50 rounded-lg py-4 border border-gray-200">

      {/* Date + Heure */}
      <div className="flex justify-between items-center px-4 mb-3">
        <div className="text-xs text-rugby-bronze font-semibold">{dateFormatted}</div>
        {heureFormatted && (
          <div className="text-xs text-rugby-gold font-bold">{heureFormatted}</div>
        )}
      </div>

      {/* Équipes + scores */}
      <div className="grid grid-cols-3 items-start px-4 mb-2">
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mb-2 shadow-sm">
            <img
              src={teamDomData.logo}
              alt={teamDomData.name}
              className="w-12 h-12 object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
          <div className="text-base font-bold text-rugby-black leading-tight break-words line-clamp-2">
            {equipeDom}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-1">
          <div className="text-xs text-rugby-bronze font-medium mb-1">Score final</div>
          <div className="flex items-center gap-2 text-[1.65rem] font-bold text-rugby-gold">
            {scoreDom} - {scoreExt}
          </div>
          {scoreHtText && (
            <>
              <div className="text-xs text-rugby-bronze font-medium mt-2">Score M-T</div>
              <div className="text-sm text-rugby-black font-semibold">{scoreHtText}</div>
              <div className="mt-1 flex items-center gap-2 w-full">
                <div className="flex-1 bg-gray-200 h-1 rounded-full overflow-hidden">
                  <div
                    className="h-1 rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${animatedWidthMT}%`,
                      background: 'linear-gradient(to right, #ef4444, #f59e0b, #22c55e)',
                    }}
                  />
                </div>
                <span className="text-[10px] text-gray-600">{confidenceMTPct}%</span>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mb-2 shadow-sm">
            <img
              src={teamExtData.logo}
              alt={teamExtData.name}
              className="w-12 h-12 object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
          <div className="text-base font-bold text-rugby-black leading-tight break-words line-clamp-2">
            {equipeExt}
          </div>
        </div>
      </div>

      {/* Barre FT */}
      <div className="mt-4 px-4">
        <div className="flex justify-between text-xs text-rugby-bronze mb-2">
          <span className="font-medium">Confiance score final</span>
          <span className="font-bold text-rugby-gold">{confidencePct}%</span>
        </div>
        <div className="relative w-full bg-gray-200 rounded-full h-[7px]">
          <div className="absolute top-0 left-1/4 w-px h-full bg-gray-300"></div>
          <div className="absolute top-0 left-1/2 w-px h-full bg-gray-300"></div>
          <div className="absolute top-0 left-3/4 w-px h-full bg-gray-300"></div>
          <div className="absolute -bottom-4 left-1/4 text-[10px] text-gray-500 transform -translate-x-1/2">25%</div>
          <div className="absolute -bottom-4 left-1/2 text-[10px] text-gray-500 transform -translate-x-1/2">50%</div>
          <div className="absolute -bottom-4 left-3/4 text-[10px] text-gray-500 transform -translate-x-1/2">75%</div>
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${animatedWidth}%`,
              background: 'linear-gradient(to right, #ef4444, #f59e0b, #22c55e)',
            }}
          />
        </div>
      </div>

      {/* Analyse historique + Actu match */}
      <div className="px-4">
        <div ref={analyseRef}>
          <AnalyseHistorique
            match={match}
            isOpen={openPanel === 'analyse'}
            onToggle={() => handleTogglePanel('analyse')}
          />
        </div>
        <div ref={actuRef}>
          <ActuMatch
            match={match}
            isOpen={openPanel === 'actu'}
            onToggle={() => handleTogglePanel('actu')}
          />
        </div>
      </div>

    </div>
  );
}
