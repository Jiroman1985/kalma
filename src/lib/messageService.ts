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
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot,
  startAfter as firestoreStartAfter
} from "firebase/firestore";

// Interfaces para los mensajes unificados
export interface Message {
  id: string;
  platform: 'whatsapp' | 'email' | 'instagram' | 'facebook' | string;
  userId: string;
  sender: string;
  recipient: string;
  content: string;
  timestamp: Timestamp;
  threadId: string;
  isRead: boolean;
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'received';
  // Campos para clasificación IA
  sentiment?: 'positive' | 'neutral' | 'negative';
  category?: string;
  // Campos específicos por tipo
  attachments?: Attachment[];
  metadata?: Record<string, any>;
  // Campos para correos
  subject?: string;
  folder?: string;
  // Campos para métricas
  isFromMe?: boolean;
  responded?: boolean;
  responseId?: string;
  responseTimestamp?: Timestamp;
  responseTime?: number;
  aiAssisted?: boolean;
}

export interface Attachment {
  type: 'image' | 'video' | 'audio' | 'document' | 'location' | 'contact';
  url?: string;
  filename?: string;
  mimetype?: string;
  size?: number;
  // Para adjuntos de tipo location
  latitude?: number;
  longitude?: number;
  // Para adjuntos de tipo contact
  contactName?: string;
  contactPhone?: string;
}

/**
 * Obtiene mensajes de la colección unificada, con opción de filtrar por plataforma
 */
export const getMessages = async (
  userId: string,
  options: {
    platform?: string | string[];
    limit?: number;
    orderByField?: string;
    orderDirection?: 'asc' | 'desc';
    threadId?: string;
    folder?: string;
    isRead?: boolean;
    startAfter?: QueryDocumentSnapshot<DocumentData>;
  } = {}
): Promise<Message[]> => {
  try {
    const {
      platform,
      limit: messageLimit = 100,
      orderByField = 'timestamp',
      orderDirection = 'desc',
      threadId,
      folder,
      isRead,
      startAfter
    } = options;
    
    // Construir la consulta base
    let messagesQuery = query(
      collection(db, "messages"),
      where("userId", "==", userId)
    );
    
    // Añadir filtros adicionales según los parámetros
    if (platform) {
      if (Array.isArray(platform)) {
        // Para múltiples plataformas, debemos usar una consulta 'in'
        messagesQuery = query(messagesQuery, where("platform", "in", platform));
      } else {
        // Para una sola plataforma
        messagesQuery = query(messagesQuery, where("platform", "==", platform));
      }
    }
    
    if (threadId) {
      messagesQuery = query(messagesQuery, where("threadId", "==", threadId));
    }
    
    if (folder) {
      messagesQuery = query(messagesQuery, where("folder", "==", folder));
    }
    
    if (isRead !== undefined) {
      messagesQuery = query(messagesQuery, where("isRead", "==", isRead));
    }
    
    // Añadir ordenamiento
    messagesQuery = query(messagesQuery, orderBy(orderByField, orderDirection));
    
    // Añadir paginación si se proporciona un documento de inicio
    if (startAfter) {
      messagesQuery = query(messagesQuery, firestoreStartAfter(startAfter));
    }
    
    // Añadir límite
    messagesQuery = query(messagesQuery, limit(messageLimit));
    
    const querySnapshot = await getDocs(messagesQuery);
    
    // Convertir los documentos a objetos Message
    const messages: Message[] = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Message));
    
    return messages;
  } catch (error) {
    console.error("Error al obtener mensajes:", error);
    return [];
  }
};

/**
 * Ejemplo de uso de paginación con startAfter:
 * 
 * 1. Primera carga de mensajes:
 * ```
 * const firstBatch = await getMessages(userId, { limit: 20 });
 * ```
 * 
 * 2. Guardar el último documento para la siguiente consulta:
 * ```
 * let lastVisibleDoc = null;
 * if (firstBatch.length > 0) {
 *   const querySnapshot = await getDocs(query(collection(db, "messages"), where("id", "==", firstBatch[firstBatch.length - 1].id)));
 *   lastVisibleDoc = querySnapshot.docs[0];
 * }
 * ```
 * 
 * 3. Cargar el siguiente lote de mensajes usando startAfter:
 * ```
 * if (lastVisibleDoc) {
 *   const nextBatch = await getMessages(userId, { 
 *     limit: 20,
 *     startAfter: lastVisibleDoc 
 *   });
 *   setAllMessages([...allMessages, ...nextBatch]);
 * }
 * ```
 * 
 * 4. Actualizar el último documento visible para futuras consultas:
 * ```
 * if (nextBatch.length > 0) {
 *   const querySnapshot = await getDocs(query(collection(db, "messages"), where("id", "==", nextBatch[nextBatch.length - 1].id)));
 *   lastVisibleDoc = querySnapshot.docs[0];
 * }
 * ```
 * 
 * Nota: Es importante guardar el mismo documento exacto (QueryDocumentSnapshot) para startAfter,
 * no solo el ID o los datos. La función startAfter requiere el snapshot completo del documento.
 */

/**
 * Obtiene mensajes de WhatsApp específicamente (mantiene compatibilidad con código antiguo)
 */
export const getWhatsAppMessages = async (
  userId: string,
  messageLimit: number = 100
): Promise<Message[]> => {
  return getMessages(userId, {
    platform: 'whatsapp',
    limit: messageLimit
  });
};

/**
 * Obtiene mensajes de correo electrónico específicamente
 */
