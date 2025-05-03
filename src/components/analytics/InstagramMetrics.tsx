import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import { Instagram, MessageCircle, Heart, Bookmark, Share2, Users, Clock, TrendingUp } from 'lucide-react';
import MetricCard from './MetricCard';
import ChartContainer from './ChartContainer';

// Datos de ejemplo para Instagram
const generateInstagramData = () => {
  // Engagement por día
  const engagementData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - 6 + i);
    return {
      date: date.toLocaleDateString('es-ES', { weekday: 'short' }),
      likes: Math.floor(Math.random() * 300) + 200,
      comments: Math.floor(Math.random() * 80) + 20,
      shares: Math.floor(Math.random() * 50) + 10,
      saves: Math.floor(Math.random() * 40) + 5,
    };
  });

  // Tipos de interacción
  const interactionTypes = [
    { name: 'Likes', value: 1250 },
    { name: 'Comentarios', value: 430 },
    { name: 'Guardados', value: 320 },
    { name: 'Compartidos', value: 280 },
  ];

  // Horario de mayor actividad
  const hourlyData = Array.from({ length: 24 }, (_, i) => {
    // Simulamos un patrón con picos en la mañana y tarde
    let factor = 1;
    if (i >= 8 && i <= 10) factor = 3; // Mañana
    if (i >= 18 && i <= 21) factor = 4; // Tarde-noche
    return {
      hora: `${i}:00`,
      interacciones: Math.floor(Math.random() * 50 * factor) + 10,
    };
  });

  // Demografía de seguidores
  const followerDemographics = [
    { name: '18-24', value: 35 },
    { name: '25-34', value: 40 },
    { name: '35-44', value: 15 },
    { name: '45+', value: 10 },
  ];

  // Crecimiento de seguidores
  const followerGrowth = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - 29 + i);
    // Simulamos un crecimiento diario con alguna variación
    const dailyGrowth = Math.floor(Math.random() * 15) + 5;
    return {
      date: date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
      nuevos: dailyGrowth,
      total: 5000 + (dailyGrowth * i) // Valor base + acumulado
    };
  });

  return {
    engagementData,
    interactionTypes,
    hourlyData,
    followerDemographics,
    followerGrowth,
  };
};

interface InstagramMetricsProps {
  isLoading?: boolean;
}

