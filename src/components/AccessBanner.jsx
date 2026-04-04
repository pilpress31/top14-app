// ============================================
// src/components/AccessBanner.jsx
// Bannière affichée quand l'accès expire dans < 30 jours
// À placer dans le layout principal
// ============================================

import { useState } from 'react'
import { AlertTriangle, X, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function AccessBanner({ joursRestants, tarif }) {
  const [dismissed, setDismissed] = useState(false)
  const navigate = useNavigate()

  if (dismissed || !joursRestants || joursRestants > 30) return null

  const urgence = joursRestants <= 7  // Rouge si < 7 jours
  const montant = tarif?.prix ?? '—'

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 ${urgence ? 'bg-red-500' : 'bg-amber-500'} text-white px-4 py-2 flex items-center gap-3`}>
      <AlertTriangle className="h-4 w-4 flex-shrink-0" />

      <p className="text-xs flex-1 font-medium">
        {joursRestants <= 1
          ? '⚠️ Votre accès expire aujourd\'hui !'
          : `⚠️ Votre accès expire dans ${joursRestants} jour${joursRestants > 1 ? 's' : ''}`
        }
        {montant !== '—' && ` — Renouvelez pour ${montant}€/saison`}
      </p>

      <button
        onClick={() => navigate('/paywall')}
        className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-2 py-1 rounded text-xs font-bold transition-colors flex-shrink-0"
      >
        Renouveler <ChevronRight className="h-3 w-3" />
      </button>

      <button
        onClick={() => setDismissed(true)}
        className="hover:bg-white/20 p-1 rounded transition-colors flex-shrink-0"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}
