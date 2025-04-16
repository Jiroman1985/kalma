
import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { 
  User, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  browserLocalPersistence,
  setPersistence
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

interface AuthContextProps {
  currentUser: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Configurar persistencia de sesión
  useEffect(() => {
    setPersistence(auth, browserLocalPersistence)
      .catch((error) => {
        console.error("Error al configurar persistencia:", error);
      });
  }, []);

  // Iniciar sesión con Google
  async function signInWithGoogle() {
    try {
      // Forzamos el select_account para mostrar siempre el selector de cuentas
      googleProvider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(auth, googleProvider);
      toast({
        title: "¡Bienvenido!",
        description: `Has iniciado sesión como ${result.user.email}`,
      });
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error al iniciar sesión con Google:", error);
      
      // Mensajes de error específicos
      let errorMessage = "No se pudo iniciar sesión con Google.";
      
      if (error.code === 'auth/unauthorized-domain') {
        errorMessage = "Este dominio no está autorizado para iniciar sesión. Por favor, contacta al administrador.";
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "Inicio de sesión cancelado.";
      }
      
      toast({
        title: "Error de autenticación",
        description: errorMessage,
        variant: "destructive"
      });
      throw error;
    }
  }

  // Iniciar sesión con Email y contraseña
  async function signInWithEmail(email: string, password: string) {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "¡Bienvenido!",
        description: `Has iniciado sesión como ${result.user.email}`,
      });
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error al iniciar sesión con email:", error);
      
      // Mensajes de error específicos
      let errorMessage = "Por favor, verifica tus credenciales e intenta nuevamente.";
      
      if (error.code === 'auth/invalid-credential') {
        errorMessage = "Correo o contraseña incorrectos.";
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = "Esta cuenta ha sido deshabilitada.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Demasiados intentos fallidos. Intenta más tarde.";
      }
      
      toast({
        title: "Error al iniciar sesión",
        description: errorMessage,
        variant: "destructive"
      });
      throw error;
    }
  }

  // Registrarse con Email y contraseña
  async function signUpWithEmail(email: string, password: string) {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      toast({
        title: "¡Cuenta creada!",
        description: `Te has registrado como ${result.user.email}`,
      });
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error al registrarse con email:", error);
      
      // Mensajes de error específicos
      let errorMessage = "No se pudo crear la cuenta.";
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "El correo electrónico ya está en uso.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "La contraseña es demasiado débil.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "El formato del correo electrónico es inválido.";
      }
      
      toast({
        title: "Error al registrarse",
        description: errorMessage,
        variant: "destructive"
      });
      throw error;
    }
  }

  // Cerrar sesión
  async function logout() {
    try {
      await signOut(auth);
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente",
      });
      navigate("/");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      toast({
        title: "Error",
        description: "No se pudo cerrar la sesión",
        variant: "destructive"
      });
    }
  }

  // Escuchar cambios en el estado de autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
