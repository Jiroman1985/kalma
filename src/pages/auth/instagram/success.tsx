import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Instagram, Check } from 'lucide-react';
import { toast } from 'sonner';

const InstagramAuthSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId');
  const instagramId = searchParams.get('instagramId');

  useEffect(() => {
    // Mostrar notificación de éxito
    toast.success('¡Cuenta de Instagram conectada exitosamente!', {
      description: 'Ahora puedes ver tus métricas en el dashboard.'
    });
    
    // Redireccionar al dashboard después de un tiempo
    const timer = setTimeout(() => {
      navigate('/dashboard/canales');
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [navigate]);

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