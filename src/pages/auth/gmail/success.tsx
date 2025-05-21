import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function GmailAuthSuccess() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [emailInfo, setEmailInfo] = useState<{
    email?: string;
    name?: string;
    picture?: string;
  } | null>(null);

  useEffect(() => {
    // Verificar si el usuario está autenticado
    if (!currentUser) {
      navigate("/login");
      return;
    }

    // Verificar si Gmail está vinculado
    const checkGmailConnection = async () => {
      try {
        setLoading(true);
        const userDocRef = doc(db, "socialTokens", currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists() && userDoc.data().gmail) {
          // Obtener información del perfil
          const gmailData = userDoc.data().gmail;
          
          if (gmailData.profile) {
            setEmailInfo({
              email: gmailData.profile.email,
              name: gmailData.profile.name,
              picture: gmailData.profile.picture
            });
          }
          
          setError("");
        } else {
          setError("No se encontró información de conexión con Gmail.");
        }
      } catch (err) {
        console.error("Error al verificar conexión de Gmail:", err);
        setError("Error al verificar la conexión con Gmail.");
      } finally {
        setLoading(false);
      }
    };

    checkGmailConnection();
  }, [currentUser, navigate]);

  // Redirigir al dashboard después de 3 segundos
  useEffect(() => {
    if (!loading && !error) {
      const timer = setTimeout(() => {
        navigate("/dashboard/conversations");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [loading, error, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-[400px] shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {loading ? (
              <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
            ) : error ? (
              <XCircle className="h-12 w-12 text-red-500" />
            ) : (
              <CheckCircle className="h-12 w-12 text-green-500" />
            )}
          </div>
          <CardTitle className="text-xl">
            {loading
              ? "Verificando conexión..."
              : error
              ? "Error de conexión"
              : "¡Cuenta de Gmail vinculada!"}
          </CardTitle>
          <CardDescription>
            {loading
              ? "Estamos verificando tu conexión con Gmail."
              : error
              ? error
              : "Tu cuenta de Gmail ha sido conectada exitosamente."}
          </CardDescription>
        </CardHeader>

        <CardContent className="text-center">
          {!loading && !error && emailInfo && (
            <div className="flex flex-col items-center space-y-2 mt-2">
              <div className="flex items-center justify-center mb-2">
                <Mail className="h-6 w-6 text-red-500 mr-2" />
                <span className="font-medium">{emailInfo.email}</span>
              </div>
              {emailInfo.name && (
                <p className="text-sm text-gray-500">{emailInfo.name}</p>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-center">
          <Button
            onClick={() => navigate("/dashboard/conversations")}
            disabled={loading}
          >
            {loading ? "Espera..." : "Ir a Conversaciones"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 