// ============================================
// COMPOSANT : Rubrique « Pourquoi ce pronostic ? »
// Décompose la prédiction de l'algo en facteurs lisibles.
// Étape 1 : Top 14 uniquement (endpoint /api/explication/top14).
//
// Cadrage honnête : les facteurs et la largeur des barres ÉCLAIRENT
// la prédiction — ce ne sont pas les variables internes de l'algo VBA.
// Le libellé « Pourquoi ce pronostic ? » est volontairement prudent.
// ============================================
import { useState } from 'react';
import axios from 'axios';
import {
  Lightbulb, Trophy, Flame, Home, Shield, Swords,
  ChevronDown, ChevronUp, Loader2,
} from 'lucide-react';
import RubriqueHeader, { RUBRIQUE_THEMES } from './RubriqueHeader';

const API_BASE = 'https://top14-api-production.up.railway.app';

// Icône lucide-react par clé de facteur (renvoyée par le backend)
const ICONES_FACTEUR = {
  classement: Trophy,
  forme: Flame,
  attaque: Trophy,
  terrain: Home,
  defense: Shield,
  face_a_face: Swords,
};

// Une pastille de forme (V / D / N)
function PastilleForme({ resultat }) {
  const styles = {
    V: { bg: '#dcfce7', color: '#15803d' },
    D: { bg: '#fee2e2', color: '#b91c1c' },
    N: { bg: '#f3f4f6', color: '#6b7280' },
  };
  const s = styles[resultat] || styles.N;
  return (
    <span
      className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold"
      style={{ backgroundColor: s.bg, color: s.color }}
    >
      {resultat}
    </span>
  );
}

