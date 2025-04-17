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
  // Campos adicionales para respuestas y categorización
  category?: string;             // Categoría: consulta, venta, soporte, otro
  responded?: boolean;           // Si el mensaje ha sido respondido
  responseId?: string;           // ID del mensaje de respuesta (si existe)
  responseTimestamp?: number;    // Cuándo fue respondido
  agentResponse?: boolean;       // Si fue respondido por el agente IA
  responseTime?: number;         // Tiempo que tardó en ser respondido (ms)
  hourOfDay?: number;            // Hora del día en que se recibió (0-23)
  originalMessageId?: string;    // Para respuestas, el ID del mensaje original
}

// Define la interfaz para los análisis de WhatsApp
export interface WhatsAppAnalytics {
  totalMessages: number;
  lastMessageTimestamp: number | Timestamp;
  messagesPerDay: Record<string, number>;
  activeChats: number;
  firstMessageTimestamp?: Timestamp;
  lastUpdated?: Timestamp;
  // Campos adicionales para analytics extendidos
  respondedMessages?: number;                // Total de mensajes respondidos
  unrespondedMessages?: number;              // Total sin responder
  avgResponseTime?: number;                  // Tiempo promedio de respuesta (ms)
  agentResponses?: number;                   // Respuestas por IA
  humanResponses?: number;                   // Respuestas humanas
  messageCategories?: {                      // Distribución por categoría
    consultas: number;
    ventas: number;
    soporte: number;
    otros: number;
  };
  messagesByHour?: Record<string, number>;   // Distribución por hora
  activeByWeekday?: Record<string, number>;  // Actividad por día de la semana
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
export const initializeWhatsAppData = async (userId: string, preloadedData?: WhatsAppAnalytics) => {
  try {
    console.log("Inicializando datos de WhatsApp para userId:", userId);
    
    const whatsappRef = doc(db, 'users', userId);
    const whatsappDoc = await getDoc(whatsappRef);
    
    if (!whatsappDoc.exists()) {
      console.log("El documento usuario no existe, creándolo ahora...");
      
      // Crear estructura inicial para análisis de WhatsApp, usando datos precalculados si existen
      const initialData = preloadedData || {
        whatsapp: {
          totalMessages: 0,
          lastMessageTimestamp: 0,
          messagesPerDay: {},
          activeChats: 0,
          firstMessageTimestamp: serverTimestamp(),
          lastUpdated: serverTimestamp(),
          // Campos adicionales
          respondedMessages: 0,
          unrespondedMessages: 0,
          avgResponseTime: 0,
          agentResponses: 0,
          humanResponses: 0,
          messageCategories: {
            consultas: 0,
            ventas: 0,
            soporte: 0,
            otros: 0
          },
          messagesByHour: {},
          activeByWeekday: {
            "0": 0, "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0
          }
        }
      };
      
      await setDoc(whatsappRef, initialData);
      console.log("Estructura de datos de WhatsApp inicializada exitosamente", 
        preloadedData ? "con datos precalculados" : "con valores por defecto");
      
      // Verificar que se creó correctamente
      const verifyDoc = await getDoc(whatsappRef);
      if (verifyDoc.exists()) {
        console.log("Verificación exitosa - Documento creado");
      } else {
        console.error("Error: El documento no se creó correctamente");
      }
      
      return true;
    } else {
      console.log("El documento usuario ya existe, verificando si tiene datos de WhatsApp");
      const data = whatsappDoc.data();
      
      // Si no tiene el campo whatsapp, añadirlo
      if (!data.whatsapp) {
        console.log("Añadiendo campo whatsapp al documento existente");
        await updateDoc(whatsappRef, {
          whatsapp: {
            totalMessages: 0,
            lastMessageTimestamp: 0,
            messagesPerDay: {},
            activeChats: 0,
            firstMessageTimestamp: serverTimestamp(),
            lastUpdated: serverTimestamp(),
            respondedMessages: 0,
            unrespondedMessages: 0,
            avgResponseTime: 0,
            agentResponses: 0,
            humanResponses: 0,
            messageCategories: {
              consultas: 0,
              ventas: 0,
              soporte: 0,
              otros: 0
            },
            messagesByHour: {},
            activeByWeekday: {
              "0": 0, "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0
            }
          }
        });
        console.log("Campo whatsapp añadido correctamente");
      }
      
      return true;
    }
  } catch (error) {
    console.error("Error al inicializar datos de WhatsApp:", error);
    return false;
  }
};

/**
 * Obtiene los mensajes de WhatsApp de un usuario
 */
export const getWhatsAppMessages = async (userId: string, limitCount: number = 50) => {
  try {
    // Obtener el documento del usuario
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    console.log("Obteniendo documento usuario para mensajes:", 'users', userId);
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      console.log("Documento usuario encontrado:", data);
      
      // Verificar si tiene el campo whatsapp
      if (data.whatsapp) {
        const whatsappData = data.whatsapp;
        
        // Extraer los mensajes relevantes del documento
        const messages: WhatsAppMessage[] = [];
        
        // Verificar si los campos del mensaje están directamente en el documento whatsapp
        if (whatsappData.messageId && whatsappData.body) {
          // Si los campos del mensaje están directamente en el documento
          messages.push({
            id: whatsappData.messageId || 'unknown',
            messageId: whatsappData.messageId || 'unknown',
            body: whatsappData.body || '',
            from: whatsappData.from || '',
            to: whatsappData.to || '',
            timestamp: whatsappData.timestamp || 0,
            isFromMe: whatsappData.isFromMe || false,
            senderName: whatsappData.senderName || '',
            messageType: whatsappData.messageType || 'chat',
            category: whatsappData.category || 'otros',
            responded: whatsappData.responded || false,
            responseId: whatsappData.responseId || null,
            responseTime: whatsappData.responseTime || null,
            hourOfDay: whatsappData.hourOfDay || 0,
            day: whatsappData.day || 1,
            month: whatsappData.month || 1,
            minutesOfDay: whatsappData.minutesOfDay || 0
          } as WhatsAppMessage);
        }
        
        return messages;
      } else {
        console.log("No se encontró el campo whatsapp en el documento del usuario");
        return [];
      }
    } else {
      console.log("Documento usuario no encontrado para el usuario:", userId);
      return [];
    }
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
    // Obtener el documento del usuario
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    console.log("Intentando obtener analytics de:", 'users', userId);
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      console.log("Datos de usuario obtenidos:", data);
      
      // Verificar si tiene el campo whatsapp
      if (data.whatsapp) {
        const whatsappData = data.whatsapp;
        console.log("Datos de WhatsApp encontrados:", whatsappData);
        
        // Si el documento ya tiene un objeto con la estructura de analytics, usarlo directamente
        if (whatsappData.totalMessages !== undefined) {
          return whatsappData as WhatsAppAnalytics;
        }
        
        // Si no tiene la estructura completa, construir el objeto de analytics
        // a partir de los datos directos del documento
        const analyticsData: WhatsAppAnalytics = {
          totalMessages: 1, // Siempre hay al menos un mensaje si el documento existe
          lastMessageTimestamp: whatsappData.timestamp || Date.now(),
          messagesPerDay: {}, // Se calculará a continuación
          activeChats: 1, // Al menos un chat activo
          firstMessageTimestamp: new Timestamp(Math.floor((whatsappData.timestamp || Date.now()) / 1000), 0),
          lastUpdated: Timestamp.now(),
          respondedMessages: whatsappData.responded ? 1 : 0,
          unrespondedMessages: whatsappData.responded ? 0 : 1,
          avgResponseTime: whatsappData.responseTime || 0,
          agentResponses: whatsappData.agentResponse ? 1 : 0,
          humanResponses: 0,
          messageCategories: {
            consultas: whatsappData.category === 'consulta' ? 1 : 0,
            ventas: whatsappData.category === 'venta' ? 1 : 0,
            soporte: whatsappData.category === 'soporte' ? 1 : 0,
            otros: ['consulta', 'venta', 'soporte'].includes(whatsappData.category || '') ? 0 : 1
          },
          messagesByHour: {},
          activeByWeekday: { "0": 0, "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0 }
        };
        
        // Calcular fecha del mensaje para messagesPerDay
        if (whatsappData.timestamp) {
          const messageDate = new Date(whatsappData.timestamp);
          const dateStr = messageDate.toISOString().split('T')[0]; // Formato YYYY-MM-DD
          analyticsData.messagesPerDay[dateStr] = 1;
          
          // Calcular día de la semana para activeByWeekday
          const dayOfWeek = messageDate.getDay().toString();
          analyticsData.activeByWeekday[dayOfWeek] = 1;
          
          // Calcular hora para messagesByHour
          const hour = messageDate.getHours().toString();
          analyticsData.messagesByHour[hour] = 1;
        } else if (whatsappData.hourOfDay !== undefined) {
          // Si no hay timestamp pero hay hourOfDay, usar eso para messagesByHour
          const hourStr = whatsappData.hourOfDay.toString();
          analyticsData.messagesByHour[hourStr] = 1;
          
          // Usar day y month para aproximar messagesPerDay
          if (whatsappData.day && whatsappData.month) {
            const currentYear = new Date().getFullYear();
            const dateObj = new Date(currentYear, whatsappData.month - 1, whatsappData.day);
            const dateStr = dateObj.toISOString().split('T')[0];
            analyticsData.messagesPerDay[dateStr] = 1;
            
            // Calcular día de la semana
            const dayOfWeek = dateObj.getDay().toString();
            analyticsData.activeByWeekday[dayOfWeek] = 1;
          }
        }
        
        return analyticsData;
      }
    }
    
    console.log("No se encontraron datos de whatsapp para el usuario:", userId);
    
    // Si no existe el documento usuario o no tiene campo whatsapp, inicializar con valores por defecto
    await initializeWhatsAppData(userId);
    return {
      totalMessages: 0,
      lastMessageTimestamp: 0,
      messagesPerDay: {},
      activeChats: 0,
      firstMessageTimestamp: Timestamp.now(),
      lastUpdated: Timestamp.now(),
      // Campos adicionales
      respondedMessages: 0,
      unrespondedMessages: 0,
      avgResponseTime: 0,
      agentResponses: 0,
      humanResponses: 0,
      messageCategories: {
        consultas: 0,
        ventas: 0,
        soporte: 0,
        otros: 0
      },
      messagesByHour: {},
      activeByWeekday: {
        "0": 0, "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0
      }
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
 *      * users/{userId}/whatsapp
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