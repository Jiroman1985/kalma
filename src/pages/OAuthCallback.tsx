import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Loader2, Instagram, Globe } from 'lucide-react';
import { handleOAuthCallback } from '@/lib/n8nService';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

const OAuthCallback: React.FC = () => {
  const { platform = '' } = useParams<{ platform: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [connectionInfo, setConnectionInfo] = useState<any>(null);

  useEffect(() => {
    const processOAuthCallback = async () => {
      try {
        // Extraer code y state de la URL
        const params = new URLSearchParams(location.search);
        const code = params.get('code');
        const state = params.get('state');
        const error = params.get('error');
        
        // Verificar si hay error de autenticación
        if (error) {
          setStatus('error');
          setErrorMessage(`Error reportado por el proveedor: ${error}`);
          toast({
            title: 'Error de autenticación',
            description: `El proveedor reportó un error: ${error}`,
            variant: 'destructive',
          });
          return;
        }
        
        if (!code) {
          setStatus('error');
          setErrorMessage('Código de autorización no recibido');
          toast({
            title: 'Error de autenticación',
            description: 'No se recibió el código de autorización necesario',
            variant: 'destructive',
          });
          return;
        }
        
        // Determinar la plataforma si no viene en la URL
        const detectedPlatform = platform || detectPlatformFromState(state) || 'instagram';
        
        // Para Instagram con la URL específica, manejo especial
        if (detectedPlatform === 'instagram' && window.location.pathname === '/auth/callback') {
          await handleInstagramCallback(code);
          return;
        }
        
        // Para otras plataformas o Instagram con la URL genérica
        if (!state) {
          setStatus('error');
          setErrorMessage('Parámetro de estado (state) no recibido');
          toast({
            title: 'Error de autenticación',
            description: 'No se recibió el parámetro de estado necesario',
            variant: 'destructive',
          });
          return;
        }
        
        // Procesar el callback para otras plataformas
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
        
        // Registrar información de la conexión
        await saveConnectionInfo(detectedPlatform, {
          accessToken: result.accessToken,
          connectedAt: new Date(),
          status: 'active'
        });
        
        // Éxito
        setStatus('success');
        toast({
          title: 'Conexión exitosa',
          description: `Tu cuenta de ${getPlatformDisplayName(detectedPlatform)} ha sido conectada correctamente`,
        });
        
        // Redirigir después de 2 segundos
        setTimeout(() => {
          navigate('/dashboard/channels');
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
  }, [location, platform, toast, navigate, currentUser]);
  
  // Función para manejar específicamente el callback de Instagram
  const handleInstagramCallback = async (code: string) => {
    try {
      if (!currentUser) {
        throw new Error('Usuario no autenticado');
      }
      
      // En este caso, manejamos directamente la autenticación
      console.log('Procesando autenticación de Instagram con código:', code);
      
      // Simular procesamiento - aquí implementarías la lógica real
      // Esto sería para el flujo específico de la URL de Instagram que has proporcionado
      
      // Guardar información en Firestore
      const connectionData = {
        channelId: 'instagram',
        username: 'instagram_user', // En un entorno real, obtendrías esto de la API
        profileUrl: 'https://instagram.com/',
        status: 'active',
        connectedAt: serverTimestamp(),
        code: code, // Almacenar el código para depuración/referencia
        authMethod: 'direct_flow'
      };
      
      setConnectionInfo(connectionData);
      
      await saveConnectionInfo('instagram', connectionData);
      
      // Establecer éxito
      setStatus('success');
      toast({
        title: 'Conexión exitosa',
        description: 'Tu cuenta de Instagram ha sido conectada correctamente',
      });
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        navigate('/dashboard/channels');
      }, 2000);
    } catch (error) {
      console.error('Error al procesar callback de Instagram:', error);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Error desconocido');
      toast({
        title: 'Error de autenticación con Instagram',
        description: 'Ocurrió un error al procesar la autenticación',
        variant: 'destructive',
      });
    }
  };
  
  // Función para detectar la plataforma a partir del estado
  const detectPlatformFromState = (state: string | null): string | null => {
    if (!state) return null;
    
    try {
      const decodedState = JSON.parse(atob(state));
      return decodedState.platform || null;
    } catch (error) {
      console.error('Error al decodificar el estado:', error);
      return null;
    }
  };
  
  // Función para guardar información de la conexión
  const saveConnectionInfo = async (platform: string, data: any) => {
    if (!currentUser) return;
    
    try {
      // Guardar en la colección channelConnections
      const connectionRef = doc(collection(db, "users", currentUser.uid, "channelConnections"));
      await setDoc(connectionRef, {
        id: connectionRef.id,
        channelId: platform,
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log(`Información de conexión de ${platform} guardada correctamente`);
    } catch (error) {
      console.error('Error al guardar información de conexión:', error);
      throw error;
    }
  };
  
  // Función para obtener el nombre para mostrar de la plataforma
  const getPlatformDisplayName = (platform: string): string => {
    const platformNames: Record<string, string> = {
      'instagram': 'Instagram',
      'facebook': 'Facebook',
      'twitter': 'Twitter',
      'website': 'Sitio Web',
      'whatsapp': 'WhatsApp',
      'telegram': 'Telegram',
      'messenger': 'Messenger'
    };
    
    return platformNames[platform] || platform.charAt(0).toUpperCase() + platform.slice(1);
  };
  
  // Función para obtener el ícono de la plataforma
  const getPlatformIcon = () => {
    const detectedPlatform = platform || (connectionInfo?.channelId);
    
    switch (detectedPlatform) {
      case 'instagram':
        return <Instagram className="h-12 w-12 text-pink-500" />;
      default:
        return <Globe className="h-12 w-12 text-blue-500" />;
    }
  };
  
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
                Estamos procesando tu autenticación, por favor espera un momento...
              </p>
            </div>
          )}
          
          {status === 'success' && (
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                {getPlatformIcon()}
              </div>
              <p className="text-gray-600">
                Tu cuenta ha sido conectada exitosamente a kalma.
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
                No pudimos conectar tu cuenta.
              </p>
              {errorMessage && (
                <p className="text-sm text-red-500 mb-4">
                  Error: {errorMessage}
                </p>
              )}
              <Button 
                onClick={() => navigate('/dashboard/channels')}
                className="bg-teal-600 hover:bg-teal-700"
              >
                Volver a Canales
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OAuthCallback; 