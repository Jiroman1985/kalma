import React, { useState } from 'react';
import Nango from '@nangohq/frontend';
import { createNangoSessionToken } from '../api/nango';
import { useToast } from './ui/use-toast';

interface NangoConnectProps {
  userId: string;
  provider: string;
  buttonText?: string;
  onSuccess?: (connectionId: string, providerConfigKey: string) => void;
  onError?: (error: any) => void;
  className?: string;
}

// Definir los tipos para los eventos de Nango
interface NangoConnectEvent {
  type: string;
  payload?: any;
}

const NangoConnect: React.FC<NangoConnectProps> = ({
  userId,
  provider,
  buttonText = 'Conectar servicio',
  onSuccess,
  onError,
  className = 'bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300'
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      
      // 1. Obtener token de sesión
      const result = await createNangoSessionToken(userId, [provider]);
      
      if (!result.success) {
        throw new Error(result.error || 'Error al obtener token de sesión');
      }
      
      // 2. Iniciar flujo de conexión con Nango (usando solo el token de sesión)
      const nango = new Nango();
      
      const connect = nango.openConnectUI({
        onEvent: (event: any) => {
          if (event.type === 'connect') {
            console.log('Conexión exitosa:', event.payload);
            toast({
              title: "Conexión exitosa",
              description: `Servicio conectado correctamente.`,
              variant: "default",
            });
            
            // Llamar al callback si existe
            if (onSuccess && event.payload) {
              onSuccess(event.payload.connectionId, event.payload.providerConfigKey);
            }
          } else if (event.type === 'error') {
            console.error('Error de conexión:', event.payload);
            toast({
              title: "Error de conexión",
              description: event.payload?.message || 'No se pudo establecer la conexión',
              variant: "destructive",
            });
            
            if (onError) {
              onError(event.payload);
            }
          } else if (event.type === 'close') {
            setIsConnecting(false);
          }
        }
      });
      
      connect.setSessionToken(result.token);
    } catch (error) {
      console.error('Error al iniciar conexión:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Error al iniciar la conexión',
        variant: "destructive",
      });
      setIsConnecting(false);
      
      if (onError) {
        onError(error);
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleConnect}
      disabled={isConnecting}
      className={`${className} ${isConnecting ? 'opacity-70 cursor-not-allowed' : ''}`}
    >
      {isConnecting ? 'Conectando...' : buttonText}
    </button>
  );
};

export default NangoConnect; 