import { useNavigate } from 'react-router-dom'
import { ArrowLeft, AlertTriangle, Wifi, RefreshCw, User, Bell, Database } from 'lucide-react'

function SignalerBugPage() {
  const navigate = useNavigate()

  const bugs = [
    {
      id: 1,
      icon: Wifi,
      titre: "Problème de connexion",
      description: "L'application ne parvient pas à se connecter au serveur. Les pronostics ne se chargent pas ou le classement n'est pas à jour.",
      details: "Vérifiez votre connexion Internet. Si le problème persiste, le serveur peut être temporairement indisponible."
    },
    {
      id: 2,
      icon: User,
      titre: "Problème de connexion au compte",
      description: "Impossible de se connecter avec vos identifiants, erreur lors de la création de compte, ou déconnexion intempestive.",
      details: "Vérifiez que votre email et mot de passe sont corrects. Essayez la récupération de mot de passe si nécessaire."
    },
    {
      id: 3,
      icon: RefreshCw,
      titre: "Données non synchronisées",
      description: "Vos pronostics personnels, favoris ou statistiques ne sont pas sauvegardés ou ne s'affichent pas correctement.",
      details: "Assurez-vous d'être connecté avec votre compte. Fermez et rouvrez l'application pour forcer la synchronisation."
    },
    {
      id: 4,
      icon: Bell,
      titre: "Notifications non reçues",
      description: "Vous ne recevez pas les notifications push pour les nouveaux matchs, résultats ou mises à jour du classement.",
      details: "Vérifiez que les notifications sont autorisées dans les paramètres de votre téléphone et dans l'application."
    },
    {
      id: 5,
      icon: Database,
      titre: "Erreur de calcul des points",
      description: "Vos points de pronostics ne sont pas calculés correctement ou le classement communautaire affiche des valeurs incorrectes.",
      details: "Les calculs peuvent prendre quelques minutes après la fin d'un match. Si le problème persiste après 24h, signalez-le."
    },
    {
      id: 6,
      icon: AlertTriangle,
      titre: "Plantage ou erreur générale",
      description: "L'application se ferme subitement, affiche des messages d'erreur ou certaines fonctionnalités ne répondent plus.",
      details: "Essayez de redémarrer l'application. Si cela se reproduit, videz le cache de l'application dans les paramètres du téléphone."
    }
  ]

  const handleBugClick = (bug) => {
    const subject = `Bug: ${bug.titre}`
    const body = `
Bonjour,

Je rencontre le problème suivant dans l'application Top 14 Pronos :

Type de problème : ${bug.titre}
Description : ${bug.description}

Informations complémentaires :
- Téléphone : [Indiquez votre modèle]
- Version OS : [iOS/Android + version]
- Quand le problème survient : [Décrivez le contexte]

Merci de votre aide.
    `.trim()

    // Ouvrir l'application email du téléphone
    window.location.href = `mailto:support@top14pronos.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-4xl mx-auto p-6">
        {/* Bouton retour */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-rugby-gold hover:text-rugby-orange mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-sm font-semibold">Retour</span>
        </button>

        {/* Titre */}
        <h1 className="text-3xl font-bold text-rugby-gold mb-2">Signaler un dysfonctionnement</h1>
        <p className="text-gray-600 mb-8">
          Sélectionnez le type de problème rencontré pour nous l'envoyer par email
        </p>

        {/* Liste des bugs */}
        <div className="space-y-4">
          {bugs.map((bug) => {
            const Icon = bug.icon
            return (
              <button
                key={bug.id}
                onClick={() => handleBugClick(bug)}
                className="w-full bg-white rounded-lg shadow-sm p-5 text-left hover:shadow-md transition-shadow border border-gray-100 hover:border-rugby-gold"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-red-50 p-3 rounded-lg flex-shrink-0">
                    <Icon className="h-6 w-6 text-red-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800 mb-2">{bug.titre}</h3>
                    <p className="text-sm text-gray-600 mb-2">{bug.description}</p>
                    <p className="text-xs text-gray-500 italic">{bug.details}</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Note */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            ℹ️ <strong>Bon à savoir :</strong> En cliquant sur un problème, votre application email s'ouvrira 
            automatiquement avec un modèle pré-rempli. N'oubliez pas de compléter les informations demandées 
            (modèle de téléphone, version OS, etc.) pour nous aider à mieux diagnostiquer le problème.
          </p>
        </div>
      </div>
    </div>
  )
}

export default SignalerBugPage
