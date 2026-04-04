import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scale, ArrowLeft, FileText, Shield } from 'lucide-react';

export default function CGUPage() {
  
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  return (
    <div className="min-h-screen bg-rugby-white pb-24">
      {/* Bandeau rugby-gold fixe en haut */}
      <div className="fixed top-0 left-0 right-0 bg-rugby-gold text-white shadow-md z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-white hover:text-gray-100 transition mb-3"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-semibold">Retour</span>
          </button>
          
          <div className="flex items-center justify-center gap-3 mb-2">
            <Scale className="w-8 h-8 text-white" />
            <h1 className="text-2xl md:text-3xl font-bold">Conditions Générales d'Utilisation</h1>
          </div>
          
          <p className="text-gray-100 text-sm text-center">
            Dernière mise à jour : 1er avril 2026
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 pt-48">

        {/* Préambule */}
        <section className="bg-blue-50 rounded-xl p-6 border-2 border-blue-300">
          <h2 className="text-xl font-bold text-blue-900 mb-3 flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Préambule
          </h2>
          <p className="text-gray-800 leading-relaxed">
            Les présentes Conditions Générales d'Utilisation (ci-après "CGU") régissent l'utilisation
            de l'application web progressive <strong>TOP 14 PRONOS</strong> (ci-après "l'Application"),
            accessible à l'adresse <strong>app.top14pronos.org</strong>.
            En utilisant l'Application, vous acceptez sans réserve les présentes CGU.
          </p>
        </section>

        {/* Encart bêta-testeurs */}
        <section className="bg-green-50 rounded-xl p-6 border-2 border-green-400">
          <h2 className="text-xl font-bold text-green-800 mb-3 flex items-center gap-2">
            🎉 Phase Bêta — Accès gratuit à vie
          </h2>
          <p className="text-gray-800 leading-relaxed mb-2">
            Tous les utilisateurs ayant rejoint l'application avant le{' '}
            <strong>1er septembre 2026</strong> sont considérés comme <strong>bêta-testeurs</strong> et
            bénéficient d'un <strong>accès complet et gratuit à vie</strong> à toutes les fonctionnalités,
            y compris les futures évolutions. Cet avantage est personnel et non transmissible.
          </p>
          <p className="text-gray-700 text-sm">
            Durant cette phase, l'accès est réservé aux utilisateurs disposant d'un{' '}
            <strong>code d'invitation</strong> délivré par l'éditeur.
          </p>
        </section>

        {/* Articles */}
        <div className="space-y-6">

          {/* Article 1 */}
          <article className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <h2 className="text-lg font-bold text-rugby-gold mb-3">
              ARTICLE 1 - Éditeur et hébergement
            </h2>
            <div className="text-gray-700 space-y-2">
              <p>
                L'Application <strong>TOP 14 PRONOS</strong> est éditée par{' '}
                <strong>Bernard PILLORE</strong>, à titre personnel et non commercial.
              </p>
              <p>
                <strong>Contact :</strong>{' '}
                <a href="mailto:pilpress31@gmail.com" className="text-blue-600 underline">
                  pilpress31@gmail.com
                </a>
              </p>
              <p className="mt-2">L'application est hébergée par :</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong>Vercel</strong> — interface utilisateur (vercel.com)</li>
                <li><strong>Railway</strong> — backend / API (railway.app)</li>
                <li><strong>Supabase</strong> — base de données (supabase.com)</li>
              </ul>
              <p className="text-sm text-gray-500 mt-2">
                Une distribution via l'App Store et/ou Google Play est envisagée à terme,
                ce qui pourrait entraîner des conditions spécifiques propres à ces plateformes.
              </p>
            </div>
          </article>

          {/* Article 2 */}
          <article className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <h2 className="text-lg font-bold text-rugby-gold mb-3">
              ARTICLE 2 - Objet de l'Application
            </h2>
            <div className="text-gray-700 space-y-2">
              <p>L'Application <strong>TOP 14 PRONOS</strong> propose les services suivants :</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>
                  <strong>Prédictions statistiques</strong> de scores de matchs de Top 14,
                  générées par un algorithme propriétaire basé sur des données historiques
                </li>
                <li>
                  <strong>Jeu de pronostics gratuit</strong> entre utilisateurs avec système
                  de classement par points
                </li>
                <li>
                  <strong>Simulation de paris</strong> en monnaie virtuelle sans valeur monétaire réelle
                </li>
                <li>
                  <strong>Consultation de l'historique</strong> des matchs et des prédictions passées
                </li>
              </ul>
            </div>
          </article>

          {/* Article 3 */}
          <article className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <h2 className="text-lg font-bold text-rugby-gold mb-3">
              ARTICLE 3 - Accès au service et conditions tarifaires
            </h2>
            <div className="text-gray-700 space-y-3">

              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                <p className="font-semibold text-green-900 mb-1">Bêta-testeurs (avant le 1er septembre 2026)</p>
                <p>Accès complet et gratuit à vie. Personnel et non transmissible. Perdu en cas de
                suppression volontaire du compte.</p>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                <p className="font-semibold text-blue-900 mb-1">Nouveaux utilisateurs — Saison 2026-2027</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>
                    <strong>1 mois d'essai gratuit et complet</strong> à partir de la date d'inscription,
                    sans engagement ni carte bancaire
                  </li>
                  <li>
                    À l'issue de cette période : <strong>abonnement saisonnier de 4,99 €</strong> pour
                    continuer à accéder à l'application
                  </li>
                  <li>
                    L'abonnement couvre une saison complète de Top 14 et n'est <strong>pas reconduit
                    automatiquement</strong>
                  </li>
                </ul>
              </div>

              <p className="text-sm text-gray-500">
                Ces tarifs sont susceptibles d'évoluer. Les utilisateurs seront informés de tout
                changement au moins <strong>30 jours avant</strong> son entrée en vigueur.
              </p>
            </div>
          </article>

          {/* Article 4 */}
          <article className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <h2 className="text-lg font-bold text-rugby-gold mb-3">
              ARTICLE 4 - Âge minimum requis
            </h2>
            <div className="text-gray-700 space-y-2">
              <p>
                L'utilisation de TOP 14 PRONOS est réservée aux personnes âgées de{' '}
                <strong>16 ans ou plus</strong>, conformément au Règlement Général sur la Protection
                des Données (RGPD) européen.
              </p>
              <p>
                En vous inscrivant, vous confirmez avoir au moins 16 ans ou avoir obtenu l'accord
                de votre représentant légal.
              </p>
            </div>
          </article>

          {/* Article 5 */}
          <article className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <h2 className="text-lg font-bold text-rugby-gold mb-3">
              ARTICLE 5 - Nature du service — Clause de non-responsabilité
            </h2>
            <div className="text-gray-700 space-y-3">
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                <p className="font-semibold text-yellow-900 mb-2">⚠️ Important :</p>
                <p>L'Application ne propose <strong>PAS</strong> :</p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>De paris en argent réel</li>
                  <li>De liens d'affiliation vers des sites de paris sportifs</li>
                  <li>De garantie de gains sur des paris réels</li>
                  <li>De conseils en investissement</li>
                </ul>
              </div>

              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                <p className="text-gray-800">
                  <strong>TOP 14 PRONOS n'est pas un site de jeux d'argent</strong> au sens de la
                  loi n° 2010-476 du 12 mai 2010 relative à l'ouverture à la concurrence et à la
                  régulation du secteur des jeux d'argent et de hasard en ligne. Aucune mise réelle
                  n'est possible et aucun gain réel ne peut être obtenu via cette application.
                </p>
              </div>

              <p>
                Les prédictions fournies sont le résultat d'un{' '}
                <strong>traitement statistique automatisé</strong> et sont fournies{' '}
                <strong>à titre purement informatif et de divertissement</strong>.
              </p>
            </div>
          </article>

          {/* Article 6 */}
          <article className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <h2 className="text-lg font-bold text-rugby-gold mb-3">
              ARTICLE 6 - Usage des prédictions
            </h2>
            <div className="text-gray-700 space-y-3">
              <p>
                L'Utilisateur reconnaît que les prédictions sont basées sur des modèles statistiques
                qui, bien que rigoureux,{' '}
                <strong>ne peuvent garantir l'exactitude des résultats futurs</strong>.
              </p>
              <p>
                L'Utilisateur est <strong>seul responsable</strong> de l'usage qu'il fait des
                informations fournies par l'Application.
              </p>
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mt-4">
                <p className="font-semibold text-red-900">
                  Si l'Utilisateur décide de parier en argent réel sur des sites de paris sportifs :
                </p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1 text-red-800">
                  <li>Il doit utiliser exclusivement des sites agréés par l'ANJ (Autorité Nationale des Jeux)</li>
                  <li>Il le fait sous sa propre responsabilité et à ses propres risques</li>
                  <li>L'éditeur ne saurait être tenu responsable des pertes financières</li>
                  <li>
                    Les paris comportent un risque de dépendance — Aide :{' '}
                    <a href="tel:09-74-75-13-13" className="underline">09 74 75 13 13</a>
                  </li>
                </ul>
              </div>
            </div>
          </article>

          {/* Article 7 */}
          <article className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <h2 className="text-lg font-bold text-rugby-gold mb-3">
              ARTICLE 7 - Jeu communautaire et classement
            </h2>
            <div className="text-gray-700 space-y-2">
              <p>
                Le jeu de pronostics entre utilisateurs est <strong>entièrement gratuit</strong>.
                Aucun enjeu financier n'est associé au classement.
              </p>
              <p>
                Les points attribués n'ont <strong>aucune valeur monétaire</strong> et ne peuvent
                être convertis en argent réel.
              </p>
              <p>
                L'éditeur se réserve le droit de modifier les règles du jeu communautaire
                en informant préalablement les utilisateurs.
              </p>
            </div>
          </article>

          {/* Article 8 */}
          <article className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <h2 className="text-lg font-bold text-rugby-gold mb-3">
              ARTICLE 8 - Simulation de paris (Portefeuille virtuel)
            </h2>
            <div className="text-gray-700 space-y-2">
              <p>
                Le mode "Simulation de paris" permet aux utilisateurs de tester des stratégies
                avec une <strong>monnaie virtuelle fictive</strong> (jetons).
              </p>
              <div className="bg-blue-50 border border-blue-300 p-4 rounded">
                <p className="font-semibold text-blue-900 mb-2">Caractéristiques :</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>La monnaie virtuelle n'a <strong>aucune valeur réelle</strong></li>
                  <li>Elle ne peut être <strong>ni achetée, ni vendue, ni convertie</strong> en argent réel</li>
                  <li>Les cotes affichées sont calculées sur nos statistiques historiques et{' '}
                    <strong>n'ont aucun lien avec des bookmakers réels</strong>
                  </li>
                  <li>Ce mode est purement <strong>éducatif et ludique</strong></li>
                </ul>
              </div>
            </div>
          </article>

          {/* Article 9 */}
          <article className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <h2 className="text-lg font-bold text-rugby-gold mb-3">
              ARTICLE 9 - Propriété intellectuelle
            </h2>
            <div className="text-gray-700 space-y-2">
              <p>
                L'ensemble des éléments de l'Application (algorithme, base de données, design,
                textes, logos, code source) sont la <strong>propriété exclusive</strong> de
                Bernard PILLORE et sont protégés par les lois relatives à la propriété intellectuelle.
              </p>
              <p>
                Toute reproduction, représentation, modification ou exploitation non autorisée
                est strictement interdite et constitue une contrefaçon sanctionnée par le Code
                de la propriété intellectuelle.
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Revendues ou commercialisées</li>
                <li>Redistribuées à grande échelle</li>
                <li>Utilisées à des fins commerciales sans autorisation écrite préalable</li>
              </ul>
            </div>
          </article>

          {/* Article 10 */}
          <article className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <h2 className="text-lg font-bold text-rugby-gold mb-3">
              ARTICLE 10 - Données personnelles (RGPD)
            </h2>
            <div className="text-gray-700 space-y-3">
              <p>
                Le responsable du traitement des données est <strong>Bernard PILLORE</strong>,
                joignable à{' '}
                <a href="mailto:pilpress31@gmail.com" className="text-blue-600 underline">
                  pilpress31@gmail.com
                </a>.
              </p>

              <p className="font-medium">Données collectées :</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Email et pseudonyme : pour la création et gestion de votre compte</li>
                <li>Pronostics personnels : stockés de manière sécurisée</li>
                <li>Statistiques d'utilisation : pour améliorer l'application</li>
                <li>Données de classement : pour le système communautaire</li>
              </ul>

              <p className="font-medium">Base légale du traitement :</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Votre <strong>consentement</strong> lors de l'inscription (art. 6.1.a RGPD)</li>
                <li>L'<strong>exécution du service</strong> auquel vous souscrivez (art. 6.1.b RGPD)</li>
              </ul>

              <p>
                Vos données sont conservées pendant <strong>3 ans</strong> à compter de votre
                dernière activité. En cas de suppression de compte, elles sont effacées sous 30 jours.
              </p>

              <p>
                Conformément au RGPD, vous disposez d'un droit d'accès, de rectification,
                d'effacement, de portabilité et d'opposition. Vous pouvez également adresser
                une réclamation à la{' '}
                <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer"
                  className="text-blue-600 underline">CNIL</a>.
                Les données ne sont <strong>jamais vendues</strong> à des tiers.
              </p>
            </div>
          </article>

          {/* Article 11 */}
          <article className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <h2 className="text-lg font-bold text-rugby-gold mb-3">
              ARTICLE 11 - Limitation de responsabilité
            </h2>
            <div className="text-gray-700 space-y-2">
              <p>L'éditeur ne saurait être tenu responsable :</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Des pertes financières résultant de paris placés par l'Utilisateur</li>
                <li>De l'inexactitude des prédictions fournies</li>
                <li>Des interruptions temporaires du service</li>
                <li>Des bugs ou dysfonctionnements techniques</li>
                <li>Des interruptions liées aux services tiers (Railway, Supabase, Vercel)</li>
                <li>De l'usage abusif ou frauduleux de l'Application par des tiers</li>
              </ul>
              <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded mt-3">
                <p className="font-semibold text-orange-900">
                  🔒 L'Utilisateur s'engage à utiliser l'Application de manière responsable et légale.
                </p>
              </div>
            </div>
          </article>

          {/* Article 12 */}
          <article className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <h2 className="text-lg font-bold text-rugby-gold mb-3">
              ARTICLE 12 - Comportement interdit
            </h2>
            <div className="text-gray-700 space-y-2">
              <p>Vous vous engagez à ne pas :</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Utiliser l'application à des fins illégales</li>
                <li>Tenter de contourner les mesures de sécurité ou le système d'invitation</li>
                <li>Partager vos identifiants ou votre code d'invitation avec d'autres personnes</li>
                <li>Utiliser des bots ou scripts automatisés</li>
                <li>Harceler ou insulter d'autres utilisateurs</li>
                <li>Tenter de reproduire, copier ou redistribuer l'application ou son code</li>
              </ul>
            </div>
          </article>

          {/* Article 13 */}
          <article className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <h2 className="text-lg font-bold text-rugby-gold mb-3">
              ARTICLE 13 - Modification des CGU
            </h2>
            <div className="text-gray-700 space-y-2">
              <p>
                L'éditeur se réserve le droit de modifier les présentes CGU à tout moment.
                Pour les changements tarifaires, les utilisateurs seront informés au moins{' '}
                <strong>30 jours avant</strong> l'entrée en vigueur.
              </p>
              <p>
                L'utilisation continue de l'Application après modification vaut acceptation
                des nouvelles CGU.
              </p>
            </div>
          </article>

          {/* Article 14 */}
          <article className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <h2 className="text-lg font-bold text-rugby-gold mb-3">
              ARTICLE 14 - Droit applicable et juridiction
            </h2>
            <div className="text-gray-700 space-y-2">
              <p>
                Les présentes CGU sont régies par le <strong>droit français</strong>.
              </p>
              <p>
                En cas de litige, les parties s'efforceront de trouver une solution amiable.
                À défaut, compétence exclusive est attribuée aux tribunaux français compétents.
              </p>
            </div>
          </article>
        </div>

        {/* Contact */}
        <section className="bg-gradient-to-br from-rugby-gold/10 to-rugby-bronze/10 rounded-xl p-6 border-2 border-rugby-gold">
          <h2 className="text-xl font-bold text-rugby-black mb-3 flex items-center gap-2">
            <Shield className="w-6 h-6 text-rugby-gold" />
            Contact
          </h2>
          <div className="text-gray-700 space-y-2">
            <p>
              <strong>Éditeur :</strong> Bernard PILLORE
            </p>
            <p>
              <strong>Email :</strong>{' '}
              <a href="mailto:pilpress31@gmail.com" className="text-blue-600 underline">
                pilpress31@gmail.com
              </a>
            </p>
            <p>
              <strong>Hébergement :</strong> Vercel (frontend) · Railway (backend) · Supabase (base de données)
            </p>
          </div>
        </section>

        {/* Footer */}
        <section className="text-center text-gray-600 text-sm pt-4 border-t border-gray-200">
          <p>
            En utilisant TOP 14 PRONOS, vous reconnaissez avoir lu, compris et accepté
            l'intégralité des présentes Conditions Générales d'Utilisation.
          </p>
          <p className="mt-2 font-semibold text-rugby-gold">
            © 2026 TOP 14 PRONOS — Bernard PILLORE — Tous droits réservés
          </p>
        </section>
      </div>
    </div>
  );
}
