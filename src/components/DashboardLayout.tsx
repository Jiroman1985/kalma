import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Outlet, Link, useLocation } from "react-router-dom";
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
  Database
} from "lucide-react";

const DashboardLayout = () => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: <LayoutDashboard className="mr-3 h-5 w-5" />
    },
    {
      name: "Conversaciones",
      path: "/dashboard/conversations",
      icon: <MessageSquare className="mr-3 h-5 w-5" />
    },
    {
      name: "Analytics",
      path: "/dashboard/analytics",
      icon: <BarChart3 className="mr-3 h-5 w-5" />
    },
    {
      name: "Base de conocimiento",
      path: "/dashboard/knowledge-base",
      icon: <Database className="mr-3 h-5 w-5" />
    },
    {
      name: "Configuración",
      path: "/dashboard/settings",
      icon: <Settings className="mr-3 h-5 w-5" />
    }
  ];

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

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
                  <FileText size={20} className="text-whatsapp" />
                  <h2 className="text-lg font-medium">
                    Whats<span className="text-blue-dark">Pyme</span> Panel
                  </h2>
                </div>
              </div>
              <div className="flex-1 h-0 overflow-y-auto">
                <nav className="mt-5 px-2 space-y-1">
                  {navItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.path}
                      className={`group flex items-center px-4 py-3 text-base font-medium rounded-md ${
                        location.pathname === item.path
                          ? "bg-gray-100 text-whatsapp-dark"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                      onClick={toggleSidebar}
                    >
                      {item.icon}
                      <span className="ml-3">{item.name}</span>
                    </Link>
                  ))}
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
                <FileText size={20} className="text-whatsapp" />
                <h2 className="text-lg font-medium">
                  Whats<span className="text-blue-dark">Pyme</span> Panel
                </h2>
              </div>
            </div>
            <div className="flex-1 flex flex-col overflow-y-auto">
              <nav className="flex-1 px-4 py-4 space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`group flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                      location.pathname === item.path
                        ? "bg-gray-100 text-whatsapp-dark"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {item.icon}
                    <span className="ml-3">{item.name}</span>
                  </Link>
                ))}
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

      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>

      <div className="md:hidden fixed bottom-0 left-0 z-50 w-full h-16 bg-white border-t border-gray-200">
        <div className="grid h-full grid-cols-4">
          <Button variant="ghost" className="flex flex-col items-center justify-center" onClick={() => navigate('/dashboard')}>
            <Home size={20} />
            <span className="text-xs mt-1">Inicio</span>
          </Button>
          <Button variant="ghost" className="flex flex-col items-center justify-center" onClick={() => navigate('/dashboard/conversations')}>
            <MessageSquare size={20} />
            <span className="text-xs mt-1">Chats</span>
          </Button>
          <Button variant="ghost" className="flex flex-col items-center justify-center" onClick={() => navigate('/dashboard/analytics')}>
            <BarChart3 size={20} />
            <span className="text-xs mt-1">Análisis</span>
          </Button>
          <Button variant="ghost" className="flex flex-col items-center justify-center" onClick={toggleMobileMenu}>
            <Menu size={20} />
            <span className="text-xs mt-1">Más</span>
          </Button>
        </div>
      </div>
      
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50 flex justify-end">
          <div className="w-64 h-full bg-white p-4 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium">
                Whats<span className="text-blue-dark">Pyme</span> Panel
              </h2>
              <Button variant="ghost" size="icon" onClick={toggleMobileMenu}>
                <X size={20} />
              </Button>
            </div>
            <div className="flex-1 h-0 overflow-y-auto">
              <nav className="mt-5 px-2 space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`group flex items-center px-4 py-3 text-base font-medium rounded-md ${
                      location.pathname === item.path
                        ? "bg-gray-100 text-whatsapp-dark"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                    onClick={toggleMobileMenu}
                  >
                    {item.icon}
                    <span className="ml-3">{item.name}</span>
                  </Link>
                ))}
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
  );
};

export default DashboardLayout;
