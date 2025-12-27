import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ChevronRight, Star, User, Mail, MessageSquare, Flag, FileText, Bell, Coins, BookOpen, Check, X, AlertCircle, CheckCircle, Loader } from "lucide-react";
import AvisModal from "../components/AvisModal";
import { usePushNotifications } from "../hooks/usePushNotifications";

export default function ParametresPage() {
  const [showAvisModal, setShowAvisModal] = useState(false);
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Scroll en haut à l'ouverture
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // ✅ Push notifications
  const { permission, isSupported } = usePushNotifications();

  // ✅ États diagnostic
  const [diagnosticResults, setDiagnosticResults] = useState({
    permission: { status: 'idle', message: '' },
    silenceMode: { status: 'idle', message: '' },
    serviceWorker: { status: 'idle', message: '' },
    pushTest: { status: 'idle', message: '' }
  });
  const [diagnosticRunning, setDiagnosticRunning] = useState(false);
  const [diagnosticCompleted, setDiagnosticCompleted] = useState(false);

  // ✅ Ouvrir diagnostic si demandé via navigation
  useEffect(() => {
    if (location.state?.openDiagnostic) {
      setShowDiagnostic(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

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

  // ✅ Lancer le diagnostic
  const runDiagnostic = async () => {
    setDiagnosticRunning(true);
    setDiagnosticCompleted(false);

    // Reset
    setDiagnosticResults({
      permission: { status: 'loading', message: 'Vérification...' },
      silenceMode: { status: 'loading', message: 'Vérification...' },
      serviceWorker: { status: 'loading', message: 'Vérification...' },
      pushTest: { status: 'loading', message: 'Vérification...' }
    });

    // Test 1: Permission
    await new Promise(resolve => setTimeout(resolve, 500));
    if (Notification.permission === 'granted') {
      setDiagnosticResults(prev => ({
        ...prev,
        permission: { status: 'success', message: 'Autorisées' }
      }));
    } else {
      setDiagnosticResults(prev => ({
        ...prev,
        permission: { status: 'error', message: 'Non autorisées' }
      }));
    }

    // Test 2: Mode silence
    await new Promise(resolve => setTimeout(resolve, 500));
    const modeSilence = localStorage.getItem('mode-silence') === 'true';
    setDiagnosticResults(prev => ({
      ...prev,
      silenceMode: { 
        status: modeSilence ? 'warning' : 'success', 
        message: modeSilence ? 'Activé' : 'Désactivé' 
      }
    }));

    // Test 3: Service Worker
    await new Promise(resolve => setTimeout(resolve, 500));
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        setDiagnosticResults(prev => ({
          ...prev,
          serviceWorker: { status: 'success', message: 'Actif' }
        }));
      } catch {
        setDiagnosticResults(prev => ({
          ...prev,
          serviceWorker: { status: 'error', message: 'Non disponible' }
        }));
      }
    } else {
      setDiagnosticResults(prev => ({
        ...prev,
        serviceWorker: { status: 'error', message: 'Non supporté' }
      }));
    }

    // Test 4: Push réel
    await new Promise(resolve => setTimeout(resolve, 500));
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        const response = await fetch('https://top14-api-production.up.railway.app/api/notifications/send-push-test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription })
        });

        if (response.ok) {
          setDiagnosticResults(prev => ({
            ...prev,
            pushTest: { status: 'success', message: 'Notification envoyée' }
          }));
        } else {
          setDiagnosticResults(prev => ({
            ...prev,
            pushTest: { status: 'error', message: 'Erreur serveur' }
          }));
        }
      } else {
        setDiagnosticResults(prev => ({
          ...prev,
          pushTest: { status: 'error', message: 'Pas de subscription' }
        }));
      }
    } catch (error) {
      setDiagnosticResults(prev => ({
        ...prev,
        pushTest: { status: 'error', message: 'Erreur test' }
      }));
    }

    setDiagnosticRunning(false);
    setDiagnosticCompleted(true);
  };

  const getStatusIcon = (status) => {
    if (status === 'loading') return <Loader className="w-5 h-5 animate-spin text-blue-500" />;
    if (status === 'success') return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (status === 'warning') return <AlertCircle className="w-5 h-5 text-orange-500" />;
    if (status === 'error') return <X className="w-5 h-5 text-red-500" />;
    return <AlertCircle className="w-5 h-5 text-gray-400" />;
  };

  const handleSignalerProbleme = () => {
    const resultsText = `
Résultats du diagnostic :
- Permission: ${diagnosticResults.permission.message}
- Mode silence: ${diagnosticResults.silenceMode.message}
- Service Worker: ${diagnosticResults.serviceWorker.message}
- Test push: ${diagnosticResults.pushTest.message}
    `.trim();

    const subject = 'Problème notifications push - Top 14 Pronos';
    const body = `
Bonjour,

Je rencontre un problème avec les notifications push.

${resultsText}

[Décrivez votre problème ici]

Merci.
    `.trim();

    window.location.href = `mailto:support@top14pronos.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="p-6 pb-24 max-w-2xl mx-auto">
      {/* Titre principal */}
      <h1 className="text-3xl font-bold text-rugby-gold mb-6">Paramètres</h1>

      {/* Infos utilisateur */}
      {user && (
        <div className="bg-gradient-to-r from-rugby-gold/10 to-rugby-orange/10 rounded-lg p-4 mb-4 border border-rugby-gold/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-rugby-gold flex items-center justify-center text-white font-bold text-lg">
              {user.user_metadata?.nom_complet?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <p className="font-bold text-gray-900">{user.user_metadata?.nom_complet || 'Utilisateur'}</p>
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Section Compte */}
      <div className="bg-white rounded-lg shadow-sm mb-4 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h2 className="text-sm font-bold text-gray-700 uppercase flex items-center gap-2">
            <User className="h-4 w-4" />
            Compte
          </h2>
        </div>

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

      {/* ✅ NOTIFICATIONS PUSH - CLIQUABLE */}
      <div className="bg-white rounded-lg shadow-sm mb-4 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h2 className="text-sm font-bold text-gray-700 uppercase flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </h2>
        </div>

        <button 
          onClick={() => navigate('/notifications-push')}
          className="w-full px-6 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
        >
          <Bell className="h-5 w-5 text-blue-500" />
          <span className="flex-1 text-left text-gray-800 font-medium">Notifications Push</span>
          <div className="flex items-center gap-2">
            {isSupported && permission === 'granted' && (
              <div className="flex items-center gap-1 text-green-600">
                <Check className="w-4 h-4" />
                <span className="text-xs font-medium">Activées</span>
              </div>
            )}
            {isSupported && permission === 'denied' && (
              <div className="flex items-center gap-1 text-red-600">
                <X className="w-4 h-4" />
                <span className="text-xs font-medium">Bloquées</span>
              </div>
            )}
            {isSupported && permission !== 'granted' && permission !== 'denied' && (
              <span className="text-xs text-gray-500">Désactivées</span>
            )}
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </div>
        </button>
      </div>

      {/* ✅ SECTION DIAGNOSTIC (SI OUVERTE) */}
      {showDiagnostic && (
        <div className="bg-white rounded-lg shadow-lg mb-4 overflow-hidden border-2 border-blue-500">
          <div className="px-4 py-3 bg-blue-500">
            <h2 className="text-sm font-bold text-white uppercase flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Diagnostic Notifications
            </h2>
          </div>

          <div className="p-4 space-y-3">
            {/* Test 1 */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="text-sm font-medium">Permissions téléphone</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(diagnosticResults.permission.status)}
                <span className="text-xs">{diagnosticResults.permission.message}</span>
              </div>
            </div>

            {/* Test 2 */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="text-sm font-medium">Mode silence app</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(diagnosticResults.silenceMode.status)}
                <span className="text-xs">{diagnosticResults.silenceMode.message}</span>
              </div>
            </div>

            {/* Test 3 */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="text-sm font-medium">Service Worker</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(diagnosticResults.serviceWorker.status)}
                <span className="text-xs">{diagnosticResults.serviceWorker.message}</span>
              </div>
            </div>

            {/* Test 4 */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="text-sm font-medium">Test notification push</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(diagnosticResults.pushTest.status)}
                <span className="text-xs">{diagnosticResults.pushTest.message}</span>
              </div>
            </div>

            {/* Boutons */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={runDiagnostic}
                disabled={diagnosticRunning}
                className="flex-1 bg-blue-500 text-white py-2 rounded font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {diagnosticRunning ? 'Test en cours...' : (diagnosticCompleted ? 'Relancer le diagnostic' : 'Lancer le diagnostic')}
              </button>
              
              <button
                onClick={() => setShowDiagnostic(false)}
                className="px-4 bg-gray-200 text-gray-700 py-2 rounded font-medium hover:bg-gray-300"
              >
                Fermer
              </button>
            </div>

            {/* Signaler un problème */}
            {diagnosticCompleted && (
              <button
                onClick={handleSignalerProbleme}
                className="w-full mt-2 bg-orange-100 text-orange-700 py-2 rounded text-sm font-medium hover:bg-orange-200"
              >
                📧 Signaler un problème
              </button>
            )}
          </div>
        </div>
      )}

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

