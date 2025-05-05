import React, { useState, useEffect, useCallback, memo } from "react";
import { Button } from "./ui/button";
import { Link, useLocation } from "react-router-dom";
import { User, Menu, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

// Función de throttling para limitar la frecuencia de ejecución
const throttle = (func: Function, limit: number) => {
  let inThrottle: boolean;
  return function(this: any, ...args: any[]) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Componente MobileMenu separado y memoizado
const MobileMenu = memo(({ items }: { items: { href: string; label: string }[] }) => (
  <div className="md:hidden bg-white/95 backdrop-blur-sm shadow-lg p-4 animate-fade-in-up">
    <nav className="flex flex-col space-y-4">
      {items.map((item) => (
        <a 
          key={item.href}
          href={item.href} 
          className="text-foreground hover:text-primary transition-colors font-medium p-2"
        >
          {item.label}
        </a>
      ))}
    </nav>
  </div>
));

MobileMenu.displayName = 'MobileMenu';

// Componente de Logo separado y memoizado
const Logo = memo(() => (
  <Link to="/" className="flex items-center gap-2">
    <div className="w-8 h-8 rounded-full bg-gradient-main flex items-center justify-center">
      <span className="text-white font-bold">K</span>
    </div>
    <span className="text-2xl font-bold text-gradient">kalma</span>
  </Link>
));

Logo.displayName = 'Logo';

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { currentUser } = useAuth();
  const location = useLocation();

  // Lista de elementos de navegación para el menú
  const navItems = [
    { href: "#caracteristicas", label: "Características" },
    { href: "#como-funciona", label: "Cómo Funciona" },
    { href: "#precios", label: "Precios" }
  ];

  // Manejador de scroll optimizado con throttling
  const handleScroll = useCallback(throttle(() => {
    // Usar requestAnimationFrame para optimizar el rendimiento
    window.requestAnimationFrame(() => {
      setIsScrolled(window.scrollY > 10);
    });
  }, 100), []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll]);

  // Cerrar el menú móvil cuando se cambia de ruta
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Función memoizada para cambiar el estado del menú móvil
  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen(prev => !prev);
  }, []);

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
          <Logo />
        </div>
        
        <nav className="hidden md:flex items-center space-x-8">
          {navItems.map((item) => (
            <a 
              key={item.href}
              href={item.href} 
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              {item.label}
            </a>
          ))}
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
            onClick={toggleMobileMenu}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>
      
      {/* Menú móvil - renderizado condicional con componente memoizado */}
      {mobileMenuOpen && <MobileMenu items={navItems} />}
    </header>
  );
};

export default Navbar;
