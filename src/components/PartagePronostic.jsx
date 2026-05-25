// ============================================
// COMPOSANT : PartagePronostic
// Bouton « Partager mon prono » + génération d'une image (carte) du
// pronostic, partagée via l'API native du téléphone.
//
// Deux modes :
//   mode="perso" (défaut) : carte « Mon pronostic » — page Paris
//   mode="algo"           : carte « La prédiction de l'IA » — réservé V1.1
//
// Dépendance requise : npm install html-to-image
// ============================================
import { useRef, useState } from 'react';
import { Share2, Loader2 } from 'lucide-react';
import { toPng } from 'html-to-image';
import { getTeamData } from '../utils/teams';

const CHARTE = {
  top14: { accent: '#CBA135', label: 'TOP 14',        fond1: '#143a6b', fond2: '#0C2340', fond3: '#07182e' },
  prod2: { accent: '#97C1FE', label: 'PRO D2',        fond1: '#0a2c66', fond2: '#00174D', fond3: '#000f33' },
  hcup:  { accent: '#FFC72C', label: 'CHAMPIONS CUP', fond1: '#0a5099', fond2: '#003E7E', fond3: '#002a56' },
};

function initiales(nom) {
  return (nom || '')
    .split(/\s+/).filter(Boolean).slice(0, 3)
    .map(m => m[0]).join('').toUpperCase();
}

