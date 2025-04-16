import { useState } from "react";
import { Button } from "./ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

/**
 * Componente de depuración para verificar la conexión a Firestore
 * Uso temporal para solucionar problemas de guardado de datos
 */
const FirestoreDebug = () => {
  const { currentUser } = useAuth();
  const [status, setStatus] = useState<string>("No se ha ejecutado ninguna acción");
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);

  // Verificar si existe el documento del usuario
  const checkUserDoc = async () => {
    if (!currentUser) {
      setStatus("Error: No hay usuario autenticado");
      return;
    }

    setStatus("Verificando documento del usuario...");
    setError(null);
    
    try {
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        setStatus("El documento del usuario existe");
        setUserData(userSnap.data());
      } else {
        setStatus("El documento del usuario NO existe");
        setUserData(null);
      }
    } catch (err) {
      console.error("Error al verificar documento:", err);
      setStatus("Error al verificar el documento");
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  // Crear un documento de prueba
  const createTestDoc = async () => {
    if (!currentUser) {
      setStatus("Error: No hay usuario autenticado");
      return;
    }

    setStatus("Creando documento de prueba...");
    setError(null);
    
    try {
      const userRef = doc(db, "users", currentUser.uid);
      const testData = {
        test: true,
        timestamp: new Date().toISOString(),
        email: currentUser.email,
      };
      
      await setDoc(userRef, testData, { merge: true });
      setStatus("Documento de prueba creado exitosamente");
      
      // Verificar que se haya creado correctamente
      await checkUserDoc();
    } catch (err) {
      console.error("Error al crear documento de prueba:", err);
      setStatus("Error al crear documento de prueba");
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  return (
    <div className="p-4 border rounded-md bg-gray-100 my-4">
      <h3 className="text-lg font-medium mb-2">Depuración de Firestore</h3>
      
      <div className="mb-4">
        <p className="text-sm mb-1"><strong>Usuario actual:</strong> {currentUser?.email || "No autenticado"}</p>
        <p className="text-sm mb-1"><strong>UID:</strong> {currentUser?.uid || "N/A"}</p>
        <p className="text-sm mb-1"><strong>Estado:</strong> {status}</p>
        {error && <p className="text-sm text-red-500 mb-1"><strong>Error:</strong> {error}</p>}
      </div>
      
      {userData && (
        <div className="mb-4 p-2 bg-white rounded border">
          <p className="text-sm font-medium mb-1">Datos del usuario:</p>
          <pre className="text-xs overflow-auto max-h-40">
            {JSON.stringify(userData, null, 2)}
          </pre>
        </div>
      )}
      
      <div className="flex space-x-2">
        <Button 
          size="sm" 
          variant="outline" 
          onClick={checkUserDoc}
          disabled={!currentUser}
        >
          Verificar Documento
        </Button>
        <Button 
          size="sm" 
          variant="default" 
          onClick={createTestDoc}
          disabled={!currentUser}
        >
          Crear Documento de Prueba
        </Button>
      </div>
    </div>
  );
};

export default FirestoreDebug; 