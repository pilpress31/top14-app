import { X, Trophy, Coins, Gift, Calendar, TrendingUp, Zap, Award } from 'lucide-react';

export default function ReglementModal({ isOpen, onClose }) {
  if (!isOpen) return null;

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
              <h2 className="text-xl font-bold">Règlement</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Contenu scrollable */}
          <div className="p-6 space-y-6">
            {/* Principe */}
            <section>
              <h3 className="text-lg font-bold text-rugby-gold mb-2 flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Système de Jetons
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                Chaque utilisateur démarre avec <strong>1000 jetons virtuels</strong>. 
                Pronostiquez les scores, misez des jetons et gagnez selon les résultats !
              </p>
            </section>

            {/* Gains */}
            <section>
              <h3 className="text-lg font-bold text-green-600 mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Calcul des gains
              </h3>
              
              <div className="bg-green-50 rounded-lg p-4 border border-green-200 mb-3">
                <p className="text-center text-xl font-bold text-green-600 mb-1">
                  Gain = Mise × Cote
                </p>
                <p className="text-center text-xs text-gray-600">
                  Si vous trouvez le bon vainqueur
                </p>
              </div>

              <div className="space-y-2 text-sm">
                <p><strong>Ex :</strong> Mise 100 jetons, cote 2.5, gagné → <span className="text-green-600 font-bold">+250 jetons</span></p>
              </div>
            </section>

            {/* Bonus */}
            <section className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-4 border border-orange-300">
              <h3 className="text-lg font-bold text-orange-800 mb-3 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Bonus scores exacts
              </h3>

              <div className="space-y-2">
                <div className="flex items-center gap-2 bg-white rounded p-2">
                  <div className="w-12 h-12 bg-yellow-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    +500
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm">Score exact Temps Plein</p>
                    <p className="text-xs text-gray-600">Trouvez le score final exact</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-white rounded p-2">
                  <div className="w-12 h-12 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    +500
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm">Score exact Mi-Temps</p>
                    <p className="text-xs text-gray-600">Trouvez le score MT exact</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded p-2">
                  <Award className="w-12 h-12" />
                  <div className="flex-1">
                    <p className="font-bold">Super Bonus : +1000</p>
                    <p className="text-xs">Les 2 scores exacts (FT + MT)</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Distribution */}
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
                  <div className="w-10 h-10 bg-gray-400 text-white rounded-full flex items-center justify-center font-bold">
                    +100
                  </div>
                  <span>🎁 Tous les utilisateurs</span>
                </div>

                <div className="flex items-center gap-3 bg-blue-50 rounded p-2 text-sm">
                  <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                    +200
                  </div>
                  <span>⚡ Au moins 1 pari</span>
                </div>

                <div className="flex items-center gap-3 bg-green-50 rounded p-2 text-sm">
                  <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">
                    +500
                  </div>
                  <span>🔥 Au moins 7 paris</span>
                </div>

                <div className="flex items-center gap-3 bg-purple-50 rounded p-2 text-sm">
                  <div className="w-10 h-10 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">
                    +1000
                  </div>
                  <span>👑 Tous les paris du mois</span>
                </div>
              </div>
            </section>

            {/* Règles */}
            <section className="bg-yellow-50 rounded-lg p-4 border border-yellow-300">
              <h3 className="text-sm font-bold text-yellow-900 mb-2">⚠️ Règles importantes</h3>
              <ul className="space-y-1 text-xs text-gray-700">
                <li>• Mise minimum : <strong>10 jetons</strong></li>
                <li>• Mise maximum : <strong>1000 jetons</strong></li>
                <li>• Paris avant coup d'envoi uniquement</li>
                <li>• Jetons virtuels (pas d'argent réel)</li>
              </ul>
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
