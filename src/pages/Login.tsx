
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Mail, User } from "lucide-react";

// Esquema de validación para el formulario
const loginSchema = z.object({
  email: z.string().email("Ingrese un correo electrónico válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

const Login = () => {
  const { currentUser, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);

  // Configuración del formulario con React Hook Form
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

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

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    try {
      if (isRegistering) {
        await signUpWithEmail(values.email, values.password);
        toast({
          title: "Registro exitoso",
          description: "Tu cuenta ha sido creada correctamente.",
        });
      } else {
        await signInWithEmail(values.email, values.password);
        toast({
          title: "Inicio de sesión exitoso",
          description: "Has iniciado sesión correctamente.",
        });
      }
    } catch (error) {
      toast({
        title: isRegistering ? "Error al registrarse" : "Error al iniciar sesión",
        description: "Por favor, verifica tus credenciales e intenta nuevamente.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {isRegistering ? "Registro para PYMEs" : "Acceso para PYMEs"}
          </CardTitle>
          <CardDescription className="text-center">
            {isRegistering 
              ? "Crea una cuenta para administrar tu agente IA" 
              : "Inicia sesión en tu cuenta para administrar tu agente IA"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo electrónico</FormLabel>
                    <FormControl>
                      <Input placeholder="tu@empresa.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input placeholder="••••••••" type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-whatsapp hover:bg-whatsapp-dark">
                {isRegistering ? "Crear cuenta" : "Iniciar sesión"}
              </Button>
            </form>
          </Form>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">O continúa con</span>
            </div>
          </div>
          
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
        </CardContent>
        <CardFooter>
          <Button
            variant="link"
            className="w-full"
            onClick={() => setIsRegistering(!isRegistering)}
          >
            {isRegistering
              ? "¿Ya tienes una cuenta? Inicia sesión"
              : "¿No tienes una cuenta? Regístrate"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
