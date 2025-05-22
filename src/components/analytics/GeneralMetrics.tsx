import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import { MessageCircle, Users, BrainCircuit, Clock, TrendingUp, HeartHandshake, Megaphone } from 'lucide-react';
import MetricCard from './MetricCard';
import ChartContainer from './ChartContainer';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit, Timestamp } from 'firebase/firestore';

// Define NormalizedMessage interface
interface NormalizedMessage {
  id: string;
  body: string;
  timestamp: Date;
  platform: string;
  userId: string;
  senderName: string;
  responseTime?: number;
  isAiGenerated?: boolean;
  sentiment?: string;
  createdAt?: string | Timestamp | Date;
  externalId?: string;
  senderId?: string;
  content?: string;
  isFromMe?: boolean;
  status?: string;
  autoReplySent?: boolean;
  autoReply?: string;
  hourOfDay?: number;
  category?: string;
}

// Colores por canal
const CHANNEL_COLORS = {
  instagram: '#E1306C',
  whatsapp: '#25D366',
  messenger: '#0084FF',
  telegram: '#0088cc',
  email: '#4285F4',
  website: '#6366F1'
};

// Datos de ejemplo para las métricas generales
const generateOverallData = () => {
  // Mensajes por canal
  const messagesByChannel = [
    { name: 'WhatsApp', value: 1250, color: CHANNEL_COLORS.whatsapp },
    { name: 'Instagram', value: 840, color: CHANNEL_COLORS.instagram },
    { name: 'Messenger', value: 520, color: CHANNEL_COLORS.messenger },
    { name: 'Web Chat', value: 320, color: CHANNEL_COLORS.website },
    { name: 'Email', value: 280, color: CHANNEL_COLORS.email },
    { name: 'Telegram', value: 150, color: CHANNEL_COLORS.telegram },
  ];

  // Actividad diaria
  const dailyActivity = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - 29 + i);
    return {
      date: date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
      WhatsApp: Math.floor(Math.random() * 90) + 30,
      Instagram: Math.floor(Math.random() * 70) + 20,
      Messenger: Math.floor(Math.random() * 40) + 15, 
      Telegram: Math.floor(Math.random() * 20) + 5,
      Email: Math.floor(Math.random() * 25) + 5,
      Web: Math.floor(Math.random() * 30) + 10,
    };
  });

  // Tiempos de respuesta por canal
  const responseTimeByChannel = [
    { name: 'WhatsApp', tiempo: 12.5 },
    { name: 'Instagram', tiempo: 45.2 },
    { name: 'Messenger', tiempo: 18.7 },
    { name: 'Web Chat', tiempo: 5.3 },
    { name: 'Email', tiempo: 120.5 },
    { name: 'Telegram', tiempo: 22.8 },
  ];

  // Sentimiento mensajes
  const sentimentAnalysis = [
    { name: 'Positivo', value: 65, color: '#4ade80' },
    { name: 'Neutral', value: 25, color: '#94a3b8' },
    { name: 'Negativo', value: 10, color: '#f87171' },
  ];

  // Efectividad respuestas automáticas
  const aiEffectiveness = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - 11 + i);
    return {
      mes: date.toLocaleDateString('es-ES', { month: 'short' }),
      efectividad: Math.min(95, Math.floor(50 + i * 3.5 + Math.random() * 5)), // Mejora progresiva
      resolucion: Math.min(90, Math.floor(40 + i * 4 + Math.random() * 5)),
    };
  });

  return {
    messagesByChannel,
    dailyActivity,
    responseTimeByChannel,
    sentimentAnalysis,
    aiEffectiveness,
  };
};

// Función para calcular mensajes por canal
const calculateMessagesByChannel = (messages: NormalizedMessage[], channels: string[]) => {
  // Crear un objeto para agrupar los mensajes por canal
  const channelCounts: Record<string, number> = {};
  
  // Inicializar contadores para todos los canales conocidos
  const uniqueChannels = Array.from(new Set(channels));
  uniqueChannels.forEach(channel => {
    channelCounts[channel] = 0;
  });
  
  // Contar mensajes por canal
  messages.forEach(msg => {
    const platform = msg.platform.toLowerCase();
    if (channelCounts[platform] !== undefined) {
      channelCounts[platform]++;
    }
  });
  
  // Convertir a formato para gráficos
  return Object.keys(channelCounts).map(channel => ({
    name: channel.charAt(0).toUpperCase() + channel.slice(1), // Capitalizar nombre
    value: channelCounts[channel],
    color: CHANNEL_COLORS[channel] || '#888888' // Color predeterminado si no está en la lista
  }));
};

