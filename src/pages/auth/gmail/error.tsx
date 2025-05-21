import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft } from "lucide-react";

export default function GmailAuthError() {
  const navigate = useNavigate();
  const location = useLocation();
  const [errorMessage, setErrorMessage] = useState<string>("Ha ocurrido un error durante la autenticación con Gmail.");

  useEffect(() => {
    // Obtener mensaje de error de la URL si existe
    const params = new URLSearchParams(location.search);
    const error = params.get("error");
    
    if (error) {
      try {
        setErrorMessage(decodeURIComponent(error));
      } catch (e) {
        console.error("Error al decodificar mensaje:", e);
        setErrorMessage("Ha ocurrido un error desconocido durante la autenticación con Gmail.");
      }
    }
    
    // Log para depuración
    console.log("URL completa:", location.pathname + location.search);
    console.log("Mensaje de error extraído:", error);
  }, [location]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-[400px] shadow-lg">
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
            <p className="text-sm text-gray-700 mt-2">{errorMessage}</p>
            <p className="text-sm text-gray-500 mt-4">
              Por favor, intenta nuevamente o contacta al soporte si el problema persiste.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex justify-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard/channels")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver a Canales
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 