
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Facebook, Mail } from "lucide-react";

const Login = () => {
  const { currentUser, signInWithGoogle, signInWithFacebook } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate("/dashboard");
    }
  }, [currentUser, navigate]);

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      toast({
        title: "Inicio de sesión exitoso",
        description: "Has iniciado sesión correctamente.",
      });
    } catch (error) {
      toast({
        title: "Error al iniciar sesión",
        description: "No se pudo iniciar sesión con Google.",
        variant: "destructive"
      });
    }
  };

  const handleFacebookLogin = async () => {
    try {
      await signInWithFacebook();
      toast({
        title: "Inicio de sesión exitoso",
        description: "Has iniciado sesión correctamente.",
      });
    } catch (error) {
      toast({
        title: "Error al iniciar sesión",
        description: "No se pudo iniciar sesión con Facebook.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Acceso para PYMEs
          </CardTitle>
          <CardDescription className="text-center">
            Inicia sesión en tu cuenta para administrar tu agente IA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="w-full flex items-center gap-2 bg-white hover:bg-gray-50 border-gray-300"
            onClick={handleGoogleLogin}
          >
            <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
              <g transform="matrix(1, 0, 0, 1, 0, 0)">
                <path d="M23.745,12.27c0-.79-.07-1.54-.19-2.27H12.255v4.51h6.46c-.29,1.48-1.14,2.73-2.4,3.58v3h3.86c2.26-2.09,3.57-5.17,3.57-8.82Z" fill="#4285F4"></path>
                <path d="M12.255,24c3.24,0,5.95-1.08,7.93-2.91l-3.86-3c-1.08.72-2.45,1.16-4.07,1.16-3.13,0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515,21.3,7.565,24,12.255,24Z" fill="#34A853"></path>
                <path d="M5.525,14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57,.38-2.29V6.62h-3.98c-.8,1.6-1.26,3.41-1.26,5.38s.46,3.78,1.26,5.38l3.98-3.09Z" fill="#FBBC05"></path>
                <path d="M12.255,4.75c1.77,0,3.35,.61,4.6,1.8l3.42-3.42C18.205,1.19,15.495,0,12.255,0c-4.69,0-8.74,2.7-10.68,6.62l3.98,3.09c.95-2.85,3.6-4.96,6.73-4.96Z" fill="#EA4335"></path>
              </g>
            </svg>
            Iniciar sesión con Google
          </Button>
          <Button
            variant="outline"
            className="w-full flex items-center gap-2 bg-[#1877f2] hover:bg-[#166fe5] border-[#1877f2] text-white hover:text-white"
            onClick={handleFacebookLogin}
          >
            <Facebook className="h-5 w-5" />
            Iniciar sesión con Facebook
          </Button>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-center w-full text-gray-500">
            Al iniciar sesión, aceptas nuestros términos y condiciones y política de privacidad.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
