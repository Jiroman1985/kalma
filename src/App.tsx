import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Analytics from "./pages/Analytics";
import AnalyticsNew from "./pages/AnalyticsNew";
import Conversations from "./pages/Conversations";
import KnowledgeBase from "./pages/KnowledgeBase";
import SocialNetworks from "./pages/SocialNetworks";
import Channels from "./pages/Channels";
import OAuthCallback from "./pages/OAuthCallback";
import DashboardLayout from "./components/DashboardLayout";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Importar componentes de autenticación de Instagram
import InstagramAuthStart from "./pages/auth/instagram/start";
import InstagramAuthCallback from "./pages/auth/instagram/callback";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            
            {/* Rutas de autenticación de Instagram */}
            <Route path="/auth/instagram/start" element={
              <ProtectedRoute>
                <InstagramAuthStart />
              </ProtectedRoute>
            } />
            <Route path="/auth/instagram/callback" element={
              <ProtectedRoute>
                <InstagramAuthCallback />
              </ProtectedRoute>
            } />
            
            {/* Ruta genérica para callbacks OAuth */}
            <Route path="/auth/callback" element={
              <ProtectedRoute>
                <OAuthCallback />
              </ProtectedRoute>
            } />
            
            {/* Rutas de callback para OAuth de redes sociales */}
            <Route path="/auth/callback/:platform" element={
              <ProtectedRoute>
                <OAuthCallback />
              </ProtectedRoute>
            } />
            
            {/* Ruta de configuración accesible directamente */}
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            
            {/* Rutas protegidas del Dashboard */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="settings" element={<Settings />} />
              <Route path="analytics" element={<AnalyticsNew />} />
              <Route path="analytics-old" element={<Analytics />} />
              <Route path="conversations" element={<Conversations />} />
              <Route path="knowledge-base" element={<KnowledgeBase />} />
              <Route path="social-networks" element={<SocialNetworks />} />
              <Route path="channels" element={<Channels />} />
            </Route>
            
            {/* Ruta para 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
