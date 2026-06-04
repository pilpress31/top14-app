import { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronDown, ChevronUp, BarChart2, TrendingUp, Clock, Loader2, Newspaper, Bot, Trophy, Swords, Stethoscope, ClipboardList} from 'lucide-react';
import axios from 'axios';
import { getTeamData } from '../utils/teams';
import TeamPopup from './TeamPopup';
import RubriqueHeader, { RUBRIQUE_THEMES, ACTU_SECTION_COLORS } from './RubriqueHeader';
import PourquoiCePronostic from './PourquoiCePronostic';
// import PartagePronostic from './PartagePronostic';
import { useRealtimeSync } from '../hooks/useRealtimeSync';

const API_BASE = 'https://top14-api-production.up.railway.app';

export default function AlgoPronosTab({ onMatchClick, isD2 = false }) {
  const [pronos, setPronos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedJournees, setExpandedJournees] = useState(new Set());
  const journeeRefs = useRef({});
  // Flag : true = premier chargement, false = refresh Realtime
  const isFirstLoad = useRef(true);
  // Ref stable pour capturer isD2 dans les closures async
  const isD2Ref = useRef(isD2);
  useEffect(() => { isD2Ref.current = isD2; }, [isD2]);

  // ✅ Realtime — rafraîchit quand les cotes changent
  useRealtimeSync([
    { table: isD2 ? 'match_cotes_d2' : 'match_cotes', onUpdate: () => loadPronos() },
  ]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setLoading(true);
    setPronos([]);
    setExpandedJournees(new Set());
    isFirstLoad.current = true;
    loadPronos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isD2]);

  const loadPronos = async () => {
    try {
      const url = isD2Ref.current ? `${API_BASE}/api/d2/pronos` : `${API_BASE}/api/pronos`;
      const response = await axios.get(url);
      const raw = response.data.pronos || response.data || [];

      // Normaliser la structure D2 pour PronoCard
      const pronosData = isD2Ref.current
        ? raw.map(p => ({
            ...p,
            prono_ft: { domicile: p.score_predit_dom ?? 0, exterieur: p.score_predit_ext ?? 0 },
            prono_ht: null,
            date: p.date_match,
            confiance_algo: p.confiance_algo ? Number(p.confiance_algo) * 100 : 0,
            isD2: true,
            round: p.round || 'Journée',
          }))
        : raw;

      setPronos(pronosData);

      if (isFirstLoad.current && pronosData.length > 0) {
        const journees = [...new Set(pronosData.map(p => p.journee))].sort((a, b) => {
          const numA = typeof a === 'string' ? parseInt(a.replace('J', '')) : a;
          const numB = typeof b === 'string' ? parseInt(b.replace('J', '')) : b;
          return numA - numB;
        });
        if (journees.length > 0) setExpandedJournees(new Set([journees[0]]));
        isFirstLoad.current = false;
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
        const now = new Date();
        const DUREE_MAX_MS = 3 * 60 * 60 * 1000; // 3h max (prolongations incluses)
        const nbAVenir = pronosJournee.filter(m => new Date(m.date) > now).length;
        const nbEnCours = pronosJournee.filter(m => {
          const d = new Date(m.date);
          return d <= now && d > new Date(now - DUREE_MAX_MS);
        }).length;
        const nbTermines = pronosJournee.filter(m => new Date(m.date) <= new Date(now - DUREE_MAX_MS)).length;
        const labelParts = [];
        if (nbAVenir > 0) labelParts.push(`${nbAVenir} à venir`);
        if (nbEnCours > 0) labelParts.push(`${nbEnCours} en cours 🔴`);
        if (nbTermines > 0) labelParts.push(`${nbTermines} terminé${nbTermines > 1 ? 's' : ''} ✅`);
        const matchsLabel = labelParts.length > 0 ? labelParts.join(' · ') : `${pronosJournee.length} match${pronosJournee.length > 1 ? 's' : ''}`;

        return (
          <div
            key={journee}
            ref={el => journeeRefs.current[journee] = el}
            className="bg-white rounded-lg shadow-sm border border-rugby-gray overflow-hidden"
          >
            <button
              onClick={() => toggleJournee(journee)}
              className="w-full px-3 py-2 border-b transition-colors"
              style={pronosJournee[0]?.isD2
                ? { backgroundColor: 'rgba(0,23,77,0.08)', borderColor: 'rgba(192,192,192,0.3)' }
                : { backgroundColor: 'rgba(203,161,53,0.1)', borderColor: '#e5e7eb' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" style={pronosJournee[0]?.isD2 ? { color: '#97C1FE' } : { color: '#CBA135' }} />
                  {(() => {
                    const round = pronosJournee[0]?.round;
                    const isD2Match = pronosJournee[0]?.isD2;
                    const D2_PLAYOFF_LABELS = {
                      'Barrage': 'Barrage', 'Accession': "Match d'accession",
                      'Barrage 1': 'Barrages', 'Barrage 2': 'Barrages',
                      'Demi-finale 1': 'Demi-finales', 'Demi-finale 2': 'Demi-finales',
                      'Finale': 'Finale',
                      'Access Match Pro D2': "Match d'accession Pro D2",
                      'Access Match Top 14': "Match d'accession Top 14",
                    };
                    if (isD2Match && round && D2_PLAYOFF_LABELS[round]) {
                      return <span className="font-bold text-sm" style={{ color: '#00174D' }}>{D2_PLAYOFF_LABELS[round]}</span>;
                    }
                    return <span className="font-bold text-sm" style={isD2Match ? { color: '#00174D' } : {}}>Journée {journee}</span>;
                  })()}
                  <span className="text-xs text-gray-500">({matchsLabel})</span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" style={pronosJournee[0]?.isD2 ? { color: '#97C1FE' } : { color: '#CBA135' }} />
                ) : (
                  <ChevronDown className="w-4 h-4" style={pronosJournee[0]?.isD2 ? { color: '#97C1FE' } : { color: '#CBA135' }} />
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
// COMPOSANT : Bouton i animé (clignote entre i et 💡)
// ============================================
function PulsingInfoButton({ onClick, label }) {
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
      <PulsingInfoButton
        onClick={(e) => { e.stopPropagation(); setVisible(v => !v); }}
        label="Explication des statistiques"
      />

      {visible && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-50 w-[88vw] max-w-sm bg-white rounded-xl shadow-xl border border-gray-200 p-4 text-left"
          style={{ top: ref.current ? ref.current.getBoundingClientRect().bottom + 8 : 80 }}
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
              Sur les matchs passés où l'algo avait prédit un écart similaire (±3 pts), voici ce qui s'est réellement passé :
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
    // Ouvrir/fermer immédiatement AVANT le fetch
    onToggle();
    // Charger les données seulement si on ouvre ET qu'on n'a pas encore les données
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
  };

  const COLORS = ['#22c55e', '#f59e0b', '#94a3b8', '#ef4444'];
  const signe = ecartFT >= 0 ? `+${ecartFT}` : `${ecartFT}`;
  const signeMT = ecartMT >= 0 ? `+${ecartMT}` : `${ecartMT}`;

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      <RubriqueHeader
        theme={RUBRIQUE_THEMES.top14}
        icon={BarChart2}
        label="Analyse historique"
        isOpen={isOpen}
        loading={loading}
        onToggle={handleToggle}
        badge={data ? `${data.nb_matchs_filtres} matchs` : null}
      >
        <InfoPopup />
      </RubriqueHeader>

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
  { key: 'pronostic_ia',    label: 'Pronostic IA',      icon: Bot },
  { key: 'forme_domicile',  label: 'Forme récente',     icon: Trophy,      combine: 'forme_exterieure' },
  { key: 'contexte_match',  label: 'Contexte & Enjeux', icon: Swords },
  { key: 'compo_domicile',  label: 'Compo probable & Absents', icon: ClipboardList, combine: 'compo_exterieure', isCombo: true },
];

function ActuMatch({ match, isOpen, onToggle }) {
  const championnatActu = match.isD2 ? 'prod2' : 'top14';
  const [actu, setActu] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Accordéon : une seule section ouverte à la fois, toutes fermées par défaut
  const [openSection, setOpenSection] = useState(null);

  const handleToggle = async () => {
    // Ouvrir/fermer immédiatement AVANT le fetch
    onToggle();
    // Charger les données seulement si on ouvre ET qu'on n'a pas encore les données
    if (!isOpen && !actu && !loading) {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`${API_BASE}/api/actu?championnat=${championnatActu}`);
        // Gère les deux formats : tableau direct (ancien) ou objet {actus, journee, disponible} (nouveau)
        const actus = Array.isArray(res.data) ? res.data : (res.data?.actus || []);
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
  };

  // Reset des sections uniquement à la fermeture
  const wasOpenRef = useRef(false);
  useEffect(() => {
    if (wasOpenRef.current && !isOpen) {
      setOpenSection(null);
    }
    wasOpenRef.current = isOpen;
  }, [isOpen]);

  // Accordéon sections : ouvre celle cliquée, ferme les autres
  const toggleSection = (key) => {
    setOpenSection(prev => prev === key ? null : key);
  };

  const majFormatted = actu?.updated_at
    ? new Date(actu.updated_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      <RubriqueHeader
        theme={RUBRIQUE_THEMES[championnatActu]}
        icon={Newspaper}
        label="Actu du match"
        isOpen={isOpen}
        loading={loading}
        onToggle={handleToggle}
        badge={actu && majFormatted ? `màj ${majFormatted}` : null}
      />

      {isOpen && (
        <div className="mt-2 space-y-2">
          {error && <p className="text-xs text-gray-400 text-center py-2 italic">{error}</p>}
          {loading && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
            </div>
          )}
          {!loading && !actu && !error && (
            <p className="text-xs text-gray-400 text-center py-2 italic">Chargement…</p>
          )}
          {actu && !loading && (
            <>
              {/* Bandeau météo */}
              {actu.meteo && !['Météo non disponible', 'Météo temporairement indisponible'].includes(actu.meteo) && (
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                  <span className="text-base">🌤️</span>
                  <span className="text-[11px] text-blue-700 font-medium">{actu.meteo}</span>
                </div>
              )}

              {/* 4 sections accordéon */}
              {ACTU_SECTIONS.map(section => {
                const Icon = section.icon;
                const colors = ACTU_SECTION_COLORS[section.key];
                const isSectionOpen = openSection === section.key;

                // Cas spécial : section compo fusionnée avec blessés
                if (section.isCombo) {
                  const hasCompo = actu.compo_domicile && actu.compo_domicile !== 'Information non disponible';
                  const hasBlesses = (actu.blesses_domicile && actu.blesses_domicile !== 'Aucune absence majeure signalée' && actu.blesses_domicile !== 'Information non disponible')
                                  || (actu.blesses_exterieure && actu.blesses_exterieure !== 'Aucune absence majeure signalée' && actu.blesses_exterieure !== 'Information non disponible');
                  if (!hasCompo && !hasBlesses) return null;
                  return (
                    <div key={section.key} className={`rounded-lg border ${colors.border} overflow-hidden`}>
                      <button
                        onClick={() => toggleSection(section.key)}
                        className={`w-full flex items-center justify-between px-3 py-2 ${colors.bg} hover:opacity-90 transition-opacity`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={`w-3.5 h-3.5 ${colors.color}`} />
                          <span className={`text-[11px] font-bold uppercase tracking-wide ${colors.color}`}>
                            {section.label}
                          </span>
                        </div>
                        {isSectionOpen
                          ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
                          : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                        }
                      </button>
                      {isSectionOpen && (
                        <div className="px-3 py-2.5 bg-white space-y-3">
                          {[
                            { name: match.equipe_domicile, compo: actu.compo_domicile, blesses: actu.blesses_domicile },
                            { name: match.equipe_exterieure, compo: actu.compo_exterieure, blesses: actu.blesses_exterieure }
                          ].map(({ name, compo, blesses }) => {
                            const compoIndispo = !compo || compo === 'Information non disponible';
                            const blessesIndispo = !blesses || blesses === 'Aucune absence majeure signalée' || blesses === 'Information non disponible' || blesses === 'Aucune absence signalée';
                            const getTypeBadge = (text) => {
                              if (!text) return 'Estimée';
                              if (text.toLowerCase().includes('officielle')) return 'Officielle';
                              if (text.toLowerCase().includes('probable')) return 'Probable';
                              return 'Estimée';
                            };
                            const lines = !compoIndispo ? compo.split('\n').filter(l => l.trim()) : [];
                            const remplacantsIdx = lines.findIndex(l => l.toLowerCase().includes('remplaçant'));
                            const titulaires = remplacantsIdx >= 0 ? lines.slice(0, remplacantsIdx) : lines;
                            const remplacants = remplacantsIdx >= 0 ? lines.slice(remplacantsIdx + 1) : [];
                            return (
                              <div key={name} className="bg-teal-50/40 rounded-lg border border-teal-100 overflow-hidden">
                                <div className="flex items-center justify-between px-3 py-1.5 bg-teal-100/60">
                                  <p className="text-[10px] font-bold text-teal-800 uppercase tracking-wide">{name}</p>
                                  {!compoIndispo && (
                                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                      {getTypeBadge(compo)}
                                    </span>
                                  )}
                                </div>
                                <div className="px-3 py-2 space-y-2">
                                  {titulaires.length > 0 && (
                                    <div>
                                      <p className="text-[9px] font-bold text-teal-600 uppercase tracking-wide mb-1">Titulaires</p>
                                      {titulaires.map((line, i) => (
                                        <p key={i} className="text-[11px] text-gray-700 leading-relaxed">{line.trim()}</p>
                                      ))}
                                    </div>
                                  )}
                                  {remplacants.length > 0 && (
                                    <div>
                                      <p className="text-[9px] font-bold text-teal-600 uppercase tracking-wide mb-1">Remplaçants</p>
                                      {remplacants.map((line, i) => (
                                        <p key={i} className="text-[11px] text-gray-500 leading-relaxed">{line.trim()}</p>
                                      ))}
                                    </div>
                                  )}
                                  {compoIndispo && <p className="text-[11px] text-gray-400 italic">Composition non disponible</p>}
                                  {!blessesIndispo && (
                                    <div className="pt-2 border-t border-teal-100">
                                      <p className="text-[9px] font-bold text-red-500 uppercase tracking-wide mb-1">Absents</p>
                                      <p className="text-[11px] text-red-600 leading-relaxed">{blesses}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                // Cas normal
                const contenu = section.key === 'forme_domicile'
                  ? `🏠 ${match.equipe_domicile}\n${actu.forme_domicile || ''}\n\n🚌 ${match.equipe_exterieure}\n${actu.forme_exterieure || ''}`
                  : actu[section.key];
                const contenuVide = !contenu
                  || /^(information non disponible|non disponible|aucune (information|d[ée]claration)|n\/?a)\.?$/i.test(String(contenu).trim());
                if (contenuVide) return null;
                return (
                  <div key={section.key} className={`rounded-lg border ${colors.border} overflow-hidden`}>
                    <button
                      onClick={() => toggleSection(section.key)}
                      className={`w-full flex items-center justify-between px-3 py-2 ${colors.bg} hover:opacity-90 transition-opacity`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={`w-3.5 h-3.5 ${colors.color}`} />
                        <span className={`text-[11px] font-bold uppercase tracking-wide ${colors.color}`}>
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
// ABRÉVIATIONS ÉQUIPES (Top 14 + Pro D2)
// ============================================
const ABBREV = {
  // Top 14
  'STADE TOULOUSAIN': 'TLS',
  'STADE ROCHELAIS': 'LRO',
  'BORDEAUX BÈGLES': 'UBB',
  'UNION BORDEAUX BÈGLES': 'UBB',
  'UNION BORDEAUX-BÈGLES': 'UBB',
  'ASM CLERMONT': 'CLR',
  'RACING 92': 'R92',
  'RC TOULON': 'TLN',
  'STADE FRANÇAIS PARIS': 'SFP',
  'MONTPELLIER HÉRAULT RUGBY': 'MHR',
  'CASTRES OLYMPIQUE': 'CAS',
  'AVIRON BAYONNAIS': 'BAY',
  'SECTION PALOISE': 'PAU',
  'USA PERPIGNAN': 'PER',
  'LYON OU': 'LYO',
  'US MONTAUBAN': 'MTB',
  // Pro D2 (historique)
  'COLOMIERS RUGBY': 'COL',
  'AGEN': 'AGN',
  'SU AGEN': 'AGN',
  'AURILLAC': 'AUR',
  'RUGBY AURILLAC': 'AUR',
  'BIARRITZ OLYMPIQUE': 'BIA',
  'BRIVE': 'BRV',
  'CA BRIVE': 'BRV',
  'CORRÈZE BRIVE': 'BRV',
  'GRENOBLE': 'GRE',
  'FC GRENOBLE': 'GRE',
  'OYONNAX': 'OYO',
  'RUGBY OYONNAX': 'OYO',
  'ROUEN NORMANDIE': 'ROU',
  'NEVERS': 'NEV',
  'RUGBY CLUB MASSY': 'MAS',
  'MASSY': 'MAS',
  'MONT-DE-MARSAN': 'MDM',
  'STADE MONTOIS': 'MDM',
  'BOURGOIN': 'BRG',
  'CSBJ': 'BRG',
  'DÔME RUGBY': 'DOM',
  'NARBONNE': 'NAR',
  'RC NARBONNE': 'NAR',
  'ANGOULÊME': 'ANG',
  'SOYAUX ANGOULÊME': 'ANG',
  'VANNES': 'VAN',
  'RC VANNES': 'VAN',
  'VALENCE ROMANS': 'VRD',
  'VALENCE ROMANS DRÔME': 'VRD',
  'ALBI': 'ALB',
  'SC ALBI': 'ALB',
  'TARBES': 'TAR',
  'STADO TARBES': 'TAR',
  'NICE': 'NIC',
  'ATHLETIC CLUB BOBIGNY': 'ACB',
  'PROVENCE RUGBY': 'PRV',
  'TOULON METROPOLE': 'TLM',
  'CHAMBÉRY': 'CHB',
};

const getAbbrev = (nomEquipe) => {
  const upper = (nomEquipe || '').toUpperCase().trim();
  if (ABBREV[upper]) return ABBREV[upper];
  // Fallback : 3 premières lettres du premier mot
  return upper.replace(/[^A-Z]/g, '').substring(0, 3) || '???';
};


// ============================================
// COMPOSANT : Insights algorithmiques Pro D2
// ============================================
function InsightsD2({ match, isOpen, onToggle }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleToggle = async () => {
    onToggle();
    if (!isOpen && !data && !loading) {
      setLoading(true);
      setError(null);
      try {
        const url = `${API_BASE}/api/d2/insights?equipe_dom=${encodeURIComponent(match.equipe_domicile)}&equipe_ext=${encodeURIComponent(match.equipe_exterieure)}`;
        const res = await axios.get(url);
        setData(res.data);
      } catch (e) {
        setError('Impossible de charger les insights.');
      } finally {
        setLoading(false);
      }
    }
  };

  const SerieBlocs = ({ serie }) => (
    <div className="flex gap-1 flex-wrap">
      {serie.map((s, i) => (
        <span key={i} className="text-[10px] font-bold px-1.5 py-0.5 rounded"
          style={{
            backgroundColor: s.res === 'V' ? 'rgba(34,197,94,0.15)' : s.res === 'D' ? 'rgba(239,68,68,0.15)' : 'rgba(156,163,175,0.15)',
            color: s.res === 'V' ? '#16a34a' : s.res === 'D' ? '#dc2626' : '#6b7280',
            border: `1px solid ${s.res === 'V' ? '#86efac' : s.res === 'D' ? '#fca5a5' : '#d1d5db'}`
          }}>
          {s.res} {s.marques}-{s.encaisses}
        </span>
      ))}
    </div>
  );

  return (
    <div className="mt-3 border-t pt-3" style={{ borderColor: '#97C1FE' }}>
      <RubriqueHeader
        theme={RUBRIQUE_THEMES.prod2}
        icon={BarChart2}
        label="Statistiques du duel"
        isOpen={isOpen}
        loading={loading}
        onToggle={handleToggle}
        badge={data ? `${data.h2h.nb_matchs} confrontations` : null}
      />

      {isOpen && (
        <div className="mt-3 space-y-3">
          {error && <p className="text-xs text-center py-2 italic" style={{ color: '#97C1FE' }}>{error}</p>}
          {loading && <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin" style={{ color: '#97C1FE' }} /></div>}

          {data && !loading && (
            <>
              {/* ── Head-to-Head ── */}
              {data.h2h.nb_matchs > 0 ? (
                <div className="rounded-lg p-3" style={{ backgroundColor: '#F0F4FF', border: '1px solid #97C1FE' }}>
                  <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: '#00174D' }}>
                    ⚔️ Face-à-face — {data.h2h.nb_matchs} matchs
                  </p>

                  {/* Barre victoires */}
                  <div className="mb-3">
                    <div className="flex justify-between text-[10px] mb-1" style={{ color: '#00174D' }}>
                      <span className="font-bold">{match.equipe_domicile.split(' ')[0]}</span>
                      <span className="text-gray-400">Nuls {data.h2h.nuls}</span>
                      <span className="font-bold">{match.equipe_exterieure.split(' ')[0]}</span>
                    </div>
                    <div className="flex h-2 rounded-full overflow-hidden">
                      <div style={{ width: `${data.h2h.pct_victoires_dom}%`, backgroundColor: '#00174D' }} />
                      <div style={{ width: `${Math.round(data.h2h.nuls / data.h2h.nb_matchs * 100)}%`, backgroundColor: '#C0C0C0' }} />
                      <div style={{ width: `${data.h2h.pct_victoires_ext}%`, backgroundColor: '#97C1FE' }} />
                    </div>
                    <div className="flex justify-between text-[10px] mt-0.5 font-bold">
                      <span style={{ color: '#00174D' }}>{data.h2h.pct_victoires_dom}%</span>
                      <span style={{ color: '#97C1FE' }}>{data.h2h.pct_victoires_ext}%</span>
                    </div>
                  </div>

                  {/* Stats clés */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded p-2 text-center" style={{ backgroundColor: '#E8EEFF', border: '1px solid #C0C0C0' }}>
                      <p className="text-[11px] font-bold" style={{ color: '#00174D' }}>{data.h2h.moy_points_match} pts</p>
                      <p className="text-[9px]" style={{ color: '#334d99' }}>Moy. points/match</p>
                    </div>
                    <div className="rounded p-2 text-center" style={{ backgroundColor: '#E8EEFF', border: '1px solid #C0C0C0' }}>
                      <p className="text-[11px] font-bold" style={{ color: '#00174D' }}>{data.h2h.pct_plus_50_pts}%</p>
                      <p className="text-[9px]" style={{ color: '#334d99' }}>Matchs +50 pts</p>
                    </div>
                    <div className="rounded p-2 text-center" style={{ backgroundColor: '#E8EEFF', border: '1px solid #C0C0C0' }}>
                      <p className="text-[11px] font-bold" style={{ color: '#00174D' }}>{data.h2h.pct_matchs_serrés}%</p>
                      <p className="text-[9px]" style={{ color: '#334d99' }}>Matchs serrés (&lt;10 pts)</p>
                    </div>
                    <div className="rounded p-2 text-center" style={{ backgroundColor: '#E8EEFF', border: '1px solid #C0C0C0' }}>
                      <p className="text-[11px] font-bold" style={{ color: '#00174D' }}>{data.h2h.moy_dom} - {data.h2h.moy_ext}</p>
                      <p className="text-[9px]" style={{ color: '#334d99' }}>Score moyen</p>
                    </div>
                    {data.h2h.fiabilite_algo !== null && (
                      <div className="col-span-2 rounded p-2 text-center" style={{ backgroundColor: '#E8EEFF', border: '1px solid #C0C0C0' }}>
                        <p className="text-[11px] font-bold" style={{ color: '#00174D', fontSize: '13px' }}>{data.h2h.fiabilite_algo}% des duels bien prédits</p>
                        <p className="text-[9px]" style={{ color: '#334d99' }}>🎯 L'algo a trouvé le bon vainqueur</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-center italic py-2" style={{ color: '#97C1FE' }}>Aucune confrontation directe dans l'historique D2</p>
              )}

              {/* ── Forme récente ── */}
              {[data.forme_dom, data.forme_ext].map(forme => (
                <div key={forme.equipe} className="rounded-lg p-3" style={{ backgroundColor: '#F0F4FF', border: '1px solid #97C1FE' }}>
                  <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: '#00174D' }}>
                    🏉 {forme.equipe} — 5 derniers matchs
                  </p>
                  <SerieBlocs serie={forme.serie} />
                  <div className="flex gap-3 mt-2">
                    <span className="text-[10px]" style={{ color: '#00174D' }}>
                      <span className="font-bold">{forme.victoires}V</span> <span className="text-gray-400">{forme.nuls}N</span> <span className="font-bold" style={{ color: '#ef4444' }}>{forme.defaites}D</span>
                    </span>
                    <span className="text-[10px]" style={{ color: '#97C1FE' }}>
                      Moy. {forme.moyMarques} pts marqués / {forme.moyEncaisses} encaissés
                    </span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}


// Pro D2 : libellés courts des rounds de phase finale pour l'historique des
// confrontations (un match = une ligne → forme au singulier, comme le Top 14).
// Graphie source : match_cotes_d2.round (renvoyé par /api/d2/historique).
const D2_ROUND_COURT = {
  'Barrage':             'Barrage',
  'Barrage 1':           'Barrage',
  'Barrage 2':           'Barrage',
  'Demi-finale 1':       '½ finale',
  'Demi-finale 2':       '½ finale',
  'Finale':              'Finale',
  'Accession':           'Accession',
  'Access Match Pro D2': 'Accession',
  'Access Match Top 14': 'Accession',
};

// Libellé d'une "journée" : n° régulier, ou nom du round en phase finale.
// Top 14 : 26 journées régulières ; barrages introduits en 2009-2010
// (avant : J27=½ finale, J28=Finale).
// Pro D2 : 30 journées régulières, puis on s'appuie sur le round précis renvoyé
// par l'endpoint (Barrage / Demi-finale / Finale / Match d'accession).
function libelleJournee(journee, saison, isD2 = false, round = null) {
  const j = Number(journee);
  if (isD2) {
    // Phase finale : le round est la source la plus fiable (Barrage 1/2, etc.)
    if (round && D2_ROUND_COURT[round]) return D2_ROUND_COURT[round];
    if (j && j <= 30) return `J${j}`;
    if (round) return round;            // round présent mais hors map → affiché brut
    return j ? 'Phase finale' : `J${journee}`;
  }
  if (!j) return `J${journee}`;
  // Top 14
  if (j <= 26) return `J${j}`;
  const anneeDebut = parseInt(String(saison).slice(0, 4), 10) || 0;
  if (anneeDebut >= 2009) {
    if (j === 27) return 'Barrage';
    if (j === 28) return '½ finale';
    if (j === 29) return 'Finale';
  } else {
    if (j === 27) return '½ finale';
    if (j === 28) return 'Finale';
  }
  return 'Phase finale';
}



// ============================================
// COMPOSANT : Historique des confrontations
// ============================================
function HistoriqueConfrontations({ match, isOpen, onToggle }) {
  const [confrontations, setConfrontations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleToggle = async () => {
    onToggle();
    if (!isOpen && !confrontations && !loading) {
      setLoading(true);
      setError(null);
      try {
        let found = [];

        if (match.isD2) {
          // Pro D2 : confrontations directes filtrées côté serveur (paramètre adversaire)
          const res = await axios.get(`${API_BASE}/api/d2/historique`, {
            params: {
              equipe: match.equipe_domicile,
              adversaire: match.equipe_exterieure,
              limit: 10,
              offset: 0,
            },
          });
          found = (res.data?.matchs || []).map(m => ({
            ...m,
            score_domicile: m.score_reel_dom ?? 0,
            score_exterieur: m.score_reel_ext ?? 0,
            score_ht_domicile: null,
            score_ht_exterieur: null,
          }));
        } else {
          // Top 14 : confrontations directes filtrées et normalisées côté serveur
          // (paramètre `adversaire` => gère les orthographes multiples, ex. UBB / Union Bordeaux Bègles).
          const res = await axios.get(`${API_BASE}/api/matchs/historique`, {
            params: {
              equipe: match.equipe_domicile,
              adversaire: match.equipe_exterieure,
              limit: 10,
              offset: 0,
            },
          });
          found = res.data?.matchs || [];
        }

        setConfrontations(found.slice(0, 10));
      } catch (e) {
        setError('Impossible de charger l\'historique.');
      } finally {
        setLoading(false);
      }
    }
  };
  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      <RubriqueHeader
        theme={match.isD2 ? RUBRIQUE_THEMES.prod2 : RUBRIQUE_THEMES.top14}
        icon={Swords}
        label="Historique des confrontations"
        isOpen={isOpen}
        loading={loading}
        onToggle={handleToggle}
        badge={confrontations ? `${confrontations.length} matchs` : null}
      />

      {isOpen && (
        <div className="mt-2">
          {error && <p className="text-xs text-gray-400 text-center py-2 italic">{error}</p>}
          {loading && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
            </div>
          )}
          {confrontations && !loading && confrontations.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-3 italic">
              Aucune confrontation trouvée dans l'historique
            </p>
          )}
          {confrontations && !loading && confrontations.length > 0 && (
            <div className="bg-teal-50 rounded-lg border border-teal-100 overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-5 px-2 py-1.5 bg-teal-100/70 text-[10px] font-bold text-teal-700 uppercase tracking-wide text-center">
                <div className="text-left">Sais./J.</div>
                <div>DOM</div>
                <div>FT</div>
                <div>MT</div>
                <div>EXT</div>
              </div>

              {confrontations.map((m, i) => {
                const saisonCourt = (m.saison || '').replace('20', '').replace('-20', '-');
                const journee = libelleJournee(m.journee, m.saison, match.isD2, m.round);
                const ftScore = `${m.score_domicile}-${m.score_exterieur}`;
                const mtScore = (m.score_ht_domicile != null && m.score_ht_exterieur != null)
                  ? `${m.score_ht_domicile}-${m.score_ht_exterieur}` : '-';
                const domGagne = m.score_domicile > m.score_exterieur;
                const nul = m.score_domicile === m.score_exterieur;
                const bgRow = i % 2 === 0 ? 'bg-white' : 'bg-teal-50/40';
                const abbrevDom = getAbbrev(m.equipe_domicile);
                const abbrevExt = getAbbrev(m.equipe_exterieure);

                return (
                  <div
                    key={m.id || i}
                    className={`grid grid-cols-5 px-2 py-2 items-center text-center border-b border-teal-100/50 last:border-0 ${bgRow}`}
                  >
                    {/* Saison + Journée empilées */}
                    <div className="text-left">
                      <div className="text-[11px] font-semibold text-gray-600">{saisonCourt}</div>
                      <div className="text-[10px] text-gray-400">{journee}</div>
                    </div>

                    {/* DOM abrégé */}
                    <div className={`text-[12px] font-bold ${domGagne ? 'text-green-600' : nul ? 'text-gray-500' : 'text-red-500'}`}>
                      {abbrevDom}
                    </div>

                    {/* Score FT */}
                    <div className="text-[12px] font-bold text-rugby-gold">{ftScore}</div>

                    {/* Score MT */}
                    <div className="text-[11px] text-gray-500">{mtScore}</div>

                    {/* EXT abrégé */}
                    <div className={`text-[12px] font-bold ${!domGagne && !nul ? 'text-green-600' : nul ? 'text-gray-500' : 'text-red-500'}`}>
                      {abbrevExt}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// COMPOSANT : Tooltip barre de confiance
// ============================================
function InfoConfiance() {
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
// COMPOSANT : PronoCard
// ============================================
function PronoCard({ match, openPanel, onTogglePanel }) {
  const equipeDom = match.equipe_domicile || 'Équipe 1';
  const equipeExt = match.equipe_exterieure || 'Équipe 2';

  // Refs panels (conservés pour usage futur)
  const analyseRef = useRef(null);
  const actuRef = useRef(null);

  const handleTogglePanel = (panel) => {
    const isOpening = openPanel !== panel;
    const wasOpen = openPanel; // panel précédemment ouvert
    onTogglePanel(panel);

    // Si on ouvre un nouveau panel (en fermant l'autre),
    // on scrolle vers lui après que l'ancien se soit replié
    if (isOpening) {
      const delay = wasOpen ? 320 : 80; // attendre l'animation de fermeture si nécessaire
      setTimeout(() => {
        const ref = panel === 'analyse' ? analyseRef : actuRef;
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        // Vérifier si l'élément est hors de la zone visible (trop haut)
        if (rect.top < 80) {
          const elTop = rect.top + window.pageYOffset - 90;
          window.scrollTo({ top: elTop, behavior: 'smooth' });
        }
      }, delay);
    }
  };

  const scoreDom = match.prono_ft?.domicile ?? 0;
  const scoreExt = match.prono_ft?.exterieur ?? 0;

  const scoreHtDom = match.isD2 ? null : (match.prono_ht?.domicile ?? null);
  const scoreHtExt = match.isD2 ? null : (match.prono_ht?.exterieur ?? null);
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

  // Popup fiche équipe
  const [teamPopup, setTeamPopup] = useState(null);

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
        <div className="text-xs font-semibold" style={match.isD2 ? { color: '#97C1FE' } : { color: '#9a7d3a' }}>{dateFormatted}</div>
        {heureFormatted && (
          <div className="text-xs font-bold" style={match.isD2 ? { color: '#C0C0C0' } : { color: '#CBA135' }}>{heureFormatted}</div>
        )}
      </div>

      {/* Badge phase de playoffs (Pro D2 uniquement) — affiche la vraie phase */}
      {match.isD2 && match.round && match.round !== 'Journée' && (() => {
        // Mapping phase → { libellé affiché, style }. Conserve le détail
        // ("Demi-finale 1" reste "Demi-finale 1", contrairement au titre d'accordéon).
        const NAVY   = { backgroundColor: '#00174D', color: '#97C1FE' };
        const PURPLE = { backgroundColor: '#7c3aed', color: '#fff' };
        const D2_BADGE = {
          'Demi-finale 1':       { label: '🏉 Demi-finale 1',          style: NAVY },
          'Demi-finale 2':       { label: '🏉 Demi-finale 2',          style: NAVY },
          'Barrage 1':           { label: '🏆 Barrage 1',              style: NAVY },
          'Barrage 2':           { label: '🏆 Barrage 2',              style: NAVY },
          'Barrage':             { label: '🏆 Barrage',                style: NAVY },
          'Finale':              { label: '🏆 Finale',                 style: NAVY },
          'Accession':           { label: "⚡ Match d'accession",       style: PURPLE },
          'Access Match Pro D2': { label: "⚡ Match d'accession Pro D2", style: PURPLE },
          'Access Match Top 14': { label: "⚡ Match d'accession Top 14", style: PURPLE },
        };
        const badge = D2_BADGE[match.round] || { label: match.round, style: NAVY };
        return (
          <div className="flex justify-center mb-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide"
              style={badge.style}>
              {badge.label}
            </span>
          </div>
        );
      })()}

      {/* Équipes + scores */}
      <div className="grid grid-cols-3 items-start px-4 mb-2">
        {/* Équipe domicile — cliquable */}
        <button
          onClick={() => !match.isD2 && setTeamPopup(equipeDom)}
          className={`flex flex-col items-center text-center transition-opacity ${!match.isD2 ? "hover:opacity-80 cursor-pointer" : "cursor-default"}`}
        >
          <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mb-2 shadow-sm">
            <img
              src={teamDomData.logo}
              alt={teamDomData.name}
              className="w-12 h-12 object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
          <div className={`text-base font-bold leading-tight break-words line-clamp-2 ${!match.isD2 ? "underline decoration-dotted underline-offset-2" : ""}`}
               style={match.isD2 ? { color: '#00174D' } : { color: '#1a1a1a' }}>
            {equipeDom}
          </div>
        </button>

        <div className="flex flex-col items-center justify-center gap-1">
          <div className="text-xs font-medium mb-1" style={match.isD2 ? { color: '#97C1FE' } : { color: '#9a7d3a' }}>Score FT prédit</div>
          <div className="flex items-center gap-2 text-[1.65rem] font-bold" style={match.isD2 ? { color: '#C0C0C0' } : { color: '#CBA135' }}>
            {scoreDom} - {scoreExt}
          </div>
          {scoreHtText && (
            <>
              <div className="text-xs font-medium mt-2" style={match.isD2 ? { color: '#97C1FE' } : { color: '#9a7d3a' }}>Score MT prédit</div>
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

        {/* Équipe extérieure — cliquable */}
        <button
          onClick={() => !match.isD2 && setTeamPopup(equipeExt)}
          className={`flex flex-col items-center text-center transition-opacity ${!match.isD2 ? "hover:opacity-80 cursor-pointer" : "cursor-default"}`}
        >
          <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mb-2 shadow-sm">
            <img
              src={teamExtData.logo}
              alt={teamExtData.name}
              className="w-12 h-12 object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
          <div className={`text-base font-bold leading-tight break-words line-clamp-2 ${!match.isD2 ? "underline decoration-dotted underline-offset-2" : ""}`}
               style={match.isD2 ? { color: '#00174D' } : { color: '#1a1a1a' }}>
            {equipeExt}
          </div>
        </button>
      </div>

      {/* Barre FT */}
      <div className="mt-4 mb-5 px-4">
        <div className="flex justify-between text-xs mb-2" style={match.isD2 ? { color: '#97C1FE' } : { color: '#9a7d3a' }}>
          <div className="flex items-center gap-1.5">
            <span className="font-medium">Indice favori</span>
            <InfoConfiance />
          </div>
          <span className="font-bold" style={match.isD2 ? { color: '#C0C0C0' } : { color: '#CBA135' }}>{confidencePct}%</span>
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

      {/* Analyse historique (Top 14) + Insights (Pro D2) + Actu du match (les deux) */}
      <div className="px-4">
        {!match.isD2 && (
          <PourquoiCePronostic
            match={match}
            isOpen={openPanel === 'pourquoi'}
            onToggle={() => handleTogglePanel('pourquoi')}
          />
        )}
        {!match.isD2 && (
          <div ref={analyseRef}>
            <AnalyseHistorique
              match={match}
              isOpen={openPanel === 'analyse'}
              onToggle={() => handleTogglePanel('analyse')}
            />
          </div>
        )}
        {/* Insights algorithmiques — Pro D2 uniquement */}
        {match.isD2 && (
          <InsightsD2
            match={match}
            isOpen={openPanel === 'insights'}
            onToggle={() => handleTogglePanel('insights')}
          />
        )}
        {/* Actu du match — Top 14 ET Pro D2 */}
        <div ref={actuRef}>
          <ActuMatch
            match={match}
            isOpen={openPanel === 'actu'}
            onToggle={() => handleTogglePanel('actu')}
          />
        </div>
        <HistoriqueConfrontations
          match={match}
          isOpen={openPanel === 'confrontations'}
          onToggle={() => handleTogglePanel('confrontations')}
        />
      </div>

      {/* Popup fiche équipe */}
      {teamPopup && (
        <TeamPopup
          equipeNom={teamPopup}
          onClose={() => setTeamPopup(null)}
        />
      )}

    </div>
  );
}
