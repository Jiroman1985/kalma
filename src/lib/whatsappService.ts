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
  getDocs
} from "firebase/firestore";

// Define la interfaz para los mensajes de WhatsApp
export interface WhatsAppMessage {
  id: string;
  messageId: string;
  body: string;
  from: string;
  to: string;
  timestamp: number;
  isFromMe: boolean;
  senderName: string;
  messageType: string;
}

// Define la interfaz para los análisis de WhatsApp
export interface WhatsAppAnalytics {
  totalMessages: number;
  lastMessageTimestamp: number;
  messagesPerDay: Record<string, number>;
  activeChats: number;
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
 * Guarda un mensaje de WhatsApp en Firebase
 */
export const saveWhatsAppMessage = async (userId: string, message: WhatsAppMessage) => {
  try {
    // Guardar el mensaje en la colección de mensajes
    const messagesRef = collection(db, `users/${userId}/whatsapp/messages`);
    await addDoc(messagesRef, {
      ...message,
      storedAt: serverTimestamp(),
    });
    
    // Actualizar los análisis
    const today = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
    const analyticsRef = doc(db, `users/${userId}/analytics/whatsapp`);
    const analyticsDoc = await getDoc(analyticsRef);
    
    if (analyticsDoc.exists()) {
      const data = analyticsDoc.data();
      
      // Actualizar contadores
      const messagesPerDay = data.messagesPerDay || {};
      messagesPerDay[today] = (messagesPerDay[today] || 0) + 1;
      
      await updateDoc(analyticsRef, {
        totalMessages: (data.totalMessages || 0) + 1,
        lastMessageTimestamp: message.timestamp,
        messagesPerDay,
        lastUpdated: serverTimestamp()
      });
    }
    
    return true;
  } catch (error) {
    console.error("Error al guardar mensaje de WhatsApp:", error);
    return false;
  }
};

/**
 * Procesa un mensaje entrante de WhatsApp desde n8n
 * Esta función se llamaría desde tu API cuando recibas un webhook de n8n
 */
export const processWhatsAppWebhook = async (webhookData: any) => {
  try {
    if (!webhookData || !webhookData.body || !webhookData.body.data) {
      console.error("Datos de webhook inválidos");
      return { success: false, error: "Datos inválidos" };
    }
    
    const messageData = webhookData.body.data;
    
    // Extraer número de teléfono limpio
    const senderPhone = messageData.from.replace('@c.us', '');
    
    // Buscar usuario por número de teléfono
    let userId = null;
    const user = await findUserByPhoneNumber(senderPhone);
    
    if (user) {
      userId = user.id;
    } else {
      console.log("Usuario no encontrado para el número:", senderPhone);
      // Podrías implementar lógica para crear usuarios automáticamente o
      // almacenar mensajes en una colección general para usuarios no identificados
      return { success: false, error: "Usuario no encontrado" };
    }
    
    // Inicializar estructura de datos de WhatsApp si es necesario
    await initializeWhatsAppData(userId);
    
    // Crear objeto de mensaje estructurado
    const whatsappMessage: WhatsAppMessage = {
      id: messageData.id,
      messageId: messageData.mId || messageData.id.split('_').pop(),
      body: messageData.body || messageData.content || '',
      from: messageData.from,
      to: messageData.to,
      timestamp: messageData.timestamp || messageData.t,
      isFromMe: messageData.fromMe || false,
      senderName: messageData.notifyName || messageData.sender?.pushname || '',
      messageType: messageData.type || 'chat'
    };
    
    // Guardar mensaje en Firestore
    await saveWhatsAppMessage(userId, whatsappMessage);
    
    return { success: true, userId };
    
  } catch (error) {
    console.error("Error al procesar webhook de WhatsApp:", error);
    return { success: false, error: error.message };
  }
}; 