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
    
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.log("El documento usuario no existe, creándolo ahora...");
      
      // Crear documento de usuario con campo whatsapp
      const initialData = {
        whatsapp: preloadedData || {
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
      };
      
      await setDoc(userRef, initialData);
      console.log("Documento usuario creado con campo whatsapp");
      
      return true;
    } else {
      console.log("El documento usuario ya existe, verificando si tiene datos de WhatsApp");
      const userData = userDoc.data();
      
      // Si no tiene el campo whatsapp o el campo está incompleto, actualizarlo
      if (!userData.whatsapp || !userData.whatsapp.totalMessages) {
        console.log("Actualizando campo whatsapp en documento existente");
        
        await updateDoc(userRef, {
          whatsapp: preloadedData || {
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
        
        console.log("Campo whatsapp actualizado correctamente");
      } else {
        console.log("El campo whatsapp ya existe y está completo");
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
    // Obtener documentos de la colección "whatsapp" para el usuario específico
    // Usando collectionGroup para evitar problemas con la estructura de segmentos
    const whatsappCollectionRef = collection(db, 'users', userId, 'whatsapp');
    const q = query(whatsappCollectionRef, orderBy("timestamp", "desc"), limit(limitCount));
    
    console.log("Consultando colección whatsapp para userId:", userId);
    const querySnapshot = await getDocs(q);
    
    console.log(`Se encontraron ${querySnapshot.size} mensajes de WhatsApp`);
    
    const messages: WhatsAppMessage[] = [];
    
    querySnapshot.forEach(doc => {
      const data = doc.data();
      messages.push({
        id: doc.id,
        messageId: data.messageId || doc.id,
        body: data.body || '',
        from: data.from || '',
        to: data.to || '',
        timestamp: data.timestamp || 0,
        isFromMe: data.isFromMe || false,
        senderName: data.senderName || '',
        messageType: data.messageType || 'chat',
        category: data.category || 'otros',
        responded: data.responded || false,
        responseId: data.responseId || null,
        responseTime: data.responseTime || null,
        hourOfDay: data.hourOfDay || 0,
        day: data.day || 1,
        month: data.month || 1,
        minutesOfDay: data.minutesOfDay || 0
      } as WhatsAppMessage);
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
export const getWhatsAppAnalytics = async (userId: string, forceRegenerate: boolean = true) => {
  try {
    // Referencia al documento de usuario
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    console.log("Intentando obtener analytics del usuario:", userId);
    
    // Verificar si existe el campo whatsapp en el documento usuario y si no se solicitó regeneración
    if (!forceRegenerate && userDoc.exists() && userDoc.data().whatsapp && userDoc.data().whatsapp.totalMessages !== undefined) {
      console.log("Analytics encontrados en el campo whatsapp del usuario");
      return userDoc.data().whatsapp as WhatsAppAnalytics;
    }
    
    // Si tenemos que regenerar o no existen datos, generarlos a partir de los mensajes
    console.log("Generando analytics a partir de los mensajes...");
    const whatsappCollectionRef = collection(db, 'users', userId, 'whatsapp');
    const messagesQuery = query(whatsappCollectionRef);
    const messagesSnapshot = await getDocs(messagesQuery);
    
    console.log(`Se encontraron ${messagesSnapshot.size} mensajes para generar analytics`);
    
    // Si no hay mensajes, crear estructura con valores por defecto
    if (messagesSnapshot.empty) {
      console.log("No hay mensajes, creando estructura de analytics vacía");
      
      // Estructura básica de analytics vacíos
      const emptyAnalytics = {
        totalMessages: 0,
        lastMessageTimestamp: 0,
        messagesPerDay: {},
        activeChats: 0,
        firstMessageTimestamp: Timestamp.now(),
        lastUpdated: Timestamp.now(),
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
      
      // Guardar analytics vacíos en el documento usuario
      await updateDoc(userRef, { whatsapp: emptyAnalytics });
      
      return emptyAnalytics;
    }
    
    // Calcular métricas a partir de los mensajes existentes
    const messagesPerDay: Record<string, number> = {};
    const messagesByHour: Record<string, number> = {};
    const activeByWeekday: Record<string, number> = { "0": 0, "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0 };
    const messageCategories = { consultas: 0, ventas: 0, soporte: 0, otros: 0 };
    
    let firstMessageTimestamp: Timestamp | null = null;
    let lastMessageTimestamp = 0;
    let respondedMessages = 0;
    let unrespondedMessages = 0;
    let agentResponses = 0;
    let humanResponses = 0;
    
    // Conjunto de remitentes únicos para contar chats activos
    const senders = new Set<string>();
    
    // Depuración para entender cada mensaje
    let msgCount = 0;
    
    // Procesar cada mensaje para calcular métricas
    messagesSnapshot.forEach(doc => {
      msgCount++;
      const message = doc.data();
      
      console.log(`Procesando mensaje ${msgCount}: ID=${doc.id}`, message);
      
      // Añadir remitente para contar chats activos
      if (message.from) {
        senders.add(message.from);
      }
      
      // Fecha del mensaje para agrupar por día
      let messageDate = new Date();
      if (message.timestamp) {
        if (typeof message.timestamp === 'number') {
          messageDate = new Date(message.timestamp);
        } else if (message.timestamp.toDate) {
          messageDate = message.timestamp.toDate();
        }
      } else if (message.day && message.month) {
        // Si no hay timestamp pero hay day y month
        const currentYear = new Date().getFullYear();
        messageDate = new Date(currentYear, message.month - 1, message.day);
      }
      
      const dateStr = messageDate.toISOString().split('T')[0];
      messagesPerDay[dateStr] = (messagesPerDay[dateStr] || 0) + 1;
      
      // Hora del día
      const hour = message.hourOfDay !== undefined 
        ? message.hourOfDay.toString() 
        : messageDate.getHours().toString();
        
      messagesByHour[hour] = (messagesByHour[hour] || 0) + 1;
      
      // Día de la semana
      const dayOfWeek = messageDate.getDay().toString();
      activeByWeekday[dayOfWeek] = (activeByWeekday[dayOfWeek] || 0) + 1;
      
      // Categoría del mensaje
      if (message.category) {
        const category = message.category.toLowerCase();
        if (category.includes('consulta')) {
          messageCategories.consultas += 1;
        } else if (category.includes('venta')) {
          messageCategories.ventas += 1;
        } else if (category.includes('soporte')) {
          messageCategories.soporte += 1;
        } else {
          messageCategories.otros += 1;
        }
      } else {
        messageCategories.otros += 1;
      }
      
      // Analizar timestamp para primera/última actividad
      const messageTimestamp = message.timestamp 
        ? (typeof message.timestamp === 'number' 
            ? message.timestamp 
            : message.timestamp.toMillis ? message.timestamp.toMillis() : Date.now()) 
        : Date.now();
        
      if (!firstMessageTimestamp || messageTimestamp < firstMessageTimestamp.toMillis()) {
        firstMessageTimestamp = new Timestamp(Math.floor(messageTimestamp / 1000), 0);
      }
      
      if (messageTimestamp > lastMessageTimestamp) {
        lastMessageTimestamp = messageTimestamp;
      }
      
      // Conteo de mensajes respondidos/sin responder y respuestas por agente
      if (message.responded) {
        respondedMessages += 1;
        console.log(`Mensaje ${doc.id} de ${message.from} marcado como respondido`);
        
        // Verificar si la respuesta fue por agente o humano
        if (message.agentResponse === true) {
          agentResponses += 1;
          console.log(`Mensaje ${doc.id} respondido por AGENTE`);
        } else {
          humanResponses += 1;
          console.log(`Mensaje ${doc.id} respondido por HUMANO`);
        }
      } else {
        unrespondedMessages += 1;
      }
    });
    
    // Calcular tiempo promedio de respuesta si hay datos disponibles
    let avgResponseTime = 0;
    if (respondedMessages > 0) {
      // Calcular a partir de los mensajes con responseTime
      let totalResponseTime = 0;
      let messagesWithResponseTime = 0;
      
      messagesSnapshot.forEach(doc => {
        const message = doc.data();
        if (message.responseTime && typeof message.responseTime === 'number') {
          totalResponseTime += message.responseTime;
          messagesWithResponseTime++;
        }
      });
      
      if (messagesWithResponseTime > 0) {
        avgResponseTime = Math.round(totalResponseTime / messagesWithResponseTime);
      }
    }
    
    // Crear objeto de analytics completo
    const analyticsData: WhatsAppAnalytics = {
      totalMessages: messagesSnapshot.size,
      lastMessageTimestamp,
      messagesPerDay,
      activeChats: senders.size,
      firstMessageTimestamp: firstMessageTimestamp || Timestamp.now(),
      lastUpdated: Timestamp.now(),
      respondedMessages,
      unrespondedMessages,
      avgResponseTime, 
      agentResponses, 
      humanResponses, 
      messageCategories,
      messagesByHour,
      activeByWeekday
    };
    
    console.log("Analytics generados correctamente:", analyticsData);
    
    // Guardar estos analytics en el documento de usuario para futuras consultas
    await updateDoc(userRef, { whatsapp: analyticsData });
    console.log("Analytics guardados en el documento de usuario");
    
    return analyticsData;
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
 * Calcula tiempo de vida ahorrado basado en las respuestas automatizadas
 * @param userId ID del usuario
 * @param minutesSavedPerMessage Minutos ahorrados por cada mensaje respondido automáticamente
 * @returns Objeto con horas, minutos y total en minutos
 */
export const calculateTimeSaved = async (userId: string, minutesSavedPerMessage: number = 3) => {
  try {
    // Obtener los analytics y usar respondedMessages y agentResponses
    const analytics = await getWhatsAppAnalytics(userId);
    
    if (!analytics) return { hours: 0, minutes: 0, totalMinutes: 0 };
    
    // Usar agentResponses si está disponible, de lo contrario usar respondedMessages
    const totalResponses = analytics.agentResponses || analytics.respondedMessages || 0;
    
    // Calcular tiempo total ahorrado en minutos
    const totalMinutesSaved = totalResponses * minutesSavedPerMessage;
    
    // Convertir a horas y minutos
    const hours = Math.floor(totalMinutesSaved / 60);
    const minutes = totalMinutesSaved % 60;
    
    return {
      hours,
      minutes,
      totalMinutes: totalMinutesSaved
    };
  } catch (error) {
    console.error("Error al calcular tiempo ahorrado:", error);
    return { hours: 0, minutes: 0, totalMinutes: 0 };
  }
};

/**
 * Calcula el tiempo promedio de respuesta en minutos
 */
export const calculateAverageResponseTime = async (userId: string) => {
  try {
    const analytics = await getWhatsAppAnalytics(userId);
    
    if (!analytics || !analytics.avgResponseTime) return 0;
    
    // Convertir de milisegundos a minutos
    return Math.round((analytics.avgResponseTime / 60000) * 10) / 10; // Redondear a 1 decimal
  } catch (error) {
    console.error("Error al calcular tiempo promedio de respuesta:", error);
    return 0;
  }
};

/**
 * Obtiene estadísticas semanales de mensajes
 */
export const getWeeklyStats = async (userId: string) => {
  try {
    // Obtener los últimos 7 días de datos
    const messagesPerDayData = await getMessagesPerDay(userId, 7);
    
    // Calcular total de mensajes en la semana
    const totalWeeklyMessages = messagesPerDayData.reduce((acc, day) => acc + day.count, 0);
    
    // Calcular promedio diario
    const averagePerDay = totalWeeklyMessages / 7;
    
    // Calcular día con más actividad
    let maxDay = { date: '', count: 0 };
    messagesPerDayData.forEach(day => {
      if (day.count > maxDay.count) {
        maxDay = day;
      }
    });
    
    // Formatear día de más actividad
    const date = new Date(maxDay.date);
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const mostActiveDay = dayNames[date.getDay()];
    
    return {
      totalWeeklyMessages,
      averagePerDay: Math.round(averagePerDay * 10) / 10,
      mostActiveDay,
      mostActiveDayCount: maxDay.count,
      dailyData: messagesPerDayData
    };
  } catch (error) {
    console.error("Error al obtener estadísticas semanales:", error);
    return {
      totalWeeklyMessages: 0,
      averagePerDay: 0,
      mostActiveDay: 'N/A',
      mostActiveDayCount: 0,
      dailyData: []
    };
  }
};

/**
 * Obtiene estadísticas de usuarios atendidos
 */
export const getUserStats = async (userId: string) => {
  try {
    const analytics = await getWhatsAppAnalytics(userId);
    if (!analytics) return { uniqueUsers: 0, activeChats: 0, responseRate: 0 };
    
    // Necesitamos los mensajes reales para contar usuarios atendidos
    const whatsappCollectionRef = collection(db, 'users', userId, 'whatsapp');
    const messagesQuery = query(whatsappCollectionRef);
    const messagesSnapshot = await getDocs(messagesQuery);
    
    console.log(`Total de mensajes para analizar usuarios atendidos: ${messagesSnapshot.size}`);
    
    // Conjunto para almacenar remitentes únicos con respuestas
    const respondedSenders = new Set<string>();
    const allSenders = new Set<string>();
    
    // Contar remitentes únicos con mensajes respondidos
    messagesSnapshot.forEach(doc => {
      const message = doc.data();
      if (message.from) {
        allSenders.add(message.from);
        console.log(`Remitente: ${message.from}, Respondido: ${message.responded}`);
        
        if (message.responded === true) {
          respondedSenders.add(message.from);
          console.log(`✅ Agregado remitente respondido: ${message.from}`);
        }
      }
    });
    
    console.log(`Todos los remitentes únicos: [${Array.from(allSenders).join(', ')}], Total: ${allSenders.size}`);
    console.log(`Remitentes con respuesta: [${Array.from(respondedSenders).join(', ')}], Total: ${respondedSenders.size}`);
    
    // Total de chats activos (todos los remitentes únicos)
    const activeChats = allSenders.size;
    
    // Usuarios atendidos (remitentes con al menos un mensaje respondido)
    const uniqueUsers = respondedSenders.size;
    
    // Tasa de respuesta (mensajes respondidos / total mensajes)
    const totalMessages = analytics.totalMessages || 0;
    const respondedMessages = analytics.respondedMessages || 0;
    const responseRate = totalMessages > 0 ? Math.round((respondedMessages / totalMessages) * 100) : 0;
    
    console.log(`Estadísticas finales - Usuarios atendidos: ${uniqueUsers}, Chats activos: ${activeChats}, Tasa de respuesta: ${responseRate}%`);
    
    return {
      uniqueUsers,
      activeChats,
      responseRate
    };
  } catch (error) {
    console.error("Error al obtener estadísticas de usuarios:", error);
    return { uniqueUsers: 0, activeChats: 0, responseRate: 0 };
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

/**
 * Obtiene los mensajes de WhatsApp respondidos por el agente IA
 */
export const getAgentRespondedMessages = async (userId: string, limitCount: number = 50) => {
  try {
    // Obtener documentos de la colección "whatsapp" para el usuario específico
    const whatsappCollectionRef = collection(db, 'users', userId, 'whatsapp');
    
    // Crear consulta para obtener sólo mensajes respondidos por el agente
    // Nota: Si necesitamos componer consultas complejas, podemos hacerlo por pasos
    // Primero filtramos los que han sido respondidos
    const q = query(
      whatsappCollectionRef, 
      where("responded", "==", true),
      where("agentResponse", "==", true),
      orderBy("timestamp", "desc"), 
      limit(limitCount)
    );
    
    console.log("Consultando mensajes respondidos por agente IA para userId:", userId);
    const querySnapshot = await getDocs(q);
    
    console.log(`Se encontraron ${querySnapshot.size} mensajes respondidos por el agente IA`);
    
    const messages: WhatsAppMessage[] = [];
    
    querySnapshot.forEach(doc => {
      const data = doc.data();
      messages.push({
        id: doc.id,
        messageId: data.messageId || doc.id,
        body: data.body || '',
        from: data.from || '',
        to: data.to || '',
        timestamp: data.timestamp || 0,
        isFromMe: data.isFromMe || false,
        senderName: data.senderName || '',
        messageType: data.messageType || 'chat',
        category: data.category || 'otros',
        responded: true,
        responseId: data.responseId || null,
        responseTime: data.responseTime || null,
        agentResponse: true,
        hourOfDay: data.hourOfDay || 0,
        day: data.day || 1,
        month: data.month || 1,
        minutesOfDay: data.minutesOfDay || 0
      } as WhatsAppMessage);
    });
    
    return messages;
  } catch (error) {
    console.error("Error al obtener mensajes respondidos por agente:", error);
    return [];
  }
}; 