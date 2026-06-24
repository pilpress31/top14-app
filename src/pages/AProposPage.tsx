import { TrendingUp, Users, Wallet, Database, Shield, Award } from 'lucide-react';

export default function AProposPage() {
  return (
    <div className="min-h-screen bg-rugby-white pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-rugby-black to-rugby-bronze text-white p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">À propos</h1>
          <p className="text-rugby-gray text-sm">L'intelligence au service du Rugby</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Introduction */}
        <section className="bg-gradient-to-br from-rugby-gold/10 to-rugby-bronze/10 rounded-xl p-6 border-2 border-rugby-gold shadow-lg">
          <h2 className="text-2xl font-bold text-rugby-black mb-4 flex items-center gap-3">
            <Award className="w-8 h-8 text-rugby-gold" />
            TOP 14 PRONOS
          </h2>
          <p className="text-gray-700 leading-relaxed text-lg">
            La <strong>première application mobile dédiée au Top 14</strong> combinant intelligence artificielle 
            et passion du rugby pour vous offrir des prédictions de scores d'une précision inégalée.
          </p>
        </section>

        {/* Notre technologie */}
        <section className="bg-white rounded-xl p-6 shadow-md border border-rugby-gray">
          <h2 className="text-2xl font-bold text-rugby-gold mb-4 flex items-center gap-3">
            <TrendingUp className="w-7 h-7" />
            Notre technologie unique
          </h2>
          
          <div className="space-y-4">
            <p className="text-gray-700">
              Notre algorithme propriétaire s'appuie sur une méthodologie scientifique rigoureuse :
            </p>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-rugby-gold/5 rounded-lg p-4 border-l-4 border-rugby-gold">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="w-5 h-5 text-rugby-gold" />
                  <h3 className="font-bold text-rugby-black">Base de données historique</h3>
                </div>
                <p className="text-sm text-gray-700">
                  Plus de <strong>3 650 matchs analysés</strong> depuis 2005, constituant la base de données 
                  la plus exhaustive jamais réalisée sur le Top 14.
                </p>
              </div>

              <div className="bg-rugby-bronze/5 rounded-lg p-4 border-l-4 border-rugby-bronze">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-rugby-bronze" />
                  <h3 className="font-bold text-rugby-black">Modélisation avancée</h3>
                </div>
                <p className="text-sm text-gray-700">
                  Système <strong>ELO dynamique</strong> couplé à des modèles de <strong>régression linéaire multiple</strong> 
                  intégrant forme récente, avantage du terrain et historique des confrontations.
                </p>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-600">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-5 h-5 text-green-600" />
                  <h3 className="font-bold text-rugby-black">Précision validée</h3>
                </div>
                <p className="text-sm text-gray-700">
                  <strong>Plus de 80% de précision</strong> sur l'identification du vainqueur, 
                  validée sur 20 années d'historique de matchs.
                </p>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-600">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-rugby-black">Transparence totale</h3>
                </div>
                <p className="text-sm text-gray-700">
                  Consultez l'historique complet de nos prédictions et comparez-les aux résultats réels. 
                  Aucun résultat dissimulé.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Trois expériences */}
        <section className="bg-white rounded-xl p-6 shadow-md border border-rugby-gray">
          <h2 className="text-2xl font-bold text-rugby-gold mb-6">
            🏉 Quatre expériences en une
          </h2>

          <div className="space-y-6">
            {/* 1. Prédictions */}
            <div className="border-l-4 border-rugby-gold pl-4">
              <h3 className="text-xl font-bold text-rugby-black mb-2">
                1. PRÉDICTIONS ALGORITHMIQUES
              </h3>
              <p className="text-gray-700 mb-3">
                Consultez nos pronostics de scores (finaux et mi-temps) générés par notre IA. 
                Ces prédictions, fruit d'années d'analyse statistique, constituent une <strong>aide à la décision</strong> précieuse 
                pour vos propres pronostics.
              </p>
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                <p className="text-sm text-gray-800">
                  ⚠️ <strong>Information :</strong> Nos prédictions sont fournies à titre informatif et éducatif. 
                  Elles peuvent vous aider à affiner votre jugement sportif, y compris dans le cadre de paris sportifs 
                  que vous effectueriez librement sur des plateformes légales et agréées par l'ANJ (Autorité Nationale des Jeux).
                </p>
              </div>
            </div>

            {/* 2. Compétition */}
            <div className="border-l-4 border-rugby-bronze pl-4">
              <h3 className="text-xl font-bold text-rugby-black mb-2 flex items-center gap-2">
                <Users className="w-6 h-6" />
                2. COMPÉTITION COMMUNAUTAIRE
              </h3>
              <p className="text-gray-700">
                Affrontez d'autres passionnés en pronostiquant les scores des matchs. 
                Gagnez des points selon un barème précis (voir le Règlement), grimpez au classement 
                et prouvez votre expertise du Top 14. <strong>100% gratuit</strong>, aucun enjeu financier.
              </p>
            </div>

            {/* 3. Simulation */}
            <div className="border-l-4 border-green-600 pl-4">
              <h3 className="text-xl font-bold text-rugby-black mb-2 flex items-center gap-2">
                <Wallet className="w-6 h-6" />
                3. SIMULATION DE PARIS (Mode Virtuel)
              </h3>
              <p className="text-gray-700 mb-2">
                Testez vos stratégies sans risque avec notre portefeuille virtuel. 
                Placez des mises fictives, suivez vos gains virtuels et affinez votre approche.
              </p>
              <div className="bg-blue-50 border border-blue-300 p-3 rounded">
                <p className="text-sm text-gray-800">
                  💡 <strong>Important :</strong> Les cotes proposées sont calculées exclusivement sur nos statistiques historiques 
                  et n'ont <strong>aucun lien avec des opérateurs de paris réels</strong>. 
                  La monnaie est virtuelle et ne peut être convertie en argent réel.
                </p>
              </div>
            </div>

            {/* 4. Suivi Live */}
            <div className="border-l-4 border-red-600 pl-4">
              <h3 className="text-xl font-bold text-rugby-black mb-2 flex items-center gap-2">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" fill="#ef4444"/>
                  <circle cx="12" cy="12" r="3" fill="white" className="animate-pulse"/>
                </svg>
                4. SUIVI LIVE DES MATCHS
              </h3>
              <p className="text-gray-700 mb-2">
                Suivez en temps quasi-réel les scores des matchs en cours. 
                Cette fonctionnalité vous permet de rester connecté à l'action pendant les journées de Top 14.
              </p>
              <div className="bg-orange-50 border border-orange-300 p-3 rounded text-sm">
                <p className="text-gray-800 mb-2">
                  ⏱️ <strong>Disponibilité :</strong> Les données live sont fournies par un service externe 
                  et dépendent de la disponibilité des flux en temps réel.
                </p>
                <p className="text-gray-700 text-xs">
                  La fréquence de rafraîchissement et la précision peuvent varier selon notre abonnement 
                  au fournisseur de données. Nous nous efforçons d'offrir le meilleur service possible 
                  et améliorerons cette fonctionnalité au fur et à mesure du développement de l'application.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Usage responsable */}
        <section className="bg-red-50 rounded-xl p-6 shadow-md border-2 border-red-300">
          <h2 className="text-xl font-bold text-red-800 mb-4 flex items-center gap-2">
            <Shield className="w-6 h-6" />
            ⚖️ Usage responsable
          </h2>
          
          <div className="space-y-3 text-gray-800">
            <p>
              <strong>TOP 14 PRONOS</strong> est un outil d'information et de divertissement. 
            </p>
            
            <p className="font-semibold">
              Si vous décidez de parier sur des matchs de rugby :
            </p>
            
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Utilisez uniquement des sites agréés par l'<strong>ANJ</strong> (Autorité Nationale des Jeux)</li>
              <li>Pariez de manière <strong>responsable et modérée</strong></li>
              <li>Ne misez jamais plus que ce que vous pouvez vous permettre de perdre</li>
              <li>Les paris comportent des <strong>risques de perte financière</strong></li>
              <li>Le jeu peut être addictif - consultez <a href="https://www.joueurs-info-service.fr" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">joueurs-info-service.fr</a> en cas de besoin</li>
            </ul>

            <p className="text-sm italic mt-4 pt-4 border-t border-red-300">
              Nous ne sommes pas affiliés à des opérateurs de paris et ne percevons aucune commission sur vos mises éventuelles.
            </p>
          </div>
        </section>

        {/* Sources de données */}
        <section className="bg-white rounded-xl p-6 shadow-md border border-rugby-gray">
          <h2 className="text-2xl font-bold text-rugby-gold mb-4 flex items-center gap-3">
            <Database className="w-7 h-7" />
            Sources de données
          </h2>
          <p className="text-gray-700 mb-4">
            Les données factuelles utilisées par l'application (calendriers, résultats,
            effectifs, compositions, météo) proviennent de sources publiques que nous remercions
            pour la qualité de leur travail :
          </p>
          <ul className="space-y-2 text-sm text-gray-800">
            <li className="flex items-start gap-2">
              <span className="text-rugby-gold font-bold">•</span>
              <span>
                <strong>AllRugby.com</strong> — calendriers, résultats, effectifs et compositions
                (<a href="https://www.allrugby.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">allrugby.com</a>)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rugby-gold font-bold">•</span>
              <span>
                <strong>Wikipédia</strong> — données historiques et internationales
                (<a href="https://fr.wikipedia.org" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">wikipedia.org</a>)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rugby-gold font-bold">•</span>
              <span>
                <strong>LNR</strong> — Ligue Nationale de Rugby, données officielles Top 14 et Pro D2
                (<a href="https://www.lnr.fr" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">lnr.fr</a>)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rugby-gold font-bold">•</span>
              <span>
                <strong>RapidAPI Rugby Live Data</strong> — scores en temps réel (suivi live)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rugby-gold font-bold">•</span>
              <span>
                <strong>Open-Meteo</strong> — données météorologiques des matchs
                (<a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">open-meteo.com</a>)
              </span>
            </li>
          </ul>
          <p className="text-xs text-gray-500 italic mt-4">
            Les marques et données citées restent la propriété de leurs détenteurs respectifs.
            TOP 14 PRONOS n'est affilié à aucune de ces sources.
          </p>
        </section>

        {/* Footer */}
        <section className="text-center text-gray-600 text-sm pt-4 border-t border-gray-200">
          <p>© 2024 TOP 14 PRONOS - Tous droits réservés</p>
          <p className="mt-2">
            Version 1.0 • Développé avec passion pour les amateurs de rugby 🏉
          </p>
        </section>
      </div>
    </div>
  );
}
