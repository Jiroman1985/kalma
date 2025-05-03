import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { doc, getFirestore, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { AlertCircle, CheckCircle, ArrowLeft, Loader2, Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { toast } from 'sonner';
import { db } from '@/lib/firebase';

// Constantes de Instagram
const INSTAGRAM_CLIENT_ID = process.env.REACT_APP_INSTAGRAM_CLIENT_ID || '674580881831928';
const INSTAGRAM_CLIENT_SECRET = process.env.REACT_APP_INSTAGRAM_CLIENT_SECRET;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/auth/instagram/callback`;
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://api.kalma.io';

// Estados de conexión
type ConnectionStatus = 'loading' | 'success' | 'error';

const InstagramAuthCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<ConnectionStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [redirectTimer, setRedirectTimer] = useState<number | null>(null);
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const connectInstagram = async () => {
      if (!currentUser) {
        setStatus('error');
        setErrorMessage('No hay usuario autenticado');
        toast.error('Debes iniciar sesión para conectar Instagram');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const code = searchParams.get('code');
      if (!code) {
        setStatus('error');
        setErrorMessage('No se recibió código de autorización');
        toast.error('Error en la autenticación de Instagram');
        setTimeout(() => navigate('/dashboard/canales'), 2000);
        return;
      }

      try {
        setStatus('Obteniendo token de acceso...');
        
        // Obtener el token de acceso
        const tokenResponse = await fetch(`${import.meta.env.VITE_API_URL}/auth/instagram/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        });
        
        if (!tokenResponse.ok) {
          throw new Error('Error al obtener token de Instagram');
        }
        
        const tokenData = await tokenResponse.json();
        console.log('Token de Instagram obtenido:', tokenData);
        
        // Obtener información de la cuenta de Instagram
        setStatus('Obteniendo información de tu cuenta de Instagram...');
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
          throw new Error('Error al obtener información de la cuenta de Instagram');
        }
        
        const userData = await userResponse.json();
        console.log('Información de Instagram obtenida:', userData);
        
        // Guardar datos en Firestore
        setStatus('Guardando información en tu perfil...');
        
        // Verificar si ya existe información de Instagram
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        // Preparar objeto con toda la información disponible
        const instagramData = {
          connected: true,
          instagramUserId: tokenData.user_id,
          username: userData.username,
          accountType: userData.account_type,
          mediaCount: userData.media_count,
          accessToken: tokenData.access_token,
          connectedAt: new Date(),
          lastUpdated: new Date()
        };
        
        // Intentar obtener datos adicionales si están disponibles
        if (userData.followers_count) {
          instagramData.followerCount = userData.followers_count;
        }
        
        // Si hay datos de métricas, guardarlos también
        if (userData.metrics) {
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
          // Crear analíticas básicas si no hay métricas disponibles
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
        
        // Guardar en Firestore, manteniendo cualquier dato existente
        if (userDoc.exists()) {
          await updateDoc(userDocRef, {
            'socialNetworks.instagram': instagramData
          });
        } else {
          throw new Error('El documento del usuario no existe');
        }
        
        // Configurar webhooks para Instagram
        setStatus('Configurando notificaciones de Instagram...');
        await fetch(`${import.meta.env.VITE_API_URL}/auth/instagram/setup-webhooks`, {
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
        
        setStatus('Conexión exitosa');
        toast.success('Cuenta de Instagram conectada correctamente');
        
        // Navegar de vuelta a la página de canales
        setTimeout(() => navigate('/dashboard/canales'), 1500);
      } catch (error) {
        console.error('Error en la conexión con Instagram:', error);
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Error al conectar Instagram');
        toast.error('Error al conectar Instagram');
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
                {status.includes('Error') ? (
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
          <p className="mt-4 text-gray-700">{status}</p>
        </div>
      </div>
    </div>
  );
};

export default InstagramAuthCallback; 