// Une ligne de facteur : libellé + verdict + barre comparative dom/ext
function LigneFacteur({ facteur, theme }) {
  const Icone = ICONES_FACTEUR[facteur.cle] || Trophy;
  const part = Math.max(0, Math.min(100, facteur.partDom ?? 50));

  // Couleur du verdict : accent du championnat si tranché, gris si neutre
  const couleurVerdict = facteur.gagnant === 'nul' ? '#9ca3af' : theme.accent;

  return (
    <div className="mb-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icone className="w-3.5 h-3.5 text-gray-500" />
        <span className="text-xs font-medium text-gray-700">{facteur.label}</span>
        <span
          className="text-[10px] ml-auto"
          style={{ color: couleurVerdict }}
        >
          {facteur.texte}
        </span>
      </div>

      {/* Détail forme : pastilles V/D/N si le facteur en fournit */}
      {facteur.cle === 'forme' && (facteur.formeDom || facteur.formeExt) && (
        <div className="flex items-center justify-between mb-1">
          <div className="flex gap-0.5">
            {(facteur.formeDom || []).map((r, i) => (
              <PastilleForme key={`d${i}`} resultat={r} />
            ))}
          </div>
          <div className="flex gap-0.5">
            {(facteur.formeExt || []).map((r, i) => (
              <PastilleForme key={`e${i}`} resultat={r} />
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <span className="text-[10px] text-gray-400" style={{ width: 64 }}>
          {facteur.valeurDom}
        </span>
        <div
          className="flex-1 flex h-[7px] rounded-full overflow-hidden"
          style={{ backgroundColor: '#F1EFE8' }}
        >
          <div style={{ width: `${part}%`, backgroundColor: theme.accent }} />
        </div>
        <span
          className="text-[10px] text-gray-400 text-right"
          style={{ width: 64 }}
        >
          {facteur.valeurExt}
        </span>
      </div>
    </div>
  );
}

export default function PourquoiCePronostic({ match, isOpen, onToggle }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [voirPlus, setVoirPlus] = useState(false);

  const theme = RUBRIQUE_THEMES.top14;

  const handleToggle = async () => {
    onToggle();
    if (!isOpen && !data && !loading) {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          dom: match.equipe_domicile,
          ext: match.equipe_exterieure,
        });
        if (match.saison) params.set('saison', match.saison);
        const res = await axios.get(`${API_BASE}/api/explication/top14?${params}`);
        setData(res.data);
      } catch (e) {
        setError("Impossible de charger l'explication du pronostic.");
      } finally {
        setLoading(false);
      }
    }
  };

  const facteursPrincipaux = (data?.facteurs || []).filter(f => f.principal);
  const facteursSecondaires = (data?.facteurs || []).filter(f => !f.principal);

  // Conviction de l'algo : on affiche la confiance_algo — la MÊME mesure
  // que l'« Indice favori » de la carte, pour ne pas afficher deux
  // pourcentages différents pour un même match.
  const pred = data?.prediction;
  const confiancePct = pred?.confiance_algo != null
    ? Math.round(Number(pred.confiance_algo) <= 1
        ? Number(pred.confiance_algo) * 100
        : Number(pred.confiance_algo))
    : null;
  // Favori = équipe avec le meilleur score prédit
  const favori = (() => {
    const sp = pred?.score_predit;
    if (sp && sp.includes('-')) {
      const [d, e] = sp.split('-').map(s => parseInt(s.trim(), 10));
      if (!isNaN(d) && !isNaN(e)) {
        return d >= e ? match.equipe_domicile : match.equipe_exterieure;
      }
    }
    return match.equipe_domicile;
  })();

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      <RubriqueHeader
        theme={theme}
        icon={Lightbulb}
        label="Pourquoi ce pronostic ?"
        isOpen={isOpen}
        loading={loading}
        onToggle={handleToggle}
      />

      {isOpen && (
        <div className="mt-3">
          {error && (
            <p className="text-xs text-red-500 text-center py-2">{error}</p>
          )}
          {loading && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: theme.accent }} />
            </div>
          )}

          {data && !loading && (
            <>
              {/* Conviction de l'algo — même mesure que l'Indice favori de la carte */}
              {confiancePct != null && (
                <div className="mb-4">
                  <div className="text-center text-[11px] text-gray-500 mb-1">
                    L'algo penche pour
                  </div>
                  <div className="flex items-baseline justify-center gap-2 mb-2">
                    <span className="text-sm font-bold text-gray-800">
                      {favori}
                    </span>
                    <span
                      className="text-xl font-bold"
                      style={{ color: theme.accent }}
                    >
                      {confiancePct}%
                    </span>
                  </div>
                  <div
                    className="w-full rounded-full h-2.5 overflow-hidden"
                    style={{ backgroundColor: '#F1EFE8' }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${confiancePct}%`,
                        background: 'linear-gradient(to right, #ef4444, #f59e0b, #22c55e)',
                      }}
                    />
                  </div>
                  <div className="text-center text-[10px] text-gray-400 mt-1">
                    Indice de confiance de l'algo
                  </div>
                </div>
              )}

              {/* Scores prédits */}
              {(pred?.score_predit || pred?.score_predit_mt) && (
                <div className="flex justify-center gap-2.5 mb-4">
                  {pred.score_predit && (
                    <div className="bg-gray-50 rounded-lg px-3.5 py-2 text-center">
                      <div className="text-[10px] text-gray-500">Score prédit</div>
                      <div className="text-sm font-bold text-gray-800">
                        {pred.score_predit}
                      </div>
                    </div>
                  )}
                  {pred.score_predit_mt && (
                    <div className="bg-gray-50 rounded-lg px-3.5 py-2 text-center">
                      <div className="text-[10px] text-gray-500">À la mi-temps</div>
                      <div className="text-sm font-bold text-gray-800">
                        {pred.score_predit_mt}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Facteurs principaux */}
              <div className="text-[11px] font-semibold text-gray-500 mb-2">
                LES FACTEURS
              </div>
              {facteursPrincipaux.map(f => (
                <LigneFacteur key={f.cle} facteur={f} theme={theme} />
              ))}

              {/* Facteurs secondaires — repliés derrière « voir plus » */}
              {facteursSecondaires.length > 0 && (
                <>
                  {voirPlus && facteursSecondaires.map(f => (
                    <LigneFacteur key={f.cle} facteur={f} theme={theme} />
                  ))}
                  <button
                    onClick={() => setVoirPlus(v => !v)}
                    className="w-full flex items-center justify-center gap-1 text-[11px] text-gray-500 py-1.5"
                  >
                    {voirPlus ? (
                      <>Voir moins <ChevronUp className="w-3 h-3" /></>
                    ) : (
                      <>Voir plus de facteurs <ChevronDown className="w-3 h-3" /></>
                    )}
                  </button>
                </>
              )}

              {/* Synthèse */}
              {data.synthese && (
                <div
                  className="rounded-lg px-3 py-2.5 mt-2"
                  style={{ backgroundColor: theme.bg }}
                >
                  <div
                    className="text-xs leading-relaxed"
                    style={{ color: theme.text }}
                  >
                    {data.synthese}
                  </div>
                </div>
              )}

              {/* Mention de transparence */}
              <p className="text-[9px] text-gray-400 text-center mt-2 leading-snug">
                Facteurs qui éclairent la prédiction — indices convergents,
                non le calcul interne de l'algo.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
