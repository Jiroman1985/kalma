import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react";

export default function GmailAuthError() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string>("Ha ocurrido un error durante la autenticación con Gmail.");
  const [isDecodingError, setIsDecodingError] = useState<boolean>(false);

  useEffect(() => {
    // Obtener mensaje de error de la URL si existe
    const params = new URLSearchParams(location.search);
    const error = params.get("error");
    
    if (error) {
      try {
        const decodedError = decodeURIComponent(error);
        setErrorMessage(decodedError);
        
        // Verificar si es un error de tipo
        if (decodedError.includes("must be of type string") || 
            decodedError.includes("Received undefined")) {
          setIsDecodingError(true);
        }
      } catch (e) {
        console.error("Error al decodificar mensaje:", e);
        setErrorMessage("Ha ocurrido un error desconocido durante la autenticación con Gmail.");
        setIsDecodingError(true);
      }
    }
    
    // Log para depuración
    console.log("URL completa:", location.pathname + location.search);
    console.log("Mensaje de error extraído:", error);
  }, [location]);

  // Función para reintentar la autenticación
  const retryGmailAuth = () => {
    if (currentUser) {
      window.location.href = `/.netlify/functions/gmail-auth?userId=${currentUser.uid}`;
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-[450px] shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <XCircle className="h-12 w-12 text-red-500" />
          </div>
          <CardTitle className="text-xl">Error de conexión</CardTitle>
          <CardDescription>
            No se pudo conectar tu cuenta de Gmail
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="text-center">
            <p className="text-sm text-gray-700 mt-2">
              {isDecodingError 
                ? "Ha ocurrido un error técnico durante el proceso de autenticación. Esto puede deberse a un problema con la configuración de la aplicación." 
                : errorMessage}
            </p>
            <p className="text-sm text-gray-500 mt-4">
              Por favor, intenta nuevamente o contacta al soporte si el problema persiste.
            </p>
            {isDecodingError && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800">
                <p><strong>Información técnica:</strong></p>
                <p className="mt-1 break-words">{errorMessage}</p>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex justify-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard/channels")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver a Canales
          </Button>
          <Button
            onClick={retryGmailAuth}
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Reintentar conexión
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 