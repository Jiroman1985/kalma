import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Settings, 
  BarChart, 
  MessageCircle, 
  User, 
  LogOut, 
  Menu, 
  X,
  FileText,
  Home,
  MessageSquare,
  BarChart3,
  Database,
  Lock,
  Share2,
  Globe
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const DashboardLayout = () => {
  const { currentUser, userData, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Verificar si el usuario tiene acceso completo Y está vinculado
  const hasFullAccess = userData?.hasFullAccess || false;
  const isVinculado = userData?.vinculado || false;
  const hasCompleteAccess = hasFullAccess && isVinculado;
  
  // Para algunas funciones solo requerimos acceso completo, no vinculación
  const hasOnlyFullAccess = hasFullAccess;

  // Asegurarnos de que el componente esté montado antes de renderizar
  // para evitar discrepancias entre servidor y cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    {
      name: "Conversaciones",
      path: "/dashboard/conversations",
      icon: <MessageSquare className="h-5 w-5" />,
      restricted: !hasCompleteAccess
    },
    {
      name: "Analytics",
      path: "/dashboard/analytics",
      icon: <BarChart3 className="h-5 w-5" />,
      restricted: !hasOnlyFullAccess
    },
    {
      name: "Base de conocimiento",
      path: "/dashboard/knowledge-base",
      icon: <Database className="h-5 w-5" />,
      restricted: !hasCompleteAccess
    },
    {
      name: "Canales",
      path: "/dashboard/channels",
      icon: <Globe className="h-5 w-5" />,
      restricted: !hasOnlyFullAccess
    },
    {
      name: "Configuración",
      path: "/dashboard/settings",
      icon: <Settings className="h-5 w-5" />,
      restricted: false
    }
  ];

  // Mantenemos una entrada oculta para mantener compatibilidad con la ruta actual
  const hiddenNavItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      restricted: !hasCompleteAccess
    }
  ];

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  // Renderizar elemento de navegación con tooltip si está restringido
  const renderNavItem = (item, mobile = false, onClick = null, index = 0) => {
    // Crear una key única para cada elemento
    const key = `nav-${item.name.toLowerCase().replace(/\s+/g, '-')}${mobile ? '-mobile' : ''}`;
    
    // Agregar clase para animación escalonada
    const staggerClass = `stagger-${index + 1}`;
    
    const itemClassName = `group flex items-center py-3 px-4 rounded-xl ${
      location.pathname === item.path
        ? (item.restricted ? "text-gray-400" : "bg-gradient-to-r from-blue-50 to-pink-50 text-blue-600 font-medium")
        : item.restricted 
          ? "text-gray-400 cursor-not-allowed opacity-60" 
          : "text-gray-600 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-pink-50/50"
    } transition-all duration-200 ${mobile ? '' : `animate-fade-in-left ${staggerClass}`}`;

    const content = (
      <>
        <span className="flex items-center justify-center w-8 h-8 transition-all duration-300 group-hover:scale-110">
          {item.icon}
        </span>
        <span className="ml-3 transition-all duration-300 group-hover:translate-x-0.5">{item.name}</span>
        {item.restricted && <Lock className="ml-2 h-4 w-4" />}
      </>
    );

    // Si está restringido, mostrar tooltip, si no, usar Link normal
    if (item.restricted) {
      // Determinar el mensaje del tooltip según la sección
      let tooltipMessage = "";
      if (item.name === "Analytics" || item.name === "Canales") {
        tooltipMessage = "Necesitas tener una suscripción activa para acceder a esta función";
      } else {
        tooltipMessage = "Necesitas terminar la vinculación de tu WhatsApp para poder acceder a esta función";
      }
      
      return (
        <TooltipProvider key={key}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div 
                className={itemClassName} 
                onClick={() => {
                  navigate("/dashboard/settings");
                  if (onClick) onClick();
                }}
              >
                {content}
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-white shadow-lg rounded-lg p-3 border border-gray-100 animate-fade-in-up">
              <p>{tooltipMessage}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    
    return (
      <Link
        key={key}
        to={item.path}
        className={itemClassName}
        onClick={onClick}
      >
        {content}
      </Link>
    );
  };

  // Si no está montado aún o no hay datos de usuario, mostrar un layout básico
  if (!mounted || !userData) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-pulse-glow">
          <p className="text-gray-500">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Sidebar para móviles */}
      <div className="lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4 z-50"
          onClick={toggleSidebar}
        >
          {sidebarOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </Button>

        {sidebarOpen && (
          <div className="fixed inset-0 z-40 flex animate-fade-in-left">
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={toggleSidebar}></div>
            <div className="relative flex-1 flex flex-col max-w-xs w-full pt-5 pb-4 bg-white animate-fade-in-left">
              <div className="flex items-center justify-center h-16 border-b border-gray-100">
                <div className="flex items-center gap-2 animate-fade-in-up">
                  <div className="bg-gradient-to-r from-blue-400 to-pink-400 w-8 h-8 rounded-md flex items-center justify-center text-white font-bold shadow-md animate-scale-in">
                    K
                  </div>
                  <h2 className="text-lg font-medium bg-gradient-to-r from-blue-500 to-pink-400 bg-clip-text text-transparent animate-fade-in-up">
                    kalma Flow
                  </h2>
                </div>
              </div>
              <div className="flex-1 h-0 overflow-y-auto pt-4 px-3">
                <nav className="space-y-1">
                  {navItems.map((item, index) => renderNavItem(item, true, toggleSidebar, index))}
                </nav>
              </div>
              <div className="flex-shrink-0 flex border-t border-gray-100 p-4">
                <div className="flex items-center w-full justify-between animate-fade-in-up">
                  <div className="flex items-center">
                    <div className="bg-gradient-to-r from-blue-100 to-pink-100 rounded-full p-1 shadow-sm">
                      <User className="h-6 w-6 text-gray-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-700 truncate">
                        {currentUser?.displayName || currentUser?.email}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={logout}
                    className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors duration-300"
                    aria-label="Cerrar sesión"
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar para escritorio */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64 animate-fade-in-left">
          <div className="flex flex-col h-0 flex-1 bg-white border-r border-gray-100 shadow-sm">
            <div className="flex items-center justify-center h-16 flex-shrink-0 px-4 border-b border-gray-100">
              <div className="flex items-center gap-2 animate-fade-in-up">
                <div className="bg-gradient-to-r from-blue-400 to-pink-400 w-8 h-8 rounded-md flex items-center justify-center text-white font-bold shadow-md animate-scale-in">
                  K
                </div>
                <h2 className="text-lg font-medium bg-gradient-to-r from-blue-500 to-pink-400 bg-clip-text text-transparent">
                  kalma Flow
                </h2>
              </div>
            </div>
            <div className="flex-1 flex flex-col overflow-y-auto pt-5">
              <nav className="flex-1 px-3 space-y-1">
                {navItems.map((item, index) => renderNavItem(item, false, null, index))}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-100 p-4">
              <div className="flex items-center w-full justify-between animate-fade-in-up">
                <div className="flex items-center">
                  <div className="bg-gradient-to-r from-blue-100 to-pink-100 rounded-full p-1 shadow-sm transition-transform duration-300 hover:scale-105">
                    <User className="h-6 w-6 text-gray-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-700 truncate">
                      {currentUser?.displayName || currentUser?.email}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={logout}
                  className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors duration-300"
                  aria-label="Cerrar sesión"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden bg-gray-50">
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6 px-4 sm:px-6 lg:px-8 animate-fade-in-up">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;






