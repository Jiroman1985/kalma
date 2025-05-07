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
  timestamp: Timestamp;
  isFromMe: boolean;
  senderName: string;
  messageType: string;
  storedAt?: Timestamp;
  // Campos adicionales para respuestas y categorización
  category?: string;             // Categoría: consulta, venta, soporte, otro
  responded?: boolean;           // Si el mensaje ha sido respondido
  responseId?: string;           // ID del mensaje de respuesta (si existe)
  responseTimestamp?: Timestamp; // Cuándo fue respondido
  agentResponse?: boolean;       // Si fue respondido por el agente IA
  agentResponseText?: string;    // Texto de respuesta del agente (si existe directamente en el documento)
  responseTime?: number;         // Tiempo que tardó en ser respondido (ms)
  hourOfDay?: number;            // Hora del día en que se recibió (0-23)
  originalMessageId?: string;    // Para respuestas, el ID del mensaje original
  day?: number;                  // Día del mes
  month?: number;                // Mes del año
  minutesOfDay?: number;         // Minutos de la hora (0-59)
  sentiment?: string;            // Sentimiento del mensaje
  status: 'sent' | 'delivered' | 'read' | 'failed';
  type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'contact';
  aiAssisted?: boolean;
}

// Define la interfaz para los análisis de WhatsApp
export interface WhatsAppAnalytics {
  totalMessages: number;
  lastMessageTimestamp: Timestamp;
  messagesPerDay: Record<string, number>;
  activeChats: number;
  firstMessageTimestamp: Timestamp;
  lastUpdated: Timestamp;
  respondedMessages: number;
  unrespondedMessages: number;
  avgResponseTime: number;
  agentResponses: number;
  humanResponses: number;
  messageCategories: {
    consultas: number;
    ventas: number;
    soporte: number;
    otros: number;
  };
  messagesByHour: Record<string, number>;
  activeByWeekday: Record<string, number>;
  sentimentDistribution: {
    positive: number;
    negative: number;
    neutral: number;
  };
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
          lastMessageTimestamp: Timestamp.fromDate(new Date(0)),
          messagesPerDay: {},
          activeChats: 0,
          firstMessageTimestamp: Timestamp.fromDate(new Date(0)),
          lastUpdated: Timestamp.fromDate(new Date(0)),
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
          },
          sentimentDistribution: {
            positive: 0,
            negative: 0,
            neutral: 0
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
            lastMessageTimestamp: Timestamp.fromDate(new Date(0)),
            messagesPerDay: {},
            activeChats: 0,
            firstMessageTimestamp: Timestamp.fromDate(new Date(0)),
            lastUpdated: Timestamp.fromDate(new Date(0)),
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
            },
            sentimentDistribution: {
              positive: 0,
              negative: 0,
              neutral: 0
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
export const getWhatsAppMessages = async (
  userId: string,
  messageLimit: number = 100
): Promise<WhatsAppMessage[]> => {
  try {
    console.log(`Buscando mensajes de WhatsApp para el usuario: ${userId}`);
    
    // Colección principal "messages"
    const messagesRef = collection(db, "messages");
    
    // Intentamos buscar con una consulta más simple, sin tantos filtros
    // que puedan estar limitando los resultados
    const whatsappQuery = query(
      messagesRef,
      where("userId", "==", userId),
      limit(messageLimit * 2)
    );
    
    const querySnapshot = await getDocs(whatsappQuery);
    console.log(`Consulta principal encontró ${querySnapshot.size} documentos`);
    
    // Si no hay resultados, probar una consulta sin filtros
    if (querySnapshot.empty) {
      console.log("No se encontraron mensajes con el filtro principal, intentando sin filtro de userId");
      const allMessagesQuery = query(messagesRef, limit(100));
      const allMessagesSnapshot = await getDocs(allMessagesQuery);
      console.log(`Consulta sin filtro encontró ${allMessagesSnapshot.size} documentos`);
      
      if (!allMessagesSnapshot.empty) {
        allMessagesSnapshot.forEach(doc => {
          console.log(`Documento encontrado: ID=${doc.id}, Datos:`, doc.data());
        });
      }
    }
    
    const messages: WhatsAppMessage[] = [];
    
    // Procesar resultados de la consulta principal
    querySnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`Procesando documento ID=${doc.id}, Datos:`, data);
      
      // Verificar si agentResponse es una cadena de texto para extraer correctamente
      const agentResponseText = typeof data.agentResponse === 'string' 
        ? data.agentResponse 
        : data.agentResponseText || "";
      
      // Convertir formato de la base de datos al formato de WhatsAppMessage
      messages.push({
        id: doc.id,
        messageId: data.messageId || doc.id,
        body: data.content || data.body || "",
        from: data.senderId || data.from || "",
        to: data.recipientId || data.to || "",
        timestamp: data.timestamp || data.createdAt,
        isFromMe: data.isFromUser || data.isFromMe || false,
        senderName: data.senderName || "",
        messageType: data.type || "text",
        storedAt: data.createdAt ? Timestamp.fromDate(data.createdAt.toDate()) : undefined,
        category: data.category,
        responded: data.responded || false,
        responseId: data.responseId || null,
        responseTimestamp: data.responseTimestamp ? Timestamp.fromDate(data.responseTimestamp.toDate()) : undefined,
        agentResponse: typeof data.agentResponse === 'boolean' ? data.agentResponse : !!agentResponseText,
        agentResponseText: agentResponseText,
        responseTime: data.responseTime,
        hourOfDay: data.hourOfDay || 0,
        day: data.day || 1,
        month: data.month || 1,
        minutesOfDay: data.minutesOfDay || 0,
        sentiment: data.sentiment || "neutral",
        status: data.status || "sent",
        type: data.type || "text",
        aiAssisted: data.aiAssisted || false,
        originalMessageId: data.originalMessageId || null
      });
    });
    
    // Si no encontramos mensajes en la colección principal, intentar con otras ubicaciones
    if (messages.length === 0) {
      console.log("Probando consulta en colección 'whatsapp/messages'");
      // Probar en colección whatsapp/messages/userId
      const whatsappMessagesRef = collection(db, "whatsapp", "messages", userId);
      const whatsappSnapshot = await getDocs(whatsappMessagesRef);
      console.log(`Encontrados ${whatsappSnapshot.size} mensajes en colección whatsapp/messages/${userId}`);
      
      whatsappSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`Mensaje en whatsapp/messages/${userId}: ${doc.id}`, data);
        messages.push({
          id: doc.id,
          messageId: data.messageId || doc.id,
          body: data.body || "",
          from: data.from || "",
          to: data.to || "",
          timestamp: data.timestamp || Timestamp.now(),
          isFromMe: data.isFromMe || false,
          senderName: data.senderName || "",
          messageType: data.messageType || "text",
          status: data.status || "sent",
          type: data.type || "text"
        });
      });
    }
    
    // Si aún no hay mensajes, probar una última ubicación
    if (messages.length === 0) {
      console.log("Probando consulta en colección 'users/${userId}/whatsapp'");
      // Probar en colección users/userId/whatsapp
      const userWhatsappRef = collection(db, "users", userId, "whatsapp");
      const userWhatsappSnapshot = await getDocs(userWhatsappRef);
      console.log(`Encontrados ${userWhatsappSnapshot.size} documentos en users/${userId}/whatsapp`);
      
      if (!userWhatsappSnapshot.empty) {
        // Buscar en subcollección messages
        const messagesSubcolRef = collection(db, "users", userId, "whatsapp", "messages", "inbox");
        const messagesSubcolSnapshot = await getDocs(messagesSubcolRef);
        console.log(`Encontrados ${messagesSubcolSnapshot.size} mensajes en subcollección messages/inbox`);
        
        messagesSubcolSnapshot.forEach(doc => {
          const data = doc.data();
          messages.push({
            id: doc.id,
            messageId: data.messageId || doc.id,
            body: data.body || "",
            from: data.from || "",
            to: data.to || "",
            timestamp: data.timestamp || Timestamp.now(),
            isFromMe: data.isFromMe || false,
            senderName: data.senderName || "",
            messageType: data.messageType || "text",
            status: data.status || "sent",
            type: data.type || "text"
          });
        });
      }
    }
    
    console.log(`Total mensajes encontrados: ${messages.length}`);
    
    // Si aún no hay mensajes, devolver un mensaje de diagnóstico
    if (messages.length === 0) {
      console.log("No se encontraron mensajes en ninguna colección");
      // Añadir mensaje de diagnóstico para facilitar depuración
      messages.push({
        id: 'diagnostic_msg',
        messageId: 'diagnostic_msg',
        body: 'Este es un mensaje de diagnóstico. No se encontraron mensajes reales en la base de datos.',
        from: '+1234567890',
        to: '+0987654321',
        timestamp: Timestamp.now(),
        isFromMe: false,
        senderName: 'Sistema',
        messageType: 'text',
        status: 'sent',
        type: 'text'
      });
    }
    
    return messages;
  } catch (error) {
    console.error("Error al obtener mensajes de WhatsApp:", error);
    return [];
  }
};

