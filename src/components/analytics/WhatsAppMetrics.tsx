import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import { MessageSquareDashed, Users, Clock, BrainCircuit, TrendingUp, CheckCheck, AlertCircle } from 'lucide-react';
import MetricCard from './MetricCard';
import ChartContainer from './ChartContainer';

// Datos de ejemplo para WhatsApp
const generateWhatsAppData = () => {
  // Mensajes por día
  const messagesPerDay = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - 29 + i);
    return {
      date: date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
      entrantes: Math.floor(Math.random() * 100) + 50,
      salientes: Math.floor(Math.random() * 80) + 40,
    };
  });

  // Categorías de mensajes
  const messageCategories = [
    { name: 'Consultas', value: 35 },
    { name: 'Ventas', value: 25 },
    { name: 'Soporte', value: 20 },
    { name: 'Reclamos', value: 15 },
    { name: 'Otros', value: 5 },
  ];

  // Horario de mensajes
  const messagesByHour = Array.from({ length: 24 }, (_, i) => {
    // Simulamos un patrón con picos en la mañana y tarde-noche
    let factor = 1;
    if (i >= 8 && i <= 11) factor = 3; // Mañana
    if (i >= 18 && i <= 22) factor = 4; // Tarde-noche
    return {
      hora: `${i}:00`,
      cantidad: Math.floor(Math.random() * 30 * factor) + 5,
    };
  });

  // Tiempos de respuesta
  const responseTimeData = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - 29 + i);
    // Tendencia de mejora gradual en el tiempo de respuesta
    const baseTime = 30 - (i * 0.5);
    return {
      date: date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
      tiempo: Math.max(5, Math.floor(baseTime + (Math.random() * 10) - 5)),
    };
  });

  // Estados de mensajes
  const messageStatus = [
    { name: 'Entregados', value: 95 },
    { name: 'Leídos', value: 85 },
    { name: 'Respondidos', value: 72 },
  ];

  // Usuarios activos
  const activeUsersData = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - 29 + i);
    return {
      date: date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
      nuevos: Math.floor(Math.random() * 20) + 5,
      recurrentes: Math.floor(Math.random() * 50) + 100,
    };
  });

  return {
    messagesPerDay,
    messageCategories,
    messagesByHour,
    responseTimeData,
    messageStatus,
    activeUsersData,
  };
};

interface WhatsAppMetricsProps {
  isLoading?: boolean;
}

