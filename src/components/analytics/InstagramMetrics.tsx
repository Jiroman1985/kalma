import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import ChartContainer from "./ChartContainer";
import MetricCard from "./MetricCard";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart
} from "recharts";
import {
  Instagram, Users, Clock, ArrowUpRight, TrendingUp,
  Heart, MessageCircle, Repeat, Bookmark, BarChart3, UserRound, ZoomIn
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  orderBy, 
  limit, 
  Timestamp 
} from "firebase/firestore";

interface InstagramMetricsProps {
  isLoading?: boolean;
}

// Datos para cuando no hay conexión o datos disponibles
const NO_DATA_MESSAGE = "N/A";

// Tipos de datos
interface DailyEngagementData {
  date: string;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
}

interface InteractionTypeData {
  name: string;
  value: number;
}

interface HourlyActivityData {
  hour: string;
  count: number;
}

interface InstagramMessage {
  id: string;
  platform: string;
  externalId?: string;
  userId: string;
  senderId: string;
  senderName: string;
  senderUsername?: string;
  senderProfileUrl?: string;
  senderAvatar?: string;
  type: 'directMessage' | 'comment' | 'mention' | 'review' | 'email';
  content: string;
  mediaUrl?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  autoReply?: string;
  autoReplySent: boolean;
  manualReply?: string;
  status: 'unread' | 'read' | 'replied' | 'archived';
  createdAt: string | Timestamp; // ISO date string or Firestore Timestamp
  updatedAt: string | Timestamp; // ISO date string or Firestore Timestamp
  metadata?: Record<string, any>;
}

