import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scale, ArrowRight, FileText, Shield } from 'lucide-react';

export default function CGUPage() {
  const navigate = useNavigate();

  // 1️⃣ Scroll auto en haut quand on arrive sur la page
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="min-h-screen bg-rugby-white pb-24">

      {/* 2️⃣ Bandeau rugby-gold + 3️⃣ Flèche retour */}
      <div className="relative bg-rugby-gold text-white p-6 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">

          {/* Titre + icône */}
          <div className="flex items-center gap-3">
            <Scale className="w-8 h-8 text-white" />
            <h1 className="text-2xl font-bold">Conditions Générales d'Utilisation</h1>
          </div>

          {/* Flèche retour */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white hover:text-gray-200 transition"
          >
            <span className="text-sm font-semibold">Retour</span>
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>

        <p className="max-w-4xl mx-auto text-gray-100 text-sm mt-2">
          Dernière mise à jour : Janvier 2026
        </p>
      </div>

      {/* CONTENU */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

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
                <li><strong>Prédictions statistiques</strong> basées sur des données historiques</li>
                <li><strong>Jeu de pronostics gratuit</strong> entre utilisateurs</li>
                <li><strong>Simulation de paris</strong> en monnaie virtuelle</li>
                <li><strong>Consultation de l'historique</strong> des matchs</li>
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
                <p>L'Application ne propose <strong>PAS</strong> :</p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>De paris en argent réel</li>
                  <li>De liens d'affiliation vers des bookmakers</li>
                  <li>De garantie de gains</li>
                  <li>De conseils d'investissement</li>
                </ul>
              </div>

              <p>Les prédictions sont fournies <strong>à titre informatif et éducatif</strong>.</p>

              <p>Elles ne constituent en aucun cas :</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Une incitation au jeu</li>
                <li>Une garantie de résultat</li>
                <li>Un conseil financier</li>
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
                Les modèles statistiques utilisés <strong>ne garantissent pas</strong> l'exactitude des résultats futurs.
              </p>

              <p>L'Utilisateur est seul responsable de l'usage qu'il fait des informations fournies.</p>

              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mt-4">
                <p className="font-semibold text-red-900">
                  Si l'Utilisateur décide de parier en argent réel :
                </p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1 text-red-800">
                  <li>Utiliser uniquement des sites agréés par l’ANJ</li>
                  <li>Assumer les risques associés</li>
                  <li>Être conscient du risque d’addiction</li>
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
              <p>Le jeu est <strong>entièrement gratuit</strong>.</p>
              <p>Les points n'ont <strong>aucune valeur monétaire</strong>.</p>
              <p>L’éditeur peut modifier le système de points.</p>
            </div>
          </article>

          {/* Article 5 */}
          <article className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <h2 className="text-lg font-bold text-rugby-gold mb-3">
              ARTICLE 5 - Simulation de paris (Portefeuille virtuel)
            </h2>
            <div className="text-gray-700 space-y-2">
              <p>Le mode Simulation utilise une <strong>monnaie virtuelle fictive</strong>.</p>

              <div className="bg-blue-50 border border-blue-300 p-4 rounded">
                <p className="font-semibold text-blue-900 mb-2">Caractéristiques :</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Monnaie sans valeur réelle</li>
                  <li>Non convertible</li>
                  <li>Cotes basées sur nos statistiques internes</li>
                  <li>Mode éducatif et ludique</li>
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
              <p>L’ensemble des éléments de l’Application est protégé.</p>
              <p>Toute reproduction non autorisée est interdite.</p>
              <p>Les prédictions ne peuvent être :</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Revendues</li>
                <li>Redistribuées massivement</li>
                <li>Utilisées commercialement sans autorisation</li>
              </ul>
            </div>
          </article>

          {/* Article 7 */}
          <article className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <h2 className="text-lg font-bold text-rugby-gold mb-3">
              ARTICLE 7 - Données personnelles
            </h2>
            <div className="text-gray-700 space-y-2">
              <p>Données traitées selon le RGPD.</p>
              <p>Droits : accès, rectification, suppression.</p>
              <p>Contact : <a href="mailto:contact@top14pronos.fr" className="text-blue-600 underline">contact@top14pronos.fr</a></p>
              <p>Données jamais vendues.</p>
            </div>
          </article>

          {/* Article 8 */}
          <article className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <h2 className="text-lg font-bold text-rugby-gold mb-3">
              ARTICLE 8 - Limitation de responsabilité
            </h2>
            <div className="text-gray-700 space-y-2">
              <p>L’éditeur n’est pas responsable :</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Des pertes financières</li>
                <li>Des erreurs de prédiction</li>
                <li>Des interruptions</li>
                <li>Des bugs</li>
                <li>Des usages frauduleux</li>
              </ul>

              <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded mt-3">
                <p className="font-semibold text-orange-900">
                  🔒 Utilisation responsable exigée.
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
              <p>Les CGU peuvent être modifiées.</p>
              <p>L’utilisation continue vaut acceptation.</p>
            </div>
          </article>

          {/* Article 10 */}
          <article className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <h2 className="text-lg font-bold text-rugby-gold mb-3">
              ARTICLE 10 - Droit applicable et juridiction
            </h2>
            <div className="text-gray-700 space-y-2">
              <p>CGU régies par le droit français.</p>
              <p>Litiges → tribunaux français.</p>
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
            <p><strong>Éditeur :</strong> [Votre Nom / Raison sociale]</p>
            <p><strong>Email :</strong> <a href="mailto:contact@top14pronos.fr" className="text-blue-600 underline">contact@top14pronos.fr</a></p>
            <p><strong>Hébergement :</strong> [Nom hébergeur et coordonnées]</p>
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
