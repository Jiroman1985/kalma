import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import ChartContainer from "./ChartContainer";
import MetricCard from "./MetricCard";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import {
  MessageSquare, Send, Clock3, Users, ArrowRight, MessageSquareDashed,
  LineChart as LineChartIcon
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
import { getWhatsAppMessages, getWhatsAppAnalytics, WhatsAppMessage, WhatsAppAnalytics } from "@/lib/whatsappService";

interface WhatsAppMetricsProps {
  isLoading?: boolean;
}

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

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      
      setLoading(true);
      try {
        // Obtener analytics de WhatsApp
        const whatsappAnalytics = await getWhatsAppAnalytics(currentUser.uid);
        setAnalytics(whatsappAnalytics);
        
        // Obtener mensajes de WhatsApp (últimos 100)
        const whatsappMessages = await getWhatsAppMessages(currentUser.uid, 100);
        setMessages(whatsappMessages);
        
        // Calcular métricas basadas en los datos
        calculateMetrics(whatsappMessages, whatsappAnalytics);
      } catch (error) {
        console.error("Error al cargar datos de WhatsApp:", error);
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
  const COLORS = [
    "#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"
  ];
  
  return (
    <div className="space-y-8">
      {/* Tarjetas de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Mensajes recibidos"
          value={incomingMessages}
          icon={<MessageSquare className="h-5 w-5" />}
          description="Total de mensajes entrantes"
          trend="+12%"
          trendDirection="up"
          loading={loading}
          color="green"
        />
        
        <MetricCard
          title="Mensajes enviados"
          value={outgoingMessages}
          icon={<Send className="h-5 w-5" />}
          description="Total de mensajes salientes"
          trend="+8%"
          trendDirection="up"
          loading={loading}
          color="blue"
        />
        
        <MetricCard
          title="Tiempo de respuesta"
          value={`${avgResponseTime} min`}
          icon={<Clock3 className="h-5 w-5" />}
          description="Tiempo promedio de respuesta"
          trend="-15%"
          trendDirection="down"
          loading={loading}
          color="amber"
        />
        
        <MetricCard
          title="Usuarios activos"
          value={activeUsersCount}
          icon={<Users className="h-5 w-5" />}
          description="Contactos que enviaron mensajes"
          trend="+5%"
          trendDirection="up"
          loading={loading}
          color="purple"
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mensajes por día */}
        <ChartContainer
          title="Mensajes por día"
          description="Entrantes vs salientes en los últimos 30 días"
          isLoading={loading}
        >
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={messagesPerDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => value.split('-')[2]}
                tick={{ fontSize: 12 }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value, name) => [value, name === "incoming" ? "Entrantes" : "Salientes"]}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
              />
              <Legend formatter={(value) => value === "incoming" ? "Entrantes" : "Salientes"} />
              <Area
                type="monotone"
                dataKey="incoming"
                name="incoming"
                stackId="1"
                stroke="#4ade80"
                fill="#4ade80"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="outgoing"
                name="outgoing"
                stackId="1"
                stroke="#60a5fa"
                fill="#60a5fa"
                fillOpacity={0.6}
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
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
              <XAxis
                dataKey="hour"
                tickFormatter={(hour) => `${hour}h`}
                tick={{ fontSize: 12 }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value) => [`${value} mensajes`, "Mensajes"]}
                labelFormatter={(hour) => `${hour}:00 - ${hour}:59`}
              />
              <Bar
                dataKey="count"
                name="Mensajes"
                fill="#8884d8"
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
                tickFormatter={(value) => value.split('-')[2]}
                tick={{ fontSize: 12 }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value) => [`${value} min`, "Tiempo de respuesta"]}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
              />
              <Line
                type="monotone"
                dataKey="time"
                name="Tiempo"
                stroke="#ff9800"
                strokeWidth={2}
                dot={{ r: 2 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  );
};

export default WhatsAppMetrics; 