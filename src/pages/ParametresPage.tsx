import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ChevronRight, Star, User, Mail, MessageSquare, Flag, FileText, Bell, Coins, BookOpen, Check, X, AlertCircle, Settings, Smartphone, Send, PlayCircle, Volume2, VolumeX, Vibrate } from "lucide-react";
import AvisModal from "../components/AvisModal";
import { usePushNotifications } from "../hooks/usePushNotifications";

function ParametresPage() {
  const [showAvisModal, setShowAvisModal] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // ✅ Push notifications
  const { permission, isSupported, requestPermission } = usePushNotifications();
  const [loadingNotif, setLoadingNotif] = useState(false);
  
  // ✅ Toggles
  const [modeSilence, setModeSilence] = useState(localStorage.getItem('mode-silence') === 'true');
  const [vibration, setVibration] = useState(localStorage.getItem('vibration') !== 'false'); // true par défaut
  
  // ✅ Diagnostic
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [diagnosticRun, setDiagnosticRun] = useState(false);
  const [testResults, setTestResults] = useState({
    phoneSettings: null,
    appSettings: null,
    registration: null,
    testNotification: null
  });

  const handleNousContacter = () => {
    const subject = 'Contact - Top 14 Pronos'
    const body = `
Bonjour,

[Écrivez votre message ici]

Informations système (à compléter si nécessaire) :
- Téléphone : 
- Version OS : 

Merci.
    `.trim()

    window.location.href = `mailto:support@top14pronos.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  // ✅ Activer notifications push
  const handleToggleNotifications = async () => {
    if (permission === 'granted') return;
    
    setLoadingNotif(true);
    await requestPermission();
    setLoadingNotif(false);
  };

  // ✅ Toggle Mode Silence
  const handleToggleSilence = () => {
    const newValue = !modeSilence;
    setModeSilence(newValue);
    localStorage.setItem('mode-silence', newValue.toString());
  };

  // ✅ Toggle Vibration
  const handleToggleVibration = () => {
    const newValue = !vibration;
    setVibration(newValue);
    localStorage.setItem('vibration', newValue.toString());
    
    // Tester vibration
    if (newValue && 'vibrate' in navigator) {
      navigator.vibrate(200);
    }
  };

  // ✅ Lancer diagnostic
  const handleRunDiagnostic = async () => {
    setDiagnosticRun(true);
    setTestResults({ phoneSettings: null, appSettings: null, registration: null, testNotification: null });
    
    // Test 1 : Permissions téléphone
    setTimeout(() => {
      const notificationPermission = 'Notification' in window ? Notification.permission : 'denied';
      setTestResults(prev => ({
        ...prev,
        phoneSettings: notificationPermission === 'granted' ? 'success' : 'error'
      }));
    }, 500);
    
    // Test 2 : Mode silence
    setTimeout(() => {
      const silence = localStorage.getItem('mode-silence') === 'true';
      setTestResults(prev => ({
        ...prev,
        appSettings: silence ? 'error' : 'success'
      }));
    }, 1000);
    
    // Test 3 : Service Worker
    setTimeout(async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        setTestResults(prev => ({
          ...prev,
          registration: registration ? 'success' : 'error'
        }));
      } catch (e) {
        setTestResults(prev => ({
          ...prev,
          registration: 'error'
        }));
      }
    }, 1500);
    
    // Test 4 : Push notification test
    setTimeout(async () => {
      try {
        if ('Notification' in window && Notification.permission === 'granted') {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          
          if (subscription) {
            // Envoyer via backend
            const response = await fetch('https://top14-api-production.up.railway.app/api/notifications/send-push-test', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ subscription })
            });
            
            setTestResults(prev => ({
              ...prev,
              testNotification: response.ok ? 'success' : 'error'
            }));
          } else {
            setTestResults(prev => ({
              ...prev,
              testNotification: 'error'
            }));
          }
        } else {
          setTestResults(prev => ({
            ...prev,
            testNotification: 'error'
          }));
        }
      } catch (e) {
        console.error('Test push error:', e);
        setTestResults(prev => ({
          ...prev,
          testNotification: 'error'
        }));
      }
    }, 2000);
  };

  // ✅ Badge statut
  const getNotifBadge = () => {
    if (!isSupported) {
      return <span className="text-xs text-gray-400">Non supporté</span>;
    }
    
    switch (permission) {
      case 'granted':
        return (
          <div className="flex items-center gap-1 text-green-600">
            <Check className="w-4 h-4" />
            <span className="text-xs font-medium">Activées</span>
          </div>
        );
      case 'denied':
        return (
          <div className="flex items-center gap-1 text-red-600">
            <X className="w-4 h-4" />
            <span className="text-xs font-medium">Bloquées</span>
          </div>
        );
      default:
        return <span className="text-xs text-gray-500">Désactivées</span>;
    }
  };

  const getStatusIcon = (status) => {
    if (!status) return <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />;
    if (status === 'success') return <Check className="h-5 w-5 text-green-500" />;
    if (status === 'error') return <X className="h-5 w-5 text-red-500" />;
    return null;
  };

  const diagnosticItems = [
    {
      id: 1,
      icon: Settings,
      titre: "Paramètres du téléphone",
      description: "Notifications autorisées dans les paramètres système",
      status: testResults.phoneSettings
    },
    {
      id: 2,
      icon: Smartphone,
      titre: "Mode silence de l'app",
      description: "Le mode silence ne doit pas être activé",
      status: testResults.appSettings
    },
    {
      id: 3,
      icon: Bell,
      titre: "Service Worker",
      description: "Service Worker enregistré pour recevoir les push",
      status: testResults.registration
    },
    {
      id: 4,
      icon: Send,
      titre: "Notification de test",
      description: "Envoi réel d'une notification push",
      status: testResults.testNotification
    }
  ];

  return (
    <div className="p-6 pb-24 max-w-2xl mx-auto">
      {/* Titre principal */}
      <h1 className="text-3xl font-bold text-rugby-gold mb-6">Paramètres</h1>

      {/* Infos utilisateur */}
      {user && (
        <div className="bg-gradient-to-r from-rugby-gold/10 to-rugby-orange/10 rounded-lg p-4 mb-4 border border-rugby-gold/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-rugby-gold rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-800">
                {user.user_metadata?.nom_complet || 'Utilisateur'}
              </p>
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Section Mon compte */}
      <div className="bg-white rounded-lg shadow-sm mb-4 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h2 className="text-sm font-bold text-gray-700 uppercase flex items-center gap-2">
            <User className="h-4 w-4" />
            Mon compte
          </h2>
        </div>

        <button 
          onClick={() => navigate('/profil')}
          className="w-full px-6 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
        >
          <User className="h-5 w-5 text-rugby-gold" />
          <span className="flex-1 text-left text-gray-800 font-medium">Mon profil</span>
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </button>

        <button 
          onClick={() => navigate('/ma-cagnotte')}
          className="w-full px-6 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
        >
          <Coins className="h-5 w-5 text-rugby-gold" />
          <span className="flex-1 text-left text-gray-800 font-medium">Ma Cagnotte</span>
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </button>

        <button className="w-full px-6 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors">
          <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
          <span className="flex-1 text-left text-gray-800 font-medium">Gérer mes favoris</span>
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </button>
      </div>

      {/* ✅ NOTIFICATIONS PUSH - SECTION COMPLÈTE */}
      <div className="bg-white rounded-lg shadow-sm mb-4 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-700 uppercase flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications Push
          </h2>
          {getNotifBadge()}
        </div>

        <div className="p-6">
          {isSupported ? (
            <>
              <p className="text-sm text-gray-600 mb-4">
                Recevez des alertes pour vos paris, bonus et distributions
              </p>
              
              {/* Bouton activer */}
              {permission !== 'granted' && permission !== 'denied' && (
                <button
                  onClick={handleToggleNotifications}
                  disabled={loadingNotif}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium py-3 rounded hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 mb-4"
                >
                  {loadingNotif ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Activation...
                    </>
                  ) : (
                    <>
                      <Bell className="w-4 h-4" />
                      Activer les notifications
                    </>
                  )}
                </button>
              )}

              {/* Message bloqué */}
              {permission === 'denied' && (
                <div className="bg-orange-50 border border-orange-200 rounded p-3 mb-4">
                  <p className="text-xs text-orange-800 font-bold mb-2">🔒 Notifications bloquées</p>
                  <p className="text-xs text-orange-700 mb-2">Pour réactiver :</p>
                  <ol className="text-xs text-orange-700 space-y-1 ml-4 list-decimal mb-2">
                    <li>Menu ⋮ de l'app → Paramètres du site</li>
                    <li>Notifications → Autorisé</li>
                    <li>Recharger l'app</li>
                  </ol>
                  <button
                    onClick={() => window.location.reload()}
                    className="w-full bg-orange-500 text-white text-xs font-medium py-2 rounded hover:bg-orange-600"
                  >
                    🔄 Recharger
                  </button>
                </div>
              )}

              {/* Toggles + Diagnostic (si activé) */}
              {permission === 'granted' && (
                <>
                  <div className="bg-green-50 border border-green-200 rounded p-3 mb-4">
                    <p className="text-xs text-green-700 font-medium">
                      ✅ Notifications activées
                    </p>
                  </div>

                  {/* Toggles */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {modeSilence ? <VolumeX className="w-5 h-5 text-gray-500" /> : <Volume2 className="w-5 h-5 text-blue-500" />}
                        <div>
                          <p className="font-medium text-gray-800 text-sm">Mode silence</p>
                          <p className="text-xs text-gray-500">Désactiver les sons</p>
                        </div>
                      </div>
                      <button
                        onClick={handleToggleSilence}
                        className={`w-12 h-6 rounded-full transition-colors relative ${
                          modeSilence ? 'bg-gray-400' : 'bg-blue-500'
                        }`}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                          modeSilence ? 'left-0.5' : 'left-6'
                        }`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Vibrate className="w-5 h-5 text-blue-500" />
                        <div>
                          <p className="font-medium text-gray-800 text-sm">Vibration</p>
                          <p className="text-xs text-gray-500">Vibre lors des notifications</p>
                        </div>
                      </div>
                      <button
                        onClick={handleToggleVibration}
                        className={`w-12 h-6 rounded-full transition-colors relative ${
                          vibration ? 'bg-blue-500' : 'bg-gray-400'
                        }`}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                          vibration ? 'left-6' : 'left-0.5'
                        }`} />
                      </button>
                    </div>
                  </div>

                  {/* Bouton Diagnostic */}
                  <button
                    onClick={() => setShowDiagnostic(!showDiagnostic)}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium py-2 rounded flex items-center justify-center gap-2 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    {showDiagnostic ? 'Masquer le diagnostic' : 'Tester les notifications'}
                  </button>

                  {/* Section Diagnostic */}
                  {showDiagnostic && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h3 className="font-bold text-gray-800 mb-3">Diagnostic des notifications</h3>
                      
                      <div className="space-y-2 mb-4">
                        {diagnosticItems.map((item) => {
                          const Icon = item.icon;
                          return (
                            <div key={item.id} className="bg-white rounded p-3 flex items-start gap-3">
                              <Icon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-800 text-sm">{item.titre}</p>
                                <p className="text-xs text-gray-500">{item.description}</p>
                              </div>
                              {getStatusIcon(item.status)}
                            </div>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => {
                          if (diagnosticRun) {
                            // Reset pour relancer
                            setDiagnosticRun(false);
                            setTestResults({ phoneSettings: null, appSettings: null, registration: null, testNotification: null });
                          } else {
                            handleRunDiagnostic();
                          }
                        }}
                        className="w-full py-3 rounded font-medium text-white transition-colors flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600"
                      >
                        <PlayCircle className="w-5 h-5" />
                        {diagnosticRun ? 'Relancer le diagnostic' : 'Lancer le diagnostic'}
                      </button>

                      {/* ✅ Rectangle signalement */}
                      {diagnosticRun && (
                        <div 
                          onClick={() => {
                            const subject = 'Problème notifications push - Top14 Pronos';
                            const body = `
Bonjour,

Malgré un diagnostic au vert, je rencontre toujours un problème avec les notifications push.

Résultats du diagnostic :
- Paramètres téléphone : ${testResults.phoneSettings === 'success' ? '✅ OK' : '❌ Erreur'}
- Mode silence : ${testResults.appSettings === 'success' ? '✅ OK' : '❌ Erreur'}
- Service Worker : ${testResults.registration === 'success' ? '✅ OK' : '❌ Erreur'}
- Test push : ${testResults.testNotification === 'success' ? '✅ OK' : '❌ Erreur'}

Téléphone : [Votre modèle]
OS : [iOS/Android + version]

Problème rencontré :
[Décrivez votre problème]

Merci.
                            `.trim();
                            window.location.href = `mailto:support@top14pronos.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                          }}
                          className="mt-3 p-4 bg-orange-50 border-2 border-orange-200 rounded-lg cursor-pointer hover:bg-orange-100 transition-colors"
                        >
                          <p className="font-bold text-gray-800 text-sm mb-1">📧 Signaler un problème</p>
                          <p className="text-xs text-gray-600">
                            Si tout est au vert mais que vous avez toujours un problème, cliquez ici.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <p className="text-xs text-gray-400">
              Votre navigateur ne supporte pas les notifications push
            </p>
          )}
        </div>
      </div>

      {/* Section Informations */}
      <div className="bg-white rounded-lg shadow-sm mb-4 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h2 className="text-sm font-bold text-gray-700 uppercase flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Informations
          </h2>
        </div>

        <button 
          onClick={() => navigate('/reglement')}
          className="w-full px-6 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
        >
          <FileText className="h-5 w-5 text-rugby-gold" />
          <span className="flex-1 text-left text-gray-800 font-medium">Règlement du jeu</span>
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </button>
      </div>

      {/* Section Autres */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h2 className="text-sm font-bold text-gray-700 uppercase">Autres</h2>
        </div>

        <button 
          onClick={handleNousContacter}
          className="w-full px-6 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
        >
          <Mail className="h-5 w-5 text-blue-500" />
          <span className="flex-1 text-left text-gray-800">Nous contacter</span>
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </button>

        <button 
          onClick={() => setShowAvisModal(true)}
          className="w-full px-6 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
        >
          <MessageSquare className="h-5 w-5 text-green-500" />
          <span className="flex-1 text-left text-gray-800">Laisser un avis</span>
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </button>

        <button 
          onClick={() => navigate('/signaler-bug')}
          className="w-full px-6 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
        >
          <Flag className="h-5 w-5 text-red-500" />
          <span className="flex-1 text-left text-gray-800">Signaler un bug</span>
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </button>

        <button 
          onClick={() => navigate('/cgu')}
          className="w-full px-6 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
        >
          <FileText className="h-5 w-5 text-gray-500" />
          <span className="flex-1 text-left text-gray-800">Conditions générales</span>
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </button>
      </div>

      <div className="mt-8 text-center">
        <p className="text-xs text-gray-400">Version 1.0.0</p>
      </div>

      <AvisModal isOpen={showAvisModal} onClose={() => setShowAvisModal(false)} />
    </div>
  );
}

export default ParametresPage;
