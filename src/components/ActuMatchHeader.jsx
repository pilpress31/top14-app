import { Newspaper, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Chartes couleurs par championnat — SOURCE UNIQUE DE VÉRITÉ
// pour l'en-tête « Actu du match » partagé par les trois onglets.
//
//   bg     : fond du bouton
//   border : bordure du bouton + fond du badge « màj »
//   text   : couleur du titre + texte du badge
//   accent : icône Newspaper, chevron, loader
//
// Les couleurs sont appliquées en style inline (et non en classes
// Tailwind) car les chartes D2 et HCup sont des hex bruts. Le thème
// top14 porte donc lui aussi des hex — mais ils correspondent aux
// couleurs nommées de tailwind.config.js, à garder synchronisés :
//   bg     = rugby-gold-soft   (#FAF6EB)
//   border = rugby-gold-border (#E4D29A)
//   text   = rugby-bronze      (#8C6D3A)
//   accent = rugby-gold        (#CBA135)
//
// Top 14  : charte or       (cf. couleurs rugby-* de tailwind.config.js)
// Pro D2  : charte D2       (#00174D / #97C1FE)
// C. Cup  : charte EPCR     (HCUP_BLEU #003E7E / HCUP_OR #FFC72C)
// ─────────────────────────────────────────────────────────────
export const ACTU_HEADER_THEMES = {
  top14: { bg: '#FAF6EB', border: '#E4D29A', text: '#8C6D3A', accent: '#CBA135' },
  prod2: { bg: '#EEF2FF', border: '#97C1FE', text: '#00174D', accent: '#97C1FE' },
  hcup:  { bg: '#EEF5FF', border: '#B0CFE8', text: '#003E7E', accent: '#FFC72C' },
};

/**
 * En-tête cliquable de la rubrique « Actu du match ».
 * Partagé à l'identique par les trois championnats — le style suit
 * la charte couleur passée via `theme` (cf. ACTU_HEADER_THEMES).
 *
 * Props :
 *   theme        : { bg, border, text, accent } — voir ACTU_HEADER_THEMES
 *   isOpen       : booléen — rubrique dépliée ou non
 *   loading      : booléen — affiche un loader à droite
 *   majFormatted : string|null — date de dernière màj (badge masqué si null)
 *   onToggle     : fonction — clic sur l'en-tête
 */
export default function ActuMatchHeader({ theme, isOpen, loading, majFormatted, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors group"
      style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}` }}
    >
      <div className="flex items-center gap-2">
        <Newspaper className="w-4 h-4" style={{ color: theme.accent }} />
        <span className="text-xs font-semibold" style={{ color: theme.text }}>
          Actu du match
        </span>
        {majFormatted && (
          <span
            className="text-[10px] rounded-full px-2 py-0.5"
            style={{ backgroundColor: theme.border, color: theme.text }}
          >
            màj {majFormatted}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        {loading && (
          <Loader2 className="w-3 h-3 animate-spin" style={{ color: theme.accent }} />
        )}
        {isOpen
          ? <ChevronUp className="w-4 h-4" style={{ color: theme.accent }} />
          : <ChevronDown className="w-4 h-4" style={{ color: theme.accent }} />
        }
      </div>
    </button>
  );
}