/**
 * Obtiene los análisis de WhatsApp de un usuario
 */
export const getWhatsAppAnalytics = async (
  userId: string
): Promise<WhatsAppAnalytics | null> => {
  try {
    // Intentar obtener desde el documento de usuario primero
    const userDoc = await getDoc(doc(db, "users", userId));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      
      if (userData.whatsapp && userData.whatsapp.analytics) {
        console.log("Analytics encontrados en el documento de usuario");
        return userData.whatsapp.analytics as WhatsAppAnalytics;
      }
    }
    
    // Intentar obtener desde una colección dedicada de analytics
    const analyticsDoc = await getDoc(doc(db, "whatsappAnalytics", userId));
    
    if (analyticsDoc.exists()) {
      console.log("Analytics encontrados en colección dedicada");
      return analyticsDoc.data() as WhatsAppAnalytics;
    }
    
    console.log("No se encontraron analytics guardados");
    return null;
    
  } catch (error) {
    console.error("Error al obtener analytics de WhatsApp:", error);
    return null;
  }
};

/**
 * Calcular la distribución de mensajes por día
 * @param messages Lista de mensajes de WhatsApp
 * @param days Número de días a considerar (por defecto 30)
 * @returns Arreglo con datos formateados para gráfico
 */
export const calculateMessagesPerDay = (
  messages: WhatsAppMessage[],
  days: number = 30
): Array<{ date: string; incoming: number; outgoing: number }> => {
  // Crear un array con los últimos 'days' días
  const daysArray = Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    return {
      date: date.toISOString().split('T')[0],
      incoming: 0,
      outgoing: 0
    };
  });

  // Contar mensajes por día
  messages.forEach(msg => {
    if (!msg.timestamp) return;
    
    const date = msg.timestamp.toDate().toISOString().split('T')[0];
    const dayData = daysArray.find(d => d.date === date);
    
    if (dayData) {
      if (msg.isFromMe) {
        dayData.outgoing++;
      } else {
        dayData.incoming++;
      }
    }
  });

  return daysArray;
};

