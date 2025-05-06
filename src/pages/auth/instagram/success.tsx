import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Instagram, Check, AlertCircle, Facebook } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface InstagramData {
  connected?: boolean;
  connectionType?: string;
  fbAccessToken?: string;
  igAccessToken?: string;
  instagramBusinessId?: string;
  needsSetup?: boolean;
  pageId?: string;
  pageName?: string;
}

const InstagramAuthSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const userId = searchParams.get('userId') || currentUser?.uid;
  const instagramId = searchParams.get('instagramId');
  
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'success' | 'partial' | 'error'>('checking');
  const [message, setMessage] = useState('Verificando conexión...');
  const [connectionDetails, setConnectionDetails] = useState<string[]>([]);

  useEffect(() => {
    if (!userId) {
      toast.error('Error de autenticación', {
        description: 'No se pudo identificar el usuario'
      });
      setConnectionStatus('error');
      setMessage('No se pudo identificar el usuario');
      return;
    }

    // Mostrar notificación inicial
    toast.success('Conexión iniciada', {
      description: 'Verificando datos en la base de datos...'
    });
    
    const verifyConnection = async () => {
      try {
        // Verificar en Firestore si la conexión se completó
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          setConnectionStatus('error');
          setMessage('No se encontró información del usuario');
          return;
        }
        
        const userData = userSnap.data();
        const instagramData: InstagramData = userData.socialNetworks?.instagram || {};
        
        // NUEVA VERIFICACIÓN: También checar en socialTokens/instagram
        let socialTokenRef;
        let socialTokenSnap;
        let tokenData = null;
        
        try {
          socialTokenRef = doc(db, 'users', userId, 'socialTokens', 'instagram');
          socialTokenSnap = await getDoc(socialTokenRef);
          if (socialTokenSnap.exists()) {
            tokenData = socialTokenSnap.data();
            console.log('Datos encontrados en socialTokens/instagram:', Object.keys(tokenData));
          }
        } catch (tokenError) {
          console.error('Error al verificar socialTokens:', tokenError);
        }
        
        // Verificar si tiene datos básicos de Facebook/Instagram
        if (instagramData.connected || tokenData?.accessToken) {
          // Preparar detalles de la conexión
          const details: string[] = [];
          
          // Verificar si tiene token de Facebook
          if (instagramData.fbAccessToken) {
            details.push('✅ Token de Facebook obtenido correctamente');
          } else {
            details.push('❌ No se encontró token de Facebook');
          }
          
          // Verificar si tiene token específico de Instagram
          if (instagramData.igAccessToken || tokenData?.accessToken) {
            details.push('✅ Token específico de Instagram obtenido');
          } else {
            details.push('❌ No se obtuvo token específico de Instagram');
          }
          
          // Verificar si tiene ID de Instagram Business
          if (instagramData.instagramBusinessId || tokenData?.instagramUserId) {
            details.push(`✅ Cuenta de Instagram Business identificada${instagramData.pageName ? ` (${instagramData.pageName})` : ''}`);
          } else {
            details.push('❌ No se encontró cuenta de Instagram Business asociada');
          }
          
          setConnectionDetails(details);
          
          // Determinar tipo de conexión
          if ((instagramData.connectionType === 'business' && instagramData.instagramBusinessId) || 
              (tokenData?.accessToken && tokenData?.instagramUserId)) {
            setConnectionStatus('success');
            setMessage('Conexión completa con Instagram Business');
            
            toast.success('¡Instagram conectado!', {
              description: 'Tu cuenta de Instagram Business está conectada correctamente'
            });
          } else {
            setConnectionStatus('partial');
            setMessage('Conexión parcial con Instagram');
            
            toast.warning('Conexión parcial', {
              description: 'Se conectó parcialmente tu cuenta. Algunos datos podrían no estar disponibles.'
            });
          }
        } else {
          setConnectionStatus('error');
          setMessage('La conexión con Instagram no está completa');
          setConnectionDetails(['❌ No hay datos de conexión válidos en la base de datos']);
        }
      } catch (error) {
        console.error('Error al verificar conexión:', error);
        setConnectionStatus('error');
        setMessage('Error al verificar el estado de la conexión');
        setConnectionDetails(['❌ Ocurrió un error inesperado']);
      }
    };
    
    // Verificar la conexión
    verifyConnection();
    
    // Redireccionar al dashboard después de un tiempo
    const timer = setTimeout(() => {
      navigate('/dashboard/channels');
    }, 8000); // Tiempo aumentado para dar más tiempo para leer los detalles
    
    return () => clearTimeout(timer);
  }, [navigate, userId, instagramId, currentUser]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className={`rounded-full p-3 ${
            connectionStatus === 'success' ? 'bg-green-100' : 
            connectionStatus === 'partial' ? 'bg-yellow-100' :
            connectionStatus === 'error' ? 'bg-red-100' : 'bg-blue-100'
          }`}>
            {connectionStatus === 'success' ? (
              <Check className="h-8 w-8 text-green-500" />
            ) : connectionStatus === 'partial' ? (
              <Instagram className="h-8 w-8 text-yellow-500" />
            ) : connectionStatus === 'error' ? (
              <AlertCircle className="h-8 w-8 text-red-500" />
            ) : (
              <span className="h-8 w-8 block rounded-full border-4 border-t-transparent border-blue-500 animate-spin" />
            )}
          </div>
          
          <h1 className="text-2xl font-bold">
            {connectionStatus === 'success' ? '¡Conexión Exitosa!' : 
             connectionStatus === 'partial' ? 'Conexión Parcial' :
             connectionStatus === 'error' ? 'Problema en la conexión' : 
             'Verificando conexión...'}
          </h1>
          
          <div className="flex items-center mt-2 space-x-2">
            <Instagram className="h-5 w-5 text-pink-500" />
            <p className="text-gray-700 font-medium">{message}</p>
          </div>
          
          {/* Detalles de la conexión */}
          {connectionDetails.length > 0 && (
            <div className="mt-4 w-full text-left bg-gray-50 rounded-md p-3 border border-gray-200">
              <p className="font-medium text-sm mb-2">Detalles de la conexión:</p>
              <ul className="text-sm space-y-1">
                {connectionDetails.map((detail, index) => (
                  <li key={index}>{detail}</li>
                ))}
              </ul>
            </div>
          )}
          
          <p className="text-gray-500 mt-4">
            {connectionStatus === 'success' ? 
              'Tu cuenta de Instagram ha sido conectada a Kalma. Ahora puedes acceder a tus métricas y gestionar tu presencia en redes sociales.' : 
              connectionStatus === 'partial' ?
              'Se ha conectado parcialmente tu cuenta de Instagram. Algunas funciones podrían estar limitadas. Intenta reiniciar el proceso si necesitas acceso completo.' :
              connectionStatus === 'error' ? 
              'Hubo un problema al conectar tu cuenta de Instagram. Por favor, inténtalo nuevamente.' :
              'Estamos verificando la conexión con Instagram. Esto puede tomar unos momentos...'}
          </p>
          
          <button 
            onClick={() => navigate('/dashboard/channels')}
            className={`mt-6 px-4 py-2 text-white rounded-md transition-colors ${
              connectionStatus === 'success' ? 'bg-indigo-600 hover:bg-indigo-700' : 
              connectionStatus === 'partial' ? 'bg-yellow-500 hover:bg-yellow-600' :
              connectionStatus === 'error' ? 'bg-red-500 hover:bg-red-600' : 
              'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {connectionStatus === 'error' ? 'Volver e intentar de nuevo' : 'Ir al Dashboard'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstagramAuthSuccess; 