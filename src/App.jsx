import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ChatNotificationProvider } from "./contexts/ChatNotificationContext";
import ProtectedRoute from "./components/ProtectedRoute";
import BottomNav from "@/components/BottomNav";
import { useState, useEffect } from "react";

// Pages
import IAPage from '@/pages/IAPage';
import PronosPage from './pages/PronosPage';
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

// Pages Auth
import ParametresPage from './pages/ParametresPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilPage from './pages/ProfilPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import MaCagnotte from './pages/MaCagnotte';

/* ✅ Hook pour savoir quel onglet est actif */
function useActiveLabel() {
  const location = useLocation();
  const path = location.pathname;
  if (path === "/" || path === "/ia") return "IA";
  if (path === "/pronos") return "Pronos";
  if (path.startsWith("/classement")) return "Classement";
  if (path === "/live") return "Live";
  if (path === "/chat") return "Chat";
  if (path.startsWith("/plus")) return "Plus";
  return "IA";
}

function App() {
  const active = useActiveLabel();
  const [resetFlag, setResetFlag] = useState(false);
  const location = useLocation();
  
  // ✅ POPUP SORTIE APPLICATION - UNIQUEMENT SUR PAGES PRINCIPALES
  useEffect(() => {
    const handleBackButton = (e) => {
      // ✅ Pages principales (BottomNav) où on veut le popup
      const mainPages = ['/ia', '/pronos', '/classement', '/live', '/chat', '/plus'];
      const currentPath = window.location.pathname;
      
      // Si on est sur une page principale, demander confirmation
      if (mainPages.includes(currentPath)) {
        e.preventDefault();
        
        if (window.confirm('Voulez-vous quitter l\'application ?')) {
          window.history.back();
        } else {
          window.history.pushState(null, '', window.location.pathname);
        }
      }
      // Sinon, laisser le comportement normal (retour vers page précédente)
    };

    window.addEventListener('popstate', handleBackButton);

    return () => {
      window.removeEventListener('popstate', handleBackButton);
    };
  }, []);
  
  // Ne pas afficher la BottomNav sur les pages d'authentification
  const hideBottomNav = [
    '/login', 
    '/register', 
    '/forgot-password', 
    '/reset-password',
    '/profil',
    '/ma-cagnotte',
    '/conditions-generales',
    '/signaler-bug',
    '/notifications-push',
    '/notifications-diagnostic'
  ].includes(location.pathname);
  
  return (
    <AuthProvider>
      <ChatNotificationProvider>
        <div className="min-h-screen bg-rugby-white">
          <Routes>
            {/* Routes publiques */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* ✅ Route racine : Redirection vers /ia */}
            <Route path="/" element={<Navigate to="/ia" replace />} />

            {/* ✅ Route IA (page d'accueil) */}
            <Route 
              path="/ia" 
              element={
                <ProtectedRoute>
                  <IAPage />
                </ProtectedRoute>
              } 
            />

            {/* ✅ Route Pronos (paris) */}
            <Route
              path="/pronos"
              element={
                <ProtectedRoute>
                  <PronosPage />
                </ProtectedRoute>
              }
            />

            {/* ✅ Route Classement */}
            <Route 
              path="/classement" 
              element={
                <ProtectedRoute>
                  <ClassementPageWithTabs />
                </ProtectedRoute>
              }    
            />

            {/* ✅ Route Live (ex-Résultats) */}
            <Route 
              path="/live" 
              element={
                <ProtectedRoute>
                  <LivePage />
                </ProtectedRoute>
              } 
            />

            {/* ✅ Route Chat (nouveau) */}
            <Route 
              path="/chat" 
              element={
                <ProtectedRoute>
                  <ChatPage />
                </ProtectedRoute>
              } 
            />

            {/* ✅ Route Statistiques */}
            <Route 
              path="/statistiques" 
              element={
                <ProtectedRoute>
                  <StatistiquesPage />
                </ProtectedRoute>
              } 
            />

            {/* ✅ Route Plus (Paramètres) */}
            <Route 
              path="/plus" 
              element={
                <ProtectedRoute>
                  <ParametresPage />
                </ProtectedRoute>
              } 
            />

            {/* ✅ Route Profil */}
            <Route 
              path="/profil" 
              element={
                <ProtectedRoute>
                  <ProfilPage />
                </ProtectedRoute>
              } 
            />

            {/* ✅ Route Ma Cagnotte (nouveau) */}
            <Route 
              path="/ma-cagnotte" 
              element={
                <ProtectedRoute>
                  <MaCagnotte />
                </ProtectedRoute>
              } 
            />

            {/* Routes informations */}
            <Route 
              path="/a-propos" 
              element={
                <ProtectedRoute>
                  <AProposPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/reglement" 
              element={
                <ProtectedRoute>
                  <ReglementPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/cgu" 
              element={
                <ProtectedRoute>
                  <CGUPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/signaler-bug" 
              element={
                <ProtectedRoute>
                  <SignalerBugPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/notifications-push" 
              element={
                <ProtectedRoute>
                  <NotificationsPushPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/notifications-diagnostic" 
              element={
                <ProtectedRoute>
                  <NotificationsDiagnosticPage />
                </ProtectedRoute>
              } 
            />
          </Routes>
        
          {!hideBottomNav && (
            <BottomNav
              active={active}
              onPronosClick={() => setResetFlag(prev => !prev)}
            />
          )}
        </div>
      </ChatNotificationProvider>
    </AuthProvider>
  );  
}

export default App;
