// Importamos los módulos de Firebase necesarios
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB_fjWDYiXtddbQnE-gxXCZoWcJDJt4KwA",
  authDomain: "kalma-lab.firebaseapp.com",
  projectId: "kalma-lab",
  storageBucket: "kalma-lab.appspot.com",
  messagingSenderId: "928927480327",
  appId: "1:928927480327:web:d35319e4573b19605ac8a2",
  measurementId: "G-LSPQ5GGGME"
};

// Inicializamos Firebase
const app = initializeApp(firebaseConfig);

// Inicializamos Auth
export const auth = getAuth(app);

// Inicializamos Firestore
export const db = getFirestore(app);

// Inicializamos Storage
export const storage = getStorage(app);

// Configuración adicional para entornos de desarrollo
if (window.location.hostname === 'localhost' || 
    window.location.hostname.includes('lovableproject.com')) {
  auth.useDeviceLanguage();
  console.log("Configuración para entorno de desarrollo activada");
}

// Inicializamos el proveedor de autenticación de Google
export const googleProvider = new GoogleAuthProvider();

// Configurar el comportamiento del proveedor de Google
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Agregamos ámbitos adicionales para la autenticación de Google si es necesario
// googleProvider.addScope('https://www.googleapis.com/auth/contacts.readonly');

// Inicializamos Analytics si estamos en un entorno de producción
let analytics = null;
try {
  analytics = getAnalytics(app);
} catch (error) {
  console.log("Analytics no inicializado en este entorno");
}

export { analytics };
export default app;
