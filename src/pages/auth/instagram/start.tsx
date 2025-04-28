import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Instagram } from 'lucide-react';

const INSTAGRAM_CLIENT_ID = '2191864117935540';
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
      const authURL = new URL('https://api.instagram.com/oauth/authorize');
      
      // Agregar parámetros requeridos
      const params = {
        client_id: INSTAGRAM_CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        scope: 'user_profile,user_media', // Permisos básicos requeridos
        response_type: 'code',
        state: currentUser.uid, // Usar el ID del usuario como estado para verificar después
      };
      
      Object.entries(params).forEach(([key, value]) => {
        authURL.searchParams.append(key, value);
      });
      
      // Redireccionar al usuario a la URL de autenticación de Instagram
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
            Estamos redireccionándote a Instagram para conectar tu cuenta con AURA...
          </p>
          <div className="mt-4">
            <Loader2 className="h-8 w-8 text-pink-500 animate-spin mx-auto" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstagramAuthStart; 