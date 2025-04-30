import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { handleOAuthCallback } from '@/lib/n8nService';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';

const OAuthCallback: React.FC = () => {
  const { platform = '' } = useParams<{ platform: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const processOAuthCallback = async () => {
      try {
        // Extraer code y state de la URL
        const params = new URLSearchParams(location.search);
        const code = params.get('code');
        const state = params.get('state');
        
        if (!code || !state) {
          setStatus('error');
          setErrorMessage('Parámetros de autenticación incompletos o inválidos');
          toast({
            title: 'Error de autenticación',
            description: 'No se recibieron los parámetros necesarios del proveedor',
            variant: 'destructive',
          });
          return;
        }
        
        // Procesar el callback
        const result = await handleOAuthCallback(code, state);
        
        if (!result) {
          setStatus('error');
          setErrorMessage('No se pudo completar la autenticación');
          toast({
            title: 'Error de autenticación',
            description: 'No se pudo procesar la respuesta del proveedor',
            variant: 'destructive',
          });
          return;
        }
        
        // Éxito
        setStatus('success');
        toast({
          title: 'Conexión exitosa',
          description: `Tu cuenta de ${platform.charAt(0).toUpperCase() + platform.slice(1)} ha sido conectada correctamente`,
        });
        
        // Redirigir después de 2 segundos
        setTimeout(() => {
          navigate('/dashboard/social-networks');
        }, 2000);
      } catch (error) {
        console.error('Error al procesar callback OAuth:', error);
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Error desconocido');
        toast({
          title: 'Error de autenticación',
          description: 'Ocurrió un error al procesar la autenticación',
          variant: 'destructive',
        });
      }
    };
    
    processOAuthCallback();
  }, [location, platform, toast, navigate]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-6">
            {status === 'processing' && 'Procesando autenticación...'}
            {status === 'success' && '¡Conexión exitosa!'}
            {status === 'error' && 'Error de autenticación'}
          </h1>
          
          {status === 'processing' && (
            <div className="flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-teal-600" />
              <p className="text-gray-600">
                Estamos procesando tu autenticación con {platform}, por favor espera un momento...
              </p>
            </div>
          )}
          
          {status === 'success' && (
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-600">
                Tu cuenta de {platform} ha sido conectada exitosamente a kalma.
              </p>
              <p className="text-sm text-gray-500">
                Serás redirigido automáticamente en unos segundos...
              </p>
            </div>
          )}
          
          {status === 'error' && (
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-gray-600">
                No pudimos conectar tu cuenta de {platform}.
              </p>
              {errorMessage && (
                <p className="text-sm text-red-500 mb-4">
                  Error: {errorMessage}
                </p>
              )}
              <Button 
                onClick={() => navigate('/dashboard/social-networks')}
                className="bg-teal-600 hover:bg-teal-700"
              >
                Volver a Social Networks
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OAuthCallback; 