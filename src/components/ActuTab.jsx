import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Calendar, CloudSun, Users, Swords, Trophy, ClipboardList } from 'lucide-react';
import axios from 'axios';
import { getTeamData } from '../utils/teams';

export default function ActuTab() {
  const [actus, setActus] = useState([]);
  const [journee, setJournee] = useState(null);
  const [disponible, setDisponible] = useState(true);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedMatch, setExpandedMatch] = useState(null);
  const [expandedSection, setExpandedSection] = useState({});
  const cardRefs = useRef({});

  useEffect(() => {
    loadActus();
  }, []);

  const loadActus = async () => {
    try {
      const response = await axios.get('https://top14-api-production.up.railway.app/api/actu');
      const data = response.data;

      if (Array.isArray(data)) {
        setActus(data);
        setDisponible(data.length > 0);
      } else {
        setActus(data.actus || []);
        setJournee(data.journee || null);
        setDisponible(data.disponible !== false);
        setMessage(data.message || '');
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
        [`${matchId}-blesses`]: false,
        [`${matchId}-contexte`]: false,
        [`${matchId}-compo`]: false,
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
                const hasCompo = actu.compo_domicile && actu.compo_domicile !== 'Information non disponible';

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

                        {/* Météo */}
                        {actu.meteo && !['Météo non disponible', 'Météo temporairement indisponible'].includes(actu.meteo) && (
                          <div className="px-4 py-2.5 bg-blue-50/50">
                            <div className="flex items-center gap-2">
                              <CloudSun className="w-4 h-4 text-blue-500 flex-shrink-0" />
                              <p className="text-xs text-blue-700">{actu.meteo}</p>
                            </div>
                          </div>
                        )}

                        {/* Pronostic IA — ouvert par défaut */}
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

                        {/* Forme récente — ouvert par défaut */}
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

                        {/* Contexte & Enjeux — fermé par défaut */}
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

                        {/* ✅ COMPO PROBABLE — fermé par défaut, placé avant Blessés */}
                        {hasCompo && (
                          <SectionBlock
                            icon={<ClipboardList className="w-4 h-4 text-teal-500" />}
                            title="Compo probable"
                            isOpen={isSectionOpen(actu.match_id, 'compo', false)}
                            onToggle={() => toggleSection(actu.match_id, 'compo')}
                          >
                            <div className="space-y-4">
                              <CompoSection
                                name={teamDom.name}
                                logo={teamDom.logo}
                                content={actu.compo_domicile}
                              />
                              <CompoSection
                                name={teamExt.name}
                                logo={teamExt.logo}
                                content={actu.compo_exterieure}
                              />
                            </div>
                          </SectionBlock>
                        )}

                        {/* Blessés / Absents — fermé par défaut */}
                        <SectionBlock
                          icon={<Users className="w-4 h-4 text-red-500" />}
                          title="Blessés / Absents"
                          isOpen={isSectionOpen(actu.match_id, 'blesses', false)}
                          onToggle={() => toggleSection(actu.match_id, 'blesses')}
                        >
                          <div className="space-y-3">
                            <TeamSection name={teamDom.name} logo={teamDom.logo} content={actu.blesses_domicile} />
                            <TeamSection name={teamExt.name} logo={teamExt.logo} content={actu.blesses_exterieure} />
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

// ─── Section expandable ───
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

// ─── Équipe avec logo (texte libre) ───
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

// ─── Compo avec logo — affichage ligne par ligne ───
function CompoSection({ name, logo, content }) {
  const isUnavailable = !content ||
    content === 'Information non disponible' ||
    content === 'Données en cours de chargement...';

  // Détecter si c'est compo officielle, probable ou estimée
  const getTypeBadge = (text) => {
    if (!text) return null;
    if (text.toLowerCase().includes('officielle')) return { label: 'Officielle', color: 'bg-green-100 text-green-700' };
    if (text.toLowerCase().includes('probable')) return { label: 'Probable', color: 'bg-blue-100 text-blue-700' };
    if (text.toLowerCase().includes('estimée')) return { label: 'Estimée', color: 'bg-gray-100 text-gray-600' };
    return { label: 'Probable', color: 'bg-blue-100 text-blue-700' };
  };

  const badge = !isUnavailable ? getTypeBadge(content) : null;

  // Séparer titulaires et remplaçants
  const lines = !isUnavailable ? content.split('\n').filter(l => l.trim()) : [];
  const remplacantsIdx = lines.findIndex(l => l.toLowerCase().includes('remplaçant'));
  const titulaires = remplacantsIdx >= 0 ? lines.slice(0, remplacantsIdx) : lines;
  const remplacants = remplacantsIdx >= 0 ? lines.slice(remplacantsIdx + 1) : [];

  return (
    <div className="bg-teal-50/50 rounded-lg border border-teal-100 overflow-hidden">
      {/* Header équipe */}
      <div className="flex items-center justify-between px-3 py-2 bg-teal-100/50">
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

      {isUnavailable ? (
        <p className="text-xs text-gray-400 italic px-3 py-2">Composition non disponible</p>
      ) : (
        <div className="px-3 py-2">
          {/* Titulaires */}
          {titulaires.length > 0 && (
            <div className="mb-2">
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
        </div>
      )}
    </div>
  );
}
