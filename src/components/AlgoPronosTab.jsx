import { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import axios from 'axios';
import { getTeamData } from '../utils/teams';

export default function AlgoPronosTab() {
  const [pronos, setPronos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedJournees, setExpandedJournees] = useState(new Set());
  
  // ✅ Refs pour chaque journée
  const journeeRefs = useRef({});

  useEffect(() => {
    loadPronos();
  }, []);

  const loadPronos = async () => {
    try {
      const response = await axios.get('https://top14-api-production.up.railway.app/api/pronos');
      const pronosData = response.data.pronos || response.data || [];
      setPronos(pronosData);
      
      // Auto-expansion de la première journée
      if (pronosData.length > 0) {
        const journees = [...new Set(pronosData.map(p => p.journee))].sort((a, b) => {
          const numA = typeof a === 'string' ? parseInt(a.replace('J', '')) : a;
          const numB = typeof b === 'string' ? parseInt(b.replace('J', '')) : b;
          return numA - numB;
        });
        
        if (journees.length > 0) {
          setExpandedJournees(new Set([journees[0]]));
        }
      }
    } catch (error) {
      console.error('Erreur chargement pronos:', error);
      setPronos([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fonction de scroll vers une journée
  const scrollToJournee = (journee) => {
    // Attendre que le DOM soit mis à jour (journée dépliée)
    setTimeout(() => {
      const element = journeeRefs.current[journee];
      if (element) {
        // Offset pour compenser les headers sticky
        const headerOffset = 200;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }, 100); // Petit délai pour laisser l'animation se terminer
  };

  // ✅ Toggle avec scroll
  const toggleJournee = (journee) => {
    setExpandedJournees(prev => {
      const newSet = new Set();
      const wasExpanded = prev.has(journee);
      
      // Si cette journée était déjà ouverte, on la ferme
      // Sinon, on ouvre uniquement celle-ci
      if (!wasExpanded) {
        newSet.add(journee);
        // ✅ Scroller vers la journée après ouverture
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

  // Grouper pronos par journée
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
            ref={el => journeeRefs.current[journee] = el}  // ✅ Ref pour scroll
            className="bg-white rounded-lg shadow-sm border border-rugby-gray overflow-hidden"
          >
            
            {/* En-tête cliquable */}
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

            {/* Pronos */}
            {isExpanded && (
              <div className="p-3 space-y-4">
                {pronosJournee.map(prono => (
                  <PronoCard key={prono.id} match={prono} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PronoCard({ match }) {
  const equipeDom = match.equipe_domicile || 'Équipe 1';
  const equipeExt = match.equipe_exterieure || 'Équipe 2';

  // Scores finaux
  const scoreDom = match.prono_ft?.domicile ?? 0;
  const scoreExt = match.prono_ft?.exterieur ?? 0;

  // Mi-temps
  const scoreHtDom = match.prono_ht?.domicile ?? null;
  const scoreHtExt = match.prono_ht?.exterieur ?? null;
  const scoreHtText = (scoreHtDom !== null && scoreHtExt !== null) 
    ? `${scoreHtDom} - ${scoreHtExt}` 
    : null;

  // Confiance FT
  const confianceFT = match.confiance_algo ?? match.confiance ?? 0;
  const confidencePct = Math.round(confianceFT);

  const [animatedWidth, setAnimatedWidth] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedWidth(confidencePct);
    }, 100);
    return () => clearTimeout(timer);
  }, [confidencePct]);

  // Confiance MT
  const confianceMT = match.confiance_mt_algo ?? 0;
  const confidenceMTPct = Math.round(confianceMT);

  const [animatedWidthMT, setAnimatedWidthMT] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedWidthMT(confidenceMTPct);
    }, 100);
    return () => clearTimeout(timer);
  }, [confidenceMTPct]);

  // ✅ FORMATAGE DATE ET HEURE
  let dateFormatted = 'À VENIR';
  let heureFormatted = '';
  
  if (match.date) {
    try {
      const matchDate = new Date(match.date);
      
      // Date au format "SAM. 27 DÉC. 2025"
      dateFormatted = matchDate.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).toUpperCase();
      
      // Heure au format "14H30"
      const hours = matchDate.getHours();
      const minutes = matchDate.getMinutes();
      
      // Vérifier si l'heure est définie (pas 00:00)
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

      {/* ✅ Date à gauche + Heure à droite */}
      <div className="flex justify-between items-center px-4 mb-3">
        <div className="text-xs text-rugby-bronze font-semibold">
          {dateFormatted}
        </div>
        {heureFormatted && (
          <div className="text-xs text-rugby-gold font-bold">
            {heureFormatted}
          </div>
        )}
      </div>

      {/* Équipes + scores */}
      <div className="grid grid-cols-3 items-start px-4 mb-2">

        {/* Équipe domicile */}
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

        {/* Scores */}
        <div className="flex flex-col items-center justify-center gap-1">
          <div className="text-xs text-rugby-bronze font-medium mb-1">Score final</div>
          <div className="flex items-center gap-2 text-3xl font-bold text-rugby-gold">
            {scoreDom} - {scoreExt}
          </div>

          {scoreHtText && (
            <>
              <div className="text-xs text-rugby-bronze font-medium mt-2">Score M-T</div>
              <div className="text-sm text-rugby-black font-semibold">{scoreHtText}</div>

              {/* Barre MT juste sous Score M-T */}
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

        {/* Équipe extérieure */}
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

        {/* Conteneur */}
        <div className="relative w-full bg-gray-200 rounded-full h-[7px]">

          {/* Graduations */}
          <div className="absolute top-0 left-1/4 w-px h-full bg-gray-300"></div>
          <div className="absolute top-0 left-1/2 w-px h-full bg-gray-300"></div>
          <div className="absolute top-0 left-3/4 w-px h-full bg-gray-300"></div>

          {/* Labels */}
          <div className="absolute -bottom-4 left-1/4 text-[10px] text-gray-500 transform -translate-x-1/2">25%</div>
          <div className="absolute -bottom-4 left-1/2 text-[10px] text-gray-500 transform -translate-x-1/2">50%</div>
          <div className="absolute -bottom-4 left-3/4 text-[10px] text-gray-500 transform -translate-x-1/2">75%</div>

          {/* Barre animée */}
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${animatedWidth}%`,
              background: 'linear-gradient(to right, #ef4444, #f59e0b, #22c55e)',
            }}
          />
        </div>
      </div>

    </div>
  );
}