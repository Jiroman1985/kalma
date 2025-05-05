import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Link, useLocation } from "react-router-dom";
import { User, Menu, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { currentUser } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Cerrar el menú móvil cuando se cambia de ruta
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? "bg-white/90 backdrop-blur-sm shadow-sm py-2" 
          : "bg-transparent py-4"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between px-4">
        <div className="flex items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-main flex items-center justify-center">
              <span className="text-white font-bold">K</span>
            </div>
            <span className="text-2xl font-bold text-gradient">kalma</span>
          </Link>
        </div>
        
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#caracteristicas" className="text-foreground hover:text-primary transition-colors font-medium">Características</a>
          <a href="#como-funciona" className="text-foreground hover:text-primary transition-colors font-medium">Cómo Funciona</a>
          <a href="#precios" className="text-foreground hover:text-primary transition-colors font-medium">Precios</a>
        </nav>
        
        <div className="flex items-center gap-4">
          {currentUser ? (
            <Button asChild variant="ghost" className="rounded-full font-medium">
              <Link to="/dashboard" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Dashboard
              </Link>
            </Button>
          ) : (
            <Button asChild variant="ghost" className="rounded-full font-medium">
              <Link to="/login" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Dashboard
              </Link>
            </Button>
          )}

          <Button asChild className="bg-gradient-main hover:opacity-90 rounded-full shadow-md">
            <a href="#prueba-gratis" className="font-medium">
              Prueba Gratuita
            </a>
          </Button>
          
          {/* Botón de menú móvil */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>
      
      {/* Menú móvil */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white shadow-lg p-4 animate-fade-in-up">
          <nav className="flex flex-col space-y-4">
            <a href="#caracteristicas" className="text-foreground hover:text-primary transition-colors font-medium p-2">
              Características
            </a>
            <a href="#como-funciona" className="text-foreground hover:text-primary transition-colors font-medium p-2">
              Cómo Funciona
            </a>
            <a href="#precios" className="text-foreground hover:text-primary transition-colors font-medium p-2">
              Precios
            </a>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