// Función para calcular actividad diaria
const calculateDailyActivity = (messages: NormalizedMessage[], channels: string[]) => {
  // Crear una estructura para almacenar los datos de los últimos 30 días
  const last30Days: Record<string, any> = {};
  const uniqueChannels = Array.from(new Set(channels.map(c => c.toLowerCase())));
  
  // Inicializar la estructura con fechas
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    const dateStr = date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
    
    last30Days[dateStr] = {
      date: dateStr
    };
    
    // Inicializar contadores para cada canal
    uniqueChannels.forEach(channel => {
      // Formatear el nombre del canal con la primera letra en mayúscula
      const formattedChannel = channel.charAt(0).toUpperCase() + channel.slice(1);
      last30Days[dateStr][formattedChannel] = 0;
    });
  }
  
  // Agrupar mensajes por fecha y canal
  messages.forEach(msg => {
    // Convertir createdAt a fecha
    let msgDate: Date;
    if (typeof msg.createdAt === 'string') {
      msgDate = new Date(msg.createdAt);
    } else if (msg.createdAt instanceof Timestamp) {
      msgDate = msg.createdAt.toDate();
    } else {
      // Si no hay fecha, omitir este mensaje
      return;
    }
    
    // Verificar si está dentro de los últimos 30 días
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    
    if (msgDate >= thirtyDaysAgo && msgDate <= now) {
      const dateStr = msgDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
      const platform = msg.platform.toLowerCase();
      
      // Formatear el nombre del canal con la primera letra en mayúscula
      const formattedPlatform = platform.charAt(0).toUpperCase() + platform.slice(1);
      
      // Incrementar el contador si existe la fecha y el canal
      if (last30Days[dateStr] && last30Days[dateStr][formattedPlatform] !== undefined) {
        last30Days[dateStr][formattedPlatform]++;
      }
    }
  });
  
  // Convertir el objeto a un array para el gráfico
  return Object.values(last30Days);
};

// Función para generar datos simulados cuando no hay datos reales
const generateSimulatedData = () => {
  // Definir los canales comunes
  const commonChannels = ['whatsapp', 'instagram', 'messenger', 'telegram', 'email', 'website'];
  
  // 1. Mensajes por canal
  const channelData = commonChannels.map(channel => {
    const capitalizedName = channel.charAt(0).toUpperCase() + channel.slice(1);
    return {
      name: capitalizedName,
      value: Math.floor(Math.random() * 1000) + 100,
      color: CHANNEL_COLORS[channel] || '#888888'
    };
  });
  setMessagesByChannel(channelData);
  
  // 2. Actividad diaria
  const dailyData = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - 29 + i);
    const result: Record<string, any> = {
      date: date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })
    };
    
    // Agregar datos para cada canal
    commonChannels.forEach(channel => {
      const capitalizedName = channel.charAt(0).toUpperCase() + channel.slice(1);
      result[capitalizedName] = Math.floor(Math.random() * 50) + (
        channel === 'whatsapp' ? 30 : 
        channel === 'instagram' ? 20 : 
        channel === 'messenger' ? 15 : 5
      );
    });
    
    return result;
  });
  setDailyActivity(dailyData);
  
  // 3. Tiempos de respuesta
  const responseData = commonChannels.map(channel => {
    const capitalizedName = channel.charAt(0).toUpperCase() + channel.slice(1);
    return {
      name: capitalizedName,
      tiempo: Math.floor(Math.random() * 60) + (
        channel === 'email' ? 60 : 
        channel === 'instagram' ? 40 : 
        channel === 'whatsapp' ? 10 : 20
      )
    };
  });
  setResponseTimes(responseData);
  
  // 4. Sentimiento
  const sentimentData = [
    { name: 'Positivo', value: 65, color: '#4ade80' },
    { name: 'Neutral', value: 25, color: '#94a3b8' },
    { name: 'Negativo', value: 10, color: '#f87171' }
  ];
  setSentimentData(sentimentData);
  
  // 5. IA Efectividad
  const aiData = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - 11 + i);
    return {
      mes: date.toLocaleDateString('es-ES', { month: 'short' }),
      efectividad: Math.min(95, Math.floor(50 + i * 3.5 + Math.random() * 5)),
      resolucion: Math.min(90, Math.floor(40 + i * 4 + Math.random() * 5))
    };
  });
  setAiEffectiveness(aiData);
  
  // 6. Métricas para tarjetas
  setTotalMessages(channelData.reduce((sum, item) => sum + item.value, 0));
  setUniqueUsers(Math.floor(Math.random() * 2000) + 1000);
  setAvgResponseTime(responseData.reduce((sum, item) => sum + item.tiempo, 0) / responseData.length);
  setSatisfactionRate(sentimentData.find(item => item.name === 'Positivo')?.value || 0);
};

