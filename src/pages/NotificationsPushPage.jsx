import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Bell, BellOff, Vibrate, ChevronRight } from 'lucide-react'

function NotificationsPushPage() {
  const navigate = useNavigate()
  const [modeSilence, setModeSilence] = useState(false)
  const [modeVibration, setModeVibration] = useState(true)

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-2xl mx-auto p-6">
        {/* Bouton retour */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-rugby-gold hover:text-rugby-orange mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-sm font-semibold">Retour</span>
        </button>

        {/* Titre */}
        <h1 className="text-3xl font-bold text-rugby-gold mb-8">Notifications Push</h1>

        {/* Section Silence */}
        <div className="bg-white rounded-lg shadow-sm mb-4 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h2 className="text-sm font-bold text-gray-700 uppercase">Silence</h2>
          </div>

          {/* Mode silence */}
          <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
            <div className="flex items-center gap-3">
              {modeSilence ? <BellOff className="h-5 w-5 text-gray-500" /> : <Bell className="h-5 w-5 text-rugby-gold" />}
              <span className="font-medium text-gray-800">Mode silence</span>
            </div>
            <button
              onClick={() => setModeSilence(!modeSilence)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                modeSilence ? 'bg-rugby-gold' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  modeSilence ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Mode vibration */}
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Vibrate className="h-5 w-5 text-gray-500" />
              <span className="font-medium text-gray-800">Mode vibration</span>
            </div>
            <button
              onClick={() => setModeVibration(!modeVibration)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                modeVibration ? 'bg-rugby-gold' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  modeVibration ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Section Support */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h2 className="text-sm font-bold text-gray-700 uppercase">Support</h2>
          </div>

          {/* Signaler un dysfonctionnement */}
          <button
            onClick={() => navigate('/notifications-diagnostic')}
            className="w-full px-6 py-4 flex items-center gap-3 hover:bg-gray-50 transition-colors"
          >
            <Bell className="h-5 w-5 text-blue-500" />
            <div className="flex-1 text-left">
              <span className="font-medium text-gray-800 block">Signaler un dysfonctionnement</span>
              <span className="text-sm text-gray-500">Diagnostiquer les problèmes de notifications</span>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default NotificationsPushPage
