import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Cookie } from 'lucide-react'

function ConditionsGeneralesPage() {
  const navigate = useNavigate()
  const [showCookieBanner, setShowCookieBanner] = useState(false)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    const cookiesAccepted = localStorage.getItem('cookies-accepted')
    if (!cookiesAccepted) {
      setTimeout(() => setShowCookieBanner(true), 1000)
    }
  }, [])

  const handleAcceptCookies = () => {
    localStorage.setItem('cookies-accepted', 'true')
    setShowCookieBanner(false)
  }

  return (
    <div className="relative min-h-screen bg-gray-50 pb-24">
      <div className="fixed top-0 left-0 right-0 bg-rugby-gold shadow-md z-40 h-16"></div>

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
        <p className="text-sm text-gray-500 mb-1">
          Dernière mise à jour : 1er avril 2026
        </p>
        <p className="text-sm text-gray-500 mb-8">
          Responsable de l'application : Bernard PILLORE —{' '}
          <a href="mailto:pilpress31@gmail.com" className="text-rugby-gold underline">
            pilpress31@gmail.com
          </a>
        </p>

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">

          {/* 1. Acceptation */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">1. Acceptation des conditions</h2>
            <p className="text-gray-700 leading-relaxed">
              En accédant et en utilisant l'application web progressive (PWA) Top 14 Pronos, accessible à
              l'adresse <span className="font-medium">app.top14pronos.org</span>, vous acceptez d'être lié
              par les présentes conditions générales d'utilisation. Si vous n'acceptez pas ces conditions,
              veuillez ne pas utiliser l'application.
            </p>
          </section>

          {/* 2. Éditeur et hébergement */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">2. Éditeur et hébergement</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              L'application Top 14 Pronos est éditée par <span className="font-medium">Bernard PILLORE</span>,
              à titre personnel et non commercial.
            </p>
            <p className="text-gray-700 leading-relaxed mb-2">L'application est hébergée par :</p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>
                <span className="font-medium">Vercel</span> (interface utilisateur) —{' '}
                <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-rugby-gold underline">vercel.com</a>
              </li>
              <li>
                <span className="font-medium">Railway</span> (backend / API) —{' '}
                <a href="https://railway.app" target="_blank" rel="noopener noreferrer" className="text-rugby-gold underline">railway.app</a>
              </li>
              <li>
                <span className="font-medium">Supabase</span> (base de données) —{' '}
                <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-rugby-gold underline">supabase.com</a>
              </li>
              <li>
                <span className="font-medium">App Store / Google Play</span> — distribution mobile envisagée
                à terme, soumise aux conditions spécifiques de ces plateformes
              </li>
            </ul>
          </section>

          {/* 3. Description */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">3. Description du service</h2>
            <p className="text-gray-700 leading-relaxed mb-2">
              Top 14 Pronos est une application web progressive (PWA) de divertissement autour du rugby,
              accessible depuis un navigateur sans installation via un store. Elle permet de :
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>Consulter des pronostics générés par algorithme pour les matchs du Top 14</li>
              <li>Créer et gérer ses propres pronostics personnels</li>
              <li>Suivre le classement officiel du championnat</li>
              <li>Participer à un classement communautaire entre utilisateurs</li>
              <li>Simuler des paris virtuels avec calcul de gains potentiels</li>
            </ul>
          </section>

          {/* 4. Accès et tarifs */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">4. Accès au service et conditions tarifaires</h2>

            {/* Bêta-testeurs */}
            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4 rounded-r-lg">
              <p className="text-gray-700 font-semibold mb-2">🎉 Bêta-testeurs — Accès gratuit à vie</p>
              <p className="text-gray-700 leading-relaxed">
                Tous les utilisateurs ayant rejoint l'application avant le{' '}
                <span className="font-medium">1er septembre 2026</span> sont considérés comme
                bêta-testeurs et bénéficient d'un{' '}
                <span className="font-medium">accès complet et gratuit à vie</span> à toutes les
                fonctionnalités, y compris les futures évolutions. Cet avantage est personnel
                et non transmissible.
              </p>
            </div>

            {/* Phase bêta */}
            <p className="text-gray-700 leading-relaxed mb-4">
              Durant la phase bêta (saison 2025-2026), l'accès est réservé aux utilisateurs disposant
              d'un <span className="font-medium">code d'invitation</span> délivré par l'éditeur.
              Cette phase permet de tester et d'améliorer l'application avant son ouverture au grand public.
            </p>

            {/* Freemium */}
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4 rounded-r-lg">
              <p className="text-gray-700 font-semibold mb-2">📅 Modèle freemium — Saison 2026-2027</p>
              <p className="text-gray-700 leading-relaxed mb-2">
                À compter de la saison 2026-2027, l'accès pour les nouveaux utilisateurs
                fonctionnera comme suit :
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>
                  <span className="font-medium">1 mois d'essai gratuit et complet</span> à partir
                  de la date d'inscription, sans engagement ni carte bancaire
                </li>
                <li>
                  À l'issue de cette période, un{' '}
                  <span className="font-medium">abonnement saisonnier de 4,99 €</span> sera
                  nécessaire pour continuer à accéder à l'application
                </li>
                <li>
                  L'abonnement couvre une saison complète de Top 14 et n'est pas reconduit
                  automatiquement
                </li>
              </ul>
            </div>

            <p className="text-sm text-gray-500 leading-relaxed">
              Ces tarifs et conditions sont susceptibles d'évoluer. Les utilisateurs seront informés
              de tout changement au moins 30 jours avant son entrée en vigueur.
            </p>
          </section>

          {/* 5. Âge minimum */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">5. Âge minimum requis</h2>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
              <p className="text-gray-700 leading-relaxed">
                L'utilisation de Top 14 Pronos est réservée aux personnes âgées de{' '}
                <span className="font-bold">16 ans ou plus</span>, conformément au Règlement Général
                sur la Protection des Données (RGPD) européen. En vous inscrivant, vous confirmez
                avoir au moins 16 ans ou avoir obtenu l'accord de votre représentant légal.
              </p>
            </div>
          </section>

          {/* 6. Compte utilisateur */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">6. Compte utilisateur</h2>
            <p className="text-gray-700 leading-relaxed">
              Vous devez créer un compte pour utiliser l'application. Vous êtes responsable de la
              confidentialité de vos identifiants et de toutes les activités effectuées sous votre
              compte. Vous vous engagez à fournir des informations exactes et à les maintenir à jour.
            </p>
          </section>

          {/* 7. Propriété intellectuelle */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">7. Contenu et propriété intellectuelle</h2>
            <p className="text-gray-700 leading-relaxed">
              Tous les contenus de l'application (algorithmes, designs, textes, graphiques, code source)
              sont la propriété exclusive de Bernard PILLORE et sont protégés par les lois françaises et
              européennes sur la propriété intellectuelle. Toute reproduction, distribution, modification
              ou utilisation commerciale est strictement interdite sans autorisation écrite préalable.
            </p>
          </section>

          {/* 8. Nature des pronostics */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">8. Nature des pronostics</h2>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
              <p className="text-gray-700 font-semibold mb-2">⚠️ Important</p>
              <p className="text-gray-700 leading-relaxed">
                Les pronostics fournis sont générés par un algorithme à titre informatif et de
                divertissement uniquement. Ils ne constituent en aucun cas une garantie de résultat.
                Top 14 Pronos ne saurait être tenu responsable des décisions prises sur la base
                de ces pronostics. Les paris d'argent réel sont interdits dans l'application.
              </p>
            </div>
          </section>

          {/* 9. Paris virtuels */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">9. Paris virtuels et jeux d'argent</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              L'application propose un système de paris virtuels à des fins de divertissement uniquement.
              Aucun argent réel ne peut être misé ou gagné. Les gains virtuels (jetons) n'ont aucune
              valeur monétaire et ne peuvent être échangés contre de l'argent réel.
            </p>
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
              <p className="text-gray-700 leading-relaxed">
                <span className="font-semibold">Top 14 Pronos n'est pas un site de jeux d'argent</span>{' '}
                au sens de la loi n° 2010-476 du 12 mai 2010 relative à l'ouverture à la concurrence
                et à la régulation du secteur des jeux d'argent et de hasard en ligne. Aucune mise
                réelle n'est possible et aucun gain réel ne peut être obtenu via cette application.
              </p>
            </div>
          </section>

          {/* 10. RGPD */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">10. Données personnelles et vie privée (RGPD)</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Le responsable du traitement des données est{' '}
              <span className="font-medium">Bernard PILLORE</span>, joignable à{' '}
              <a href="mailto:pilpress31@gmail.com" className="text-rugby-gold underline">
                pilpress31@gmail.com
              </a>.
            </p>

            <p className="text-gray-700 font-medium mb-1">Données collectées :</p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4 mb-3">
              <li>Email et pseudonyme : pour la création et gestion de votre compte</li>
              <li>Pronostics personnels : stockés de manière sécurisée</li>
              <li>Statistiques d'utilisation : pour améliorer l'application</li>
              <li>Données de classement : pour le système communautaire</li>
            </ul>

            <p className="text-gray-700 font-medium mb-1">Base légale du traitement :</p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4 mb-3">
              <li>
                Votre <span className="font-medium">consentement</span> lors de l'inscription
                (art. 6.1.a RGPD)
              </li>
              <li>
                L'<span className="font-medium">exécution du service</span> auquel vous souscrivez
                (art. 6.1.b RGPD)
              </li>
            </ul>

            <p className="text-gray-700 font-medium mb-1">Durée de conservation :</p>
            <p className="text-gray-700 leading-relaxed mb-3">
              Vos données sont conservées pendant <span className="font-medium">3 ans</span> à compter
              de votre dernière activité. En cas de suppression de compte, vos données sont effacées
              sous 30 jours.
            </p>

            <p className="text-gray-700 font-medium mb-1">Vos droits :</p>
            <p className="text-gray-700 leading-relaxed">
              Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, d'effacement,
              de portabilité et d'opposition. Contactez{' '}
              <a href="mailto:pilpress31@gmail.com" className="text-rugby-gold underline">
                pilpress31@gmail.com
              </a>. Vous pouvez également adresser une réclamation à la{' '}
              <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-rugby-gold underline">
                CNIL
              </a>.
              Vos données ne sont jamais vendues à des tiers.
            </p>
          </section>

          {/* 11. Cookies */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">11. Cookies et technologies similaires</h2>
            <p className="text-gray-700 leading-relaxed mb-2">
              L'application utilise des cookies et technologies similaires pour améliorer votre expérience :
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>Cookies essentiels : pour le fonctionnement de base (authentification, session)</li>
              <li>Cookies de préférences : pour mémoriser vos paramètres</li>
              <li>Cookies analytiques : pour comprendre l'utilisation de l'app</li>
            </ul>
          </section>

          {/* 12. Limitation responsabilité */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">12. Limitation de responsabilité</h2>
            <p className="text-gray-700 leading-relaxed">
              L'application est fournie "en l'état". Nous ne garantissons pas que le service sera
              ininterrompu ou exempt d'erreurs. Nous ne sommes pas responsables des dommages directs
              ou indirects résultant de l'utilisation de l'application, ni des interruptions liées
              aux services tiers (Railway, Supabase, Vercel).
            </p>
          </section>

          {/* 13. Comportement interdit */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">13. Comportement interdit</h2>
            <p className="text-gray-700 leading-relaxed mb-2">Vous vous engagez à ne pas :</p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>Utiliser l'application à des fins illégales</li>
              <li>Tenter de contourner les mesures de sécurité ou le système d'invitation</li>
              <li>Partager vos identifiants ou votre code d'invitation avec d'autres personnes</li>
              <li>Utiliser des bots ou scripts automatisés</li>
              <li>Harceler ou insulter d'autres utilisateurs</li>
              <li>Tenter de reproduire, copier ou redistribuer l'application ou son code</li>
            </ul>
          </section>

          {/* 14. Modifications */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">14. Modifications des conditions</h2>
            <p className="text-gray-700 leading-relaxed">
              Nous nous réservons le droit de modifier ces conditions à tout moment. Pour les changements
              tarifaires, les utilisateurs seront informés au moins{' '}
              <span className="font-medium">30 jours avant</span> l'entrée en vigueur. Votre utilisation
              continue de l'application après modification constitue votre acceptation des nouvelles conditions.
            </p>
          </section>

          {/* 15. Résiliation */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">15. Résiliation</h2>
            <p className="text-gray-700 leading-relaxed">
              Vous pouvez supprimer votre compte à tout moment depuis les paramètres. Nous nous réservons
              le droit de suspendre ou supprimer votre compte en cas de violation de ces conditions.
              Le statut bêta-testeur et l'accès gratuit à vie associé sont perdus en cas de suppression
              volontaire du compte.
            </p>
          </section>

          {/* 16. Contact */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">16. Contact</h2>
            <p className="text-gray-700 leading-relaxed">
              Pour toute question concernant ces conditions ou vos données personnelles, contactez
              Bernard PILLORE à{' '}
              <a href="mailto:pilpress31@gmail.com" className="text-rugby-gold underline">
                pilpress31@gmail.com
              </a>{' '}
              ou via la section "Nous contacter" dans les paramètres de l'application.
            </p>
          </section>

          {/* 17. Droit applicable */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">17. Droit applicable</h2>
            <p className="text-gray-700 leading-relaxed">
              Ces conditions sont régies par le droit français. Tout litige sera soumis à la compétence
              des tribunaux français.
            </p>
          </section>

        </div>
      </div>

      {/* Cookie Banner */}
      {showCookieBanner && (
        <div className="fixed bottom-16 left-0 right-0 bg-gray-900 text-white p-4 shadow-2xl animate-slide-up z-50">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <Cookie className="h-6 w-6 text-yellow-400 flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold mb-1">🍪 Cookies et vie privée</p>
                <p className="text-sm text-gray-300">
                  Nous utilisons des cookies essentiels pour le fonctionnement de l'application
                  et améliorer votre expérience.
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