/**
 * Calcular la distribución de mensajes por categoría
 * @param messages Lista de mensajes de WhatsApp
 * @returns Arreglo con datos formateados para gráfico
 */
export const calculateMessageCategories = (
  messages: WhatsAppMessage[]
): Array<{ name: string; value: number }> => {
  const categories: Record<string, number> = {
    consultas: 0,
    ventas: 0,
    soporte: 0,
    quejas: 0,
    otros: 0
  };

  messages.forEach(msg => {
    if (msg.category) {
      if (categories[msg.category] !== undefined) {
        categories[msg.category]++;
      } else {
        categories.otros++;
      }
    } else {
      categories.otros++;
    }
  });

  return Object.entries(categories).map(([name, value]) => ({ name, value }));
};

/**
 * Calcular la distribución de mensajes por hora
 * @param messages Lista de mensajes de WhatsApp
 * @returns Arreglo con datos formateados para gráfico
 */
export const calculateHourlyDistribution = (
  messages: WhatsAppMessage[]
): Array<{ hour: string; count: number }> => {
  const hourlyDist: Record<number, number> = {};
  
  // Inicializar todas las horas con 0
  for (let i = 0; i < 24; i++) {
    hourlyDist[i] = 0;
  }

  // Contar mensajes por hora
  messages.forEach(msg => {
    if (msg.hourOfDay !== undefined) {
      hourlyDist[msg.hourOfDay]++;
    }
  });

  // Convertir a formato para gráfico
  return Object.entries(hourlyDist).map(([hour, count]) => ({
    hour: `${hour.padStart(2, '0')}:00`,
    count
  }));
};

/**
 * Calcular tiempos de respuesta promedio por día
 * @param messages Lista de mensajes de WhatsApp
 * @param days Número de días a considerar (por defecto 30)
 * @returns Arreglo con datos formateados para gráfico
 */
export const calculateResponseTimes = (
  messages: WhatsAppMessage[],
  days: number = 30
): Array<{ date: string; time: number }> => {
  // Crear un array con los últimos 'days' días
  const daysArray = Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    return {
      date: date.toISOString().split('T')[0],
      time: 0,
      count: 0
    };
  });

  // Calcular tiempo de respuesta promedio por día
  messages.forEach(msg => {
    if (!msg.timestamp || !msg.responseTime) return;
    
    const date = msg.timestamp.toDate().toISOString().split('T')[0];
    const dayData = daysArray.find(d => d.date === date);
    
    if (dayData) {
      dayData.time += msg.responseTime;
      dayData.count++;
    }
  });

  // Calcular promedio y convertir milisegundos a minutos
  return daysArray.map(day => ({
    date: day.date,
    time: day.count > 0 ? Math.round(day.time / day.count / (1000 * 60)) : 0
  }));
};

