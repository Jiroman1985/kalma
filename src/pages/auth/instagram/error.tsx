import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Instagram, AlertTriangle } from 'lucide-react';

// Mapeo de códigos de error a mensajes amigables
const errorMessages: Record<string, string> = {
  missing_code: "No se recibió el código de autorización de Instagram",
  missing_state: "Falta el parámetro de estado en la respuesta",
  invalid_state: "El estado de la solicitud es inválido o ha sido manipulado",
  expired_state: "La solicitud ha expirado. Por favor, intenta nuevamente",
  missing_user_id: "No se pudo determinar el usuario para la conexión",
  token_error: "Error al obtener el token de acceso",
  instagram_error: "Instagram reportó un error en la autenticación",
  long_token_error: "Error al obtener el token de larga duración",
  long_token_instagram_error: "Instagram reportó un error con el token de larga duración",
  database_error: "Error al guardar los datos en la base de datos",
  user_not_found: "No se encontró el usuario en la base de datos",
  server_error: "Error interno del servidor"
};

const InstagramAuthError = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const errorCode = searchParams.get('code') || 'unknown_error';
  const errorMessage = searchParams.get('message');
  
  const [timeLeft, setTimeLeft] = useState(10);
  
  useEffect(() => {
    // Redireccionar al dashboard después de 10 segundos
    if (timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      navigate('/dashboard/canales');
    }
  }, [timeLeft, navigate]);

  // Obtener mensaje amigable basado en el código
  const friendlyMessage = errorMessages[errorCode] || "Ha ocurrido un error inesperado";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="rounded-full bg-red-100 p-3">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold">Error de Conexión</h1>
          
          <div className="flex items-center mt-2 space-x-2">
            <Instagram className="h-5 w-5 text-pink-500" />
            <p className="text-gray-700 font-medium">No se pudo conectar Instagram</p>
          </div>
          
          <div className="mt-4 p-4 bg-red-50 rounded-md border border-red-200 text-left">
            <p className="text-red-700 font-medium">
              {friendlyMessage}
            </p>
            {errorMessage && (
              <p className="text-sm text-red-600 mt-1">
                Detalles: {errorMessage}
              </p>
            )}
          </div>
          
          <p className="text-gray-500 mt-4">
            Puedes intentar nuevamente o contactar a soporte si el problema persiste.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <button 
              onClick={() => navigate('/auth/instagram/start')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Intentar Nuevamente
            </button>
            
            <button 
              onClick={() => navigate('/dashboard/canales')}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            >
              Volver al Dashboard ({timeLeft}s)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstagramAuthError; 