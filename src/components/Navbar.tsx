
import { Button } from "./ui/button";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { User } from "lucide-react";

const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const { currentUser } = useAuth();
  
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <header 
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        scrolled 
          ? "py-2 bg-white/95 backdrop-blur-sm shadow-sm" 
          : "py-4 bg-transparent"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between px-4">
        <div className="flex items-center">
          <span className="text-2xl font-bold text-whatsapp-dark">Pyme<span className="text-blue-dark">AI</span></span>
        </div>
        
        <nav className="hidden md:flex items-center space-x-6">
          <a href="#caracteristicas" className="text-gray-600 hover:text-whatsapp-dark transition-colors">Características</a>
          <a href="#como-funciona" className="text-gray-600 hover:text-whatsapp-dark transition-colors">Cómo Funciona</a>
          <a href="#precios" className="text-gray-600 hover:text-whatsapp-dark transition-colors">Precios</a>
        </nav>
        
        <div className="flex items-center gap-4">
          {currentUser ? (
            <Button asChild variant="outline">
              <Link to="/dashboard" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Dashboard
              </Link>
            </Button>
          ) : (
            <Button asChild variant="outline">
              <Link to="/login" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Acceder
              </Link>
            </Button>
          )}

          <Button asChild>
            <a href="#prueba-gratis" className="bg-whatsapp hover:bg-whatsapp-dark transition-colors">
              Prueba Gratuita
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