const WhatsAppMetrics: React.FC<WhatsAppMetricsProps> = ({ isLoading = false }) => {
  const data = generateWhatsAppData();
  const COLORS = ['#4CAF50', '#2196F3', '#FFC107', '#F44336', '#9C27B0'];

  // Calcular totales para las tarjetas de métricas
  const totalIncoming = data.messagesPerDay.reduce((sum, item) => sum + item.entrantes, 0);
  const totalOutgoing = data.messagesPerDay.reduce((sum, item) => sum + item.salientes, 0);
  const avgResponseTime = data.responseTimeData.reduce((sum, item) => sum + item.tiempo, 0) / data.responseTimeData.length;
  
  return (
    <div className="space-y-6">
      {/* Tarjetas de métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Mensajes Recibidos"
          value={totalIncoming.toLocaleString()}
          icon={<MessageSquareDashed />}
          description="Último mes"
          trend={7.5}
          color="bg-green-600"
          isLoading={isLoading}
        />
        <MetricCard
          title="Mensajes Enviados"
          value={totalOutgoing.toLocaleString()}
          icon={<MessageSquareDashed />}
          description="Último mes"
          trend={5.2}
          color="bg-green-600"
          isLoading={isLoading}
        />
        <MetricCard
          title="Tiempo de Respuesta"
          value={`${Math.floor(avgResponseTime)} min`}
          icon={<Clock />}
          description="Promedio mensual"
          trend={-12.5}
          color="bg-green-600"
          isLoading={isLoading}
        />
        <MetricCard
          title="Usuarios Activos"
          value="865"
          icon={<Users />}
          description="Chats activos en el mes"
          trend={9.3}
          color="bg-green-600"
          isLoading={isLoading}
        />
      </div>

      {/* Gráficas principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartContainer
          title="Mensajes por Día"
          description="Evolución del último mes"
          allowDownload
          allowRefresh
          isLoading={isLoading}
        >
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.messagesPerDay}>
              <defs>
                <linearGradient id="colorEntrantes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#25D366" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#25D366" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorSalientes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#128C7E" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#128C7E" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
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
              <Area 
                type="monotone" 
                dataKey="entrantes" 
                name="Mensajes recibidos"
                stroke="#25D366" 
                fillOpacity={1} 
                fill="url(#colorEntrantes)" 
              />
              <Area 
                type="monotone" 
                dataKey="salientes" 
                name="Mensajes enviados"
                stroke="#128C7E" 
                fillOpacity={1} 
                fill="url(#colorSalientes)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer
          title="Categorías de Mensajes"
          description="Distribución por tipo de consulta"
          infoTooltip="Esta clasificación se realiza mediante análisis de intención con IA"
          isLoading={isLoading}
        >
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.messageCategories}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {data.messageCategories.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [`${value}%`, ``]}
                itemStyle={{ color: '#333' }}
                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #f0f0f0' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Gráficas secundarias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartContainer
          title="Horario de Actividad"
          description="Distribución de mensajes por hora del día"
          isLoading={isLoading}
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.messagesByHour}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="hora" 
                tickFormatter={(value) => value.split(':')[0]}
                interval={2}
              />
              <YAxis />
              <Tooltip 
                formatter={(value) => [`${value} mensajes`, ``]}
                itemStyle={{ color: '#333' }}
                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #f0f0f0' }}
              />
              <Bar dataKey="cantidad" name="Cantidad de mensajes" fill="#25D366" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer
          title="Tiempo de Respuesta"
          description="Evolución en minutos por día"
          isLoading={isLoading}
        >
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.responseTimeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10 }}
                interval={4}
              />
              <YAxis />
              <Tooltip 
                formatter={(value) => [`${value} minutos`, ``]}
                itemStyle={{ color: '#333' }}
                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #f0f0f0' }}
              />
              <Line 
                type="monotone" 
                dataKey="tiempo" 
                name="Tiempo promedio"
                stroke="#128C7E" 
                strokeWidth={2} 
                dot={{ r: 0 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Métricas de rendimiento */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartContainer
          title="Estados de Mensajes"
          description="Tasa de entrega, lectura y respuesta"
          isLoading={isLoading}
        >
          <div className="space-y-6 py-4">
            {data.messageStatus.map((status, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{status.name}</span>
                  <span className="text-sm font-medium">{status.value}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full" 
                    style={{ 
                      width: `${status.value}%`, 
                      backgroundColor: index === 0 ? "#25D366" : index === 1 ? "#34B7F1" : "#128C7E" 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </ChartContainer>

        <ChartContainer
          title="Usuarios Activos"
          description="Nuevos y recurrentes por día"
          className="lg:col-span-2"
          isLoading={isLoading}
        >
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.activeUsersData}>
              <defs>
                <linearGradient id="colorNuevos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34B7F1" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#34B7F1" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorRecurrentes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#128C7E" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#128C7E" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10 }}
                interval={4}
              />
              <YAxis />
              <Tooltip 
                formatter={(value) => [`${value} usuarios`, ``]}
                itemStyle={{ color: '#333' }}
                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #f0f0f0' }}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="nuevos" 
                name="Usuarios nuevos"
                stroke="#34B7F1" 
                fillOpacity={1} 
                fill="url(#colorNuevos)" 
              />
              <Area 
                type="monotone" 
                dataKey="recurrentes" 
                name="Usuarios recurrentes"
                stroke="#128C7E" 
                fillOpacity={1} 
                fill="url(#colorRecurrentes)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Métricas adicionales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Tasa de Respuesta"
          value="96.2%"
          icon={<CheckCheck />}
          description="Mensajes contestados"
          trend={1.8}
          color="bg-green-600"
          isLoading={isLoading}
        />
        <MetricCard
          title="Tasa de Resolución"
          value="88.5%"
          icon={<AlertCircle />}
          description="Consultas resueltas"
          trend={3.2}
          color="bg-green-600"
          isLoading={isLoading}
        />
        <MetricCard
          title="Respuestas IA"
          value="65.3%"
          icon={<BrainCircuit />}
          description="Resueltas automáticamente"
          trend={8.7}
          color="bg-green-600"
          isLoading={isLoading}
        />
        <MetricCard
          title="Conversiones"
          value="125"
          icon={<TrendingUp />}
          description="Ventas desde WhatsApp"
          trend={12.5}
          color="bg-green-600"
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default WhatsAppMetrics; 