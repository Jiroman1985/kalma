import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { doc, getDoc, updateDoc, setDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  Facebook, 
  Instagram, 
  Twitter, 
  Linkedin, 
  Mail,
  Star,
  Loader2
} from "lucide-react";
import { initiateOAuthFlow, isConnectedToPlatform, disconnectPlatform } from "@/lib/n8nService";

interface OAuthConnectorProps {
  platform: string;
  accountId?: string;
  onConnected?: () => void;
  size?: "sm" | "default" | "lg";
}

// Este componente gestionará la conexión OAuth con diferentes plataformas
// En la versión inicial, simulará el proceso, pero está preparado para integrarse con OAuth real
const OAuthConnector: React.FC<OAuthConnectorProps> = ({ 
  platform, 
  accountId, 
  onConnected,
  size = "default"
}) => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [connecting, setConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar estado de conexión al cargar el componente
  useEffect(() => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }

    const checkConnectionStatus = async () => {
      try {
        const connected = await isConnectedToPlatform(currentUser.uid, platform);
        setIsConnected(connected);
      } catch (error) {
        console.error("Error al verificar estado de conexión:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkConnectionStatus();
  }, [currentUser, platform]);

  // Obtener información de configuración según la plataforma
  const getPlatformConfig = () => {
    switch (platform.toLowerCase()) {
      case 'facebook':
        return {
          name: 'Facebook',
          icon: <Facebook className="h-4 w-4 mr-2" />,
          color: 'bg-blue-600 hover:bg-blue-700 text-white'
        };
      case 'instagram':
        return {
          name: 'Instagram',
          icon: <Instagram className="h-4 w-4 mr-2" />,
          color: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
        };
      case 'twitter':
        return {
          name: 'Twitter',
          icon: <Twitter className="h-4 w-4 mr-2" />,
          color: 'bg-blue-400 hover:bg-blue-500 text-white'
        };
      case 'linkedin':
        return {
          name: 'LinkedIn',
          icon: <Linkedin className="h-4 w-4 mr-2" />,
          color: 'bg-blue-800 hover:bg-blue-900 text-white'
        };
      case 'gmail':
        return {
          name: 'Gmail',
          icon: <Mail className="h-4 w-4 mr-2" />,
          color: 'bg-red-500 hover:bg-red-600 text-white'
        };
      case 'googlereviews':
        return {
          name: 'Google Reviews',
          icon: <Star className="h-4 w-4 mr-2" />,
          color: 'bg-yellow-500 hover:bg-yellow-600 text-white'
        };
      default:
        return {
          name: platform,
          icon: null,
          color: 'bg-gray-600 hover:bg-gray-700 text-white'
        };
    }
  };

  const config = getPlatformConfig();

  // Iniciar el proceso de conexión OAuth
  const initiateOAuth = async () => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para conectar tus cuentas",
        variant: "destructive"
      });
      return;
    }

    setConnecting(true);

    try {
      // Iniciar el flujo OAuth
      toast({
        title: "Conectando...",
        description: `Redirigiendo a la página de autorización de ${config.name}`,
      });

      // Obtener URL de autorización
      const authUrl = initiateOAuthFlow(platform, currentUser.uid);
      
      // Simular redireccionamiento (para el MVP)
      // En producción, esto sería window.location.href = authUrl;
      console.log("Redirigiendo a:", authUrl);
      
      // Simulamos un retraso para el demo y luego éxito
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Si se proporcionó un accountId, actualizar el estado de conexión de esa cuenta
      if (accountId) {
        const accountRef = doc(db, "users", currentUser.uid, "socialAccounts", accountId);
        await updateDoc(accountRef, {
          connected: true
        });
      }

      setIsConnected(true);
      
      toast({
        title: "Conexión exitosa",
        description: `Tu cuenta de ${config.name} ha sido conectada correctamente a kalma`
      });

      // Notificar al componente padre si se completó la conexión
      if (onConnected) {
        onConnected();
      }
    } catch (error) {
      console.error("Error al iniciar OAuth:", error);
      toast({
        title: "Error de conexión",
        description: `No se pudo conectar con ${config.name}. Por favor, inténtalo de nuevo.`,
        variant: "destructive"
      });
    } finally {
      setConnecting(false);
    }
  };

  // Desconectar la plataforma
  const handleDisconnect = async () => {
    if (!currentUser) return;
    
    setConnecting(true);
    
    try {
      await disconnectPlatform(currentUser.uid, platform);
      
      setIsConnected(false);
      
      toast({
        title: "Desconexión exitosa",
        description: `Se ha desconectado tu cuenta de ${config.name}.`
      });
      
    } catch (error) {
      console.error("Error al desconectar:", error);
      toast({
        title: "Error de desconexión",
        description: `No se pudo desconectar de ${config.name}. Por favor, inténtalo de nuevo.`,
        variant: "destructive"
      });
    } finally {
      setConnecting(false);
    }
  };

  // Clases según el tamaño
  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "px-2.5 py-1.5 text-xs";
      case "lg":
        return "px-5 py-3 text-lg";
      default:
        return "px-4 py-2 text-sm";
    }
  };

  if (isLoading) {
    return (
      <Button 
        disabled
        className={`${getSizeClasses()} bg-gray-300 text-gray-700`}
      >
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Verificando...
      </Button>
    );
  }

  if (isConnected) {
    return (
      <Button 
        onClick={handleDisconnect}
        className={`${getSizeClasses()} bg-green-600 hover:bg-red-600 transition-colors duration-300 text-white`}
        disabled={connecting}
      >
        {connecting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Desconectando...
          </>
        ) : (
          <>
            {config.icon}
            Conectado
          </>
        )}
      </Button>
    );
  }

  return (
    <Button 
      onClick={initiateOAuth} 
      className={`${getSizeClasses()} ${config.color}`}
      disabled={connecting}
    >
      {connecting ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Conectando...
        </>
      ) : (
        <>
          {config.icon}
          Conectar {config.name}
        </>
      )}
    </Button>
  );
};

export default OAuthConnector; 