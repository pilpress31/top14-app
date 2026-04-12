import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Calendar, CloudSun, Swords, Trophy, ClipboardList } from 'lucide-react';
import axios from 'axios';
import { getTeamData } from '../utils/teams';
import { useRealtimeSync } from '../hooks/useRealtimeSync';

export default function ActuTab() {
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
    }, []);

  const loadActus = async () => {
    try {
      const response = await axios.get('https://top14-api-production.up.railway.app/api/actu');
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
    const date = new Date(dateStr);
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
          Générées le jeudi à 9h et le vendredi à 18h.
        </p>
      </div>
    );
  }

  const journees = [...new Set(actus.map(a => a.journee))].sort((a, b) => a - b);

  return (
    <div className="space-y-4 mt-2">
      {derniereMaj && (
        <p className="text-center text-[10px] text-gray-400">
          Analyses générées le {new Date(derniereMaj).toLocaleDateString('fr-FR', {
            day: 'numeric', month: 'long'
          })} à {new Date(derniereMaj).toLocaleTimeString('fr-FR', {
            hour: '2-digit', minute: '2-digit'
          })}
        </p>
      )}
      {journees.map(journee => {
        const matchsJournee = actus.filter(a => a.journee === journee);
        return (
          <div key={journee}>
            <div className="flex items-center gap-2 mb-3 px-1">
              <Calendar className="w-4 h-4 text-rugby-gold" />
              <h2 className="font-bold text-rugby-black text-sm uppercase tracking-wide">
                Journée {journee}
              </h2>
              <span className="text-xs text-gray-400">({matchsJournee.length} matchs)</span>
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
                          Analyse du {new Date(actu.generated_at || actu.updated_at).toLocaleDateString('fr-FR', {
                            day: 'numeric', month: 'short'
                          })} à {new Date(actu.generated_at || actu.updated_at).toLocaleTimeString('fr-FR', {
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
                            icon={<span className="text-base leading-none">🔍</span>}
                            title="Insights algorithmiques"
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

                        {/* Section fusionnée Compo + Blessés par équipe */}
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
          Dernière mise à jour : {new Date(actus[0].updated_at).toLocaleDateString('fr-FR', {
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
    content === 'Information non disponible' ||
    content === 'Données en cours de chargement...';

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
function InsightBadge({ label, confiance, color }) {
  const pct = Math.min(100, Math.max(0, confiance || 0));
  const barColor = pct >= 70 ? 'bg-green-400' : pct >= 45 ? 'bg-amber-400' : 'bg-gray-300';
  return (
    <div className={`rounded-lg border px-3 py-2 ${color}`}>
      <p className="text-xs font-semibold text-gray-800 mb-1 leading-snug">{label}</p>
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

  const labelVainqueurFT = vainqueur_ft
    ? (vainqueur_ft.label === 'Match nul'
        ? `Score nul prédit (confiance ${vainqueur_ft.proba || 0}%)`
        : `${vainqueur_ft.label} gagne (${vainqueur_ft.proba || 0}%)`)
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
              confiance={total_ft.confiance}
              color={total_ft.direction === 'over' ? 'bg-orange-50 border-orange-200' : 'bg-sky-50 border-sky-200'}
            />
          )}
          {vainqueur_ft && (
            <InsightBadge
              label={labelVainqueurFT}
              confiance={vainqueur_ft.confiance}
              color="bg-purple-50 border-purple-200"
            />
          )}
          {ecart_ft && (
            <InsightBadge
              label={ecart_ft.label}
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
              confiance={total_mt.confiance}
              color={total_mt.direction === 'over' ? 'bg-orange-50 border-orange-100' : 'bg-sky-50 border-sky-100'}
            />
          )}
          {vainqueur_mt && (
            <InsightBadge
              label={`Mène à la pause : ${vainqueur_mt.label}`}
              confiance={vainqueur_mt.confiance}
              color="bg-teal-50 border-teal-200"
            />
          )}
          {ecart_mt && (
            <InsightBadge
              label={ecart_mt.label}
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

// ─── Section fusionnée : Compo + Blessés par équipe ───
function CompoEtBlessesSection({ name, logo, compo, blesses }) {
  const compoIndispo = !compo || compo === 'Information non disponible';
  const blessesIndispo = !blesses ||
    blesses === 'Information non disponible' ||
    blesses === 'Aucune absence majeure signalée' ||
    blesses === 'Aucune absence signalée';

  // Détecter type de compo
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
  const titulaires = remplacantsIdx >= 0 ? lines.slice(0, remplacantsIdx) : lines;
  const remplacants = remplacantsIdx >= 0 ? lines.slice(remplacantsIdx + 1) : [];

  return (
    <div className="bg-teal-50/40 rounded-lg border border-teal-100 overflow-hidden">
      {/* Header équipe */}
      <div className="flex items-center justify-between px-3 py-2 bg-teal-100/60">
        <div className="flex items-center gap-2">
          <img src={logo} alt={name} className="w-5 h-5 object-contain"
            onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <p className="text-[10px] font-bold text-teal-800 uppercase tracking-wide">{name}</p>
        </div>
        {badge && (
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${badge.color}`}>
            {badge.label}
          </span>
        )}
      </div>

      <div className="px-3 py-2 space-y-2">
        {/* Titulaires */}
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

        {/* Remplaçants */}
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

        {compoIndispo && (
          <p className="text-xs text-gray-400 italic">Composition non disponible</p>
        )}

        {/* Blessés — séparateur + liste sans label */}
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
