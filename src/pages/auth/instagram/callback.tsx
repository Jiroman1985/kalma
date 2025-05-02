import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { doc, getFirestore, updateDoc, serverTimestamp } from 'firebase/firestore';
import { AlertCircle, CheckCircle, ArrowLeft, Loader2, Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';
import axios from 'axios';

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

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Verificar si el usuario está autenticado
        if (!currentUser) {
          setStatus('error');
          setErrorMessage('No se pudo verificar tu sesión. Por favor, inicia sesión nuevamente.');
          return;
        }

        // Obtener código y estado del URL
        const urlParams = new URLSearchParams(location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');

        // Verificar si hay errores de Instagram
        if (error) {
          setStatus('error');
          setErrorMessage(errorDescription || `Error de Instagram: ${error}`);
          return;
        }

        // Verificar que recibimos un código válido
        if (!code) {
          setStatus('error');
          setErrorMessage('No se recibió un código válido de autenticación.');
          return;
        }

        // Verificar que el estado coincide con el ID del usuario actual
        if (state !== currentUser.uid) {
          setStatus('error');
          setErrorMessage('Error de validación de seguridad. Por favor, intenta nuevamente.');
          return;
        }

        // 1. Canjear el código por un token de acceso
        const tokenResponse = await axios.post('/.netlify/functions/instagram-callback', {
          code: code
        });

        const { access_token, user_id } = tokenResponse.data;

        // 2. Obtener información detallada de la cuenta
        const accountResponse = await axios.get(`https://graph.instagram.com/v12.0/me`, {
          params: {
            fields: 'id,username,account_type,media_count',
            access_token: access_token
          }
        });

        const accountInfo = accountResponse.data;

        // 3. Aceptar cualquier tipo de cuenta (BUSINESS, CREATOR, PERSONAL)
        // Puedes mostrar un aviso si la cuenta no es BUSINESS, pero no lanzar error
        // Ejemplo:
        // if (accountInfo.account_type !== 'BUSINESS') {
        //   toast({
        //     title: "Aviso",
        //     description: `Has conectado una cuenta de tipo ${accountInfo.account_type}. Algunas funciones pueden estar limitadas.`,
        //     variant: "warning",
        //   });
        // }

        // 4. Suscribir la cuenta al webhook
        await axios.post(`${API_BASE_URL}/webhooks/instagram/subscribe`, {
          userId: currentUser.uid,
          instagramUserId: user_id,
          accessToken: access_token
        });

        // 5. Guardar los datos en Firestore
        const db = getFirestore();
        const userRef = doc(db, 'users', currentUser.uid);

        await updateDoc(userRef, {
          'socialNetworks.instagram': {
            connected: true,
            instagramUserId: user_id,
            username: accountInfo.username,
            accountType: accountInfo.account_type,
            mediaCount: accountInfo.media_count,
            accessToken: access_token,
            connectedAt: serverTimestamp(),
            lastUpdated: serverTimestamp()
          }
        });

        // Actualizar estado de éxito
        setStatus('success');
        
        // Mostrar notificación de éxito
        toast({
          title: "Conexión exitosa",
          description: `Tu cuenta de Instagram Business (@${accountInfo.username}) ha sido conectada correctamente a kalma`,
          variant: "default",
        });

        // Redirigir automáticamente después de 2 segundos
        const timer = window.setTimeout(() => {
          navigate('/dashboard/social-networks');
        }, 2000);
        
        setRedirectTimer(timer);
      } catch (error: any) {
        console.error('Error al procesar callback de Instagram:', error);
        setStatus('error');
        setErrorMessage(
          error instanceof Error 
            ? error.message 
            : 'Ocurrió un error al conectar tu cuenta de Instagram Business'
        );
        
        toast({
          title: "Error de conexión",
          description: "No se pudo conectar tu cuenta de Instagram Business",
          variant: "destructive",
        });
      }
    };

    handleCallback();

    // Limpieza del timer al desmontar
    return () => {
      if (redirectTimer) {
        window.clearTimeout(redirectTimer);
      }
    };
  }, [currentUser, location.search, toast, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
        {status === 'loading' && (
          <div className="flex flex-col items-center text-center space-y-3">
            <Instagram className="h-12 w-12 text-pink-500" />
            <h1 className="text-2xl font-bold">Conectando con Instagram Business</h1>
            <p className="text-gray-500">
              Estamos configurando tu cuenta de Instagram Business...
            </p>
            <Loader2 className="h-8 w-8 text-pink-500 animate-spin mx-auto mt-4" />
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center text-center space-y-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <h1 className="text-2xl font-bold">¡Conexión exitosa!</h1>
            <p className="text-gray-600">
              Tu cuenta de Instagram Business ha sido conectada correctamente a kalma.
            </p>
            <p className="text-sm text-gray-500">
              Serás redirigido automáticamente al dashboard en unos segundos...
            </p>
            <Button 
              onClick={() => navigate('/dashboard/social-networks')}
              className="w-full mt-4 bg-teal-600 hover:bg-teal-700"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver ahora al Dashboard
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
            <h1 className="text-2xl font-bold">Error de conexión</h1>
            <p className="text-gray-600">
              {errorMessage || 'No se pudo conectar tu cuenta de Instagram Business. Por favor, intenta nuevamente.'}
            </p>
            <div className="flex flex-col w-full gap-2 mt-4">
              <Button 
                onClick={() => navigate('/auth/instagram/start')}
                className="w-full bg-pink-500 hover:bg-pink-600"
              >
                Reintentar conexión
              </Button>
              <Button 
                onClick={() => navigate('/dashboard/social-networks')}
                variant="outline"
                className="w-full"
              >
                Volver al Dashboard
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstagramAuthCallback; 