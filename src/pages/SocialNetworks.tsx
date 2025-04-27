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
  X
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";

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
    }
  });
  
  // Estado para mensajes
  const [messages, setMessages] = useState<SocialMediaMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<SocialMediaMessage | null>(null);
  const [replyContent, setReplyContent] = useState("");
  
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
        pendingMessages: 14,
        accountsByPlatform: {
          instagram: accounts.filter(acc => acc.platform === "instagram").length,
          facebook: accounts.filter(acc => acc.platform === "facebook").length,
          twitter: accounts.filter(acc => acc.platform === "twitter").length,
          linkedin: accounts.filter(acc => acc.platform === "linkedin").length,
          gmail: 0,
          googleReviews: 0
        }
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
      
      // Generar cuentas de ejemplo
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
      
      // Generar datos de suscripciones y configuraciones
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
          }
        },
        notificationPreferences: {
          instagram: true,
          gmail: true,
          googleReviews: false
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
      
      // También cargar mensajes de prueba
      loadMessages();
      
      toast({
        title: "Datos de prueba generados",
        description: "Se han creado cuentas, suscripciones y configuraciones de prueba."
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

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Redes Sociales</h1>
        <div className="flex space-x-2">
          {activeTab === "accounts" && !isAddingAccount && (
            <>
              <Button variant="outline" onClick={generateTestData} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Generar Datos de Prueba
              </Button>
              <Button onClick={() => setIsAddingAccount(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Añadir Cuenta
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-8">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="accounts">Mis Cuentas</TabsTrigger>
          <TabsTrigger value="subscriptions">Suscripciones</TabsTrigger>
          <TabsTrigger value="settings">Configuración</TabsTrigger>
          <TabsTrigger value="analytics">Analíticas</TabsTrigger>
          <TabsTrigger value="messages" className="relative">
            Mensajes
            {messages.filter(m => !m.read).length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                {messages.filter(m => !m.read).length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        
        {/* Pestaña de Cuentas */}
        <TabsContent value="accounts">
          {isAddingAccount ? (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>{isEditingAccount ? "Editar Cuenta" : "Añadir Nueva Cuenta"}</CardTitle>
                <CardDescription>
                  {isEditingAccount 
                    ? "Actualiza los detalles de tu cuenta de red social" 
                    : "Conecta una nueva cuenta de red social a tu sistema"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={saveAccount} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="platform">Plataforma</Label>
                    <select
                      id="platform"
                      value={platform}
                      onChange={(e) => setPlatform(e.target.value)}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="facebook">Facebook</option>
                      <option value="instagram">Instagram</option>
                      <option value="twitter">Twitter</option>
                      <option value="linkedin">LinkedIn</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="username">Nombre de usuario</Label>
                    <Input 
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Nombre de usuario o página"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="url">URL del perfil</Label>
                    <Input 
                      id="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                  
                  <div className="flex space-x-2 pt-2">
                    <Button type="submit">
                      {isEditingAccount ? "Actualizar" : "Guardar"}
                    </Button>
                    <Button 
                      variant="outline" 
                      type="button"
                      onClick={() => {
                        setIsAddingAccount(false);
                        setIsEditingAccount(false);
                        setPlatform("facebook");
                        setUsername("");
                        setUrl("");
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Tus Cuentas de Redes Sociales</CardTitle>
              <CardDescription>
                Gestiona tus cuentas conectadas para integración con la plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : accounts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No tienes cuentas de redes sociales configuradas.</p>
                  <p className="mt-2">Haz clic en "Añadir Cuenta" para comenzar.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plataforma</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell className="flex items-center">
                          {getPlatformIcon(account.platform)}
                          <span className="ml-2 capitalize">{account.platform}</span>
                        </TableCell>
                        <TableCell>{account.username}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          <a 
                            href={account.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                          >
                            {account.url}
                          </a>
                        </TableCell>
                        <TableCell>
                          <span 
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              account.connected 
                                ? "bg-green-100 text-green-800" 
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {account.connected ? "Conectado" : "Pendiente"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => copyToClipboard(account.url)}
                              title="Copiar URL"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => editAccount(account)}
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => prepareDeleteAccount(account)}
                              title="Eliminar"
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Pestaña de Suscripciones */}
        <TabsContent value="subscriptions">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {platforms.map(platform => {
              const isSubscribed = subscriptions[platform.id]?.active || false;
              const endDate = subscriptions[platform.id]?.subscriptionEndDate;
              
              return (
                <Card key={platform.id} className="overflow-hidden">
                  <div className={`h-2 ${platform.color}`}></div>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-full ${platform.color} text-white`}>
                        {platform.icon}
                      </div>
                      <div>
                        <CardTitle>{platform.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {isSubscribed ? `Activo hasta ${endDate}` : `${platform.price}€/mes`}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">{platform.description}</p>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      onClick={() => toggleSubscription(platform.id)}
                      variant={isSubscribed ? "outline" : "default"}
                      className="w-full"
                    >
                      {isSubscribed ? "Cancelar suscripción" : "Activar"}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </TabsContent>
        
        {/* Pestaña de Configuración */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Redes Sociales</CardTitle>
              <CardDescription>
                Personaliza las notificaciones y respuestas automáticas para cada plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {platforms.map(platform => {
                  const isSubscribed = subscriptions[platform.id]?.active || false;
                  const config = settings[platform.id] || {
                    notifications: false,
                    autoResponse: { enabled: false, mode: 'draft' }
                  };
                  
                  return (
                    <div key={platform.id} className="space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b">
                        <div className="flex items-center">
                          <div className={`p-1 rounded-full ${platform.color} text-white mr-2`}>
                            {React.cloneElement(platform.icon, { className: 'h-6 w-6' })}
                          </div>
                          <h3 className="text-lg font-medium">{platform.name}</h3>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          isSubscribed ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                        }`}>
                          {isSubscribed ? "Activo" : "No activado"}
                        </span>
                      </div>
                      
                      {isSubscribed ? (
                        <>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <BellRing className="h-5 w-5 text-gray-500" />
                              <Label htmlFor={`notify-${platform.id}`} className="cursor-pointer">
                                Notificaciones
                              </Label>
                            </div>
                            <Switch
                              id={`notify-${platform.id}`}
                              checked={config.notifications}
                              onCheckedChange={(value) => updateNotificationSetting(platform.id, value)}
                              disabled={!isSubscribed}
                            />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Bot className="h-5 w-5 text-gray-500" />
                              <Label htmlFor={`autoresponse-${platform.id}`} className="cursor-pointer">
                                Respuesta automática
                              </Label>
                            </div>
                            <Switch
                              id={`autoresponse-${platform.id}`}
                              checked={config.autoResponse.enabled}
                              onCheckedChange={(value) => updateAutoResponseSetting(platform.id, value)}
                              disabled={!isSubscribed}
                            />
                          </div>
                          
                          {config.autoResponse.enabled && (
                            <div className="ml-7 mt-2">
                              <Label className="text-sm text-gray-500 mb-2 block">Modo de respuesta</Label>
                              <div className="flex space-x-4">
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="radio"
                                    id={`mode-draft-${platform.id}`}
                                    name={`mode-${platform.id}`}
                                    checked={config.autoResponse.mode === 'draft'}
                                    onChange={() => updateAutoResponseSetting(platform.id, true, 'draft')}
                                  />
                                  <Label htmlFor={`mode-draft-${platform.id}`} className="cursor-pointer text-sm">
                                    Borrador
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="radio"
                                    id={`mode-auto-${platform.id}`}
                                    name={`mode-${platform.id}`}
                                    checked={config.autoResponse.mode === 'autonomous'}
                                    onChange={() => updateAutoResponseSetting(platform.id, true, 'autonomous')}
                                  />
                                  <Label htmlFor={`mode-auto-${platform.id}`} className="cursor-pointer text-sm">
                                    Autónomo
                                  </Label>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="py-2 text-sm text-gray-500">
                          Activa la suscripción a {platform.name} para configurar las preferencias
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={saveSettings} 
                disabled={savingSettings || Object.keys(subscriptions).length === 0}
                className="ml-auto"
              >
                {savingSettings && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Configuración
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Pestaña de Analíticas */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Cuentas Activas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{analytics.totalAccounts}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {analytics.activeSubscriptions} suscripciones activas
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Interacciones Totales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{analytics.totalInteractions}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Últimos 30 días
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Tasa de Respuesta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{analytics.responseRate}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {analytics.pendingMessages} mensajes pendientes
                </p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Distribución de Plataformas</CardTitle>
              <CardDescription>
                Distribución de tus cuentas conectadas por plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.entries(analytics.accountsByPlatform).filter(([_, count]) => count > 0).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No hay cuentas conectadas para mostrar distribución.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(analytics.accountsByPlatform).map(([platform, count]) => {
                    if (count === 0) return null;
                    
                    // Calcular porcentaje
                    const percentage = analytics.totalAccounts > 0 
                      ? Math.round((count / analytics.totalAccounts) * 100) 
                      : 0;
                    
                    // Definir color según plataforma
                    let color;
                    switch(platform) {
                      case 'instagram':
                        color = 'bg-gradient-to-r from-purple-500 to-pink-500';
                        break;
                      case 'facebook':
                        color = 'bg-blue-600';
                        break;
                      case 'twitter':
                        color = 'bg-blue-400';
                        break;
                      case 'linkedin':
                        color = 'bg-blue-800';
                        break;
                      default:
                        color = 'bg-gray-500';
                    }
                    
                    return (
                      <div key={platform}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium capitalize">{platform}</span>
                          <span className="text-sm font-medium">{count}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`${color} h-2 rounded-full`} 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Pestaña de Mensajes */}
        <TabsContent value="messages">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Mensajes Recientes</CardTitle>
                <CardDescription>
                  Mensajes recibidos en tus redes sociales
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingMessages ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No hay mensajes para mostrar.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {messages.map(message => (
                      <div 
                        key={message.id}
                        onClick={() => {
                          setSelectedMessage(message);
                          if (!message.read) {
                            markMessageAsRead(message.id);
                          }
                        }}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedMessage?.id === message.id
                            ? 'bg-primary/10'
                            : message.read ? 'bg-white hover:bg-gray-100' : 'bg-blue-50 hover:bg-blue-100'
                        } border ${message.read ? 'border-gray-200' : 'border-blue-300'}`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <Avatar>
                              {message.sender.avatar ? (
                                <AvatarImage src={message.sender.avatar} alt={message.sender.name} />
                              ) : (
                                <AvatarFallback>{message.sender.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                              )}
                            </Avatar>
                            {!message.read && (
                              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-blue-500"></span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                              <p className="font-medium truncate">{message.sender.name}</p>
                              <div className="flex items-center">
                                {getPlatformIcon(message.platform)}
                              </div>
                            </div>
                            <p className="text-sm text-gray-500 truncate">{message.content}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(message.timestamp).toLocaleString('es-ES', {
                                hour: '2-digit',
                                minute: '2-digit',
                                day: '2-digit',
                                month: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2">
              {selectedMessage ? (
                <>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          {selectedMessage.sender.avatar ? (
                            <AvatarImage src={selectedMessage.sender.avatar} alt={selectedMessage.sender.name} />
                          ) : (
                            <AvatarFallback>{selectedMessage.sender.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <CardTitle className="flex items-center">
                            {selectedMessage.sender.name}
                            <span className="ml-2">{getPlatformIcon(selectedMessage.platform)}</span>
                          </CardTitle>
                          <CardDescription>
                            {new Date(selectedMessage.timestamp).toLocaleString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit',
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
                          </CardDescription>
                        </div>
                      </div>
                      <Button 
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedMessage(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 rounded-lg bg-gray-100">
                      <p>{selectedMessage.content}</p>
                    </div>
                    
                    {selectedMessage.replied ? (
                      <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                        <p className="text-sm font-medium text-primary mb-2">Tu respuesta anterior:</p>
                        <p className="text-sm">Esta conversación ya ha sido respondida anteriormente.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Escribe tu respuesta aquí..."
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          className="min-h-[120px]"
                        />
                        
                        {subscriptions[selectedMessage.platform]?.active ? (
                          <div className="flex justify-between items-center">
                            <div className="space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setReplyContent(prev => prev + "\n\nSaludos cordiales,\nAtención al Cliente")}
                              >
                                Añadir Firma
                              </Button>
                              <Button
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  const draft = "Gracias por su mensaje. Apreciamos su interés en nuestros productos. ";
                                  setReplyContent(draft);
                                }}
                              >
                                <Bot className="h-4 w-4 mr-2" />
                                Generar Borrador
                              </Button>
                            </div>
                            <Button onClick={() => sendReply(selectedMessage.id)}>
                              Enviar Respuesta
                            </Button>
                          </div>
                        ) : (
                          <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                            <p className="text-sm text-yellow-800">
                              Para responder a mensajes de {selectedMessage.platform}, debes activar una suscripción.
                            </p>
                            <Button 
                              variant="outline"
                              className="mt-2"
                              onClick={() => {
                                setActiveTab("subscriptions");
                              }}
                            >
                              Ver Suscripciones
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </>
              ) : (
                <div className="h-full flex flex-col justify-center items-center py-16 text-gray-500">
                  <MessageSquare className="h-16 w-16 mb-4 text-gray-300" />
                  <p>Selecciona un mensaje para ver los detalles</p>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Diálogo de confirmación para eliminar cuenta */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la cuenta de 
              {accountToDelete?.platform && ` ${accountToDelete.platform} `}
              para el usuario {accountToDelete?.username}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={deleteAccount} className="bg-red-500 hover:bg-red-600">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SocialNetworks; 