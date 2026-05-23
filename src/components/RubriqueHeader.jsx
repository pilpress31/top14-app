import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Chartes couleurs par championnat — SOURCE UNIQUE DE VÉRITÉ
// pour les en-têtes de rubrique partagés par les trois onglets
// (Actu du match, Analyse historique, Historique des confrontations,
//  Statistiques du duel / Duel & Forme).
//
//   bg     : fond du bouton
//   border : bordure du bouton + fond du badge
//   text   : couleur du titre + texte du badge
//   accent : icône, chevron, loader
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
export const RUBRIQUE_THEMES = {
  top14: { bg: '#FAF6EB', border: '#E4D29A', text: '#8C6D3A', accent: '#CBA135' },
  prod2: { bg: '#EEF2FF', border: '#97C1FE', text: '#00174D', accent: '#97C1FE' },
  hcup:  { bg: '#EEF5FF', border: '#B0CFE8', text: '#003E7E', accent: '#FFC72C' },
};

/**
 * En-tête cliquable générique d'une rubrique d'accordéon.
 * Partagé à l'identique par les en-têtes de rubrique des trois
 * championnats — le style suit la charte couleur passée via `theme`.
 *
 * Props :
 *   theme    : { bg, border, text, accent } — voir RUBRIQUE_THEMES
 *   icon     : composant icône lucide-react (ex. Newspaper, BarChart2)
 *   label    : libellé de la rubrique (string)
 *   isOpen   : booléen — rubrique dépliée ou non
 *   loading  : booléen — affiche un loader à droite
 *   onToggle : fonction — clic sur l'en-tête
 *   badge    : string|null — pastille optionnelle (ex. "5 matchs")
 *   children : éléments optionnels rendus à droite du badge
 *              (ex. <InfoPopup /> — doit gérer son propre stopPropagation)
 */
export default function RubriqueHeader({
  theme,
  icon: Icon,
  label,
  isOpen,
  loading,
  onToggle,
  badge = null,
  children = null,
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors group"
      style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}` }}
    >
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4" style={{ color: theme.accent }} />}
        <span className="text-xs font-semibold" style={{ color: theme.text }}>
          {label}
        </span>
        {badge && (
          <span
            className="text-[10px] rounded-full px-2 py-0.5"
            style={{ backgroundColor: theme.border, color: theme.text }}
          >
            {badge}
          </span>
        )}
        {children}
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
