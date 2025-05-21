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
  try {
    console.log('[getWhatsAppMessages] Iniciando carga para usuario:', userId);
    const messages: Message[] = [];

    // ESTRATEGIA 1: Acceder directamente a los documentos en la colección users/{userId}/whatsapp
    // Esta es la estructura confirmada por la captura de pantalla del usuario.
    const whatsappCollectionRef = collection(db, "users", userId, "whatsapp");
    // No aplicaremos orderBy("timestamp") inicialmente para asegurar que leemos los documentos
    // ya que si el campo timestamp no existe o tiene un formato incorrecto, la consulta puede fallar.
    const whatsappQuery = query(whatsappCollectionRef, limit(messageLimit)); 

    console.log('[getWhatsAppMessages] Consultando:', `users/${userId}/whatsapp`);
    const querySnapshot = await getDocs(whatsappQuery);
    console.log('[getWhatsAppMessages] Documentos encontrados:', querySnapshot.size);

    if (querySnapshot.empty) {
      console.log('[getWhatsAppMessages] No se encontraron documentos en la colección de WhatsApp.');
      return []; // Si no hay documentos, retornamos un array vacío.
    }

    // Analizar el primer documento para verificar la estructura de campos
    const firstDocData = querySnapshot.docs[0].data();
    console.log('[getWhatsAppMessages] Estructura del primer documento:', Object.keys(firstDocData));
    console.log('[getWhatsAppMessages] Datos del primer documento (muestra):', {
      id: querySnapshot.docs[0].id,
      body: firstDocData.body?.substring(0, 50),
      from: firstDocData.from,
      to: firstDocData.to,
      timestamp: firstDocData.timestamp, // Mostrar el timestamp tal como viene
      category: firstDocData.category,
      isFromMe: firstDocData.isFromMe,
      messageId: firstDocData.messageId
    });

    querySnapshot.forEach(doc => {
      const data = doc.data();
      
      // Determinar el threadId. Para WhatsApp, usualmente es el número del interlocutor.
      // Si el mensaje es 'isFromMe', el interlocutor es 'to'. Si no, es 'from'.
      // Es importante normalizar el número de teléfono (ej. quitar '@c.us')
      let contactNumber = data.isFromMe ? data.to : data.from;
      if (contactNumber && typeof contactNumber === 'string') {
        contactNumber = contactNumber.replace('@c.us', '');
      }

      // Asegurar que el timestamp es un objeto Timestamp de Firebase
      // Si viene como string o número, intentar convertirlo.
      let finalTimestamp: Timestamp;
      if (data.timestamp instanceof Timestamp) {
        finalTimestamp = data.timestamp;
      } else if (data.timestamp && data.timestamp.seconds) {
        // Es probable que sea un objeto Timestamp serializado
        finalTimestamp = new Timestamp(data.timestamp.seconds, data.timestamp.nanoseconds);
      } else if (typeof data.timestamp === 'string' || typeof data.timestamp === 'number') {
        try {
          finalTimestamp = Timestamp.fromDate(new Date(data.timestamp));
        } catch (e) {
          console.warn(`[getWhatsAppMessages] No se pudo convertir timestamp: ${data.timestamp}, usando fecha actual.`);
          finalTimestamp = Timestamp.now(); // Fallback a la fecha actual
        }
      } else {
        console.warn(`[getWhatsAppMessages] Timestamp ausente o formato desconocido para doc ${doc.id}, usando fecha actual.`);
        finalTimestamp = Timestamp.now(); // Fallback si no hay timestamp
      }

      messages.push({
        id: doc.id, // ID del documento en Firestore
        platform: 'whatsapp',
        userId: userId,
        sender: data.from ? data.from.replace('@c.us', '') : '', // Quien envía el mensaje (normalizado)
        recipient: data.to ? data.to.replace('@c.us', '') : '', // Quien recibe el mensaje (normalizado)
        content: data.body || '', // Contenido del mensaje
        timestamp: finalTimestamp, // Timestamp del mensaje
        threadId: contactNumber || doc.id, // ID del hilo de conversación (número del contacto o ID del doc como fallback)
        isRead: !!data.isRead, // Booleano, si el mensaje fue leído
        status: data.status || 'received', // Estado del mensaje: sent, delivered, read, failed, received
        isFromMe: !!data.isFromMe, // Booleano, si el mensaje fue enviado por el usuario actual
        sentiment: data.sentiment, // Sentimiento (opcional)
        category: data.category, // Categoría (opcional)
        // Campos específicos de WhatsApp (si los tienes y quieres pasarlos)
        metadata: {
          whatsappMessageId: data.messageId, // ID original del mensaje de WhatsApp
          ...(data.messageType && { messageType: data.messageType }),
          ...(data.agentResponse !== undefined && { agentResponse: data.agentResponse }),
          ...(data.hourOfDay !== undefined && { hourOfDay: data.hourOfDay }),
          ...(data.minutesOfDay !== undefined && { minutesOfDay: data.minutesOfDay }),
          ...(data.day !== undefined && { day: data.day }),
          ...(data.month !== undefined && { month: data.month }),
        }
      } as Message);
    });

    // Ordenar los mensajes por timestamp después de obtenerlos y convertirlos
    messages.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));

    console.log('[getWhatsAppMessages] Mensajes procesados y ordenados:', messages.length);
    if(messages.length > 0){
      console.log('[getWhatsAppMessages] Ejemplo de mensaje convertido:', messages[0]);
    }
    return messages;

  } catch (error) {
    console.error("[getWhatsAppMessages] Error general al obtener mensajes de WhatsApp:", error);
    // Devolver un array vacío en caso de error para no romper la UI
    return []; 
  }
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
    
    // Almacenar todos los mensajes aquí
    let allMessages: Message[] = [];
    
    // 1. Obtener mensajes de la colección unificada "messages"
    let messagesQuery = query(
      collection(db, "messages"),
      where("userId", "==", userId)
    );
    
    // Filtrar por plataformas si se especifican (excepto whatsapp que se obtiene por separado)
    if (platforms && platforms.length > 0) {
      // Filtrar whatsapp ya que se obtiene de otra ubicación
      const filteredPlatforms = platforms.filter(p => p !== 'whatsapp');
      if (filteredPlatforms.length > 0) {
        console.log('[messageService] Filtrando por plataformas específicas:', filteredPlatforms);
        messagesQuery = query(messagesQuery, where("platform", "in", filteredPlatforms));
      }
    }
    
    // Ordenar por timestamp descendente para obtener los más recientes primero
    messagesQuery = query(messagesQuery, orderBy("timestamp", "desc"));
    
    console.log('[messageService] Ejecutando consulta de mensajes unificados...');
    const querySnapshot = await getDocs(messagesQuery);
    console.log('[messageService] Mensajes unificados encontrados:', querySnapshot.size);
    
    // Agregar mensajes unificados
    querySnapshot.docs.forEach(doc => {
      allMessages.push({ id: doc.id, ...doc.data() } as Message);
    });

    // 2. Obtener mensajes de WhatsApp si no se ha excluido en las plataformas
    if (!platforms || platforms.length === 0 || platforms.includes('whatsapp')) {
      console.log('[messageService] Obteniendo mensajes de WhatsApp...');
      try {
        // Utilizamos la función específica para WhatsApp
        const whatsappMessages = await getWhatsAppMessages(userId, 100);
        console.log('[messageService] Mensajes de WhatsApp encontrados:', whatsappMessages.length);
        
        // Agregar a la lista de todos los mensajes
        allMessages = [...allMessages, ...whatsappMessages];
      } catch (whatsappError) {
        console.error("Error al obtener mensajes de WhatsApp:", whatsappError);
      }
    }
    
    // Mapa para almacenar el mensaje más reciente de cada hilo
    const threadMap = new Map<string, Message>();
    
    // Depurar campo platform
    const platformCounts: Record<string, number> = {};
    
    // Procesar cada mensaje
    allMessages.forEach(message => {
      const threadId = message.threadId || 'default';
      
      // Contar plataformas
      const platform = message.platform || 'undefined';
      platformCounts[platform] = (platformCounts[platform] || 0) + 1;
      
      // Si el hilo aún no está en el mapa o este mensaje es más reciente, guardarlo
      if (!threadMap.has(threadId)) {
        threadMap.set(threadId, message);
      } else {
        const existingMessage = threadMap.get(threadId)!;
        // Comprobar cuál es más reciente
        const existingTime = existingMessage.timestamp?.toMillis() || 0;
        const newTime = message.timestamp?.toMillis() || 0;
        if (newTime > existingTime) {
          threadMap.set(threadId, message);
        }
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