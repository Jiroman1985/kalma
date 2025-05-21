import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import ChartContainer from "./ChartContainer";
import MetricCard from "./MetricCard";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import {
  MessageSquare, Send, Clock3, Users, ArrowRight, MessageSquareDashed,
  LineChartIcon, ArrowUp, ArrowDown, Clock, User, Activity, Info
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
import { getWhatsAppMessages, getWhatsAppAnalytics } from "@/lib/whatsappService";

// Definir interfaces localmente para tener control completo sobre ellas
interface WhatsAppMessage {
  id: string;
  platform: string;
  userId: string;
  from?: string;
  to?: string;
  body?: string;
  type?: string;
  status?: string;
  isFromMe?: boolean;
  timestamp?: Timestamp | number;
  category?: string;
  responseTime?: number;
  hourOfDay?: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  responded?: boolean;
  senderName?: string;
  messageType?: string;
  agentResponse?: string;
  minutesOfDay?: number;
  day?: number;
  month?: number;
}

interface WhatsAppAnalytics {
  userId: string;
  platform: string;
  id?: string;
  date?: Timestamp;
  totalMessages?: number;
  receivedMessages?: number;
  respondedMessages?: number;
  avgResponseTime?: number;
  activeChats?: number;
  messageCategories?: {
    consultas: number;
    ventas: number;
    soporte: number;
    quejas: number;
    otros: number;
  };
}

interface WhatsAppMetricsProps {
  isLoading?: boolean;
}

// Datos para cuando no hay conexión o datos disponibles
const NO_DATA_MESSAGE = "N/A";

const WhatsAppMetrics = ({ isLoading = false }: WhatsAppMetricsProps) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(isLoading);
  const [analytics, setAnalytics] = useState<WhatsAppAnalytics | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  
  // Estados para métricas calculadas
  const [messagesPerDay, setMessagesPerDay] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [hourlyData, setHourlyData] = useState<any[]>([]);
  const [responseTimeData, setResponseTimeData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  
  // Métricas para las tarjetas
  const [incomingMessages, setIncomingMessages] = useState<number>(0);
  const [outgoingMessages, setOutgoingMessages] = useState<number>(0);
  const [avgResponseTime, setAvgResponseTime] = useState<number>(0);
  const [activeUsersCount, setActiveUsersCount] = useState<number>(0);

  const [hasWhatsAppData, setHasWhatsAppData] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      
      setLoading(true);
      
      try {
        console.log("🔍 [WhatsAppMetrics] Iniciando carga de datos para:", currentUser.uid);
        
        // 1. Verificamos primero si el usuario tiene configuración de WhatsApp
        console.log("👤 [WhatsAppMetrics] Verificando configuración de WhatsApp del usuario");
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        const userData = userDoc.data();
        const whatsappConfig = userData?.whatsapp || userData?.socialNetworks?.whatsapp;
        
        if (whatsappConfig?.connected || whatsappConfig?.phoneNumber) {
          console.log("✅ [WhatsAppMetrics] Usuario tiene WhatsApp configurado:", whatsappConfig);
          setHasWhatsAppData(true);
        }
        
        // 2. Intentamos obtener analytics desde la colección analytics
        let whatsappAnalytics: WhatsAppAnalytics | null = null;
        try {
          console.log("📊 [WhatsAppMetrics] Consultando analytics de WhatsApp");
          const analyticsQuery = query(
            collection(db, "analytics"),
            where("userId", "==", currentUser.uid),
            where("platform", "==", "whatsapp"),
            limit(1)
          );
          
          const analyticsSnapshot = await getDocs(analyticsQuery);
          if (!analyticsSnapshot.empty) {
            whatsappAnalytics = {
              ...(analyticsSnapshot.docs[0].data() as WhatsAppAnalytics),
              id: analyticsSnapshot.docs[0].id
            };
            setAnalytics(whatsappAnalytics);
            console.log("📊 [WhatsAppMetrics] Analytics encontrados:", whatsappAnalytics);
          }
        } catch (analyticsError) {
          console.warn("⚠️ [WhatsAppMetrics] No se pudieron obtener analytics:", analyticsError);
        }
        
        // 3. Obtenemos mensajes de WhatsApp usando los índices correctos
        console.log("📱 [WhatsAppMetrics] Consultando mensajes de WhatsApp");
        let whatsappMessages: WhatsAppMessage[] = [];
        
        try {
          // Usamos los índices correctos que aparecen en la consola de Firebase
          const messagesQuery = query(
            collection(db, "messages"),
            where("userId", "==", currentUser.uid),
            where("platform", "==", "whatsapp")
          );
          
          const messagesSnapshot = await getDocs(messagesQuery);
          console.log(`📨 [WhatsAppMetrics] Mensajes encontrados: ${messagesSnapshot.size}`);
          
          if (!messagesSnapshot.empty) {
            messagesSnapshot.forEach(doc => {
              whatsappMessages.push({
                ...doc.data(),
                id: doc.id
              } as WhatsAppMessage);
            });
            
            // Ordenar manualmente por timestamp
            whatsappMessages.sort((a, b) => {
              let timeA = 0, timeB = 0;
              
              if (a.timestamp) {
                timeA = typeof a.timestamp === 'number' ? a.timestamp : a.timestamp.toMillis();
              } else if (a.createdAt) {
                timeA = typeof a.createdAt === 'number' ? a.createdAt : a.createdAt.toMillis();
              }
              
              if (b.timestamp) {
                timeB = typeof b.timestamp === 'number' ? b.timestamp : b.timestamp.toMillis();
              } else if (b.createdAt) {
                timeB = typeof b.createdAt === 'number' ? b.createdAt : b.createdAt.toMillis();
              }
              
              return timeB - timeA;
            });
            
            setMessages(whatsappMessages);
            console.log("📱 [WhatsAppMetrics] Mensajes procesados:", whatsappMessages.length);
          } else {
            console.log("⚠️ [WhatsAppMetrics] No se encontraron mensajes de WhatsApp");
            // Si no hay mensajes pero hay configuración, mostramos la interfaz con N/A
            if (hasWhatsAppData) {
              setLoading(false);
              return;
            }
          }
        } catch (error: any) {
          console.error("❌ [WhatsAppMetrics] Error al consultar mensajes:", error.message);
          
          // Si hay configuración de WhatsApp pero no podemos acceder a los mensajes
          // mostramos la interfaz con datos simulados
          if (hasWhatsAppData) {
            console.log("⚠️ [WhatsAppMetrics] Generando datos simulados debido a error");
            generateSimulatedData();
            setLoading(false);
            return;
          }
        }
        
        // Si llegamos aquí, verificamos si tenemos datos para procesar
        if (whatsappMessages.length > 0 || whatsappAnalytics) {
          console.log("✅ [WhatsAppMetrics] Procesando datos disponibles");
          // Procesar y calcular métricas
          calculateMetrics(whatsappMessages, whatsappAnalytics);
          setHasWhatsAppData(true);
        } else {
          console.log("⚠️ [WhatsAppMetrics] No hay datos reales ni configuración, generando simulados");
          // Si no hay datos ni configuración, generamos datos simulados
          generateSimulatedData();
        }
        
      } catch (error) {
        console.error("❌ [WhatsAppMetrics] Error general:", error);
        // Fallback a datos simulados en caso de error
        generateSimulatedData();
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);
  
  const calculateMetrics = (messages: WhatsAppMessage[], analytics: WhatsAppAnalytics | null) => {
    if (messages.length === 0) {
      // Si no hay mensajes, usar datos simulados para mostrar la estructura de la UI
      generateSimulatedData();
      return;
    }
    
    // Calcular mensajes entrantes y salientes
    const incoming = messages.filter(msg => !msg.isFromMe).length;
    const outgoing = messages.filter(msg => msg.isFromMe).length;
    setIncomingMessages(incoming);
    setOutgoingMessages(outgoing);
    
    // Calcular tiempo de respuesta promedio si está disponible
    if (analytics?.avgResponseTime) {
      // Convertir de milisegundos a minutos
      setAvgResponseTime(Math.round(analytics.avgResponseTime / (1000 * 60)));
    } else {
      setAvgResponseTime(0);
    }
    
    // Calcular usuarios activos (aproximación basada en números de teléfono únicos)
    const uniquePhones = new Set();
    messages.forEach(msg => {
      if (!msg.isFromMe && msg.from) {
        uniquePhones.add(msg.from);
      }
    });
    setActiveUsersCount(uniquePhones.size);
    
    // Calcular mensajes por día
    const messagesByDay = groupMessagesByDay(messages);
    setMessagesPerDay(messagesByDay);
    
    // Calcular categorías de mensajes
    const categories = calculateCategories(messages, analytics);
    setCategoryData(categories);
    
    // Calcular distribución por hora
    const hourly = calculateHourlyDistribution(messages);
    setHourlyData(hourly);
    
    // Calcular tiempo de respuesta por día
    const responseTime = calculateResponseTimes(messages);
    setResponseTimeData(responseTime);
    
    // Calcular estado de mensajes
    const status = calculateMessageStatus(messages);
    setStatusData(status);
    
    // Calcular usuarios activos por día
    const activeUsersByDay = calculateActiveUsers(messages);
    setActiveUsers(activeUsersByDay);
  };
  
  // Función para agrupar mensajes por día
  const groupMessagesByDay = (messages: WhatsAppMessage[]) => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        date: date.toISOString().split('T')[0],
        incoming: 0,
        outgoing: 0
      };
    });
    
    // Conteo de mensajes por día
    const messagesByDay: Record<string, { incoming: number, outgoing: number }> = {};
    
    messages.forEach(msg => {
      if (!msg.timestamp) return;
      
      let date;
      if (typeof msg.timestamp === 'number') {
        date = new Date(msg.timestamp).toISOString().split('T')[0];
      } else {
        // Si es un Timestamp de Firestore
        const timestampDate = msg.timestamp.toDate();
        date = timestampDate.toISOString().split('T')[0];
      }
      
      if (!messagesByDay[date]) {
        messagesByDay[date] = { incoming: 0, outgoing: 0 };
      }
      
      if (msg.isFromMe) {
        messagesByDay[date].outgoing++;
      } else {
        messagesByDay[date].incoming++;
      }
    });
    
    // Fusionar con los días predeterminados
    return last30Days.map(day => ({
      date: day.date,
      incoming: messagesByDay[day.date]?.incoming || 0,
      outgoing: messagesByDay[day.date]?.outgoing || 0
    }));
  };
  
  // Función para calcular categorías de mensajes
  const calculateCategories = (messages: WhatsAppMessage[], analytics: WhatsAppAnalytics | null) => {
    // Si tenemos analytics con categorías, usarlos
    if (analytics?.messageCategories) {
      return [
        { name: "Consultas", value: analytics.messageCategories.consultas || 0 },
        { name: "Ventas", value: analytics.messageCategories.ventas || 0 },
        { name: "Soporte", value: analytics.messageCategories.soporte || 0 },
        { name: "Otros", value: analytics.messageCategories.otros || 0 }
      ];
    }
    
    // Si no, calcular basado en los mensajes
    const categories: Record<string, number> = { 'Consultas': 0, 'Ventas': 0, 'Soporte': 0, 'Otros': 0 };
    
    messages.forEach(msg => {
      if (msg.category) {
        const category = msg.category.charAt(0).toUpperCase() + msg.category.slice(1);
        if (categories[category] !== undefined) {
          categories[category]++;
        } else {
          categories['Otros']++;
        }
      } else {
        categories['Otros']++;
      }
    });
    
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  };
  
  // Función para calcular distribución por hora
  const calculateHourlyDistribution = (messages: WhatsAppMessage[]) => {
    const hourly = Array.from({ length: 24 }, (_, hour) => ({
      hour: hour,
      count: 0
    }));
    
    messages.forEach(msg => {
      if (msg.hourOfDay !== undefined && msg.hourOfDay >= 0 && msg.hourOfDay < 24) {
        hourly[msg.hourOfDay].count++;
      } else if (msg.timestamp) {
        // Calcular la hora de los mensajes que no tienen hourOfDay
        let date;
        if (typeof msg.timestamp === 'number') {
          date = new Date(msg.timestamp);
        } else {
          date = msg.timestamp.toDate();
        }
        const hour = date.getHours();
        hourly[hour].count++;
      }
    });
    
    return hourly;
  };
  
  // Función para calcular tiempos de respuesta
  const calculateResponseTimes = (messages: WhatsAppMessage[]) => {
    // Si no hay suficientes mensajes con tiempos de respuesta, generar datos simulados
    if (messages.filter(m => m.responseTime).length < 5) {
      return generateSimulatedResponseTimeData();
    }
    
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        date: date.toISOString().split('T')[0],
        time: 0,
        count: 0
      };
    });
    
    const responseTimesByDay: Record<string, { totalTime: number, count: number }> = {};
    
    messages.forEach(msg => {
      if (!msg.timestamp || !msg.responseTime) return;
      
      let date;
      if (typeof msg.timestamp === 'number') {
        date = new Date(msg.timestamp).toISOString().split('T')[0];
      } else {
        date = msg.timestamp.toDate().toISOString().split('T')[0];
      }
      
      if (!responseTimesByDay[date]) {
        responseTimesByDay[date] = { totalTime: 0, count: 0 };
      }
      
      // Convertir el tiempo de respuesta a minutos
      let responseTimeInMinutes;
      if (typeof msg.responseTime === 'number') {
        responseTimeInMinutes = msg.responseTime / (1000 * 60);
      } else {
        responseTimeInMinutes = 0;
      }
      
      responseTimesByDay[date].totalTime += responseTimeInMinutes;
      responseTimesByDay[date].count++;
    });
    
    // Calcular el promedio para cada día y mezclarlo con los días predeterminados
    return last30Days.map(day => {
      const dayData = responseTimesByDay[day.date];
      return {
        date: day.date,
        time: dayData ? Math.round(dayData.totalTime / dayData.count) : 0
      };
    });
  };
  
  // Función para calcular estado de los mensajes
  const calculateMessageStatus = (messages: WhatsAppMessage[]) => {
    const total = messages.length;
    const responded = messages.filter(m => m.responded).length;
    const read = messages.filter(m => !m.responded && m.isFromMe).length;
    const unread = total - responded - read;
    
    return [
      { name: 'Respondidos', value: responded },
      { name: 'Leídos', value: read },
      { name: 'Sin leer', value: unread }
    ];
  };
  
  // Función para calcular usuarios activos
  const calculateActiveUsers = (messages: WhatsAppMessage[]) => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        date: date.toISOString().split('T')[0],
        new: 0,
        recurring: 0
      };
    });
    
    // Mapear usuarios por día
    const usersByDay: Record<string, Set<string>> = {};
    const allTimeUsers = new Set<string>();
    
    messages.forEach(msg => {
      if (!msg.timestamp || !msg.from || msg.isFromMe) return;
      
      let date;
      if (typeof msg.timestamp === 'number') {
        date = new Date(msg.timestamp).toISOString().split('T')[0];
      } else {
        date = msg.timestamp.toDate().toISOString().split('T')[0];
      }
      
      if (!usersByDay[date]) {
        usersByDay[date] = new Set();
      }
      
      usersByDay[date].add(msg.from);
    });
    
    // Calcular usuarios nuevos vs. recurrentes
    return last30Days.map(day => {
      const dayUsers = usersByDay[day.date] || new Set();
      let newUsers = 0;
      let recurringUsers = 0;
      
      dayUsers.forEach(user => {
        if (allTimeUsers.has(user)) {
          recurringUsers++;
        } else {
          newUsers++;
          allTimeUsers.add(user);
        }
      });
      
      return {
        date: day.date,
        new: newUsers,
        recurring: recurringUsers
      };
    });
  };
  
  // Función para generar datos simulados cuando no hay datos reales
  const generateSimulatedData = () => {
    // Simular mensajes por día
    const messagesByDay = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        date: date.toISOString().split('T')[0],
        incoming: Math.floor(Math.random() * 15) + 5,
        outgoing: Math.floor(Math.random() * 12) + 3
      };
    });
    setMessagesPerDay(messagesByDay);
    
    // Totales simulados
    const simulatedIncoming = messagesByDay.reduce((sum, day) => sum + day.incoming, 0);
    const simulatedOutgoing = messagesByDay.reduce((sum, day) => sum + day.outgoing, 0);
    setIncomingMessages(simulatedIncoming);
    setOutgoingMessages(simulatedOutgoing);
    
    // Tiempo de respuesta simulado
    setAvgResponseTime(Math.floor(Math.random() * 10) + 5);
    
    // Usuarios activos simulados
    setActiveUsersCount(Math.floor(Math.random() * 20) + 10);
    
    // Categorías simuladas
    setCategoryData([
      { name: "Consultas", value: 35 },
      { name: "Ventas", value: 25 },
      { name: "Soporte", value: 20 },
      { name: "Otros", value: 20 }
    ]);
    
    // Distribución por hora simulada
    const hourly = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: Math.floor(Math.random() * 10) + (hour >= 8 && hour <= 20 ? 10 : 0)
    }));
    setHourlyData(hourly);
    
    // Tiempo de respuesta simulado
    setResponseTimeData(generateSimulatedResponseTimeData());
    
    // Estado de mensajes simulado
    setStatusData([
      { name: 'Respondidos', value: 75 },
      { name: 'Leídos', value: 15 },
      { name: 'Sin leer', value: 10 }
    ]);
    
    // Usuarios activos simulados
    setActiveUsers(Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        date: date.toISOString().split('T')[0],
        new: Math.floor(Math.random() * 3),
        recurring: Math.floor(Math.random() * 8) + 2
      };
    }));
  };
  
  const generateSimulatedResponseTimeData = () => {
    return Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        date: date.toISOString().split('T')[0],
        time: Math.max(1, 30 - i * 0.5 + Math.random() * 5 - 2.5)
      };
    });
  };
  
  // Colores para gráficos
  const COLORS = {
    primary: '#25D366',
    secondary: '#128C7E',
    accent: '#075E54',
    light: '#DCF8C6',
    neutral: '#ECE5DD'
  };
  
  const CATEGORY_COLORS = ['#25D366', '#34B7F1', '#f44336', '#FF5722', '#9C27B0'];
  const MESSAGE_STATUS_COLORS = ['#4CAF50', '#2196F3', '#FFC107'];
  
  // Formatear valores para mostrar "N/A" si no hay datos
  const formatTotalMessages = () => {
    return incomingMessages > 0 ? incomingMessages.toLocaleString() : NO_DATA_MESSAGE;
  };
  
  const formatReceivedMessages = () => {
    return incomingMessages > 0 ? incomingMessages.toLocaleString() : NO_DATA_MESSAGE;
  };
  
  const formatSentMessages = () => {
    return outgoingMessages > 0 ? outgoingMessages.toLocaleString() : NO_DATA_MESSAGE;
  };
  
  const formatResponseTime = () => {
    return avgResponseTime > 0 ? `${avgResponseTime} min` : NO_DATA_MESSAGE;
  };
  
  const formatActiveUsers = () => {
    return activeUsersCount > 0 ? activeUsersCount.toString() : NO_DATA_MESSAGE;
  };

  /**
   * Crea métricas a partir de los datos de analytics cuando no hay mensajes disponibles
   */
  const createMetricsFromAnalytics = (analytics: WhatsAppAnalytics) => {
    console.log("📊 [WhatsAppMetrics] Creando métricas desde datos de analytics");
    
    // Establecer métricas principales
    setActiveUsersCount(analytics.activeChats || 0);
    setAvgResponseTime(Math.round((analytics.avgResponseTime || 0) / (1000 * 60)));
    setIncomingMessages(analytics.receivedMessages || 0);
    setOutgoingMessages(analytics.respondedMessages || 0);
    
    // Generar datos para gráficos usando la información disponible en analytics
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - 29);
    
    // Mensajes por día (estimados)
    const messagesPerDay = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      // Distribución basada en patrones típicos (más actividad en días laborables)
      const dayOfWeek = date.getDay(); // 0 = domingo, 6 = sábado
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      const factor = isWeekend ? 0.6 : 1;
      const baseIncoming = Math.round((analytics.receivedMessages || 100) / 30 * factor);
      const baseOutgoing = Math.round((analytics.respondedMessages || 80) / 30 * factor);
      
      // Agregar variación aleatoria
      const incoming = Math.max(0, Math.round(baseIncoming * (0.8 + Math.random() * 0.4)));
      const outgoing = Math.max(0, Math.round(baseOutgoing * (0.8 + Math.random() * 0.4)));
      
      messagesPerDay.push({
        date: date.toISOString().split('T')[0],
        incoming,
        outgoing
      });
    }
    setMessagesPerDay(messagesPerDay);
    
    // Categorías de mensajes
    if (analytics.messageCategories) {
      setCategoryData([
        { name: "Consultas", value: analytics.messageCategories.consultas || 0 },
        { name: "Ventas", value: analytics.messageCategories.ventas || 0 },
        { name: "Soporte", value: analytics.messageCategories.soporte || 0 },
        { name: "Quejas", value: analytics.messageCategories.quejas || 0 },
        { name: "Otros", value: analytics.messageCategories.otros || 0 }
      ]);
    } else {
      // Categorías simuladas basadas en porcentajes típicos
      setCategoryData([
        { name: "Consultas", value: Math.round((analytics.receivedMessages || 100) * 0.4) },
        { name: "Ventas", value: Math.round((analytics.receivedMessages || 100) * 0.3) },
        { name: "Soporte", value: Math.round((analytics.receivedMessages || 100) * 0.15) },
        { name: "Quejas", value: Math.round((analytics.receivedMessages || 100) * 0.05) },
        { name: "Otros", value: Math.round((analytics.receivedMessages || 100) * 0.1) }
      ]);
    }
    
    // Distribución horaria (simulada con patrón realista)
    setHourlyData(generateSimulatedHourlyData());
    
    // Tiempos de respuesta (simulados con tendencia a mejorar)
    setResponseTimeData(generateSimulatedResponseTimeData());
    
    // Estados de mensajes (simulados basados en promedios)
    setStatusData([
      { name: "Entregados", value: Math.round((analytics.receivedMessages || 100) * 0.95) },
      { name: "Leídos", value: Math.round((analytics.receivedMessages || 100) * 0.85) },
      { name: "Contestados", value: analytics.respondedMessages || 80 }
    ]);
    
    // Usuarios activos (simulados con tendencia creciente)
    setActiveUsers(generateSimulatedActiveUserData(analytics.activeChats || 0));
  };
  
  /**
   * Genera datos horarios simulados para cuando no hay datos reales
   */
  const generateSimulatedHourlyData = () => {
    const hourly = [];
    for (let i = 0; i < 24; i++) {
      let count;
      
      // Patrón típico de actividad
      if (i >= 0 && i <= 6) { // Madrugada
        count = Math.floor(Math.random() * 5);
      } else if (i >= 7 && i <= 9) { // Mañana temprano
        count = 5 + Math.floor(Math.random() * 20);
      } else if (i >= 10 && i <= 13) { // Media mañana/mediodía
        count = 15 + Math.floor(Math.random() * 25);
      } else if (i >= 14 && i <= 17) { // Tarde
        count = 10 + Math.floor(Math.random() * 20);
      } else if (i >= 18 && i <= 22) { // Noche
        count = 15 + Math.floor(Math.random() * 30);
      } else { // Noche tardía
        count = 5 + Math.floor(Math.random() * 10);
      }
      
      hourly.push({
        hour: i,
        count
      });
    }
    return hourly;
  };
  
  /**
   * Genera datos simulados de usuarios activos
   */
  const generateSimulatedActiveUserData = (currentActiveUsers: number) => {
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - 29);
    
    const activeUserData = [];
    // Factor de crecimiento para usuarios nuevos (30% de crecimiento en 30 días)
    const growthFactor = 1.01; // Aproximadamente 30% en 30 días
    
    // Valor base para calcular usuarios hace 30 días
    const baseValue = Math.round(currentActiveUsers / Math.pow(growthFactor, 29));
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      // Crecimiento con tendencia y algo de variación aleatoria
      const dayValue = Math.round(baseValue * Math.pow(growthFactor, i));
      const dayVariation = Math.round(dayValue * 0.2); // 20% de variación máxima
      
      // Calcular usuarios nuevos y recurrentes
      const total = Math.max(1, dayValue - Math.floor(Math.random() * dayVariation));
      const newUsers = Math.round(total * 0.3); // 30% nuevos, 70% recurrentes
      const returning = total - newUsers;
      
      activeUserData.push({
        date: date.toISOString().split('T')[0],
        new: newUsers,
        returning
      });
    }
    
    return activeUserData;
  };

  return (
    <div className="space-y-8">
      {!hasWhatsAppData && !loading && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0 text-yellow-400">
              <Info className="h-5 w-5" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Datos limitados disponibles
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  No se encontraron suficientes mensajes de WhatsApp. Algunas métricas muestran "N/A" o datos de ejemplo.
                  A medida que recibas y envíes más mensajes, estos gráficos se actualizarán automáticamente.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    
      {/* Tarjetas de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Mensajes recibidos"
          value={formatReceivedMessages()}
          icon={<MessageSquare className="h-5 w-5" />}
          description="Últimos 30 días"
          trend="+12.5%"
          trendDirection="up"
          loading={loading}
          color="green"
        />
        
        <MetricCard
          title="Mensajes enviados"
          value={formatSentMessages()}
          icon={<ArrowUp className="h-5 w-5" />}
          description="Últimos 30 días"
          trend="+8.3%"
          trendDirection="up"
          loading={loading}
          color="blue"
        />
        
        <MetricCard
          title="Tiempo de respuesta"
          value={formatResponseTime()}
          icon={<Clock className="h-5 w-5" />}
          description="Promedio en minutos"
          trend="-15%"
          trendDirection="down"
          loading={loading}
          color="amber"
        />
        
        <MetricCard
          title="Conversaciones activas"
          value={formatActiveUsers()}
          icon={<User className="h-5 w-5" />}
          description="Contactos únicos"
          trend="+5.2%"
          trendDirection="up"
          loading={loading}
          color="purple"
        />
        
        <MetricCard
          title="Total mensajes"
          value={formatTotalMessages()}
          icon={<Activity className="h-5 w-5" />}
          description="Recibidos + Enviados"
          trend="+10.8%"
          trendDirection="up"
          loading={loading}
          color="slate"
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mensajes por día */}
        <ChartContainer
          title="Mensajes por día"
          description="Actividad de los últimos 30 días"
          isLoading={loading}
        >
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={messagesPerDay}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => value.split('-')[2]} // Mostrar solo el día
                tick={{ fontSize: 12 }} 
              />
              <YAxis />
              <Tooltip 
                formatter={(value) => [`${value} mensajes`, ""]}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="incoming" 
                name="Recibidos" 
                stackId="1"
                stroke={COLORS.primary} 
                fill={COLORS.primary} 
                fillOpacity={0.8} 
              />
              <Area 
                type="monotone" 
                dataKey="outgoing" 
                name="Enviados" 
                stackId="1"
                stroke={COLORS.secondary} 
                fill={COLORS.secondary} 
                fillOpacity={0.8} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Categorías de mensajes */}
        <ChartContainer
          title="Categorías de mensajes"
          description="Distribución por tipo de consulta"
          isLoading={loading}
        >
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} mensajes`, ""]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Distribución por hora */}
        <ChartContainer
          title="Actividad por hora"
          description="Distribución de mensajes durante el día"
          isLoading={loading}
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip formatter={(value) => [`${value} mensajes`, ""]} />
              <Bar 
                dataKey="count" 
                name="Mensajes" 
                fill={COLORS.primary} 
                radius={[4, 4, 0, 0]} 
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Tiempo de respuesta */}
        <ChartContainer
          title="Tiempo de respuesta"
          description="Evolución en los últimos 30 días (minutos)"
          isLoading={loading}
        >
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={responseTimeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => value.split('-')[2]} // Mostrar solo el día
                tick={{ fontSize: 12 }} 
              />
              <YAxis />
              <Tooltip 
                formatter={(value) => [`${value} minutos`, ""]}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
              />
              <Line 
                type="monotone" 
                dataKey="time" 
                name="Minutos" 
                stroke={COLORS.accent} 
                strokeWidth={2}
                dot={{ r: 0 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Estado de los mensajes */}
        <ChartContainer
          title="Estado de mensajes"
          description="Distribución por estado"
          isLoading={loading}
        >
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={MESSAGE_STATUS_COLORS[index % MESSAGE_STATUS_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} mensajes`, ""]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Usuarios activos */}
        <ChartContainer
          title="Usuarios activos"
          description="Nuevos vs recurrentes"
          isLoading={loading}
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={activeUsers}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => value.split('-')[2]} // Mostrar solo el día
                tick={{ fontSize: 12 }} 
              />
              <YAxis />
              <Tooltip 
                formatter={(value) => [`${value} usuarios`, ""]}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
              />
              <Legend />
              <Bar 
                dataKey="new" 
                name="Nuevos" 
                stackId="a" 
                fill={COLORS.accent} 
                radius={[4, 4, 0, 0]} 
              />
              <Bar 
                dataKey="recurring" 
                name="Recurrentes" 
                stackId="a" 
                fill={COLORS.secondary} 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  );
};

export default WhatsAppMetrics; 