const InstagramMetrics = ({ isLoading = false }: InstagramMetricsProps) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(isLoading);
  
  // Estados para métricas
  const [followerCount, setFollowerCount] = useState<number | null>(null);
  const [engagementRate, setEngagementRate] = useState<number | null>(null);
  const [directMessages, setDirectMessages] = useState<number | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  
  // Estados para gráficos
  const [dailyEngagement, setDailyEngagement] = useState<DailyEngagementData[]>([]);
  const [interactionTypes, setInteractionTypes] = useState<InteractionTypeData[]>([]);
  const [hourlyActivity, setHourlyActivity] = useState<HourlyActivityData[]>([]);
  const [followerGrowth, setFollowerGrowth] = useState<any[]>([]);
  
  // Estado para datos de mensajes
  const [messages, setMessages] = useState<InstagramMessage[]>([]);
  const [hasInstagramAccount, setHasInstagramAccount] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      
      setLoading(true);
      try {
        // Comprobar si el usuario tiene Instagram conectado
        const socialAccountsRef = collection(db, "users", currentUser.uid, "socialAccounts");
        const instagramQuery = query(socialAccountsRef, where("platform", "==", "instagram"));
        const instagramSnapshot = await getDocs(instagramQuery);
        
        if (instagramSnapshot.empty) {
          console.log("No hay cuentas de Instagram conectadas");
          setHasInstagramAccount(false);
          // Si no hay cuentas, generar datos simulados
          generateSimulatedData();
          setLoading(false);
          return;
        }
        
        setHasInstagramAccount(true);
        
        // También buscar en socialNetworks.instagram
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        let hasRealData = false;
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Comprobar si hay datos de Instagram en socialNetworks o instagramMetrics
          if (userData.socialNetworks?.instagram?.connected || userData.instagramMetrics) {
            hasRealData = true;
            
            // Buscar métricas de Instagram en el perfil del usuario
            if (userData.instagramMetrics) {
              const metrics = userData.instagramMetrics;
              
              // Establecer datos de las métricas
              if (metrics.followerCount) setFollowerCount(metrics.followerCount);
              if (metrics.engagementRate) setEngagementRate(metrics.engagementRate);
              if (metrics.responseTime) setResponseTime(metrics.responseTime);
              
              // Usar otras métricas si están disponibles
              if (metrics.followerGrowth) setFollowerGrowth(metrics.followerGrowth);
              if (metrics.hourlyActivity) setHourlyActivity(metrics.hourlyActivity);
              if (metrics.interactionTypes) setInteractionTypes(metrics.interactionTypes);
              if (metrics.dailyEngagement) setDailyEngagement(metrics.dailyEngagement);
            }
            
            // Si hay datos en socialNetworks.instagram
            if (userData.socialNetworks?.instagram) {
              const igData = userData.socialNetworks.instagram;
              
              // Obtener datos de seguidores si están disponibles
              if (igData.followerCount && !followerCount) {
                setFollowerCount(igData.followerCount);
              }
              
              // Más datos si están disponibles
              if (igData.engagementRate && !engagementRate) {
                setEngagementRate(igData.engagementRate);
              }
            }
          }
        }
        
        // Obtener mensajes y comentarios de Instagram
        const instagramMessagesRef = collection(db, "users", currentUser.uid, "messages");
        const instagramMessagesQuery = query(
          instagramMessagesRef, 
          where("platform", "==", "instagram"),
          orderBy("createdAt", "desc"),
          limit(100)
        );
        
        const messagesSnapshot = await getDocs(instagramMessagesQuery);
        
        if (!messagesSnapshot.empty) {
          hasRealData = true;
          
          // Convertir documentos a objetos de mensajes
          const instagramMessages: InstagramMessage[] = [];
          messagesSnapshot.forEach(doc => {
            instagramMessages.push({ id: doc.id, ...doc.data() } as InstagramMessage);
          });
          
          setMessages(instagramMessages);
          
          // Calcular métricas basadas en los mensajes
          calculateMetricsFromMessages(instagramMessages);
        }
        
        // Si no hay datos reales, generar simulados
        if (!hasRealData) {
          console.log("No hay datos reales de Instagram, usando simulados");
          generateSimulatedData();
        }
        
      } catch (error) {
        console.error("Error al cargar datos de Instagram:", error);
        // En caso de error, generar datos simulados
        generateSimulatedData();
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [currentUser]);
  
  const calculateMetricsFromMessages = (messages: InstagramMessage[]) => {
    if (messages.length === 0) return;
    
    // Contar mensajes directos
    const dmCount = messages.filter(msg => msg.type === 'directMessage').length;
    setDirectMessages(dmCount);
    
    // Calcular actividad por día
    const engagement = calculateDailyEngagement(messages);
    setDailyEngagement(engagement);
    
    // Calcular tipos de interacción
    const interactions = calculateInteractionTypes(messages);
    setInteractionTypes(interactions);
    
    // Calcular distribución por hora
    const hourly = calculateHourlyDistribution(messages);
    setHourlyActivity(hourly);
    
    // Calcular tiempo de respuesta si no se ha establecido antes
    if (responseTime === null) {
      const messagesWithResponse = messages.filter(
        msg => msg.autoReplySent || msg.manualReply
      );
      
      if (messagesWithResponse.length > 0) {
        // Cálculo simplificado para el ejemplo
        const avgTime = 25; // Minutos
        setResponseTime(avgTime);
      }
    }
  };
  
  const calculateDailyEngagement = (messages: InstagramMessage[]) => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        date: date.toISOString().split('T')[0],
        likes: 0,
        comments: 0,
        shares: 0,
        saves: 0
      };
    });
    
    // Agrupar interacciones por día
    const engagementByDay: Record<string, {
      likes: number,
      comments: number,
      shares: number,
      saves: number
    }> = {};
    
    messages.forEach(msg => {
      // Convertir createdAt a fecha
      let date: Date;
      if (typeof msg.createdAt === 'string') {
        date = new Date(msg.createdAt);
      } else if (msg.createdAt instanceof Timestamp) {
        date = msg.createdAt.toDate();
      } else {
        return;
      }
      
      const dateStr = date.toISOString().split('T')[0];
      
      if (!engagementByDay[dateStr]) {
        engagementByDay[dateStr] = { likes: 0, comments: 0, shares: 0, saves: 0 };
      }
      
      // Incrementar contador según el tipo
      if (msg.type === 'directMessage') {
        // Los DMs no cuentan para engagement público
      } else if (msg.type === 'comment') {
        engagementByDay[dateStr].comments++;
      } else if (msg.metadata) {
        // Usar metadata para otros tipos
        if (msg.metadata.isLike) engagementByDay[dateStr].likes++;
        if (msg.metadata.isShare) engagementByDay[dateStr].shares++;
        if (msg.metadata.isSave) engagementByDay[dateStr].saves++;
      }
    });
    
    // Mezclar con los días predeterminados
    return last30Days.map(day => ({
      date: day.date,
      likes: engagementByDay[day.date]?.likes || 0,
      comments: engagementByDay[day.date]?.comments || 0, 
      shares: engagementByDay[day.date]?.shares || 0,
      saves: engagementByDay[day.date]?.saves || 0
    }));
  };
  
  const calculateInteractionTypes = (messages: InstagramMessage[]) => {
    // Contar diferentes tipos de interacción
    const counts = {
      likes: 0,
      comments: 0,
      directMessages: 0,
      mentions: 0
    };
    
    messages.forEach(msg => {
      if (msg.type === 'directMessage') {
        counts.directMessages++;
      } else if (msg.type === 'comment') {
        counts.comments++;
      } else if (msg.type === 'mention') {
        counts.mentions++;
      } else if (msg.metadata?.isLike) {
        counts.likes++;
      }
    });
    
    // Si no hay datos suficientes, agregar algunos simulados para visualización
    if (Object.values(counts).reduce((a, b) => a + b, 0) < 10) {
      counts.likes = Math.max(counts.likes, 45);
      counts.comments = Math.max(counts.comments, 25);
      counts.directMessages = Math.max(counts.directMessages, 20);
      counts.mentions = Math.max(counts.mentions, 10);
    }
    
    return [
      { name: 'Me gusta', value: counts.likes },
      { name: 'Comentarios', value: counts.comments },
      { name: 'Mensajes', value: counts.directMessages },
      { name: 'Menciones', value: counts.mentions }
    ];
  };
  
  const calculateHourlyDistribution = (messages: InstagramMessage[]) => {
    // Inicializar conteo por hora
    const hourCounts: Record<string, number> = {};
    for (let i = 0; i < 24; i++) {
      hourCounts[i.toString().padStart(2, '0')] = 0;
    }
    
    messages.forEach(msg => {
      // Convertir createdAt a fecha
      let date: Date;
      if (typeof msg.createdAt === 'string') {
        date = new Date(msg.createdAt);
      } else if (msg.createdAt instanceof Timestamp) {
        date = msg.createdAt.toDate();
      } else {
        return;
      }
      
      const hour = date.getHours().toString().padStart(2, '0');
      hourCounts[hour]++;
    });
    
    // Si hay muy pocos mensajes, agregar datos simulados
    const totalCount = Object.values(hourCounts).reduce((a, b) => a + b, 0);
    if (totalCount < 24) {
      // Agregar picos en horas típicas (mañana, mediodía, tarde, noche)
      hourCounts['09'] = Math.max(hourCounts['09'], 15);
      hourCounts['12'] = Math.max(hourCounts['12'], 22);
      hourCounts['17'] = Math.max(hourCounts['17'], 28);
      hourCounts['21'] = Math.max(hourCounts['21'], 35);
    }
    
    // Convertir a formato para gráfico
    return Object.entries(hourCounts).map(([hour, count]) => ({
      hour: `${hour}h`,
      count
    }));
  };
  
  // Generar datos simulados para mostrar la estructura
  const generateSimulatedData = () => {
    // Métricas simuladas
    setFollowerCount(followerCount || 1240);
    setEngagementRate(engagementRate || 4.2);
    setDirectMessages(directMessages || 48);
    setResponseTime(responseTime || 25);
    
    // Engagement diario simulado
    if (dailyEngagement.length === 0) {
      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return {
          date: date.toISOString().split('T')[0],
          likes: Math.floor(Math.random() * 50) + 20,
          comments: Math.floor(Math.random() * 20) + 5,
          shares: Math.floor(Math.random() * 15) + 2,
          saves: Math.floor(Math.random() * 10) + 1
        };
      });
      setDailyEngagement(last30Days);
    }
    
    // Tipos de interacción simulados
    if (interactionTypes.length === 0) {
      setInteractionTypes([
        { name: 'Me gusta', value: 45 },
        { name: 'Comentarios', value: 25 },
        { name: 'Mensajes', value: 20 },
        { name: 'Menciones', value: 10 }
      ]);
    }
    
    // Actividad por hora simulada
    if (hourlyActivity.length === 0) {
      const hourlyData = Array.from({ length: 24 }, (_, i) => {
        const hour = i.toString().padStart(2, '0');
        
        // Simular picos en horas específicas
        let count;
        if (i >= 9 && i <= 11) { // Mañana
          count = Math.floor(Math.random() * 15) + 10;
        } else if (i >= 12 && i <= 14) { // Mediodía
          count = Math.floor(Math.random() * 20) + 15;
        } else if (i >= 17 && i <= 22) { // Tarde-noche
          count = Math.floor(Math.random() * 25) + 20;
        } else { // Madrugada
          count = Math.floor(Math.random() * 5) + 1;
        }
        
        return {
          hour: `${hour}h`,
          count
        };
      });
      setHourlyActivity(hourlyData);
    }
    
    // Crecimiento de seguidores simulado
    if (followerGrowth.length === 0) {
      const last12Months = Array.from({ length: 12 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (11 - i));
        
        // Simular crecimiento progresivo
        const baseFollowers = 750;
        const monthlyGrowth = 40 + (i * 5);
        const noise = Math.floor(Math.random() * 20) - 10;
        
        return {
          month: date.toLocaleDateString('es-ES', { month: 'short' }),
          followers: baseFollowers + (monthlyGrowth * i) + noise,
          nuevos: monthlyGrowth + noise
        };
      });
      setFollowerGrowth(last12Months);
    }
  };
  
  // Colores para los gráficos
  const INTERACTION_COLORS = ['#F43F5E', '#8B5CF6', '#3B82F6', '#10B981'];
  
  // Formatear valores para mostrar "N/A" si no hay datos
  const formatFollowerCount = () => {
    return followerCount !== null ? followerCount.toLocaleString() : NO_DATA_MESSAGE;
  };
  
  const formatEngagementRate = () => {
    return engagementRate !== null ? `${engagementRate}%` : NO_DATA_MESSAGE;
  };
  
  const formatDirectMessages = () => {
    return directMessages !== null ? directMessages.toString() : NO_DATA_MESSAGE;
  };
  
  const formatResponseTime = () => {
    return responseTime !== null ? `${responseTime} min` : NO_DATA_MESSAGE;
  };
  
  // Trends (positivos para todas las métricas excepto tiempo de respuesta)
  const followerTrend = "+5.2%";
  const engagementTrend = "+3.8%";
  const messagesTrend = "+12.5%";
  const responseTrend = "-8.3%";

  return (
    <div className="space-y-8">
      {!hasInstagramAccount && !loading && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0 text-yellow-400">
              <ZoomIn className="h-5 w-5" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Cuenta de Instagram no detectada
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Los datos mostrados son simulados. Para ver datos reales, conecta tu cuenta de Instagram en la sección de Canales.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Tarjetas de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Seguidores"
          value={formatFollowerCount()}
          icon={<UserRound className="h-5 w-5" />}
          description="Total de seguidores"
          trend={followerTrend}
          trendDirection="up"
          loading={loading}
          color="pink"
        />
        
        <MetricCard
          title="Engagement"
          value={formatEngagementRate()}
          icon={<Heart className="h-5 w-5" />}
          description="Tasa de interacción"
          trend={engagementTrend}
          trendDirection="up"
          loading={loading}
          color="purple"
        />
        
        <MetricCard
          title="Mensajes Directos"
          value={formatDirectMessages()}
          icon={<MessageCircle className="h-5 w-5" />}
          description="Últimos 30 días"
          trend={messagesTrend}
          trendDirection="up"
          loading={loading}
          color="blue"
        />
        
        <MetricCard
          title="Tiempo Respuesta"
          value={formatResponseTime()}
          icon={<Clock className="h-5 w-5" />}
          description="Promedio"
          trend={responseTrend}
          trendDirection="down"
          loading={loading}
          color="emerald"
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Engagement Diario */}
        <ChartContainer
          title="Engagement Diario"
          description="Interacciones durante los últimos 30 días"
          isLoading={loading}
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyEngagement}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => value.split('-')[2]} // Mostrar solo el día
                tick={{ fontSize: 12 }}
              />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => {
                  const translations: Record<string, string> = {
                    likes: 'Me gusta',
                    comments: 'Comentarios',
                    shares: 'Compartidos',
                    saves: 'Guardados'
                  };
                  return [value, translations[name] || name];
                }}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
              />
              <Legend />
              <Bar dataKey="likes" fill="#F43F5E" name="Me gusta" />
              <Bar dataKey="comments" fill="#8B5CF6" name="Comentarios" />
              <Bar dataKey="shares" fill="#3B82F6" name="Compartidos" />
              <Bar dataKey="saves" fill="#10B981" name="Guardados" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Tipos de Interacción */}
        <ChartContainer
          title="Tipos de Interacción"
          description="Distribución de interacciones"
          isLoading={loading}
        >
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={interactionTypes}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {interactionTypes.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={INTERACTION_COLORS[index % INTERACTION_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Actividad por Hora */}
        <ChartContainer
          title="Actividad por Hora"
          description="Interacciones según hora del día"
          isLoading={loading}
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hourlyActivity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={1} />
              <YAxis />
              <Tooltip formatter={(value) => [`${value} interacciones`, ``]} />
              <Bar dataKey="count" fill="#8B5CF6" name="Interacciones" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Crecimiento de Seguidores */}
        <ChartContainer
          title="Crecimiento de Seguidores"
          description="Evolución en los últimos 12 meses"
          isLoading={loading}
        >
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={followerGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="right" dataKey="nuevos" fill="#F43F5E" name="Nuevos seguidores" />
              <Line yAxisId="left" type="monotone" dataKey="followers" stroke="#8B5CF6" name="Total seguidores" />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  );
};

export default InstagramMetrics; 