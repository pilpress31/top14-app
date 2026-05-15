import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Cookie } from 'lucide-react'

function ConditionsGeneralesPage() {
  const navigate = useNavigate()
  const [showCookieBanner, setShowCookieBanner] = useState(false)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    // Vérifier si l'utilisateur a déjà accepté les cookies
    
    const cookiesAccepted = localStorage.getItem('cookies-accepted')
    if (!cookiesAccepted) {
      // Afficher le banner après 1 seconde
      setTimeout(() => setShowCookieBanner(true), 1000)
    }
  }, [])

  const handleAcceptCookies = () => {
    localStorage.setItem('cookies-accepted', 'true')
    setShowCookieBanner(false)
  }

  return (
    <div className="relative min-h-screen bg-gray-50 pb-24">
      {/* Bandeau supérieur rugby-gold */}
      <div className="fixed top-0 left-0 right-0 bg-rugby-gold shadow-md z-40 h-16"></div>

      {/* Bouton retour FIXÉ dans le bandeau */}
      <button
        onClick={() => navigate(-1)}
        className="fixed top-4 left-4 z-50 flex items-center gap-2 text-white hover:text-gray-100 transition-colors"
      >
        <ArrowLeft className="h-6 w-6" />
        <span className="text-sm font-semibold">Retour</span>
      </button>

      <div className="max-w-4xl mx-auto p-6 pt-24">
        <h1 className="text-3xl font-bold text-rugby-gold mb-2">
          Conditions Générales d'Utilisation
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
        </p>

        {/* Contenu */}
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {/* 1. Acceptation des conditions */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">1. Acceptation des conditions</h2>
            <p className="text-gray-700 leading-relaxed">
              En téléchargeant et en utilisant l'application Top 14 Pronos, vous acceptez d'être lié par les présentes 
              conditions générales d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser l'application.
            </p>
          </section>

          {/* 2. Description du service */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">2. Description du service</h2>
            <p className="text-gray-700 leading-relaxed mb-2">
              Top 14 Pronos est une application mobile qui permet de :
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>Consulter des pronostics générés par algorithme pour les matchs du Top 14</li>
              <li>Créer et gérer ses propres pronostics personnels</li>
              <li>Suivre le classement officiel du championnat</li>
              <li>Participer à un classement communautaire entre utilisateurs</li>
              <li>Simuler des paris virtuels avec calcul de gains potentiels</li>
            </ul>
          </section>

          {/* 3. Achat et accès */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">3. Achat et accès</h2>
            <p className="text-gray-700 leading-relaxed">
              L'application est disponible à l'achat unique sur l'App Store et le Google Play Store. 
              L'achat vous donne un accès à vie aux fonctionnalités de l'application, sans abonnement mensuel. 
              Aucun remboursement ne sera effectué après l'achat, conformément aux politiques des stores.
            </p>
          </section>

          {/* 4. Compte utilisateur */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">4. Compte utilisateur</h2>
            <p className="text-gray-700 leading-relaxed">
              Vous devez créer un compte pour utiliser l'application. Vous êtes responsable de la confidentialité 
              de vos identifiants et de toutes les activités effectuées sous votre compte. Vous vous engagez à 
              fournir des informations exactes et à les maintenir à jour.
            </p>
          </section>

          {/* 5. Contenu et propriété intellectuelle */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">5. Contenu et propriété intellectuelle</h2>
            <p className="text-gray-700 leading-relaxed">
              Tous les contenus de l'application (algorithmes, designs, textes, graphiques) sont la propriété 
              exclusive de Top 14 Pronos et sont protégés par les lois sur la propriété intellectuelle. 
              Toute reproduction, distribution ou utilisation commerciale est strictement interdite sans autorisation.
            </p>
          </section>

          {/* 6. Nature des pronostics */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">6. Nature des pronostics</h2>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <p className="text-gray-700 font-semibold mb-2">⚠️ Important</p>
              <p className="text-gray-700 leading-relaxed">
                Les pronostics fournis sont générés par un algorithme à titre informatif et de divertissement uniquement. 
                Ils ne constituent en aucun cas une garantie de résultat. Top 14 Pronos ne saurait être tenu responsable 
                des décisions prises sur la base de ces pronostics. Les paris d'argent réel sont interdits dans l'application.
              </p>
            </div>
          </section>

          {/* 7. Paris virtuels */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">7. Paris virtuels</h2>
            <p className="text-gray-700 leading-relaxed">
              L'application propose un système de paris virtuels à des fins de divertissement uniquement. 
              Aucun argent réel ne peut être misé ou gagné. Les gains virtuels n'ont aucune valeur monétaire 
              et ne peuvent être échangés contre de l'argent réel.
            </p>
          </section>

          {/* 8. Données personnelles */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">8. Données personnelles et vie privée</h2>
            <p className="text-gray-700 leading-relaxed mb-2">
              Nous collectons et utilisons vos données personnelles conformément au RGPD :
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>Email et nom : pour la création et gestion de votre compte</li>
              <li>Pronostics personnels : stockés de manière sécurisée</li>
              <li>Statistiques d'utilisation : pour améliorer l'application</li>
              <li>Données de classement : pour le système communautaire</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-2">
              Vos données ne sont jamais vendues à des tiers. Vous pouvez demander leur suppression à tout moment 
              en supprimant votre compte depuis les paramètres.
            </p>
          </section>

          {/* 9. Cookies */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">9. Cookies et technologies similaires</h2>
            <p className="text-gray-700 leading-relaxed">
              L'application utilise des cookies et technologies similaires pour améliorer votre expérience :
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4 mt-2">
              <li>Cookies essentiels : pour le fonctionnement de base (authentification, session)</li>
              <li>Cookies de préférences : pour mémoriser vos paramètres</li>
              <li>Cookies analytiques : pour comprendre l'utilisation de l'app</li>
            </ul>
          </section>

          {/* 10. Responsabilités */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">10. Limitation de responsabilité</h2>
            <p className="text-gray-700 leading-relaxed">
              L'application est fournie "en l'état". Nous ne garantissons pas que le service sera ininterrompu ou exempt d'erreurs. 
              Nous ne sommes pas responsables des dommages directs ou indirects résultant de l'utilisation de l'application.
            </p>
          </section>

          {/* 11. Comportement des utilisateurs */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">11. Comportement interdit</h2>
            <p className="text-gray-700 leading-relaxed mb-2">
              Vous vous engagez à ne pas :
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>Utiliser l'application à des fins illégales</li>
              <li>Tenter de contourner les mesures de sécurité</li>
              <li>Partager vos identifiants avec d'autres personnes</li>
              <li>Utiliser des bots ou scripts automatisés</li>
              <li>Harceler ou insulter d'autres utilisateurs</li>
            </ul>
          </section>

          {/* 12. Modifications */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">12. Modifications des conditions</h2>
            <p className="text-gray-700 leading-relaxed">
              Nous nous réservons le droit de modifier ces conditions à tout moment. Les modifications seront 
              notifiées via l'application et entreront en vigueur immédiatement. Votre utilisation continue 
              de l'application après modification constitue votre acceptation des nouvelles conditions.
            </p>
          </section>

          {/* 13. Résiliation */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">13. Résiliation</h2>
            <p className="text-gray-700 leading-relaxed">
              Vous pouvez supprimer votre compte à tout moment depuis les paramètres. Nous nous réservons 
              le droit de suspendre ou supprimer votre compte en cas de violation de ces conditions, 
              sans remboursement.
            </p>
          </section>

          {/* 14. Contact */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">14. Contact</h2>
            <p className="text-gray-700 leading-relaxed">
              Pour toute question concernant ces conditions, vous pouvez nous contacter via la section 
              "Nous contacter" dans les paramètres de l'application.
            </p>
          </section>

          {/* 15. Droit applicable */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">15. Droit applicable</h2>
            <p className="text-gray-700 leading-relaxed">
              Ces conditions sont régies par le droit français. Tout litige sera soumis aux tribunaux compétents.
            </p>
          </section>
        </div>
      </div>

      {/* Cookie Banner */}
      {showCookieBanner && (
        <div className="fixed left-0 right-0 bg-gray-900 text-white p-4 shadow-2xl animate-slide-up z-50" style={{ bottom: "calc(4rem + env(safe-area-inset-bottom, 0px))" }}>
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <Cookie className="h-6 w-6 text-yellow-400 flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold mb-1">🍪 Cookies et vie privée</p>
                <p className="text-sm text-gray-300">
                  Nous utilisons des cookies essentiels pour le fonctionnement de l'application et améliorer votre expérience.
                </p>
              </div>
            </div>
            <button
              onClick={handleAcceptCookies}
              className="bg-rugby-gold hover:bg-rugby-orange text-white font-bold px-6 py-2 rounded-lg transition-colors flex-shrink-0"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ConditionsGeneralesPage
