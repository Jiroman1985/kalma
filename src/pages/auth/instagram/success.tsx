import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Instagram, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // Asegúrate de que esta importación sea correcta según tu estructura

const InstagramAuthSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const userId = searchParams.get('userId') || currentUser?.uid;
  
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'success' | 'error'>('checking');
  const [message, setMessage] = useState('Verificando conexión...');

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
    toast.success('Cuenta conectada', {
      description: 'Verificando la conexión con Instagram...'
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
        
        // Verificar si tiene datos de Instagram
        if (userData.socialNetworks?.instagram?.connected) {
          setConnectionStatus('success');
          setMessage('Conexión exitosa con Instagram Business');
          
          toast.success('¡Instagram conectado!', {
            description: 'Tu cuenta de Instagram Business está conectada correctamente'
          });
          
          // Obtener páginas de Facebook/Instagram si no se han obtenido ya
          if (!userData.socialNetworks.instagram.pages) {
            try {
              // Llamar a nuestra función para obtener páginas
              fetch(`/.netlify/functions/instagram-get-pages?userId=${userId}`, {
                method: 'GET'
              });
              
              // No esperamos la respuesta para no bloquear la UI
              console.log('Solicitud de páginas iniciada');
            } catch (error) {
              console.error('Error al iniciar obtención de páginas:', error);
            }
          }
        } else {
          setConnectionStatus('error');
          setMessage('La conexión con Instagram no está completa');
        }
      } catch (error) {
        console.error('Error al verificar conexión:', error);
        setConnectionStatus('error');
        setMessage('Error al verificar el estado de la conexión');
      }
    };
    
    // Verificar la conexión
    verifyConnection();
    
    // Redireccionar al dashboard después de un tiempo
    const timer = setTimeout(() => {
      navigate('/dashboard/canales');
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [navigate, userId, currentUser]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className={`rounded-full p-3 ${
            connectionStatus === 'success' ? 'bg-green-100' : 
            connectionStatus === 'error' ? 'bg-red-100' : 'bg-blue-100'
          }`}>
            {connectionStatus === 'success' ? (
              <Check className="h-8 w-8 text-green-500" />
            ) : connectionStatus === 'error' ? (
              <AlertCircle className="h-8 w-8 text-red-500" />
            ) : (
              <span className="h-8 w-8 block rounded-full border-4 border-t-transparent border-blue-500 animate-spin" />
            )}
          </div>
          
          <h1 className="text-2xl font-bold">
            {connectionStatus === 'success' ? '¡Conexión Exitosa!' : 
             connectionStatus === 'error' ? 'Problema en la conexión' : 
             'Verificando conexión...'}
          </h1>
          
          <div className="flex items-center mt-2 space-x-2">
            <Instagram className="h-5 w-5 text-pink-500" />
            <p className="text-gray-700 font-medium">{message}</p>
          </div>
          
          <p className="text-gray-500 mt-4">
            {connectionStatus === 'success' ? 
              'Tu cuenta de Instagram ha sido conectada a Kalma. Ahora puedes acceder a tus métricas y gestionar tu presencia en redes sociales.' : 
              connectionStatus === 'error' ? 
              'Hubo un problema al conectar tu cuenta de Instagram. Por favor, inténtalo nuevamente.' :
              'Estamos verificando la conexión con Instagram. Esto puede tomar unos momentos...'}
          </p>
          
          <button 
            onClick={() => navigate('/dashboard/canales')}
            className={`mt-6 px-4 py-2 text-white rounded-md transition-colors ${
              connectionStatus === 'success' ? 'bg-indigo-600 hover:bg-indigo-700' : 
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