
// Importamos los módulos de Firebase necesarios
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from "firebase/auth";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCkskVWq-KDNKzKdNZFfaV7xPJcj9ryD7o",
  authDomain: "pyme-ai-assist.firebaseapp.com",
  projectId: "pyme-ai-assist",
  storageBucket: "pyme-ai-assist.appspot.com",
  messagingSenderId: "740091408566",
  appId: "1:740091408566:web:5c49babf5ffc5e9c9a1f04"
};

// Inicializamos Firebase
const app = initializeApp(firebaseConfig);

// Inicializamos Auth
export const auth = getAuth(app);

// Inicializamos los proveedores de autenticación
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();

export default app;