export const getEmailMessages = async (
  userId: string,
  options: {
    limit?: number;
    folder?: string;
    isRead?: boolean;
  } = {}
): Promise<Message[]> => {
  return getMessages(userId, {
    platform: 'email',
    ...options
  });
};

/**
 * Obtiene mensajes en una conversación específica (thread)
 */
export const getThreadMessages = async (
  userId: string,
  threadId: string,
  options: {
    limit?: number;
    platform?: string;
  } = {}
): Promise<Message[]> => {
  return getMessages(userId, {
    threadId,
    ...options
  });
};

/**
 * Guarda un nuevo mensaje en la colección unificada
 */
export const saveMessage = async (message: Omit<Message, 'id'>): Promise<string | null> => {
  try {
    // Asegurarse de que el mensaje tenga todos los campos requeridos
    const newMessage = {
      ...message,
      timestamp: message.timestamp || serverTimestamp(),
      isRead: message.isRead !== undefined ? message.isRead : false
    };
    
    // Crear un nuevo documento en la colección messages
    const docRef = await addDoc(collection(db, "messages"), newMessage);
    
    return docRef.id;
  } catch (error) {
    console.error("Error al guardar mensaje:", error);
    return null;
  }
};

/**
 * Actualiza un mensaje existente
 */
export const updateMessage = async (messageId: string, updates: Partial<Message>): Promise<boolean> => {
  try {
    const messageRef = doc(db, "messages", messageId);
    await updateDoc(messageRef, updates);
    return true;
  } catch (error) {
    console.error(`Error al actualizar mensaje ${messageId}:`, error);
    return false;
  }
};

/**
 * Marca un mensaje como leído
 */
export const markMessageAsRead = async (messageId: string): Promise<boolean> => {
  return updateMessage(messageId, { 
    isRead: true,
    status: 'read'
  });
};

/**
 * Marca todos los mensajes de un hilo como leídos
 */
export const markThreadAsRead = async (userId: string, threadId: string): Promise<boolean> => {
  try {
    const messagesQuery = query(
      collection(db, "messages"),
      where("userId", "==", userId),
      where("threadId", "==", threadId),
      where("isRead", "==", false)
    );
    
    const querySnapshot = await getDocs(messagesQuery);
    
    // Actualizar cada mensaje no leído en el hilo
    const updatePromises = querySnapshot.docs.map(doc => 
      updateDoc(doc.ref, { 
        isRead: true,
        status: 'read'
      })
    );
    
    await Promise.all(updatePromises);
    return true;
  } catch (error) {
    console.error(`Error al marcar hilo ${threadId} como leído:`, error);
    return false;
  }
};

/**
 * Obtiene todos los hilos de conversación de un usuario
 * Agrupa los mensajes por threadId y devuelve el mensaje más reciente de cada hilo
 */
export const getConversationThreads = async (
  userId: string,
  options: {
    platforms?: string[];
    limit?: number;
  } = {}
): Promise<Message[]> => {
  try {
    const { platforms, limit: threadLimit = 50 } = options;
    
    console.log('[messageService] Obteniendo hilos para usuario:', userId);
    console.log('[messageService] Plataformas solicitadas:', platforms);
    
    // Consulta para obtener mensajes con un campo adicional que permita ordenarlos por hilo
    let messagesQuery = query(
      collection(db, "messages"),
      where("userId", "==", userId)
    );
    
    // Filtrar por plataformas si se especifican
    if (platforms && platforms.length > 0) {
      console.log('[messageService] Filtrando por plataformas específicas:', platforms);
      messagesQuery = query(messagesQuery, where("platform", "in", platforms));
    }
    
    // Ordenar por timestamp descendente para obtener los más recientes primero
    messagesQuery = query(messagesQuery, orderBy("timestamp", "desc"));
    
    console.log('[messageService] Ejecutando consulta...');
    const querySnapshot = await getDocs(messagesQuery);
    console.log('[messageService] Mensajes encontrados:', querySnapshot.size);
    
    // Mapa para almacenar el mensaje más reciente de cada hilo
    const threadMap = new Map<string, Message>();
    
    // Depurar campo platform
    const platformCounts: Record<string, number> = {};
    
    // Procesar cada mensaje
    querySnapshot.docs.forEach(doc => {
      const message = { id: doc.id, ...doc.data() } as Message;
      const threadId = message.threadId || 'default';
      
      // Contar plataformas
      const platform = message.platform || 'undefined';
      platformCounts[platform] = (platformCounts[platform] || 0) + 1;
      
      // Si el hilo aún no está en el mapa o este mensaje es más reciente, guardarlo
      if (!threadMap.has(threadId)) {
        threadMap.set(threadId, message);
      }
    });
    
    console.log('[messageService] Conteo de plataformas:', platformCounts);
    
    // Convertir el mapa a un array y ordenar por timestamp descendente
    const threads = Array.from(threadMap.values())
      .sort((a, b) => {
        const timestampA = a.timestamp?.toMillis() || 0;
        const timestampB = b.timestamp?.toMillis() || 0;
        return timestampB - timestampA;
      })
      .slice(0, threadLimit);
    
    console.log('[messageService] Hilos únicos encontrados:', threads.length);
    console.log('[messageService] Plataformas en hilos:', threads.map(t => t.platform));
    
    return threads;
  } catch (error) {
    console.error("Error al obtener hilos de conversación:", error);
    return [];
  }
};

export default {
  getMessages,
  getWhatsAppMessages,
  getEmailMessages,
  getThreadMessages,
  saveMessage,
  updateMessage,
  markMessageAsRead,
  markThreadAsRead,
  getConversationThreads
}; 