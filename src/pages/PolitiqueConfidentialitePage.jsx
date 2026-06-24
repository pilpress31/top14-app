import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft, Lock, FileText, Database, Globe, Clock, UserCheck, Cookie, Baby, Mail, AlertCircle } from 'lucide-react';

export default function PolitiqueConfidentialitePage() {
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
            <Shield className="w-8 h-8 text-white" />
            <h1 className="text-2xl md:text-3xl font-bold">Politique de confidentialité</h1>
          </div>
          <p className="text-gray-100 text-sm text-center">
            Dernière mise à jour : 10 mai 2026
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 pt-48">

        {/* Préambule */}
        <section className="bg-blue-50 rounded-xl p-6 border-2 border-blue-300">
          <h2 className="text-xl font-bold text-blue-900 mb-3 flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Préambule
          </h2>
          <p className="text-gray-800 leading-relaxed mb-3">
            La présente politique de confidentialité décrit comment{' '}
            <strong>Top 14 Pronos</strong> (ci-après "l'Application") collecte, utilise et protège
            vos données personnelles, conformément au{' '}
            <strong>Règlement Général sur la Protection des Données (RGPD)</strong> européen et à
            la <strong>loi française Informatique et Libertés</strong>.
          </p>
          <p className="text-gray-800 leading-relaxed">
            Notre engagement : <strong>transparence totale</strong> sur les données collectées,
            <strong> aucune revente</strong> à des tiers, et respect <strong>strict</strong> de
            vos droits.
          </p>
        </section>

        {/* Section 1 — Responsable du traitement */}
        <article className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
          <h2 className="text-lg font-bold text-rugby-gold mb-3 flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            1. Responsable du traitement
          </h2>
          <div className="text-gray-700 space-y-2">
            <p>
              Le responsable du traitement de vos données est :
            </p>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p><strong>Bernard PILLORE</strong></p>
              <p>Éditeur de l'application Top 14 Pronos</p>
              <p>Contact :{' '}
                <a href="mailto:contact@top14pronos.fr" className="text-blue-600 underline">
                  contact@top14pronos.fr
                </a>
              </p>
            </div>
            <p className="text-sm italic">
              L'application est éditée à titre personnel et non commercial dans sa phase actuelle
              (phase bêta / Membres Fondateurs).
            </p>
          </div>
        </article>

        {/* Section 2 — Données collectées */}
        <article className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
          <h2 className="text-lg font-bold text-rugby-gold mb-3 flex items-center gap-2">
            <Database className="w-5 h-5" />
            2. Données collectées
          </h2>
          <div className="text-gray-700 space-y-3">
            <p>Nous collectons uniquement les données strictement nécessaires au fonctionnement de l'Application :</p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-200">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-200 p-2 text-left">Catégorie</th>
                    <th className="border border-gray-200 p-2 text-left">Données concernées</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 p-2 font-semibold">Compte utilisateur</td>
                    <td className="border border-gray-200 p-2">Email, pseudo, nom, prénom, mot de passe (hashé), date d'inscription</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-200 p-2 font-semibold">Activité dans l'app</td>
                    <td className="border border-gray-200 p-2">Pronostics, paris virtuels, jetons, points de classement, historique</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 p-2 font-semibold">Notifications push</td>
                    <td className="border border-gray-200 p-2">Token VAPID anonyme du navigateur (uniquement si vous acceptez les notifications)</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-200 p-2 font-semibold">Données techniques</td>
                    <td className="border border-gray-200 p-2">Adresse IP (logs serveur), navigateur, type d'appareil</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 p-2 font-semibold">Paiements (à venir)</td>
                    <td className="border border-gray-200 p-2">Identifiant de transaction PayPal, montant, date — <em>jamais le numéro de carte bancaire</em></td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-200 p-2 font-semibold">Communications</td>
                    <td className="border border-gray-200 p-2">Messages dans le chat communautaire, messages au support</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 p-2 font-semibold">Assistant IA (chat)</td>
                    <td className="border border-gray-200 p-2">Compteur d'usage quotidien (nombre de questions/jour) — <em>le contenu des questions n'est pas conservé</em></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="bg-yellow-50 border border-yellow-300 rounded p-3 text-sm">
              ⚠️ <strong>Nous ne collectons PAS</strong> votre géolocalisation précise, vos contacts,
              vos photos, votre micro ou votre caméra. L'Application ne demande aucune autorisation
              système intrusive.
            </p>
          </div>
        </article>

        {/* Section 3 — Finalités et bases légales */}
        <article className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
          <h2 className="text-lg font-bold text-rugby-gold mb-3">
            3. Finalités et bases légales du traitement
          </h2>
          <div className="text-gray-700 space-y-3">
            <p>Vos données sont utilisées exclusivement pour :</p>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>
                <strong>Authentification et gestion de votre compte</strong> — Base légale :
                exécution du contrat (art. 6.1.b RGPD)
              </li>
              <li>
                <strong>Fonctionnement du service</strong> (paris virtuels, classement,
                notifications) — Base légale : exécution du contrat (art. 6.1.b RGPD)
              </li>
              <li>
                <strong>Envoi de notifications push</strong> — Base légale : votre consentement
                explicite (art. 6.1.a RGPD), révocable à tout moment
              </li>
              <li>
                <strong>Statistiques anonymisées d'utilisation</strong> pour améliorer l'Application —
                Base légale : intérêt légitime (art. 6.1.f RGPD)
              </li>
              <li>
                <strong>Sécurité</strong> (détection d'abus, protection contre la fraude) — Base
                légale : intérêt légitime (art. 6.1.f RGPD)
              </li>
              <li>
                <strong>Obligations légales</strong> (conservation des transactions PayPal en cas
                de paiement) — Base légale : obligation légale (art. 6.1.c RGPD)
              </li>
            </ul>
          </div>
        </article>

        {/* Section 4 — Sous-traitants */}
        <article className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
          <h2 className="text-lg font-bold text-rugby-gold mb-3 flex items-center gap-2">
            <Globe className="w-5 h-5" />
            4. Sous-traitants et services tiers
          </h2>
          <div className="text-gray-700 space-y-3">
            <p>
              Pour le fonctionnement de l'Application, nous utilisons les services suivants. Tous
              ces sous-traitants sont conformes au RGPD et soumis à des accords de confidentialité.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-200">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-200 p-2 text-left">Service</th>
                    <th className="border border-gray-200 p-2 text-left">Rôle</th>
                    <th className="border border-gray-200 p-2 text-left">Localisation des données</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 p-2 font-semibold">Supabase</td>
                    <td className="border border-gray-200 p-2">Hébergement de la base de données, authentification</td>
                    <td className="border border-gray-200 p-2">Union Européenne (Francfort)</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-200 p-2 font-semibold">Vercel</td>
                    <td className="border border-gray-200 p-2">Hébergement du frontend (interface web)</td>
                    <td className="border border-gray-200 p-2">Réseau mondial (CDN)</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 p-2 font-semibold">Railway</td>
                    <td className="border border-gray-200 p-2">Hébergement du backend (API serveur)</td>
                    <td className="border border-gray-200 p-2">Union Européenne</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-200 p-2 font-semibold">Resend</td>
                    <td className="border border-gray-200 p-2">Envoi des emails transactionnels (inscription, réinitialisation)</td>
                    <td className="border border-gray-200 p-2">Union Européenne</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 p-2 font-semibold">PayPal</td>
                    <td className="border border-gray-200 p-2">Paiements sécurisés (à partir d'octobre 2026)</td>
                    <td className="border border-gray-200 p-2">Union Européenne (Luxembourg)</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-200 p-2 font-semibold">Google Gemini</td>
                    <td className="border border-gray-200 p-2">Génération de contenu IA (analyses de matchs)</td>
                    <td className="border border-gray-200 p-2">États-Unis (clauses contractuelles RGPD)</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 p-2 font-semibold">OpenAI</td>
                    <td className="border border-gray-200 p-2">IA de secours (fallback Gemini)</td>
                    <td className="border border-gray-200 p-2">États-Unis (clauses contractuelles RGPD)</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-200 p-2 font-semibold">Open-Meteo</td>
                    <td className="border border-gray-200 p-2">Données météo (pas de données personnelles transmises)</td>
                    <td className="border border-gray-200 p-2">Union Européenne</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="bg-green-50 border border-green-300 rounded p-3 text-sm">
              ✅ <strong>Aucune donnée n'est vendue ou louée à des tiers à des fins commerciales.</strong>
            </p>

            <div className="bg-yellow-50 border border-yellow-300 rounded p-4 text-sm space-y-2">
              <p className="font-semibold text-yellow-900">🤖 À propos de l'assistant IA (chat)</p>
              <p>
                Lorsque vous posez une question à l'assistant conversationnel, le texte de votre
                question est transmis à nos prestataires d'IA (<strong>Google Gemini</strong> et,
                en secours, <strong>OpenAI</strong>) afin de générer une réponse. Ces prestataires
                traitent cette donnée aux États-Unis, dans le cadre de clauses contractuelles
                conformes au RGPD.
              </p>
              <p>
                Le <strong>contenu de vos questions n'est pas conservé</strong> par l'Application :
                il sert uniquement à générer la réponse, puis n'est pas stocké. Nous conservons
                seulement un <strong>compteur d'usage</strong> (nombre de questions par jour, pour
                gérer la limite quotidienne), rattaché à votre compte et supprimé avec lui.
              </p>
              <p className="font-semibold text-yellow-900">
                Comme votre question transite chez un prestataire tiers, nous vous recommandons de
                ne pas y saisir d'informations personnelles ou sensibles (nom complet, coordonnées,
                données de santé, etc.). Le contenu que vous y saisissez librement relève de votre
                responsabilité.
              </p>
            </div>
          </div>
        </article>

        {/* Section 5 — Durée de conservation */}
        <article className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
          <h2 className="text-lg font-bold text-rugby-gold mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            5. Durée de conservation
          </h2>
          <div className="text-gray-700 space-y-2">
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>
                <strong>Compte actif</strong> : tant que vous utilisez l'Application
              </li>
              <li>
                <strong>Compte inactif</strong> : 3 ans à compter de la dernière connexion, puis
                suppression automatique
              </li>
              <li>
                <strong>Compte supprimé sur demande</strong> : suppression effective sous 30 jours
              </li>
              <li>
                <strong>Logs de sécurité</strong> (IP, connexions) : 1 an maximum
              </li>
              <li>
                <strong>Données de paiement PayPal</strong> : 10 ans (obligation légale comptable)
              </li>
              <li>
                <strong>Messages du chat communautaire</strong> : conservés tant que le compte est
                actif, supprimés avec le compte
              </li>
              <li>
                <strong>Compteur d'usage de l'assistant IA</strong> : conservé tant que le compte
                est actif, supprimé avec le compte (le contenu des questions n'est pas stocké)
              </li>
            </ul>
          </div>
        </article>

        {/* Section 6 — Vos droits RGPD */}
        <article className="bg-white rounded-lg p-6 shadow-md border-2 border-rugby-gold">
          <h2 className="text-lg font-bold text-rugby-gold mb-3 flex items-center gap-2">
            <Lock className="w-5 h-5" />
            6. Vos droits RGPD
          </h2>
          <div className="text-gray-700 space-y-3">
            <p>Conformément au RGPD, vous disposez des droits suivants :</p>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>
                <strong>Droit d'accès</strong> : obtenir une copie de toutes vos données
              </li>
              <li>
                <strong>Droit de rectification</strong> : corriger des données inexactes
              </li>
              <li>
                <strong>Droit à l'effacement</strong> ("droit à l'oubli") : demander la suppression
                de votre compte et de toutes vos données
              </li>
              <li>
                <strong>Droit à la portabilité</strong> : recevoir vos données dans un format
                structuré et lisible
              </li>
              <li>
                <strong>Droit d'opposition</strong> : vous opposer au traitement de vos données
              </li>
              <li>
                <strong>Droit à la limitation</strong> : demander la suspension temporaire du
                traitement
              </li>
              <li>
                <strong>Droit de retrait du consentement</strong> : à tout moment, sans
                justification (notamment pour les notifications push)
              </li>
            </ul>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-300 mt-4">
              <p className="font-semibold mb-2">Comment exercer vos droits ?</p>
              <p>
                Envoyez votre demande par email à :{' '}
                <a href="mailto:contact@top14pronos.fr" className="text-blue-600 underline font-semibold">
                  contact@top14pronos.fr
                </a>
              </p>
              <p className="text-sm mt-2">
                Nous nous engageons à vous répondre <strong>dans un délai maximum d'un mois</strong>.
              </p>
            </div>
          </div>
        </article>

        {/* Section 7 — Cookies et stockage local */}
        <article className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
          <h2 className="text-lg font-bold text-rugby-gold mb-3 flex items-center gap-2">
            <Cookie className="w-5 h-5" />
            7. Cookies et stockage local
          </h2>
          <div className="text-gray-700 space-y-3">
            <p>L'Application utilise les technologies suivantes :</p>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>
                <strong>LocalStorage du navigateur</strong> : stockage de votre session
                d'authentification (token Supabase) et de vos préférences. Aucune donnée n'est
                envoyée à des serveurs tiers.
              </li>
              <li>
                <strong>Service Worker</strong> : permet le fonctionnement hors-ligne et le cache
                des ressources. Aucun cookie publicitaire ou de pistage.
              </li>
              <li>
                <strong>Notifications push (VAPID)</strong> : si vous acceptez, un identifiant
                anonyme du navigateur est stocké pour vous envoyer des notifications. Révocable à
                tout moment dans les paramètres de votre navigateur.
              </li>
            </ul>
            <p className="bg-green-50 border border-green-300 rounded p-3 text-sm">
              ✅ <strong>L'Application ne contient AUCUN cookie publicitaire</strong>, AUCUN tracker
              tiers (Google Analytics, Facebook Pixel, etc.) et n'affiche AUCUNE publicité.
            </p>
          </div>
        </article>

        {/* Section 8 — Mineurs */}
        <article className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
          <h2 className="text-lg font-bold text-rugby-gold mb-3 flex items-center gap-2">
            <Baby className="w-5 h-5" />
            8. Protection des mineurs
          </h2>
          <div className="text-gray-700 space-y-2">
            <p>
              L'Application est destinée aux personnes <strong>âgées de 13 ans et plus</strong>,
              conformément au RGPD européen.
            </p>
            <p>
              Pour les mineurs de moins de 15 ans, le consentement parental est requis lors de
              l'inscription (selon la loi française).
            </p>
            <p>
              Les paris dans l'Application sont <strong>uniquement virtuels</strong> et ne mettent
              jamais en jeu d'argent réel. L'Application ne propose aucun jeu d'argent au sens de
              la loi.
            </p>
            <p>
              Les parents ou représentants légaux peuvent demander la suppression du compte d'un
              mineur en contactant{' '}
              <a href="mailto:contact@top14pronos.fr" className="text-blue-600 underline">
                contact@top14pronos.fr
              </a>.
            </p>
          </div>
        </article>

        {/* Section 9 — Sécurité */}
        <article className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
          <h2 className="text-lg font-bold text-rugby-gold mb-3 flex items-center gap-2">
            <Lock className="w-5 h-5" />
            9. Sécurité des données
          </h2>
          <div className="text-gray-700 space-y-2">
            <p>Nous mettons en œuvre des mesures techniques et organisationnelles pour protéger vos données :</p>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>Connexions chiffrées en <strong>HTTPS</strong> (TLS 1.3) sur l'ensemble de l'Application</li>
              <li>Mots de passe stockés sous forme de <strong>hash bcrypt</strong> (jamais en clair)</li>
              <li>
                Politiques d'accès strictes (<strong>Row Level Security</strong>) sur la base de
                données : chaque utilisateur ne peut accéder qu'à ses propres données
              </li>
              <li>Sauvegardes régulières des données chiffrées</li>
              <li>Surveillance des accès suspects et logs de sécurité</li>
              <li>Mises à jour régulières des dépendances et patchs de sécurité</li>
            </ul>
            <p className="bg-yellow-50 border border-yellow-300 rounded p-3 text-sm mt-3">
              💡 <strong>Conseil</strong> : utilisez un mot de passe unique et complexe pour
              votre compte, et ne le partagez jamais.
            </p>
          </div>
        </article>

        {/* Section 10 — Modifications */}
        <article className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
          <h2 className="text-lg font-bold text-rugby-gold mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            10. Modifications de la politique
          </h2>
          <div className="text-gray-700 space-y-2">
            <p>
              La présente politique peut être mise à jour pour refléter des évolutions techniques,
              juridiques ou de service. La date de dernière mise à jour est indiquée en haut de
              cette page.
            </p>
            <p>
              En cas de modification substantielle, vous serez informé par email et/ou par une
              notification dans l'Application au moins <strong>30 jours avant l'entrée en
              vigueur</strong> des nouvelles dispositions.
            </p>
          </div>
        </article>

        {/* Section 11 — Contact CNIL */}
        <article className="bg-blue-50 rounded-lg p-6 border-2 border-blue-300">
          <h2 className="text-lg font-bold text-blue-900 mb-3 flex items-center gap-2">
            <Mail className="w-5 h-5" />
            11. Contact et autorité de contrôle
          </h2>
          <div className="text-gray-700 space-y-3">
            <p>
              Pour toute question concernant cette politique ou pour exercer vos droits :
            </p>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="font-semibold mb-1">Bernard PILLORE — Top 14 Pronos</p>
              <p>
                Email :{' '}
                <a href="mailto:contact@top14pronos.fr" className="text-blue-600 underline">
                  contact@top14pronos.fr
                </a>
              </p>
            </div>

            <p className="mt-3">
              Si vous estimez, après nous avoir contactés, que vos droits ne sont pas respectés,
              vous pouvez introduire une réclamation auprès de la <strong>CNIL</strong>
              (Commission Nationale de l'Informatique et des Libertés) :
            </p>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p>
                <a
                  href="https://www.cnil.fr/fr/plaintes"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline font-semibold"
                >
                  www.cnil.fr/fr/plaintes
                </a>
              </p>
              <p className="text-sm mt-1">
                CNIL — 3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07
              </p>
            </div>
          </div>
        </article>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 pt-4 pb-8">
          <p>Cette politique de confidentialité s'applique à l'application Top 14 Pronos.</p>
          <p className="mt-1">
            Pour les Conditions Générales d'Utilisation,{' '}
            <button
              onClick={() => navigate('/cgu')}
              className="text-blue-600 underline"
            >
              cliquez ici
            </button>.
          </p>
        </div>

      </div>
    </div>
  );
}
