import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Calendar, CloudSun, Swords, Trophy, ClipboardList } from 'lucide-react';
import axios from 'axios';
import { getTeamData } from '../utils/teams';
import { useRealtimeSync } from '../hooks/useRealtimeSync';
import { useChampionnat } from '../contexts/ChampionnatContext';


/**
 * 🆕 parseAsParis : interprète une chaîne datetime SANS appliquer
 * de conversion de timezone par le navigateur.
 *
 * Les timestamps en BDD (generated_at, updated_at, date_match...)
 * sont stockés en `timestamp without time zone` mais les valeurs
 * écrites sont en heure de Paris. Si on fait `new Date(str)`,
 * JavaScript suppose UTC et ajoute +2h (heure d'été).
 *
 * Cette fonction extrait les composants de la chaîne et crée
 * une Date avec ces valeurs prises comme heure locale du navigateur.
 * En pratique pour des users français, ça affiche la bonne heure.
 */
function parseAsParis(dateStr) {
  if (!dateStr) return null;
  // Nettoyer : retirer "Z" et fuseau "+00:00" éventuels
  const clean = String(dateStr).replace(/Z$/, '').replace(/[+-]\d{2}:?\d{2}$/, '');
  // Format attendu : "2026-04-27 15:15:13" ou "2026-04-27T15:15:13"
  const m = clean.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):?(\d{2})?/);
  if (!m) return new Date(dateStr); // Fallback
  const [, y, mo, d, h, mi, se] = m;
  return new Date(parseInt(y), parseInt(mo) - 1, parseInt(d), parseInt(h), parseInt(mi), parseInt(se || '0'));
}

