// ============================================
// COMPOSANT : PartagePronostic
// Bouton « Partager » + génération d'une image du / des pronostic(s) d'un
// match, partagée via l'API native du téléphone.
//
// Au clic sur le bouton, l'utilisateur choisit le FORMAT :
//   - « Carte »  : visuel compact (320 px), idéal messagerie (WhatsApp, SMS).
//   - « Story »  : visuel vertical 9:16 (1080×1920), pensé pour les stories.
// Les deux formats partagent la même identité (3 chartes, mêmes blocs).
//
// API : `pronos` = tableau de 1 ou 2 pronostics. Un match Top 14 peut porter
//       un pari FT-niveau ET un pari MT-niveau -> carte fusionnée.
//       Chaque entrée : { betType, scoreDom, scoreExt, winnerPredit, algo }
//       avec `algo` = { scoreDom, scoreExt, confiance } | null.
// Les props « à plat » restent acceptées (rétrocompatibilité, un prono).
//
// Dépendance requise : npm install html-to-image
// ============================================
import { useRef, useState } from 'react';
import { Share2, Loader2, Image as ImageIcon, Smartphone } from 'lucide-react';
import { toPng } from 'html-to-image';
import { getTeamData } from '../utils/teams';

const CHARTE = {
  // Top 14 — charte or (#C9A84C / #FFD700) sur fond bleu nuit
  top14: { accent: '#C9A84C', accentVif: '#FFD700', label: 'TOP 14',
           fond1: '#1a2740', fond2: '#101a2e', fond3: '#0a111f' },
  // Pro D2 — charte bleu marine #00174D + argent #C0C0C0 + bleu clair #97C1FE
  prod2: { accent: '#C0C0C0', accentVif: '#97C1FE', label: 'PRO D2',
           fond1: '#0a2c66', fond2: '#00174D', fond3: '#000f33' },
  // Champions Cup — charte EPCR bleu #003E7E + or #FFC72C
  hcup:  { accent: '#FFC72C', accentVif: '#FFC72C', label: 'CHAMPIONS CUP',
           fond1: '#0a5099', fond2: '#003E7E', fond3: '#002a56' },
};

// Tailles de l'en-tête match selon le format de carte.
const TAILLES_ENTETE = {
  compact: { cercle: 56, logo: 42, initiale: 16, nom: 13, label: 13, labelMb: 18, vs: 14, col: 110 },
  story:   { cercle: 74, logo: 56, initiale: 21, nom: 15, label: 14, labelMb: 16, vs: 15, col: 132 },
};

function initiales(nom) {
  return (nom || '')
    .split(/\s+/).filter(Boolean).slice(0, 3)
    .map(m => m[0]).join('').toUpperCase();
}

// ---------------------------------------------------------------
// Prépare un pronostic (perso + algo) pour l'affichage.
// ---------------------------------------------------------------
function preparerProno(p, dataDom, dataExt, equipeDomicile, equipeExterieure) {
  const betType = p.betType || 'FT';
  const estPariVainqueur = betType === 'WINNER_FT' || betType === 'WINNER_MT';
  const estMiTemps = betType === 'MT' || betType === 'WINNER_MT';

  const nomEquipe = (key) => key === 'domicile'
    ? (dataDom?.name || equipeDomicile)
    : key === 'exterieur'
      ? (dataExt?.name || equipeExterieure)
      : 'Match nul';

  const algoSrc = p.algo && (p.algo.scoreDom != null || p.algo.scoreExt != null)
    ? p.algo : null;

  let nomVainqueurAlgo = 'Match nul';
  if (algoSrc && estPariVainqueur) {
    const k = algoSrc.scoreDom > algoSrc.scoreExt ? 'domicile'
      : algoSrc.scoreExt > algoSrc.scoreDom ? 'exterieur' : 'nul';
    nomVainqueurAlgo = nomEquipe(k);
  }

  return {
    betType, estPariVainqueur, estMiTemps,
    perso: {
      scoreDom: p.scoreDom, scoreExt: p.scoreExt,
      nomVainqueur: nomEquipe(p.winnerPredit),
    },
    algo: algoSrc
      ? { scoreDom: algoSrc.scoreDom, scoreExt: algoSrc.scoreExt,
          nomVainqueur: nomVainqueurAlgo, confiance: algoSrc.confiance }
      : null,
    legendeTemps: estMiTemps ? 'Mi-temps' : 'Temps réglementaire',
    legendeType: estPariVainqueur ? 'Vainqueur' : 'Score',
    legendeComplete: estPariVainqueur
      ? (estMiTemps ? 'Vainqueur à la mi-temps' : 'Vainqueur du match')
      : (estMiTemps ? 'Score à la mi-temps' : 'Score final'),
  };
}

