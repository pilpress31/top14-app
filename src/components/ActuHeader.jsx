/**
 * ActuHeader — bandeau de la page Actu.
 * Bascule entièrement (couleurs + sous-titre) selon le championnat.
 * Hauteur 120px alignée sur MainHeaderFull (le pt-[120px] de ActuPage reste valable).
 */

const THEMES = {
  top14: {
    gradient: 'linear-gradient(to right, #000000, #1a1a1a, rgba(203,161,53,0.85))',
    accent: '#CBA135',
    subtitleColor: '#d1d5db',
    sousTitre: 'Analyses et avant-matchs du Top 14',
  },
  prod2: {
    gradient: 'linear-gradient(to right, #00102E, #00174D, #2A5BA8)',
    accent: '#97C1FE',
    subtitleColor: '#C0C0C0',
    sousTitre: 'Analyses et avant-matchs de Pro D2',
  },
  hcup: {
    gradient: 'linear-gradient(to right, #001E3D, #003E7E, #0A5BA8)',
    accent: '#FFC72C',
    subtitleColor: '#cbd5e1',
    sousTitre: 'Analyses et avant-matchs de Champions Cup',
  },
};

export default function ActuHeader({ championnat = 'top14', isVisible = true }) {
  const theme = THEMES[championnat] || THEMES.top14;

  return (
    <header
      className={`fixed left-0 w-full h-[120px] text-white shadow-md z-50 transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
      style={{ top: 'var(--safe-area-top, 0px)', background: theme.gradient }}
    >
      <div className="container mx-auto px-3 h-full flex flex-col items-center justify-center gap-2">

        {/* Titre */}
        <h1
          className="text-2xl font-extrabold flex items-center justify-center gap-2.5 uppercase tracking-[0.18em]"
          style={{ color: theme.accent }}
        >
          {/* Icône journal */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
            <path d="M18 14h-8M15 18h-5M10 6h8v4h-8V6Z" />
          </svg>
          L'ACTU DES MATCHS
        </h1>

        {/* Sous-titre */}
        <p
          className="text-xs italic text-center transition-colors duration-300"
          style={{ color: theme.subtitleColor }}
        >
          {theme.sousTitre}
        </p>

        {/* Filet décoratif aux couleurs du championnat */}
        <div
          className="w-24 h-[3px] rounded-full mt-0.5"
          style={{ backgroundColor: theme.accent }}
        />
      </div>
    </header>
  );
}