export default function ActuTab() {
  const { championnat } = useChampionnat();
  const [actus, setActus] = useState([]);
  const [journee, setJournee] = useState(null);
  const [disponible, setDisponible] = useState(true);
  const [message, setMessage] = useState('');
  const [derniereMaj, setDerniereMaj] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedMatch, setExpandedMatch] = useState(null);
  const [expandedSection, setExpandedSection] = useState({});
  const cardRefs = useRef({});

  // ✅ Realtime
    useRealtimeSync([
      { table: 'actu_matchs', onUpdate: () => loadActus() },
    ]);

    useEffect(() => {
      loadActus();
    }, [championnat]);

  const loadActus = async () => {
    try {
      const response = await axios.get(`https://top14-api-production.up.railway.app/api/actu?championnat=${championnat}`);
      const data = response.data;

      // Nouveau format : { actus: [], journee, disponible, message }
      // Ancien format (tableau direct) : géré en fallback
      if (Array.isArray(data)) {
        // Ancien format — compatibilité ascendante
        setActus(data);
        setDisponible(data.length > 0);
      } else {
        setActus(data.actus || []);
        setJournee(data.journee || null);
        setDisponible(data.disponible !== false);
        setMessage(data.message || '');
        setDerniereMaj(data.derniere_maj || null);
      }
    } catch (error) {
      console.error('Erreur chargement actus:', error);
      setDisponible(false);
    } finally {
      setLoading(false);
    }
  };

  const toggleMatch = (matchId) => {
    const isOpening = expandedMatch !== matchId;
    setExpandedMatch(isOpening ? matchId : null);
    if (isOpening) {
      setExpandedSection(prev => ({
        ...prev,
        [`${matchId}-forme`]: true,
        [`${matchId}-pronostic`]: true,
        [`${matchId}-compo`]: false,
        [`${matchId}-contexte`]: false,
      }));
      setTimeout(() => {
        const el = cardRefs.current[matchId];
        if (el) {
          const headerOffset = 130;
          const top = el.getBoundingClientRect().top + window.pageYOffset - headerOffset;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      }, 50);
    }
  };

  const toggleSection = (matchId, section) => {
    setExpandedSection(prev => ({
      ...prev,
      [`${matchId}-${section}`]: !prev[`${matchId}-${section}`]
    }));
  };

  const isSectionOpen = (matchId, section, defaultOpen = false) => {
    const key = `${matchId}-${section}`;
    return expandedSection[key] !== undefined ? expandedSection[key] : defaultOpen;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = parseAsParis(dateStr);
    if (!date) return '';
    return date.toLocaleDateString('fr-FR', {
      weekday: 'short', day: 'numeric', month: 'short',
    }) + ' • ' + date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-rugby-gold"></div>
      </div>
    );
  }

  // Pas encore disponible pour la prochaine journée
  if (!disponible || actus.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center border border-rugby-gray mt-4">
        <div className="text-3xl mb-3">📰</div>
        <p className="text-gray-700 font-semibold text-sm">
          {journee ? `Analyses J${journee} à venir` : 'Analyses à venir'}
        </p>
        <p className="text-gray-400 text-xs mt-2">
          {message || 'Les analyses IA seront disponibles prochainement.'}
        </p>
        <p className="text-gray-400 text-xs mt-1">
          Générées le lundi à 18h et le jeudi à 18h.
        </p>
      </div>
    );
  }

  // 🆕 Libellé de phase : "round" sert de titre quand ce n'est pas une journée
  // de saison régulière ("Journée"). Sinon on retombe sur "Journée {numéro}".
  const sectionLabel = (a) => {
    const r = (a.round || '').trim();
    return (r && r.toLowerCase() !== 'journée') ? r : `Journée ${a.journee}`;
  };
  // Sections ordonnées par date du 1er match
  const sections = [...new Set(actus.map(sectionLabel))].sort((s1, s2) => {
    const minDate = (s) => Math.min(...actus
      .filter(a => sectionLabel(a) === s)
      .map(a => new Date(a.date_match).getTime()));
    return minDate(s1) - minDate(s2);
  });

  return (
    <div className="space-y-4 mt-2">
      {derniereMaj && (
        <p className="text-center text-[10px] text-gray-400">
          Analyses générées le {parseAsParis(derniereMaj).toLocaleDateString('fr-FR', {
            day: 'numeric', month: 'long'
          })} à {parseAsParis(derniereMaj).toLocaleTimeString('fr-FR', {
            hour: '2-digit', minute: '2-digit'
          })}
        </p>
      )}
      {sections.map(section => {
        const matchsJournee = actus.filter(a => sectionLabel(a) === section);
        return (
          <div key={section}>
            <div className="flex items-center gap-2 mb-3 px-1">
              <Calendar className="w-4 h-4 text-rugby-gold" />
              <h2 className="font-bold text-white text-sm uppercase tracking-wide">
                {section}
              </h2>
              <span className="text-xs text-gray-400">
                ({matchsJournee.length} match{matchsJournee.length > 1 ? 's' : ''})
              </span>
            </div>

            <div className="space-y-3">
              {matchsJournee.map(actu => {
                const teamDom = getTeamData(actu.equipe_domicile);
                const teamExt = getTeamData(actu.equipe_exterieure);
                const isExpanded = expandedMatch === actu.match_id;
                const hasContent = actu.forme_domicile && actu.forme_domicile !== 'Données en cours de chargement...';

                return (
                  <div
                    key={actu.match_id}
                    ref={el => cardRefs.current[actu.match_id] = el}
                    className="bg-white rounded-xl shadow-sm border border-rugby-gray overflow-hidden"
                  >
                    {/* Header match cliquable */}
                    <button
                      onClick={() => toggleMatch(actu.match_id)}
                      className="w-full px-4 py-3 hover:bg-rugby-gold/5 transition-colors text-left"
                    >
                      <p className="text-[10px] text-gray-400 mb-2">{formatDate(actu.date_match)}</p>
                      {(actu.generated_at || actu.updated_at) && (
                        <p className="text-[9px] text-gray-300 mb-1">
                          Analyse du {parseAsParis(actu.generated_at || actu.updated_at).toLocaleDateString('fr-FR', {
                            day: 'numeric', month: 'short'
                          })} à {parseAsParis(actu.generated_at || actu.updated_at).toLocaleTimeString('fr-FR', {
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      )}

                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center flex-shrink-0">
                            <img src={teamDom.logo} alt={teamDom.name} className="w-7 h-7 object-contain"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                          </div>
                          <span className="text-sm font-bold text-gray-900 truncate">{teamDom.name}</span>
                        </div>
                        <span className="text-xs font-bold text-rugby-gold px-2 flex-shrink-0">VS</span>
                        <div className="flex items-center gap-2 flex-1 justify-end">
                          <span className="text-sm font-bold text-gray-900 truncate text-right">{teamExt.name}</span>
                          <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center flex-shrink-0">
                            <img src={teamExt.logo} alt={teamExt.name} className="w-7 h-7 object-contain"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                          </div>
                        </div>
                      </div>

                      {actu.resume_global && actu.resume_global !== 'Synthèse en cours de génération...' && (
                        <p className={`text-xs text-gray-600 mt-2 italic leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
                          {actu.resume_global}
                        </p>
                      )}

                      {hasContent && (
                        <div className="flex items-center justify-end gap-1 mt-3 pt-2 border-t border-gray-100">
                          <span className="text-[11px] text-rugby-gold font-semibold">
                            {isExpanded ? 'Réduire' : 'Analyse complète'}
                          </span>
                          {isExpanded
                            ? <ChevronUp className="w-3.5 h-3.5 text-rugby-gold" />
                            : <ChevronDown className="w-3.5 h-3.5 text-rugby-gold" />
                          }
                        </div>
                      )}
                      {!hasContent && (
                        <p className="text-[10px] text-gray-400 mt-2">Analyse en cours...</p>
                      )}
                    </button>

                    {/* Contenu expandable */}
                    {isExpanded && hasContent && (
                      <div className="border-t border-rugby-gray divide-y divide-rugby-gray">

                        {actu.meteo && !['Météo non disponible', 'Météo temporairement indisponible'].includes(actu.meteo) && (
                          <div className="px-4 py-2.5 bg-blue-50/50">
                            <div className="flex items-center gap-2">
                              <CloudSun className="w-4 h-4 text-blue-500 flex-shrink-0" />
                              <p className="text-xs text-blue-700">{actu.meteo}</p>
                            </div>
                          </div>
                        )}

                        {actu.insights && (
                          <SectionBlock
                            icon={<span className="text-sm">📊</span>}
                            title="Statistiques du duel"
                            isOpen={isSectionOpen(actu.match_id, 'insights', true)}
                            onToggle={() => toggleSection(actu.match_id, 'insights')}
                          >
                            <InsightsSection insights={actu.insights} />
                          </SectionBlock>
                        )}

                        {actu.pronostic_ia && actu.pronostic_ia !== 'Information non disponible' && (
                          <SectionBlock
                            icon={<span className="text-base leading-none">🤖</span>}
                            title="Pronostic IA"
                            isOpen={isSectionOpen(actu.match_id, 'pronostic', true)}
                            onToggle={() => toggleSection(actu.match_id, 'pronostic')}
                          >
                            <div className="bg-rugby-gold/5 rounded-lg p-3 border border-rugby-gold/20">
                              <p className="text-xs text-gray-700 leading-relaxed">{actu.pronostic_ia}</p>
                            </div>
                          </SectionBlock>
                        )}

                        <SectionBlock
                          icon={<Trophy className="w-4 h-4 text-rugby-gold" />}
                          title="Forme récente"
                          isOpen={isSectionOpen(actu.match_id, 'forme', true)}
                          onToggle={() => toggleSection(actu.match_id, 'forme')}
                        >
                          <div className="space-y-3">
                            <TeamSection name={teamDom.name} logo={teamDom.logo} content={actu.forme_domicile} />
                            <TeamSection name={teamExt.name} logo={teamExt.logo} content={actu.forme_exterieure} />
                          </div>
                        </SectionBlock>

                        {actu.contexte_match && actu.contexte_match !== 'Information non disponible' && (
                          <SectionBlock
                            icon={<Swords className="w-4 h-4 text-orange-500" />}
                            title="Contexte & Enjeux"
                            isOpen={isSectionOpen(actu.match_id, 'contexte', false)}
                            onToggle={() => toggleSection(actu.match_id, 'contexte')}
                          >
                            <p className="text-xs text-gray-700 leading-relaxed">{actu.contexte_match}</p>
                          </SectionBlock>
                        )}

                        {/* Section fusionnée Compo + Blessés — Top 14 uniquement
                            (pas de source fiable de compos/blessés pour D2 et CCUP) */}
                        {(championnat === 'top14' || championnat === 'prod2' || championnat === 'hcup') && (
                        <SectionBlock
                          icon={<ClipboardList className="w-4 h-4 text-teal-500" />}
                          title="Compo probable & Absents"
                          isOpen={isSectionOpen(actu.match_id, 'compo', false)}
                          onToggle={() => toggleSection(actu.match_id, 'compo')}
                        >
                          <div className="space-y-4">
                            <CompoEtBlessesSection
                              name={teamDom.name}
                              logo={teamDom.logo}
                              compo={actu.compo_domicile}
                              blesses={actu.blesses_domicile}
                            />
                            <CompoEtBlessesSection
                              name={teamExt.name}
                              logo={teamExt.logo}
                              compo={actu.compo_exterieure}
                              blesses={actu.blesses_exterieure}
                            />
                          </div>
                        </SectionBlock>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {actus.length > 0 && actus[0].updated_at && (
        <p className="text-center text-[10px] text-gray-400 pb-2">
          Dernière mise à jour : {parseAsParis(actus[0].updated_at).toLocaleDateString('fr-FR', {
            day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
          })}
        </p>
      )}
    </div>
  );
}

function SectionBlock({ icon, title, isOpen, onToggle, children }) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-xs font-semibold text-gray-700">{title}</span>
        </div>
        {isOpen
          ? <ChevronUp className="w-3 h-3 text-gray-400" />
          : <ChevronDown className="w-3 h-3 text-gray-400" />
        }
      </button>
      {isOpen && (
        <div className="px-4 pb-3">
          {children}
        </div>
      )}
    </div>
  );
}

function TeamSection({ name, logo, content }) {
  const isUnavailable = !content ||
    content === 'Données en cours de chargement...' ||
    /^(information non disponible|non disponible|aucune (information|d[ée]claration)|n\/?a)\.?$/i.test(String(content).trim());

  return (
    <div className="flex items-start gap-2">
      <img src={logo} alt={name} className="w-5 h-5 object-contain flex-shrink-0 mt-0.5"
        onError={(e) => { e.currentTarget.style.display = 'none'; }} />
      <div className="flex-1">
        <p className="text-[10px] font-semibold text-gray-500 mb-0.5 uppercase tracking-wide">{name}</p>
        <p className={`text-xs leading-relaxed ${isUnavailable ? 'text-gray-400 italic' : 'text-gray-700'}`}>
          {isUnavailable ? 'Information non disponible' : content}
        </p>
      </div>
    </div>
  );
}

// ─── Section Insights algorithmiques ───
function InsightBadge({ label, sublabel, confiance, color }) {
  const pct = Math.min(100, Math.max(0, confiance || 0));
  const barColor = pct >= 70 ? 'bg-green-500' : pct >= 45 ? 'bg-green-300' : 'bg-amber-300';
  return (
    <div className={`rounded-lg border px-3 py-2 ${color}`}>
      <p className="text-xs font-semibold text-gray-800 mb-0.5 leading-snug">{label}</p>
      {sublabel && <p className="text-[10px] text-gray-500 mb-1">{sublabel}</p>}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
        <span className="text-[10px] text-gray-500 font-medium">{pct}%</span>
      </div>
    </div>
  );
}

function InsightsSection({ insights }) {
  if (!insights) return null;
  const { total_ft, total_mt, ecart_ft, ecart_mt, vainqueur_ft, vainqueur_mt, score_predit } = insights;

  // Raccourcir les noms d'équipes BDD → nom court lisible
  const nomCourt = (nom) => {
    if (!nom) return '—';
    const map = {
      'STADE TOULOUSAIN': 'Toulouse', 'STADE ROCHELAIS': 'La Rochelle',
      'BORDEAUX BÈGLES': 'Bordeaux', 'RACING 92': 'Racing 92',
      'ASM CLERMONT': 'Clermont', 'STADE FRANÇAIS PARIS': 'Stade Français',
      'RC TOULON': 'Toulon', 'LYON OU': 'Lyon',
      'MONTPELLIER HÉRAULT RUGBY': 'Montpellier', 'CASTRES OLYMPIQUE': 'Castres',
      'SECTION PALOISE': 'Pau', 'AVIRON BAYONNAIS': 'Bayonne',
      'USA PERPIGNAN': 'Perpignan', 'US MONTAUBAN': 'Montauban',
    };
    return map[nom] || nom.split(' ')[0];
  };

  const labelVainqueurFT = vainqueur_ft
    ? (vainqueur_ft.label === 'Match nul'
        ? { main: '🤝 Score nul prédit', sub: 'Probabilité algo' }
        : { main: `🏆 ${nomCourt(vainqueur_ft.label)} gagne`, sub: 'Probabilité algo' })
    : null;

  const labelVainqueurMT = vainqueur_mt
    ? { main: `⏸ Mène à la pause : ${nomCourt(vainqueur_mt.label)}`, sub: null }
    : null;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {/* Colonne FT */}
        <div className="space-y-2">
          <div className="bg-rugby-gold/10 border border-rugby-gold/30 rounded-lg px-3 py-2 text-center">
            <p className="text-[9px] font-bold text-rugby-gold uppercase tracking-wide mb-0.5">⏱ Temps plein</p>
            <p className="text-base font-bold text-gray-800">{score_predit?.ft || '—'}</p>
          </div>
          {total_ft && (
            <InsightBadge
              label={total_ft.label}
              sublabel="Total de points FT"
              confiance={total_ft.confiance}
              color={total_ft.direction === 'over' ? 'bg-orange-50 border-orange-200' : 'bg-sky-50 border-sky-200'}
            />
          )}
          {vainqueur_ft && labelVainqueurFT && (
            <InsightBadge
              label={labelVainqueurFT.main}
              sublabel={labelVainqueurFT.sub}
              confiance={vainqueur_ft.proba || vainqueur_ft.confiance}
              color="bg-purple-50 border-purple-200"
            />
          )}
          {ecart_ft && (
            <InsightBadge
              label={ecart_ft.label}
              sublabel="Écart prédit FT"
              confiance={ecart_ft.confiance}
              color={ecart_ft.type === 'tight' ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}
            />
          )}
        </div>

        {/* Colonne MT */}
        <div className="space-y-2">
          <div className="bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-center">
            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wide mb-0.5">⏸ Mi-temps</p>
            <p className="text-base font-bold text-gray-700">{score_predit?.mt || '—'}</p>
          </div>
          {total_mt && (
            <InsightBadge
              label={total_mt.label}
              sublabel="Total de points MT"
              confiance={total_mt.confiance}
              color={total_mt.direction === 'over' ? 'bg-orange-50 border-orange-100' : 'bg-sky-50 border-sky-100'}
            />
          )}
          {vainqueur_mt && labelVainqueurMT && (
            <InsightBadge
              label={labelVainqueurMT.main}
              sublabel={labelVainqueurMT.sub}
              confiance={vainqueur_mt.confiance}
              color="bg-teal-50 border-teal-200"
            />
          )}
          {ecart_mt && (
            <InsightBadge
              label={ecart_mt.label}
              sublabel="Écart prédit MT"
              confiance={ecart_mt.confiance}
              color={ecart_mt.type === 'tight' ? 'bg-yellow-50 border-yellow-100' : 'bg-green-50 border-green-100'}
            />
          )}
        </div>
      </div>
      <p className="text-[9px] text-gray-400 italic text-center pt-1">
        Basé sur les prédictions algorithmiques — à titre informatif uniquement
      </p>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Helper : parse une ligne "1. NOM Prénom (poste)" → { num, nom, poste }
// ──────────────────────────────────────────────────────────────────
function parsePlayerLine(line) {
  // Ex: "1. Daniel BIBI BIZIWU (Pilier)"
  const match = line.match(/^(\d+)[.\s]+(.+?)\s*\(([^)]+)\)\s*$/);
  if (!match) return null;
  const [, num, nom, poste] = match;
  return {
    num: parseInt(num, 10),
    nom: nom.trim(),
    poste: poste.trim()
  };
}

// ──────────────────────────────────────────────────────────────────
// Vue Liste (existante)
// ──────────────────────────────────────────────────────────────────
function CompoListView({ titulaires, remplacants }) {
  return (
    <div className="space-y-2">
      {titulaires.length > 0 && (
        <div>
          <p className="text-[9px] font-bold text-teal-600 uppercase tracking-wide mb-1">Titulaires</p>
          <div className="space-y-0.5">
            {titulaires.map((line, i) => (
              <p key={i} className="text-xs text-gray-700 leading-relaxed">{line.trim()}</p>
            ))}
          </div>
        </div>
      )}
      {remplacants.length > 0 && (
        <div>
          <p className="text-[9px] font-bold text-teal-600 uppercase tracking-wide mb-1">Remplaçants</p>
          <div className="space-y-0.5">
            {remplacants.map((line, i) => (
              <p key={i} className="text-xs text-gray-500 leading-relaxed">{line.trim()}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Vue Terrain (nouvelle) - placement tactique 15 titulaires + remplaçants en bas
// ──────────────────────────────────────────────────────────────────
function CompoTerrainView({ titulaires, remplacants }) {
  // Parser les titulaires
  const players = titulaires
    .map(line => parsePlayerLine(line))
    .filter(p => p !== null);
  
  // Map par numéro pour accès rapide
  const byNum = {};
  players.forEach(p => { byNum[p.num] = p; });
  
  // Parser les remplaçants
  const remps = remplacants
    .map(line => parsePlayerLine(line))
    .filter(p => p !== null);

  // Positions des 15 titulaires sur le terrain
  // Coordonnées en % (x: gauche-droite, y: bas-haut, 0 = bas/avant, 100 = haut/arrière)
  // Le terrain est représenté en mode portrait : avants en bas, arrières en haut
  const positions = {
    // 1ère ligne (avants en mêlée) - rangée du bas
    1: { x: 25, y: 8, label: 'Pilier G.' },     // Pilier gauche
    2: { x: 50, y: 8, label: 'Talonneur' },     // Talonneur
    3: { x: 75, y: 8, label: 'Pilier D.' },     // Pilier droit
    // 2ème ligne
    4: { x: 38, y: 22, label: '2ème ligne' },
    5: { x: 62, y: 22, label: '2ème ligne' },
    // 3ème ligne (flankers + n°8)
    6: { x: 18, y: 35, label: '3L Aile' },      // Flanker gauche
    8: { x: 50, y: 35, label: '3L Centre' },    // Numéro 8
    7: { x: 82, y: 35, label: '3L Aile' },      // Flanker droit
    // Demi de mêlée
    9: { x: 50, y: 48, label: 'Mêlée' },
    // Ouverture
    10: { x: 35, y: 60, label: 'Ouverture' },
    // 3 quarts
    12: { x: 30, y: 72, label: '1er centre' },
    13: { x: 55, y: 72, label: '2ème centre' },
    // Ailiers
    11: { x: 10, y: 78, label: 'Ailier' },
    14: { x: 90, y: 78, label: 'Ailier' },
    // Arrière
    15: { x: 50, y: 92, label: 'Arrière' }
  };

  // Couleur du jersey par numéro (pack rouge, ligne arrière bleu)
  const getJerseyColor = (num) => {
    if (num >= 1 && num <= 8) return '#dc2626';   // Avants - rouge
    if (num === 9 || num === 10) return '#7c3aed'; // Demis - violet
    return '#2563eb';                              // Arrières - bleu
  };

  return (
    <div className="space-y-2">
      {/* Terrain SVG */}
      <div className="relative w-full" style={{ aspectRatio: '5/7' }}>
        <svg
          viewBox="0 0 100 140"
          className="w-full h-full rounded-md"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Fond pelouse avec rayures */}
          <defs>
            <pattern id="grass" x="0" y="0" width="100" height="14" patternUnits="userSpaceOnUse">
              <rect width="100" height="14" fill="#16a34a" />
              <rect width="100" height="7" fill="#15803d" />
            </pattern>
          </defs>
          <rect width="100" height="140" fill="url(#grass)" />
          
          {/* Lignes du terrain */}
          {/* Ligne en-but bas */}
          <line x1="2" y1="2" x2="98" y2="2" stroke="white" strokeWidth="0.4" />
          {/* Ligne 22m bas */}
          <line x1="2" y1="20" x2="98" y2="20" stroke="white" strokeWidth="0.3" strokeDasharray="0.8,0.4" opacity="0.7" />
          {/* Ligne médiane */}
          <line x1="2" y1="70" x2="98" y2="70" stroke="white" strokeWidth="0.4" />
          {/* Ligne 22m haut */}
          <line x1="2" y1="120" x2="98" y2="120" stroke="white" strokeWidth="0.3" strokeDasharray="0.8,0.4" opacity="0.7" />
          {/* Ligne en-but haut */}
          <line x1="2" y1="138" x2="98" y2="138" stroke="white" strokeWidth="0.4" />
          
          {/* Touches gauche & droite */}
          <line x1="2" y1="2" x2="2" y2="138" stroke="white" strokeWidth="0.4" />
          <line x1="98" y1="2" x2="98" y2="138" stroke="white" strokeWidth="0.4" />

          {/* Joueurs (cercles + numéro + nom) */}
          {Object.entries(positions).map(([num, pos]) => {
            const player = byNum[parseInt(num, 10)];
            if (!player) return null;
            
            const yReal = 140 - (pos.y * 140 / 100); // inversion : 0 = bas, 100 = haut
            const xReal = pos.x;
            
            // Récupérer juste le nom de famille (en MAJUSCULES dans la donnée)
            // Ex: "Daniel BIBI BIZIWU" → "BIBI BIZIWU"
            const nameParts = player.nom.split(' ');
            const lastNames = nameParts.filter(p => p === p.toUpperCase() && p.length > 1);
            const displayName = lastNames.length > 0 
              ? lastNames.join(' ').slice(0, 12)
              : player.nom.slice(0, 12);
            
            return (
              <g key={num}>
                {/* Cercle joueur */}
                <circle 
                  cx={xReal} 
                  cy={yReal} 
                  r="3.5" 
                  fill={getJerseyColor(parseInt(num, 10))} 
                  stroke="white" 
                  strokeWidth="0.4"
                />
                {/* Numéro de maillot */}
                <text 
                  x={xReal} 
                  y={yReal + 0.8} 
                  textAnchor="middle" 
                  fill="white" 
                  fontSize="2.8"
                  fontWeight="700"
                >
                  {player.num}
                </text>
                {/* Nom du joueur (en dessous) */}
                <text 
                  x={xReal} 
                  y={yReal + 6.5} 
                  textAnchor="middle" 
                  fill="white" 
                  fontSize="2.6"
                  fontWeight="600"
                  style={{ textShadow: '0 0 2px rgba(0,0,0,0.8)' }}
                >
                  {displayName}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Légende */}
      <div className="flex items-center gap-3 text-[9px] text-gray-500 px-1">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-600 inline-block"></span>
          Avants
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-purple-600 inline-block"></span>
          Demis
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>
          Arrières
        </span>
      </div>

      {/* Remplaçants (bandeau) */}
      {remps.length > 0 && (
        <div>
          <p className="text-[9px] font-bold text-teal-600 uppercase tracking-wide mb-1">Remplaçants</p>
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
            {remps.map((r, i) => (
              <p key={i} className="text-[10px] text-gray-500 leading-tight">
                <span className="font-semibold text-gray-600">{r.num}.</span> {r.nom}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Composant principal
// ──────────────────────────────────────────────────────────────────
export function CompoEtBlessesSection({ name, logo, compo, blesses }) {
  const [view, setView] = useState('liste'); // 'liste' | 'terrain'

  const compoIndispo = !compo || compo === 'Information non disponible';
  const blessesIndispo = !blesses ||
    blesses === 'Information non disponible' ||
    blesses === 'Aucune absence majeure signalée' ||
    blesses === 'Aucune absence signalée';

  const getTypeBadge = (text) => {
    if (!text) return null;
    if (text.toLowerCase().includes('officielle')) return { label: 'Officielle', color: 'bg-green-100 text-green-700' };
    if (text.toLowerCase().includes('probable')) return { label: 'Probable', color: 'bg-blue-100 text-blue-700' };
    return { label: 'Estimée', color: 'bg-gray-100 text-gray-600' };
  };
  const badge = !compoIndispo ? getTypeBadge(compo) : null;

  // Parser compo en titulaires + remplaçants
  const lines = !compoIndispo ? compo.split('\n').filter(l => l.trim()) : [];
  const remplacantsIdx = lines.findIndex(l => l.toLowerCase().includes('remplaçant'));
  const titulairesRaw = remplacantsIdx >= 0 ? lines.slice(0, remplacantsIdx) : lines;
  const remplacantsRaw = remplacantsIdx >= 0 ? lines.slice(remplacantsIdx + 1) : [];
  
  // Filtrer la ligne "Compo estimée" et autres en-têtes
  const titulaires = titulairesRaw.filter(l => /^\d/.test(l.trim()));
  const remplacants = remplacantsRaw.filter(l => /^\d/.test(l.trim()));

  return (
    <div className="bg-teal-50/40 rounded-lg border border-teal-100 overflow-hidden">
      {/* Header équipe */}
      <div className="flex items-center justify-between px-3 py-2 bg-teal-100/60">
        <div className="flex items-center gap-2">
          <img src={logo} alt={name} className="w-5 h-5 object-contain"
            onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <p className="text-[10px] font-bold text-teal-800 uppercase tracking-wide">{name}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Toggle Liste / Terrain */}
          {!compoIndispo && titulaires.length > 0 && (
            <div className="flex items-center bg-white/80 rounded-full overflow-hidden text-[9px] font-semibold">
              <button
                type="button"
                onClick={() => setView('liste')}
                className={`px-2 py-0.5 transition-colors ${view === 'liste' ? 'bg-teal-600 text-white' : 'text-teal-700 hover:bg-teal-50'}`}
                aria-label="Voir en liste"
              >
                📋 Liste
              </button>
              <button
                type="button"
                onClick={() => setView('terrain')}
                className={`px-2 py-0.5 transition-colors ${view === 'terrain' ? 'bg-teal-600 text-white' : 'text-teal-700 hover:bg-teal-50'}`}
                aria-label="Voir sur terrain"
              >
                🏟️ Terrain
              </button>
            </div>
          )}
          {badge && (
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${badge.color}`}>
              {badge.label}
            </span>
          )}
        </div>
      </div>

      <div className="px-3 py-2 space-y-2">
        {compoIndispo && (
          <p className="text-xs text-gray-400 italic">Composition non disponible</p>
        )}

        {!compoIndispo && view === 'liste' && (
          <CompoListView titulaires={titulaires} remplacants={remplacants} />
        )}

        {!compoIndispo && view === 'terrain' && (
          <CompoTerrainView titulaires={titulaires} remplacants={remplacants} />
        )}

        {/* Blessés */}
        {!blessesIndispo && (
          <div className="pt-2 mt-1 border-t border-teal-100">
            <p className="text-[9px] font-bold text-red-500 uppercase tracking-wide mb-1">Absents</p>
            <p className="text-xs text-red-600 leading-relaxed">{blesses}</p>
          </div>
        )}
      </div>
    </div>
  );
}
