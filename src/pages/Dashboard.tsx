import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { BarChart, Users, MessagesSquare, Clock, HeartPulse, Loader2, Lock, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { 
  getWeeklyStats, 
  getUserStats, 
  calculateAverageResponseTime,
  calculateTimeSaved,
  getWhatsAppAnalytics,
  getMessagesPerDay
} from "@/lib/whatsappService";

const Dashboard = () => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const firstName = currentUser?.displayName?.split(' ')[0] || 'Usuario';
  
  const [loading, setLoading] = useState(true);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalMessages: 0,
    totalUsers: 0,
    avgResponseTime: 0,
    responseRate: 0,
    timeSaved: { hours: 0, minutes: 0 }
  });
  const [compareStats, setCompareStats] = useState({
    messagesChange: "+0%",
    usersChange: "+0%",
    timeChange: "0min",
    rateChange: "+0%"
  });
  const [messagesPerDay, setMessagesPerDay] = useState<any[]>([]);

  // Verificar acceso y redirigir si es necesario
  useEffect(() => {
    if (userData && !userData.hasFullAccess) {
      console.log("Acceso restringido al Dashboard. Redirigiendo a configuración...");
      navigate('/dashboard/settings');
    }

    // Si el usuario tiene freeTier pero no está vinculado, redirigir a settings
    if (userData && userData.freeTier && !userData.vinculado) {
      console.log("Usuario con freeTier sin vincular. Redirigiendo a settings...");
      navigate('/dashboard/settings');
    }
  }, [userData, navigate]);

  useEffect(() => {
    // Solo cargar datos si el usuario tiene acceso completo Y está vinculado
    if (userData && userData.hasFullAccess && userData.vinculado) {
      const fetchDashboardData = async () => {
        setLoading(true);
        try {
          if (!currentUser) {
            setLoading(false);
            return;
          }

          // Forzar regeneración de Analytics desde los mensajes reales
          const whatsappData = await getWhatsAppAnalytics(currentUser.uid);
          console.log("WhatsApp data:", whatsappData);

          // Obtener estadísticas por día
          const messagesPerDayData = await getMessagesPerDay(currentUser.uid, 30);
          setMessagesPerDay(messagesPerDayData);

          // Obtener estadísticas semanales
          const weeklyStats = await getWeeklyStats(currentUser.uid);
          
          // Preparar datos para el gráfico
          const chartData = weeklyStats.dailyData.map((day: any) => {
            // Convertir la fecha a nombre de día
            const date = new Date(day.date);
            const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            return {
              name: dayNames[date.getDay()],
              conversaciones: day.count
            };
          });
          
          setWeeklyData(chartData);
          
          // Obtener estadísticas de usuarios
          const userStats = await getUserStats(currentUser.uid);
          
          // Obtener tiempo promedio de respuesta
          const avgResponse = await calculateAverageResponseTime(currentUser.uid);
          
          // Obtener tiempo ahorrado
          const savedTime = await calculateTimeSaved(currentUser.uid);
          
          // Actualizar estadísticas
          setStats({
            totalMessages: weeklyStats.totalWeeklyMessages,
            totalUsers: userStats.uniqueUsers,
            avgResponseTime: avgResponse,
            responseRate: userStats.responseRate,
            timeSaved: { 
              hours: savedTime.hours, 
              minutes: savedTime.minutes 
            }
          });
          
          // Simulación de cambios respecto al mes pasado
          // En una implementación real, esto vendría de comparar con datos históricos
          setCompareStats({
            messagesChange: `+${Math.floor(Math.random() * 20)}%`,
            usersChange: `+${Math.floor(Math.random() * 10)}%`,
            timeChange: `${Math.random() > 0.5 ? "+" : "-"}${(Math.random() * 0.5).toFixed(1)}min`,
            rateChange: `+${Math.floor(Math.random() * 5)}%`
          });
        } catch (error) {
          console.error("Error al cargar datos del dashboard:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [currentUser, userData]);

  // Si el usuario no tiene acceso completo, mostrar pantalla de acceso restringido
  if (userData && !userData.hasFullAccess) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] gap-4 animate-fade-in-up">
        <div className="bg-gradient-to-r from-blue-50 to-pink-50 p-6 rounded-full mb-4 animate-pulse-glow">
          <Lock className="h-12 w-12 text-blue-500" />
        </div>
        <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-blue-600 to-pink-500 bg-clip-text text-transparent animate-fade-in-up stagger-1">Acceso Restringido</h2>
        <p className="text-gray-600 text-center max-w-md mb-4 animate-fade-in-up stagger-2">
          Necesitas activar tu período de prueba gratuito o adquirir una suscripción para acceder a esta sección.
        </p>
        <Button 
          variant="gradient"
          onClick={() => navigate('/dashboard/settings')}
          className="animate-fade-in-up stagger-3"
        >
          Ir a configuración
        </Button>
      </div>
    );
  }

  // Si el usuario tiene freeTier pero no está vinculado, mostrar mensaje especial
  if (userData && userData.freeTier && !userData.vinculado) {
    return (
      <div className="space-y-6 animate-fade-in-up">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-pink-500 bg-clip-text text-transparent">
            Bienvenido, {firstName}
          </h1>
        </div>
        
        <Card className="bg-gradient-to-r from-blue-50 to-pink-50 border-none animate-fade-in-up stagger-1">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-blue-700">
              Vinculación de WhatsApp pendiente
            </CardTitle>
            <CardDescription className="text-blue-600/80">
              Acceso limitado - Se requiere vinculación
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-4 text-gray-700">
              <strong>Para acceder a todas las funcionalidades, necesitas terminar la vinculación de tu WhatsApp.</strong>
            </p>
            <p className="text-sm mb-4 text-gray-600">
              En breve recibirás en tu email ({currentUser?.email}) las instrucciones necesarias 
              para vincular tu WhatsApp junto con el código QR. Si no recibes el email en los 
              próximos minutos, revisa tu carpeta de spam.
            </p>
            <p className="text-sm text-gray-600">
              Una vez que recibas las instrucciones, podrás vincular tu WhatsApp escaneando el código QR 
              y comenzar a utilizar todas las funcionalidades de la plataforma.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              variant="gradient"
              onClick={() => navigate('/dashboard/settings')}
              className="animate-scale-in stagger-2"
            >
              Ir a configuración
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-4 animate-scale-in">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
          <p className="text-lg text-blue-600/80">Cargando datos del dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center animate-fade-in-up">
        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-pink-500 bg-clip-text text-transparent">
          Bienvenido, {firstName}
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        {/* Tarjetas de estadísticas */}
        <Card gradient hover className="animate-fade-in-up stagger-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Total Conversaciones</CardTitle>
            <div className="icon-container icon-blue animate-float">
              <MessagesSquare className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.totalMessages}</div>
            <p className="text-xs text-blue-500">{compareStats.messagesChange} respecto al mes pasado</p>
          </CardContent>
        </Card>
        
        <Card gradient hover className="animate-fade-in-up stagger-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Usuarios Atendidos</CardTitle>
            <div className="icon-container icon-indigo animate-float">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.totalUsers}</div>
            <p className="text-xs text-indigo-500">Usuarios con respuesta</p>
          </CardContent>
        </Card>
        
        <Card gradient hover className="animate-fade-in-up stagger-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Tiempo Promedio</CardTitle>
            <div className="icon-container icon-purple animate-float">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.avgResponseTime}min</div>
            <p className="text-xs text-purple-500">{compareStats.timeChange} respecto al mes pasado</p>
          </CardContent>
        </Card>
        
        <Card gradient hover className="animate-fade-in-up stagger-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Tiempo Ahorrado</CardTitle>
            <div className="icon-container icon-pink animate-float">
              <HeartPulse className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats.timeSaved.hours}h {stats.timeSaved.minutes}min
            </div>
            <p className="text-xs text-pink-500">Esta semana</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Gráficos */}
        <Card className="animate-fade-in-up stagger-1">
          <CardHeader>
            <CardTitle className="text-gray-800">Conversaciones por día</CardTitle>
            <CardDescription>
              Actividad durante la última semana
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={weeklyData}
                  margin={{
                    top: 10,
                    right: 30,
                    left: 0,
                    bottom: 0,
                  }}
                >
                  <defs>
                    <linearGradient id="colorConversaciones" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4776E6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4776E6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#94a3b8"
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <YAxis 
                    stroke="#94a3b8"
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'white', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.5rem',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="conversaciones" 
                    stroke="#4776E6" 
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorConversaciones)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in-up stagger-2">
          <CardHeader>
            <CardTitle className="text-gray-800">Mensajes por Día</CardTitle>
            <CardDescription>
              Volumen de mensajes en los últimos 30 días
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={messagesPerDay}
                  margin={{
                    top: 10,
                    right: 30,
                    left: 0,
                    bottom: 0,
                  }}
                >
                  <defs>
                    <linearGradient id="colorMensajes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8E54E9" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8E54E9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#94a3b8"
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <YAxis 
                    stroke="#94a3b8"
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'white', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.5rem',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#8E54E9" 
                    strokeWidth={2}
                    name="Mensajes"
                    fillOpacity={1}
                    fill="url(#colorMensajes)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Tarjeta de Usuario Destacado */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-100 gradient-border animate-fade-in-up stagger-3">
          <CardHeader>
            <CardTitle className="text-blue-700">Promoción Actual</CardTitle>
            <CardDescription className="text-blue-600/80">
              Mejora tu plan y obtén beneficios adicionales
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700">
              Aprovecha nuestro plan Premium con un <span className="font-bold text-gradient">20% de descuento</span> este mes. 
              Incluye características avanzadas para optimizar tus conversaciones.
            </p>
            <ul className="space-y-2">
              <li className="flex items-center text-gray-700">
                <div className="w-2 h-2 rounded-full bg-blue-400 mr-2"></div>
                <span>Respuestas automáticas ilimitadas</span>
              </li>
              <li className="flex items-center text-gray-700">
                <div className="w-2 h-2 rounded-full bg-indigo-400 mr-2"></div>
                <span>Análisis avanzado de conversaciones</span>
              </li>
              <li className="flex items-center text-gray-700">
                <div className="w-2 h-2 rounded-full bg-purple-400 mr-2"></div>
                <span>Soporte prioritario 24/7</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button variant="gradient" className="w-full group transition-all duration-300">
              <span>Actualizar Plan</span>
              <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Button>
          </CardFooter>
        </Card>

        {/* Tarjeta de Rendimiento */}
        <Card className="gradient-border animate-fade-in-up stagger-4">
          <CardHeader>
            <CardTitle className="text-gray-800">Tasa de Respuesta</CardTitle>
            <CardDescription>
              Rendimiento de las respuestas automatizadas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Efectividad</span>
              <span className="text-sm font-medium text-green-600">{stats.responseRate}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2.5 rounded-full shimmer-effect" 
                style={{ width: `${stats.responseRate}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between mt-6">
              <div className="text-center">
                <p className="text-xs text-gray-500">Respuestas</p>
                <p className="text-lg font-semibold text-gray-800 animate-float">{stats.totalMessages}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Tiempo Prom.</p>
                <p className="text-lg font-semibold text-gray-800 animate-float">{stats.avgResponseTime}min</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Satisfacción</p>
                <p className="text-lg font-semibold text-green-600 animate-float">95%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
