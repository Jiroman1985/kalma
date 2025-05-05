import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Instagram, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const InstagramAuthSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId');
  const instagramId = searchParams.get('instagramId');
  const accessToken = searchParams.get('accessToken');
  const [subscriptionStatus, setSubscriptionStatus] = useState<'pending' | 'success' | 'error'>('pending');

  useEffect(() => {
    // Mostrar notificación de éxito
    toast.success('¡Cuenta de Instagram conectada exitosamente!', {
      description: 'Configurando webhooks y preparando todo...'
    });
    
    const subscribe = async () => {
      if (accessToken && instagramId) {
        try {
          // Llamar a nuestra función serverless para suscribir la cuenta
          const response = await fetch('/.netlify/functions/instagram-subscribe-account', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              accessToken,
              instagramUserId: instagramId
            }),
          });
          
          const data = await response.json();
          
          if (response.ok && data.success) {
            setSubscriptionStatus('success');
            toast.success('Webhooks configurados correctamente', {
              description: 'Tu cuenta de Instagram está completamente conectada.'
            });
          } else {
            console.warn('Error al suscribir webhooks:', data);
            setSubscriptionStatus('error');
            toast.warning('Configuración parcial', {
              description: 'Tu cuenta está conectada, pero los webhooks podrían no funcionar.'
            });
          }
        } catch (error) {
          console.error('Error al llamar función de suscripción:', error);
          setSubscriptionStatus('error');
        }
      } else {
        console.warn('No hay accessToken o instagramId disponibles para suscripción');
        setSubscriptionStatus('error');
      }
    };
    
    // Intentar suscribir la cuenta
    subscribe();
    
    // Redireccionar al dashboard después de un tiempo
    const timer = setTimeout(() => {
      navigate('/dashboard/canales');
    }, 5000); // Aumentado a 5 segundos para dar tiempo a la suscripción
    
    return () => clearTimeout(timer);
  }, [navigate, accessToken, instagramId]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="rounded-full bg-green-100 p-3">
            <Check className="h-8 w-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold">¡Conexión Exitosa!</h1>
          
          <div className="flex items-center mt-2 space-x-2">
            <Instagram className="h-5 w-5 text-pink-500" />
            <p className="text-gray-700 font-medium">Instagram conectado correctamente</p>
          </div>
          
          <p className="text-gray-500 mt-4">
            Tu cuenta de Instagram ha sido conectada exitosamente a Kalma. 
            Ahora puedes acceder a tus métricas y gestionar tu presencia en redes sociales.
          </p>
          
          {/* Estado de suscripción a webhooks */}
          <div className={`mt-4 px-4 py-3 rounded-md ${
            subscriptionStatus === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
            subscriptionStatus === 'error' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
            'bg-blue-50 text-blue-700 border border-blue-200'
          }`}>
            <div className="flex items-center space-x-2">
              {subscriptionStatus === 'success' ? (
                <Check className="h-4 w-4" />
              ) : subscriptionStatus === 'error' ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <span className="h-4 w-4 block rounded-full border-2 border-t-transparent border-blue-500 animate-spin" />
              )}
              <span>
                {subscriptionStatus === 'success' ? 'Webhooks configurados correctamente' :
                 subscriptionStatus === 'error' ? 'Configuración parcial (sin webhooks)' :
                 'Configurando webhooks...'}
              </span>
            </div>
          </div>
          
          <button 
            onClick={() => navigate('/dashboard/canales')}
            className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Ir al Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstagramAuthSuccess; 