import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Mail, ArrowRight, Loader2, Building } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Esquema de validación para el formulario de login
const loginSchema = z.object({
  email: z.string().email("Ingrese un correo electrónico válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

// Esquema de validación para el formulario de registro
const registerSchema = z.object({
  email: z.string().email("Ingrese un correo electrónico válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  companyName: z.string().min(2, "Ingrese el nombre de su empresa").max(100),
  businessType: z.string().optional(),
});

const Login = () => {
  const { currentUser, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Configuración del formulario de login con React Hook Form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Configuración del formulario de registro con React Hook Form
  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      companyName: "",
      businessType: "",
    },
  });

  useEffect(() => {
    if (currentUser) {
      navigate("/dashboard");
    }
  }, [currentUser, navigate]);

  const handleGoogleLogin = async () => {
    try {
      setIsSubmitting(true);
      setLoginError(null);
      await signInWithGoogle();
    } catch (error: any) {
      // El error ya se maneja en el contexto de autenticación
      if (error.code === 'auth/unauthorized-domain') {
        setLoginError("Este dominio no está autorizado para iniciar sesión. Es necesario agregar este dominio en la consola de Firebase.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const onLoginSubmit = async (values: z.infer<typeof loginSchema>) => {
    try {
      setIsSubmitting(true);
      setLoginError(null);
      await signInWithEmail(values.email, values.password);
    } catch (error: any) {
      // El error ya se maneja en el contexto de autenticación
      if (error.code === 'auth/invalid-credential') {
        setLoginError("Credenciales inválidas. Verifica tu correo y contraseña.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const onRegisterSubmit = async (values: z.infer<typeof registerSchema>) => {
    try {
      setIsSubmitting(true);
      setLoginError(null);
      await signUpWithEmail(values.email, values.password, {
        companyName: values.companyName,
        businessType: values.businessType || ""
      });
    } catch (error: any) {
      // El error ya se maneja en el contexto de autenticación
      if (error.code === 'auth/email-already-in-use') {
        setLoginError("Este correo ya está registrado. Intenta iniciar sesión.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {isRegistering ? "Registro para WhatsPyme" : "Acceso para WhatsPyme"}
          </CardTitle>
          <CardDescription className="text-center">
            {isRegistering 
              ? "Crea una cuenta para administrar tu agente IA" 
              : "Inicia sesión en tu cuenta para administrar tu agente IA"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loginError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{loginError}</AlertDescription>
            </Alert>
          )}
          
          {isRegistering ? (
            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                <FormField
                  control={registerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo electrónico</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="tu@empresa.com" 
                          type="email" 
                          disabled={isSubmitting}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="••••••••" 
                          type="password" 
                          disabled={isSubmitting}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de la Empresa</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Tu Empresa S.L." 
                          disabled={isSubmitting}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="businessType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Negocio (Opcional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ej: Tienda de ropa, Restaurante..." 
                          disabled={isSubmitting}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full bg-whatsapp hover:bg-whatsapp-dark"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando</>
                  ) : (
                    <>Crear cuenta <ArrowRight className="ml-2 h-4 w-4" /></>
                  )}
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo electrónico</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="tu@empresa.com" 
                          type="email" 
                          disabled={isSubmitting}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="••••••••" 
                          type="password" 
                          disabled={isSubmitting}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full bg-whatsapp hover:bg-whatsapp-dark"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando</>
                  ) : (
                    <>Iniciar sesión <ArrowRight className="ml-2 h-4 w-4" /></>
                  )}
                </Button>
              </form>
            </Form>
          )}
          
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
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                <g transform="matrix(1, 0, 0, 1, 0, 0)">
                  <path d="M23.745,12.27c0-.79-.07-1.54-.19-2.27H12.255v4.51h6.46c-.29,1.48-1.14,2.73-2.4,3.58v3h3.86c2.26-2.09,3.57-5.17,3.57-8.82Z" fill="#4285F4"></path>
                  <path d="M12.255,24c3.24,0,5.95-1.08,7.93-2.91l-3.86-3c-1.08.72-2.45,1.16-4.07,1.16-3.13,0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515,21.3,7.565,24,12.255,24Z" fill="#34A853"></path>
                  <path d="M5.525,14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57,.38-2.29V6.62h-3.98c-.8,1.6-1.26,3.41-1.26,5.38s.46,3.78,1.26,5.38l3.98-3.09Z" fill="#FBBC05"></path>
                  <path d="M12.255,4.75c1.77,0,3.35,.61,4.6,1.8l3.42-3.42C18.205,1.19,15.495,0,12.255,0c-4.69,0-8.74,2.7-10.68,6.62l3.98,3.09c.95-2.85,3.6-4.96,6.73-4.96Z" fill="#EA4335"></path>
                </g>
              </svg>
            )}
            <span>Iniciar sesión con Google</span>
          </Button>
        </CardContent>
        <CardFooter>
          <Button
            variant="link"
            className="w-full"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setLoginError(null);
            }}
            disabled={isSubmitting}
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
