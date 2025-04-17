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
  Line
} from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, getDocs, orderBy, limit } from "firebase/firestore";
import { useToast } from "@/components/ui/use-toast";

// Definir tipo para los datos de análisis de WhatsApp
interface WhatsAppAnalytics {
  totalMessages: number;
  lastMessageTimestamp: number;
  messagesPerDay: Record<string, number>;
  activeChats: number;
  firstMessageTimestamp: Date;
  lastUpdated: Date;
}

// Colores para gráficos
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const Analytics = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [whatsappAnalytics, setWhatsappAnalytics] = useState<WhatsAppAnalytics | null>(null);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([
    { name: 'Consultas', value: 45 },
    { name: 'Ventas', value: 30 },
    { name: 'Soporte', value: 15 },
    { name: 'Otros', value: 10 }
  ]);
  const [hourlyData, setHourlyData] = useState<any[]>([]);

  // Cargar datos de análisis de WhatsApp
  useEffect(() => {
    const loadWhatsAppAnalytics = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Cargar datos de análisis de WhatsApp
        const analyticsRef = doc(db, `users/${currentUser.uid}/analytics/whatsapp`);
        const analyticsSnap = await getDoc(analyticsRef);

        if (analyticsSnap.exists()) {
          const data = analyticsSnap.data() as WhatsAppAnalytics;
          setWhatsappAnalytics(data);

          // Procesar datos para gráficos
          // Formatear datos de mensajes por día para el gráfico de barras
          const last7Days = getLastNDays(7);
          const messagesPerDay = data.messagesPerDay || {};

          const weeklyChartData = last7Days.map(day => {
            return {
              name: formatDayName(day),
              conversaciones: messagesPerDay[day] || 0,
              usuarios: Math.floor((messagesPerDay[day] || 0) * 0.6) // Simulado por ahora
            };
          });
          setWeeklyData(weeklyChartData);

          // Simular datos horarios basados en patrones típicos
          const hourlyChartData = generateHourlyData(data.totalMessages || 0);
          setHourlyData(hourlyChartData);
        } else {
          // Si no existen datos, inicializar con valores predeterminados
          setWeeklyData(getLastNDays(7).map(day => ({
            name: formatDayName(day),
            conversaciones: 0,
            usuarios: 0
          })));
          setHourlyData(generateHourlyData(0));
        }
      } catch (error) {
        console.error("Error al cargar datos de análisis:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos de análisis",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadWhatsAppAnalytics();
  }, [currentUser]);

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Mensajes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{whatsappAnalytics?.totalMessages || 0}</div>
            <p className="text-xs text-muted-foreground">
              Desde {whatsappAnalytics?.firstMessageTimestamp 
                ? new Date(whatsappAnalytics.firstMessageTimestamp).toLocaleDateString() 
                : 'inicio'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversaciones Activas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{whatsappAnalytics?.activeChats || 0}</div>
            <p className="text-xs text-muted-foreground">Conversaciones con actividad reciente</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio Mensajes Diarios</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {whatsappAnalytics && whatsappAnalytics.totalMessages > 0
                ? (whatsappAnalytics.totalMessages / Object.keys(whatsappAnalytics.messagesPerDay || {}).length).toFixed(1)
                : "0"}
            </div>
            <p className="text-xs text-muted-foreground">Promedio de mensajes por día</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gráfico de barras */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChartIcon className="h-5 w-5" />
              Conversaciones y Usuarios Diarios
            </CardTitle>
            <CardDescription>
              Datos de la última semana
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={weeklyData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="conversaciones" fill="#25D366" />
                  <Bar dataKey="usuarios" fill="#34B7F1" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico circular */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Categorías de Conversaciones
            </CardTitle>
            <CardDescription>
              Distribución por tipo de consulta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de líneas */}
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Distribución Horaria de Conversaciones
            </CardTitle>
            <CardDescription>
              Número de conversaciones por hora
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={hourlyData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hora" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="conversaciones" 
                    stroke="#25D366" 
                    activeDot={{ r: 8 }}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