// ---------------------------------------------------------------
// Une colonne de duel : un titre optionnel + un pronostic (score OU
// vainqueur) + un sous-titre optionnel.
// ---------------------------------------------------------------
function ColonneDuel({
  titre, couleurTitre, estPariVainqueur, nomVainqueur,
  scoreDom, scoreExt, sousTitre,
}) {
  return (
    <div style={{ flex: 1, textAlign: 'center', padding: '0 6px' }}>
      {titre && (
        <div style={{
          fontSize: '9px', fontWeight: 700, color: couleurTitre,
          letterSpacing: '0.3px', textTransform: 'uppercase', marginBottom: '7px',
        }}>
          {titre}
        </div>
      )}

      {estPariVainqueur ? (
        <div style={{
          fontSize: '14px', fontWeight: 700, color: '#ffffff', lineHeight: 1.2,
          minHeight: '34px', display: 'flex', alignItems: 'center',
          justifyContent: 'center',
        }}>
          {nomVainqueur}
        </div>
      ) : (
        <div style={{
          display: 'flex', alignItems: 'baseline', justifyContent: 'center',
          gap: '6px', minHeight: '34px',
        }}>
          <span style={{ fontSize: '26px', fontWeight: 700, color: '#ffffff' }}>
            {scoreDom ?? '–'}
          </span>
          <span style={{ fontSize: '14px', color: '#8Fa8c4' }}>–</span>
          <span style={{ fontSize: '26px', fontWeight: 700, color: '#ffffff' }}>
            {scoreExt ?? '–'}
          </span>
        </div>
      )}

      {sousTitre && (
        <div style={{ fontSize: '9px', color: '#8Fa8c4', marginTop: '4px' }}>
          {sousTitre}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------
// En-tête du match : libellé championnat + les deux équipes.
// Partagé entre la carte compacte et la story (tailles différentes).
// ---------------------------------------------------------------
function EnTeteMatch({
  charte, dataDom, dataExt, equipeDomicile, equipeExterieure, taille,
}) {
  const t = TAILLES_ENTETE[taille] || TAILLES_ENTETE.compact;
  return (
    <>
      <div style={{ textAlign: 'center', marginBottom: `${t.labelMb}px` }}>
        <span style={{
          fontSize: `${t.label}px`, fontWeight: 600, color: charte.accentVif,
          letterSpacing: '0.5px',
        }}>
          {charte.label}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ textAlign: 'center', width: `${t.col}px` }}>
          <div style={{
            width: `${t.cercle}px`, height: `${t.cercle}px`, borderRadius: '50%',
            background: '#ffffff', margin: '0 auto 8px', display: 'flex',
            alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
          }}>
            {dataDom?.logo
              ? <img src={dataDom.logo} alt="" style={{ width: `${t.logo}px`, height: `${t.logo}px`, objectFit: 'contain' }} />
              : <span style={{ fontSize: `${t.initiale}px`, fontWeight: 600, color: charte.fond2 }}>{initiales(equipeDomicile)}</span>}
          </div>
          <div style={{ fontSize: `${t.nom}px`, fontWeight: 600, color: '#ffffff', lineHeight: 1.25 }}>
            {dataDom?.name || equipeDomicile}
          </div>
        </div>

        <div style={{ fontSize: `${t.vs}px`, color: '#8Fa8c4', fontWeight: 600 }}>VS</div>

        <div style={{ textAlign: 'center', width: `${t.col}px` }}>
          <div style={{
            width: `${t.cercle}px`, height: `${t.cercle}px`, borderRadius: '50%',
            background: '#ffffff', margin: '0 auto 8px', display: 'flex',
            alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
          }}>
            {dataExt?.logo
              ? <img src={dataExt.logo} alt="" style={{ width: `${t.logo}px`, height: `${t.logo}px`, objectFit: 'contain' }} />
              : <span style={{ fontSize: `${t.initiale}px`, fontWeight: 600, color: charte.fond2 }}>{initiales(equipeExterieure)}</span>}
          </div>
          <div style={{ fontSize: `${t.nom}px`, fontWeight: 600, color: '#ffffff', lineHeight: 1.25 }}>
            {dataExt?.name || equipeExterieure}
          </div>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------
// Bloc pronostic : la boîte centrale (duel, fusion ou simple).
// Partagé entre la carte compacte et la story.
// ---------------------------------------------------------------
function BlocPronostic({ charte, liste, mode, confiance }) {
  const estMulti = liste.length > 1;
  const pr0 = liste[0];
  const estDuelSimple = !estMulti && !!pr0.algo;
  const titreBlocSimple = mode === 'algo'
    ? "LA PRÉDICTION DE L'IA" : 'MON PRONOSTIC';

  if (estMulti) {
    /* ---- Carte FUSIONNÉE : Temps réglementaire + Mi-temps ---- */
    return (
      <div style={{ background: charte.fond1, borderRadius: '12px', padding: '12px 10px' }}>
        {/* En-têtes de colonnes (une seule fois) */}
        <div style={{ display: 'flex', alignItems: 'stretch', marginBottom: '4px' }}>
          <div style={{
            flex: 1, textAlign: 'center', fontSize: '9px', fontWeight: 700,
            color: charte.accent, letterSpacing: '0.3px', textTransform: 'uppercase',
          }}>
            Prédiction de l'IA
          </div>
          <div style={{ width: '1px', background: charte.fond3 }} />
          <div style={{
            flex: 1, textAlign: 'center', fontSize: '9px', fontWeight: 700,
            color: charte.accentVif, letterSpacing: '0.3px', textTransform: 'uppercase',
          }}>
            Mon pronostic
          </div>
        </div>

        {liste.map((pr, i) => (
          <div key={i}>
            {i > 0 && (
              <div style={{ height: '1px', background: charte.fond3, margin: '8px 0' }} />
            )}
            <div style={{
              textAlign: 'center', fontSize: '9px', fontWeight: 700,
              color: '#8Fa8c4', letterSpacing: '0.4px', textTransform: 'uppercase',
              margin: '8px 0 6px',
            }}>
              {pr.legendeTemps} · {pr.legendeType}
            </div>
            <div style={{ display: 'flex', alignItems: 'stretch' }}>
              <ColonneDuel
                couleurTitre={charte.accent}
                estPariVainqueur={pr.estPariVainqueur}
                nomVainqueur={pr.algo ? pr.algo.nomVainqueur : '–'}
                scoreDom={pr.algo ? pr.algo.scoreDom : null}
                scoreExt={pr.algo ? pr.algo.scoreExt : null}
                sousTitre={pr.algo && pr.algo.confiance != null
                  ? `Confiance ${pr.algo.confiance}%` : null}
              />
              <div style={{ width: '1px', background: charte.fond3, margin: '2px 0' }} />
              <ColonneDuel
                couleurTitre={charte.accentVif}
                estPariVainqueur={pr.estPariVainqueur}
                nomVainqueur={pr.perso.nomVainqueur}
                scoreDom={pr.perso.scoreDom}
                scoreExt={pr.perso.scoreExt}
                sousTitre={null}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (estDuelSimple) {
    /* ---- Carte DUEL simple : Prédiction IA vs Mon pronostic ---- */
    return (
      <div style={{ background: charte.fond1, borderRadius: '12px', padding: '14px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'stretch' }}>
          <ColonneDuel
            titre="Prédiction de l'IA"
            couleurTitre={charte.accent}
            estPariVainqueur={pr0.estPariVainqueur}
            nomVainqueur={pr0.algo.nomVainqueur}
            scoreDom={pr0.algo.scoreDom}
            scoreExt={pr0.algo.scoreExt}
            sousTitre={pr0.algo.confiance != null
              ? `Confiance ${pr0.algo.confiance}%` : null}
          />
          <div style={{ width: '1px', background: charte.fond3, margin: '2px 0' }} />
          <ColonneDuel
            titre="Mon pronostic"
            couleurTitre={charte.accentVif}
            estPariVainqueur={pr0.estPariVainqueur}
            nomVainqueur={pr0.perso.nomVainqueur}
            scoreDom={pr0.perso.scoreDom}
            scoreExt={pr0.perso.scoreExt}
            sousTitre={null}
          />
        </div>
        <div style={{
          textAlign: 'center', fontSize: '10px', color: '#8Fa8c4',
          marginTop: '10px', paddingTop: '8px',
          borderTop: `1px solid ${charte.fond3}`,
        }}>
          {pr0.legendeComplete}
        </div>
      </div>
    );
  }

  /* ---- Carte SIMPLE : un seul bloc pronostic, sans algo ---- */
  return (
    <div style={{ background: charte.fond1, borderRadius: '12px', padding: '14px 16px' }}>
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: charte.accentVif }}>
          {titreBlocSimple}
        </span>
      </div>

      {pr0.estPariVainqueur ? (
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '22px', fontWeight: 700, color: '#ffffff' }}>
            {pr0.perso.nomVainqueur}
          </span>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '12px' }}>
          <span style={{ fontSize: '34px', fontWeight: 700, color: '#ffffff' }}>
            {pr0.perso.scoreDom ?? '–'}
          </span>
          <span style={{ fontSize: '18px', color: '#8Fa8c4' }}>–</span>
          <span style={{ fontSize: '34px', fontWeight: 700, color: '#ffffff' }}>
            {pr0.perso.scoreExt ?? '–'}
          </span>
        </div>
      )}

      <div style={{ textAlign: 'center', fontSize: '11px', color: '#8Fa8c4', marginTop: '4px' }}>
        {mode === 'algo' && confiance != null
          ? `Indice de confiance ${confiance}%`
          : pr0.legendeComplete}
      </div>
    </div>
  );
}

export default function PartagePronostic({
  // Données du match
  equipeDomicile,
  equipeExterieure,
  championnat = 'top14',
  // Pronostics (API recommandée) — tableau de 1 ou 2 entrées
  pronos = null,
  // Props « à plat » — rétrocompatibilité (un seul prono)
  mode = 'perso',
  scoreDom = null,
  scoreExt = null,
  betType = 'FT',
  winnerPredit = null,
  confiance = null,
  algo = null,
}) {
  const carteRef = useRef(null);
  const storyRef = useRef(null);
  const [generation, setGeneration] = useState(null); // null | 'carte' | 'story'
  const [choixOuvert, setChoixOuvert] = useState(false);
  const [message, setMessage] = useState(null);

  const charte = CHARTE[championnat] || CHARTE.top14;

  // Garde-fou : sans les deux équipes, on n'affiche rien (évite tout crash)
  if (!equipeDomicile || !equipeExterieure) return null;

  const dataDom = getTeamData(equipeDomicile);
  const dataExt = getTeamData(equipeExterieure);

  // Liste normalisée des pronostics (1 ou 2).
  const listeBrute = (Array.isArray(pronos) && pronos.length > 0)
    ? pronos
    : [{ betType, scoreDom, scoreExt, winnerPredit, algo }];
  const liste = listeBrute.map(p =>
    preparerProno(p, dataDom, dataExt, equipeDomicile, equipeExterieure));

  const estMulti = liste.length > 1;
  const aDuel = estMulti || !!liste[0].algo;
  const labelBouton = estMulti ? 'Partager mes pronos' : 'Partager mon prono';

  const styleBouton = {
    color: charte.accent,
    border: `1px solid ${charte.accent}`,
  };

  const lancerPartage = async (format) => {
    if (generation) return;
    const node = format === 'story' ? storyRef.current : carteRef.current;
    if (!node) return;
    setGeneration(format);
    setMessage(null);
    try {
      const dataUrl = await toPng(node, {
        pixelRatio: format === 'story' ? 3 : 2, // story 360×640 -> 1080×1920
        cacheBust: true,
        backgroundColor: charte.fond2,
      });
      const blob = await (await fetch(dataUrl)).blob();

      const suffixe = format === 'story' ? '-story' : '';
      const nomFichier = `prono-${championnat}-${initiales(equipeDomicile)}-${initiales(equipeExterieure)}${suffixe}.png`;

      const fichier = new File([blob], nomFichier, { type: 'image/png' });
      const texte = aDuel
        ? `Mon prono face à l'IA — ${equipeDomicile} vs ${equipeExterieure}. Et toi, tu paries quoi ?`
        : `Mon prono ${equipeDomicile} vs ${equipeExterieure} sur Top14 Pronos. Et toi, tu paries quoi ?`;

      if (navigator.canShare && navigator.canShare({ files: [fichier] })) {
        await navigator.share({
          files: [fichier],
          title: 'Mon prono Top14 Pronos',
          text: texte,
        });
      } else {
        const lien = document.createElement('a');
        lien.href = dataUrl;
        lien.download = nomFichier;
        lien.click();
        setMessage('Image téléchargée.');
      }
    } catch (e) {
      if (e && e.name !== 'AbortError') {
        setMessage("Le partage n'a pas pu aboutir.");
      }
    } finally {
      setGeneration(null);
      setChoixOuvert(false);
    }
  };

  return (
    <>
      {/* Bouton + choix du format */}
      <div className="flex flex-col items-center mt-3">
        {!choixOuvert ? (
          <button
            onClick={() => { setMessage(null); setChoixOuvert(true); }}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
            style={styleBouton}
          >
            <Share2 className="w-3.5 h-3.5" />
            {labelBouton}
          </button>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] text-gray-400 font-medium">Choisir un format</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => lancerPartage('carte')}
                disabled={!!generation}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-colors disabled:opacity-60"
                style={styleBouton}
              >
                {generation === 'carte'
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <ImageIcon className="w-3.5 h-3.5" />}
                Carte
              </button>
              <button
                onClick={() => lancerPartage('story')}
                disabled={!!generation}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-colors disabled:opacity-60"
                style={styleBouton}
              >
                {generation === 'story'
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Smartphone className="w-3.5 h-3.5" />}
                Story
              </button>
            </div>
            {!generation && (
              <button
                onClick={() => setChoixOuvert(false)}
                className="text-[10px] text-gray-400 underline"
              >
                Annuler
              </button>
            )}
          </div>
        )}
        {message && (
          <p className="text-[10px] text-gray-400 mt-1">{message}</p>
        )}
      </div>

      {/* Visuels à capturer — rendus hors écran */}
      <div
        style={{ position: 'absolute', left: '-9999px', top: 0, pointerEvents: 'none' }}
        aria-hidden="true"
      >
        {/* ---- FORMAT CARTE (compact 320 px) ---- */}
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
          <div style={{
            background: `linear-gradient(160deg, ${charte.fond1} 0%, ${charte.fond2} 60%, ${charte.fond3} 100%)`,
            padding: '20px 20px 24px',
          }}>
            <EnTeteMatch
              charte={charte}
              dataDom={dataDom}
              dataExt={dataExt}
              equipeDomicile={equipeDomicile}
              equipeExterieure={equipeExterieure}
              taille="compact"
            />
          </div>

          <div style={{ background: charte.fond2, padding: '4px 20px 20px' }}>
            <BlocPronostic charte={charte} liste={liste} mode={mode} confiance={confiance} />
            <div style={{ textAlign: 'center', fontSize: '12px', color: '#8Fa8c4', marginTop: '12px' }}>
              Et toi, tu paries quoi ?
            </div>
          </div>

          <div style={{ background: charte.fond3, padding: '12px 20px', textAlign: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>Top14 Pronos</span>
            <span style={{ fontSize: '11px', color: '#8Fa8c4' }}>{' · '}app.top14pronos.fr</span>
          </div>
        </div>

        {/* ---- FORMAT STORY (vertical 9:16, 360×640 -> 1080×1920) ---- */}
        <div
          ref={storyRef}
          style={{
            width: '360px',
            height: '640px',
            boxSizing: 'border-box',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            background: `linear-gradient(180deg, ${charte.fond1} 0%, ${charte.fond2} 48%, ${charte.fond3} 100%)`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '38px 26px 30px',
          }}
        >
          {/* Haut : championnat + équipes */}
          <div>
            <EnTeteMatch
              charte={charte}
              dataDom={dataDom}
              dataExt={dataExt}
              equipeDomicile={equipeDomicile}
              equipeExterieure={equipeExterieure}
              taille="story"
            />
          </div>

          {/* Milieu : bloc pronostic + accroche */}
          <div>
            <BlocPronostic charte={charte} liste={liste} mode={mode} confiance={confiance} />
            <div style={{
              textAlign: 'center', fontSize: '13px', fontWeight: 600,
              color: charte.accentVif, marginTop: '18px',
            }}>
              Et toi, tu paries quoi ?
            </div>
          </div>

          {/* Bas : branding */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '17px', fontWeight: 700, color: '#ffffff' }}>Top14 Pronos</div>
            <div style={{ fontSize: '11px', color: '#8Fa8c4', marginTop: '3px', letterSpacing: '0.3px' }}>
              app.top14pronos.fr
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
