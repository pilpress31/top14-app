import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Coins, Gift, Calendar, TrendingUp, Zap, Award, Flame, Share2, Shield } from 'lucide-react';

export default function ReglementPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-rugby-white pb-24">
      {/* Header avec retour */}
      <div className="bg-gradient-to-r from-rugby-gold to-rugby-bronze p-6 shadow-lg sticky top-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white mb-4 hover:text-white/80 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-semibold">Retour</span>
        </button>
        
        <div className="flex items-center gap-3">
          <Coins className="w-8 h-8 text-white" />
          <h1 className="text-2xl font-bold text-white">Règlement</h1>
        </div>
      </div>

      {/* Contenu */}
      <div className="p-6 space-y-6 max-w-3xl mx-auto">
        {/* Principe */}
        <section className="bg-white rounded-lg shadow-sm p-6 border border-rugby-gray">
          <h3 className="text-lg font-bold text-rugby-gold mb-3 flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Principe Général
          </h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            Chaque utilisateur commence avec <strong className="text-rugby-gold">1000 jetons virtuels</strong>. 
            Pronostiquez les scores, misez des jetons sur vos prédictions, et gagnez selon les résultats réels des matchs !
          </p>
          <div className="mt-4 bg-blue-50 rounded-lg p-3 border border-blue-200">
            <p className="text-xs text-gray-700">
              🏉 <strong>4 compétitions disponibles :</strong> Top 14, Pro D2, Champions Cup et Rugby international (MONDE).
              En Top 14, vous pouvez parier sur le <strong>temps plein (FT)</strong> et la
              <strong> mi-temps (MT)</strong>, séparément ou ensemble. En Pro D2, Champions Cup et Rugby international,
              les paris portent uniquement sur le temps plein (score à 80 minutes).
            </p>
          </div>
          <div className="mt-3 bg-rugby-gold/10 rounded-lg p-3 border border-rugby-gold/30">
            <p className="text-xs text-gray-700">
              ⚠️ <strong>Important :</strong> Les jetons sont virtuels et n'ont aucune valeur monétaire.
            </p>
          </div>
        </section>

        {/* Comment parier */}
        <section className="bg-white rounded-lg shadow-sm p-6 border border-rugby-gray">
          <h3 className="text-lg font-bold text-rugby-gold mb-3 flex items-center gap-2">
            <Coins className="w-5 h-5" />
            Comment Parier ?
          </h3>
          
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-rugby-gold text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div>
                <p className="font-semibold text-sm">Pronostiquez le score</p>
                <p className="text-xs text-gray-600">Temps plein et/ou mi-temps</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-8 h-8 bg-rugby-gold text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                2
              </div>
              <div>
                <p className="font-semibold text-sm">Choisissez votre mise</p>
                <p className="text-xs text-gray-600">Entre 10 et 1000 jetons</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-8 h-8 bg-rugby-gold text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                3
              </div>
              <div>
                <p className="font-semibold text-sm">Validez avant le coup d'envoi</p>
                <p className="text-xs text-gray-600">Plus possible de modifier après</p>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-orange-50 rounded-lg p-3 border border-orange-200">
            <p className="text-xs text-orange-800">
              💡 <strong>Astuce :</strong> Diversifiez vos paris et ne misez jamais plus de 10% de votre cagnotte sur un seul match !
            </p>
          </div>
        </section>

        {/* Calcul gains */}
        <section className="bg-white rounded-lg shadow-sm p-6 border border-rugby-gray">
          <h3 className="text-lg font-bold text-green-600 mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Calcul des Gains
          </h3>
          
          <div className="bg-green-50 rounded-lg p-4 border border-green-200 mb-4">
            <p className="text-center text-2xl font-bold text-green-600 mb-2">
              Gain = Mise × Cote
            </p>
            <p className="text-center text-xs text-gray-600">
              Si vous trouvez le bon vainqueur ou le match nul
            </p>
          </div>

          <div className="space-y-3">
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <p className="text-xs font-semibold text-gray-700 mb-1">Exemple 1 :</p>
              <p className="text-sm">
                Mise 50, cote 2.0, gagné → <span className="text-green-600 font-bold">+100 jetons</span>
              </p>
            </div>

            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <p className="text-xs font-semibold text-gray-700 mb-1">Exemple 2 :</p>
              <p className="text-sm">
                Mise 100, cote 3.5, gagné → <span className="text-green-600 font-bold">+350 jetons</span>
              </p>
            </div>

            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <p className="text-xs font-semibold text-gray-700 mb-1">Exemple 3 :</p>
              <p className="text-sm">
                Mise 200, perdu → <span className="text-red-600 font-bold">-200 jetons</span>
              </p>
            </div>
          </div>
        </section>

        {/* Bonus scores exacts */}
        <section className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-6 border border-orange-300">
          <h3 className="text-lg font-bold text-orange-800 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Bonus Scores Exacts
          </h3>

          <p className="text-sm text-gray-700 mb-4">
            En plus de votre gain de base, vous pouvez obtenir des bonus supplémentaires :
          </p>

          <div className="space-y-3">
            <div className="flex items-center gap-3 bg-white rounded-lg p-3">
              <div className="w-14 h-14 bg-yellow-500 text-white rounded-full flex items-center justify-center font-bold shadow-md flex-shrink-0">
                +500
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm">Score Exact Temps Plein</p>
                <p className="text-xs text-gray-600">Trouvez le score final exact — Top 14, Pro D2, Champions Cup et Rugby international</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white rounded-lg p-3">
              <div className="w-14 h-14 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold shadow-md flex-shrink-0">
                +500
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm">Score Exact Mi-Temps</p>
                <p className="text-xs text-gray-600">Trouvez le score MT exact — Top 14 uniquement</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg p-3 shadow-md">
              <Award className="w-14 h-14 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-bold">Super Bonus : +1000</p>
                <p className="text-xs">Les 2 scores exacts (FT + MT) — Top 14 uniquement</p>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-white rounded-lg p-3 border border-orange-200">
            <p className="text-xs font-semibold text-orange-900 mb-2">💰 Exemple Maximum :</p>
            <p className="text-sm text-gray-700">
              Mise 100, cote 2.5, <strong>FT exact + MT exact</strong> :
            </p>
            <div className="mt-2 space-y-1 text-xs">
              <p>• Gain base : <strong>250 jetons</strong></p>
              <p>• Bonus FT : <strong>+500 jetons</strong></p>
              <p>• Bonus MT : <strong>+500 jetons</strong></p>
              <p>• Super bonus : <strong>+1000 jetons</strong></p>
              <p className="text-green-600 font-bold text-base mt-2">
                = TOTAL : 2250 jetons ! 🎉
              </p>
            </div>
          </div>
        </section>

        {/* Distribution mensuelle */}
        <section className="bg-white rounded-lg shadow-sm p-6 border border-rugby-gray">
          <h3 className="text-lg font-bold text-rugby-gold mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Distribution Mensuelle
          </h3>

          <p className="text-sm text-gray-700 mb-4">
            Le <strong>1er de chaque mois à minuit (UTC)</strong>, recevez automatiquement des jetons selon votre activité du mois précédent :
          </p>

          <div className="space-y-2">
            <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="w-12 h-12 bg-gray-400 text-white rounded-full flex items-center justify-center font-bold shadow flex-shrink-0">
                +100
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">🎁 Tous les utilisateurs</p>
                <p className="text-xs text-gray-600">Distribution de base</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-blue-50 rounded-lg p-3 border border-blue-200">
              <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold shadow flex-shrink-0">
                +200
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">⚡ Utilisateur actif</p>
                <p className="text-xs text-gray-600">Au moins 1 pari dans le mois</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-green-50 rounded-lg p-3 border border-green-200">
              <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center font-bold shadow flex-shrink-0">
                +500
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">🔥 Utilisateur régulier</p>
                <p className="text-xs text-gray-600">Au moins 7 paris dans le mois</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-purple-50 rounded-lg p-3 border border-purple-200">
              <div className="w-12 h-12 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold shadow flex-shrink-0">
                +1000
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">👑 Utilisateur complet</p>
                <p className="text-xs text-gray-600">Tous les paris du mois</p>
              </div>
            </div>
          </div>
        </section>

        {/* Classements */}
        <section className="bg-white rounded-lg shadow-sm p-6 border border-rugby-gray">
          <h3 className="text-lg font-bold text-rugby-gold mb-3 flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Les Classements
          </h3>

          <div className="space-y-4">
            <div>
              <p className="font-semibold text-sm mb-2">🪙 Classement par Jetons</p>
              <p className="text-xs text-gray-600 leading-relaxed">
                Basé sur votre solde actuel de jetons. Montre qui a le mieux géré sa cagnotte en gagnant des paris.
              </p>
            </div>

            <div>
              <p className="font-semibold text-sm mb-2">🏆 Classement par Points</p>
              <p className="text-xs text-gray-600 leading-relaxed mb-3">
                Récompense la précision de vos pronostics. Plus votre prono est exact, plus vous gagnez de points (indépendamment des mises).
              </p>
              
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-bold text-blue-900 mb-3 text-sm">📊 Barème Points</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span>🎯 Score exact (FT)</span>
                    <strong className="text-blue-700">10 points</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>✅ Bon vainqueur + écart exact</span>
                    <strong className="text-blue-700">7 points</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>✅ Bon vainqueur + 1-7 pts écart</span>
                    <strong className="text-blue-700">5 points</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>✅ Bon vainqueur + 8-14 pts écart</span>
                    <strong className="text-blue-700">3 points</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>✅ Bon vainqueur + 15+ pts écart</span>
                    <strong className="text-blue-700">1 point</strong>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-blue-300">
                  <p className="font-bold text-purple-900 mb-2 text-sm">🏆 Bonus Mi-Temps</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>🎯 Score exact MT</span>
                      <strong className="text-purple-700">+5 points</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>✅ Bon vainqueur MT + écart exact</span>
                      <strong className="text-purple-700">+3 points</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>✅ Bon vainqueur MT</span>
                      <strong className="text-purple-700">+1 point</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 🆕 Remise à zéro à chaque nouvelle saison */}
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-300">
              <p className="font-bold text-amber-900 mb-2 text-sm flex items-center gap-2">
                🔄 Un classement par compétition, remis à zéro à chaque édition
              </p>
              <p className="text-xs text-gray-700 leading-relaxed mb-2">
                Le classement par points est <strong>séparé pour chaque compétition</strong> (Top 14, Pro D2, Champions Cup, Rugby international), chacune avec son propre pronostiqueur IA.
              </p>
              <p className="text-xs text-gray-700 leading-relaxed mb-2">
                Les points se cumulent durant l'<strong>édition en cours</strong> d'une compétition. Dès que son <strong>match décisif</strong> est joué (finale, match d'accession…), le compteur de points de cette compétition <strong>repart à zéro</strong> pour l'édition suivante.
              </p>
              <p className="text-xs text-gray-700 leading-relaxed mb-2">
                Côté <strong>Rugby international</strong> : les matchs disputés entre deux grandes échéances (tournées d'été, tests…) rapportent des <strong>jetons</strong> mais <strong>0 point de classement</strong> ; le comptage reprend à la <strong>Nations Championship</strong>. Votre <strong>solde de jetons</strong> n'est jamais remis à zéro.
              </p>
              <p className="text-xs text-gray-600 leading-relaxed italic">
                💡 L'historique des éditions terminées reste consultable dans <strong>Ma Cagnotte → Mes Points</strong> (encart « éditions terminées »).
              </p>
            </div>
          </div>

          {/* Récompenses futures */}
          <div className="mt-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 border-2 border-yellow-400">
            <h4 className="font-bold text-orange-900 mb-2 text-sm flex items-center gap-2">
              <Gift className="w-4 h-4" />
              🎁 Récompenses Futures (Évolution prévue)
            </h4>
            <p className="text-xs text-gray-700 mb-3">
              Une évolution de ce jeu concours pourra récompenser le <strong>1er aux points de chaque compétition</strong>, à la clôture de son édition (finale, match d'accession…) :
            </p>
            
            <div className="space-y-2">
              <div className="bg-white rounded p-3 border border-orange-200">
                <p className="font-bold text-sm text-orange-900 mb-1">🏉 Pour le vainqueur de chaque classement :</p>
                <p className="text-xs text-gray-700">
                  Un <strong>ballon de rugby au choix</strong> d'une valeur maximale de <strong>50€</strong>
                </p>
              </div>

              <div className="bg-white rounded p-2 text-xs">
                <p className="mb-1"><strong>📦 France Métropolitaine :</strong></p>
                <p className="text-gray-600">Frais d'envoi inclus (valeur max 50€ tout compris)</p>
              </div>

              <div className="bg-white rounded p-2 text-xs">
                <p className="mb-1"><strong>🏝️ Corse et DOM-TOM :</strong></p>
                <p className="text-gray-600">Ballon 50€ + frais d'envoi à la charge de l'utilisateur</p>
              </div>
            </div>

            <p className="text-xs text-orange-800 mt-3 bg-white rounded p-2">
              ⚠️ <strong>Important :</strong> Cette fonctionnalité n'est pas encore active. Les dates et modalités seront communiquées ultérieurement.
            </p>
          </div>
        </section>

        {/* Séries & Badges */}
        <section className="bg-white rounded-lg shadow-sm p-6 border border-rugby-gray">
          <h3 className="text-lg font-bold text-rugby-gold mb-3 flex items-center gap-2">
            <Flame className="w-5 h-5" />
            Séries &amp; Badges
          </h3>

          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            Chaque pari gagné fait grimper votre <strong>série</strong> et vous
            rapproche de nouveaux <strong>badges</strong>. Ils s'affichent à côté
            de votre pseudo dans le classement de la Communauté.
          </p>

          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200 mb-4">
            <p className="font-bold text-orange-900 mb-2 text-sm flex items-center gap-2">
              <Flame className="w-4 h-4" />
              La série
            </p>
            <p className="text-xs text-gray-700 leading-relaxed">
              C'est le nombre de paris gagnés <strong>d'affilée</strong>, toutes
              compétitions confondues. Un pari perdu remet la série à zéro. Elle
              apparaît dans le classement dès 2 paris gagnés consécutifs.
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mb-3">
            <p className="font-bold text-blue-900 mb-3 text-sm">🎖️ Badges de paris gagnés</p>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between"><span>Première victoire</span><strong className="text-blue-700">1 pari gagné</strong></div>
              <div className="flex justify-between"><span>Apprenti parieur</span><strong className="text-blue-700">10 paris gagnés</strong></div>
              <div className="flex justify-between"><span>Parieur confirmé</span><strong className="text-blue-700">25 paris gagnés</strong></div>
              <div className="flex justify-between"><span>Fin connaisseur</span><strong className="text-blue-700">50 paris gagnés</strong></div>
              <div className="flex justify-between"><span>Expert du pari</span><strong className="text-blue-700">100 paris gagnés</strong></div>
              <div className="flex justify-between"><span>Légende</span><strong className="text-blue-700">250 paris gagnés</strong></div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <p className="font-bold text-purple-900 mb-3 text-sm">🔥 Badges de série</p>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between"><span>Sur sa lancée</span><strong className="text-purple-700">série de 3</strong></div>
              <div className="flex justify-between"><span>En feu</span><strong className="text-purple-700">série de 5</strong></div>
              <div className="flex justify-between"><span>Série royale</span><strong className="text-purple-700">série de 10</strong></div>
              <div className="flex justify-between"><span>Intouchable</span><strong className="text-purple-700">série de 20</strong></div>
            </div>
          </div>

          <p className="text-xs text-gray-600 mt-3 italic">
            💡 Un badge débloqué est acquis définitivement. Le classement affiche
            vos 3 badges les plus récents.
          </p>
        </section>

        {/* Partager mon prono */}
        <section className="bg-white rounded-lg shadow-sm p-6 border border-rugby-gray">
          <h3 className="text-lg font-bold text-rugby-gold mb-3 flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Partager mon prono
          </h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            Depuis la page <strong>Mes Paris</strong>, vous pouvez transformer un
            pari en cours en image et la partager sur vos réseaux. La carte met en
            regard <strong>votre pronostic</strong> et celui de <strong>l'IA</strong>,
            au format story. Une bonne façon de défier vos amis !
          </p>
        </section>

        {/* Ligues privées */}
        <section className="bg-white rounded-lg shadow-sm p-6 border border-rugby-gray">
          <h3 className="text-lg font-bold text-rugby-gold mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Ligues privées
          </h3>
          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            Créez votre propre ligue et affrontez vos amis sur un classement
            rien qu'à vous. Le classement d'une ligue reprend le
            <strong> classement par points</strong> de la saison en cours,
            limité à ses membres.
          </p>

          <div className="space-y-3">
            <div className="bg-rugby-gold/5 rounded-lg p-3 border border-rugby-gold/20">
              <p className="font-semibold text-sm mb-1">🛡️ Créer &amp; rejoindre</p>
              <p className="text-xs text-gray-600 leading-relaxed">
                Chaque ligue a un code d'invitation. Partagez-le (ou son lien)
                pour qu'on vous rejoigne, ou saisissez le code d'un ami. Un
                joueur peut appartenir à <strong>5 ligues maximum</strong>.
              </p>
            </div>

            <div className="bg-rugby-gold/5 rounded-lg p-3 border border-rugby-gold/20">
              <p className="font-semibold text-sm mb-1">✉️ Inviter un joueur</p>
              <p className="text-xs text-gray-600 leading-relaxed">
                Le créateur d'une ligue peut aussi inviter un joueur déjà
                inscrit par son pseudo. L'invité reçoit une notification et
                choisit de l'accepter ou non.
              </p>
            </div>

            <div className="bg-rugby-gold/5 rounded-lg p-3 border border-rugby-gold/20">
              <p className="font-semibold text-sm mb-1">⚙️ Administration</p>
              <p className="text-xs text-gray-600 leading-relaxed">
                Le créateur gère sa ligue : la renommer, en exclure un membre
                ou la supprimer. Les autres membres peuvent la quitter à tout
                moment.
              </p>
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-3 italic">
            💡 Vos ligues sont accessibles depuis l'onglet « Mes Ligues » du
            Classement, et depuis la page Plus.
          </p>
        </section>

        {/* Parrainage */}
        <section className="bg-white rounded-lg shadow-sm p-6 border border-rugby-gray">
          <h3 className="text-lg font-bold text-rugby-gold mb-3 flex items-center gap-2">
            <Gift className="w-5 h-5" />
            Parrainage
          </h3>
          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            Depuis la page <strong>Inviter des amis</strong>, partagez votre lien
            personnel. Vos amis s'inscrivent sans code et profitent d'un accès
            gratuit jusqu'au 30 septembre 2026.
          </p>

          <div className="bg-amber-50 rounded-lg p-4 border border-amber-200 mb-3">
            <p className="font-bold text-amber-900 mb-2 text-sm flex items-center gap-2">
              <Gift className="w-4 h-4" />
              250 jetons pour chacun
            </p>
            <p className="text-xs text-gray-700 leading-relaxed">
              Dès que votre filleul place son <strong>premier pari</strong>, vous
              recevez <strong>tous les deux 250 jetons</strong> : un bonus de
              bienvenue pour lui, une récompense de parrainage pour vous.
            </p>
          </div>

          <p className="text-xs text-gray-500 italic">
            💡 La récompense est versée une seule fois par filleul, à son premier
            pari. Vous pouvez parrainer jusqu'à <strong>10 amis</strong> (jusqu'au
            30 septembre 2026).
          </p>
        </section>

        {/* Règles importantes */}
        <section className="bg-yellow-50 rounded-lg p-6 border-2 border-yellow-300">
          <h3 className="text-lg font-bold text-yellow-900 mb-3">⚠️ Règles Importantes</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-yellow-600 font-bold">•</span>
              <span><strong>Mise minimum :</strong> 10 jetons</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-600 font-bold">•</span>
              <span><strong>Mise maximum :</strong> 1000 jetons</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-600 font-bold">•</span>
              <span><strong>Deadline :</strong> Paris possibles uniquement avant le coup d'envoi</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-600 font-bold">•</span>
              <span><strong>Modification :</strong> Impossible après le début du match</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-600 font-bold">•</span>
              <span><strong>Jetons virtuels :</strong> Aucune valeur monétaire, jeu gratuit</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-600 font-bold">•</span>
              <span><strong>Bonus survie :</strong> Si vous tombez à 0, vous recevrez 100 jetons pour continuer</span>
            </li>
          </ul>
        </section>

        {/* Info finale */}
        <div className="bg-rugby-gold/10 rounded-lg p-4 border border-rugby-gold/30 text-center">
          <p className="text-sm text-gray-700">
            🎮 <strong>Amusez-vous et que le meilleur gagne !</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
