import { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import axios from 'axios';
import { getTeamData } from '../utils/teams';

export default function AlgoPronosTab({ onMatchClick }) {
  const [pronos, setPronos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedJournees, setExpandedJournees] = useState(new Set());
  
  const journeeRefs = useRef({});

  useEffect(() => {
    loadPronos();
  }, []);

  const loadPronos = async () => {
    try {
      const response = await axios.get('https://top14-api-production.up.railway.app/api/pronos');
      const pronosData = response.data.pronos || response.data || [];
      setPronos(pronosData);
      
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

  const scrollToJournee = (journee) => {
    setTimeout(() => {
      const element = journeeRefs.current[journee];
      if (element) {
        const headerOffset = 200;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }, 100);
  };

  const toggleJournee = (journee) => {
    setExpandedJournees(prev => {
      const newSet = new Set();
      const wasExpanded = prev.has(journee);
      
      if (!wasExpanded) {
        newSet.add(journee);
        scrollToJournee(journee);
      }
      
      return newSet;
    });
  };

  const handleMatchClick = (prono) => {
    if (onMatchClick) {
      onMatchClick({
        id: prono.id,
        match_id: prono.id,
        journee: prono.journee,
        equipe_domicile: prono.equipe_domicile,
        equipe_exterieure: prono.equipe_exterieure,
        date: prono.date
      });
    }
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
                {pronosJournee.map(prono => (
                  <PronoCard 
                    key={prono.id} 
                    match={prono} 
                    onClick={() => handleMatchClick(prono)}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PronoCard({ match, onClick }) {
  const equipeDom = match.equipe_domicile || 'Équipe 1';
  const equipeExt = match.equipe_exterieure || 'Équipe 2';

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
    const timer = setTimeout(() => {
      setAnimatedWidth(confidencePct);
    }, 100);
    return () => clearTimeout(timer);
  }, [confidencePct]);

  const confianceMT = match.confiance_mt_algo ?? 0;
  const confidenceMTPct = Math.round(confianceMT);

  const [animatedWidthMT, setAnimatedWidthMT] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedWidthMT(confidenceMTPct);
    }, 100);
    return () => clearTimeout(timer);
  }, [confidenceMTPct]);

  let dateFormatted = 'À VENIR';
  let heureFormatted = '';
  
  if (match.date) {
    try {
      const matchDate = new Date(match.date);
      
      dateFormatted = matchDate.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
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
    <div 
      onClick={onClick}
      className="w-full bg-gray-50 rounded-lg py-4 border border-gray-200 cursor-pointer hover:shadow-lg hover:border-rugby-gold transition-all"
    >

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

    </div>
  );
}