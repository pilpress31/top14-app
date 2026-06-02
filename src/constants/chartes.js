// ─────────────────────────────────────────────────────────────
// src/constants/chartes.js
// SOURCE UNIQUE DE VÉRITÉ des chartes couleurs par championnat.
//
// Chaque championnat regroupe ses couleurs par usage :
//   label    : libellé affiché ('TOP 14' / 'PRO D2' / 'CHAMPIONS CUP')
//   rubrique : en-têtes d'accordéon { bg, border, text, accent }
//              (consommé via RUBRIQUE_THEMES, réexporté par RubriqueHeader)
//   partage  : visuel de partage / story sur fond sombre
//              { accent, accentVif, fond1, fond2, fond3 }
//
// ⚠️ Les valeurs Top 14 de `rubrique` sont alignées sur les couleurs
//    nommées rugby-* de tailwind.config.js — à garder synchronisées :
//      bg     = rugby-gold-soft   (#FAF6EB)
//      border = rugby-gold-border (#E4D29A)
//      text   = rugby-bronze      (#8C6D3A)
//      accent = rugby-gold        (#CBA135)
//
// NOTE : les nuances d'or du visuel de partage (#C9A84C / #FFD700)
//        diffèrent volontairement du rugby-gold (#CBA135) — elles
//        rendent mieux sur le fond bleu nuit de la story. Harmonisation
//        possible plus tard si souhaité (Phase ultérieure).
// ─────────────────────────────────────────────────────────────

export const CHARTES = {
  top14: {
    label: 'TOP 14',
    rubrique: { bg: '#FAF6EB', border: '#E4D29A', text: '#8C6D3A', accent: '#CBA135' },
    partage:  { accent: '#C9A84C', accentVif: '#FFD700',
                fond1: '#1a2740', fond2: '#101a2e', fond3: '#0a111f' },
  },
  prod2: {
    label: 'PRO D2',
    rubrique: { bg: '#EEF2FF', border: '#97C1FE', text: '#00174D', accent: '#97C1FE' },
    partage:  { accent: '#C0C0C0', accentVif: '#97C1FE',
                fond1: '#0a2c66', fond2: '#00174D', fond3: '#000f33' },
  },
  hcup: {
    label: 'CHAMPIONS CUP',
    rubrique: { bg: '#EEF5FF', border: '#B0CFE8', text: '#003E7E', accent: '#FFC72C' },
    partage:  { accent: '#FFC72C', accentVif: '#FFC72C',
                fond1: '#0a5099', fond2: '#003E7E', fond3: '#002a56' },
  },
};

// Accès à une charte avec repli sur le Top 14 pour tout championnat inconnu.
export const getCharte = (championnat) => CHARTES[championnat] || CHARTES.top14;

// ─────────────────────────────────────────────────────────────
// Vue dérivée : thèmes des en-têtes de rubrique, indexés par championnat.
//   { top14: {bg,border,text,accent}, prod2: {...}, hcup: {...} }
// Réexportée par RubriqueHeader.jsx → les composants consommateurs
// continuent d'importer RUBRIQUE_THEMES depuis RubriqueHeader sans changement.
// ─────────────────────────────────────────────────────────────
export const RUBRIQUE_THEMES = Object.fromEntries(
  Object.entries(CHARTES).map(([cle, charte]) => [cle, charte.rubrique])
);
