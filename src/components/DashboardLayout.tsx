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
      name: "Dashboard",
      path: "/dashboard",
      icon: <LayoutDashboard className="mr-3 h-5 w-5" />,
      restricted: !hasCompleteAccess // Dashboard está restringido para usuarios sin acceso completo o sin vincular
    },
    {
      name: "Conversaciones",
      path: "/dashboard/conversations",
      icon: <MessageSquare className="mr-3 h-5 w-5" />,
      restricted: !hasCompleteAccess
    },
    {
      name: "Analytics",
      path: "/dashboard/analytics-new",
      icon: <BarChart3 className="mr-3 h-5 w-5" />,
      restricted: !hasOnlyFullAccess // Solo requiere acceso completo, no vinculación
    },
    {
      name: "Base de conocimiento",
      path: "/dashboard/knowledge-base",
      icon: <Database className="mr-3 h-5 w-5" />,
      restricted: !hasCompleteAccess
    },
    {
      name: "Canales",
      path: "/dashboard/channels",
      icon: <Globe className="mr-3 h-5 w-5" />,
      restricted: !hasOnlyFullAccess // Solo requiere acceso completo, no vinculación
    },
    {
      name: "Configuración",
      path: "/dashboard/settings",
      icon: <Settings className="mr-3 h-5 w-5" />,
      restricted: false // Configuración siempre es accesible
    }
  ];

  // Mantenemos una entrada oculta para mantener compatibilidad con la ruta actual
  const hiddenNavItems = [
    {
      name: "Redes Sociales",
      path: "/dashboard/social-networks",
      icon: <Share2 className="mr-3 h-5 w-5" />,
      restricted: !hasOnlyFullAccess
    }
  ];

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  // Renderizar elemento de navegación con tooltip si está restringido
  const renderNavItem = (item, mobile = false, onClick = null) => {
    // Crear una key única para cada elemento
    const key = `nav-${item.name.toLowerCase().replace(/\s+/g, '-')}${mobile ? '-mobile' : ''}`;
    
    const itemClassName = `group flex items-center px-4 py-3 text-${mobile ? 'base' : 'sm'} font-medium rounded-md ${
      location.pathname === item.path
        ? (item.restricted ? "bg-gray-50 text-gray-400" : "bg-gray-100 text-whatsapp-dark")
        : item.restricted 
          ? "text-gray-400 cursor-not-allowed opacity-50" 
          : "text-gray-600 hover:bg-gray-50"
    }`;

    const content = (
      <>
        {item.icon}
        <span className="ml-3">{item.name}</span>
        {item.restricted && <Lock className="ml-2 h-4 w-4" />}
      </>
    );

    // Si está restringido, mostrar tooltip, si no, usar Link normal
    if (item.restricted) {
      // Determinar el mensaje del tooltip según la sección
      let tooltipMessage = "";
      if (item.name === "Analytics" || item.name === "Canales" || item.name === "Redes Sociales") {
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
            <TooltipContent>
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
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
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
          <div className="fixed inset-0 z-40 flex">
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={toggleSidebar}></div>
            <div className="relative flex-1 flex flex-col max-w-xs w-full pt-5 pb-4 bg-white">
              <div className="flex items-center justify-center h-16 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <FileText size={20} className="text-teal-600" />
                  <h2 className="text-lg font-medium">kalma Panel</h2>
                </div>
              </div>
              <div className="flex-1 h-0 overflow-y-auto">
                <nav className="mt-5 px-2 space-y-1">
                  {navItems.map((item) => renderNavItem(item, true, toggleSidebar))}
                </nav>
              </div>
              <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
                <div className="flex items-center w-full justify-between">
                  <div className="flex items-center">
                    <div className="bg-gray-300 rounded-full p-1">
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
                    className="text-gray-600 hover:text-gray-900"
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
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 border-r border-gray-200 bg-white">
            <div className="flex items-center justify-center h-16 flex-shrink-0 px-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <FileText size={20} className="text-teal-600" />
                <h2 className="text-lg font-medium">kalma Panel</h2>
              </div>
            </div>
            <div className="flex-1 flex flex-col overflow-y-auto">
              <nav className="flex-1 px-4 py-4 space-y-2">
                {navItems.map((item) => renderNavItem(item))}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex items-center w-full justify-between">
                <div className="flex items-center">
                  <div className="bg-gray-300 rounded-full p-1">
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
                  className="text-gray-600 hover:text-gray-900"
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
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Barra de navegación superior móvil */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow lg:hidden">
          <div className="flex-1 flex justify-center px-4 sm:px-6 lg:px-8">
            <div className="flex-1 flex items-center justify-center">
              <h1 className="text-lg font-semibold">kalma Panel</h1>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;





