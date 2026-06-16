// ─────────────────────────────────────────────────────────────
// src/constants/chartes.js
// SOURCE UNIQUE DE VÉRITÉ des chartes couleurs par championnat.
//
// Les couleurs d'identité sont déclarées une seule fois (constantes
// primaires ci-dessous), puis composées dans les vues par usage :
//   label    : libellé affiché ('TOP 14' / 'PRO D2' / 'CHAMPIONS CUP' / 'RUGBY INTERNATIONAL')
//   rubrique : en-têtes d'accordéon { bg, border, text, accent }
//              (consommé via RUBRIQUE_THEMES, réexporté par RubriqueHeader)
//   partage  : visuel story sur fond sombre { accent, accentVif, fond1, fond2, fond3 }
//   base     : couleurs d'identité brutes (Palmarès, en-têtes…)
//   header   : fond + bordure des en-têtes de page (D2 / HCup / MONDE ;
//              le Top 14 utilise un dégradé Tailwind en className)
//   modal    : thème de StatsAlgoModal { primary, accent, onPrimary }
//
// ⚠️ Le Top 14 a TROIS nuances d'or qui coexistent (à harmoniser un jour) :
//      #CBA135 = rugby-gold (UI/rubriques, cf. tailwind.config.js)
//      #C9A84C = accent du visuel de partage / modal
//      #D4AF37 = or du Palmarès
// ─────────────────────────────────────────────────────────────

// ── Couleurs primaires (déclarées une seule fois) ──
// Top 14
const T14_OR_UI       = '#CBA135'; // rugby-gold (Tailwind) — UI / rubriques
const T14_OR_PARTAGE  = '#C9A84C'; // accent du partage / modal
const T14_OR_VIF      = '#FFD700'; // or vif (accentVif partage + modal accent)
const T14_OR_PAL      = '#D4AF37'; // or du Palmarès
const T14_OR_PAL_DARK = '#A88829';
const T14_OR_PAL_LIGHT= '#FFF8E7';
// Pro D2
const D2_NAVY   = '#00174D';
const D2_SILVER = '#C0C0C0';
const D2_BLUE   = '#97C1FE';
// Champions Cup (EPCR)
const HCUP_BLEU       = '#003E7E';
const HCUP_BLEU_FONCE = '#002857';
const HCUP_OR         = '#FFC72C';
// Rugby International (MONDE)
const MONDE_VERT       = '#0B6E4F'; // vert émeraude profond — couleur principale
const MONDE_VERT_FONCE = '#064E3B';
const MONDE_EMERAUDE   = '#34D399'; // accent émeraude

const BLANC = '#FFFFFF';

export const CHARTES = {
  top14: {
    label: 'TOP 14',
    icon: '🏆',
    reprise: { rule: 'first-sat-sep' },
    rubrique: { bg: '#FAF6EB', border: '#E4D29A', text: '#8C6D3A', accent: T14_OR_UI },
    partage:  { accent: T14_OR_PARTAGE, accentVif: T14_OR_VIF,
                fond1: '#1a2740', fond2: '#101a2e', fond3: '#0a111f' },
    base:     { gold: T14_OR_PAL, goldDark: T14_OR_PAL_DARK, goldLight: T14_OR_PAL_LIGHT },
    modal:    { primary: T14_OR_PARTAGE, accent: T14_OR_VIF, onPrimary: BLANC },
    // header : pas de fond inline (le Top 14 utilise un dégradé Tailwind en className)
  },
  prod2: {
    label: 'PRO D2',
    icon: '🥈',
    reprise: { rule: 'last-fri-aug' },
    rubrique: { bg: '#EEF2FF', border: D2_BLUE, text: D2_NAVY, accent: D2_BLUE },
    partage:  { accent: D2_SILVER, accentVif: D2_BLUE,
                fond1: '#0a2c66', fond2: D2_NAVY, fond3: '#000f33' },
    base:     { navy: D2_NAVY, silver: D2_SILVER, blue: D2_BLUE },
    header:   { fond: 'linear-gradient(to right, #FFFFFF, #FFFFFF, #F0F4FA, #97C1FE33)',
                bordure: D2_NAVY },
    modal:    { primary: D2_NAVY, accent: D2_BLUE, onPrimary: BLANC },
  },
  hcup: {
    label: 'CHAMPIONS CUP',
    icon: '⭐',
    reprise: { date: null, libelle: 'décembre 2026' },
    rubrique: { bg: '#EEF5FF', border: '#B0CFE8', text: HCUP_BLEU, accent: HCUP_OR },
    partage:  { accent: HCUP_OR, accentVif: HCUP_OR,
                fond1: '#0a5099', fond2: HCUP_BLEU, fond3: '#002a56' },
    base:     { bleu: HCUP_BLEU, bleuFonce: HCUP_BLEU_FONCE, or: HCUP_OR },
    header:   { fond: 'linear-gradient(to right, #FFFFFF, #FFFFFF, #FFF9E6, #FFC72C33)',
                bordure: HCUP_BLEU },
    modal:    { primary: HCUP_BLEU, accent: HCUP_OR, onPrimary: BLANC },
  },
  monde: {
    label: 'RUGBY INTERNATIONAL',
    icon: '🌍',
    reprise: { date: null, libelle: null },
    rubrique: { bg: '#ECFDF5', border: '#A7F3D0', text: MONDE_VERT, accent: MONDE_EMERAUDE },
    partage:  { accent: MONDE_EMERAUDE, accentVif: MONDE_EMERAUDE,
                fond1: '#065F46', fond2: MONDE_VERT_FONCE, fond3: '#022C22' },
    base:     { vert: MONDE_VERT, vertFonce: MONDE_VERT_FONCE, emeraude: MONDE_EMERAUDE },
    header:   { fond: 'linear-gradient(to right, #FFFFFF, #FFFFFF, #ECFDF5, #34D39933)',
                bordure: MONDE_VERT },
    modal:    { primary: MONDE_VERT, accent: MONDE_EMERAUDE, onPrimary: BLANC },
  },
};

