import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Volume2, VolumeX, Vibrate, Bell, BellOff, Settings } from 'lucide-react';
import { usePushNotifications } from '../hooks/usePushNotifications';

export default function NotificationsPushPage() {
  const navigate = useNavigate();
  const { permission, isSupported, requestPermission } = usePushNotifications();
  const [loadingNotif, setLoadingNotif] = useState(false);

  // Toggles
  const [modeSilence, setModeSilence] = useState(localStorage.getItem('mode-silence') === 'true');
  const [vibration, setVibration] = useState(localStorage.getItem('vibration') !== 'false');
  
  // Types d'alertes
  const [notifPariGagne, setNotifPariGagne] = useState(localStorage.getItem('notif-pari-gagne') !== 'false');
  const [notifBonusScore, setNotifBonusScore] = useState(localStorage.getItem('notif-bonus-score') !== 'false');
  const [notifNouveauxMatchs, setNotifNouveauxMatchs] = useState(localStorage.getItem('notif-nouveaux-matchs') !== 'false');

  const handleToggleSilence = () => {
    const newValue = !modeSilence;
    setModeSilence(newValue);
    localStorage.setItem('mode-silence', newValue.toString());
  };

  const handleToggleVibration = () => {
    const newValue = !vibration;
    setVibration(newValue);
    localStorage.setItem('vibration', newValue.toString());
    if (newValue && 'vibrate' in navigator) {
      navigator.vibrate(200);
    }
  };

  const handleToggleNotifPariGagne = () => {
    const newValue = !notifPariGagne;
    setNotifPariGagne(newValue);
    localStorage.setItem('notif-pari-gagne', newValue.toString());
  };

  const handleToggleNotifBonusScore = () => {
    const newValue = !notifBonusScore;
    setNotifBonusScore(newValue);
    localStorage.setItem('notif-bonus-score', newValue.toString());
  };

  const handleToggleNotifNouveauxMatchs = () => {
    const newValue = !notifNouveauxMatchs;
    setNotifNouveauxMatchs(newValue);
    localStorage.setItem('notif-nouveaux-matchs', newValue.toString());
  };

  const handleActiverNotifications = async () => {
    if (permission === 'granted') return;
    setLoadingNotif(true);
    await requestPermission();
    setLoadingNotif(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="px-6 py-4 flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="text-rugby-gold hover:text-rugby-orange transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h1 className="text-2xl font-bold text-rugby-gold">Notifications Push</h1>
          </div>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Statut */}
          {isSupported ? (
            <>
              {permission === 'granted' ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <Bell className="w-6 h-6 text-green-600" />
                    <div>
                      <p className="font-bold text-green-800">Notifications activées</p>
                      <p className="text-sm text-green-600">Vous recevrez des alertes push</p>
                    </div>
                  </div>
                </div>
              ) : permission === 'denied' ? (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <BellOff className="w-6 h-6 text-orange-600" />
                    <div>
                      <p className="font-bold text-orange-800">Notifications bloquées</p>
                      <p className="text-sm text-orange-600">Réactivez-les dans les paramètres</p>
                    </div>
                  </div>
                  <ol className="text-xs text-orange-700 space-y-1 ml-4 list-decimal mb-3">
                    <li>Menu ⋮ → Paramètres du site</li>
                    <li>Notifications → Autorisé</li>
                    <li>Recharger l'app</li>
                  </ol>
                  <button
                    onClick={() => window.location.reload()}
                    className="w-full bg-orange-500 text-white text-sm font-medium py-2 rounded hover:bg-orange-600"
                  >
                    🔄 Recharger
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleActiverNotifications}
                  disabled={loadingNotif}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loadingNotif ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Activation...
                    </>
                  ) : (
                    <>
                      <Bell className="w-5 h-5" />
                      Activer les notifications
                    </>
                  )}
                </button>
              )}
            </>
          ) : (
            <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 text-center">
              <p className="text-gray-600">Notifications non supportées par votre navigateur</p>
            </div>
          )}

          {/* Section Silence */}
          {permission === 'granted' && (
            <>
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-3">Silence</h2>
                <div className="space-y-3">
                  
                  {/* Mode silence */}
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {modeSilence ? <VolumeX className="w-5 h-5 text-gray-500" /> : <Volume2 className="w-5 h-5 text-blue-500" />}
                        <div>
                          <p className="font-medium text-gray-800">Mode silence</p>
                          <p className="text-xs text-gray-500">Désactiver les sons</p>
                        </div>
                      </div>
                      <button
                        onClick={handleToggleSilence}
                        className={`w-14 h-7 rounded-full transition-colors relative ${
                          modeSilence ? 'bg-gray-400' : 'bg-blue-500'
                        }`}
                      >
                        <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                          modeSilence ? 'left-0.5' : 'left-7'
                        }`} />
                      </button>
                    </div>
                  </div>

                  {/* Vibration */}
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Vibrate className="w-5 h-5 text-blue-500" />
                        <div>
                          <p className="font-medium text-gray-800">Vibration</p>
                          <p className="text-xs text-gray-500">Vibre lors des notifications</p>
                        </div>
                      </div>
                      <button
                        onClick={handleToggleVibration}
                        className={`w-14 h-7 rounded-full transition-colors relative ${
                          vibration ? 'bg-blue-500' : 'bg-gray-400'
                        }`}
                      >
                        <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                          vibration ? 'left-7' : 'left-0.5'
                        }`} />
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              {/* Section Types d'alertes */}
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-3">Types d'alertes</h2>
                <div className="space-y-3">
                  
                  {/* Pari gagné */}
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🎉</span>
                        <div>
                          <p className="font-medium text-gray-800">Pari gagné</p>
                          <p className="text-xs text-gray-500">Résultats de vos paris</p>
                        </div>
                      </div>
                      <button
                        onClick={handleToggleNotifPariGagne}
                        className={`w-14 h-7 rounded-full transition-colors relative ${
                          notifPariGagne ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                      >
                        <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                          notifPariGagne ? 'left-7' : 'left-0.5'
                        }`} />
                      </button>
                    </div>
                  </div>

                  {/* Bonus score exact */}
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🎯</span>
                        <div>
                          <p className="font-medium text-gray-800">Bonus score exact</p>
                          <p className="text-xs text-gray-500">Prédiction parfaite</p>
                        </div>
                      </div>
                      <button
                        onClick={handleToggleNotifBonusScore}
                        className={`w-14 h-7 rounded-full transition-colors relative ${
                          notifBonusScore ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                      >
                        <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                          notifBonusScore ? 'left-7' : 'left-0.5'
                        }`} />
                      </button>
                    </div>
                  </div>

                  {/* Nouveaux matchs */}
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🏉</span>
                        <div>
                          <p className="font-medium text-gray-800">Nouveaux matchs</p>
                          <p className="text-xs text-gray-500">Matchs disponibles pour parier</p>
                        </div>
                      </div>
                      <button
                        onClick={handleToggleNotifNouveauxMatchs}
                        className={`w-14 h-7 rounded-full transition-colors relative ${
                          notifNouveauxMatchs ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                      >
                        <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                          notifNouveauxMatchs ? 'left-7' : 'left-0.5'
                        }`} />
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              {/* Section Support */}
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-3">Support</h2>
                <button
                  onClick={() => navigate('/plus', { state: { openDiagnostic: true } })}
                  className="w-full bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors flex items-center gap-3"
                >
                  <Settings className="w-5 h-5 text-blue-500" />
                  <div className="text-left flex-1">
                    <p className="font-medium text-gray-800">Signaler un dysfonctionnement</p>
                    <p className="text-xs text-gray-500">Diagnostic et support technique</p>
                  </div>
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
