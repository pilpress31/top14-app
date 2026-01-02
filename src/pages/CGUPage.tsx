import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scale, ArrowLeft, FileText, Shield } from 'lucide-react';

export default function CGUPage() {
  
  const navigate = useNavigate();

  // Scroll automatique en haut de la page
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  return (
    <div className="min-h-screen bg-rugby-white pb-24">
      {/* Bandeau rugby-gold fixe en haut */}
      <div className="fixed top-0 left-0 right-0 bg-rugby-gold text-white shadow-md z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          {/* Ligne 1 : Flèche retour plus grande */}
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-white hover:text-gray-100 transition mb-3"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-semibold">Retour</span>
          </button>
          
          {/* Ligne 2 : Titre centré plus grand */}
          <div className="flex items-center justify-center gap-3 mb-2">
            <Scale className="w-8 h-8 text-white" />
            <h1 className="text-2xl md:text-3xl font-bold">Conditions Générales d'Utilisation</h1>
          </div>
          
          {/* Ligne 3 : Date de mise à jour */}
          <p className="text-gray-100 text-sm text-center">
            Dernière mise à jour : Janvier 2026
          </p>
        </div>
      </div>

      {/* CONTENU avec padding-top plus grand pour compenser le bandeau fixe */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 pt-48">
        {/* Préambule */}
        <section className="bg-blue-50 rounded-xl p-6 border-2 border-blue-300">
          <h2 className="text-xl font-bold text-blue-900 mb-3 flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Préambule
          </h2>
          <p className="text-gray-800 leading-relaxed">
            Les présentes Conditions Générales d'Utilisation (ci-après "CGU") régissent l'utilisation 
            de l'application mobile <strong>TOP 14 PRONOS</strong> (ci-après "l'Application"). 
            En utilisant l'Application, vous acceptez sans réserve les présentes CGU.
          </p>
        </section>

        {/* Articles */}
        <div className="space-y-6">
          {/* Article 1 */}
          <article className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <h2 className="text-lg font-bold text-rugby-gold mb-3">
              ARTICLE 1 - Objet de l'Application
            </h2>
            <div className="text-gray-700 space-y-2">
              <p>L'Application <strong>TOP 14 PRONOS</strong> propose les services suivants :</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>
                  <strong>Prédictions statistiques</strong> de scores de matchs de Top 14, 
                  générées par un algorithme propriétaire basé sur des données historiques
                </li>
                <li>
                  <strong>Jeu de pronostics gratuit</strong> entre utilisateurs avec système de classement par points
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

          {/* Article 2 */}
          <article className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <h2 className="text-lg font-bold text-rugby-gold mb-3">
              ARTICLE 2 - Nature du service - Clause de non-responsabilité
            </h2>
            <div className="text-gray-700 space-y-3">
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                <p className="font-semibold text-yellow-900 mb-2">⚠️ Important :</p>
                <p>
                  L'Application ne propose <strong>PAS</strong> :
                </p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>De paris en argent réel</li>
                  <li>De liens d'affiliation vers des sites de paris sportifs</li>
                  <li>De garantie de gains sur des paris réels</li>
                  <li>De conseils en investissement</li>
                </ul>
              </div>

              <p>
                Les prédictions fournies sont le résultat d'un <strong>traitement statistique automatisé</strong> 
                et sont fournies <strong>à titre purement informatif et éducatif</strong>.
              </p>

              <p>
                Ces prédictions ne constituent <strong>en aucun cas</strong> :
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Une incitation au jeu d'argent</li>
                <li>Une garantie de résultat sportif</li>
                <li>Un conseil d'investissement ou de paris</li>
                <li>Une analyse financière</li>
              </ul>
            </div>
          </article>

          {/* Article 3 */}
          <article className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <h2 className="text-lg font-bold text-rugby-gold mb-3">
              ARTICLE 3 - Usage des prédictions
            </h2>
            <div className="text-gray-700 space-y-3">
              <p>
                L'Utilisateur reconnaît que les prédictions sont basées sur des modèles statistiques 
                qui, bien que rigoureux, <strong>ne peuvent garantir l'exactitude des résultats futurs</strong>.
              </p>

              <p>
                L'Utilisateur est <strong>seul responsable</strong> de l'usage qu'il fait des informations 
                fournies par l'Application, notamment s'il décide :
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>D'utiliser ces informations pour formuler ses propres pronostics</li>
                <li>De placer des paris sur des plateformes légales et agréées</li>
                <li>De partager ces informations avec des tiers</li>
              </ul>

              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mt-4">
                <p className="font-semibold text-red-900">
                  Si l'Utilisateur décide de parier en argent réel sur des sites de paris sportifs :
                </p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1 text-red-800">
                  <li>Il doit utiliser exclusivement des sites agréés par l'ANJ (Autorité Nationale des Jeux)</li>
                  <li>Il le fait sous sa propre responsabilité et à ses propres risques</li>
                  <li>L'éditeur de l'Application ne saurait être tenu responsable des pertes financières</li>
                  <li>Les paris comportent un risque de dépendance - Aide : <a href="tel:09-74-75-13-13" className="underline">09 74 75 13 13</a></li>
                </ul>
              </div>
            </div>
          </article>

          {/* Article 4 */}
          <article className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <h2 className="text-lg font-bold text-rugby-gold mb-3">
              ARTICLE 4 - Jeu communautaire et classement
            </h2>
            <div className="text-gray-700 space-y-2">
              <p>
                Le jeu de pronostics entre utilisateurs est <strong>entièrement gratuit</strong>. 
                Aucun enjeu financier n'est associé au classement.
              </p>
              <p>
                Les points attribués selon le barème (voir Règlement) n'ont <strong>aucune valeur monétaire </strong> 
                et ne peuvent être convertis, échangés ou vendus.
              </p>
              <p>
                L'éditeur se réserve le droit de modifier le système de points en cours de saison, 
                en informant préalablement les utilisateurs.
              </p>
            </div>
          </article>

          {/* Article 5 */}
          <article className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <h2 className="text-lg font-bold text-rugby-gold mb-3">
              ARTICLE 5 - Simulation de paris (Portefeuille virtuel)
            </h2>
            <div className="text-gray-700 space-y-2">
              <p>
                Le mode "Simulation de paris" permet aux utilisateurs de tester des stratégies 
                avec une <strong>monnaie virtuelle fictive</strong>.
              </p>
              
              <div className="bg-blue-50 border border-blue-300 p-4 rounded">
                <p className="font-semibold text-blue-900 mb-2">Caractéristiques :</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>La monnaie virtuelle n'a <strong>aucune valeur réelle</strong></li>
                  <li>Elle ne peut être <strong>ni achetée, ni vendue, ni convertie</strong> en argent réel</li>
                  <li>Les cotes affichées sont calculées sur nos statistiques historiques et <strong>n'ont aucun lien avec des bookmakers réels</strong></li>
                  <li>Ce mode est purement <strong>éducatif et ludique</strong></li>
                </ul>
              </div>
            </div>
          </article>

          {/* Article 6 */}
          <article className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <h2 className="text-lg font-bold text-rugby-gold mb-3">
              ARTICLE 6 - Propriété intellectuelle
            </h2>
            <div className="text-gray-700 space-y-2">
              <p>
                L'ensemble des éléments de l'Application (algorithme, base de données, design, textes, logos) 
                sont la <strong>propriété exclusive</strong> de l'éditeur et sont protégés par les lois 
                relatives à la propriété intellectuelle.
              </p>
              <p>
                Toute reproduction, représentation, modification, ou exploitation non autorisée 
                est strictement interdite et constitue une contrefaçon sanctionnée par le Code de la propriété intellectuelle.
              </p>
              <p>
                Les prédictions générées par l'algorithme ne peuvent être :
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Revendues ou commercialisées</li>
                <li>Redistribuées à grande échelle</li>
                <li>Utilisées à des fins commerciales sans autorisation écrite préalable</li>
              </ul>
            </div>
          </article>

          {/* Article 7 */}
          <article className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <h2 className="text-lg font-bold text-rugby-gold mb-3">
              ARTICLE 7 - Données personnelles
            </h2>
            <div className="text-gray-700 space-y-2">
              <p>
                Les données personnelles collectées (pseudo, email, historique de pronos) 
                sont traitées conformément au <strong>Règlement Général sur la Protection des Données (RGPD)</strong>.
              </p>
              <p>
                L'Utilisateur dispose d'un droit d'accès, de rectification et de suppression de ses données. 
                Pour exercer ces droits, contactez : <a href="mailto:contact@top14pronos.fr" className="text-blue-600 underline">contact@top14pronos.fr</a>
              </p>
              <p>
                Les données ne sont <strong>jamais vendues</strong> à des tiers.
              </p>
            </div>
          </article>

          {/* Article 8 */}
          <article className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <h2 className="text-lg font-bold text-rugby-gold mb-3">
              ARTICLE 8 - Limitation de responsabilité
            </h2>
            <div className="text-gray-700 space-y-2">
              <p>
                L'éditeur ne saurait être tenu responsable :
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Des pertes financières résultant de paris placés par l'Utilisateur</li>
                <li>De l'inexactitude des prédictions fournies</li>
                <li>Des interruptions temporaires du service</li>
                <li>Des bugs ou dysfonctionnements techniques</li>
                <li>De l'usage abusif ou frauduleux de l'Application par des tiers</li>
              </ul>

              <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded mt-3">
                <p className="font-semibold text-orange-900">
                  🔒 L'Utilisateur s'engage à utiliser l'Application de manière responsable et légale.
                </p>
              </div>
            </div>
          </article>

          {/* Article 9 */}
          <article className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <h2 className="text-lg font-bold text-rugby-gold mb-3">
              ARTICLE 9 - Modification des CGU
            </h2>
            <div className="text-gray-700 space-y-2">
              <p>
                L'éditeur se réserve le droit de modifier les présentes CGU à tout moment. 
                Les utilisateurs seront informés de toute modification substantielle.
              </p>
              <p>
                L'utilisation continue de l'Application après modification vaut acceptation des nouvelles CGU.
              </p>
            </div>
          </article>

          {/* Article 10 */}
          <article className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <h2 className="text-lg font-bold text-rugby-gold mb-3">
              ARTICLE 10 - Droit applicable et juridiction
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
              <strong>Éditeur :</strong> [Votre Nom / Raison sociale]
            </p>
            <p>
              <strong>Email :</strong> <a href="mailto:contact@top14pronos.fr" className="text-blue-600 underline">contact@top14pronos.fr</a>
            </p>
            <p>
              <strong>Hébergement :</strong> [Nom hébergeur et coordonnées]
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
            © 2026 TOP 14 PRONOS - Tous droits réservés
          </p>
        </section>
      </div>
    </div>
  );
}