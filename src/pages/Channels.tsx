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
import { useNavigate } from "react-router-dom";
import { checkGmailConnection } from "@/lib/emailService";

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
  
  // Estados para autenticación de Gmail
  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailEmail, setGmailEmail] = useState("");
  const [gmailPassword, setGmailPassword] = useState("");
  const [rememberCredentials, setRememberCredentials] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  
  // Estado para mostrar modal de configuración
  const [showConfigModal, setShowConfigModal] = useState(false);
  
  // Estados para opciones de configuración de Gmail
  const [gmailConfig, setGmailConfig] = useState({
    autoReply: false,
    emailSummaries: false,
    priorityInbox: false,
    scheduleEmails: false
  });

  // Estados para Instagram
  const [instagramConnected, setInstagramConnected] = useState(false);
  const [instagramTokenExpired, setInstagramTokenExpired] = useState(false);
  const [instagramUsername, setInstagramUsername] = useState("");

  // URL de autenticación de Instagram obtenida de tus requisitos
  const instagramAuthUrl = "https://www.instagram.com/oauth/authorize?enable_fb_login=0&force_authentication=1&client_id=3029546990541926&redirect_uri=https://kalma-lab.netlify.app/auth/instagram/callback&response_type=code&scope=instagram_business_basic%2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments%2Cinstagram_business_content_publish%2Cinstagram_business_manage_insights";

  const navigate = useNavigate();

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
      id: "gmail",
      name: "Gmail",
      icon: (
        <svg 
          className="h-6 w-6" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M22.0001 6.00055V18.0005C22.0001 19.1005 21.1001 20.0005 20.0001 20.0005H18.0001V8.00055L12.0001 12.8005L6.00006 8.00055V20.0005H4.00006C2.90006 20.0005 2.00006 19.1005 2.00006 18.0005V6.00055C2.00006 5.47055 2.21006 4.97055 2.58006 4.60055C2.95006 4.23055 3.45006 4.00055 4.00006 4.00055H4.33006L12.0001 10.0005L19.6701 4.00055H20.0001C20.5501 4.00055 21.0501 4.23055 21.4201 4.60055C21.7901 4.97055 22.0001 5.47055 22.0001 6.00055Z" fill="currentColor"/>
        </svg>
      ),
      description: "Conecta tu cuenta de Gmail para gestionar y automatizar tus correos electrónicos",
      color: "bg-red-500",
      gradient: "from-red-400 to-red-600",
      features: [
        "Gestión de bandeja de entrada",
        "Respuestas automáticas con IA",
        "Resúmenes de correos electrónicos",
        "Priorización inteligente de emails"
      ],
      setupSteps: [
        "Conectar cuenta de Gmail",
        "Definir reglas de automatización",
        "Configurar respuestas inteligentes",
        "Establecer preferencias de notificación"
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
      checkInstagramConnection(); // Verificar si Instagram ya está conectado
      checkGmailConnectionStatus(); // Verificar si Gmail ya está conectado
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

  // Función para verificar el estado de la conexión con Instagram
  const checkInstagramConnection = async () => {
    if (!currentUser) return;
    
    try {
      console.log('Verificando conexión de Instagram para:', currentUser.uid);
      
      // Verificar si existe el documento de Instagram en socialTokens
      const socialTokenRef = doc(db, 'users', currentUser.uid, 'socialTokens', 'instagram');
      const socialTokenDoc = await getDoc(socialTokenRef);
      
      if (socialTokenDoc.exists()) {
        const instagramData = socialTokenDoc.data();
        console.log('Datos de conexión Instagram encontrados:', Object.keys(instagramData));
        
        // Verificar si tenemos los datos necesarios
        if (instagramData.accessToken && instagramData.instagramUserId) {
          console.log('Instagram conectado con ID:', instagramData.instagramUserId);
          setInstagramUsername(instagramData.username || '');
          
          // Verificar si el token está expirado
          if (instagramData.tokenExpiry && Date.now() > instagramData.tokenExpiry) {
            console.log('Token de Instagram expirado:', new Date(instagramData.tokenExpiry));
            setInstagramTokenExpired(true);
          } else {
            setInstagramTokenExpired(false);
          }
          
          setInstagramConnected(true);
          
          // Verificar si hay una conexión en channelConnections
          const channelRef = doc(db, 'users', currentUser.uid, 'channelConnections', 'instagram');
          const channelDoc = await getDoc(channelRef);
          
          // Si no existe en channelConnections, pero sí en socialTokens, crear la entrada
          if (!channelDoc.exists()) {
            console.log('Creando entrada en channelConnections para Instagram');
            await setDoc(channelRef, {
              channelId: 'instagram',
              username: instagramData.username || '',
              profileUrl: instagramData.profileUrl || '',
              connectedAt: new Date(),
              status: 'active',
              lastSync: new Date()
            });
            
            // Forzar recarga de conexiones para actualizar UI
            await loadConnections();
          }
          
          return;
        }
      }
      
      console.log('Instagram no conectado o datos incompletos');
      setInstagramConnected(false);
      setInstagramTokenExpired(false);
      
    } catch (error) {
      console.error('Error al verificar conexión de Instagram:', error);
      setInstagramConnected(false);
      setInstagramTokenExpired(false);
    }
  };

  // Función para verificar si Gmail ya está conectado
  const checkGmailConnectionStatus = async () => {
    if (!currentUser) return;
    
    try {
      const { connected, profileInfo } = await checkGmailConnection(currentUser.uid);
      
      setGmailConnected(connected);
      
      if (connected && profileInfo?.email) {
        setGmailEmail(profileInfo.email);
        
        // Verificar si ya existe en las conexiones, si no, añadirlo
        const existingConnection = connections.find(conn => 
          conn.channelId === "gmail" && conn.username === profileInfo.email
        );
        
        if (!existingConnection) {
          // Añadir a la lista de conexiones para mostrar en UI
          const connectionData: ChannelConnection = {
            id: `gmail_${new Date().getTime()}`,
            channelId: "gmail",
            username: profileInfo.email,
            profileUrl: `https://mail.google.com/mail/u/${profileInfo.email}`,
            profileImage: profileInfo.picture,
            connectedAt: Timestamp.now(),
            status: 'active',
            lastSync: Timestamp.now()
          };
          
          setConnections(prev => [...prev, connectionData]);
        }
      }
    } catch (error) {
      console.error("Error al verificar conexión de Gmail:", error);
    }
  };

  // Función para conectar un canal
  const connectChannel = (channel: Channel) => {
    // Si es Instagram, verificar si ya está conectado
    if (channel.id === "instagram") {
      if (instagramConnected) {
        // Si ya está conectado, mostrar mensaje y opciones
        toast({
          title: "Instagram ya conectado",
          description: `Tu cuenta @${instagramUsername || 'Instagram'} ya está conectada. ¿Deseas cambiar de cuenta?`,
          action: (
            <Button variant="outline" onClick={() => navigate('/auth/instagram/start')}>
              Cambiar cuenta
            </Button>
          )
        });
      } else {
        // Si no está conectado, redirigir a autenticación
        navigate('/auth/instagram/start');
      }
      return;
    }
    
    // Si es Gmail, usar la autenticación de OAuth a través de nuestra función
    if (channel.id === "gmail") {
      // Usar la función handleGmailConnection que redirige a la autenticación de OAuth
      handleGmailConnection();
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
          // Verificar si es Instagram o Gmail y usar estado específico
          const isInstagram = channel.id === 'instagram';
          const isGmail = channel.id === 'gmail';
          
          let isConnected = false;
          
          if (isInstagram) {
            isConnected = instagramConnected;
          } else if (isGmail) {
            isConnected = gmailConnected;
          } else {
            isConnected = connections.some(conn => conn.channelId === channel.id);
          }
          
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
                    {isInstagram && instagramTokenExpired && (
                      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 hover:text-amber-900">
                        <Clock className="h-3 w-3 mr-1" />
                        Expirado
                      </Badge>
                    )}
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
                    {isInstagram && instagramConnected ? (
                      <>
                        {instagramTokenExpired ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Reconectar
                          </>
                        ) : (
                          <>
                            <Settings className="h-4 w-4 mr-1" />
                            Cambiar cuenta
                          </>
                        )}
                      </>
                    ) : isGmail && gmailConnected ? (
                      <>
                        <Settings className="h-4 w-4 mr-1" />
                        Configurar
                      </>
                    ) : isConnected ? (
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

  // Función para autenticar con Gmail
  const authenticateGmail = async () => {
    if (!gmailEmail || !gmailPassword) {
      toast({
        title: "Error",
        description: "Por favor, completa todos los campos",
        variant: "destructive"
      });
      return;
    }
    
    setIsAuthenticating(true);
    
    try {
      // Simulación de autenticación (en una implementación real usaríamos OAuth)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // En una implementación real, aquí iría la lógica de OAuth 2.0 con las credenciales proporcionadas
      const authData = {
        clientId: process.env.REACT_APP_GMAIL_CLIENT_ID || "GMAIL_CLIENT_ID",
        clientSecret: process.env.REACT_APP_GMAIL_CLIENT_SECRET || "GMAIL_CLIENT_SECRET",
        redirectUri: window.location.origin + "/auth/callback",
        email: gmailEmail
      };
      
      console.log("Autenticando con Gmail:", authData);
      
      // Guardar la conexión en Firestore (simulado)
      if (currentUser) {
        const connectionData: Partial<ChannelConnection> = {
          channelId: "gmail",
          username: gmailEmail,
          profileUrl: `https://mail.google.com/mail/u/${gmailEmail}`,
          connectedAt: serverTimestamp(),
          status: 'active',
          lastSync: serverTimestamp()
        };
        
        // En implementación real, guardar en Firestore
        const connectionRef = await addDoc(
          collection(db, "users", currentUser.uid, "channelConnections"), 
          connectionData
        );
        
        // Añadir localmente para actualizar UI
        setConnections(prev => [...prev, {
          id: connectionRef.id,
          ...connectionData as ChannelConnection
        }]);
      }
      
      // Cerrar modal de conexión y abrir modal de configuración
      setShowConnectionModal(false);
      setShowConfigModal(true);
      
      toast({
        title: "Conectado exitosamente",
        description: `Tu cuenta de Gmail ${gmailEmail} ha sido conectada a Kalma.`,
        variant: "default"
      });
    } catch (error) {
      console.error("Error al autenticar con Gmail:", error);
      toast({
        title: "Error de autenticación",
        description: "No se pudo conectar con Gmail. Intenta nuevamente.",
        variant: "destructive"
      });
    } finally {
      setIsAuthenticating(false);
    }
  };
  
  // Función para guardar la configuración de Gmail
  const saveGmailConfig = async () => {
    try {
      // Simulación de guardado
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // En implementación real, guardar en Firestore
      console.log("Configuración guardada:", gmailConfig);
      
      // Cerrar modal de configuración
      setShowConfigModal(false);
      
      // Actualizar estado de la conexión
      setActiveTab("connections");
      
      toast({
        title: "Configuración guardada",
        description: "Tu configuración de Gmail ha sido guardada exitosamente.",
        variant: "default"
      });
    } catch (error) {
      console.error("Error al guardar configuración:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración. Intenta nuevamente.",
        variant: "destructive"
      });
    }
  };

  // Añadir la función para conectar Gmail
  const handleGmailConnection = async () => {
    if (!currentUser) {
      // Mensaje de error si no hay usuario autenticado
      toast({
        title: "Error",
        description: "Debes iniciar sesión para conectar tu cuenta de Gmail.",
        variant: "destructive"
      });
      return;
    }
    
    // Redireccionar a la función serverless que inicia el flujo de OAuth
    window.location.href = `/.netlify/functions/gmail-auth?userId=${currentUser.uid}`;
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
      
      {/* Modal para conectar Gmail */}
      <AlertDialog open={showConnectionModal && selectedChannel?.id === 'gmail'} onOpenChange={(open) => !open && setShowConnectionModal(false)}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-full ${selectedChannel?.gradient ? `bg-gradient-to-r ${selectedChannel?.gradient}` : selectedChannel?.color} flex items-center justify-center text-white`}>
                {selectedChannel?.icon}
              </div>
              <AlertDialogTitle>Conectar cuenta de Gmail</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              Introduce las credenciales de tu cuenta de Gmail para conectar y gestionar tus correos electrónicos desde Kalma.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <Label htmlFor="gmail-email">Correo electrónico</Label>
              <Input 
                id="gmail-email" 
                type="email" 
                placeholder="ejemplo@gmail.com" 
                autoComplete="email"
                value={gmailEmail}
                onChange={(e) => setGmailEmail(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="gmail-password">Contraseña</Label>
              <Input 
                id="gmail-password" 
                type="password" 
                placeholder="••••••••" 
                autoComplete="current-password"
                value={gmailPassword}
                onChange={(e) => setGmailPassword(e.target.value)}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch id="remember-credentials" checked={rememberCredentials} onCheckedChange={(checked) => setRememberCredentials(checked)} />
              <Label htmlFor="remember-credentials">Recordar credenciales en este dispositivo</Label>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-md border border-blue-100 text-sm text-blue-700 flex items-start">
              <Info className="h-5 w-5 mr-2 flex-shrink-0 text-blue-500" />
              <p>
                Kalma utiliza OAuth 2.0 para acceder a tu cuenta de Gmail de forma segura. 
                No almacenamos tu contraseña y puedes revocar el acceso en cualquier momento.
                <br />
                <br />
                ID de cliente: {process.env.REACT_APP_GMAIL_CLIENT_ID || "Configurado en sistema"}
              </p>
            </div>
          </div>
          
          <AlertDialogFooter className="flex-col sm:flex-row sm:justify-end gap-2">
            <AlertDialogCancel disabled={isAuthenticating}>Cancelar</AlertDialogCancel>
            <Button 
              className={`${selectedChannel?.gradient ? `bg-gradient-to-r ${selectedChannel?.gradient}` : selectedChannel?.color} text-white`} 
              onClick={authenticateGmail}
              disabled={isAuthenticating || !gmailEmail || !gmailPassword}
            >
              {isAuthenticating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Conectando...
                </>
              ) : (
                "Conectar Gmail"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Modal para configuración después de conectar */}
      <AlertDialog open={showConfigModal} onOpenChange={(open) => !open && setShowConfigModal(false)}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-red-400 to-red-600 flex items-center justify-center text-white">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.0001 6.00055V18.0005C22.0001 19.1005 21.1001 20.0005 20.0001 20.0005H18.0001V8.00055L12.0001 12.8005L6.00006 8.00055V20.0005H4.00006C2.90006 20.0005 2.00006 19.1005 2.00006 18.0005V6.00055C2.00006 5.47055 2.21006 4.97055 2.58006 4.60055C2.95006 4.23055 3.45006 4.00055 4.00006 4.00055H4.33006L12.0001 10.0005L19.6701 4.00055H20.0001C20.5501 4.00055 21.0501 4.23055 21.4201 4.60055C21.7901 4.97055 22.0001 5.47055 22.0001 6.00055Z" fill="white"/>
                </svg>
              </div>
              <AlertDialogTitle>Configurar Gmail</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              Selecciona cómo quieres que Kalma te ayude con tus correos electrónicos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 py-3">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Switch id="auto-reply" checked={gmailConfig.autoReply} onCheckedChange={(checked) => setGmailConfig({ ...gmailConfig, autoReply: checked })} />
                <div>
                  <Label htmlFor="auto-reply" className="font-medium">Respuestas automáticas</Label>
                  <p className="text-sm text-gray-500">Kalma responderá automáticamente a correos según reglas que definas.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Switch id="email-summaries" checked={gmailConfig.emailSummaries} onCheckedChange={(checked) => setGmailConfig({ ...gmailConfig, emailSummaries: checked })} />
                <div>
                  <Label htmlFor="email-summaries" className="font-medium">Resúmenes de correos</Label>
                  <p className="text-sm text-gray-500">Genera resúmenes automáticos de correos largos para una revisión rápida.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Switch id="priority-inbox" checked={gmailConfig.priorityInbox} onCheckedChange={(checked) => setGmailConfig({ ...gmailConfig, priorityInbox: checked })} />
                <div>
                  <Label htmlFor="priority-inbox" className="font-medium">Bandeja de entrada prioritaria</Label>
                  <p className="text-sm text-gray-500">Prioriza los correos más importantes basándose en el contenido y remitente.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Switch id="schedule-emails" checked={gmailConfig.scheduleEmails} onCheckedChange={(checked) => setGmailConfig({ ...gmailConfig, scheduleEmails: checked })} />
                <div>
                  <Label htmlFor="schedule-emails" className="font-medium">Programación de envíos</Label>
                  <p className="text-sm text-gray-500">Programa envíos de correos para horas específicas.</p>
                </div>
              </div>
            </div>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-gradient-to-r from-red-400 to-red-600 text-white" onClick={saveGmailConfig}>
              Guardar configuración
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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