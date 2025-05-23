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
import ServiceButtons from "@/components/ServiceButtons";

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
            
            {/* Sección de servicios de integración */}
            <div className="bg-gray-100 py-16">
              <div className="container mx-auto px-4">
                <ServiceButtons />
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
