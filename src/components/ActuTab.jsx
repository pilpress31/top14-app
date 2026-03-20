import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Calendar, CloudSun, Users, Mic, Swords, Trophy } from 'lucide-react';
import axios from 'axios';
import { getTeamData } from '../utils/teams';

export default function ActuTab() {
  const [actus, setActus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedMatch, setExpandedMatch] = useState(null);
  const [expandedSection, setExpandedSection] = useState({});

  useEffect(() => {
    loadActus();
  }, []);

  const loadActus = async () => {
    try {
      const response = await axios.get('https://top14-api-production.up.railway.app/api/actu');
      setActus(response.data || []);
    } catch (error) {
      console.error('Erreur chargement actus:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMatch = (matchId) => {
    setExpandedMatch(prev => prev === matchId ? null : matchId);
    setExpandedSection({});
  };

  const toggleSection = (matchId, section) => {
    setExpandedSection(prev => ({
      ...prev,
      [`${matchId}-${section}`]: !prev[`${matchId}-${section}`]
    }));
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }) + ' • ' + date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-rugby-gold"></div>
      </div>
    );
  }

  if (actus.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center border border-rugby-gray mt-4">
        <p className="text-gray-500 text-sm">Aucune actualité disponible pour le moment.</p>
        <p className="text-gray-400 text-xs mt-2">Les actus sont générées le lundi et vendredi.</p>
      </div>
    );
  }

  // Grouper par journée
  const journees = [...new Set(actus.map(a => a.journee))].sort((a, b) => a - b);

  return (
    <div className="space-y-4 mt-2">

      {/* Header journée */}
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
                    className="bg-white rounded-xl shadow-sm border border-rugby-gray overflow-hidden"
                  >
                    {/* Header match — cliquable */}
                    <button
                      onClick={() => toggleMatch(actu.match_id)}
                      className="w-full px-4 py-3 hover:bg-rugby-gold/5 transition-colors"
                    >
                      {/* Date */}
                      <p className="text-[10px] text-gray-400 mb-2 text-left">
                        {formatDate(actu.date_match)}
                      </p>

                      {/* Équipes */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center flex-shrink-0">
                            <img src={teamDom.logo} alt={teamDom.name} className="w-7 h-7 object-contain"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                          </div>
                          <span className="text-sm font-bold text-gray-900 truncate text-left">{teamDom.name}</span>
                        </div>

                        <span className="text-xs font-bold text-rugby-gold px-2">VS</span>

                        <div className="flex items-center gap-2 flex-1 justify-end">
                          <span className="text-sm font-bold text-gray-900 truncate text-right">{teamExt.name}</span>
                          <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center flex-shrink-0">
                            <img src={teamExt.logo} alt={teamExt.name} className="w-7 h-7 object-contain"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                          </div>
                        </div>
                      </div>

                      {/* Résumé global */}
                      {actu.resume_global && actu.resume_global !== 'Synthèse en cours de génération...' && (
                        <p className="text-xs text-gray-600 mt-2 text-left line-clamp-2 italic">
                          {actu.resume_global}
                        </p>
                      )}

                      {/* Chevron */}
                      <div className="flex items-center justify-between mt-2">
                        {hasContent ? (
                          <span className="text-[10px] text-rugby-gold font-semibold">
                            {isExpanded ? 'Réduire' : 'Voir l\'analyse complète'}
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-400">Analyse en cours...</span>
                        )}
                        {hasContent && (
                          isExpanded
                            ? <ChevronUp className="w-4 h-4 text-rugby-gold" />
                            : <ChevronDown className="w-4 h-4 text-rugby-gold" />
                        )}
                      </div>
                    </button>

                    {/* Contenu expandable */}
                    {isExpanded && hasContent && (
                      <div className="border-t border-rugby-gray divide-y divide-rugby-gray">

                        {/* Météo */}
                        {actu.meteo && actu.meteo !== 'Météo non disponible' && (
                          <div className="px-4 py-3 bg-blue-50/50">
                            <div className="flex items-center gap-2">
                              <CloudSun className="w-4 h-4 text-blue-500 flex-shrink-0" />
                              <p className="text-xs text-blue-700">{actu.meteo}</p>
                            </div>
                          </div>
                        )}

                        {/* Forme des équipes */}
                        <SectionBlock
                          icon={<Trophy className="w-4 h-4 text-rugby-gold" />}
                          title="Forme récente"
                          matchId={actu.match_id}
                          section="forme"
                          expandedSection={expandedSection}
                          toggleSection={toggleSection}
                        >
                          <div className="space-y-3">
                            <TeamSection name={teamDom.name} logo={teamDom.logo} content={actu.forme_domicile} />
                            <TeamSection name={teamExt.name} logo={teamExt.logo} content={actu.forme_exterieure} />
                          </div>
                        </SectionBlock>

                        {/* Blessés */}
                        <SectionBlock
                          icon={<Users className="w-4 h-4 text-red-500" />}
                          title="Blessés / Absents"
                          matchId={actu.match_id}
                          section="blesses"
                          expandedSection={expandedSection}
                          toggleSection={toggleSection}
                        >
                          <div className="space-y-3">
                            <TeamSection name={teamDom.name} logo={teamDom.logo} content={actu.blesses_domicile} />
                            <TeamSection name={teamExt.name} logo={teamExt.logo} content={actu.blesses_exterieure} />
                          </div>
                        </SectionBlock>

                        {/* Déclarations */}
                        {actu.declarations && actu.declarations !== 'Information non disponible' && (
                          <SectionBlock
                            icon={<Mic className="w-4 h-4 text-purple-500" />}
                            title="Déclarations"
                            matchId={actu.match_id}
                            section="declarations"
                            expandedSection={expandedSection}
                            toggleSection={toggleSection}
                          >
                            <p className="text-xs text-gray-700 leading-relaxed">{actu.declarations}</p>
                          </SectionBlock>
                        )}

                        {/* Contexte */}
                        {actu.contexte_match && actu.contexte_match !== 'Information non disponible' && (
                          <SectionBlock
                            icon={<Swords className="w-4 h-4 text-orange-500" />}
                            title="Contexte & Enjeux"
                            matchId={actu.match_id}
                            section="contexte"
                            expandedSection={expandedSection}
                            toggleSection={toggleSection}
                          >
                            <p className="text-xs text-gray-700 leading-relaxed">{actu.contexte_match}</p>
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

      {/* Date de génération */}
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

// ─── Composant section expandable ───
function SectionBlock({ icon, title, matchId, section, expandedSection, toggleSection, children }) {
  const isOpen = expandedSection[`${matchId}-${section}`] !== false;

  return (
    <div>
      <button
        onClick={() => toggleSection(matchId, section)}
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

// ─── Composant équipe avec logo ───
function TeamSection({ name, logo, content }) {
  if (!content || content === 'Information non disponible' || content === 'Aucune absence majeure signalée') {
    return (
      <div className="flex items-start gap-2">
        <img src={logo} alt={name} className="w-5 h-5 object-contain flex-shrink-0 mt-0.5"
          onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        <div>
          <p className="text-[10px] font-semibold text-gray-500 mb-0.5">{name}</p>
          <p className="text-xs text-gray-400 italic">
            {content === 'Aucune absence majeure signalée' ? content : 'Information non disponible'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2">
      <img src={logo} alt={name} className="w-5 h-5 object-contain flex-shrink-0 mt-0.5"
        onError={(e) => { e.currentTarget.style.display = 'none'; }} />
      <div>
        <p className="text-[10px] font-semibold text-gray-500 mb-0.5">{name}</p>
        <p className="text-xs text-gray-700 leading-relaxed">{content}</p>
      </div>
    </div>
  );
}