export default function PartagePronostic({
  // Données du match
  equipeDomicile,
  equipeExterieure,
  championnat = 'top14',
  // Pronostic à afficher
  mode = 'perso',          // 'perso' | 'algo'
  scoreDom = null,         // pari de score
  scoreExt = null,
  betType = 'FT',          // 'FT' | 'MT' | 'WINNER_FT' | 'WINNER_MT'
  winnerPredit = null,     // pari de vainqueur : 'domicile' | 'exterieur' | 'nul'
  confiance = null,        // mode algo uniquement
}) {
  const carteRef = useRef(null);
  const [generation, setGeneration] = useState(false);
  const [message, setMessage] = useState(null);

  const charte = CHARTE[championnat] || CHARTE.top14;

  // Garde-fou : sans les deux équipes, on n'affiche rien (évite tout crash)
  if (!equipeDomicile || !equipeExterieure) return null;

  const dataDom = getTeamData(equipeDomicile);
  const dataExt = getTeamData(equipeExterieure);

  const estPariVainqueur = betType === 'WINNER_FT' || betType === 'WINNER_MT';
  const estMiTemps = betType === 'MT' || betType === 'WINNER_MT';

  // Libellé du vainqueur prédit (pari de type vainqueur)
  const nomVainqueur = winnerPredit === 'domicile'
    ? (dataDom?.name || equipeDomicile)
    : winnerPredit === 'exterieur'
      ? (dataExt?.name || equipeExterieure)
      : 'Match nul';

  const titreBloc = mode === 'algo' ? "LA PRÉDICTION DE L'IA" : 'MON PRONOSTIC';

  const handlePartage = async () => {
    if (!carteRef.current || generation) return;
    setGeneration(true);
    setMessage(null);
    try {
      const dataUrl = await toPng(carteRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: charte.fond2,
      });
      const blob = await (await fetch(dataUrl)).blob();
      const fichier = new File([blob], 'mon-prono.png', { type: 'image/png' });
      const texte = `Mon prono ${equipeDomicile} vs ${equipeExterieure} sur Top14 Pronos. Et toi, tu paries quoi ?`;

      if (navigator.canShare && navigator.canShare({ files: [fichier] })) {
        await navigator.share({
          files: [fichier],
          title: 'Mon prono Top14 Pronos',
          text: texte,
        });
      } else {
        const lien = document.createElement('a');
        lien.href = dataUrl;
        lien.download = 'mon-prono.png';
        lien.click();
        setMessage('Image téléchargée.');
      }
    } catch (e) {
      if (e && e.name !== 'AbortError') {
        setMessage("Le partage n'a pas pu aboutir.");
      }
    } finally {
      setGeneration(false);
    }
  };

  return (
    <>
      <div className="flex flex-col items-center mt-3">
        <button
          onClick={handlePartage}
          disabled={generation}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
          style={{ color: charte.accent, border: `1px solid ${charte.accent}` }}
        >
          {generation
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <Share2 className="w-3.5 h-3.5" />}
          {generation ? 'Génération…' : 'Partager mon prono'}
        </button>
        {message && (
          <p className="text-[10px] text-gray-400 mt-1">{message}</p>
        )}
      </div>

      {/* Carte à capturer — rendue hors écran */}
      <div
        style={{ position: 'absolute', left: '-9999px', top: 0, pointerEvents: 'none' }}
        aria-hidden="true"
      >
        <div
          ref={carteRef}
          style={{
            width: '320px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            background: charte.fond2,
            borderRadius: '18px',
            overflow: 'hidden',
          }}
        >
          {/* Bandeau ambiance match */}
          <div style={{
            background: `linear-gradient(160deg, ${charte.fond1} 0%, ${charte.fond2} 60%, ${charte.fond3} 100%)`,
            padding: '20px 20px 24px',
          }}>
            <div style={{ textAlign: 'center', marginBottom: '18px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: charte.accent, letterSpacing: '0.5px' }}>
                {charte.label}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ textAlign: 'center', width: '110px' }}>
                <div style={{
                  width: '56px', height: '56px', borderRadius: '50%', background: '#ffffff',
                  margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden',
                }}>
                  {dataDom?.logo
                    ? <img src={dataDom.logo} alt="" style={{ width: '42px', height: '42px', objectFit: 'contain' }} />
                    : <span style={{ fontSize: '16px', fontWeight: 600, color: charte.fond2 }}>{initiales(equipeDomicile)}</span>}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', lineHeight: 1.25 }}>
                  {dataDom?.name || equipeDomicile}
                </div>
              </div>

              <div style={{ fontSize: '14px', color: '#8Fa8c4', fontWeight: 600 }}>VS</div>

              <div style={{ textAlign: 'center', width: '110px' }}>
                <div style={{
                  width: '56px', height: '56px', borderRadius: '50%', background: '#ffffff',
                  margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden',
                }}>
                  {dataExt?.logo
                    ? <img src={dataExt.logo} alt="" style={{ width: '42px', height: '42px', objectFit: 'contain' }} />
                    : <span style={{ fontSize: '16px', fontWeight: 600, color: charte.fond2 }}>{initiales(equipeExterieure)}</span>}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', lineHeight: 1.25 }}>
                  {dataExt?.name || equipeExterieure}
                </div>
              </div>
            </div>
          </div>

          {/* Bloc pronostic */}
          <div style={{ background: charte.fond2, padding: '4px 20px 20px' }}>
            <div style={{ background: charte.fond1, borderRadius: '12px', padding: '14px 16px' }}>
              <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: charte.accent }}>
                  {titreBloc}
                </span>
              </div>

              {estPariVainqueur ? (
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '22px', fontWeight: 700, color: '#ffffff' }}>
                    {nomVainqueur}
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '34px', fontWeight: 700, color: '#ffffff' }}>
                    {scoreDom ?? '–'}
                  </span>
                  <span style={{ fontSize: '18px', color: '#8Fa8c4' }}>–</span>
                  <span style={{ fontSize: '34px', fontWeight: 700, color: '#ffffff' }}>
                    {scoreExt ?? '–'}
                  </span>
                </div>
              )}

              <div style={{ textAlign: 'center', fontSize: '11px', color: '#8Fa8c4', marginTop: '4px' }}>
                {mode === 'algo' && confiance != null
                  ? `Indice de confiance ${confiance}%`
                  : estPariVainqueur
                    ? (estMiTemps ? 'Vainqueur à la mi-temps' : 'Vainqueur prédit')
                    : (estMiTemps ? 'Score à la mi-temps' : 'Score final')}
              </div>
            </div>

            <div style={{ textAlign: 'center', fontSize: '12px', color: '#8Fa8c4', marginTop: '12px' }}>
              Et toi, tu paries quoi ?
            </div>
          </div>

          {/* Branding */}
          <div style={{ background: charte.fond3, padding: '12px 20px', textAlign: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>Top14 Pronos</span>
            <span style={{ fontSize: '11px', color: '#8Fa8c4' }}>{' · '}app.top14pronos.fr</span>
          </div>
        </div>
      </div>
    </>
  );
}
