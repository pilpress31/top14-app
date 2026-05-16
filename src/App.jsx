// ========================================= //
// ================= App.jsx =============== //
// ========================================= //

import { Routes, Route, useLocation, useNavigate, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ChatNotificationProvider } from "./contexts/ChatNotificationContext";
import { NotificationsProvider } from "./contexts/NotificationsContext";
import { ChampionnatProvider, useChampionnat } from "./contexts/ChampionnatContext";
import ProtectedRoute from "./components/ProtectedRoute";
import BottomNav from "@/components/BottomNav";
import { useState } from "react";
import { useAccessControl } from "./hooks/useAccessControl";
import PaywallPage from "./pages/PaywallPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import AccessBanner from "./components/AccessBanner";

// Pages
import IAPage from '@/pages/IAPage';
import PronosPage from './pages/PronosPage';
import ActuPage from './pages/ActuPage';
import ChatPage from './pages/ChatPage';
import LivePage from './pages/LivePage';
import ClassementPageWithTabs from './pages/ClassementPageWithTabs';
import StatistiquesPage from './pages/StatistiquesPage';
import SignalerBugPage from './pages/SignalerBugPage';
import NotificationsPushPage from './pages/NotificationsPushPage';
import NotificationsDiagnosticPage from './pages/NotificationsDiagnosticPage';
import AProposPage from "./pages/AProposPage";
import ReglementPage from "./pages/ReglementPage";
import CGUPage from "./pages/CGUPage";
import PolitiqueConfidentialitePage from "./pages/PolitiqueConfidentialitePage";

// Pages Auth
import ParametresPage from './pages/ParametresPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilPage from './pages/ProfilPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import MaCagnotte from './pages/MaCagnotte';
import MesPoints from './pages/MesPoints';
import FavorisPage from './pages/FavorisPage';
import { FavoritesProvider } from './contexts/FavoritesContext';
import GuidePage, { GUIDE_STORAGE_KEY } from './pages/GuidePage';

/* ✅ Hook pour savoir quel onglet est actif */
function useActiveLabel() {
  const location = useLocation();
  const path = location.pathname;
  if (path === "/" || path === "/ia") return "IA";
  if (path === "/pronos") return "Pronos";
  if (path === "/actu") return "Actu";
  if (path.startsWith("/classement")) return "Classement";
  if (path === "/live") return "Live";
  if (path === "/chat") return "Chat";
  if (path.startsWith("/plus")) return "Plus";
  return "IA";
}

