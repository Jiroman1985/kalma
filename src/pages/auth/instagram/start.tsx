import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Instagram } from 'lucide-react';

// IMPORTANTE: Usar directamente el client_id correcto para Instagram Business
// Ignoramos la variable de entorno para evitar errores de inyección
const INSTAGRAM_CLIENT_ID = '3029546990541926'; // ID correcto de la app Business de Instagram
// URL de redirección
const REDIRECT_URI = 'https://kalma-lab.netlify.app/.netlify/functions/instagram-callback';

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
      console.log('Configuración de OAuth Instagram:');
      console.log('- INSTAGRAM_CLIENT_ID:', INSTAGRAM_CLIENT_ID, '(asegúrate de que sea 3029546990541926)');
      console.log('- REDIRECT_URI:', REDIRECT_URI);
      console.log('- Usuario actual:', currentUser.uid);
      
      // Generamos un estado único con timestamp para prevenir CSRF
      const state = btoa(JSON.stringify({
        userId: currentUser.uid,
        timestamp: Date.now(),
        source: 'kalma-app'
      }));
      console.log('- Estado generado:', state);
      
      // *** CAMBIO PRINCIPAL: Usar Facebook Login en lugar de Instagram Basic Display ***
      // Construir URL de autenticación de Facebook para Instagram Business
      const authURL = new URL('https://www.facebook.com/v16.0/dialog/oauth');
      
      // Agregar parámetros con scopes específicos para Instagram Business
      authURL.searchParams.append('client_id', INSTAGRAM_CLIENT_ID);
      authURL.searchParams.append('redirect_uri', REDIRECT_URI);
      authURL.searchParams.append('response_type', 'code');
      authURL.searchParams.append(
        'scope',
        [
          'pages_show_list',          // necesario para listar páginas
          'instagram_basic',          // perfil e imágenes
          'instagram_manage_comments',// moderación de comentarios
          'instagram_manage_messages' // mensajes
        ].join(',')
      );
      authURL.searchParams.append('state', state);
      
      // Mostrar URL completa para verificación
      console.log('URL de autenticación completa:', authURL.toString());
      console.log('Verificar que ahora usamos facebook.com en lugar de api.instagram.com');
      
      // Redireccionar a Facebook para autenticación de Instagram Business
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
            Te estamos redirigiendo a Facebook para conectar tu cuenta de Instagram Business...
          </p>
          <div className="mt-4">
            <Loader2 className="h-8 w-8 text-pink-500 animate-spin mx-auto" />
          </div>
          <div className="text-sm text-gray-500 mt-4">
            <p className="font-medium mb-2">Importante:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Inicia sesión con tu cuenta de Facebook asociada a Instagram</li>
              <li>Selecciona la página de Facebook conectada a tu cuenta profesional de Instagram</li>
              <li>Autoriza los permisos solicitados para Instagram Business</li>
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