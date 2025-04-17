import { db } from "@/lib/firebase";
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  query, 
  where, 
  addDoc, 
  serverTimestamp, 
  updateDoc,
  getDocs,
  orderBy,
  limit,
  Timestamp
} from "firebase/firestore";

// Define la interfaz para los mensajes de WhatsApp
export interface WhatsAppMessage {
  id: string;
  messageId: string;
  body: string;
  from: string;
  to: string;
  timestamp: number | Timestamp;
  isFromMe: boolean;
  senderName: string;
  messageType: string;
  storedAt?: Timestamp;
}

// Define la interfaz para los análisis de WhatsApp
export interface WhatsAppAnalytics {
  totalMessages: number;
  lastMessageTimestamp: number | Timestamp;
  messagesPerDay: Record<string, number>;
  activeChats: number;
  firstMessageTimestamp?: Timestamp;
  lastUpdated?: Timestamp;
}

/**
 * Busca un usuario por número de teléfono de WhatsApp
 */
export const findUserByPhoneNumber = async (phoneNumber: string) => {
  // Eliminar el sufijo @c.us si existe
  const cleanPhoneNumber = phoneNumber.replace('@c.us', '');
  
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("phoneNumber", "==", cleanPhoneNumber));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      return { id: userDoc.id, ...userDoc.data() };
    }
    
    return null;
  } catch (error) {
    console.error("Error al buscar usuario por número de teléfono:", error);
    return null;
  }
};

/**
 * Actualiza o crea el campo phoneNumber en el perfil de usuario
 */
export const updateUserPhoneNumber = async (userId: string, phoneNumber: string) => {
  // Eliminar el sufijo @c.us si existe
  const cleanPhoneNumber = phoneNumber.replace('@c.us', '');
  
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { phoneNumber: cleanPhoneNumber });
    return true;
  } catch (error) {
    console.error("Error al actualizar número de teléfono:", error);
    return false;
  }
};

/**
 * Inicializa la estructura de datos para WhatsApp si no existe
 */
export const initializeWhatsAppData = async (userId: string) => {
  try {
    const whatsappRef = doc(db, `users/${userId}/analytics/whatsapp`);
    const whatsappDoc = await getDoc(whatsappRef);
    
    if (!whatsappDoc.exists()) {
      // Crear estructura inicial para análisis de WhatsApp
      await setDoc(whatsappRef, {
        totalMessages: 0,
        lastMessageTimestamp: 0,
        messagesPerDay: {},
        activeChats: 0,
        firstMessageTimestamp: serverTimestamp(),
        lastUpdated: serverTimestamp()
      });
      
      console.log("Estructura de datos de WhatsApp inicializada para el usuario:", userId);
    }
    
    return true;
  } catch (error) {
    console.error("Error al inicializar datos de WhatsApp:", error);
    return false;
  }
};

/**
 * Obtiene los mensajes de WhatsApp de un usuario
 */
export const getWhatsAppMessages = async (userId: string, limit: number = 50) => {
  try {
    const messagesRef = collection(db, `users/${userId}/whatsapp/messages`);
    const q = query(messagesRef, orderBy("timestamp", "desc"), limit(limit));
    const querySnapshot = await getDocs(q);
    
    const messages: WhatsAppMessage[] = [];
    querySnapshot.forEach(doc => {
      messages.push({ id: doc.id, ...doc.data() } as WhatsAppMessage);
    });
    
    return messages;
  } catch (error) {
    console.error("Error al obtener mensajes de WhatsApp:", error);
    return [];
  }
};

/**
 * Obtiene los análisis de WhatsApp de un usuario
 */
export const getWhatsAppAnalytics = async (userId: string) => {
  try {
    const analyticsRef = doc(db, `users/${userId}/analytics/whatsapp`);
    const analyticsDoc = await getDoc(analyticsRef);
    
    if (analyticsDoc.exists()) {
      return analyticsDoc.data() as WhatsAppAnalytics;
    }
    
    // Si no hay datos de análisis, inicializarlos y devolver valores predeterminados
    await initializeWhatsAppData(userId);
    return {
      totalMessages: 0,
      lastMessageTimestamp: 0,
      messagesPerDay: {},
      activeChats: 0,
      firstMessageTimestamp: Timestamp.now(),
      lastUpdated: Timestamp.now()
    } as WhatsAppAnalytics;
  } catch (error) {
    console.error("Error al obtener análisis de WhatsApp:", error);
    return null;
  }
};

/**
 * Obtiene las estadísticas de mensajes por día
 */
export const getMessagesPerDay = async (userId: string, days: number = 30) => {
  try {
    const analytics = await getWhatsAppAnalytics(userId);
    if (!analytics) return [];
    
    const messagesPerDay = analytics.messagesPerDay || {};
    const result = [];
    
    // Generar las últimas N fechas
    const dates = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]); // Formato YYYY-MM-DD
    }
    
    // Rellenar los datos
    for (const date of dates) {
      result.push({
        date,
        count: messagesPerDay[date] || 0
      });
    }
    
    return result;
  } catch (error) {
    console.error("Error al obtener mensajes por día:", error);
    return [];
  }
};

/**
 * Guía para configurar n8n para inserción directa a Firebase
 * 
 * 1. En n8n, configura un nodo de Firebase Admin para autenticación con credenciales de servicio
 * 2. Para cada mensaje de WhatsApp:
 *    - Extrae el número de teléfono del remitente (from)
 *    - Busca en Firebase el usuario con ese número de teléfono
 *    - Si encuentras un usuario, inserta el mensaje en:
 *      * users/{userId}/whatsapp/messages/{auto-id}
 *    - Actualiza las analíticas en:
 *      * users/{userId}/analytics/whatsapp
 *    - Si no encuentras un usuario, guarda el mensaje en:
 *      * unassigned_messages/{auto-id}
 *
 * Estructura recomendada del documento de mensaje:
 * {
 *   id: string,           // ID del mensaje (normalmente proporcionado por WhatsApp)
 *   messageId: string,    // ID único del mensaje (puede ser igual que id)
 *   body: string,         // Contenido del mensaje
 *   from: string,         // Número del remitente con formato internacional
 *   to: string,           // Número del destinatario
 *   timestamp: number,    // Marca de tiempo en segundos o milisegundos
 *   isFromMe: boolean,    // Si el mensaje fue enviado por el usuario o recibido
 *   senderName: string,   // Nombre del remitente si está disponible
 *   messageType: string,  // Tipo de mensaje (texto, imagen, audio, etc.)
 *   storedAt: timestamp   // Marca de tiempo de cuándo se guardó (serverTimestamp())
 * }
 *
 * Para actualizar las analíticas, incrementa los campos correspondientes:
 * - totalMessages: incrementa en 1
 * - lastMessageTimestamp: establece como el timestamp del último mensaje
 * - messagesPerDay: incrementa el contador para la fecha actual (formato YYYY-MM-DD)
 * - activeChats: incrementa si es un nuevo chat
 * - lastUpdated: actualiza con serverTimestamp()
 */ 