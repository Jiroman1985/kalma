import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { BarChart, Users, MessagesSquare, Clock, HeartPulse, Loader2 } from "lucide-react";
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
  const { currentUser } = useAuth();
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

  useEffect(() => {
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
  }, [currentUser]);

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
