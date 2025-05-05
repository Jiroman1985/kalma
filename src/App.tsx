import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";

// Carga diferida de componentes para mejorar el rendimiento inicial
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Settings = lazy(() => import("./pages/Settings"));
const AnalyticsNew = lazy(() => import("./pages/AnalyticsNew"));
const Conversations = lazy(() => import("./pages/Conversations"));
const KnowledgeBase = lazy(() => import("./pages/KnowledgeBase"));
const Channels = lazy(() => import("./pages/Channels"));
const OAuthCallback = lazy(() => import("./pages/OAuthCallback"));
const DashboardLayout = lazy(() => import("./components/DashboardLayout"));

// Componentes de autenticación de Instagram
const InstagramAuthStart = lazy(() => import("./pages/auth/instagram/start"));
const InstagramAuthCallback = lazy(() => import("./pages/auth/instagram/callback"));

// Componente de carga
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-pulse flex space-x-2">
      <div className="h-3 w-3 bg-primary rounded-full"></div>
      <div className="h-3 w-3 bg-primary rounded-full"></div>
      <div className="h-3 w-3 bg-primary rounded-full"></div>
    </div>
  </div>
);

// Configuración de QueryClient optimizada
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutos
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<LoadingFallback />}>
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
                {/* Redirigir a Conversaciones por defecto */}
                <Route index element={<Navigate to="/dashboard/conversations" replace />} />
                <Route path="conversations" element={<Conversations />} />
                <Route path="analytics" element={<AnalyticsNew />} />
                <Route path="knowledge-base" element={<KnowledgeBase />} />
                <Route path="channels" element={<Channels />} />
                <Route path="settings" element={<Settings />} />
              </Route>
              
              {/* Ruta para 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