// ============================================
// AppContent — doit être DANS AuthProvider
// ============================================
function AppContent() {
  const active = useActiveLabel();
  const [resetFlag, setResetFlag] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // ── Redirection guide au 1er login ──
  // Déclenché une seule fois après connexion si guide jamais vu
  // Ignoré sur les pages publiques et si déjà sur /guide
  useEffect(() => {
    if (
      user &&
      !localStorage.getItem(GUIDE_STORAGE_KEY) &&
      location.pathname !== '/guide' &&
      !isPublicPage
    ) {
      navigate('/guide');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);


  // ── TOUS LES HOOKS EN HAUT ──
  const {
    loading:        accessLoading,
    isExpired,
    isExpiringSoon,
    isBeta,
    joursRestants,
    tarif,
    refresh:        refreshAccess
  } = useAccessControl();

  // ── Pages qui ne doivent jamais être bloquées ──
  const isPublicPage = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/confidentialite',   // ← Politique de confidentialité publique (Google Play + RGPD)
    '/payment/success',   // ← IMPORTANT : ne jamais bloquer le retour PayPal
    '/payment/cancel'
  ].includes(location.pathname);

  const hideBottomNav = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/profil',
    '/ma-cagnotte',
    '/mes-points',
    '/favoris',
    '/guide',
    '/conditions-generales',
    '/signaler-bug',
    '/notifications-push',
    '/notifications-diagnostic',
    '/reglement',
    '/a-propos',
    '/cgu',
    '/confidentialite',   // ← Page légale publique
    '/payment/success',
    '/payment/cancel'
  ].includes(location.pathname);

  // Écran de chargement pendant la vérification d'accès
  // Ne pas afficher sur les pages publiques
  if (user && accessLoading && !isPublicPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rugby-gold/10 to-rugby-orange/10 flex flex-col items-center justify-center gap-4">
        <div className="text-5xl animate-bounce">🏉</div>
        <p className="text-rugby-gold font-semibold text-lg tracking-wide">Top 14 Pronos</p>
        <div className="flex gap-1.5 mt-2">
          <div className="w-2 h-2 rounded-full bg-rugby-gold animate-bounce" style={{animationDelay:'0ms'}}></div>
          <div className="w-2 h-2 rounded-full bg-rugby-gold animate-bounce" style={{animationDelay:'150ms'}}></div>
          <div className="w-2 h-2 rounded-full bg-rugby-gold animate-bounce" style={{animationDelay:'300ms'}}></div>
        </div>
      </div>
    );
  }

  // Paywall si accès expiré — jamais sur les pages publiques
  if (user && !accessLoading && isExpired && !isBeta && !isPublicPage) {
    return (
      <PaywallPage
        tarif={tarif}
        onPaymentSuccess={() => refreshAccess()}
      />
    );
  }

  return (
    <div className="min-h-screen bg-rugby-white">

      {/* Bannière expiration imminente */}
      {user && isExpiringSoon && !isBeta && (
        <AccessBanner joursRestants={joursRestants} tarif={tarif} />
      )}


      <Routes>
        {/* Routes publiques */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* ✅ Politique de confidentialité — publique pour Google Play et conformité RGPD */}
        <Route path="/confidentialite" element={<PolitiqueConfidentialitePage />} />

        {/* ✅ Route dédiée retour PayPal — séparée du PaywallPage */}
        <Route path="/payment/success" element={<PaymentSuccessPage />} />
        <Route path="/payment/cancel" element={<Navigate to="/" replace />} />

        {/* Route racine */}
        <Route path="/" element={<Navigate to="/ia" replace />} />

        <Route path="/ia" element={<ProtectedRoute><IAPage /></ProtectedRoute>} />
        <Route path="/pronos" element={<ProtectedRoute><PronosPage /></ProtectedRoute>} />
        <Route path="/classement" element={<ProtectedRoute><ClassementPageWithTabs /></ProtectedRoute>} />
        <Route path="/actu" element={<ProtectedRoute><ActuPage /></ProtectedRoute>} />
        <Route path="/live" element={<ProtectedRoute><LivePage /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="/statistiques" element={<ProtectedRoute><StatistiquesPage /></ProtectedRoute>} />
        <Route path="/plus" element={<ProtectedRoute><ParametresPage /></ProtectedRoute>} />
        <Route path="/profil" element={<ProtectedRoute><ProfilPage /></ProtectedRoute>} />
        <Route path="/ma-cagnotte" element={<ProtectedRoute><MaCagnotte /></ProtectedRoute>} />
        <Route path="/mes-points" element={<ProtectedRoute><MesPoints /></ProtectedRoute>} />
        <Route path="/favoris" element={<ProtectedRoute><FavorisPage /></ProtectedRoute>} />
        <Route path="/guide" element={<ProtectedRoute><GuidePage /></ProtectedRoute>} />
        <Route path="/a-propos" element={<ProtectedRoute><AProposPage /></ProtectedRoute>} />
        <Route path="/reglement" element={<ProtectedRoute><ReglementPage /></ProtectedRoute>} />
        <Route path="/cgu" element={<ProtectedRoute><CGUPage /></ProtectedRoute>} />
        <Route path="/signaler-bug" element={<ProtectedRoute><SignalerBugPage /></ProtectedRoute>} />
        <Route path="/notifications-push" element={<ProtectedRoute><NotificationsPushPage /></ProtectedRoute>} />
        <Route path="/notifications-diagnostic" element={<ProtectedRoute><NotificationsDiagnosticPage /></ProtectedRoute>} />
      </Routes>

      {!hideBottomNav && (
        <BottomNav
          active={active}
          onPronosClick={() => setResetFlag(prev => !prev)}
        />
      )}
    </div>
  );
}

function App() {
  // ✅ Bloquer overscroll bounce uniquement sur iOS PWA standalone
  // window.navigator.standalone est exclusif à iOS Safari — Android non affecté
  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = window.navigator.standalone === true;
    if (isIOS && isStandalone) {
      document.documentElement.style.overscrollBehaviorY = 'none';
    }
  }, []);

  return (
    <AuthProvider>
      <ChampionnatProvider>
        <FavoritesProvider>
          <ChatNotificationProvider>
            <NotificationsProvider>
              <AppContent />
            </NotificationsProvider>
          </ChatNotificationProvider>
        </FavoritesProvider>
      </ChampionnatProvider>
    </AuthProvider>
  );
}

export default App;
