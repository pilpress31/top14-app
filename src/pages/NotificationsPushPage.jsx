import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Volume2, VolumeX, Vibrate, Bell, BellOff, Settings, ChevronDown, Smartphone, Apple } from 'lucide-react';
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
  const [notifDistributionMensuelle, setNotifDistributionMensuelle] = useState(localStorage.getItem('notif-distribution-mensuelle') !== 'false');

  // 🆕 Détection OS pour ouvrir le bon onglet d'aide par défaut
  const detectOS = () => {
    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
    if (/Android/i.test(ua)) return 'android';
    return 'android'; // par défaut
  };
  const [aideOS, setAideOS] = useState(detectOS());
  // Aide ouverte par défaut si les notifs ne sont pas activées
  const [aideOuverte, setAideOuverte] = useState(permission !== 'granted');

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

  const handleToggleNotifDistributionMensuelle = () => {
    const newValue = !notifDistributionMensuelle;
    setNotifDistributionMensuelle(newValue);
    localStorage.setItem('notif-distribution-mensuelle', newValue.toString());
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

          {/* 🆕 ZONE D'AIDE — Comment activer les notifications */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <button
              onClick={() => setAideOuverte(!aideOuverte)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🤔</span>
                <div className="text-left">
                  <p className="font-medium text-gray-800">Comment activer les notifications ?</p>
                  <p className="text-xs text-gray-500">Tutoriel pour Android et iPhone</p>
                </div>
              </div>
              <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${aideOuverte ? 'rotate-180' : ''}`} />
            </button>

            {aideOuverte && (
              <div className="border-t border-gray-100">
                {/* Tabs OS */}
                <div className="flex border-b border-gray-200">
                  <button
                    onClick={() => setAideOS('android')}
                    className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                      aideOS === 'android'
                        ? 'bg-green-50 text-green-700 border-b-2 border-green-500'
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    Android
                  </button>
                  <button
                    onClick={() => setAideOS('ios')}
                    className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                      aideOS === 'ios'
                        ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <Apple className="w-4 h-4" />
                    iPhone
                  </button>
                </div>

                {/* Contenu Android */}
                {aideOS === 'android' && (
                  <div className="p-4 space-y-4">
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">3 étapes simples</span> pour activer les notifications sur Android :
                    </p>
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-green-500 text-white text-sm font-bold flex items-center justify-center">1</div>
                        <div className="flex-1 pt-0.5">
                          <p className="text-sm font-semibold text-gray-800">Ouvre l'app Top14 Pronos</p>
                          <p className="text-xs text-gray-500 mt-0.5">Depuis l'icône installée sur ton écran d'accueil</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-green-500 text-white text-sm font-bold flex items-center justify-center">2</div>
                        <div className="flex-1 pt-0.5">
                          <p className="text-sm font-semibold text-gray-800">Va dans <span className="text-green-700">Profil 🔔</span> puis <span className="text-green-700">Notifications</span></p>
                          <p className="text-xs text-gray-500 mt-0.5">Tu trouveras le bouton "Activer les notifications" en haut de cette page</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-green-500 text-white text-sm font-bold flex items-center justify-center">3</div>
                        <div className="flex-1 pt-0.5">
                          <p className="text-sm font-semibold text-gray-800">Touche <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded font-bold">Autoriser</span> quand Chrome te demande</p>
                          <p className="text-xs text-gray-500 mt-0.5">C'est tout, tu recevras désormais les notifications 🎉</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Contenu iOS */}
                {aideOS === 'ios' && (
                  <div className="p-4 space-y-4">
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">5 étapes</span> (un peu plus exigeant côté Apple…) :
                    </p>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                      ⚠️ Nécessite iOS 16.4 ou plus récent
                    </div>
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-500 text-white text-sm font-bold flex items-center justify-center">1</div>
                        <div className="flex-1 pt-0.5">
                          <p className="text-sm font-semibold text-gray-800">Ouvre <span className="font-mono bg-blue-50 px-1.5 py-0.5 rounded text-blue-700">app.top14pronos.fr</span> dans <span className="text-blue-700">Safari</span></p>
                          <p className="text-xs text-gray-500 mt-0.5">Important : ça doit être Safari, pas Chrome ni Firefox</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-500 text-white text-sm font-bold flex items-center justify-center">2</div>
                        <div className="flex-1 pt-0.5">
                          <p className="text-sm font-semibold text-gray-800">Touche le bouton <span className="text-blue-700">Partager</span> 🔼 en bas</p>
                          <p className="text-xs text-gray-500 mt-0.5">Le carré avec une flèche qui pointe vers le haut</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-500 text-white text-sm font-bold flex items-center justify-center">3</div>
                        <div className="flex-1 pt-0.5">
                          <p className="text-sm font-semibold text-gray-800">Choisis <span className="text-blue-700">"Sur l'écran d'accueil"</span> ➕</p>
                          <p className="text-xs text-gray-500 mt-0.5">Une icône Top14 Pronos apparaît sur ton écran d'accueil</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-500 text-white text-sm font-bold flex items-center justify-center">4</div>
                        <div className="flex-1 pt-0.5">
                          <p className="text-sm font-semibold text-gray-800">Ouvre l'app depuis <span className="text-blue-700">cette icône</span> (pas depuis Safari !)</p>
                          <p className="text-xs text-gray-500 mt-0.5">⚠️ C'est l'étape la plus importante. Si tu utilises encore Safari, les notifs ne fonctionnent pas sur iOS.</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-500 text-white text-sm font-bold flex items-center justify-center">5</div>
                        <div className="flex-1 pt-0.5">
                          <p className="text-sm font-semibold text-gray-800">Va dans <span className="text-blue-700">Profil 🔔</span> puis <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">Activer les notifications</span></p>
                          <p className="text-xs text-gray-500 mt-0.5">Touche "Autoriser" quand iOS te demande la permission. Done ! 🎉</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

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

                  {/* Distribution mensuelle */}
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">💰</span>
                        <div>
                          <p className="font-medium text-gray-800">Distribution mensuelle</p>
                          <p className="text-xs text-gray-500">Bonus mensuel de jetons</p>
                        </div>
                      </div>
                      <button
                        onClick={handleToggleNotifDistributionMensuelle}
                        className={`w-14 h-7 rounded-full transition-colors relative ${
                          notifDistributionMensuelle ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                      >
                        <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                          notifDistributionMensuelle ? 'left-7' : 'left-0.5'
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
