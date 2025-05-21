import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Instagram, Users, Info, AlertCircle } from "lucide-react";
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
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// Interfaz para datos de seguidores
interface FollowerData {
  date: string;
  followers: number;
  change: number;
}

// Función auxiliar para formatear fechas
const formatDateDisplay = (dateStr: string): string => {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return dateStr;
    
    // Formato día/mes/año
    return `${day}/${month}/${year}`;
  } catch (e) {
    return dateStr;
  }
};

const InstagramMetrics = ({ isLoading = false }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(isLoading);
  const [instagramUsername, setInstagramUsername] = useState<string>("");
  const [followersData, setFollowersData] = useState<FollowerData[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<
    'loading' | 'connected' | 'disconnected' | 'error' | 'expired'
  >('loading');
  const [errorInfo, setErrorInfo] = useState<{
    code: string;
    message: string;
    details: string;
    statusCode: number;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      
      setLoading(true);
      
      try {
        console.log("🔍 [InstagramMetrics] Cargando datos de Instagram para:", currentUser.uid);
        
        // Verificar si el usuario tiene una cuenta de Instagram conectada
        const socialTokensRef = doc(db, "users", currentUser.uid, "socialTokens", "instagram");
        const socialTokensDoc = await getDoc(socialTokensRef);
        
        if (!socialTokensDoc.exists()) {
          console.log("⚠️ [InstagramMetrics] El usuario no tiene una cuenta de Instagram conectada");
          setConnectionStatus('disconnected');
          setLoading(false);
          return;
        }

        const instagramData = socialTokensDoc.data();
        
        // Verificar que tengamos accessToken e instagramUserId
        if (!instagramData.accessToken || !instagramData.instagramUserId) {
          console.log("⚠️ [InstagramMetrics] Datos de conexión incompletos");
          setConnectionStatus('disconnected');
          setLoading(false);
          return;
        }
        
        // Verificar si el token está caducado
        if (instagramData.tokenExpiry && Date.now() > instagramData.tokenExpiry) {
          console.log("⚠️ [InstagramMetrics] Token caducado");
          setConnectionStatus('expired');
          setLoading(false);
          return;
        }
        
        // Guardar información de Instagram para uso en el componente
        if (instagramData.username) {
          setInstagramUsername(instagramData.username);
        }
        
        // Cargar datos históricos de seguidores de Firestore
        await loadFollowerData();
        
        setConnectionStatus('connected');
      } catch (error) {
        console.error("❌ [InstagramMetrics] Error al cargar datos:", error);
        setConnectionStatus('error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  const loadFollowerData = async () => {
    if (!currentUser) return;
    
    try {
      console.log("🔍 [InstagramMetrics] Cargando datos históricos de seguidores");
      
      // Consultar colección de followerHistory
      const followerHistoryRef = collection(db, "users", currentUser.uid, "followerHistory");
      const followerHistoryQuery = query(
        followerHistoryRef,
        orderBy("date", "desc"),
        limit(30) // Últimos 30 días
      );
      
      const snapshot = await getDocs(followerHistoryQuery);
      
      if (snapshot.empty) {
        console.log("⚠️ [InstagramMetrics] No hay datos históricos de seguidores");
        return;
      }
      
      // Ordenar por fecha ascendente para calcular cambios
      const historyData = snapshot.docs
        .map(doc => doc.data() as FollowerData)
        .sort((a, b) => {
          // Convertir fechas a objetos Date para comparación
          const dateA = new Date(a.date.split('-').join('/'));
          const dateB = new Date(b.date.split('-').join('/'));
          return dateA.getTime() - dateB.getTime();
        });
      
      console.log("✅ [InstagramMetrics] Datos históricos cargados:", historyData.length);
      
      // Calcular cambios diarios
      const dataWithChanges = historyData.map((item, index) => {
        if (index === 0) {
          return { ...item, change: 0 };
        }
        
        const change = item.followers - historyData[index - 1].followers;
        return { ...item, change };
      });
      
      setFollowersData(dataWithChanges);
    } catch (error) {
      console.error("❌ [InstagramMetrics] Error al cargar datos históricos:", error);
    }
  };

  const renderFollowersTable = () => {
    let errorMessage = "";
    
    if (loading) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 mx-auto mb-2 border-t-2 border-primary rounded-full" />
          <p>Cargando datos de seguidores...</p>
        </div>
      );
    }
    
    if (connectionStatus === 'disconnected') {
      errorMessage = "No hay una cuenta de Instagram conectada";
    } else if (connectionStatus === 'expired') {
      errorMessage = "La conexión con Instagram ha expirado";
    } else if (connectionStatus === 'error') {
      errorMessage = errorInfo?.message || "Error al cargar datos de Instagram";
    }
    
    if (errorMessage) {
      return (
        <div className="text-center py-8 text-red-500">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p>{errorMessage}</p>
        </div>
      );
    }
    
    if (followersData.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Info className="w-8 h-8 mx-auto mb-2" />
          <p>No hay datos de seguidores disponibles</p>
        </div>
      );
    }
    
    return (
      <Table>
        <TableCaption>Evolución de seguidores en los últimos {followersData.length} días</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead className="text-right">Seguidores</TableHead>
            <TableHead className="text-right">Cambio</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {followersData.map((item) => (
            <TableRow key={item.date}>
              <TableCell>{formatDateDisplay(item.date)}</TableCell>
              <TableCell className="text-right">{item.followers.toLocaleString()}</TableCell>
              <TableCell className="text-right">
                {item.change !== 0 && (
                  <span className={item.change > 0 ? "text-green-600" : "text-red-600"}>
                    {item.change > 0 ? "+" : ""}{item.change.toLocaleString()}
                  </span>
                )}
                {item.change === 0 && <span className="text-gray-500">—</span>}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-700">Métricas de Instagram</h2>
      
      {instagramUsername && (
        <div className="flex items-center gap-3 text-lg">
          <div className="bg-gradient-to-tr from-pink-500 to-purple-500 rounded-full p-2">
            <Instagram className="h-6 w-6 text-white" />
          </div>
          <span className="font-medium">@{instagramUsername}</span>
          {followersData.length > 0 && (
            <Badge variant="outline" className="ml-2 bg-gray-50">
              <Users className="h-3.5 w-3.5 mr-1" />
              {followersData[followersData.length - 1].followers.toLocaleString()} seguidores
            </Badge>
          )}
        </div>
      )}
      
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-tr from-pink-500 to-purple-700 p-2 rounded-md text-white">
                <Users className="h-6 w-6" />
              </div>
              <CardTitle>Evolución de Seguidores</CardTitle>
            </div>
          </div>
          <CardDescription>Seguimiento del crecimiento de seguidores en Instagram</CardDescription>
        </CardHeader>
        <CardContent>
          {renderFollowersTable()}
        </CardContent>
      </Card>
    </div>
  );
};

export default InstagramMetrics; 