interface GeneralMetricsProps {
  isLoading?: boolean;
}

const GeneralMetrics: React.FC<GeneralMetricsProps> = ({ isLoading = false }) => {
  const [totalMessagesState, setTotalMessages] = useState<number>(0);
  const [uniqueUsersState, setUniqueUsers] = useState<number>(0);
  const [avgResponseTimeState, setAvgResponseTime] = useState<number>(0);
  const [messagesByChannel, setMessagesByChannel] = useState<any[]>([]);
  const [dailyActivity, setDailyActivity] = useState<any[]>([]);
  const [responseTimes, setResponseTimes] = useState<any[]>([]);
  const [sentimentData, setSentimentData] = useState<any[]>([]);
  const [aiEffectiveness, setAiEffectiveness] = useState<any[]>([]);
  const [satisfactionRate, setSatisfactionRate] = useState<number>(0);
  
  const data = generateOverallData();
  
  // Usar los datos simulados directamente en lugar de duplicar variables
  const totalMessages = data.messagesByChannel.reduce((sum, item) => sum + item.value, 0);
  const avgResponseTime = data.responseTimeByChannel.reduce((sum, item) => sum + item.tiempo, 0) / data.responseTimeByChannel.length;
  const uniqueUsers = 2850;
  
  // Calcular satisfacción (basado en sentimiento positivo)
  const satisfactionRateValue = data.sentimentAnalysis.find(item => item.name === 'Positivo')?.value || 0;
  
  // Función para obtener mensajes de todos los canales
  const fetchMessagesFromAllChannels = async (userId: string, channels: string[]): Promise<NormalizedMessage[]> => {
    const allMessages: NormalizedMessage[] = [];
    
    try {
      console.log("📨 [GeneralMetrics] Consultando mensajes de todos los canales:", channels);
      
      // Intentamos consultar la colección de mensajes general primero
      try {
        const messagesQuery = query(
          collection(db, "messages"),
          where("userId", "==", userId)
        );
        
        const messagesSnapshot = await getDocs(messagesQuery);
        console.log(`📨 [GeneralMetrics] Mensajes encontrados en colección general: ${messagesSnapshot.size}`);
        
        if (!messagesSnapshot.empty) {
          messagesSnapshot.forEach(doc => {
            const msgData = doc.data();
            // Solo incluimos mensajes de canales conectados
            if (channels.includes(msgData.platform)) {
              allMessages.push({
                id: doc.id,
                platform: msgData.platform,
                externalId: msgData.externalId || msgData.messageId,
                userId: userId,
                senderId: msgData.from || msgData.senderId,
                senderName: msgData.senderName,
                body: msgData.body || msgData.content || "",
                createdAt: msgData.timestamp || msgData.createdAt,
                isFromMe: msgData.isFromMe,
                status: msgData.responded ? 'replied' : (msgData.status || 'read'),
                responseTime: msgData.responseTime ? (typeof msgData.responseTime === 'number' ? msgData.responseTime : 0) : undefined,
                sentiment: msgData.sentiment || 'neutral',
                autoReplySent: msgData.agentResponse || msgData.autoReplySent || false,
                autoReply: msgData.agentResponseText || msgData.autoReply,
                hourOfDay: msgData.hourOfDay,
                category: msgData.category
              });
            }
          });
          
          // Ordenamos los mensajes por fecha
          allMessages.sort((a, b) => {
            const timeA = a.createdAt ? 
              (typeof a.createdAt === 'number' ? a.createdAt : 
               (a.createdAt as Timestamp).toMillis()) : 0;
            const timeB = b.createdAt ? 
              (typeof b.createdAt === 'number' ? b.createdAt : 
               (b.createdAt as Timestamp).toMillis()) : 0;
            
            return timeB - timeA; // Ordenar descendente (más recientes primero)
          });
        } else {
          console.log("⚠️ [GeneralMetrics] No se encontraron mensajes en la colección general");
        }
      } catch (error) {
        console.error("❌ [GeneralMetrics] Error al consultar mensajes generales:", error);
        // Continuamos con métodos alternativos
      }
      
      // Si no hay mensajes de la colección general, intentamos obtener de cada canal específico
      if (allMessages.length === 0) {
        console.log("⚠️ [GeneralMetrics] Intentando obtener mensajes por canal específico");
        
        // Obtener mensajes de WhatsApp
        if (channels.includes("whatsapp")) {
          try {
            console.log("📱 [GeneralMetrics] Consultando mensajes de WhatsApp");
            const whatsappQuery = query(
              collection(db, "whatsapp"),
              where("userId", "==", userId),
              limit(100)
            );
            
            const whatsappSnapshot = await getDocs(whatsappQuery);
            console.log(`📱 [GeneralMetrics] Mensajes de WhatsApp encontrados: ${whatsappSnapshot.size}`);
            
            whatsappSnapshot.forEach(doc => {
              const msgData = doc.data();
              if (channels.includes("whatsapp")) {
                allMessages.push({
                  id: doc.id,
                  platform: "whatsapp",
                  externalId: msgData.externalId || msgData.messageId,
                  userId: userId,
                  senderId: msgData.from || msgData.senderId,
                  senderName: msgData.senderName,
                  body: msgData.body || msgData.content || "",
                  createdAt: msgData.timestamp || msgData.createdAt,
                  isFromMe: msgData.isFromMe,
                  status: msgData.responded ? 'replied' : (msgData.status || 'read'),
                  responseTime: msgData.responseTime ? (typeof msgData.responseTime === 'number' ? msgData.responseTime : 0) : undefined,
                  sentiment: msgData.sentiment || 'neutral',
                  autoReplySent: msgData.agentResponse || msgData.autoReplySent || false,
                  autoReply: msgData.agentResponseText || msgData.autoReply,
                  hourOfDay: msgData.hourOfDay,
                  category: msgData.category
                });
              }
            });
          } catch (error) {
            console.error("❌ [GeneralMetrics] Error al consultar mensajes de WhatsApp:", error);
          }
        }
      }
    } catch (error) {
      console.error("❌ [GeneralMetrics] Error al consultar mensajes:", error);
    }
    
    return allMessages;
  };

  return (
    <div className="space-y-6">
      {/* Tarjetas de métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Mensajes"
          value={totalMessages.toLocaleString()}
          icon={<MessageCircle />}
          description="Todos los canales - Último mes"
          trend={8.5}
          color="bg-indigo-500"
          loading={isLoading}
        />
        <MetricCard
          title="Usuarios Únicos"
          value={uniqueUsers.toLocaleString()}
          icon={<Users />}
          description="Conversaciones activas"
          trend={12.3}
          color="bg-cyan-500"
          loading={isLoading}
        />
        <MetricCard
          title="Tiempo de Respuesta"
          value={`${Math.floor(avgResponseTime)} min`}
          icon={<Clock />}
          description="Promedio entre canales"
          trend={-5.2}
          color="bg-emerald-500"
          loading={isLoading}
        />
        <MetricCard
          title="Satisfacción"
          value={`${satisfactionRateValue}%`}
          icon={<HeartHandshake />}
          description="Basado en análisis de sentimiento"
          trend={3.8}
          color="bg-amber-500"
          loading={isLoading}
        />
      </div>

      {/* Distribución de mensajes y actividad diaria */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartContainer
          title="Distribución de Mensajes"
          description="Mensajes por canal en el último mes"
          isLoading={isLoading}
        >
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={data.messagesByChannel}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
              >
                {data.messagesByChannel.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name) => [`${value} mensajes`, `${name}`]}
                itemStyle={{ color: '#333' }}
                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #f0f0f0' }}
              />
              <Legend 
                layout="vertical" 
                verticalAlign="middle" 
                align="right"
                wrapperStyle={{ fontSize: '12px', paddingLeft: '10px' }}
                formatter={(value, entry) => <span style={{ color: entry.color }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer
          title="Actividad Diaria"
          description="Mensajes por canal en los últimos 30 días"
          className="lg:col-span-2"
          allowDownload
          allowRefresh
          isLoading={isLoading}
        >
          <div>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={data.dailyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10 }}
                  interval={4}
                />
                <YAxis />
                <Tooltip
                  formatter={(value) => [`${value} mensajes`, ``]}
                  itemStyle={{ color: '#333' }}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #f0f0f0' }}
                />
                <Legend />
                <Area type="monotone" dataKey="WhatsApp" stackId="1" stroke={CHANNEL_COLORS.whatsapp} fill={CHANNEL_COLORS.whatsapp} fillOpacity={0.8} />
                <Area type="monotone" dataKey="Instagram" stackId="1" stroke={CHANNEL_COLORS.instagram} fill={CHANNEL_COLORS.instagram} fillOpacity={0.8} />
                <Area type="monotone" dataKey="Messenger" stackId="1" stroke={CHANNEL_COLORS.messenger} fill={CHANNEL_COLORS.messenger} fillOpacity={0.8} />
                <Area type="monotone" dataKey="Telegram" stackId="1" stroke={CHANNEL_COLORS.telegram} fill={CHANNEL_COLORS.telegram} fillOpacity={0.8} />
                <Area type="monotone" dataKey="Email" stackId="1" stroke={CHANNEL_COLORS.email} fill={CHANNEL_COLORS.email} fillOpacity={0.8} />
                <Area type="monotone" dataKey="Web" stackId="1" stroke={CHANNEL_COLORS.website} fill={CHANNEL_COLORS.website} fillOpacity={0.8} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartContainer>
      </div>

      {/* Tiempo de respuesta y Análisis de sentimiento */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartContainer
          title="Tiempo de Respuesta por Canal"
          description="Tiempo promedio en minutos"
          isLoading={isLoading}
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={data.responseTimeByChannel}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={80} />
              <Tooltip
                formatter={(value) => [`${value} minutos`, ``]}
                itemStyle={{ color: '#333' }}
                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #f0f0f0' }}
              />
              <Bar dataKey="tiempo" name="Minutos" fill="#7c3aed" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer
          title="Análisis de Sentimiento"
          description="Distribución de tono emocional en conversaciones"
          isLoading={isLoading}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={data.sentimentAnalysis}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => percent > 0.08 ? `${(percent * 100).toFixed(0)}%` : ''}
                  labelLine={false}
                >
                  {data.sentimentAnalysis.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value}%`, `${name}`]}
                  itemStyle={{ color: '#333' }}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #f0f0f0' }}
                />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom" 
                  align="center"
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="flex flex-col gap-4">
              {data.sentimentAnalysis.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className={`h-4 w-4 rounded-full`} style={{ backgroundColor: item.color }}></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{item.name}</div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${item.value}%`, backgroundColor: item.color }}></div>
                    </div>
                  </div>
                  <div className="text-sm font-medium">{item.value}%</div>
                </div>
              ))}
            </div>
          </div>
        </ChartContainer>
      </div>

      {/* Efectividad de IA y comparativas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartContainer
          title="Efectividad de Respuestas IA"
          description="Evolución mensual"
          className="lg:col-span-2"
          isLoading={isLoading}
        >
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.aiEffectiveness}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip
                formatter={(value) => [`${value}%`, ``]}
                itemStyle={{ color: '#333' }}
                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #f0f0f0' }}
              />
              <Legend />
              <Line type="monotone" dataKey="efectividad" name="Precisión respuestas" stroke="#7c3aed" strokeWidth={2} activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="resolucion" name="Resolución sin humano" stroke="#06b6d4" strokeWidth={2} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer
          title="Métricas de IA"
          description="Rendimiento actual"
          isLoading={isLoading}
        >
          <div className="flex flex-col gap-6 h-full justify-center">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Precisión respuestas</span>
                <span className="text-sm font-medium">85%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-indigo-600" style={{ width: "85%" }}></div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Resolución sin humano</span>
                <span className="text-sm font-medium">72%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-cyan-500" style={{ width: "72%" }}></div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Tiempo ahorrado</span>
                <span className="text-sm font-medium">68%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: "68%" }}></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Satisfacción usuarios</span>
                <span className="text-sm font-medium">78%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-amber-500" style={{ width: "78%" }}></div>
              </div>
            </div>
          </div>
        </ChartContainer>
      </div>

      {/* Métricas secundarias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Efectividad IA"
          value="85%"
          icon={<BrainCircuit />}
          description="Precisión en respuestas automáticas"
          trend={5.2}
          color="bg-indigo-600"
          loading={isLoading}
        />
        <MetricCard
          title="Conversiones"
          value="178"
          icon={<TrendingUp />}
          description="Ventas generadas desde chats"
          trend={12.5}
          color="bg-emerald-600"
          loading={isLoading}
        />
        <MetricCard
          title="Campañas Activas"
          value="5"
          icon={<Megaphone />}
          description="Campañas de comunicación"
          color="bg-amber-600"
          loading={isLoading}
        />
        <MetricCard
          title="Retención"
          value="94.2%"
          icon={<HeartHandshake />}
          description="Clientes recurrentes"
          trend={1.8}
          color="bg-rose-600"
          loading={isLoading}
        />
      </div>
    </div>
  );
};

export default GeneralMetrics; 