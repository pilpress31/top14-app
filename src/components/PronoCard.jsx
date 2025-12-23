import { useEffect, useState } from 'react';
import { getTeamData } from '../utils/teams';

function PronoCard({ match }) {
  const equipeDom = match.equipe_domicile || 'Équipe 1';
  const equipeExt = match.equipe_exterieure || 'Équipe 2';

  // ✅ Scores finaux - CORRIGÉ pour utiliser prono_ft
  const scoreDom = match.prono_ft?.domicile ?? 0;
  const scoreExt = match.prono_ft?.exterieur ?? 0;
  const scoreFinalText = `${scoreDom} - ${scoreExt}`;

  // ✅ Mi-temps - CORRIGÉ pour utiliser prono_ht
  const scoreHtDom = match.prono_ht?.domicile ?? null;
  const scoreHtExt = match.prono_ht?.exterieur ?? null;
  const scoreHtText = (scoreHtDom !== null && scoreHtExt !== null) 
    ? `${scoreHtDom} - ${scoreHtExt}` 
    : null;

  const confianceFT = match.confiance_algo ?? match.confiance ?? 0;
  const confidencePct = Math.round(confianceFT);

  const confianceMT = match.confiance_mt_algo ?? 0;
  const confidenceMTPct = Math.round(confianceMT);



  const journee = match.journee ? `JOURNÉE ${match.journee}` : '';

  const date = match.date
    ? new Date(match.date).toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).toUpperCase()
    : 'À VENIR';

  const [animatedWidth, setAnimatedWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedWidth(confidencePct);
    }, 100);
    return () => clearTimeout(timer);
  }, [confidencePct]);


  const [animatedWidthMT, setAnimatedWidthMT] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedWidthMT(confidenceMTPct);
    }, 100);
    return () => clearTimeout(timer);
  }, [confidenceMTPct]);





  console.log("animatedWidth =", animatedWidth, "confidencePct =", confidencePct);

  const teamDomData = getTeamData(equipeDom);
  const teamExtData = getTeamData(equipeExt);
  console.log("DEBUG PRONO CARD", match);
  return (
    <div className="w-full bg-white rounded-none shadow-sm hover:shadow-md transition-shadow py-4 mb-4 border-t border-b border-gray-200">
      {/* Ligne entête */}
      <div className="flex justify-between items-center px-2 mb-3">
        <div className="text-xs text-rugby-orange font-bold uppercase tracking-wide">
          {journee}
        </div>
        <div className="text-xs text-gray-700 font-semibold">
          {date}
        </div>
      </div>

      {/* Équipes + scores */}
      <div className="grid grid-cols-3 items-start px-2 mb-2">
        {/* Équipe domicile */}
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-1">
            <img
              src={teamDomData.logo}
              alt={teamDomData.name}
              className="w-10 h-10 object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
          <div className="text-sm font-medium text-gray-800 leading-tight break-words line-clamp-2">
            {equipeDom}
          </div>
        </div>

        {/* Scores */}
        <div className="flex flex-col items-center justify-center gap-1">
          <div className="flex items-center gap-2 text-2xl font-semibold text-rugby-orange">
            {scoreFinalText}
          </div>
          {scoreHtText && (
            <div className="text-xs text-gray-600">
              MT&nbsp;:&nbsp;<span className="font-medium">{scoreHtText}</span>
            </div>
          )}
        </div>

        {/* Équipe extérieure */}
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-1">
            <img
              src={teamExtData.logo}
              alt={teamExtData.name}
              className="w-10 h-10 object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
          <div className="text-sm font-medium text-gray-800 leading-tight break-words line-clamp-2">
            {equipeExt}
          </div>
        </div>
      </div>

      {/* Barre de confiance */}
      <div className="mt-2 px-2">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Confiance</span>
          <span className="font-semibold">{confidencePct}%</span>
        </div>

        <div className="relative w-full bg-gray-200 rounded-full h-2">
          <div className="absolute top-0 left-1/4 w-px h-2 bg-gray-300"></div>
          <div className="absolute top-0 left-1/2 w-px h-2 bg-gray-300"></div>
          <div className="absolute top-0 left-3/4 w-px h-2 bg-gray-300"></div>

          <div className="absolute -bottom-3 left-1/4 text-[9px] text-gray-400">25%</div>
          <div className="absolute -bottom-3 left-1/2 text-[9px] text-gray-400">50%</div>
          <div className="absolute -bottom-3 left-3/4 text-[9px] text-gray-400">75%</div>

          <div
            className="h-2 rounded-full transition-all duration-700 ease-out"
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

export default PronoCard;
