import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Instagram } from 'lucide-react';

const INSTAGRAM_CLIENT_ID = '925270751978648';
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/auth/instagram/callback`;

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
      
      // Construir URL de autenticación Instagram con parámetros requeridos
      const authURL = new URL('https://www.facebook.com/v18.0/dialog/oauth');
      
      // Agregar parámetros requeridos
      const params = {
        client_id: INSTAGRAM_CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        scope: 'instagram_basic,pages_show_list,instagram_manage_messages,instagram_manage_comments,instagram_manage_insights',
        response_type: 'code',
        state: currentUser.uid,
        display: 'popup',
        auth_type: 'rerequest',
        sdk: 'joey'
      };
      
      Object.entries(params).forEach(([key, value]) => {
        authURL.searchParams.append(key, value);
      });
      
      // Abrir en una ventana emergente
      const width = 600;
      const height = 600;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      window.open(
        authURL.toString(),
        'Instagram Auth',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
      );
    };
    
    // Iniciar flujo de autenticación después de un breve retraso
    const timer = setTimeout(() => {
      startOAuthFlow();
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [currentUser, navigate, toast]);
  
  // Botón para cancelar y volver al dashboard
  const handleCancel = () => {
    navigate('/dashboard/social-networks');
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
        <div className="flex flex-col items-center text-center space-y-3">
          <Instagram className="h-12 w-12 text-pink-500" />
          <h1 className="text-2xl font-bold">Conectando con Instagram</h1>
          <p className="text-gray-500">
            Estamos redireccionándote a Instagram para conectar tu cuenta con AURA...
          </p>
          <div className="mt-4">
            <Loader2 className="h-8 w-8 text-pink-500 animate-spin mx-auto" />
          </div>
          <button 
            onClick={handleCancel}
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