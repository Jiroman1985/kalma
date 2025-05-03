import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { toast as sonnerToast } from 'sonner';
import { db } from '@/lib/firebase';

// Estados de conexión
type ConnectionStatus = 'loading' | 'success' | 'error' | string;

// Interfaz para datos de Instagram
interface InstagramData {
  connected: boolean;
  instagramUserId: string;
  username: string;
  accountType: string;
  mediaCount: number;
  accessToken: string;
  connectedAt: Date;
  lastUpdated: Date;
  followerCount?: number;
  metrics?: any;
  analytics?: {
    followerCount: number;
    engagementRate: number;
    responseTime: number;
    followerGrowth: number;
    lastUpdated: Date;
    hourlyActivity: any[];
    interactionTypes: any[];
  };
}

const InstagramAuthCallback = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [status, setStatus] = useState<ConnectionStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [debug, setDebug] = useState<string[]>([]);

  // Función para añadir mensajes de depuración
  const addDebug = (message: string) => {
    console.log("[Instagram Callback]", message);
    setDebug(prev => [...prev, message]);
  };

  useEffect(() => {
    const connectInstagram = async () => {
      if (!currentUser) {
        setStatus('error');
        setErrorMessage('No hay usuario autenticado');
        sonnerToast.error('Debes iniciar sesión para conectar Instagram');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const code = searchParams.get('code');
      if (!code) {
        setStatus('error');
        setErrorMessage('No se recibió código de autorización');
        sonnerToast.error('Error en la autenticación de Instagram');
        setTimeout(() => navigate('/dashboard/canales'), 2000);
        return;
      }

      try {
        setStatus('loading');
        addDebug(`Iniciando proceso de conexión para usuario: ${currentUser.uid}`);
        addDebug(`Código de autorización recibido: ${code.substring(0, 10)}...`);
        
        // 1. Obtener el token de acceso
        addDebug('Obteniendo token de acceso...');
        const tokenResponse = await fetch(`${import.meta.env.VITE_API_URL}/auth/instagram/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        });
        
        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.text();
          addDebug(`Error al obtener token: ${errorData}`);
          throw new Error(`Error al obtener token de Instagram: ${errorData}`);
        }
        
        const tokenData = await tokenResponse.json();
        addDebug(`Token obtenido para el usuario de Instagram ID: ${tokenData.user_id}`);
        
        // 2. Obtener información de la cuenta de Instagram
        addDebug('Obteniendo información de la cuenta...');
        const userResponse = await fetch(`${import.meta.env.VITE_API_URL}/auth/instagram/user-info`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            access_token: tokenData.access_token,
            user_id: tokenData.user_id 
          }),
        });
        
        if (!userResponse.ok) {
          const errorData = await userResponse.text();
          addDebug(`Error al obtener información de usuario: ${errorData}`);
          throw new Error(`Error al obtener información de la cuenta de Instagram: ${errorData}`);
        }
        
        const userData = await userResponse.json();
        addDebug(`Información obtenida - Usuario: @${userData.username}, Tipo: ${userData.account_type}`);
        addDebug(`Datos completos: ${JSON.stringify(userData)}`);
        
        // 3. Verificar si ya existe documento de usuario
        addDebug('Verificando documento de usuario en Firestore...');
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
          addDebug('ERROR: El documento del usuario no existe en Firestore');
          throw new Error('El documento del usuario no existe en Firestore');
        }
        
        // 4. Preparar objeto con toda la información disponible
        addDebug('Preparando datos para guardar en Firestore...');
        const instagramData: InstagramData = {
          connected: true,
          instagramUserId: tokenData.user_id,
          username: userData.username,
          accountType: userData.account_type,
          mediaCount: userData.media_count || 0,
          accessToken: tokenData.access_token,
          connectedAt: new Date(),
          lastUpdated: new Date()
        };
        
        // Intentar obtener datos adicionales
        if (userData.followers_count) {
          addDebug(`Seguidores encontrados: ${userData.followers_count}`);
          instagramData.followerCount = userData.followers_count;
        }
        
        // Si hay datos de métricas, guardarlos
        if (userData.metrics) {
          addDebug(`Métricas encontradas: ${JSON.stringify(userData.metrics)}`);
          instagramData.metrics = userData.metrics;
          
          // Crear analíticas basadas en las métricas
          instagramData.analytics = {
            followerCount: userData.metrics.followers_count || userData.media_count || 0,
            engagementRate: userData.metrics.engagement || 2.5,
            responseTime: 20, // Valor predeterminado en minutos
            followerGrowth: 0,
            lastUpdated: new Date(),
            hourlyActivity: [],
            interactionTypes: []
          };
        } else {
          // Crear analíticas básicas
          addDebug('No se encontraron métricas, creando analytics básicos');
          instagramData.analytics = {
            followerCount: userData.followers_count || userData.media_count || 0,
            engagementRate: 2.5, // Valor estimado promedio
            responseTime: 20, // Valor predeterminado en minutos
            followerGrowth: 0,
            lastUpdated: new Date(),
            hourlyActivity: [],
            interactionTypes: []
          };
        }
        
        // 5. Guardar en Firestore
        addDebug('Guardando datos en Firestore...');
        await updateDoc(userDocRef, {
          'socialNetworks.instagram': instagramData
        });
        addDebug('Datos guardados exitosamente en Firestore');
        
        // 6. Verificar que los datos se guardaron correctamente
        const updatedUserDoc = await getDoc(userDocRef);
        const updatedData = updatedUserDoc.data();
        if (updatedData?.socialNetworks?.instagram?.connected) {
          addDebug(`Verificación exitosa: Instagram conectado para @${updatedData.socialNetworks.instagram.username}`);
        } else {
          addDebug('ADVERTENCIA: No se pudo verificar que los datos se guardaron correctamente');
        }
        
        // 7. Configurar webhooks si es necesario
        addDebug('Configurando webhooks para Instagram...');
        try {
          const webhookResponse = await fetch(`${import.meta.env.VITE_API_URL}/auth/instagram/setup-webhooks`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: currentUser.uid,
              instagramId: tokenData.user_id,
              accessToken: tokenData.access_token
            }),
          });
          
          if (webhookResponse.ok) {
            addDebug('Webhooks configurados correctamente');
          } else {
            addDebug('Error al configurar webhooks, pero el proceso continúa');
          }
        } catch (webhookError) {
          addDebug(`Error en webhooks: ${webhookError.message}`);
          // Continuar a pesar del error en webhooks
        }
        
        // 8. Finalizar proceso exitosamente
        setStatus('success');
        addDebug('Proceso completado exitosamente');
        sonnerToast.success('Cuenta de Instagram conectada correctamente');
        
        // Navegar de vuelta a la página de canales
        setTimeout(() => navigate('/dashboard/canales'), 2000);
      } catch (error) {
        console.error('Error en la conexión con Instagram:', error);
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Error al conectar Instagram');
        addDebug(`ERROR FATAL: ${error.message || 'Error desconocido'}`);
        sonnerToast.error('Error al conectar Instagram');
        setTimeout(() => navigate('/dashboard/canales'), 3000);
      } finally {
        setIsLoading(false);
      }
    };

    connectInstagram();
  }, [searchParams, navigate, currentUser]);

  return (
    <div className="flex h-screen flex-col items-center justify-center p-4 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500">
      <div className="w-full max-w-md p-8 space-y-6 rounded-lg bg-white shadow-xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Conexión con Instagram</h1>
          <div className="mt-4 flex justify-center">
            {isLoading ? (
              <Loader2 className="w-8 h-8 text-pink-600 animate-spin" />
            ) : (
              <div className="flex items-center justify-center w-10 h-10 bg-pink-100 rounded-full">
                {status === 'error' ? (
                  <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            )}
          </div>
          <p className="mt-4 text-gray-700">
            {status === 'error' ? `Error: ${errorMessage}` : 
             status === 'success' ? 'Conexión exitosa' : 
             'Procesando conexión con Instagram...'}
          </p>
          
          {/* Mostrar mensajes de depuración solo en desarrollo */}
          {import.meta.env.DEV && debug.length > 0 && (
            <div className="mt-4 p-2 bg-gray-100 rounded text-left overflow-auto max-h-60 text-xs">
              <p className="font-semibold mb-1">Registro de depuración:</p>
              {debug.map((msg, i) => (
                <div key={i} className="py-1 border-b border-gray-200">
                  {msg}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstagramAuthCallback; 