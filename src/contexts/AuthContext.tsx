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
import { auth, googleProvider, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { initializeWhatsAppData } from "@/lib/whatsappService";

// Interface para representar los datos extendidos del usuario
interface UserData {
  isPaid: boolean;
  freeTier: boolean;
  freeTierFinishDate: string | null;
  hasFullAccess: boolean;
  isTrialExpired: boolean;
}

interface AuthContextProps {
  currentUser: User | null;
  loading: boolean;
  userData: UserData | null;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, additionalData?: Record<string, any>) => Promise<void>;
  logout: () => Promise<void>;
  updatePhoneNumber: (phoneNumber: string) => Promise<boolean>;
  activateFreeTrial: () => Promise<boolean>;
}

// Valores por defecto para los campos del usuario relacionados con el acceso
const defaultUserData: UserData = {
  isPaid: false,
  freeTier: false,
  freeTierFinishDate: null,
  hasFullAccess: false,
  isTrialExpired: false
};

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
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Función para verificar si la prueba gratuita ha expirado
  const checkTrialExpiration = (finishDate: string | null): boolean => {
    if (!finishDate) return true;
    
    const today = new Date();
    const expiryDate = new Date(finishDate);
    return today > expiryDate;
  };

  // Función para calcular el acceso completo basado en isPaid y freeTier
  const calculateAccess = (isPaid: boolean, freeTier: boolean, freeTierFinishDate: string | null): { hasFullAccess: boolean, isTrialExpired: boolean } => {
    const isExpired = checkTrialExpiration(freeTierFinishDate);
    const hasAccess = isPaid || (freeTier && !isExpired);
    
    return {
      hasFullAccess: hasAccess,
      isTrialExpired: isExpired && !isPaid && freeTier
    };
  };

  // Función para cargar datos del usuario desde Firestore
  const loadUserData = async (userId: string) => {
    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const data = userSnap.data();
        
        // Verificar si existen los campos necesarios, si no, utilizar valores por defecto
        const isPaid = data.isPaid ?? defaultUserData.isPaid;
        const freeTier = data.freeTier ?? defaultUserData.freeTier;
        const freeTierFinishDate = data.freeTierFinishDate ?? defaultUserData.freeTierFinishDate;
        
        // Verificar la expiración y calcular el acceso
        const { hasFullAccess, isTrialExpired } = calculateAccess(
          isPaid, 
          freeTier, 
          freeTierFinishDate
        );
        
        // Si la prueba ha expirado pero el campo freeTier sigue siendo true, actualizarlo
        if (freeTier && isTrialExpired) {
          await updateDoc(userRef, {
            freeTier: false,
            freeTierFinishDate: null
          });
        }
        
        // Actualizar el estado con todos los datos
        setUserData({
          isPaid,
          freeTier: freeTier && !isTrialExpired, // Si expiró, considerar como false
          freeTierFinishDate,
          hasFullAccess,
          isTrialExpired
        });
        
        return {
          isPaid,
          freeTier: freeTier && !isTrialExpired,
          freeTierFinishDate,
          hasFullAccess,
          isTrialExpired
        };
      } else {
        // Si no existe el documento, usar valores por defecto
        setUserData(defaultUserData);
        return defaultUserData;
      }
    } catch (error) {
      console.error("Error al cargar datos de usuario:", error);
      setUserData(defaultUserData);
      return defaultUserData;
    }
  };

  // Función para activar el período de prueba gratuito
  const activateFreeTrial = async (): Promise<boolean> => {
    if (!currentUser) return false;
    
    try {
      // Calcular fecha de finalización (hoy + 15 días)
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 15);
      
      // Formatear fecha como YYYY-MM-DD
      const formattedEndDate = endDate.toISOString().split('T')[0];
      
      // Actualizar documento en Firestore
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        freeTier: true,
        freeTierFinishDate: formattedEndDate
      });
      
      // Actualizar estado local
      const newUserData = {
        ...userData!,
        freeTier: true,
        freeTierFinishDate: formattedEndDate,
        hasFullAccess: true,
        isTrialExpired: false
      };
      
      setUserData(newUserData);
      
      toast({
        title: "¡Prueba activada!",
        description: `Has activado tu período de prueba gratuito por 15 días. Finaliza el ${formattedEndDate}.`
      });
      
      return true;
    } catch (error) {
      console.error("Error al activar período de prueba:", error);
      toast({
        title: "Error",
        description: "No se pudo activar el período de prueba. Inténtalo de nuevo más tarde.",
        variant: "destructive"
      });
      return false;
    }
  };

  // Función para guardar datos del usuario en Firestore
  const saveUserToFirestore = async (user: User, additionalData = {}) => {
    if (!user) return;
    
    try {
      const userRef = doc(db, "users", user.uid);
      console.log("Intentando guardar usuario:", user.uid);
      
      // Datos completos a guardar siempre (tanto para nuevos como actualizaciones)
      const userData = {
        email: user.email,
        displayName: user.displayName || "",
        photoURL: user.photoURL || "",
        lastLogin: serverTimestamp(),
        ...additionalData
      };
      
      // Agregar createdAt solo para nuevos usuarios
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        userData.createdAt = serverTimestamp();
        console.log("Creando nuevo usuario en Firestore");
        
        // Inicializar campos relacionados con el estado de pago y prueba gratuita
        Object.assign(userData, {
          isPaid: defaultUserData.isPaid,
          freeTier: defaultUserData.freeTier,
          freeTierFinishDate: defaultUserData.freeTierFinishDate
        });
        
        // Inicializar estructura de datos para WhatsApp para nuevos usuarios
        await initializeWhatsAppData(user.uid);
      } else {
        console.log("Actualizando usuario existente en Firestore");
      }
      
      // Usar merge: true para asegurar que no se sobrescriban datos existentes
      await setDoc(userRef, userData, { merge: true });
      console.log("Datos guardados correctamente en Firestore");
      
      // Cargar los datos completos del usuario después de guardar
      return await loadUserData(user.uid);
    } catch (error) {
      console.error("Error al guardar datos en Firestore:", error);
      // Notificar error amigable al usuario
      toast({
        title: "Error al guardar datos",
        description: "No se pudo guardar la información. Por favor, intenta nuevamente.",
        variant: "destructive"
      });
    }
  };

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
      
      // Guardar información del usuario en Firestore y obtener datos completos
      await saveUserToFirestore(result.user, {
        provider: "google",
        companyName: result.user.displayName || ""
      });
      
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
      
      // Guardar información del usuario en Firestore
      await saveUserToFirestore(result.user, {
        provider: "email"
      });
      
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
  async function signUpWithEmail(email: string, password: string, additionalData = {}) {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Guardar información del usuario en Firestore
      await saveUserToFirestore(result.user, {
        provider: "email",
        isNewUser: true,
        ...additionalData
      });
      
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

  // Actualizar número de teléfono del usuario
  async function updatePhoneNumber(phoneNumber: string) {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "No hay sesión activa",
        variant: "destructive"
      });
      return false;
    }
    
    try {
      // Limpiar el número de teléfono (eliminar caracteres no numéricos excepto +)
      const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
      
      const userRef = doc(db, "users", currentUser.uid);
      await setDoc(userRef, { phoneNumber: cleanPhone }, { merge: true });
      
      // Inicializar estructura de datos para WhatsApp si no existe
      await initializeWhatsAppData(currentUser.uid);
      
      toast({
        title: "Número actualizado",
        description: "Tu número de teléfono ha sido actualizado correctamente"
      });
      
      return true;
    } catch (error) {
      console.error("Error al actualizar número de teléfono:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el número de teléfono",
        variant: "destructive"
      });
      return false;
    }
  }

  // Escuchar cambios en el estado de autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Cargar datos completos del usuario después de la autenticación
        await loadUserData(user.uid);
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userData,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    logout,
    updatePhoneNumber,
    activateFreeTrial
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
