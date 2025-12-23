import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ChevronRight, Star, User, Mail, MessageSquare, Flag, FileText, Bell, Coins, BookOpen } from "lucide-react";
import AvisModal from "../components/AvisModal";

function ParametresPage() {
  const [showAvisModal, setShowAvisModal] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleNousContacter = () => {
    const subject = 'Contact - Top 14 Pronos'
    const body = `
Bonjour,

[Écrivez votre message ici]

Informations système (à compléter si nécessaire) :
- Téléphone : 
- Version OS : 

Merci.
    `.trim()

    window.location.href = `mailto:support@top14pronos.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  return (
    <div className="p-6 pb-24 max-w-2xl mx-auto">
      {/* Titre principal */}
      <h1 className="text-3xl font-bold text-rugby-gold mb-6">Paramètres</h1>

      {/* Infos utilisateur (si connecté) */}
      {user && (
        <div className="bg-gradient-to-r from-rugby-gold/10 to-rugby-orange/10 rounded-lg p-4 mb-4 border border-rugby-gold/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-rugby-gold rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-800">
                {user.user_metadata?.nom_complet || 'Utilisateur'}
              </p>
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Section Mon compte */}
      <div className="bg-white rounded-lg shadow-sm mb-4 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h2 className="text-sm font-bold text-gray-700 uppercase flex items-center gap-2">
            <User className="h-4 w-4" />
            Mon compte
          </h2>
        </div>

        {/* Lien vers Mon Profil */}
        <button 
          onClick={() => navigate('/profil')}
          className="w-full px-6 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
        >
          <User className="h-5 w-5 text-rugby-gold" />
          <span className="flex-1 text-left text-gray-800 font-medium">Mon profil</span>
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </button>

        {/* Ma Cagnotte */}
        <button 
          onClick={() => navigate('/ma-cagnotte')}
          className="w-full px-6 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
        >
          <Coins className="h-5 w-5 text-rugby-gold" />
          <span className="flex-1 text-left text-gray-800 font-medium">Ma Cagnotte</span>
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </button>

        {/* Gérer mes favoris */}
        <button className="w-full px-6 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100">
          <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
          <span className="flex-1 text-left text-gray-800 font-medium">Gérer mes favoris</span>
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </button>

        {/* Notifications Push */}
        <button 
          onClick={() => navigate('/notifications-push')}
          className="w-full px-6 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
        >
          <Bell className="h-5 w-5 text-blue-500" />
          <span className="flex-1 text-left text-gray-800 font-medium">Notifications Push</span>
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </button>
      </div>

      {/* Section Informations */}
      <div className="bg-white rounded-lg shadow-sm mb-4 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h2 className="text-sm font-bold text-gray-700 uppercase flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Informations
          </h2>
        </div>

        {/* Règlement du jeu */}
        <button 
          onClick={() => navigate('/reglement')}
          className="w-full px-6 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
        >
          <FileText className="h-5 w-5 text-rugby-gold" />
          <span className="flex-1 text-left text-gray-800 font-medium">Règlement du jeu</span>
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </button>
      </div>

      {/* Section Autres */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h2 className="text-sm font-bold text-gray-700 uppercase">Autres</h2>
        </div>

        {/* Nous contacter */}
        <button 
          onClick={handleNousContacter}
          className="w-full px-6 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
        >
          <Mail className="h-5 w-5 text-blue-500" />
          <span className="flex-1 text-left text-gray-800">Nous contacter</span>
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </button>

        {/* Laisser un avis */}
        <button 
          onClick={() => setShowAvisModal(true)}
          className="w-full px-6 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
        >
          <MessageSquare className="h-5 w-5 text-green-500" />
          <span className="flex-1 text-left text-gray-800">Laisser un avis</span>
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </button>

        {/* Signaler un bug */}
        <button 
          onClick={() => navigate('/signaler-bug')}
          className="w-full px-6 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
        >
          <Flag className="h-5 w-5 text-red-500" />
          <span className="flex-1 text-left text-gray-800">Signaler un bug</span>
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </button>

        {/* Conditions générales */}
        <button 
          onClick={() => navigate('/cgu')}
          className="w-full px-6 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
        >
          <FileText className="h-5 w-5 text-gray-500" />
          <span className="flex-1 text-left text-gray-800">Conditions générales</span>
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </button>
      </div>

      {/* Version de l'app */}
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-400">Version 1.0.0</p>
      </div>

      {/* Modal Avis */}
      <AvisModal isOpen={showAvisModal} onClose={() => setShowAvisModal(false)} />
    </div>
  );
}

export default ParametresPage;
