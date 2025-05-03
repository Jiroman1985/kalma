import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { 
  doc, 
  collection,
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  getDoc,
  setDoc,
  Timestamp,
  writeBatch
} from "firebase/firestore";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Facebook, 
  Instagram, 
  Twitter, 
  Linkedin, 
  Plus, 
  Trash2, 
  Edit,
  Loader2,
  Copy,
  Mail,
  Star,
  BellRing,
  BellOff,
  Bot,
  MessageSquare,
  X,
  CheckCircle,
  Clock,
  MessageSquareDashed,
  Globe,
  Sparkles,
  Settings,
  ChevronRight,
  ExternalLink,
  Info
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle } from "lucide-react";
import { ShieldCheck } from "lucide-react";
import { RefreshCw } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Interfaces para representar los canales y configuraciones
interface Channel {
  id: string;
  name: string;
  icon: JSX.Element;
  description: string;
  color: string;
  gradient?: string;
  features: string[];
  setupSteps: string[];
  connected: boolean;
  authUrl?: string;
}

interface ChannelConnection {
  id: string;
  channelId: string;
  username: string;
  profileUrl: string;
  profileImage?: string;
  connectedAt: any; 
  status: 'active' | 'pending' | 'error';
  lastSync?: any;
}

const Channels = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("channels");
  const [connections, setConnections] = useState<ChannelConnection[]>([]);
  
  // Estado para modal de conexión detallada
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  
  // URL de autenticación de Instagram obtenida de tus requisitos
  const instagramAuthUrl = "https://www.instagram.com/oauth/authorize?enable_fb_login=0&force_authentication=1&client_id=3029546990541926&redirect_uri=https://kalma-lab.netlify.app/auth/callback&response_type=code&scope=instagram_business_basic%2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments%2Cinstagram_business_content_publish%2Cinstagram_business_manage_insights";

  // Definición de canales disponibles
  const channels: Channel[] = [
    {
      id: "website",
      name: "Sitio Web",
      icon: <Globe className="h-6 w-6" />,
      description: "Chat en vivo en tu sitio web para atención inmediata a visitantes y clientes",
      color: "bg-blue-500",
      gradient: "from-blue-500 to-blue-600",
      features: [
        "Widget personalizable para tu sitio",
        "Historial completo de conversaciones",
        "Notificaciones en tiempo real",
        "Respuestas automáticas con IA"
      ],
      setupSteps: [
        "Crear widget de chat",
        "Personalizar apariencia",
        "Añadir el código al sitio web",
        "Configurar respuestas automáticas"
      ],
      connected: false
    },
    {
      id: "instagram",
      name: "Instagram",
      icon: <Instagram className="h-6 w-6" />,
      description: "Gestiona mensajes directos y comentarios de tu cuenta de Instagram Business",
      color: "bg-pink-500",
      gradient: "from-purple-500 to-pink-600",
      features: [
        "Recepción de mensajes directos",
        "Gestión de comentarios",
        "Respuestas automatizadas",
        "Análisis de sentimiento"
      ],
      setupSteps: [
        "Conectar cuenta de Instagram Business",
        "Configurar webhook",
        "Activar respuestas automáticas",
        "Personalizar mensajes"
      ],
      connected: false,
      authUrl: instagramAuthUrl
    },
    {
      id: "messenger",
      name: "Messenger",
      icon: <MessageSquare className="h-6 w-6" />,
      description: "Conecta tu página de Facebook para gestionar mensajes de Messenger",
      color: "bg-blue-600",
      gradient: "from-blue-400 to-blue-700",
      features: [
        "Recepción de mensajes de Messenger",
        "Respuestas instantáneas",
        "Plantillas personalizadas",
        "Etiquetado automático"
      ],
      setupSteps: [
        "Conectar página de Facebook",
        "Activar integración de Messenger",
        "Configurar respuestas iniciales",
        "Definir flujos de conversación"
      ],
      connected: false
    },
    {
      id: "whatsapp",
      name: "WhatsApp",
      icon: <MessageSquareDashed className="h-6 w-6" />,
      description: "Gestiona conversaciones de WhatsApp Business desde un solo lugar",
      color: "bg-green-500",
      gradient: "from-green-400 to-green-600",
      features: [
        "Recepción de mensajes de WhatsApp",
        "Plantillas aprobadas por Meta",
        "Alertas de nuevos mensajes",
        "Integraciones con CRM"
      ],
      setupSteps: [
        "Crear cuenta de WhatsApp Business",
        "Solicitar API de WhatsApp",
        "Verificar número telefónico",
        "Configurar plantillas"
      ],
      connected: false
    },
    {
      id: "email",
      name: "Email",
      icon: <Mail className="h-6 w-6" />,
      description: "Convierte emails en conversaciones y gestiona toda tu comunicación",
      color: "bg-indigo-500",
      gradient: "from-indigo-400 to-indigo-600",
      features: [
        "Bandeja de entrada unificada",
        "Conversión de emails a tickets",
        "Plantillas de respuesta",
        "Seguimiento de estado"
      ],
      setupSteps: [
        "Conectar cuenta de correo",
        "Configurar reglas de procesamiento",
        "Crear plantillas de respuesta",
        "Establecer SLAs de respuesta"
      ],
      connected: false
    },
    {
      id: "telegram",
      name: "Telegram",
      icon: <Send className="h-6 w-6" />,
      description: "Integra tu bot de Telegram para automatizar respuestas y gestionar chats",
      color: "bg-sky-500",
      gradient: "from-sky-400 to-sky-600",
      features: [
        "Gestión de chats de Telegram",
        "Comandos personalizados",
        "Respuestas automáticas",
        "Envío de multimedia"
      ],
      setupSteps: [
        "Crear bot con BotFather",
        "Obtener token de API",
        "Conectar bot a kalma",
        "Configurar comandos"
      ],
      connected: false
    }
  ];

  // Efectos para cargar datos iniciales
  useEffect(() => {
    if (currentUser) {
      loadConnections();
    } else {
      setIsLoading(false);
    }
  }, [currentUser]);

  // Función para cargar conexiones existentes
  const loadConnections = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    
    try {
      // Simulación de carga para el prototipo
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Aquí iría la carga real desde Firestore
      const connectionsSnapshot = await getDocs(
        collection(db, "users", currentUser.uid, "channelConnections")
      );
      
      const connectionsData: ChannelConnection[] = [];
      
      connectionsSnapshot.forEach(doc => {
        connectionsData.push({
          id: doc.id,
          ...doc.data()
        } as ChannelConnection);
      });
      
      setConnections(connectionsData);
    } catch (error) {
      console.error("Error al cargar conexiones:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar tus conexiones",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Función para conectar un canal
  const connectChannel = (channel: Channel) => {
    // Si es Instagram, usar la URL de autorización proporcionada
    if (channel.id === "instagram" && channel.authUrl) {
      window.location.href = channel.authUrl;
      return;
    }
    
    // Para otros canales (en la versión actual, simular el proceso)
    setSelectedChannel(channel);
    setShowConnectionModal(true);
  };

  // Renderizado de tarjetas de canales
  const renderChannelCards = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {channels.map((channel) => {
          const isConnected = connections.some(conn => conn.channelId === channel.id);
          
          return (
            <motion.div
              key={channel.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <Card className="h-full flex flex-col shadow-md hover:shadow-lg transition-shadow border-t-4 overflow-hidden" style={{ borderTopColor: channel.color.replace('bg-', '').includes('-') ? `#8B5CF6` : `var(--${channel.color.replace('bg-', '')})` }}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-full ${channel.gradient ? `bg-gradient-to-r ${channel.gradient}` : channel.color} flex items-center justify-center text-white mb-2`}>
                      {channel.icon}
                    </div>
                    {isConnected ? (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-200 hover:text-green-900">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Conectado
                      </Badge>
                    ) : null}
                  </div>
                  <CardTitle className="text-xl">{channel.name}</CardTitle>
                  <CardDescription className="text-sm line-clamp-2">
                    {channel.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <h4 className="text-sm font-medium mb-2 flex items-center">
                    <Sparkles className="h-4 w-4 mr-1 text-amber-500" />
                    Características
                  </h4>
                  <ul className="text-sm space-y-1 mb-4">
                    {channel.features.slice(0, 3).map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <CheckCircle className="h-3.5 w-3.5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                    {channel.features.length > 3 && (
                      <li className="text-xs text-gray-500 pl-5 italic">
                        {`+ ${channel.features.length - 3} más`}
                      </li>
                    )}
                  </ul>
                </CardContent>
                <CardFooter className="pt-2 flex justify-between items-center border-t bg-gray-50">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <Info className="h-4 w-4" />
                          <span className="sr-only">Más información</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        Ver documentación detallada
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <Button 
                    onClick={() => connectChannel(channel)}
                    className={`${isConnected ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : `bg-gradient-to-r ${channel.gradient || channel.color}`} rounded-full`}
                    size="sm"
                  >
                    {isConnected ? (
                      <>
                        <Settings className="h-4 w-4 mr-1" />
                        Configurar
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-1" />
                        Conectar
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          );
        })}
      </div>
    );
  };

  // Renderizado de tarjetas de conexiones activas
  const renderConnectionsTable = () => {
    if (connections.length === 0) {
      return (
        <div className="text-center p-8 border rounded-lg bg-gray-50">
          <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <h3 className="text-lg font-medium text-gray-700">No hay canales conectados</h3>
          <p className="text-gray-500 mt-1 mb-4">Conecta tu primer canal para empezar a gestionar tus comunicaciones</p>
          <Button onClick={() => setActiveTab("channels")}>
            Explorar canales disponibles
          </Button>
        </div>
      );
    }
    
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Canal</TableHead>
                <TableHead>Cuenta</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Última sincronización</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {connections.map(connection => {
                // Encontrar el canal correspondiente
                const channel = channels.find(c => c.id === connection.channelId);
                
                if (!channel) return null;
                
                return (
                  <TableRow key={connection.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full ${channel.gradient ? `bg-gradient-to-r ${channel.gradient}` : channel.color} flex items-center justify-center text-white`}>
                          {channel.icon}
                        </div>
                        <div>
                          <p className="font-medium">{channel.name}</p>
                          <p className="text-xs text-gray-500">ID: {connection.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          {connection.profileImage ? (
                            <AvatarImage src={connection.profileImage} alt={connection.username} />
                          ) : (
                            <AvatarFallback>{connection.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <p className="font-medium">{connection.username}</p>
                          <a 
                            href={connection.profileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-500 hover:underline flex items-center"
                          >
                            Ver perfil
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {connection.status === 'active' && (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Activo
                        </Badge>
                      )}
                      {connection.status === 'pending' && (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                          <Clock className="h-3 w-3 mr-1" />
                          Pendiente
                        </Badge>
                      )}
                      {connection.status === 'error' && (
                        <Badge variant="destructive">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Error
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {connection.lastSync ? (
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1 text-gray-400" />
                          <span className="text-sm">
                            {new Date(connection.lastSync.toDate()).toLocaleString()}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Nunca</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button variant="ghost" size="sm">
                          <RefreshCw className="h-4 w-4" />
                          <span className="sr-only">Sincronizar</span>
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                          <span className="sr-only">Configurar</span>
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4 text-red-500" />
                          <span className="sr-only">Eliminar</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </motion.div>
    );
  };

  // Componente principal
  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Canales</h1>
          <p className="text-gray-500 mt-1">
            Conecta y gestiona todos tus canales de comunicación con clientes
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="w-full md:w-auto"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="channels" className="flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                Disponibles
              </TabsTrigger>
              <TabsTrigger value="connections" className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Conectados
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsContent value="channels" className="mt-0">
            {renderChannelCards()}
          </TabsContent>
          
          <TabsContent value="connections" className="mt-0">
            {renderConnectionsTable()}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default Channels;

// Subcomponente para el icono de Telegram que no está disponible en Lucide
function Send(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M22 2L11 13"></path>
      <path d="M22 2L15 22L11 13L2 9L22 2Z"></path>
    </svg>
  );
} 