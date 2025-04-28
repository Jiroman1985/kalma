import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { doc, getFirestore, updateDoc } from 'firebase/firestore';
import { AlertCircle, CheckCircle, ArrowLeft, Loader2, Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';
import axios from 'axios';

// Constantes de Instagram
const INSTAGRAM_CLIENT_ID = '2191864117935540';
const INSTAGRAM_CLIENT_SECRET = process.env.REACT_APP_INSTAGRAM_CLIENT_SECRET || '';
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/auth/instagram/callback`;

// Estados de conexión
type ConnectionStatus = 'loading' | 'success' | 'error';

const InstagramAuthCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<ConnectionStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

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

        // Verificar que recibimos un código válido
        if (!code) {
          setStatus('error');
          setErrorMessage('No se recibió un código válido de Instagram.');
          return;
        }

        // Verificar que el estado coincide con el ID del usuario actual
        if (state !== currentUser.uid) {
          setStatus('error');
          setErrorMessage('Error de validación de seguridad. Por favor, intenta nuevamente.');
          return;
        }

        // Intercambiar código por token de acceso
        const tokenResponse = await axios.post(
          'https://api.instagram.com/oauth/access_token',
          {
            client_id: INSTAGRAM_CLIENT_ID,
            client_secret: INSTAGRAM_CLIENT_SECRET,
            grant_type: 'authorization_code',
            redirect_uri: REDIRECT_URI,
            code: code
          },
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          }
        );

        if (!tokenResponse.data || !tokenResponse.data.access_token) {
          throw new Error('No se pudo obtener el token de acceso');
        }

        const accessToken = tokenResponse.data.access_token;
        const userId = tokenResponse.data.user_id;

        // Obtener información del perfil de usuario
        const profileResponse = await axios.get(
          `https://graph.instagram.com/me?fields=id,username&access_token=${accessToken}`
        );

        if (!profileResponse.data || !profileResponse.data.username) {
          throw new Error('No se pudo obtener la información del perfil');
        }

        const username = profileResponse.data.username;

        // Guardar los datos en Firestore
        const db = getFirestore();
        const userRef = doc(db, 'users', currentUser.uid);

        // Actualizar documento del usuario con los datos de Instagram
        await updateDoc(userRef, {
          'socialNetworks.instagram': {
            connected: true,
            userId: userId,
            username: username,
            accessToken: accessToken,
            connectedAt: new Date(),
          }
        });

        // Actualizar estado de éxito
        setStatus('success');
        
        // Mostrar notificación de éxito
        toast({
          title: "Conexión exitosa",
          description: `Tu cuenta de Instagram (@${username}) ha sido conectada correctamente`,
          variant: "default",
        });
      } catch (error) {
        console.error('Error al procesar callback de Instagram:', error);
        setStatus('error');
        setErrorMessage(
          error instanceof Error 
            ? error.message 
            : 'Ocurrió un error al conectar tu cuenta de Instagram'
        );
        
        toast({
          title: "Error de conexión",
          description: "No se pudo conectar tu cuenta de Instagram",
          variant: "destructive",
        });
      }
    };

    handleCallback();
  }, [currentUser, location.search, toast]);

  // Función para volver a la página de redes sociales
  const goToSocialNetworks = () => {
    navigate('/social-networks');
  };

  // Función para reintentar la conexión
  const retryConnection = () => {
    navigate('/auth/instagram/start');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
        {status === 'loading' && (
          <div className="flex flex-col items-center text-center space-y-3">
            <Instagram className="h-12 w-12 text-pink-500" />
            <h1 className="text-2xl font-bold">Conectando con Instagram</h1>
            <p className="text-gray-500">
              Estamos verificando y guardando tu conexión con Instagram...
            </p>
            <Loader2 className="h-8 w-8 text-pink-500 animate-spin mx-auto mt-4" />
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center text-center space-y-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <h1 className="text-2xl font-bold">¡Conexión exitosa!</h1>
            <p className="text-gray-600">
              Tu cuenta de Instagram ha sido conectada correctamente a AURA.
            </p>
            <Button 
              onClick={goToSocialNetworks}
              className="w-full mt-4 bg-teal-600 hover:bg-teal-700"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Redes Sociales
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
            <h1 className="text-2xl font-bold">Error de conexión</h1>
            <p className="text-gray-600">
              {errorMessage || 'No se pudo conectar tu cuenta de Instagram. Por favor, intenta nuevamente.'}
            </p>
            <div className="flex flex-col w-full gap-2 mt-4">
              <Button 
                onClick={retryConnection}
                className="w-full bg-pink-500 hover:bg-pink-600"
              >
                Reintentar conexión
              </Button>
              <Button 
                onClick={goToSocialNetworks}
                variant="outline"
                className="w-full"
              >
                Volver a Redes Sociales
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstagramAuthCallback; 