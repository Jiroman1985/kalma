import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { BarChart, Users, MessagesSquare, Clock } from "lucide-react";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from "recharts";

const data = [
  { name: 'Lun', conversaciones: 40 },
  { name: 'Mar', conversaciones: 30 },
  { name: 'Mié', conversaciones: 20 },
  { name: 'Jue', conversaciones: 27 },
  { name: 'Vie', conversaciones: 18 },
  { name: 'Sáb', conversaciones: 23 },
  { name: 'Dom', conversaciones: 34 }
];

const Dashboard = () => {
  const { currentUser } = useAuth();
  const firstName = currentUser?.displayName?.split(' ')[0] || 'Usuario';

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
            <div className="text-2xl font-bold">245</div>
            <p className="text-xs text-muted-foreground">+12% respecto al mes pasado</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Atendidos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">128</div>
            <p className="text-xs text-muted-foreground">+5% respecto al mes pasado</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiempo Promedio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.4min</div>
            <p className="text-xs text-muted-foreground">-0.3min respecto al mes pasado</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Analytics</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89%</div>
            <p className="text-xs text-muted-foreground">+2% respecto al mes pasado</p>
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
                data={data}
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
                <Tooltip />
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
