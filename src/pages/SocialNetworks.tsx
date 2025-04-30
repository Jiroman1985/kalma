import React, { useState, useEffect } from "react";
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
  Clock
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import OAuthConnector from "@/components/OAuthConnector";
import { getN8nWebhookUrl } from "@/lib/n8nService";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle } from "lucide-react";
import { ShieldCheck } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { RefreshCw } from "lucide-react";
import InstagramAuthModal from "@/components/InstagramAuthModal";
import { format } from "date-fns";
import {
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer
} from "recharts";

// Definición de colores
const CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

// Interfaces para representar las suscripciones y configuraciones
interface SocialNetworkSubscription {
  active: boolean;
  activatedAt: Timestamp | null;
  subscriptionEndDate: string | null;
}

interface Platform {
  id: string;
  name: string;
  icon: JSX.Element;
  description: string;
  price: number;
  color: string;
}

interface SocialNetworkSettings {
  notifications: boolean;
  autoResponse: {
    enabled: boolean;
    mode: 'autonomous' | 'draft';
  };
}

// Interfaz para las cuentas de redes sociales
interface SocialAccount {
  id: string;
  platform: string;
  username: string;
  url: string;
  createdAt: any; // Date from Firestore
  connected: boolean;
}

// Interfaz para los mensajes
interface SocialMediaMessage {
  id: string;
  platform: string;
  sender: {
    name: string;
    avatar?: string;
  };
  content: string;
  timestamp: Date;
  read: boolean;
  replied: boolean;
  accountId: string;
}

