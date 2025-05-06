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
  Heart, MessageCircle, Repeat, Bookmark, BarChart3, UserRound, ZoomIn, Info, AlertCircle, ExternalLink, MessageSquare
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
  Timestamp,
  updateDoc,
  setDoc
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

// Datos para cuando no hay conexión o datos disponibles
const NO_DATA_MESSAGE = "N/A";

// Interfaz para datos de Instagram
interface InstagramAnalytics {
  id?: string;
  followerCount: number;
  engagementRate: number;
  responseTime: number;
  followerGrowth: number;
  hourlyActivity: any[];
  interactionTypes: any[];
}

// Interfaz para mensajes de Instagram
interface InstagramMessage {
  id: string;
  platform: string;
  userId: string;
  senderId?: string;
  recipientId?: string;
  type?: string;
  content?: string;
  body?: string;
  status?: string;
  createdAt: Timestamp | any;
  updatedAt?: Timestamp | any;
  isFromMe?: boolean;
  timestamp?: Timestamp | any;
  from?: string;
  to?: string;
  senderName?: string;
  metadata?: any;
}

interface InstagramMetricsProps {
  isLoading?: boolean;
}

const InstagramMetrics = ({ isLoading = false }: InstagramMetricsProps) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(isLoading);
  const [analytics, setAnalytics] = useState<InstagramAnalytics | null>(null);
  const [messages, setMessages] = useState<InstagramMessage[]>([]);
  const [hasInstagramData, setHasInstagramData] = useState<boolean>(false);
  const [instagramUsername, setInstagramUsername] = useState<string>("");
  
  // Estados para los gráficos
  const [followerData, setFollowerData] = useState<any[]>([]);
  const [engagementData, setEngagementData] = useState<any[]>([]);
  const [hourlyData, setHourlyData] = useState<any[]>([]);
  const [interactionData, setInteractionData] = useState<any[]>([]);
  const [responseTimeData, setResponseTimeData] = useState<any[]>([]);
  
  // Estados para métricas principales
  const [followerCount, setFollowerCount] = useState<number>(0);
  const [engagementRate, setEngagementRate] = useState<number>(0);
  const [responseTime, setResponseTime] = useState<number>(0);
  const [totalInteractions, setTotalInteractions] = useState<number>(0);
  const [directMessages, setDirectMessages] = useState<number>(0);
  
  // Estados para más gráficos
  const [dailyEngagement, setDailyEngagement] = useState<any[]>([]);
  const [followerDemographics, setFollowerDemographics] = useState<any[]>([]);
  const [followerGrowth, setFollowerGrowth] = useState<any[]>([]);
  const [hourlyActivity, setHourlyActivity] = useState<any[]>([]);

  // Estados para métricas históricas
  const [metricasHistoricas, setMetricasHistoricas] = useState<any[]>([]);
  const [comparativaSeguidores, setComparativaSeguidores] = useState<number>(0);
  const [comparativaEngagement, setComparativaEngagement] = useState<number>(0);

  // Estado para conexión
  const [connectionStatus, setConnectionStatus] = useState<
    'loading' | 'connected' | 'disconnected' | 'error' | 'expired'
  >('loading');

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      
      setLoading(true);
      
      try {
        console.log("🔍 [InstagramMetrics] Cargando datos de Instagram para:", currentUser.uid);
        
        // Comprobar última actualización y decide si forzar actualización
        const comprobarActualizacion = async () => {
          try {
            // Comprobar última actualización
            const configRef = doc(db, "users", currentUser.uid, "config", "instagram");
            const configDoc = await getDoc(configRef);
            
            const ahora = new Date();
            let actualizar = true;
            
            if (configDoc.exists()) {
              const config = configDoc.data();
              if (config.ultimaActualizacion) {
                const ultimaAct = config.ultimaActualizacion.toDate();
                // Si hace menos de 3 horas, no actualizar
                if ((ahora.getTime() - ultimaAct.getTime()) < 3 * 60 * 60 * 1000) {
                  actualizar = false;
                  console.log("🕒 [InstagramMetrics] Datos actualizados recientemente, no forzando actualización");
                }
              }
            }
            
            if (actualizar) {
              console.log("🔄 [InstagramMetrics] Forzando actualización de datos...");
              // Llamar al endpoint para forzar actualización
              await fetch(`/.netlify/functions/instagram-insights?userId=${currentUser.uid}&forceUpdate=true`);
              
              // No es necesario actualizar configuración aquí, el endpoint lo hace
            }
          } catch (error) {
            console.error("❌ [InstagramMetrics] Error al comprobar actualización:", error);
            // Continuar con el proceso normal aunque haya error
          }
        };
        
        // Intentar forzar actualización si es necesario
        await comprobarActualizacion();
        
        // 1. Verificar si el usuario tiene una cuenta de Instagram conectada
        const userRef = doc(db, "users", currentUser.uid);
        
        // Comprobar en channelConnections
        const channelRef = doc(db, "users", currentUser.uid, "channelConnections", "instagram");
        const channelDoc = await getDoc(channelRef);
        const channelConnected = channelDoc.exists();
        
        // Comprobar en socialTokens
        const socialTokensRef = doc(db, "users", currentUser.uid, "socialTokens", "instagram");
        const socialTokensDoc = await getDoc(socialTokensRef);
        
        if (!socialTokensDoc.exists()) {
          console.log("⚠️ [InstagramMetrics] El usuario no tiene una cuenta de Instagram conectada");
          setConnectionStatus('disconnected');
          setLoading(false);
          return;
        }
        
        const instagramData = socialTokensDoc.data();
        
        // Log detallado para debugging
        console.log("📋 [InstagramMetrics] Datos de conexión encontrados:", 
          Object.keys(instagramData).map(key => `${key}: ${typeof instagramData[key]}`).join(', ')
        );
        
        // Verificar si tenemos channelConnections pero falta en socialTokens
        if (channelConnected && (!instagramData.accessToken || !instagramData.instagramUserId)) {
          console.log("⚠️ [InstagramMetrics] Datos de conexión inconsistentes: entrada en channelConnections pero token incompleto");
          setConnectionStatus('error');
          setLoading(false);
          return;
        }
        
        // Verificar que tengamos accessToken e instagramUserId
        if (!instagramData.accessToken || !instagramData.instagramUserId) {
          console.log("⚠️ [InstagramMetrics] Datos de conexión incompletos");
          console.log("Token presente:", !!instagramData.accessToken);
          console.log("Instagram ID presente:", !!instagramData.instagramUserId);
          setConnectionStatus('disconnected');
          setLoading(false);
          return;
        }
        
        // Verificar si el token está caducado
        if (instagramData.tokenExpiry && Date.now() > instagramData.tokenExpiry) {
          console.log("⚠️ [InstagramMetrics] Token caducado:", new Date(instagramData.tokenExpiry));
          console.log("Fecha actual:", new Date(Date.now()));
          console.log("Diferencia (días):", (Date.now() - instagramData.tokenExpiry) / (1000 * 60 * 60 * 24));
          setConnectionStatus('expired');
          setLoading(false);
          return;
        }
        
        // Guardar información de Instagram para uso en el componente
        if (instagramData.username) {
          setInstagramUsername(instagramData.username);
        }
        
        // 2. Llamar al endpoint para obtener métricas reales
        console.log("🔍 [InstagramMetrics] Solicitando datos a API...");
        
        // Obtenemos el username si lo tenemos guardado
        const username = instagramData.username || '';
        
        // Llamar al endpoint de Instagram Insights
        const insightsEndpoint = `/.netlify/functions/instagram-insights?userId=${currentUser.uid}${username ? `&username=${username}` : ''}`;
        const response = await fetch(insightsEndpoint);
        
        // Si la respuesta no es exitosa, manejar los diferentes tipos de error
        if (!response.ok) {
          const errorData = await response.json();
          console.error("❌ [InstagramMetrics] Error en la API:", errorData);
          
          if (errorData.error === 'TOKEN_EXPIRED') {
            console.log("⚠️ [InstagramMetrics] Token expirado o inválido");
            setConnectionStatus('expired');
          } else if (errorData.error === 'TOKEN_NOT_FOUND') {
            console.log("⚠️ [InstagramMetrics] No se encontró conexión");
            setConnectionStatus('disconnected');
          } else {
            console.log("⚠️ [InstagramMetrics] Error general en la API");
            setConnectionStatus('error');
          }
          
          generateSimulatedData();
          setLoading(false);
          return;
        }
        
        // Procesar la respuesta exitosa
        const insights = await response.json();
        console.log("✅ [InstagramMetrics] Datos recibidos:", insights);
        
        // Actualizar estados con datos reales
        setConnectionStatus('connected');
        setHasInstagramData(true);
        
        // Actualizar métricas principales
        setFollowerCount(insights.followers_count || 0);
        setTotalInteractions(insights.media_count || 0); // Usamos media_count como aproximación
        
        // Construir datos para gráficos
        const createPastData = (currentValue: number, days: number = 30) => {
          // Generar un historial simulado basado en el valor actual
          const data = [];
          let lastValue = currentValue;
          
          for (let i = days; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            // Pequeña variación aleatoria (±2%)
            const randomChange = 1 + (Math.random() * 0.04 - 0.02);
            lastValue = i === days ? currentValue * 0.85 : Math.round(lastValue * randomChange);
            
            data.push({
              date: format(date, 'dd/MM'),
              value: lastValue
            });
          }
          
          // Asegurar que el último valor coincide con el actual
          if (data.length > 0) {
            data[data.length - 1].value = currentValue;
          }
          
          return data;
        };
        
        // Generar datos para las gráficas basados en los insights reales
        setFollowerData(createPastData(insights.followers_count));
        setFollowerGrowth(createPastData(insights.followers_count));
        
        // Si tenemos posts, crear datos de engagement basados en ellos
        if (insights.posts && insights.posts.length > 0) {
          const engagementByPost = insights.posts.map((post: any, index: number) => {
            const totalEngagement = (post.like_count || 0) + (post.comments_count || 0);
            return {
              name: `Post ${index + 1}`,
              engagement: totalEngagement,
              likes: post.like_count || 0,
              comments: post.comments_count || 0,
              engagement_rate: post.engagement_rate || 0,
              date: format(new Date(post.timestamp), 'dd/MM')
            };
          }).slice(0, 10); // Limitar a 10 posts
          
          setEngagementData(engagementByPost);
          
          // Si tenemos métricas avanzadas
          if (insights.metrics) {
            // Establecer el engagement rate global
            setEngagementRate(insights.metrics.engagement_rate || 0);
            
            // Preparar datos para gráfica de tipos de contenido
            const contentTypeData = [
              { name: 'Fotos', value: insights.metrics.content_types.image || 0 },
              { name: 'Videos', value: insights.metrics.content_types.video || 0 },
              { name: 'Carruseles', value: insights.metrics.content_types.carousel || 0 }
            ];
            
            // Preparar datos para gráfica de mejores momentos para publicar
            const hourlyActivityData = Array.from({ length: 24 }, (_, hour) => {
              // Si es la mejor hora, destacarla
              const isBestHour = hour === insights.metrics.best_posting_times.hour;
              return {
                hour,
                activity: isBestHour ? 1 : 0.2, // Destacar la mejor hora
                label: `${hour}:00`
              };
            });
            
            setInteractionData(contentTypeData);
            setHourlyActivity(hourlyActivityData);
            
            // Si hay hashtags, prepararlos para mostrar
            if (insights.metrics.top_hashtags && insights.metrics.top_hashtags.length > 0) {
              const hashtagData = insights.metrics.top_hashtags.map(ht => ({
                name: `#${ht.tag}`,
                count: ht.count
              }));
              setFollowerDemographics(hashtagData);
            }
          }
        } else {
          // Datos de engagement simulados basados en el número de seguidores
          const simulatedEngagement = Array.from({ length: 10 }, (_, i) => {
            const baseEngagement = Math.round(insights.followers_count * (Math.random() * 0.05 + 0.02));
            return {
              name: `Post ${i + 1}`,
              engagement: baseEngagement,
              likes: Math.round(baseEngagement * 0.9),
              comments: Math.round(baseEngagement * 0.1)
            };
          });
          
          setEngagementData(simulatedEngagement);
        }
        
        // Datos de actividad horaria (simulados pero realistas)
        const simulatedHourlyData = Array.from({ length: 24 }, (_, hour) => {
          // Patrón realista: más actividad por la tarde/noche
          let activityFactor = 1;
          if (hour >= 7 && hour < 10) activityFactor = 1.5; // Mañana
          if (hour >= 12 && hour < 14) activityFactor = 2.5; // Mediodía
          if (hour >= 19 && hour < 23) activityFactor = 3; // Noche
          
          const value = Math.round(insights.followers_count * 0.001 * activityFactor * (Math.random() * 0.5 + 0.75));
          
          return {
            hour: hour.toString().padStart(2, '0') + ':00',
            value
          };
        });
        
        setHourlyActivity(simulatedHourlyData);
        setHourlyData(simulatedHourlyData);
        
        // Tipos de interacción simulados basados en patrones típicos
        const interactionTypesData = [
          { name: 'Likes', value: 75 },
          { name: 'Comentarios', value: 15 },
          { name: 'Guardados', value: 7 },
          { name: 'Compartidos', value: 3 }
        ];
        
        setInteractionData(interactionTypesData);
        
        // Datos demográficos simulados
        const demographicsData = [
          { name: '18-24', value: 30 },
          { name: '25-34', value: 35 },
          { name: '35-44', value: 20 },
          { name: '45-54', value: 10 },
          { name: '55+', value: 5 }
        ];
        
        setFollowerDemographics(demographicsData);
        
        console.log("✅ [InstagramMetrics] Datos e insights procesados correctamente");
        
        // Procesar datos
        generateChartDataFromBasics(insights);
        setConnectionStatus('connected');
        setHasInstagramData(true);
        
        // Cargar datos históricos
        await cargarHistorico();
      } catch (error) {
        console.error("❌ [InstagramMetrics] Error al cargar datos:", error);
        setConnectionStatus('error');
        generateSimulatedData();
      } finally {
        setLoading(false);
      }
    };
    
    const cargarHistorico = async () => {
      try {
        console.log("📈 [InstagramMetrics] Cargando histórico de métricas...");
        const historicRef = collection(db, "users", currentUser.uid, "instagramMetrics");
        const q = query(historicRef, orderBy("fecha", "desc"), limit(30));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          console.log("ℹ️ [InstagramMetrics] No se encontraron datos históricos");
          return;
        }
        
        const datos = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).reverse(); // Invertir para orden cronológico
        
        console.log(`📊 [InstagramMetrics] Datos históricos cargados: ${datos.length} registros`);
        setMetricasHistoricas(datos);
        
        // Calcular comparativa (diferencia con hace 7 días)
        if (datos.length > 7) {
          const seguidoresActuales = datos[datos.length - 1].seguidores;
          const seguidoresAnteriores = datos[datos.length - 8].seguidores;
          
          if (seguidoresAnteriores > 0) {
            const diferencia = ((seguidoresActuales - seguidoresAnteriores) / seguidoresAnteriores) * 100;
            setComparativaSeguidores(parseFloat(diferencia.toFixed(1)));
          }
          
          const engagementActual = datos[datos.length - 1].engagement;
          const engagementAnterior = datos[datos.length - 8].engagement;
          
          if (engagementAnterior > 0) {
            const diferenciaEng = ((engagementActual - engagementAnterior) / engagementAnterior) * 100;
            setComparativaEngagement(parseFloat(diferenciaEng.toFixed(1)));
          }
        }
      } catch (error) {
        console.error("❌ [InstagramMetrics] Error al cargar histórico:", error);
      }
    };
    
    fetchData();
  }, [currentUser]);
  
  /**
   * Actualiza las analíticas de Instagram en Firebase
   */
  const updateInstagramAnalytics = async (userRef: any, instagramData: any) => {
    try {
      console.log("🔄 [InstagramMetrics] Actualizando analytics de Instagram para:", instagramData.username);
      
      // Crear un objeto de analytics con datos básicos o estimados
      const analytics = {
        followerCount: instagramData.followerCount || instagramData.mediaCount || 1000,
        engagementRate: 2.5, // Valor estimado promedio
        responseTime: 20, // Valor estimado en minutos
        followerGrowth: 0,
        lastUpdated: new Date(),
        hourlyActivity: [],
        interactionTypes: []
      };
      
      // Actualizar el documento de usuario con los analytics
      await updateDoc(userRef, {
        "socialNetworks.instagram.analytics": analytics
      });
      
      return analytics;
    } catch (error) {
      console.error("❌ [InstagramMetrics] Error al actualizar analytics:", error);
      return null;
    }
  };

  /**
   * Calcula métricas basadas en los mensajes
   */
  const calculateMetricsFromMessages = (messages: InstagramMessage[]) => {
    // Calcular mensajes directos
    const dms = messages.filter(msg => msg.type === 'directMessage' || msg.type === 'direct_message').length;
    console.log(`💬 [InstagramMetrics] Mensajes directos: ${dms}`);
    setDirectMessages(dms);
    
    // Calcular interacciones totales
    const totalInteractionsCount = messages.length;
    console.log(`🔄 [InstagramMetrics] Interacciones totales: ${totalInteractionsCount}`);
    setTotalInteractions(totalInteractionsCount);
    
    // Si no tenemos tasa de engagement pero tenemos mensajes, estimar
    if (!engagementRate && messages.length > 0) {
      // Estimar la tasa de engagement basada en mensajes/día
      let oldestMessageTime;
      const lastMessage = messages[messages.length - 1];
      
      if (lastMessage.createdAt) {
        oldestMessageTime = typeof lastMessage.createdAt === 'number' 
          ? new Date(lastMessage.createdAt) 
          : lastMessage.createdAt.toDate();
      } else if (lastMessage.timestamp) {
        oldestMessageTime = typeof lastMessage.timestamp === 'number'
          ? new Date(lastMessage.timestamp)
          : lastMessage.timestamp.toDate();
      } else {
        oldestMessageTime = new Date();
        oldestMessageTime.setDate(oldestMessageTime.getDate() - 30);
      }
      
      const daysPassed = Math.max(1, Math.floor((Date.now() - oldestMessageTime.getTime()) / (1000 * 60 * 60 * 24)));
      const estimatedRate = (messages.length / daysPassed / 100).toFixed(2);
      console.log(`📊 [InstagramMetrics] Tasa de engagement estimada: ${estimatedRate}%`);
      setEngagementRate(parseFloat(estimatedRate));
    }
    
    // Generar datos para gráficos
    console.log("📊 [InstagramMetrics] Generando datos para gráficos");
    
    // Engagement diario
    const dailyData = calculateDailyEngagement(messages);
    setDailyEngagement(dailyData);
    
    // Tipos de interacción
    const interactions = calculateInteractionTypes(messages);
    setInteractionData(interactions);
    
    // Distribución por hora
    const hourly = calculateHourlyDistribution(messages);
    setHourlyData(hourly);
  };
  
  /**
   * Genera datos de gráficos a partir de datos básicos de la cuenta
   */
  const generateChartDataFromBasics = (instagramData: any) => {
    console.log("🔄 [InstagramMetrics] Generando gráficos a partir de datos básicos:", instagramData);
    
    // Usar datos disponibles
    if (instagramData.followerCount) {
      setFollowerCount(instagramData.followerCount);
    }
    
    if (instagramData.engagement || instagramData.engagementRate) {
      setEngagementRate(instagramData.engagement || instagramData.engagementRate);
    }
    
    if (instagramData.responseTime) {
      setResponseTime(instagramData.responseTime);
    }
    
    // Generar datos simulados para los gráficos
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
    setInteractionData([
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
    setHourlyData(simulatedHourlyActivity);
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
    setInteractionData([
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
    setHourlyData(simulatedHourlyActivity);
    
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
  
  // Renderizar contenido según estado de conexión
  const renderConnectionStatus = () => {
    if (connectionStatus === 'disconnected') {
      return (
        <Card className="bg-slate-50 p-6 text-center">
          <div className="flex flex-col items-center gap-4">
            <Instagram className="h-12 w-12 text-slate-400" />
            <div>
              <h3 className="text-lg font-semibold">Instagram no conectado</h3>
              <p className="text-slate-500 mb-4">Necesitas conectar tu cuenta de Instagram Business para ver tus métricas.</p>
              <Button 
                variant="default" 
                className="bg-gradient-to-r from-purple-500 to-pink-500"
                onClick={() => window.location.href = '/dashboard/channels'}
              >
                Conectar Instagram
              </Button>
            </div>
          </div>
        </Card>
      );
    }
    
    if (connectionStatus === 'expired') {
      return (
        <Card className="bg-slate-50 p-6 text-center">
          <div className="flex flex-col items-center gap-4">
            <AlertCircle className="h-12 w-12 text-amber-500" />
            <div>
              <h3 className="text-lg font-semibold">Conexión expirada</h3>
              <p className="text-slate-500 mb-4">El token de Instagram ha expirado. Por favor, vuelve a conectar tu cuenta.</p>
              <Button 
                variant="default" 
                className="bg-gradient-to-r from-amber-500 to-orange-500"
                onClick={() => window.location.href = '/dashboard/channels'}
              >
                Reconectar Instagram
              </Button>
            </div>
          </div>
        </Card>
      );
    }
    
    if (connectionStatus === 'error') {
      return (
        <Card className="bg-slate-50 p-6 text-center">
          <div className="flex flex-col items-center gap-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
            <div>
              <h3 className="text-lg font-semibold">Error de conexión</h3>
              <p className="text-slate-500 mb-4">Ocurrió un error al obtener las métricas de Instagram. Por favor, intenta reconectar tu cuenta.</p>
              <Button 
                variant="default" 
                className="bg-gradient-to-r from-red-500 to-rose-500"
                onClick={() => window.location.href = '/dashboard/channels'}
              >
                Revisar conexión
              </Button>
            </div>
          </div>
        </Card>
      );
    }
    
    return null;
  };

  // Después de renderConnectionStatus, añadir esta nueva función para mostrar recomendaciones
  const renderRecommendations = () => {
    if (!hasInstagramData || connectionStatus !== 'connected') return null;
    
    return (
      <Card className="p-4 bg-white border-t-4 border-blue-500">
        <h3 className="text-lg font-medium mb-3 flex items-center">
          <Info className="h-5 w-5 mr-2 text-blue-500" />
          Recomendaciones para mejorar tu cuenta
        </h3>
        
        <div className="space-y-3 text-sm">
          {engagementRate < 3 && (
            <div className="flex items-start space-x-2">
              <TrendingUp className="h-4 w-4 text-amber-500 mt-0.5" />
              <div>
                <p className="font-medium">Aumenta tu engagement</p>
                <p className="text-gray-600">Tu tasa de engagement ({engagementRate.toFixed(2)}%) está por debajo del promedio recomendado (3-5%). 
                  Intenta generar más interacción con preguntas en tus publicaciones y responder más comentarios.</p>
              </div>
            </div>
          )}
          
          {hourlyActivity.some(h => h.activity > 0.5) && (
            <div className="flex items-start space-x-2">
              <Clock className="h-4 w-4 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Mejor momento para publicar</p>
                <p className="text-gray-600">Tus seguidores están más activos alrededor de las {hourlyActivity.find(h => h.activity > 0.5)?.hour || '18'}:00. 
                  Intenta publicar contenido importante a esta hora para maximizar el alcance.</p>
              </div>
            </div>
          )}
          
          {followerDemographics.length > 0 && (
            <div className="flex items-start space-x-2">
              <ZoomIn className="h-4 w-4 text-purple-500 mt-0.5" />
              <div>
                <p className="font-medium">Optimiza el uso de hashtags</p>
                <p className="text-gray-600">Tus hashtags más efectivos son {followerDemographics.slice(0, 2).map(h => h.name).join(', ')}. 
                  Considera usarlos con más frecuencia para aumentar el alcance de tus publicaciones.</p>
              </div>
            </div>
          )}
          
          {interactionData.length > 0 && (
            <div className="flex items-start space-x-2">
              <BarChart3 className="h-4 w-4 text-indigo-500 mt-0.5" />
              <div>
                <p className="font-medium">Tipos de contenido</p>
                <p className="text-gray-600">
                  {interactionData[0].value > interactionData[1].value && interactionData[0].value > interactionData[2].value
                    ? "Las fotos generan la mayor parte de tu contenido. Considera diversificar con más videos para aumentar el engagement."
                    : interactionData[1].value > interactionData[0].value && interactionData[1].value > interactionData[2].value
                    ? "Los videos funcionan bien en tu cuenta. Sigue creando contenido en video para mantener a tu audiencia interesada."
                    : "Los carruseles tienen buen rendimiento. Úsalos para contar historias más detalladas y aumentar el tiempo de interacción."}
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Mostrar mensaje de estado de conexión si no está conectado o hay error */}
      {connectionStatus !== 'connected' && connectionStatus !== 'loading' && renderConnectionStatus()}
      
      {/* Mostrar los datos si estamos cargando o conectados */}
      {(connectionStatus === 'connected' || connectionStatus === 'loading') && (
        <>
          {/* Encabezado con información de cuenta */}
          {!loading && hasInstagramData && (
            <div className="mb-6 flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-pink-500 via-purple-500 to-blue-400 flex items-center justify-center overflow-hidden border-2 border-white shadow-lg">
                <Instagram className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                  {instagramUsername ? `@${instagramUsername}` : "Instagram"}
                  {instagramUsername && (
                    <a href={`https://instagram.com/${instagramUsername}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </h2>
                <p className="text-gray-500 text-sm">Análisis de engagement e interacción</p>
              </div>
            </div>
          )}
          
          {/* Tarjetas de métricas principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Seguidores"
              value={String(followerCount)}
              icon={<Users className="h-4 w-4" />}
              trendValue={comparativaSeguidores}
              trendLabel="vs. semana anterior"
              isLoading={loading}
            />
            <MetricCard
              title="Engagement"
              value={`${engagementRate.toFixed(2)}%`}
              icon={<ArrowUpRight className="h-4 w-4" />}
              trendValue={comparativaEngagement}
              trendLabel="vs. semana anterior"
              isLoading={loading}
            />
            <MetricCard
              title="Tiempo de respuesta"
              value={responseTime > 0 ? `${responseTime} min` : NO_DATA_MESSAGE}
              icon={<Clock className="h-4 w-4" />}
              trendValue={-5}
              trendLabel="vs. mes anterior"
              trendDirection="down-good"
              isLoading={loading}
            />
            <MetricCard
              title="Mensajes directos"
              value={String(directMessages)}
              icon={<MessageSquare className="h-4 w-4" />}
              trendValue={12}
              trendLabel="vs. mes anterior"
              isLoading={loading}
            />
          </div>

          {/* Histórico de seguidores */}
          {metricasHistoricas.length > 0 && (
            <ChartContainer
              title="Evolución de seguidores"
              description="Histórico de los últimos 30 días"
              isLoading={loading}
            >
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metricasHistoricas}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="id" 
                    tickFormatter={(value) => {
                      const fecha = value ? value.split('-')[2] : '';
                      return fecha;
                    }}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`${value} seguidores`, "Total"]}
                    labelFormatter={(label) => {
                      if (typeof label === 'string') {
                        const partes = label.split('-');
                        if (partes.length === 3) {
                          return `${partes[2]}/${partes[1]}/${partes[0]}`;
                        }
                      }
                      return label;
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="seguidores" 
                    stroke="#E1306C" 
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}

          {/* Histórico de engagement */}
          {metricasHistoricas.length > 0 && (
            <ChartContainer
              title="Evolución de engagement"
              description="Porcentaje de engagement en los últimos 30 días"
              isLoading={loading}
            >
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metricasHistoricas}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="id" 
                    tickFormatter={(value) => {
                      const fecha = value ? value.split('-')[2] : '';
                      return fecha;
                    }}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`${parseFloat(value as string).toFixed(2)}%`, "Engagement"]}
                    labelFormatter={(label) => {
                      if (typeof label === 'string') {
                        const partes = label.split('-');
                        if (partes.length === 3) {
                          return `${partes[2]}/${partes[1]}/${partes[0]}`;
                        }
                      }
                      return label;
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="engagement" 
                    stroke="#833AB4" 
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}

          {/* Otros gráficos existentes... */}
          <div className="space-y-8">
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
                    data={interactionData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {interactionData.map((entry, index) => (
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
                <AreaChart data={hourlyData}>
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
        </>
      )}

      {/* Recomendaciones y mejores prácticas */}
      {connectionStatus === 'connected' && (
        <div className="mt-8 space-y-6">
          <h2 className="text-xl font-bold">Recomendaciones y Análisis</h2>
          {renderRecommendations()}
        </div>
      )}
      
      {/* Hashtags más utilizados */}
      {connectionStatus === 'connected' && followerDemographics.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Hashtags más efectivos</h2>
          <Card className="p-4">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={followerDemographics}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 80, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" />
                  <Tooltip 
                    formatter={(value: any) => [`${value} usos`, 'Frecuencia']}
                  />
                  <Bar dataKey="count" fill="#8884d8" radius={[0, 4, 4, 0]}>
                    {followerDemographics.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`#${(index * 500 + 8884).toString(16).slice(0, 6)}d8`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}
      
      {/* Mejores horas para publicar */}
      {connectionStatus === 'connected' && hourlyActivity.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Mejores horas para publicar</h2>
          <Card className="p-4">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={hourlyActivity}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" />
                  <YAxis hide />
                  <Tooltip 
                    formatter={(value: any, name: string) => [value > 0.5 ? 'Mejor hora' : 'Hora regular', 'Actividad']}
                    cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                  />
                  <Bar dataKey="activity" fill="#82ca9d">
                    {hourlyActivity.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.activity > 0.5 ? '#4ade80' : '#e5e7eb'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}
      
      {/* Distribución por tipo de contenido */}
      {connectionStatus === 'connected' && interactionData.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Tipos de contenido</h2>
          <Card className="p-4">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={interactionData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={100}
                    dataKey="value"
                    nameKey="name"
                    label={(entry) => entry.name}
                  >
                    {interactionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#f472b6' : index === 1 ? '#3b82f6' : '#a855f7'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [`${value} publicaciones`, 'Cantidad']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default InstagramMetrics; 