import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { 
  BarChart as BarChartIcon, 
  PieChart as PieChartIcon,
  TrendingUp, 
  Users, 
  Clock,
  Loader2
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, collection, query, getDocs, orderBy, limit, Timestamp } from "firebase/firestore";
import { useToast } from "@/components/ui/use-toast";
import { getWhatsAppAnalytics, getMessagesPerDay, calculateTimeSaved, calculateAverageResponseTime, getWeeklyStats, getUserStats, WhatsAppAnalytics } from "@/lib/whatsappService";

// Colores para gráficos
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const Analytics = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState<boolean>(true);
  const [whatsappAnalytics, setWhatsappAnalytics] = useState<WhatsAppAnalytics | null>(null);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [hourlyData, setHourlyData] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [messagesPerDay, setMessagesPerDay] = useState<any[]>([]);
  const [timeSaved, setTimeSaved] = useState<{ hours: number, minutes: number, totalMinutes: number }>({ hours: 0, minutes: 0, totalMinutes: 0 });
  const [responseTime, setResponseTime] = useState<number>(0);
  const [weeklyStats, setWeeklyStats] = useState<any>({ totalWeeklyMessages: 0, averagePerDay: 0, mostActiveDay: 'N/A', mostActiveDayCount: 0 });
  const [userStats, setUserStats] = useState<any>({ uniqueUsers: 0, activeChats: 0, responseRate: 0 });

  // Cargar datos de análisis de WhatsApp
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          setLoading(false);
          return;
        }

        // Obtener datos de análisis de WhatsApp
        const whatsappData = await getWhatsAppAnalytics(currentUser.uid);
        console.log("WhatsApp data:", whatsappData);

        // Obtener estadísticas por día
        const messagesPerDayData = await getMessagesPerDay(currentUser.uid, 30);
        setMessagesPerDay(messagesPerDayData);

        // Obtener tiempo ahorrado
        const savedTime = await calculateTimeSaved(currentUser.uid);
        setTimeSaved(savedTime);

        // Obtener tiempo promedio de respuesta
        const avgResponseTime = await calculateAverageResponseTime(currentUser.uid);
        setResponseTime(avgResponseTime);

        // Obtener estadísticas semanales
        const weekly = await getWeeklyStats(currentUser.uid);
        setWeeklyStats(weekly);

        // Obtener estadísticas de usuarios
        const users = await getUserStats(currentUser.uid);
        setUserStats(users);

        // Verificar si existen datos de categorías de mensajes
        if (whatsappData && whatsappData.messageCategories) {
          const categoriesData = Object.entries(whatsappData.messageCategories).map(([name, value]) => ({
            name,
            value: typeof value === 'number' ? value : 0
          }));
          setChartData(categoriesData);
        } else {
          // Datos de ejemplo para el gráfico de categorías si no hay datos reales
          setChartData([
            { name: 'Consultas', value: 25 },
            { name: 'Ventas', value: 35 },
            { name: 'Soporte', value: 20 },
            { name: 'Reclamos', value: 15 },
            { name: 'Otros', value: 5 }
          ]);
        }

        // Verificar la estructura de la colección de mensajes
        const whatsappMessagesRef = collection(db, 'users', currentUser.uid, 'whatsapp');
        const whatsappMessagesSnapshot = await getDocs(query(whatsappMessagesRef));
        console.log(`Encontrados ${whatsappMessagesSnapshot.size} mensajes en la colección whatsapp`);
      } catch (error) {
        console.error("Error al cargar datos de análisis:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Obtener los últimos N días en formato YYYY-MM-DD
  const getLastNDays = (n: number): string[] => {
    const dates: string[] = [];
    for (let i = n - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  // Formatear nombre del día a partir de fecha YYYY-MM-DD
  const formatDayName = (dateStr: string): string => {
    const date = new Date(dateStr);
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return dayNames[date.getDay()];
  };

  // Generar datos horarios simulados basados en patrones típicos
  const generateHourlyData = (totalMessages: number): any[] => {
    // Patrón típico de distribución horaria
    const hourlyPattern = [
      0.01, 0.01, 0.005, 0.005, 0.01, 0.02, // 0-5 AM
      0.03, 0.05, 0.07, 0.08, 0.09, 0.10,   // 6-11 AM
      0.08, 0.07, 0.06, 0.07, 0.08, 0.09,   // 12-5 PM
      0.07, 0.06, 0.04, 0.03, 0.02, 0.01    // 6-11 PM
    ];

    // Calcular factor para escalar a totalMessages
    const factor = totalMessages > 0 ? totalMessages : 100; 

    return Array.from({ length: 24 }, (_, i) => ({
      hora: `${i}:00`,
      conversaciones: Math.round(hourlyPattern[i] * factor)
    }));
  };

  // Helper para formatear fecha desde Timestamp o Date
  const formatDate = (timestamp: any): string => {
    if (timestamp) {
      // Si es un Timestamp de Firestore
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toLocaleDateString();
      }
      // Si es un número (timestamp en milisegundos)
      if (typeof timestamp === 'number') {
        return new Date(timestamp).toLocaleDateString();
      }
      // Si ya es un objeto Date
      if (timestamp instanceof Date) {
        return timestamp.toLocaleDateString();
      }
    }
    return 'inicio';
  };

  const renderPieChart = () => {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={true}
            outerRadius={100}
            paddingAngle={2}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value, name) => [`${value} mensajes`, name]}
            labelFormatter={() => 'Categoría'} 
          />
          <Legend formatter={(value) => <span style={{ color: '#666', fontSize: '0.9em' }}>{value}</span>} />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  const renderAreaChart = () => {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart
          data={messagesPerDay}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#25D366" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#25D366" stopOpacity={0.2} />
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="date" 
            tickFormatter={(value) => {
              const date = new Date(value);
              return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
            }}
          />
          <YAxis />
          <CartesianGrid strokeDasharray="3 3" />
          <Tooltip
            labelFormatter={(value) => {
              const date = new Date(value);
              return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
            }}
            formatter={(value: any) => [`${value} mensajes`, 'Total']}
          />
          <Area 
            type="monotone" 
            dataKey="count" 
            stroke="#25D366" 
            fillOpacity={1} 
            fill="url(#colorMessages)" 
            name="Mensajes"
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  const renderDashboardMetrics = () => {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-1 text-gray-700">Conversaciones Totales</h3>
          <p className="text-3xl font-bold text-blue-600">{weeklyStats.totalWeeklyMessages}</p>
          <p className="text-sm text-gray-500">Últimos 7 días</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-1 text-gray-700">Usuarios Atendidos</h3>
          <p className="text-3xl font-bold text-green-600">{userStats.uniqueUsers}</p>
          <p className="text-sm text-gray-500">Chats activos: {userStats.activeChats}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-1 text-gray-700">Tiempo Promedio</h3>
          <p className="text-3xl font-bold text-purple-600">{responseTime} min</p>
          <p className="text-sm text-gray-500">Tasa de respuesta: {userStats.responseRate}%</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-1 text-gray-700">Horas de Vida Ganadas</h3>
          <p className="text-3xl font-bold text-amber-600">{timeSaved.hours}h {timeSaved.minutes}m</p>
          <p className="text-sm text-gray-500">Total: {timeSaved.totalMinutes} minutos</p>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Cargando datos de análisis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Análisis de WhatsApp</h1>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {renderDashboardMetrics()}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Categorías de Mensajes</h2>
              {renderPieChart()}
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Mensajes por Día</h2>
              {renderAreaChart()}
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-semibold mb-4">Actividad Semanal</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-3 rounded-md">
                <h3 className="text-md font-medium mb-1">Total Mensajes</h3>
                <p className="text-2xl font-bold text-blue-600">{weeklyStats.totalWeeklyMessages}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <h3 className="text-md font-medium mb-1">Promedio Diario</h3>
                <p className="text-2xl font-bold text-green-600">{weeklyStats.averagePerDay}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <h3 className="text-md font-medium mb-1">Día Más Activo</h3>
                <p className="text-2xl font-bold text-purple-600">{weeklyStats.mostActiveDay}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <h3 className="text-md font-medium mb-1">Mensajes ese día</h3>
                <p className="text-2xl font-bold text-amber-600">{weeklyStats.mostActiveDayCount}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;
