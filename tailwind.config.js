/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'rugby-black': '#000000',         // noir intense
        'rugby-gold': '#CBA135',          // or métallisé
        'rugby-gold-soft': '#FAF6EB',     // or très pâle — fonds d'en-têtes Top 14
        'rugby-gold-border': '#E4D29A',   // or clair — bordures d'en-têtes Top 14
        'rugby-bronze': '#8C6D3A',        // bronze foncé
        'rugby-gray': '#D4CFC7',          // gris chaud
        'rugby-white': '#FFFFFF',         // blanc pur

        // ── Pro D2 (valeurs alignées sur src/constants/chartes.js — garder synchronisé) ──
        'd2-navy': '#00174D',             // bleu marine principal
        'd2-navy-dark': '#002A7D',        // bleu marine foncé (hover / texte secondaire)
        'd2-blue': '#97C1FE',             // bleu clair (accent)
        'd2-silver': '#C0C0C0',           // argent

        // ── Champions Cup / EPCR (valeurs alignées sur src/constants/chartes.js) ──
        'hcup-blue': '#003E7E',           // bleu EPCR principal
        'hcup-blue-dark': '#002857',      // bleu EPCR foncé (hover)
        'hcup-gold': '#FFC72C',           // or EPCR (accent)
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [
    function ({ addComponents }) {
      addComponents({
        // ✅ Bouton principal
        '.btn-primary': {
          '@apply px-4 py-2 rounded-md font-semibold text-rugby-white bg-rugby-gold hover:bg-rugby-bronze transition-colors': {},
        },
        // ✅ Bouton secondaire
        '.btn-secondary': {
          '@apply px-4 py-2 rounded-md font-semibold text-rugby-black bg-rugby-gray hover:bg-rugby-gold transition-colors': {},
        },
        // ✅ Titre principal
        '.header-title': {
          '@apply text-2xl font-bold text-rugby-black flex items-center gap-2': {},
        },
        // ✅ Carte / bloc
        '.card': {
          '@apply bg-rugby-white rounded-lg shadow-md p-6 border border-rugby-gray': {},
        },

        // ✅ BottomNav container
        // Hauteur visible = --bottom-nav-height (72px)
        // Padding-bottom = safe-area Android/iOS pour ne pas être sous la barre système
        // Hauteur totale = 72px + safe-area (typiquement 16px sur Android gesture)
        '.nav-container': {
          '@apply fixed bottom-0 left-0 w-full bg-rugby-black border-t border-rugby-gray shadow-md z-50': {},
          height: 'var(--bottom-nav-total)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          boxSizing: 'border-box',
        },
        // ✅ Items wrapper - prend la hauteur visible (sans la safe-area)
        '.nav-items': {
          '@apply flex justify-around items-center py-2 text-xs': {},
          height: 'var(--bottom-nav-height)',
        },
        // ✅ Bouton générique
        '.nav-button': {
          '@apply flex flex-col items-center gap-1 px-2': {},
        },
        // ✅ Bouton actif
        '.nav-active': {
          '@apply text-rugby-gold font-semibold': {},
        },
        // ✅ Bouton inactif
        '.nav-inactive': {
          '@apply text-rugby-gray hover:text-rugby-bronze transition-colors': {},
        },

        // ✅ Helper : padding-bottom à utiliser sur les pages
        // pour que le contenu ne soit pas masqué par la BottomNav
        // Usage : <div className="pb-bottom-nav">
        '.pb-bottom-nav': {
          paddingBottom: 'var(--bottom-nav-total)',
        },
      });
    },
  ],
}