// Accès à une charte avec repli sur le Top 14 pour tout championnat inconnu.
export const getCharte = (championnat) => CHARTES[championnat] || CHARTES.top14;

// ── Reprise hors-saison (états vides Pronos / Paris) ──────────────────
// Auto-recalculé chaque année, AUCUNE maj manuelle :
//   • rule    → date approximative recomputée chaque saison
//               (Top 14 = 1er samedi de septembre ; Pro D2 = dernier vendredi d'août,
//                colle au calendrier LNR à 2-3 jours près) ;
//   • date    → ISO 'YYYY-MM-DD' (optionnel) : écrase la règle pour figer une date exacte ;
//   • libelle → repli texte simple (ex. CCUP « décembre 2026 »).
function _nthWeekday(year, month0, weekday, nth) {
  if (nth === 'last') {
    const d = new Date(year, month0 + 1, 0);
    d.setDate(d.getDate() - ((d.getDay() - weekday + 7) % 7));
    return d;
  }
  const d = new Date(year, month0, 1);
  d.setDate(1 + ((weekday - d.getDay() + 7) % 7) + (nth - 1) * 7);
  return d;
}
function _dateDeReprise(rule, year) {
  switch (rule) {
    case 'first-sat-sep': return _nthWeekday(year, 8, 6, 1);     // Top 14 : 1er samedi de septembre
    case 'last-fri-aug':  return _nthWeekday(year, 7, 5, 'last'); // Pro D2 : dernier vendredi d'août
    case 'first-sat-dec': return _nthWeekday(year, 11, 6, 1);    // (réserve)
    default: return null;
  }
}
export function texteReprise(championnat) {
  const r = getCharte(championnat).reprise || {};
  const now = new Date();
  const fmt = (d) => {
    const dateFmt = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    const jours = Math.ceil((d.getTime() - now.getTime()) / 86400000);
    return { dateFmt, jours };
  };
  if (r.date) {
    const d = new Date(r.date + 'T00:00:00');
    if (!isNaN(d.getTime())) {
      const { dateFmt, jours } = fmt(d);
      return jours > 0 ? `Revenez le ${dateFmt} (dans ${jours} jour${jours > 1 ? 's' : ''}).` : `Revenez le ${dateFmt}.`;
    }
  }
  if (r.rule) {
    let d = _dateDeReprise(r.rule, now.getFullYear());
    if (d && d.getTime() < now.getTime()) d = _dateDeReprise(r.rule, now.getFullYear() + 1);
    if (d) {
      const { dateFmt, jours } = fmt(d);
      return jours > 0 ? `Reprise prévue le ${dateFmt} (dans ${jours} jour${jours > 1 ? 's' : ''}).` : `Reprise prévue le ${dateFmt}.`;
    }
  }
  if (r.libelle) return `Reprise prévue en ${r.libelle}.`;
  return '';
}

// ─────────────────────────────────────────────────────────────
// Vue dérivée : thèmes des en-têtes de rubrique, indexés par championnat.
// Réexportée par RubriqueHeader.jsx → les consommateurs ne changent pas.
// ─────────────────────────────────────────────────────────────
export const RUBRIQUE_THEMES = Object.fromEntries(
  Object.entries(CHARTES).map(([cle, charte]) => [cle, charte.rubrique])
);
