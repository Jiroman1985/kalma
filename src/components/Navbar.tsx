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
        isScrolled ? "bg-white shadow-md py-2" : "bg-transparent py-4"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between px-4">
        <div className="flex items-center">
          <span className="text-2xl font-bold text-teal-600">AU<span className="text-cyan-600">RA</span></span>
        </div>
        
        <nav className="hidden md:flex items-center space-x-6">
          <a href="#caracteristicas" className="text-gray-600 hover:text-teal-600 transition-colors">Características</a>
          <a href="#como-funciona" className="text-gray-600 hover:text-teal-600 transition-colors">Cómo Funciona</a>
          <a href="#precios" className="text-gray-600 hover:text-teal-600 transition-colors">Precios</a>
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
            <a href="#prueba-gratis" className="bg-teal-600 hover:bg-teal-700 transition-colors">
              Prueba Gratuita
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
