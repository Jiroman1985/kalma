import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { doc, updateDoc, setDoc, collection } from "firebase/firestore";
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
      // Simular un proceso OAuth - En producción, aquí iría la redirección a la página de autorización
      toast({
        title: "Conectando...",
        description: `Iniciando conexión con ${config.name}`,
      });

      // Simulamos un retraso para el demo
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Si se proporcionó un accountId, actualizar el estado de conexión de esa cuenta
      if (accountId) {
        const accountRef = doc(db, "users", currentUser.uid, "socialAccounts", accountId);
        await updateDoc(accountRef, {
          connected: true
        });
      }

      // Simular el almacenamiento de token (en un entorno real, esto se manejaría en el servidor)
      const tokensRef = doc(collection(db, "users", currentUser.uid, "socialTokens"), platform.toLowerCase());
      await setDoc(tokensRef, {
        accessToken: "simulated_access_token_" + Math.random().toString(36).substring(2),
        refreshToken: "simulated_refresh_token_" + Math.random().toString(36).substring(2),
        tokenExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 días
        scope: "read_" + platform + ",write_" + platform,
        lastSynced: new Date().toISOString()
      }, { merge: true });

      toast({
        title: "Conexión exitosa",
        description: `Tu cuenta de ${config.name} ha sido conectada correctamente`
      });

      // Notificar al componente padre si se completó la conexión
      if (onConnected) {
        onConnected();
      }
    } catch (error) {
      console.error("Error en el proceso OAuth:", error);
      toast({
        title: "Error de conexión",
        description: `No se pudo conectar con ${config.name}. Por favor, intenta de nuevo.`,
        variant: "destructive"
      });
    } finally {
      setConnecting(false);
    }
  };

  // Generar clases según el tamaño
  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    default: "px-4 py-2",
    lg: "px-6 py-3 text-lg"
  };

  return (
    <Button
      className={`${config.color} ${sizeClasses[size]}`}
      onClick={initiateOAuth}
      disabled={connecting}
    >
      {connecting ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        config.icon
      )}
      Conectar con {config.name}
    </Button>
  );
};

export default OAuthConnector; 