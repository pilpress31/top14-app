import { useState, useEffect } from 'react';
import { getOddsLive } from '../lib/api';
import { getTeamData } from '../utils/teamLogos';

interface Match {
  id: number;
  equipe_domicile: string;
  equipe_exterieure: string;
  score_domicile?: number;
  score_exterieur?: number;
  status: string;
  date: string;
  stade?: string;
  journee?: number;
  competition?: string;
}

interface OddsData {
  type: 'live' | 'prochains' | 'vide' | 'erreur';
  message?: string;
  matchs: Match[];
  errorType?: 'quota' | 'network' | 'api' | 'unknown';
}

export default function ResultatsPage() {
  const [data, setData] = useState<OddsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await getOddsLive();
      setData(result);
      setLastUpdate(new Date());
    } catch (error: any) {
      console.error('Erreur chargement résultats:', error);
      
      // Déterminer le type d'erreur
      let errorType: 'quota' | 'network' | 'api' | 'unknown' = 'unknown';
      let errorMessage = 'Une erreur inattendue s\'est produite';
      
      if (error?.response) {
        // Erreur de réponse API
        const status = error.response.status;
        
        if (status === 429) {
          errorType = 'quota';
          errorMessage = 'Quota API RapidAPI atteint';
        } else if (status === 403) {
          errorType = 'quota';
          errorMessage = 'Accès API refusé - Vérifiez votre abonnement RapidAPI';
        } else if (status >= 500) {
          errorType = 'api';
          errorMessage = 'Service RapidAPI temporairement indisponible';
        } else {
          errorType = 'api';
          errorMessage = `Erreur API (${status})`;
        }
      } else if (error?.request) {
        // Erreur réseau (pas de réponse)
        errorType = 'network';
        errorMessage = 'Erreur de connexion au service';
      } else if (error?.message?.includes('quota') || error?.message?.includes('429')) {
        errorType = 'quota';
        errorMessage = 'Quota API RapidAPI atteint';
      }
      
      setData({
        type: 'erreur',
        message: errorMessage,
        matchs: [],
        errorType: errorType
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const interval = setInterval(() => {
      if (data?.type === 'live') {
        loadData();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [data?.type]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString('fr-FR', options);
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    
    if (['1h', '2h', 'live'].some(s => statusLower.includes(s))) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 animate-pulse">
          <span className="w-2 h-2 bg-red-600 rounded-full mr-2 animate-ping"></span>
          LIVE
        </span>
      );
    }
    
    if (statusLower.includes('ht') || statusLower.includes('mi-temps')) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
          MI-TEMPS
        </span>
      );
    }
    
    if (['result', 'ft', 'finished'].some(s => statusLower.includes(s))) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
          TERMINÉ
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
        À VENIR
      </span>
    );
  };

  const renderMatch = (match: Match) => {
    const teamDom = getTeamData(match.equipe_domicile);
    const teamExt = getTeamData(match.equipe_exterieure);
    const isLive = ['1h', '2h', 'live', 'ht'].some(s => 
      match.status.toLowerCase().includes(s)
    );

    return (
      <div 
        key={match.id} 
        className={`bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow ${
          isLive ? 'ring-2 ring-red-500' : ''
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {getStatusBadge(match.status)}
            {match.journee && (
              <span className="text-sm text-gray-500 font-medium">
                J{match.journee}
              </span>
            )}
          </div>
          {match.competition && (
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
              {match.competition}
            </span>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-12 h-12 flex-shrink-0 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                {teamDom.logo ? (
                  <img 
                    src={teamDom.logo} 
                    alt={teamDom.nom}
                    className="w-10 h-10 object-contain"
                  />
                ) : (
                  <span className="text-2xl">{teamDom.emoji}</span>
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{teamDom.nom}</p>
                <p className="text-xs text-gray-500">Domicile</p>
              </div>
            </div>
            {isLive && match.score_domicile !== undefined && (
              <div className="text-3xl font-bold text-gray-900 min-w-[3rem] text-right">
                {match.score_domicile}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 py-1">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="text-xs text-gray-400 font-medium">VS</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-12 h-12 flex-shrink-0 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                {teamExt.logo ? (
                  <img 
                    src={teamExt.logo} 
                    alt={teamExt.nom}
                    className="w-10 h-10 object-contain"
                  />
                ) : (
                  <span className="text-2xl">{teamExt.emoji}</span>
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{teamExt.nom}</p>
                <p className="text-xs text-gray-500">Extérieur</p>
              </div>
            </div>
            {isLive && match.score_exterieur !== undefined && (
              <div className="text-3xl font-bold text-gray-900 min-w-[3rem] text-right">
                {match.score_exterieur}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="font-medium">{formatDate(match.date)}</span>
          </div>
          
          {match.stade && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-xs">{match.stade}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderErrorMessage = () => {
    if (!data || data.type !== 'erreur') return null;

    // Message personnalisé selon le type d'erreur
    const errorConfig = {
      quota: {
        color: 'orange',
        icon: (
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        title: 'Quota API Atteint',
        description: 'Le quota gratuit de RapidAPI a été atteint pour aujourd\'hui. Les résultats en direct seront à nouveau disponibles demain.',
        tips: [
          'Les pronos de notre algorithme restent disponibles',
          'Consultez les autres sections de l\'application',
          'Le quota se réinitialise chaque jour'
        ]
      },
      network: {
        color: 'red',
        icon: (
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
          </svg>
        ),
        title: 'Problème de Connexion',
        description: 'Impossible de se connecter au service RapidAPI.',
        tips: [
          'Vérifiez votre connexion internet',
          'Réessayez dans quelques instants',
          'Le service peut être temporairement indisponible'
        ]
      },
      api: {
        color: 'red',
        icon: (
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        ),
        title: 'Service Temporairement Indisponible',
        description: 'Le service RapidAPI rencontre actuellement des difficultés.',
        tips: [
          'Réessayez dans quelques minutes',
          'Les données seront à nouveau disponibles bientôt',
          'Consultez les pronos en attendant'
        ]
      },
      unknown: {
        color: 'red',
        icon: (
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        title: 'Erreur Inattendue',
        description: data.message || 'Une erreur s\'est produite lors du chargement des données.',
        tips: [
          'Actualisez la page',
          'Réessayez dans quelques instants'
        ]
      }
    };

    const config = errorConfig[data.errorType || 'unknown'];
    const colorClasses = {
      orange: {
        bg: 'bg-orange-50',
        border: 'border-orange-500',
        text: 'text-orange-800',
        icon: 'text-orange-500',
        subtext: 'text-orange-700',
        bullet: 'text-orange-600'
      },
      red: {
        bg: 'bg-red-50',
        border: 'border-red-500',
        text: 'text-red-800',
        icon: 'text-red-500',
        subtext: 'text-red-700',
        bullet: 'text-red-600'
      }
    };

    const colors = colorClasses[config.color as keyof typeof colorClasses];

    return (
      <div className={`${colors.bg} border-l-4 ${colors.border} rounded-lg shadow-lg overflow-hidden`}>
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`${colors.icon} flex-shrink-0`}>
              {config.icon}
            </div>
            <div className="flex-1">
              <h3 className={`text-xl font-bold ${colors.text} mb-2`}>
                {config.title}
              </h3>
              <p className={`${colors.subtext} mb-4 leading-relaxed`}>
                {config.description}
              </p>
              
              {config.tips && config.tips.length > 0 && (
                <div className={`mt-4 p-4 bg-white bg-opacity-50 rounded-lg`}>
                  <p className={`text-sm font-semibold ${colors.text} mb-2`}>
                    💡 Que faire ?
                  </p>
                  <ul className="space-y-2">
                    {config.tips.map((tip, index) => (
                      <li key={index} className={`text-sm ${colors.bullet} flex items-start gap-2`}>
                        <span className="flex-shrink-0 mt-1">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={loadData}
                disabled={loading}
                className={`mt-4 px-4 py-2 bg-white ${colors.text} border ${colors.border} rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-semibold shadow-sm`}
              >
                <svg 
                  className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Réessayer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600 font-medium">Chargement des résultats...</p>
        </div>
      </div>
    );
  }

  // Obtenir la date du jour
  const today = new Date();
  const dayNumber = today.getDate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pb-20">
      {/* Header compact */}
      <div className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              {/* Calendrier avec jour - charte rugby */}
              <div className="flex-shrink-0 w-16 h-16 bg-rugby-black rounded-lg flex flex-col items-center justify-center text-rugby-gold shadow-md border border-rugby-bronze">
                <div className="text-xs font-semibold uppercase">
                  {today.toLocaleDateString('fr-FR', { month: 'short' })}
                </div>
                <div className="text-2xl font-bold leading-none">
                  {dayNumber}
                </div>
              </div>

              {/* Titres */}
              <div className="w-full text-center">
                <h1 className="text-2xl font-bold text-gray-900 whitespace-nowrap">
                  {data?.type === 'live' ? '🔴 Matchs en Direct' : 'Prochains Matchs'}
                </h1>
                <p className="text-xs text-gray-600 mt-0.5">
                  {data?.type === 'live' 
                    ? 'Suivez les matchs en temps réel'
                    : 'Découvrez les matchs à venir du Top 14'
                  }
                </p>
              </div>
            </div>
            
            {/* Bouton actualiser - charte rugby */}
            <button
              onClick={loadData}
              disabled={loading}
              className="flex-shrink-0 px-3 py-2 bg-rugby-black text-rugby-gold border border-rugby-bronze rounded-lg hover:bg-rugby-bronze hover:text-rugby-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-semibold shadow-md"
            >
              <svg 
                className={`w-6 h-6 ${loading ? 'animate-spin' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="hidden sm:inline">Actualiser</span>
            </button>
          </div>
          
          {/* Dernière mise à jour */}
          {data?.type === 'live' && (
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Dernière mise à jour : {lastUpdate.toLocaleTimeString('fr-FR')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Message d'erreur personnalisé */}
        {data?.type === 'erreur' && renderErrorMessage()}

        {/* Message aucun match */}
        {data?.type === 'vide' && (
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-lg shadow-md">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-yellow-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-lg font-semibold text-yellow-800">Aucun match disponible</h3>
                <p className="text-yellow-700 mt-1">{data.message}</p>
                <p className="text-sm text-yellow-600 mt-2">
                  Il n'y a pas de match Top 14 prévu dans les prochains jours.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Liste des matchs */}
        {data && data.matchs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.matchs.map(match => renderMatch(match))}
          </div>
        )}

        {/* Informations footer */}
        {data && data.matchs.length > 0 && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-blue-800">
                <p className="font-medium">Données fournies par RapidAPI Rugby Live Data</p>
                <p className="text-blue-700 mt-1">
                  {data.type === 'live' 
                    ? 'Les scores sont mis à jour automatiquement toutes les 60 secondes.'
                    : 'Les horaires et lieux des matchs sont susceptibles de changer.'
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
