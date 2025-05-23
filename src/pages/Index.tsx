import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeatureSection from "@/components/FeatureSection";
import IntegrationSection from "@/components/IntegrationSection";
import TimeSection from "@/components/TimeSection";
import TestimonialSection from "@/components/TestimonialSection";
import CallToAction from "@/components/CallToAction";
import Footer from "@/components/Footer";
import { Route, Routes, useLocation } from "react-router-dom";
import Dashboard from "./Dashboard";
import Conversations from "./Conversations";
import Analytics from "./Analytics";
import KnowledgeBase from "./KnowledgeBase";
import Settings from "./Settings";
import Login from "./Login";
import NotFound from "./NotFound";
import SocialNetworks from "./SocialNetworks";
import ProtectedRoute from "@/components/ProtectedRoute";
import NangoConnect from "@/components/NangoConnect";

const Index = () => {
  const location = useLocation();
  const isDashboardRoute = location.pathname.includes('/dashboard');
  
  return (
    <div className="min-h-screen">
      <Navbar />
      <Routes>
        <Route path="/" element={
          <>
            <HeroSection />
            
            {/* Sección de prueba de Nango */}
            <div className="bg-gray-100 py-16">
              <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold mb-8 text-center">Prueba de integración Nango</h2>
                <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-lg">
                  <h3 className="text-xl font-semibold mb-4">Conecta tus servicios</h3>
                  <p className="text-gray-600 mb-6">Haz clic en los botones para conectar diferentes servicios usando Nango.</p>
                  
                  <div className="flex flex-wrap gap-4">
                    <NangoConnect 
                      userId="usuario-demo-123"
                      provider="gmail"
                      buttonText="Conectar Gmail"
                      className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg"
                    />
                    
                    <NangoConnect 
                      userId="usuario-demo-123"
                      provider="google-calendar"
                      buttonText="Conectar Google Calendar"
                      className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg"
                    />
                    
                    <NangoConnect 
                      userId="usuario-demo-123"
                      provider="outlook"
                      buttonText="Conectar Outlook"
                      className="bg-blue-700 hover:bg-blue-800 text-white font-medium py-2 px-4 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <FeatureSection />
            <IntegrationSection />
            <TimeSection />
            <TestimonialSection />
            <CallToAction />
          </>
        } />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/dashboard/conversations" element={<ProtectedRoute><Conversations /></ProtectedRoute>} />
        <Route path="/dashboard/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="/dashboard/knowledge-base" element={<ProtectedRoute><KnowledgeBase /></ProtectedRoute>} />
        <Route path="/dashboard/social-networks" element={<ProtectedRoute><SocialNetworks /></ProtectedRoute>} />
        <Route path="/dashboard/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {!isDashboardRoute && <Footer />}
    </div>
  );
};

export default Index;
