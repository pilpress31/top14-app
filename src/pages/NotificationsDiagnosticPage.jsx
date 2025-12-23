import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, Settings, Smartphone, Bell, Send, PlayCircle } from 'lucide-react'

function NotificationsDiagnosticPage() {
  const navigate = useNavigate()
  const [diagnosticRun, setDiagnosticRun] = useState(false)
  const [testResults, setTestResults] = useState({
    phoneSettings: null,
    appSettings: null,
    registration: null,
    testNotification: null
  })

  const handleRunDiagnostic = async () => {
    setDiagnosticRun(true)
    
    // Simuler les tests (à remplacer par de vrais tests plus tard)
    
    // Test 1 : Paramètres du téléphone
    setTimeout(() => {
      // Vérifier si les notifications sont autorisées
      const notificationPermission = 'Notification' in window ? Notification.permission : 'denied'
      setTestResults(prev => ({
        ...prev,
        phoneSettings: notificationPermission === 'granted' ? 'success' : 'error'
      }))
    }, 500)
    
    // Test 2 : Paramètres de l'application
    setTimeout(() => {
      // Vérifier le mode silence dans localStorage
      const modeSilence = localStorage.getItem('mode-silence') === 'true'
      setTestResults(prev => ({
        ...prev,
        appSettings: modeSilence ? 'error' : 'success'
      }))
    }, 1000)
    
    // Test 3 : Enregistrement de l'identifiant
    setTimeout(() => {
      // Vérifier si l'utilisateur est authentifié (simulé)
      setTestResults(prev => ({
        ...prev,
        registration: 'success'
      }))
    }, 1500)
    
    // Test 4 : Envoyer une notification de test
    setTimeout(() => {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Top 14 Pronos', {
          body: 'Test de notification réussi ✅',
          icon: '/logo.png'
        })
        setTestResults(prev => ({
          ...prev,
          testNotification: 'success'
        }))
      } else {
        setTestResults(prev => ({
          ...prev,
          testNotification: 'error'
        }))
      }
    }, 2000)
  }

  const handleReportProblem = () => {
    const subject = 'Problème de notifications push'
    const body = `
Bonjour,

Je rencontre un problème avec les notifications push de l'application Top 14 Pronos.

Résultats du diagnostic :
- Paramètres du téléphone : ${testResults.phoneSettings === 'success' ? '✅ OK' : '❌ Erreur'}
- Paramètres de l'application : ${testResults.appSettings === 'success' ? '✅ OK' : '❌ Erreur'}
- Enregistrement de l'identifiant : ${testResults.registration === 'success' ? '✅ OK' : '❌ Erreur'}
- Notification de test : ${testResults.testNotification === 'success' ? '✅ OK' : '❌ Erreur'}

Informations système :
- Téléphone : [Indiquez votre modèle]
- Version OS : [iOS/Android + version]

Description du problème :
[Décrivez précisément votre problème]

Merci de votre aide.
    `.trim()

    window.location.href = `mailto:support@top14pronos.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  const hasErrors = diagnosticRun && (
    testResults.phoneSettings === 'error' ||
    testResults.appSettings === 'error' ||
    testResults.registration === 'error' ||
    testResults.testNotification === 'error'
  )

  const diagnosticItems = [
    {
      id: 1,
      icon: Settings,
      titre: "Paramètres du téléphone",
      description: "Vérification que les notifications sont autorisées pour Top 14 Pronos dans les paramètres de votre téléphone",
      status: testResults.phoneSettings
    },
    {
      id: 2,
      icon: Smartphone,
      titre: "Paramètres de l'application",
      description: "Vérification que le mode silence n'est pas activé et que les notifications push sont configurées",
      status: testResults.appSettings
    },
    {
      id: 3,
      icon: Bell,
      titre: "Enregistrement de l'identifiant",
      description: "Votre appareil doit être enregistré pour recevoir les notifications. Cela se fait automatiquement à la première connexion",
      status: testResults.registration
    },
    {
      id: 4,
      icon: Send,
      titre: "Notification de test",
      description: "Envoi d'une notification de test pour vérifier que tout fonctionne correctement",
      status: testResults.testNotification
    }
  ]

  const getStatusIcon = (status) => {
    if (!status) return null
    if (status === 'success') return <CheckCircle className="h-5 w-5 text-green-500" />
    if (status === 'error') return <XCircle className="h-5 w-5 text-red-500" />
    return null
  }

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
        <h1 className="text-3xl font-bold text-rugby-gold mb-2 text-center">Diagnostic</h1>
        <p className="text-gray-600 text-center mb-8">
          Si vous rencontrez des problèmes avec les notifications, vous pouvez utiliser cet outil de diagnostic
        </p>

        {/* Items de diagnostic */}
        <div className="space-y-4 mb-6">
          {diagnosticItems.map((item) => {
            const Icon = item.icon
            
            return (
              <div key={item.id} className="bg-white rounded-lg shadow-sm p-5">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg flex-shrink-0">
                    <Icon className="h-6 w-6 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-gray-800">{item.titre}</h3>
                      {getStatusIcon(item.status)}
                    </div>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Bouton Lancer le diagnostic */}
        <button
          onClick={handleRunDiagnostic}
          disabled={diagnosticRun}
          className={`w-full mb-4 py-4 rounded-lg font-bold text-white transition-colors flex items-center justify-center gap-3 ${
            diagnosticRun 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-rugby-gold hover:bg-rugby-orange'
          }`}
        >
          <PlayCircle className="h-5 w-5" />
          {diagnosticRun ? 'Diagnostic terminé' : 'Lancer le diagnostic'}
        </button>

        {/* Signaler un problème (cliquable seulement si erreurs) */}
        <div 
          className={`border rounded-lg p-6 transition-all ${
            hasErrors 
              ? 'bg-red-50 border-red-200 cursor-pointer hover:bg-red-100' 
              : 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-60'
          }`}
          onClick={hasErrors ? handleReportProblem : undefined}
        >
          <h3 className="font-bold text-gray-800 mb-2">Signaler un problème</h3>
          <p className="text-sm text-gray-700 mb-3">
            {hasErrors 
              ? 'Des erreurs ont été détectées. Cliquez ici pour nous signaler le problème par email.'
              : 'Lancez d\'abord le diagnostic. Si des erreurs sont détectées, vous pourrez les signaler.'}
          </p>
          {hasErrors && (
            <div className="flex items-center gap-2 text-red-600 font-semibold text-sm">
              <Send className="h-4 w-4" />
              Envoyer le rapport par email
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default NotificationsDiagnosticPage