/**
 * Calcular estadísticas de estatus de mensajes
 * @param messages Lista de mensajes de WhatsApp
 * @returns Arreglo con datos formateados para gráfico
 */
export const calculateMessageStatus = (
  messages: WhatsAppMessage[]
): Array<{ name: string; value: number }> => {
  const total = messages.length;
  if (total === 0) return [];
  
  const responded = messages.filter(msg => msg.responded).length;
  const seen = messages.filter(msg => !msg.responded && !msg.isFromMe).length;
  const sent = messages.filter(msg => msg.isFromMe).length;
  
  return [
    { name: 'Respondidos', value: responded },
    { name: 'Vistos', value: seen },
    { name: 'Enviados', value: sent }
  ];
};

/**
 * Calcular usuarios activos (nuevos vs recurrentes)
 * @param messages Lista de mensajes de WhatsApp
 * @param days Número de días a considerar (por defecto 30)
 * @returns Arreglo con datos formateados para gráfico
 */
export const calculateActiveUsers = (
  messages: WhatsAppMessage[],
  days: number = 30
): Array<{ date: string; nuevos: number; recurrentes: number }> => {
  // Crear un array con los últimos 'days' días
  const daysArray = Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    return {
      date: date.toISOString().split('T')[0],
      nuevos: 0,
      recurrentes: 0
    };
  });

  // Mapeo para rastrear la primera vez que vemos un usuario
  const userFirstSeen: Record<string, string> = {};

  // Contar usuarios por día
  messages.forEach(msg => {
    if (!msg.timestamp || msg.isFromMe) return;
    
    const date = msg.timestamp.toDate().toISOString().split('T')[0];
    const dayData = daysArray.find(d => d.date === date);
    
    if (dayData) {
      // Si ya hemos visto este usuario antes
      if (userFirstSeen[msg.from]) {
        // Si la primera vez fue antes de hoy, es recurrente
        if (userFirstSeen[msg.from] !== date) {
          dayData.recurrentes++;
        }
      } else {
        // Primera vez que vemos este usuario
        userFirstSeen[msg.from] = date;
        dayData.nuevos++;
      }
    }
  });

  // Eliminar duplicados por día (solo contar una vez por usuario por día)
  // Esta implementación simplificada no elimina duplicados completamente

  return daysArray;
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
    
    // Crear consulta para obtener sólo mensajes respondidos
    const q = query(
      whatsappCollectionRef, 
      where("responded", "==", true),
      orderBy("timestamp", "desc"), 
      limit(limitCount)
    );
    
    console.log("Consultando mensajes respondidos para userId:", userId);
    const querySnapshot = await getDocs(q);
    
    console.log(`Se encontraron ${querySnapshot.size} mensajes respondidos`);
    
    const messages: WhatsAppMessage[] = [];
    
    querySnapshot.forEach(doc => {
      const data = doc.data();
      console.log("Mensaje respondido encontrado:", doc.id, data);
      
      // Comprobar si tiene agentResponse como texto o como booleano
      const hasAgentResponse = typeof data.agentResponse === 'string' && data.agentResponse.trim().length > 0;
      
      // Si tiene datos adecuados, agregarlo a la lista
      if (data.from && data.body) {
        const message: WhatsAppMessage = {
          id: doc.id,
          messageId: data.messageId || doc.id,
          body: data.body || '',
          from: data.from || '',
          to: data.to || '',
          timestamp: data.timestamp || Timestamp.fromDate(new Date(0)),
          isFromMe: data.isFromMe || false,
          senderName: data.senderName || '',
          messageType: data.messageType || 'chat',
          category: data.category || 'otros',
          responded: true,
          responseId: data.responseId || null,
          responseTime: data.responseTime || null,
          agentResponse: hasAgentResponse || data.agentResponse === true,
          hourOfDay: data.hourOfDay || 0,
          day: data.day || 1,
          month: data.month || 1,
          minutesOfDay: data.minutesOfDay || 0,
          // Guardar la respuesta textual del agente si existe
          agentResponseText: typeof data.agentResponse === 'string' ? data.agentResponse : '',
          status: data.status || "sent",
          type: data.type || "text",
          aiAssisted: data.aiAssisted || false
        };
        
        messages.push(message);
      }
    });
    
    return messages;
  } catch (error) {
    console.error("Error al obtener mensajes respondidos por agente:", error);
    return [];
  }
}; 