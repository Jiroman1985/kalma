import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import TestimonialSection from "@/components/TestimonialSection";
import PricingSection from "@/components/PricingSection";
import CtaSection from "@/components/CtaSection";
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
import FeaturesGrid from "@/components/FeaturesGrid";
import TimeRecoverySection from "@/components/TimeRecoverySection";

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
            <FeaturesGrid />
            <TimeRecoverySection />
            <FeaturesSection />
            <HowItWorksSection />
            <TestimonialSection />
            <PricingSection />
            <CtaSection />
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
