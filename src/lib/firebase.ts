
// Importamos los módulos de Firebase necesarios
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB_fjWDYiXtddbQnE-gxXCZoWcJDJt4KwA",
  authDomain: "pymai-5464d.firebaseapp.com",
  projectId: "pymai-5464d",
  storageBucket: "pymai-5464d.firebasestorage.app",
  messagingSenderId: "928927480327",
  appId: "1:928927480327:web:d35319e4573b19605ac8a2",
  measurementId: "G-LSPQ5GGGME"
};

// Inicializamos Firebase
const app = initializeApp(firebaseConfig);

// Inicializamos Auth
export const auth = getAuth(app);

// Inicializamos el proveedor de autenticación
export const googleProvider = new GoogleAuthProvider();

export default app;