const InstagramMetrics: React.FC<InstagramMetricsProps> = ({ isLoading = false }) => {
  const data = generateInstagramData();
  const COLORS = ['#E1306C', '#8A3AB9', '#FCAF45', '#4E5DB1'];

  // Calcular totales para las tarjetas de métricas
  const totalLikes = data.engagementData.reduce((sum, item) => sum + item.likes, 0);
  const totalComments = data.engagementData.reduce((sum, item) => sum + item.comments, 0);
  const totalShares = data.engagementData.reduce((sum, item) => sum + item.shares, 0);
  const totalSaves = data.engagementData.reduce((sum, item) => sum + item.saves, 0);
  
  return (
    <div className="space-y-6">
      {/* Tarjetas de métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Seguidores"
          value="5,430"
          icon={<Users />}
          description="Último mes"
          trend={12}
          color="bg-purple-500"
          isLoading={isLoading}
        />
        <MetricCard
          title="Engagement Rate"
          value="5.8%"
          icon={<TrendingUp />}
          description="Promedio de interacciones"
          trend={-2.1}
          color="bg-pink-500"
          isLoading={isLoading}
        />
        <MetricCard
          title="Mensajes Directos"
          value="187"
          icon={<MessageCircle />}
          description="Último mes"
          trend={8.5}
          color="bg-blue-500"
          isLoading={isLoading}
        />
        <MetricCard
          title="Tiempo de Respuesta"
          value="1h 12m"
          icon={<Clock />}
          description="Promedio mensual"
          trend={-15}
          color="bg-green-500"
          isLoading={isLoading}
        />
      </div>

      {/* Gráfica de engagement */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartContainer
          title="Engagement por Día"
          description="Interacciones en los últimos 7 días"
          className="lg:col-span-2"
          allowDownload
          allowRefresh
          isLoading={isLoading}
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.engagementData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip 
                formatter={(value) => [`${value}`, ``]}
                itemStyle={{ color: '#333' }}
                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #f0f0f0' }}
              />
              <Legend />
              <Bar dataKey="likes" name="Likes" fill="#E1306C" radius={[4, 4, 0, 0]} />
              <Bar dataKey="comments" name="Comentarios" fill="#8A3AB9" radius={[4, 4, 0, 0]} />
              <Bar dataKey="shares" name="Compartidos" fill="#FCAF45" radius={[4, 4, 0, 0]} />
              <Bar dataKey="saves" name="Guardados" fill="#4E5DB1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer
          title="Tipos de Interacción"
          description="Distribución de interacciones"
          infoTooltip="Muestra la proporción de cada tipo de interacción en tu contenido"
          isLoading={isLoading}
        >
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.interactionTypes}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {data.interactionTypes.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [`${value}`, ``]}
                itemStyle={{ color: '#333' }}
                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #f0f0f0' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Gráficas adicionales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartContainer
          title="Actividad por Hora"
          description="Horarios con mayor interacción"
          isLoading={isLoading}
        >
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.hourlyData}>
              <defs>
                <linearGradient id="colorInteractions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E1306C" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#E1306C" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="hora" 
                tickFormatter={(value) => value.split(':')[0]}
              />
              <YAxis />
              <Tooltip 
                formatter={(value) => [`${value} interacciones`, ``]}
                itemStyle={{ color: '#333' }}
                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #f0f0f0' }}
              />
              <Area 
                type="monotone" 
                dataKey="interacciones" 
                stroke="#E1306C" 
                fillOpacity={1} 
                fill="url(#colorInteractions)" 
                name="Interacciones"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer
          title="Crecimiento de Seguidores"
          description="Evolución en los últimos 30 días"
          isLoading={isLoading}
          tabs={[
            {
              value: "nuevos",
              label: "Nuevos seguidores",
              content: (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.followerGrowth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10 }}
                      interval={5}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`${value} seguidores`, ``]}
                      itemStyle={{ color: '#333' }}
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #f0f0f0' }}
                    />
                    <Bar dataKey="nuevos" name="Nuevos seguidores" fill="#8A3AB9" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )
            },
            {
              value: "total",
              label: "Total acumulado",
              content: (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.followerGrowth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10 }}
                      interval={5}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`${value} seguidores`, ``]}
                      itemStyle={{ color: '#333' }}
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #f0f0f0' }}
                    />
                    <Line type="monotone" dataKey="total" name="Total seguidores" stroke="#8A3AB9" strokeWidth={2} dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              )
            }
          ]}
        />
      </div>

      {/* Tarjetas de métricas secundarias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Likes"
          value={totalLikes.toLocaleString()}
          icon={<Heart className="text-pink-500" />}
          description="Últimos 7 días"
          color="bg-pink-500"
          isLoading={isLoading}
        />
        <MetricCard
          title="Total Comentarios"
          value={totalComments.toLocaleString()}
          icon={<MessageCircle className="text-purple-500" />}
          description="Últimos 7 días"
          color="bg-purple-500"
          isLoading={isLoading}
        />
        <MetricCard
          title="Total Compartidos"
          value={totalShares.toLocaleString()}
          icon={<Share2 className="text-amber-500" />}
          description="Últimos 7 días"
          color="bg-amber-500"
          isLoading={isLoading}
        />
        <MetricCard
          title="Total Guardados"
          value={totalSaves.toLocaleString()}
          icon={<Bookmark className="text-blue-500" />}
          description="Últimos 7 días"
          color="bg-blue-500"
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default InstagramMetrics; 