// ============================================================
// MaintenancePage.jsx — écran affiché en prod pendant une maintenance
// Rendu hors providers (aucun contexte requis) : volontairement statique.
// ============================================================

export default function MaintenancePage({ message }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rugby-gold/10 to-rugby-orange/10 flex flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="text-6xl animate-bounce">🏉</div>
      <h1 className="text-rugby-gold font-bold text-2xl tracking-wide">
        Maintenance en cours
      </h1>
      <p className="text-gray-600 max-w-md leading-relaxed">
        {message ||
          "Top 14 Pronos fait une petite pause technique pour s'améliorer. On revient très vite — merci de votre patience !"}
      </p>
      <p className="text-gray-400 text-sm mt-2">
        La page se rafraîchit automatiquement dès le retour en ligne.
      </p>
    </div>
  );
}
