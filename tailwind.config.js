/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'rugby-black': '#000000',   // noir intense
        'rugby-gold': '#CBA135',    // or métallisé
        'rugby-bronze': '#8C6D3A',  // bronze foncé
        'rugby-gray': '#D4CFC7',    // gris chaud
        'rugby-white': '#FFFFFF',   // blanc pur
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

        // ✅ BottomNav container avec variable CSS
        '.nav-container': {
          '@apply fixed bottom-0 left-0 w-full bg-rugby-black border-t border-rugby-gray shadow-md z-50': {},
          height: 'var(--bottom-nav-height)', // utilise la variable CSS
        },
        // ✅ Items wrapper
        '.nav-items': {
          '@apply flex justify-around items-center py-2 text-xs': {},
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
      });
    },
  ],
}

