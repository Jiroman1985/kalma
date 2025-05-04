import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Instagram } from 'lucide-react';

// Usa el CLIENT_ID del entorno o el valor predeterminado
const INSTAGRAM_CLIENT_ID = import.meta.env.VITE_INSTAGRAM_CLIENT_ID || '674580881831928';
// Asegúrate de que la URL de redirección esté correctamente formateada y coincide con la registrada en la App de Meta
const REDIRECT_URI = 'https://kalma-lab.netlify.app/auth/instagram/callback';

const InstagramAuthStart = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  
  useEffect(() => {
    const startOAuthFlow = () => {
      if (!currentUser) {
        toast({
          title: "Error de autenticación",
          description: "Debes iniciar sesión para conectar Instagram",
          variant: "destructive",
        });
        navigate('/login');
        return;
      }
      
      // Log del redirect_uri para debugging
      console.log('REDIRECT_URI usado en frontend:', REDIRECT_URI);
      
      // Generamos un estado único con timestamp para prevenir CSRF
      const state = btoa(JSON.stringify({
        userId: currentUser.uid,
        timestamp: Date.now(),
        source: 'kalma-app'
      }));
      
      // Construir URL de autenticación de Instagram
      const authURL = new URL('https://api.instagram.com/oauth/authorize');
      
      // Agregar parámetros requeridos
      const params = {
        client_id: INSTAGRAM_CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        response_type: 'code',
        scope: 'user_profile,user_media',
        state: state
      };
      
      // Adjuntar los parámetros a la URL
      Object.entries(params).forEach(([key, value]) => {
        authURL.searchParams.append(key, value);
      });
      
      console.log('URL de autenticación construida:', authURL.toString());
      
      // Redireccionar a Instagram para autenticación
      window.location.href = authURL.toString();
    };
    
    // Iniciar flujo de autenticación después de un breve retraso
    const timer = setTimeout(() => {
      startOAuthFlow();
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [currentUser, navigate, toast]);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
        <div className="flex flex-col items-center text-center space-y-3">
          <Instagram className="h-12 w-12 text-pink-500" />
          <h1 className="text-2xl font-bold">Conectando con Instagram</h1>
          <p className="text-gray-500">
            Te estamos redirigiendo a Instagram para conectar tu cuenta...
          </p>
          <div className="mt-4">
            <Loader2 className="h-8 w-8 text-pink-500 animate-spin mx-auto" />
          </div>
          <div className="text-sm text-gray-500 mt-4">
            <p className="font-medium mb-2">Importante:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Inicia sesión con tu cuenta de Instagram</li>
              <li>Autoriza a kalma para acceder a tu información básica</li>
              <li>Serás redirigido automáticamente a kalma después de autorizar</li>
            </ul>
          </div>
          <button 
            onClick={() => navigate('/dashboard/canales')}
            className="mt-4 text-sm text-gray-500 hover:text-gray-700"
          >
            Cancelar y volver al Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstagramAuthStart; 