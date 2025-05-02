import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Instagram } from 'lucide-react';

const INSTAGRAM_CLIENT_ID = process.env.REACT_APP_INSTAGRAM_CLIENT_ID || '674580881831928';
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/auth/instagram/callback`;

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
      
      // Construir URL de autenticación de Instagram
      const authURL = new URL('https://www.instagram.com/oauth/authorize');
      
      // Agregar parámetros requeridos
      const params = {
        client_id: INSTAGRAM_CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        response_type: 'code',
        scope: 'instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments,instagram_business_content_publish,instagram_business_manage_insights',
        state: currentUser.uid,
        enable_fb_login: '0',
        force_authentication: '1'
      };
      
      Object.entries(params).forEach(([key, value]) => {
        authURL.searchParams.append(key, value);
      });
      
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
          <h1 className="text-2xl font-bold">Conectando con Instagram Business</h1>
          <p className="text-gray-500">
            Te estamos redirigiendo a Instagram para conectar tu cuenta de Instagram Business...
          </p>
          <div className="mt-4">
            <Loader2 className="h-8 w-8 text-pink-500 animate-spin mx-auto" />
          </div>
          <div className="text-sm text-gray-500 mt-4">
            <p className="font-medium mb-2">Importante:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Necesitas una cuenta de Instagram Business</li>
              <li>La cuenta debe estar vinculada a una página de Facebook</li>
              <li>Debes ser administrador de la página de Facebook</li>
            </ul>
          </div>
          <button 
            onClick={() => navigate('/dashboard/social-networks')}
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