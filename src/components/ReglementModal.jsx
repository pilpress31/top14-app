import { X, Trophy, Coins, Calendar, TrendingUp, Zap, Award, Target, Hash, RefreshCw, ExternalLink, Flame, Shield, Gift } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ReglementModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  if (!isOpen) return null;

  const goToFullReglement = () => {
    onClose();
    navigate('/reglement');
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header fixe */}
          <div className="sticky top-0 bg-gradient-to-r from-rugby-gold to-rugby-bronze text-white p-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <Coins className="w-6 h-6" />
              <h2 className="text-xl font-bold">Règlement — Synthèse</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Fermer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Contenu scrollable */}
          <div className="p-6 space-y-6">
            
            {/* Principe général */}
            <section>
              <h3 className="text-lg font-bold text-rugby-gold mb-2 flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Système de jeu
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed mb-2">
                Chaque utilisateur démarre avec <strong>1000 jetons virtuels</strong>. Pronostiquez les matchs du <strong>Top 14</strong>, de la <strong>Pro D2</strong>, de la <strong>Champions Cup</strong>, de la <strong>Challenge Cup</strong> et du <strong>Rugby international</strong>, misez vos jetons et gagnez selon les résultats !
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                Vous accumulez aussi des <strong>points de classement</strong> qui récompensent la précision de vos pronostics, indépendamment des mises.
              </p>
            </section>

            {/* 🆕 Les 2 types de paris */}
            <section className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="text-base font-bold text-blue-900 mb-3 flex items-center gap-2">
                <Target className="w-5 h-5" />
                Les 2 types de paris
              </h3>

              <div className="space-y-3">
                <div className="bg-white rounded-lg p-3 border border-blue-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="w-4 h-4 text-purple-600" />
                    <p className="font-bold text-sm">Pari Vainqueur</p>
                  </div>
                  <p className="text-xs text-gray-700">
                    Pronostiquez juste qui va gagner : <strong>équipe domicile</strong>, <strong>match nul</strong>, ou <strong>équipe extérieure</strong>. Plus simple, cotes adaptées.
                  </p>
                </div>

                <div className="bg-white rounded-lg p-3 border border-blue-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Hash className="w-4 h-4 text-blue-600" />
                    <p className="font-bold text-sm">Pari Score exact</p>
                  </div>
                  <p className="text-xs text-gray-700">
                    Pronostiquez le score précis du match. Plus difficile, mais bonus à la clé en cas de score exact.
                  </p>
                </div>
              </div>

              <p className="text-xs text-gray-600 mt-3 italic">
                💡 En Top 14, vous pouvez parier sur le <strong>temps plein (FT)</strong> et la <strong>mi-temps (MT)</strong>, séparément ou ensemble. En Pro D2, Champions Cup, Challenge Cup et Rugby international, uniquement sur le temps plein (score à 80 min).
              </p>
            </section>

            {/* Calcul des gains en jetons */}
            <section>
              <h3 className="text-lg font-bold text-green-600 mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Calcul des gains en jetons
              </h3>
              
              <div className="bg-green-50 rounded-lg p-4 border border-green-200 mb-3">
                <p className="text-center text-xl font-bold text-green-600 mb-1">
                  Gain = Mise × Cote
                </p>
                <p className="text-center text-xs text-gray-600">
                  Si votre pari est gagnant
                </p>
              </div>

              <p className="text-sm text-gray-700">
                <strong>Exemple :</strong> Mise 100 jetons, cote 2.5, gagné → <span className="text-green-600 font-bold">+250 jetons</span>
              </p>
            </section>

            {/* Bonus scores exacts */}
            <section className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-4 border border-orange-300">
              <h3 className="text-lg font-bold text-orange-800 mb-3 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Bonus scores exacts
              </h3>

              <p className="text-xs text-gray-700 mb-3">
                Réservé aux paris <strong>Score exact</strong>, dans les 5 compétitions. Les paris Vainqueur ne donnent pas de bonus mais ne nécessitent pas de deviner le score.
              </p>

              <div className="space-y-2">
                <div className="flex items-center gap-2 bg-white rounded p-2">
                  <div className="w-12 h-12 bg-yellow-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                    +500
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm">Score exact Temps Plein</p>
                    <p className="text-xs text-gray-600">Vous trouvez le score final exact — Top 14, Pro D2, Champions Cup, Challenge Cup et Rugby international</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-white rounded p-2">
                  <div className="w-12 h-12 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                    +500
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm">Score exact Mi-Temps</p>
                    <p className="text-xs text-gray-600">Vous trouvez le score MT exact — Top 14 uniquement</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded p-2">
                  <Award className="w-12 h-12 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-bold">Super Bonus : +1000</p>
                    <p className="text-xs">Les 2 scores exacts (FT + MT) sur le même match — Top 14 uniquement</p>
                  </div>
                </div>
              </div>
            </section>

            {/* 🆕 Points de classement */}
            <section className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="text-lg font-bold text-blue-900 mb-3 flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Points de classement
              </h3>

              <p className="text-xs text-gray-700 mb-3">
                Indépendamment des jetons, chaque pari gagné vous rapporte des <strong>points de classement</strong> selon la précision de votre pronostic :
              </p>

              <div className="bg-white rounded-lg p-3 border border-blue-200 mb-3">
                <p className="font-bold text-xs text-blue-900 mb-2">📊 Pari Score (FT)</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>🎯 Score exact</span>
                    <strong className="text-blue-700">10 pts</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>✅ Bon vainqueur + écart exact</span>
                    <strong className="text-blue-700">7 pts</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>✅ Bon vainqueur + 1-7 pts d'écart</span>
                    <strong className="text-blue-700">5 pts</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>✅ Bon vainqueur + 8-14 pts d'écart</span>
                    <strong className="text-blue-700">3 pts</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>✅ Bon vainqueur + 15+ pts d'écart</span>
                    <strong className="text-blue-700">2 pts</strong>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-3 border border-purple-200 mb-3">
                <p className="font-bold text-xs text-purple-900 mb-2">📊 Pari Score (MT) — Bonus</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>🎯 Score MT exact</span>
                    <strong className="text-purple-700">+5 pts</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>✅ Bon vainqueur MT + écart exact</span>
                    <strong className="text-purple-700">+3 pts</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>✅ Bon vainqueur MT</span>
                    <strong className="text-purple-700">+2 pts</strong>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-3 border border-green-200">
                <p className="font-bold text-xs text-green-900 mb-1">🎯 Pari Vainqueur</p>
                <div className="flex justify-between text-xs">
                  <span>✅ Bon vainqueur (FT ou MT)</span>
                  <strong className="text-green-700">1 pt</strong>
                </div>
              </div>
            </section>

            {/* 🆕 Remise à zéro nouvelle saison */}
            <section className="bg-amber-50 rounded-lg p-4 border border-amber-300">
              <h3 className="text-base font-bold text-amber-900 mb-2 flex items-center gap-2">
                <RefreshCw className="w-5 h-5" />
                Remise à zéro à chaque édition
              </h3>
              <p className="text-xs text-gray-700 leading-relaxed mb-2">
                Le classement par points est <strong>séparé par compétition</strong>. À la fin de chaque édition (finale, match d'accession…), le compteur de points de cette compétition <strong>repart à zéro</strong> pour l'édition suivante.
              </p>
              <p className="text-xs text-gray-700 leading-relaxed">
                Votre <strong>solde de jetons</strong> n'est jamais remis à zéro — il reflète votre cagnotte personnelle. Côté Rugby international, <strong>tous les matchs</strong> rapportent des jetons et des points, comptés au <strong>classement Général</strong> de la saison.
              </p>
            </section>

            {/* Distribution mensuelle */}
            <section>
              <h3 className="text-lg font-bold text-rugby-gold mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Distribution mensuelle
              </h3>

              <p className="text-sm text-gray-700 mb-3">
                Le <strong>1er de chaque mois</strong>, recevez des jetons selon votre activité :
              </p>

              <div className="space-y-2">
                <div className="flex items-center gap-3 bg-gray-50 rounded p-2 text-sm">
                  <div className="w-10 h-10 bg-gray-400 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    +100
                  </div>
                  <span>🎁 Tous les utilisateurs</span>
                </div>

                <div className="flex items-center gap-3 bg-blue-50 rounded p-2 text-sm">
                  <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    +200
                  </div>
                  <span>⚡ Au moins 1 pari dans le mois</span>
                </div>

                <div className="flex items-center gap-3 bg-green-50 rounded p-2 text-sm">
                  <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    +500
                  </div>
                  <span>🔥 Au moins 7 paris dans le mois</span>
                </div>

                <div className="flex items-center gap-3 bg-purple-50 rounded p-2 text-sm">
                  <div className="w-10 h-10 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    +1000
                  </div>
                  <span>👑 Tous les paris du mois</span>
                </div>
              </div>
            </section>

            {/* Séries & Badges */}
            <section>
              <h3 className="text-lg font-bold text-rugby-gold mb-3 flex items-center gap-2">
                <Flame className="w-5 h-5" />
                Séries &amp; badges
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                Enchaînez les paris gagnés pour faire grimper votre <strong>série</strong> 🔥
                et débloquer des <strong>badges</strong>, affichés à côté de votre pseudo
                dans le classement Communauté. Un pari perdu remet la série à zéro.
              </p>
              <p className="text-xs text-gray-500 mt-2 italic">
                Détail des 10 badges dans le règlement complet.
              </p>
            </section>

            {/* Ligues privées */}
            <section>
              <h3 className="text-lg font-bold text-rugby-gold mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Ligues privées
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                Créez une ligue et affrontez vos amis sur un classement par
                points rien qu'à vous. Invitez-les par code, par lien, ou
                directement par leur pseudo. Jusqu'à <strong>5 ligues</strong>
                {' '}par joueur.
              </p>
              <p className="text-xs text-gray-500 mt-2 italic">
                Onglet « Mes Ligues » du Classement — détails dans le règlement complet.
              </p>
            </section>

            {/* Parrainage */}
            <section>
              <h3 className="text-lg font-bold text-rugby-gold mb-3 flex items-center gap-2">
                <Gift className="w-5 h-5" />
                Parrainage
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                Invitez vos amis avec votre lien personnel (page <strong>Inviter
                des amis</strong>). Dès que votre filleul place son <strong>premier
                pari</strong>, vous recevez <strong>chacun 250 jetons</strong>.
              </p>
              <p className="text-xs text-gray-500 mt-2 italic">
                Jusqu'à 10 filleuls — détails dans le règlement complet.
              </p>
            </section>

            {/* Règles importantes */}
            <section className="bg-yellow-50 rounded-lg p-4 border border-yellow-300">
              <h3 className="text-sm font-bold text-yellow-900 mb-2">⚠️ Règles importantes</h3>
              <ul className="space-y-1 text-xs text-gray-700">
                <li>• Mise minimum : <strong>10 jetons</strong></li>
                <li>• Mise maximum : <strong>1000 jetons</strong></li>
                <li>• Un seul pari par mi-temps et par match (Score ou Vainqueur, pas les deux)</li>
                <li>• Paris ouverts jusqu'à <strong>5 minutes avant le coup d'envoi</strong></li>
                <li>• Jetons et points <strong>virtuels</strong> (pas d'argent réel)</li>
              </ul>
            </section>

            {/* Lien vers le règlement complet */}
            <section className="bg-gradient-to-r from-rugby-gold/10 to-rugby-bronze/10 rounded-lg p-4 border border-rugby-gold/30 text-center">
              <p className="text-sm text-gray-700 mb-3">
                Pour le règlement complet et toutes les évolutions prévues :
              </p>
              <button
                onClick={goToFullReglement}
                className="inline-flex items-center gap-2 bg-rugby-gold hover:bg-rugby-bronze text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                Consulter le règlement complet
                <ExternalLink className="w-4 h-4" />
              </button>
            </section>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 p-4 border-t">
            <button
              onClick={onClose}
              className="w-full bg-rugby-gold hover:bg-rugby-bronze text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
