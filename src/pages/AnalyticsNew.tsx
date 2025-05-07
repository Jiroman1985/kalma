import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, Timestamp, doc, getDoc } from "firebase/firestore";
import {
  Instagram,
  MessageSquareDashed,
  MessageSquare,
  Mail,
  Globe,
  Loader2,
  Calendar,
  Download,
  Filter,
  BarChart4
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { format, subDays, isAfter } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Importar componentes de métricas específicas
import ChannelSelector, { Channel } from "@/components/analytics/ChannelSelector";
import GeneralMetrics from "@/components/analytics/GeneralMetrics";
import InstagramMetrics from "@/components/analytics/InstagramMetrics";
import WhatsAppMetrics from "@/components/analytics/WhatsAppMetrics";

// Función para crear un componente TelegramIcon
function TelegramIcon(props: React.SVGProps<SVGSVGElement>) {
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

const AnalyticsNew = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState("all");
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [connectedChannels, setConnectedChannels] = useState<string[]>([]);

  // Lista de canales disponibles
  const channels: Channel[] = [
    {
      id: "instagram",
      name: "Instagram",
      icon: <Instagram className="h-4 w-4" />,
      color: "bg-gradient-to-r from-purple-500 to-pink-600",
      isConnected: connectedChannels.includes("instagram"),
    },
    {
      id: "whatsapp",
      name: "WhatsApp",
      icon: <MessageSquareDashed className="h-4 w-4" />,
      color: "bg-green-600",
      isConnected: connectedChannels.includes("whatsapp"),
    },
    {
      id: "messenger",
      name: "Messenger",
      icon: <MessageSquare className="h-4 w-4" />,
      color: "bg-blue-600",
      isConnected: connectedChannels.includes("messenger"),
    },
    {
      id: "gmail",
      name: "Gmail",
      icon: <Mail className="h-4 w-4" />,
      color: "bg-gradient-to-r from-red-400 to-red-600",
      isConnected: connectedChannels.includes("gmail"),
    },
    {
      id: "email",
      name: "Email",
      icon: <Mail className="h-4 w-4" />,
      color: "bg-blue-500",
      isConnected: connectedChannels.includes("email"),
    },
    {
      id: "website",
      name: "Sitio Web",
      icon: <Globe className="h-4 w-4" />,
      color: "bg-indigo-500",
      isConnected: connectedChannels.includes("website"),
    },
    {
      id: "telegram",
      name: "Telegram",
      icon: <TelegramIcon className="h-4 w-4" />,
      color: "bg-blue-400",
      isConnected: connectedChannels.includes("telegram"),
    },
  ];

  // Efecto para cargar datos iniciales
  useEffect(() => {
    const fetchConnectedChannels = async () => {
      setLoading(true);
      let connected: string[] = ["whatsapp"]; // Siempre incluir WhatsApp por defecto
      
      try {
        if (!currentUser) {
          setLoading(false);
          return;
        }

        console.log('Verificando canales conectados para usuario:', currentUser.uid);
        
        try {
          // 1. Obtener los canales conectados desde channelConnections
          console.log('1. Verificando canales en channelConnections...');
          const connectionsRef = collection(db, "users", currentUser.uid, "channelConnections");
          const connectionsSnapshot = await getDocs(connectionsRef);
          
          connectionsSnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.channelId) {
              console.log(`Canal encontrado en channelConnections: ${data.channelId}`);
              if (!connected.includes(data.channelId)) {
                connected.push(data.channelId);
              }
            }
          });
        } catch (error) {
          console.error("Error al verificar channelConnections:", error);
        }

        try {
          // 2. Verificar específicamente Instagram en la estructura legacy
          console.log('2. Verificando Instagram en documento de usuario...');
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Verificar Instagram
            if (userData.socialNetworks?.instagram?.connected) {
              console.log('Instagram conectado en estructura legacy');
              if (!connected.includes('instagram')) {
                connected.push('instagram');
              }
            }
            
            // Verificar Gmail
            if (userData.socialNetworks?.gmail?.connected) {
              console.log('Gmail conectado en estructura legacy');
              if (!connected.includes('gmail')) {
                connected.push('gmail');
              }
            }
          } else {
            console.log('No se encontró documento de usuario');
          }
        } catch (error) {
          console.error("Error al verificar documento de usuario:", error);
        }

        try {
          // 3. Verificar Instagram en socialTokens/instagram
          console.log('3. Verificando Instagram en socialTokens...');
          // Probar ambas rutas posibles para Instagram
          const instagramPath1 = doc(db, 'users', currentUser.uid, 'socialTokens', 'instagram');
          const instagramDoc1 = await getDoc(instagramPath1);
          
          if (instagramDoc1.exists()) {
            const instagramData = instagramDoc1.data();
            if (instagramData.accessToken && instagramData.instagramUserId) {
              console.log('Instagram conectado en users/{userId}/socialTokens/instagram');
              if (!connected.includes('instagram')) {
                connected.push('instagram');
              }
            }
          }
          
          // Alternativa: Verificar en socialTokens/{userId}
          const socialTokensPath = doc(db, 'socialTokens', currentUser.uid);
          const socialTokensDoc = await getDoc(socialTokensPath);
          
          if (socialTokensDoc.exists()) {
            const socialTokensData = socialTokensDoc.data();
            
            // Verificar Instagram
            if (socialTokensData.instagram) {
              console.log('Instagram encontrado en socialTokens/{userId}/instagram');
              if (!connected.includes('instagram')) {
                connected.push('instagram');
              }
            }
            
            // Verificar Gmail
            if (socialTokensData.gmail) {
              console.log('Gmail encontrado en socialTokens/{userId}/gmail');
              if (!connected.includes('gmail')) {
                connected.push('gmail');
              }
            }
          }
        } catch (error) {
          console.error("Error al verificar socialTokens:", error);
        }

        // Asegurarse de que WhatsApp siempre esté conectado (ya que es el canal principal)
        if (!connected.includes("whatsapp")) {
          console.log('Añadiendo WhatsApp como canal por defecto');
          connected.push("whatsapp");
        }

        console.log('Canales conectados finales:', connected);
        setConnectedChannels(connected);
      } catch (error) {
        console.error("Error general al cargar canales conectados:", error);
        // En caso de error, al menos mostrar WhatsApp
        setConnectedChannels(["whatsapp"]);
        toast({
          title: "Error",
          description: "No se pudieron cargar todos los canales conectados",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchConnectedChannels();
  }, [currentUser, toast]);

  // Función para actualizar el canal seleccionado
  const handleSelectChannel = (channelId: string) => {
    setSelectedChannel(channelId);
  };

  // Calcular el rango de fechas formateado para mostrar
  const formattedDateRange = `${format(dateRange.from, "dd MMM", { locale: es })} - ${format(dateRange.to, "dd MMM yyyy", { locale: es })}`;

  // Renderizar componente de métricas según el canal seleccionado
  const renderMetricsComponent = () => {
    switch (selectedChannel) {
      case "instagram":
        return <InstagramMetrics isLoading={loading} />;
      case "whatsapp":
        return <WhatsAppMetrics isLoading={loading} />;
      case "all":
      default:
        return <GeneralMetrics isLoading={loading} />;
    }
  };

  // Descargar informe (función simulada)
  const handleDownloadReport = () => {
    toast({
      title: "Descargando informe",
      description: `Informe de ${selectedChannel === "all" ? "todos los canales" : selectedChannel} (${formattedDateRange})`,
    });
  };

  return (
    <div className="container mx-auto py-6 max-w-7xl space-y-8">
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart4 className="h-6 w-6 text-indigo-600" />
            Analytics
          </h1>
          <p className="text-gray-500 mt-1">
            Análisis completo de todas tus comunicaciones y canales
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Selector de fecha */}
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex gap-2 h-10">
                <Calendar className="h-4 w-4" />
                <span>{formattedDateRange}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange({ from: range.from, to: range.to });
                    setIsCalendarOpen(false);
                  }
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          {/* Botón de descarga de informe */}
          <Button variant="outline" className="flex gap-2 h-10" onClick={handleDownloadReport}>
            <Download className="h-4 w-4" />
            <span>Descargar Informe</span>
          </Button>
        </div>
      </div>

      {/* Sección principal */}
      {loading && !connectedChannels.length ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Selector de canal */}
          <ChannelSelector 
            channels={channels} 
            selectedChannel={selectedChannel} 
            onSelectChannel={handleSelectChannel} 
          />

          {/* Componente de métricas específico */}
          {renderMetricsComponent()}
        </motion.div>
      )}
    </div>
  );
};

export default AnalyticsNew; 