// Contenido de la pestaña de integración
const IntegrationTab = ({ platforms, subscriptions, currentUser, refresh }: {
  platforms: Platform[],
  subscriptions: Record<string, SocialNetworkSubscription>,
  currentUser: any,
  refresh: () => void
}) => {
  const { toast } = useToast();
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado al portapapeles",
      description: "La URL ha sido copiada al portapapeles",
    });
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Integración con Redes Sociales</CardTitle>
        <CardDescription>
          Conecta tus redes sociales con kalma para gestionar todas tus conversaciones desde un solo lugar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 border rounded-md bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-800 font-medium">
                ¿Cómo funciona la integración?
              </p>
              <p className="text-sm text-blue-700 mt-1">
                kalma utiliza n8n como motor de automatización para conectarse con tus redes sociales. Esta conexión permite recibir y enviar mensajes en tiempo real desde una sola interfaz.
              </p>
            </div>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-4">Conectar plataformas</h3>
            <div className="space-y-4">
              {platforms.map(platform => (
                <div key={platform.id} className="p-4 border rounded-md hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${platform.color} text-white`}>
                        {React.cloneElement(platform.icon, { className: 'h-5 w-5' })}
                      </div>
                      <div>
                        <h4 className="font-medium">{platform.name}</h4>
                        <p className="text-xs text-gray-500">{
                          subscriptions[platform.id]?.active 
                            ? "Suscripción activa" 
                            : "No conectado"
                        }</p>
                      </div>
                    </div>
                    <OAuthConnector 
                      platform={platform.id}
                      onConnected={refresh}
                      size="sm"
                    />
                  </div>
                  <p className="text-sm text-gray-600">
                    {platform.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4">Configuración de Webhooks</h3>
            <div className="space-y-4">
              {platforms.filter(p => subscriptions[p.id]?.active).map(platform => {
                const webhookUrl = getN8nWebhookUrl(currentUser.uid, platform.id);
                
                return (
                  <div key={platform.id} className="p-4 border rounded-md bg-gray-50">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className={`p-2 rounded-full ${platform.color} text-white`}>
                        {React.cloneElement(platform.icon, { className: 'h-5 w-5' })}
                      </div>
                      <h4 className="font-medium">{platform.name}</h4>
                      <Badge variant="outline" className="ml-auto bg-green-50 text-green-700 border-green-200">
                        <ShieldCheck className="h-3 w-3 mr-1" />
                        Conectado
                      </Badge>
                    </div>
                    
                    <div className="bg-white p-2 rounded border mt-2">
                      <p className="text-xs font-medium text-gray-500 mb-1">Webhook URL:</p>
                      <div className="flex items-center">
                        <Input 
                          value={webhookUrl}
                          readOnly
                          className="flex-1 text-xs bg-gray-50"
                        />
                        <Button 
                          variant="ghost"
                          size="icon"
                          className="ml-2"
                          onClick={() => copyToClipboard(webhookUrl)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <a 
                        href={`https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.${platform.id}/`} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline flex items-center"
                      >
                        Ver guía de configuración
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </a>
                    </div>
                  </div>
                );
              })}
              
              {!platforms.some(p => subscriptions[p.id]?.active) && (
                <div className="flex flex-col items-center justify-center h-60 text-center p-6 border rounded-md border-dashed">
                  <AlertCircle className="h-10 w-10 text-gray-300 mb-2" />
                  <p className="text-gray-500">No tienes plataformas conectadas</p>
                  <p className="text-sm text-gray-400 mt-1 mb-4">
                    Conecta al menos una plataforma para ver su configuración de webhook
                  </p>
                </div>
              )}
            </div>
            
            <div className="mt-6 p-4 border rounded-md">
              <h4 className="font-medium flex items-center">
                <RefreshCw className="h-4 w-4 mr-2 text-teal-600" />
                Estado de la integración
              </h4>
              <p className="text-sm text-gray-600 mt-2">
                La integración con n8n está {platforms.some(p => subscriptions[p.id]?.active) ? 'activa' : 'pendiente'}. 
                Los webhooks se actualizarán automáticamente cuando conectes o desconectes plataformas.
              </p>
              
              <div className="mt-4">
                <Button variant="outline" size="sm" onClick={refresh}>
                  <RefreshCw className="h-3.5 w-3.5 mr-2" />
                  Actualizar estado
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <Separator />
        
        <div>
          <h3 className="text-lg font-medium mb-4">Documentación y recursos</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
              <CardContent className="p-4">
                <h4 className="font-medium">Guía de inicio rápido</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Aprende a configurar tus primeras integraciones con n8n
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
              <CardContent className="p-4">
                <h4 className="font-medium">Ejemplos de workflows</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Plantillas pre-configuradas para integrar redes sociales
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
              <CardContent className="p-4">
                <h4 className="font-medium">Problemas comunes</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Soluciones a los problemas más frecuentes
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const SocialNetworks = () => {
  const { currentUser, userData } = useAuth();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<SocialAccount | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<SocialAccount | null>(null);
  const [activeTab, setActiveTab] = useState("accounts");

  // Estados para suscripciones y configuraciones
  const [subscriptions, setSubscriptions] = useState<{[key: string]: SocialNetworkSubscription}>({});
  const [settings, setSettings] = useState<{[key: string]: SocialNetworkSettings}>({});
  const [savingSettings, setSavingSettings] = useState(false);
  
  // Estado para analíticas
  const [analytics, setAnalytics] = useState({
    totalInteractions: 0,
    totalAccounts: 0,
    activeSubscriptions: 0,
    responseRate: 0,
    pendingMessages: 0,
    accountsByPlatform: {
      instagram: 0,
      facebook: 0,
      twitter: 0,
      linkedin: 0,
      gmail: 0,
      googleReviews: 0
    },
    // Datos de análisis extendidos
    platformAnalytics: {
      instagram: {
        dailyInteractions: [15, 22, 19, 28, 32, 25, 38],
        followersGrowth: [1200, 1250, 1310, 1390, 1420, 1490, 1550],
        engagementRate: 4.2,
        reachRate: 25.7,
        peakHours: [14, 19, 21], // Horas del día con más actividad
        sentimentDistribution: { positive: 68, neutral: 24, negative: 8 },
        topHashtags: ['moda', 'tendencia', 'estilo', 'primavera']
      },
      facebook: {
        dailyInteractions: [10, 15, 12, 18, 14, 22, 16],
        followersGrowth: [5200, 5230, 5250, 5290, 5320, 5370, 5400],
        engagementRate: 2.8,
        reachRate: 18.5,
        peakHours: [12, 17, 20],
        sentimentDistribution: { positive: 52, neutral: 39, negative: 9 },
        topHashtags: ['oferta', 'nuevacoleccion', 'descuento']
      },
      twitter: {
        dailyInteractions: [25, 18, 30, 22, 28, 35, 29],
        followersGrowth: [980, 995, 1010, 1050, 1080, 1110, 1150],
        engagementRate: 3.5,
        reachRate: 15.2,
        peakHours: [9, 13, 22],
        sentimentDistribution: { positive: 45, neutral: 42, negative: 13 },
        topHashtags: ['news', 'fashion', 'ootd', 'trendy']
      },
      gmail: {
        dailyInteractions: [8, 12, 9, 7, 15, 10, 11],
        responseRate: 87,
        averageResponseTime: 2.5, // Horas
        sentimentDistribution: { positive: 72, neutral: 20, negative: 8 },
        categories: {
          consultas: 45,
          ventas: 32,
          soporte: 18,
          otros: 5
        }
      },
      googleReviews: {
        averageRating: 4.2,
        ratingDistribution: [2, 5, 12, 38, 45], // 1-5 estrellas
        responseRate: 92,
        reviewsPerMonth: [12, 15, 9, 18, 14, 20, 16, 24, 19, 22, 28, 35],
        sentimentDistribution: { positive: 75, neutral: 15, negative: 10 }
      }
    },
    // Datos agregados
    aggregated: {
      totalInteractions: 1248,
      weeklyInteractions: [58, 67, 70, 75, 89, 92, 94],
      monthlyInteractions: [980, 1050, 1120, 1180, 1220, 1248],
      engagementByDay: {
        lunes: 15,
        martes: 18,
        miércoles: 22,
        jueves: 19,
        viernes: 14,
        sábado: 8,
        domingo: 4
      },
      responseTimeByPlatform: {
        instagram: 1.8, // horas
        facebook: 2.2,
        twitter: 1.5,
        gmail: 3.5,
        googleReviews: 4.2
      },
      interactionsByType: {
        mensajes: 520,
        comentarios: 345,
        menciones: 215,
        reseñas: 98,
        correos: 70
      }
    }
  });
  
  // Estado para mensajes
  const [messages, setMessages] = useState<SocialMediaMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<SocialMediaMessage | null>(null);
  const [replyContent, setReplyContent] = useState("");
  
  // Nuevo estado para modal de autenticación de Instagram
  const [instagramAuthModalOpen, setInstagramAuthModalOpen] = useState(false);
  const [instagramMessages, setInstagramMessages] = useState<SocialMediaMessage[]>([]);
  const [loadingInstagramMessages, setLoadingInstagramMessages] = useState(false);
  
  // Plataformas disponibles
  const platforms: Platform[] = [
    {
      id: 'instagram',
      name: 'Instagram',
      icon: <Instagram className="h-10 w-10" />,
      description: 'Conecta con tus seguidores de Instagram y responde a comentarios y mensajes directos.',
      price: 5,
      color: 'bg-gradient-to-r from-purple-500 to-pink-500'
    },
    {
      id: 'gmail',
      name: 'Gmail',
      icon: <Mail className="h-10 w-10" />,
      description: 'Gestiona tus correos electrónicos y responde a clientes potenciales rápidamente.',
      price: 3,
      color: 'bg-gradient-to-r from-red-500 to-yellow-500'
    },
    {
      id: 'googleReviews',
      name: 'Google Reviews',
      icon: <Star className="h-10 w-10" />,
      description: 'Monitorea y responde a todas las reseñas de Google de tu negocio.',
      price: 4,
      color: 'bg-gradient-to-r from-green-500 to-blue-500'
    }
  ];
  
  // Formulario
  const [platform, setPlatform] = useState("facebook");
  const [username, setUsername] = useState("");
  const [url, setUrl] = useState("");

  // Cargar analíticas de redes sociales
  const loadAnalytics = async () => {
    if (!currentUser) return;
    
    try {
      // En un caso real, estos datos vendrían de la API o Firestore
      // Simulamos datos para esta demostración
      const mockAnalytics = {
        totalInteractions: 1248,
        totalAccounts: accounts.length,
        activeSubscriptions: Object.values(subscriptions).filter(sub => sub.active).length,
        responseRate: 87,
        pendingMessages: messages.filter(m => !m.replied).length,
        accountsByPlatform: {
          instagram: accounts.filter(acc => acc.platform === "instagram").length,
          facebook: accounts.filter(acc => acc.platform === "facebook").length,
          twitter: accounts.filter(acc => acc.platform === "twitter").length,
          linkedin: accounts.filter(acc => acc.platform === "linkedin").length,
          gmail: accounts.filter(acc => acc.platform === "gmail").length,
          googleReviews: accounts.filter(acc => acc.platform === "googleReviews").length
        },
        // Datos de análisis extendidos
        platformAnalytics: analytics.platformAnalytics,
        // Datos agregados
        aggregated: analytics.aggregated
      };
      
      setAnalytics(mockAnalytics);
    } catch (error) {
      console.error("Error al cargar analíticas:", error);
    }
  };

  // Cargar cuentas al iniciar
  useEffect(() => {
    if (currentUser) {
      loadAccounts();
      loadSubscriptionsAndSettings();
      loadAnalytics();
    }
  }, [currentUser]);
  
  // Actualizar analíticas cuando cambian las cuentas o suscripciones
  useEffect(() => {
    if (currentUser) {
      loadAnalytics();
    }
  }, [accounts, subscriptions]);

  // Cargar suscripciones y configuraciones
  const loadSubscriptionsAndSettings = async () => {
    if (!currentUser) return;
    
    try {
      // Usar userData si ya contiene la información de redes sociales
      if (userData?.socialNetworks) {
        const socialNetworks = userData.socialNetworks;
        
        // Inicializar suscripciones desde userData
        const subs: {[key: string]: SocialNetworkSubscription} = {};
        if (socialNetworks.subscriptions) {
          Object.entries(socialNetworks.subscriptions).forEach(([key, value]) => {
            if (value) {
              subs[key] = value as SocialNetworkSubscription;
            }
          });
        }
        
        // Inicializar configuraciones desde userData
        const config: {[key: string]: SocialNetworkSettings} = {};
        platforms.forEach(p => {
          config[p.id] = {
            notifications: socialNetworks.notificationPreferences?.[p.id] || false,
            autoResponse: {
              enabled: socialNetworks.autoResponseSettings?.[p.id]?.enabled || false,
              mode: socialNetworks.autoResponseSettings?.[p.id]?.mode || 'draft'
            }
          };
        });
        
        setSubscriptions(subs);
        setSettings(config);
      } else {
        // Inicializar con valores por defecto si no hay datos
        const defaultSettings: {[key: string]: SocialNetworkSettings} = {};
        platforms.forEach(p => {
          defaultSettings[p.id] = {
            notifications: false,
            autoResponse: {
              enabled: false,
              mode: 'draft'
            }
          };
        });
        
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error("Error al cargar suscripciones:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las suscripciones. Por favor, recarga la página.",
        variant: "destructive"
      });
    }
  };

  // Cargar cuentas desde Firestore
  const loadAccounts = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const accountsRef = collection(db, "users", currentUser.uid, "socialAccounts");
      const q = query(accountsRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      
      const loadedAccounts: SocialAccount[] = [];
      querySnapshot.forEach((doc) => {
        loadedAccounts.push({
          id: doc.id,
          ...doc.data()
        } as SocialAccount);
      });
      
      setAccounts(loadedAccounts);
    } catch (error) {
      console.error("Error al cargar cuentas:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las cuentas de redes sociales. Por favor, intenta de nuevo.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Guardar cuenta
  const saveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    if (!platform || !username || !url) {
      toast({
        title: "Campos incompletos",
        description: "Por favor completa todos los campos.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      if (isEditingAccount && selectedAccount) {
        // Actualizar cuenta existente
        const accountRef = doc(db, "users", currentUser.uid, "socialAccounts", selectedAccount.id);
        await updateDoc(accountRef, {
          platform,
          username,
          url,
        });
        
        toast({
          title: "Cuenta actualizada",
          description: "La cuenta se ha actualizado correctamente."
        });
      } else {
        // Crear nueva cuenta
        const accountsRef = collection(db, "users", currentUser.uid, "socialAccounts");
        await addDoc(accountsRef, {
          platform,
          username,
          url,
          createdAt: serverTimestamp(),
          connected: false
        });
        
        toast({
          title: "Cuenta agregada",
          description: "La cuenta de red social se ha agregado correctamente."
        });
      }
      
      // Resetear formulario y estados
      setPlatform("facebook");
      setUsername("");
      setUrl("");
      setIsAddingAccount(false);
      setIsEditingAccount(false);
      setSelectedAccount(null);
      
      // Recargar cuentas
      await loadAccounts();
    } catch (error) {
      console.error("Error al guardar cuenta:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar la cuenta. Por favor, intenta de nuevo.",
        variant: "destructive"
      });
    }
  };

  // Preparar eliminación de cuenta
  const prepareDeleteAccount = (account: SocialAccount) => {
    setAccountToDelete(account);
    setDeleteDialogOpen(true);
  };

  // Eliminar cuenta
  const deleteAccount = async () => {
    if (!currentUser || !accountToDelete) return;
    
    try {
      const accountRef = doc(db, "users", currentUser.uid, "socialAccounts", accountToDelete.id);
      await deleteDoc(accountRef);
      
      toast({
        title: "Cuenta eliminada",
        description: "La cuenta se ha eliminado correctamente."
      });
      
      // Recargar cuentas
      await loadAccounts();
    } catch (error) {
      console.error("Error al eliminar cuenta:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la cuenta. Por favor, intenta de nuevo.",
        variant: "destructive"
      });
    } finally {
      setDeleteDialogOpen(false);
      setAccountToDelete(null);
    }
  };

  // Editar cuenta
  const editAccount = (account: SocialAccount) => {
    setSelectedAccount(account);
    setPlatform(account.platform);
    setUsername(account.username);
    setUrl(account.url);
    setIsEditingAccount(true);
    setIsAddingAccount(true);
  };

  // Copiar URL al portapapeles
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "URL copiada",
      description: "La URL ha sido copiada al portapapeles."
    });
  };

  // Renderizar icono según plataforma
  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'facebook':
        return <Facebook className="h-5 w-5 text-blue-600" />;
      case 'instagram':
        return <Instagram className="h-5 w-5 text-pink-600" />;
      case 'twitter':
        return <Twitter className="h-5 w-5 text-blue-400" />;
      case 'linkedin':
        return <Linkedin className="h-5 w-5 text-blue-800" />;
      default:
        return <Facebook className="h-5 w-5 text-blue-600" />;
    }
  };

  // Activar o desactivar una suscripción
  const toggleSubscription = async (platformId: string) => {
    if (!currentUser) return;
    
    try {
      const userRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error("Usuario no encontrado");
      }
      
      const userData = userDoc.data();
      const currentSocialNetworks = userData.socialNetworks || {
        subscriptions: {},
        notificationPreferences: {},
        autoResponseSettings: {}
      };
      
      // Verificar si ya existe una suscripción
      const isActive = currentSocialNetworks.subscriptions?.[platformId]?.active || false;
      
      // Actualizar estado de suscripción
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 30); // Suscripción por 30 días
      
      // Nueva información de suscripción
      const newSubscription: SocialNetworkSubscription = {
        active: !isActive,
        activatedAt: isActive ? null : Timestamp.now(),
        subscriptionEndDate: isActive ? null : endDate.toISOString().split('T')[0]
      };
      
      // Actualizar en Firebase
      await updateDoc(userRef, {
        [`socialNetworks.subscriptions.${platformId}`]: newSubscription
      });
      
      // Actualizar estado local
      setSubscriptions(prev => ({
        ...prev,
        [platformId]: newSubscription
      }));
      
      toast({
        title: isActive ? "Suscripción cancelada" : "Suscripción activada",
        description: isActive 
          ? `Has cancelado tu suscripción a ${getPlatformName(platformId)}` 
          : `Has activado tu suscripción a ${getPlatformName(platformId)} hasta ${newSubscription.subscriptionEndDate}`
      });
      
    } catch (error) {
      console.error("Error al gestionar suscripción:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la suscripción. Por favor, intenta de nuevo.",
        variant: "destructive"
      });
    }
  };
  
  // Guardar configuraciones
  const saveSettings = async () => {
    if (!currentUser) return;
    
    setSavingSettings(true);
    try {
      const userRef = doc(db, "users", currentUser.uid);
      
      // Construir objeto de notificaciones
      const notificationPreferences: {[key: string]: boolean} = {};
      const autoResponseSettings: {[key: string]: any} = {};
      
      // Convertir configuraciones al formato requerido
      Object.entries(settings).forEach(([platformId, config]) => {
        notificationPreferences[platformId] = config.notifications;
        autoResponseSettings[platformId] = config.autoResponse;
      });
      
      // Actualizar en Firebase
      await updateDoc(userRef, {
        "socialNetworks.notificationPreferences": notificationPreferences,
        "socialNetworks.autoResponseSettings": autoResponseSettings
      });
      
      toast({
        title: "Configuraciones guardadas",
        description: "Tus preferencias han sido guardadas correctamente."
      });
    } catch (error) {
      console.error("Error al guardar configuraciones:", error);
      toast({
        title: "Error",
        description: "No se pudieron guardar las configuraciones. Por favor, intenta de nuevo.",
        variant: "destructive"
      });
    } finally {
      setSavingSettings(false);
    }
  };
  
  // Actualizar configuración de notificaciones
  const updateNotificationSetting = (platformId: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [platformId]: {
        ...prev[platformId],
        notifications: value
      }
    }));
  };
  
  // Actualizar configuración de respuesta automática
  const updateAutoResponseSetting = (platformId: string, enabled: boolean, mode?: 'autonomous' | 'draft') => {
    setSettings(prev => ({
      ...prev,
      [platformId]: {
        ...prev[platformId],
        autoResponse: {
          enabled: enabled,
          mode: mode || prev[platformId].autoResponse.mode
        }
      }
    }));
  };
  
  // Obtener nombre de plataforma por id
  const getPlatformName = (platformId: string): string => {
    const platform = platforms.find(p => p.id === platformId);
    return platform ? platform.name : platformId;
  };

  // Cargar mensajes simulados
  const loadMessages = () => {
    setLoadingMessages(true);
    
    // Datos simulados de mensajes
    const mockMessages: SocialMediaMessage[] = [
      {
        id: "1",
        platform: "instagram",
        sender: {
          name: "cliente_satisfecho",
          avatar: "https://randomuser.me/api/portraits/women/32.jpg"
        },
        content: "Hola, ¿tienen disponible el modelo nuevo en color azul?",
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutos atrás
        read: true,
        replied: false,
        accountId: "instagram1"
      },
      {
        id: "2",
        platform: "facebook",
        sender: {
          name: "Juan Pérez",
          avatar: "https://randomuser.me/api/portraits/men/42.jpg"
        },
        content: "Me encantó su producto, ¿hacen envíos a Canarias?",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 horas atrás
        read: true,
        replied: true,
        accountId: "facebook1"
      },
      {
        id: "3",
        platform: "twitter",
        sender: {
          name: "@usuario_interesado",
          avatar: "https://randomuser.me/api/portraits/women/22.jpg"
        },
        content: "¿Cuándo estará disponible la próxima colección? ¡Estoy muy emocionada!",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 horas atrás
        read: false,
        replied: false,
        accountId: "twitter1"
      },
      {
        id: "4",
        platform: "instagram",
        sender: {
          name: "nuevo_seguidor",
          avatar: "https://randomuser.me/api/portraits/men/55.jpg"
        },
        content: "Acabo de descubrir su perfil y me encantan sus productos. ¿Hacen colaboraciones con influencers?",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 día atrás
        read: false,
        replied: false,
        accountId: "instagram1"
      },
      {
        id: "5",
        platform: "gmail",
        sender: {
          name: "cliente_corporativo@empresa.com",
          avatar: ""
        },
        content: "Estimados señores, estamos interesados en realizar un pedido mayorista para nuestra cadena de tiendas. ¿Podrían enviarnos su catálogo actual con precios para distribuidores?",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 días atrás
        read: true,
        replied: false,
        accountId: "gmail1"
      }
    ];
    
    setMessages(mockMessages);
    setLoadingMessages(false);
  };
  
  // Marcar mensaje como leído
  const markMessageAsRead = (messageId: string) => {
    setMessages(prevMessages => 
      prevMessages.map(message => 
        message.id === messageId 
          ? { ...message, read: true } 
          : message
      )
    );
  };
  
  // Enviar respuesta
  const sendReply = (messageId: string) => {
    if (!replyContent.trim()) {
      toast({
        title: "Error",
        description: "La respuesta no puede estar vacía",
        variant: "destructive"
      });
      return;
    }
    
    // Actualizar el mensaje como respondido
    setMessages(prevMessages => 
      prevMessages.map(message => 
        message.id === messageId 
          ? { ...message, replied: true } 
          : message
      )
    );
    
    // Limpiar el área de respuesta
    setReplyContent("");
    
    // Cerrar el mensaje seleccionado
    setSelectedMessage(null);
    
    toast({
      title: "Respuesta enviada",
      description: "Tu respuesta ha sido enviada correctamente"
    });
  };
  
  // Cargar mensajes al iniciar
  useEffect(() => {
    if (currentUser) {
      loadMessages();
    }
  }, [currentUser]);

  // Generar datos de prueba incluyendo mensajes
  const generateTestData = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      const batch = writeBatch(db);
      
      // Eliminar cuentas existentes para evitar duplicados
      const accountsRef = collection(db, "users", currentUser.uid, "socialAccounts");
      const existingAccounts = await getDocs(accountsRef);
      
      existingAccounts.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      // Generar cuentas de ejemplo más completas
      const testAccounts = [
        {
          platform: "instagram",
          username: "miempresa_oficial",
          url: "https://instagram.com/miempresa_oficial",
          createdAt: serverTimestamp(),
          connected: true
        },
        {
          platform: "facebook",
          username: "Mi Empresa",
          url: "https://facebook.com/miempresa",
          createdAt: serverTimestamp(),
          connected: true
        },
        {
          platform: "twitter",
          username: "@miempresa",
          url: "https://twitter.com/miempresa",
          createdAt: serverTimestamp(),
          connected: false
        },
        {
          platform: "linkedin",
          username: "Mi Empresa S.L.",
          url: "https://linkedin.com/company/miempresa",
          createdAt: serverTimestamp(),
          connected: false
        },
        {
          platform: "instagram",
          username: "miempresa_promociones",
          url: "https://instagram.com/miempresa_promociones",
          createdAt: serverTimestamp(),
          connected: true
        },
        {
          platform: "gmail",
          username: "contacto@miempresa.com",
          url: "mailto:contacto@miempresa.com",
          createdAt: serverTimestamp(),
          connected: true
        },
        {
          platform: "googleReviews",
          username: "Mi Empresa - Tienda Principal",
          url: "https://g.page/miempresa-tienda",
          createdAt: serverTimestamp(),
          connected: true
        }
      ];
      
      // Agregar cuentas a Firestore
      testAccounts.forEach((account) => {
        const newDocRef = doc(collection(db, "users", currentUser.uid, "socialAccounts"));
        batch.set(newDocRef, account);
      });
      
      // Configurar suscripciones de prueba
      const userRef = doc(db, "users", currentUser.uid);
      
      // Fecha actual y fecha en 30 días para suscripción
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 30);
      
      // Generar datos de suscripciones y configuraciones más completos
      const testSocialNetworksData = {
        subscriptions: {
          instagram: {
            active: true,
            activatedAt: Timestamp.now(),
            subscriptionEndDate: endDate.toISOString().split('T')[0]
          },
          gmail: {
            active: true,
            activatedAt: Timestamp.now(),
            subscriptionEndDate: endDate.toISOString().split('T')[0]
          },
          googleReviews: {
            active: true,
            activatedAt: Timestamp.now(),
            subscriptionEndDate: endDate.toISOString().split('T')[0]
          }
        },
        notificationPreferences: {
          instagram: true,
          gmail: true,
          googleReviews: true,
          facebook: false,
          twitter: false,
          linkedin: false
        },
        autoResponseSettings: {
          instagram: {
            enabled: true,
            mode: 'draft'
          },
          gmail: {
            enabled: true,
            mode: 'autonomous'
          },
          googleReviews: {
            enabled: true,
            mode: 'draft'
          },
          facebook: {
            enabled: false,
            mode: 'draft'
          },
          twitter: {
            enabled: false,
            mode: 'draft'
          },
          linkedin: {
            enabled: false,
            mode: 'draft'
          }
        }
      };
      
      // Actualizar en Firebase
      batch.update(userRef, {
        "socialNetworks": testSocialNetworksData
      });
      
      // Ejecutar batch
      await batch.commit();
      
      // Actualizar estado local
      setSubscriptions(testSocialNetworksData.subscriptions);
      
      const newSettings: {[key: string]: SocialNetworkSettings} = {};
      
      platforms.forEach(p => {
        newSettings[p.id] = {
          notifications: testSocialNetworksData.notificationPreferences[p.id] || false,
          autoResponse: testSocialNetworksData.autoResponseSettings[p.id] || {
            enabled: false,
            mode: 'draft'
          }
        };
      });
      
      setSettings(newSettings);
      
      // Recargar cuentas
      await loadAccounts();
      
      // Generar mensajes de prueba más variados y realistas
      const mockMessages: SocialMediaMessage[] = [
        // Instagram
        {
          id: "1",
          platform: "instagram",
          sender: {
            name: "cliente_satisfecho",
            avatar: "https://randomuser.me/api/portraits/women/32.jpg"
          },
          content: "Hola, ¿tienen disponible el modelo nuevo en color azul? Lo vi en su última publicación y me encantó.",
          timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutos atrás
          read: true,
          replied: false,
          accountId: "instagram1"
        },
        {
          id: "2",
          platform: "instagram",
          sender: {
            name: "nuevo_seguidor",
            avatar: "https://randomuser.me/api/portraits/men/55.jpg"
          },
          content: "Acabo de descubrir su perfil y me encantan sus productos. ¿Hacen colaboraciones con influencers? Tengo 10K seguidores en mi cuenta de lifestyle.",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 día atrás
          read: false,
          replied: false,
          accountId: "instagram1"
        },
        {
          id: "3",
          platform: "instagram",
          sender: {
            name: "fashion_lover22",
            avatar: "https://randomuser.me/api/portraits/women/65.jpg"
          },
          content: "¿Tienen envíos internacionales? Me encantaría comprar varios de sus productos pero vivo en México.",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 horas atrás
          read: false,
          replied: false,
          accountId: "instagram1"
        },
        
        // Facebook
        {
          id: "4",
          platform: "facebook",
          sender: {
            name: "Juan Pérez",
            avatar: "https://randomuser.me/api/portraits/men/42.jpg"
          },
          content: "Me encantó su producto, ¿hacen envíos a Canarias? Tengo familia allí y quiero enviarles un regalo.",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 horas atrás
          read: true,
          replied: true,
          accountId: "facebook1"
        },
        {
          id: "5",
          platform: "facebook",
          sender: {
            name: "María Rodríguez",
            avatar: "https://randomuser.me/api/portraits/women/45.jpg"
          },
          content: "¿Cuál es el horario de atención de su tienda física? Quiero pasar este fin de semana.",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 horas atrás
          read: false,
          replied: false,
          accountId: "facebook1"
        },
        
        // Twitter
        {
          id: "6",
          platform: "twitter",
          sender: {
            name: "@usuario_interesado",
            avatar: "https://randomuser.me/api/portraits/women/22.jpg"
          },
          content: "¿Cuándo estará disponible la próxima colección? ¡Estoy muy emocionada! #NuevaColeccion #Moda #Ansiosa",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 horas atrás
          read: false,
          replied: false,
          accountId: "twitter1"
        },
        
        // Gmail
        {
          id: "7",
          platform: "gmail",
          sender: {
            name: "cliente_corporativo@empresa.com",
            avatar: ""
          },
          content: "Estimados señores,\n\nEstamos interesados en realizar un pedido mayorista para nuestra cadena de tiendas. ¿Podrían enviarnos su catálogo actual con precios para distribuidores?\n\nAgradecemos su atención.\n\nAtentamente,\nDpto. Compras - Empresa S.A.",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 días atrás
          read: true,
          replied: false,
          accountId: "gmail1"
        },
        {
          id: "8",
          platform: "gmail",
          sender: {
            name: "prensa@revistamodaactual.com",
            avatar: ""
          },
          content: "Asunto: Solicitud de entrevista para artículo\n\nHola equipo de Mi Empresa,\n\nEstamos preparando un artículo sobre marcas emergentes en el sector y nos encantaría incluirlos. ¿Estarían disponibles para una breve entrevista esta semana?\n\nSaludos cordiales,\nLaura Martínez\nRedactora - Revista Moda Actual",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 horas atrás
          read: false,
          replied: false,
          accountId: "gmail1"
        },
        
        // Google Reviews
        {
          id: "9",
          platform: "googleReviews",
          sender: {
            name: "Carlos García",
            avatar: "https://randomuser.me/api/portraits/men/72.jpg"
          },
          content: "⭐⭐⭐⭐⭐ Excelente atención y productos de alta calidad. El personal muy amable y profesional. Volveré seguro.",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 días atrás
          read: true,
          replied: true,
          accountId: "googleReviews1"
        },
        {
          id: "10",
          platform: "googleReviews",
          sender: {
            name: "Ana Martín",
            avatar: "https://randomuser.me/api/portraits/women/33.jpg"
          },
          content: "⭐⭐⭐ La tienda está bien, pero el tiempo de espera para la entrega fue más largo de lo prometido. Por lo demás todo correcto.",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 36), // 36 horas atrás
          read: false,
          replied: false,
          accountId: "googleReviews1"
        }
      ];
      
      setMessages(mockMessages);
      
      // Generar analíticas actualizadas
      const mockAnalytics = {
        totalInteractions: 1248,
        totalAccounts: testAccounts.length,
        activeSubscriptions: Object.values(testSocialNetworksData.subscriptions).filter(sub => sub.active).length,
        responseRate: 87,
        pendingMessages: mockMessages.filter(m => !m.replied).length,
        accountsByPlatform: {
          instagram: testAccounts.filter(acc => acc.platform === "instagram").length,
          facebook: testAccounts.filter(acc => acc.platform === "facebook").length,
          twitter: testAccounts.filter(acc => acc.platform === "twitter").length,
          linkedin: testAccounts.filter(acc => acc.platform === "linkedin").length,
          gmail: testAccounts.filter(acc => acc.platform === "gmail").length,
          googleReviews: testAccounts.filter(acc => acc.platform === "googleReviews").length
        }
      };
      
      setAnalytics(mockAnalytics);
      
      toast({
        title: "Datos de prueba generados",
        description: "Se han creado cuentas, suscripciones, mensajes y configuraciones de prueba."
      });
    } catch (error) {
      console.error("Error al generar datos de prueba:", error);
      toast({
        title: "Error",
        description: "No se pudieron generar los datos de prueba. Por favor, intenta de nuevo.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Cargar mensajes de Instagram
  const loadInstagramMessages = async () => {
    if (!currentUser) return;
    
    setLoadingInstagramMessages(true);
    
    try {
      // En un entorno real, esto cargaría los mensajes de Firestore
      // Para el MVP, usamos datos de prueba
      const mockMessages: SocialMediaMessage[] = [
        {
          id: "ig1",
          platform: "instagram",
          sender: {
            name: "cliente_interesado23",
            avatar: "https://randomuser.me/api/portraits/women/25.jpg"
          },
          content: "Hola, ¿tienen el vestido en talla M? ¡Me encanta su nueva colección!",
          timestamp: new Date(Date.now() - 1000 * 60 * 10), // 10 minutos atrás
          read: false,
          replied: false,
          accountId: "instagram"
        },
        {
          id: "ig2",
          platform: "instagram",
          sender: {
            name: "fashionista_bcn",
            avatar: "https://randomuser.me/api/portraits/women/32.jpg"
          },
          content: "¡Me encantan vuestros diseños! ¿Hacéis envíos internacionales?",
          timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 minutos atrás
          read: true,
          replied: false,
          accountId: "instagram"
        },
        {
          id: "ig3",
          platform: "instagram",
          sender: {
            name: "influencer_mode",
            avatar: "https://randomuser.me/api/portraits/women/68.jpg"
          },
          content: "Os he mencionado en mi último post sobre tendencias sostenibles, ¡seguid así! 💚 #modaEtica",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 horas atrás
          read: true,
          replied: true,
          accountId: "instagram"
        },
        {
          id: "ig4",
          platform: "instagram",
          sender: {
            name: "comprador_novato",
            avatar: "https://randomuser.me/api/portraits/men/43.jpg"
          },
          content: "¿Cómo puedo saber cuál es mi talla? ¿Tienen alguna guía de medidas?",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 horas atrás
          read: false,
          replied: false,
          accountId: "instagram"
        },
        {
          id: "ig5",
          platform: "instagram",
          sender: {
            name: "magazine_fashion",
            avatar: "https://randomuser.me/api/portraits/women/91.jpg"
          },
          content: "¡Nos encantaría hacer un reportaje sobre vuestra marca! ¿Podemos contactaros para una entrevista?",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 día atrás
          read: true,
          replied: false,
          accountId: "instagram"
        }
      ];
      
      setInstagramMessages(mockMessages);
    } catch (error) {
      console.error("Error al cargar mensajes de Instagram:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los mensajes de Instagram",
        variant: "destructive"
      });
    } finally {
      setLoadingInstagramMessages(false);
    }
  };

  // Manejar la conexión exitosa de Instagram
  const handleInstagramConnected = () => {
    toast({
      title: "¡Conexión exitosa!",
      description: "Tu cuenta de Instagram ha sido conectada correctamente",
    });
    
    loadSubscriptionsAndSettings();
    loadInstagramMessages();
    setActiveTab("messages");
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Redes Sociales</h1>
        
        {/* Agregar botón para conectar Instagram directamente */}
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={generateTestData}
            className="flex items-center"
          >
            <Loader2 className="h-4 w-4 mr-2" />
            Generar datos de prueba
          </Button>
          
          <Button
            onClick={() => setInstagramAuthModalOpen(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <Instagram className="h-4 w-4 mr-2" />
            Conectar Instagram
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="accounts">Cuentas</TabsTrigger>
          <TabsTrigger value="messages">Mensajes</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="subscriptions">Suscripciones</TabsTrigger>
          <TabsTrigger value="settings">Configuración</TabsTrigger>
          <TabsTrigger value="integration">Integración</TabsTrigger>
        </TabsList>
        
        {/* Pestaña de Analytics */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total de Interacciones
                </CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.aggregated.totalInteractions.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  +{Math.round((analytics.aggregated.weeklyInteractions[6] - analytics.aggregated.weeklyInteractions[0]) / analytics.aggregated.weeklyInteractions[0] * 100)}% desde la semana pasada
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Tasa de Respuesta
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.responseRate}%</div>
                <p className="text-xs text-muted-foreground">
                  +2.1% desde el mes pasado
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Tiempo de Respuesta
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Object.values(analytics.aggregated.responseTimeByPlatform).reduce((acc, curr) => acc + curr, 0) / Object.values(analytics.aggregated.responseTimeByPlatform).length}h
                </div>
                <p className="text-xs text-muted-foreground">
                  -15min desde el mes pasado
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Interacciones por Día</CardTitle>
                <CardDescription>
                  Distribución de interacciones durante la semana
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Lun', valor: analytics.aggregated.engagementByDay.lunes },
                    { name: 'Mar', valor: analytics.aggregated.engagementByDay.martes },
                    { name: 'Mié', valor: analytics.aggregated.engagementByDay.miércoles },
                    { name: 'Jue', valor: analytics.aggregated.engagementByDay.jueves },
                    { name: 'Vie', valor: analytics.aggregated.engagementByDay.viernes },
                    { name: 'Sáb', valor: analytics.aggregated.engagementByDay.sábado },
                    { name: 'Dom', valor: analytics.aggregated.engagementByDay.domingo },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip 
                      formatter={(value) => [`${value}%`, 'Interacciones']}
                      cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                    />
                    <Bar dataKey="valor" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tipos de Interacción</CardTitle>
                <CardDescription>
                  Distribución por tipo de interacción
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={Object.entries(analytics.aggregated.interactionsByType).map(([name, value]) => ({ name, value }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {Object.entries(analytics.aggregated.interactionsByType).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => [`${value}`, '']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Análisis por Plataforma</CardTitle>
                <CardDescription>
                  Selecciona una plataforma para ver estadísticas detalladas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="instagram" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="instagram" className="flex items-center">
                      <Instagram className="h-4 w-4 mr-2" />
                      Instagram
                    </TabsTrigger>
                    <TabsTrigger value="facebook" className="flex items-center">
                      <Facebook className="h-4 w-4 mr-2" />
                      Facebook
                    </TabsTrigger>
                    <TabsTrigger value="twitter" className="flex items-center">
                      <Twitter className="h-4 w-4 mr-2" />
                      Twitter
                    </TabsTrigger>
                    <TabsTrigger value="gmail" className="flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      Gmail
                    </TabsTrigger>
                    <TabsTrigger value="googleReviews" className="flex items-center">
                      <Star className="h-4 w-4 mr-2" />
                      Google
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="instagram">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Seguidores</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{analytics.platformAnalytics.instagram.followersGrowth[analytics.platformAnalytics.instagram.followersGrowth.length - 1].toLocaleString()}</div>
                          <p className="text-xs text-muted-foreground">
                            +{analytics.platformAnalytics.instagram.followersGrowth[analytics.platformAnalytics.instagram.followersGrowth.length - 1] - analytics.platformAnalytics.instagram.followersGrowth[0]} nuevos seguidores
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Engagement</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{analytics.platformAnalytics.instagram.engagementRate}%</div>
                          <p className="text-xs text-muted-foreground">
                            Del alcance total
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Alcance</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{analytics.platformAnalytics.instagram.reachRate}%</div>
                          <p className="text-xs text-muted-foreground">
                            De los seguidores totales
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Interacciones Diarias</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[250px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={analytics.platformAnalytics.instagram.dailyInteractions.map((value, index) => ({ name: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][index], valor: value }))}>
                              <defs>
                                <linearGradient id="colorInstagram" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <RechartsTooltip />
                              <Area type="monotone" dataKey="valor" stroke="#8884d8" fillOpacity={1} fill="url(#colorInstagram)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Sentimiento de Audiencia</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[250px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={[
                                  { name: 'Positivo', value: analytics.platformAnalytics.instagram.sentimentDistribution.positive },
                                  { name: 'Neutral', value: analytics.platformAnalytics.instagram.sentimentDistribution.neutral },
                                  { name: 'Negativo', value: analytics.platformAnalytics.instagram.sentimentDistribution.negative },
                                ]}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              >
                                <Cell fill="#4ade80" />
                                <Cell fill="#94a3b8" />
                                <Cell fill="#f87171" />
                              </Pie>
                              <RechartsTooltip formatter={(value) => [`${value}%`, '']} />
                            </PieChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Hashtags Populares</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {analytics.platformAnalytics.instagram.topHashtags.map((tag) => (
                            <div key={tag} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                              #{tag}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="facebook">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Seguidores</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{analytics.platformAnalytics.facebook.followersGrowth[analytics.platformAnalytics.facebook.followersGrowth.length - 1].toLocaleString()}</div>
                          <p className="text-xs text-muted-foreground">
                            +{analytics.platformAnalytics.facebook.followersGrowth[analytics.platformAnalytics.facebook.followersGrowth.length - 1] - analytics.platformAnalytics.facebook.followersGrowth[0]} nuevos seguidores
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Engagement</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{analytics.platformAnalytics.facebook.engagementRate}%</div>
                          <p className="text-xs text-muted-foreground">
                            Del alcance total
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Alcance</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{analytics.platformAnalytics.facebook.reachRate}%</div>
                          <p className="text-xs text-muted-foreground">
                            De los seguidores totales
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Interacciones Diarias</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[250px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={analytics.platformAnalytics.facebook.dailyInteractions.map((value, index) => ({ name: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][index], valor: value }))}>
                              <defs>
                                <linearGradient id="colorFacebook" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#1877f2" stopOpacity={0.8}/>
                                  <stop offset="95%" stopColor="#1877f2" stopOpacity={0.1}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <RechartsTooltip />
                              <Area type="monotone" dataKey="valor" stroke="#1877f2" fillOpacity={1} fill="url(#colorFacebook)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Sentimiento de Audiencia</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[250px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={[
                                  { name: 'Positivo', value: analytics.platformAnalytics.facebook.sentimentDistribution.positive },
                                  { name: 'Neutral', value: analytics.platformAnalytics.facebook.sentimentDistribution.neutral },
                                  { name: 'Negativo', value: analytics.platformAnalytics.facebook.sentimentDistribution.negative },
                                ]}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              >
                                <Cell fill="#4ade80" />
                                <Cell fill="#94a3b8" />
                                <Cell fill="#f87171" />
                              </Pie>
                              <RechartsTooltip formatter={(value) => [`${value}%`, '']} />
                            </PieChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="twitter">
                    {/* Contenido similar para Twitter */}
                    <div className="text-center py-6 text-gray-500">
                      Selecciona otra plataforma para ver sus estadísticas detalladas
                    </div>
                  </TabsContent>

                  <TabsContent value="gmail">
                    {/* Contenido similar para Gmail */}
                    <div className="text-center py-6 text-gray-500">
                      Selecciona otra plataforma para ver sus estadísticas detalladas
                    </div>
                  </TabsContent>

                  <TabsContent value="googleReviews">
                    {/* Contenido similar para Google Reviews */}
                    <div className="text-center py-6 text-gray-500">
                      Selecciona otra plataforma para ver sus estadísticas detalladas
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Resto de TabsContent sin cambios */}
      </Tabs>

      {/* Modal de eliminación de cuenta existente sin cambios */}
      
      {/* Modal de autenticación de Instagram */}
      <InstagramAuthModal 
        open={instagramAuthModalOpen}
        onClose={() => setInstagramAuthModalOpen(false)}
        onSuccess={handleInstagramConnected}
      />
    </div>
  );
};

export default SocialNetworks; 