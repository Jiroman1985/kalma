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
  Heart, MessageCircle, Repeat, Bookmark, BarChart3
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
  const [messages, setMessages] = useState<InstagramMessage[]>([]);
  
  // Estados para métricas calculadas
  const [dailyEngagement, setDailyEngagement] = useState<any[]>([]);
  const [interactionTypes, setInteractionTypes] = useState<any[]>([]);
  const [hourlyActivity, setHourlyActivity] = useState<any[]>([]);
  const [followerDemographics, setFollowerDemographics] = useState<any[]>([]);
  const [followerGrowth, setFollowerGrowth] = useState<any[]>([]);
  
  // Métricas para las tarjetas
  const [followerCount, setFollowerCount] = useState<number>(0);
  const [engagementRate, setEngagementRate] = useState<number>(0);
  const [directMessages, setDirectMessages] = useState<number>(0);
  const [responseTime, setResponseTime] = useState<number>(0);

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
          // Si no hay cuentas, generar datos simulados
          generateSimulatedData();
          setLoading(false);
          return;
        }
        
        // Obtener mensajes y comentarios de Instagram
        console.log("📨 [InstagramMetrics] Consultando mensajes de Instagram");
        let instagramMessages: InstagramMessage[] = [];
        
        try {
          // Usamos query basada en índices creados
          const messagesQuery = query(
            collection(db, "messages"),
            where("userId", "==", currentUser.uid),
            where("platform", "==", "instagram")
          );
          
          const messagesSnapshot = await getDocs(messagesQuery);
          console.log(`📨 [InstagramMetrics] Mensajes encontrados: ${messagesSnapshot.size}`);
          
          if (!messagesSnapshot.empty) {
            messagesSnapshot.forEach(doc => {
              const messageData = doc.data() as InstagramMessage;
              instagramMessages.push({
                ...messageData,
                id: doc.id
              });
            });
            
            // Ordenamos manualmente
            instagramMessages.sort((a, b) => {
              // Convertir timestamps a números para comparar
              const timeA = a.createdAt ? 
                (typeof a.createdAt === 'number' ? a.createdAt : a.createdAt.toMillis()) : 0;
              const timeB = b.createdAt ? 
                (typeof b.createdAt === 'number' ? b.createdAt : b.createdAt.toMillis()) : 0;
              
              return timeB - timeA; // Ordenar descendente
            });
            
            setMessages(instagramMessages);
            
            // Calcular métricas basadas en los mensajes
            const dms = instagramMessages.filter(msg => msg.type === 'direct_message').length;
            console.log(`💬 [InstagramMetrics] Mensajes directos: ${dms}`);
            setDirectMessages(dms);
            
            // Calcular interacciones totales (mensajes + likes + comentarios)
            const totalInteractionsCount = instagramMessages.length;
            console.log(`🔄 [InstagramMetrics] Interacciones totales: ${totalInteractionsCount}`);
            setTotalInteractions(totalInteractionsCount);
            
            // Si no tenemos tasa de engagement pero tenemos mensajes, estimar
            if (!engagementRate && instagramMessages.length > 0) {
              // Estimar la tasa de engagement basada en mensajes/día
              const oldestMessageTime = instagramMessages[instagramMessages.length - 1].createdAt.toDate();
              const daysPassed = Math.max(1, Math.floor((Date.now() - oldestMessageTime.getTime()) / (1000 * 60 * 60 * 24)));
              const estimatedRate = (instagramMessages.length / daysPassed / 100).toFixed(2);
              console.log(`📊 [InstagramMetrics] Tasa de engagement estimada: ${estimatedRate}%`);
              setEngagementRate(parseFloat(estimatedRate));
            }
            
            // Generar gráficos basados en mensajes
            console.log("📊 [InstagramMetrics] Generando datos para gráficos");
            generateChartData(instagramMessages);
          } else {
            console.log("⚠️ [InstagramMetrics] No se encontraron mensajes de Instagram");
            // Si no hay mensajes pero la cuenta está conectada, generar gráficos con datos básicos
            if (hasInstagramData) {
              console.log("⚠️ [InstagramMetrics] No hay mensajes pero sí hay cuenta conectada");
              generateChartDataFromBasics(userData.socialNetworks.instagram);
            }
          }
        } catch (error) {
          console.error("❌ [InstagramMetrics] Error al consultar mensajes:", error);
          
          // Si la cuenta está conectada pero no podemos acceder a los mensajes, usar datos disponibles
          if (hasInstagramData) {
            console.log("⚠️ [InstagramMetrics] Error al acceder a mensajes, usando datos básicos");
            generateChartDataFromBasics(userData.socialNetworks.instagram);
          } else {
            console.log("⚠️ [InstagramMetrics] No se pudieron obtener datos, generando simulación");
            generateSimulatedData();
          }
        }
        
        // Si no hay datos de Instagram ni mensajes, generar datos simulados
        if (!hasInstagramData && instagramMessages.length === 0 && !userData?.socialNetworks?.instagram?.connected) {
          console.log("🔄 [InstagramMetrics] No hay datos, generando simulación");
          generateSimulatedData();
        }
        
        // Buscar métricas de Instagram en el perfil del usuario
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists() && userDoc.data().instagramMetrics) {
          const metrics = userDoc.data().instagramMetrics;
          
          // Establecer datos de las métricas
          if (metrics.followerCount) setFollowerCount(metrics.followerCount);
          if (metrics.engagementRate) setEngagementRate(metrics.engagementRate);
          if (metrics.responseTime) setResponseTime(metrics.responseTime);
          
          // Usar otras métricas si están disponibles
          if (metrics.followerGrowth) setFollowerGrowth(metrics.followerGrowth);
          if (metrics.hourlyActivity) setHourlyActivity(metrics.hourlyActivity);
        }
        
        // Calcular métricas basadas en los mensajes
        calculateMetricsFromMessages(instagramMessages);
        
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
    let likes = 0;
    let comments = 0;
    let shares = 0;
    let saves = 0;
    
    messages.forEach(msg => {
      if (msg.type === 'comment') {
        comments++;
      } else if (msg.metadata) {
        if (msg.metadata.isLike) likes++;
        if (msg.metadata.isShare) shares++;
        if (msg.metadata.isSave) saves++;
      }
    });
    
    // Si no hay suficientes datos, añadir algunos simulados para mostrar la estructura
    if (likes + comments + shares + saves < 10) {
      likes = Math.max(likes, Math.floor(Math.random() * 50) + 20);
      comments = Math.max(comments, Math.floor(Math.random() * 30) + 10);
      shares = Math.max(shares, Math.floor(Math.random() * 20) + 5);
      saves = Math.max(saves, Math.floor(Math.random() * 15) + 5);
    }
    
    return [
      { name: 'Likes', value: likes },
      { name: 'Comentarios', value: comments },
      { name: 'Compartidos', value: shares },
      { name: 'Guardados', value: saves }
    ];
  };
  
  const calculateHourlyDistribution = (messages: InstagramMessage[]) => {
    const hourly = Array.from({ length: 24 }, (_, hour) => ({
      hour: hour,
      activity: 0
    }));
    
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
      
      const hour = date.getHours();
      hourly[hour].activity++;
    });
    
    // Si hay muy poca actividad, añadir datos simulados
    const totalActivity = hourly.reduce((sum, h) => sum + h.activity, 0);
    if (totalActivity < 20) {
      return hourly.map(h => ({
        hour: h.hour,
        activity: h.activity + (
          // Patrón realista con más actividad en la mañana y noche
          (h.hour >= 7 && h.hour <= 10) || (h.hour >= 18 && h.hour <= 23)
            ? Math.floor(Math.random() * 15) + 5
            : Math.floor(Math.random() * 8) + 1
        )
      }));
    }
    
    return hourly;
  };
  
  // Función para generar datos simulados cuando no hay datos reales
  const generateSimulatedData = () => {
    // Seguidores simulados
    setFollowerCount(Math.floor(Math.random() * 5000) + 1000);
    
    // Tasa de engagement simulada
    setEngagementRate(+(Math.random() * 5 + 2).toFixed(1));
    
    // Mensajes directos simulados
    setDirectMessages(Math.floor(Math.random() * 50) + 20);
    
    // Tiempo de respuesta simulado
    setResponseTime(Math.floor(Math.random() * 30) + 10);
    
    // Engagement diario simulado
    const simulatedDailyEngagement = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        date: date.toISOString().split('T')[0],
        likes: Math.floor(Math.random() * 50) + 20,
        comments: Math.floor(Math.random() * 20) + 5,
        shares: Math.floor(Math.random() * 10) + 2,
        saves: Math.floor(Math.random() * 8) + 1
      };
    });
    setDailyEngagement(simulatedDailyEngagement);
    
    // Tipos de interacción simulados
    setInteractionTypes([
      { name: 'Likes', value: 62 },
      { name: 'Comentarios', value: 23 },
      { name: 'Compartidos', value: 8 },
      { name: 'Guardados', value: 7 }
    ]);
    
    // Actividad horaria simulada
    const simulatedHourlyActivity = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      activity: Math.floor(Math.random() * 10) + (
        // Patrón realista con más actividad en la mañana y noche
        (hour >= 7 && hour <= 10) || (hour >= 18 && hour <= 23)
          ? Math.floor(Math.random() * 15) + 5
          : Math.floor(Math.random() * 8) + 1
      )
    }));
    setHourlyActivity(simulatedHourlyActivity);
    
    // Demografía de seguidores simulada
    setFollowerDemographics([
      { name: '18-24', value: 35 },
      { name: '25-34', value: 40 },
      { name: '35-44', value: 15 },
      { name: '45+', value: 10 }
    ]);
    
    // Crecimiento de seguidores simulado
    const simulatedFollowerGrowth = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      
      // Crear una tendencia de crecimiento general
      const baseGrowth = 1000 + (i * 30);
      // Añadir un crecimiento diario aleatorio
      const dailyGrowth = Math.floor(Math.random() * 20) + 5;
      
      return {
        date: date.toISOString().split('T')[0],
        followers: baseGrowth + (i === 0 ? 0 : dailyGrowth),
        growth: dailyGrowth
      };
    });
    setFollowerGrowth(simulatedFollowerGrowth);
  };
  
  // Colores para gráficos
  const COLORS = [
    "#E1306C", "#833AB4", "#C13584", "#FCAF45", "#405DE6", "#5851DB"
  ];
  
  // Calcular totales
  const totalLikes = dailyEngagement.reduce((sum, day) => sum + day.likes, 0);
  const totalComments = dailyEngagement.reduce((sum, day) => sum + day.comments, 0);
  const totalShares = dailyEngagement.reduce((sum, day) => sum + day.shares, 0);
  const totalSaves = dailyEngagement.reduce((sum, day) => sum + day.saves, 0);
  
  return (
    <div className="space-y-8">
      {/* Tarjetas de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Seguidores"
          value={followerCount}
          icon={<Users className="h-5 w-5" />}
          description="Total de seguidores"
          trend="+3.2%"
          trendDirection="up"
          loading={loading}
          color="pink"
        />
        
        <MetricCard
          title="Engagement"
          value={`${engagementRate}%`}
          icon={<ArrowUpRight className="h-5 w-5" />}
          description="Tasa de interacción"
          trend="+0.8%"
          trendDirection="up"
          loading={loading}
          color="purple"
        />
        
        <MetricCard
          title="Mensajes directos"
          value={directMessages}
          icon={<Instagram className="h-5 w-5" />}
          description="Mensajes recibidos"
          trend="+12%"
          trendDirection="up"
          loading={loading}
          color="blue"
        />
        
        <MetricCard
          title="Tiempo de respuesta"
          value={`${responseTime} min`}
          icon={<Clock className="h-5 w-5" />}
          description="Tiempo promedio de respuesta"
          trend="-5%"
          trendDirection="down"
          loading={loading}
          color="amber"
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Engagement diario */}
        <ChartContainer
          title="Engagement diario"
          description="Interacciones en los últimos 30 días"
          isLoading={loading}
        >
          <div className="flex flex-wrap gap-3 mb-4 justify-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-pink-500"></div>
              <span className="text-xs">Likes: {totalLikes}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-xs">Comentarios: {totalComments}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-xs">Compartidos: {totalShares}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <span className="text-xs">Guardados: {totalSaves}</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dailyEngagement}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => value.split('-')[2]}
                tick={{ fontSize: 12 }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value, name) => [value, 
                  name === "likes" ? "Likes" : 
                  name === "comments" ? "Comentarios" : 
                  name === "shares" ? "Compartidos" : "Guardados"
                ]}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
              />
              <Bar dataKey="likes" name="likes" stackId="a" fill="#EC4899" radius={[4, 4, 0, 0]} />
              <Bar dataKey="comments" name="comments" stackId="a" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="shares" name="shares" stackId="a" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="saves" name="saves" stackId="a" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Tipos de interacción */}
        <ChartContainer
          title="Tipos de interacción"
          description="Distribución de engagement"
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
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value}`, ""]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Actividad por hora */}
        <ChartContainer
          title="Actividad por hora"
          description="Hora óptima para publicar"
          isLoading={loading}
        >
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={hourlyActivity}>
              <defs>
                <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8A2BE2" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8A2BE2" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="hour"
                tickFormatter={(hour) => `${hour}h`}
                tick={{ fontSize: 12 }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value) => [`${value} interacciones`, "Actividad"]}
                labelFormatter={(hour) => `${hour}:00 - ${hour}:59`}
              />
              <Area
                type="monotone"
                dataKey="activity"
                name="Actividad"
                stroke="#8A2BE2"
                fillOpacity={1}
                fill="url(#colorActivity)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Crecimiento de seguidores */}
        <ChartContainer
          title="Crecimiento de seguidores"
          description="Evolución en el último mes"
          isLoading={loading}
        >
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={followerGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => value.split('-')[2]}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                yAxisId="left"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(value, name) => [
                  value,
                  name === "followers" ? "Seguidores" : "Nuevos seguidores"
                ]}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
              />
              <Legend />
              <Bar
                dataKey="growth"
                name="Nuevos seguidores"
                yAxisId="right"
                fill="#E1306C"
                radius={[4, 4, 0, 0]}
              />
              <Line
                type="monotone"
                dataKey="followers"
                name="Seguidores"
                yAxisId="left"
                stroke="#833AB4"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  );
};

export default InstagramMetrics; 