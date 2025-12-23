import { X } from 'lucide-react'

function AvisModal({ isOpen, onClose }) {
  if (!isOpen) return null

  const handleRating = (rating) => {
    // Ouvrir le store selon la plateforme
    // Pour iOS : itms-apps://itunes.apple.com/app/idXXXXXXXXXX
    // Pour Android : market://details?id=com.top14pronos.app
    
    // Version web pour test (à remplacer par les vrais liens stores)
    const appStoreUrl = 'https://apps.apple.com'  // Remplacer par ton lien App Store
    const playStoreUrl = 'https://play.google.com/store'  // Remplacer par ton lien Play Store
    
    // Détecter la plateforme
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isAndroid = /Android/.test(navigator.userAgent)
    
    if (isIOS) {
      window.location.href = appStoreUrl
    } else if (isAndroid) {
      window.location.href = playStoreUrl
    } else {
      // Fallback pour navigateur web
      window.open(playStoreUrl, '_blank')
    }
    
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
        {/* Bouton fermeture */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Contenu */}
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-800 mb-3">
            Que pensez-vous de l'application ?
          </h3>
          <p className="text-gray-600 mb-8">
            Votre avis nous aide à améliorer l'expérience pour tous !
          </p>

          {/* Emojis de notation */}
          <div className="flex justify-center gap-6 mb-6">
            <button
              onClick={() => handleRating('bad')}
              className="flex flex-col items-center gap-2 hover:scale-110 transition-transform"
            >
              <div className="text-6xl">😞</div>
              <span className="text-xs text-gray-600 font-medium">Pas satisfait</span>
            </button>

            <button
              onClick={() => handleRating('neutral')}
              className="flex flex-col items-center gap-2 hover:scale-110 transition-transform"
            >
              <div className="text-6xl">😐</div>
              <span className="text-xs text-gray-600 font-medium">Moyen</span>
            </button>

            <button
              onClick={() => handleRating('good')}
              className="flex flex-col items-center gap-2 hover:scale-110 transition-transform"
            >
              <div className="text-6xl">😊</div>
              <span className="text-xs text-gray-600 font-medium">Très satisfait</span>
            </button>
          </div>

          <p className="text-xs text-gray-500">
            Vous serez redirigé vers le store pour laisser votre note
          </p>
        </div>
      </div>
    </div>
  )
}

export default AvisModal
