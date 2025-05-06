import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Instagram } from 'lucide-react';

// Constantes de OAuth - ahora usando Facebook OAuth
const FACEBOOK_APP_ID = '925270751978648';
const INSTAGRAM_REDIRECT_URI = 'https://kalma-lab.netlify.app/.netlify/functions/instagram-callback';

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
      
      // Log de información de configuración para debugging
      console.log('Configuración de OAuth Facebook/Instagram:');
      console.log('- FACEBOOK_APP_ID:', FACEBOOK_APP_ID);
      console.log('- INSTAGRAM_REDIRECT_URI:', INSTAGRAM_REDIRECT_URI);
      console.log('- Usuario actual:', currentUser.uid);
      
      // Generamos un estado único con timestamp para prevenir CSRF
      const state = btoa(JSON.stringify({
        userId: currentUser.uid,
        timestamp: Date.now(),
        source: 'kalma-app'
      }));
      console.log('- Estado generado:', state);
      
      // Construir URL de autenticación de Facebook OAuth
      const oauthUrl = [
        'https://www.facebook.com/v17.0/dialog/oauth',
        `?client_id=${FACEBOOK_APP_ID}`,
        `&redirect_uri=${encodeURIComponent(INSTAGRAM_REDIRECT_URI)}`,
        '&response_type=code',
        '&scope=pages_show_list,instagram_basic,instagram_manage_comments',
        `&state=${state}`
      ].join('');
      
      // Mostrar URL completa para verificación
      console.log('URL de autenticación completa:', oauthUrl);
      console.log('Verificar que estamos usando facebook.com/v17.0/dialog/oauth');
      
      // Redireccionar a Facebook para autenticación
      window.location.href = oauthUrl;
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
            Te estamos redirigiendo a Facebook para conectar tu cuenta de Instagram...
          </p>
          <div className="mt-4">
            <Loader2 className="h-8 w-8 text-pink-500 animate-spin mx-auto" />
          </div>
          <div className="text-sm text-gray-500 mt-4">
            <p className="font-medium mb-2">Importante:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Inicia sesión con tu cuenta de Facebook</li>
              <li>Selecciona la cuenta de Instagram que deseas conectar</li>
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