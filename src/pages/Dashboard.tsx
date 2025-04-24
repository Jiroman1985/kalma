import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { BarChart, Users, MessagesSquare, Clock, HeartPulse, Loader2, Lock } from "lucide-react";
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
          const whatsappData = await getWhatsAppAnalytics(currentUser.uid, true);
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
      <div className="flex flex-col justify-center items-center min-h-[60vh] gap-4">
        <div className="bg-gray-100 p-6 rounded-full mb-4">
          <Lock className="h-12 w-12 text-gray-500" />
        </div>
        <h2 className="text-2xl font-bold text-center">Acceso Restringido</h2>
        <p className="text-gray-600 text-center max-w-md mb-4">
          Necesitas activar tu período de prueba gratuito o adquirir una suscripción para acceder a esta sección.
        </p>
        <Button 
          className="bg-whatsapp hover:bg-whatsapp-dark" 
          onClick={() => navigate('/dashboard/settings')}
        >
          Ir a configuración
        </Button>
      </div>
    );
  }

  // Si el usuario tiene freeTier pero no está vinculado, mostrar mensaje especial
  if (userData && userData.freeTier && !userData.vinculado) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Bienvenido, {firstName}</h1>
        </div>
        
        <Card className="bg-gradient-to-r from-green-100 to-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              Vinculación de WhatsApp pendiente
            </CardTitle>
            <CardDescription>
              Acceso limitado - Se requiere vinculación
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-4">
              <strong>Para acceder a todas las funcionalidades, necesitas terminar la vinculación de tu WhatsApp.</strong>
            </p>
            <p className="text-sm mb-4">
              En breve recibirás en tu email ({currentUser?.email}) las instrucciones necesarias 
              para vincular tu WhatsApp junto con el código QR. Si no recibes el email en los 
              próximos minutos, revisa tu carpeta de spam.
            </p>
            <p className="text-sm">
              Una vez que recibas las instrucciones, podrás vincular tu WhatsApp escaneando el código QR 
              y comenzar a utilizar todas las funcionalidades de la plataforma.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              className="bg-whatsapp hover:bg-whatsapp-dark" 
              onClick={() => navigate('/dashboard/settings')}
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
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Cargando datos del dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Bienvenido, {firstName}</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Tarjetas de estadísticas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversaciones</CardTitle>
            <MessagesSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMessages}</div>
            <p className="text-xs text-muted-foreground">{compareStats.messagesChange} respecto al mes pasado</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Atendidos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Usuarios con respuesta</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiempo Promedio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgResponseTime}min</div>
            <p className="text-xs text-muted-foreground">{compareStats.timeChange} respecto al mes pasado</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiempo Ahorrado</CardTitle>
            <HeartPulse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.timeSaved.hours}h {stats.timeSaved.minutes}m</div>
            <p className="text-xs text-muted-foreground">Vida ganada con automatización</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico principal */}
      <Card>
        <CardHeader>
          <CardTitle>Actividad semanal</CardTitle>
          <CardDescription>
            Número de conversaciones por día durante la última semana
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={weeklyData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorConversaciones" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#25D366" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#25D366" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" />
                <YAxis />
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip 
                  formatter={(value: number) => [`${value} conversaciones`, 'Total']}
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '6px' }}
                />
                <Area
                  type="monotone"
                  dataKey="conversaciones"
                  stroke="#25D366"
                  fillOpacity={1}
                  fill="url(#colorConversaciones)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
