import { useState, useEffect, useRef } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Search, MessageSquare, User, Calendar, Clock, Filter, MessageCircle, Bot, Send, X, Check } from "lucide-react";
import { 
  Facebook, 
  Instagram, 
  Twitter, 
  Linkedin, 
  Mail,
  Star
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db, auth } from "@/lib/firebase";
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  limit,
  or,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp
} from "firebase/firestore";
import { WhatsAppMessage, getWhatsAppMessages } from "@/lib/whatsappService";
import { EmailMessage, getEmailMessages, replyToEmail, searchEmails } from "@/lib/emailService";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";

interface Conversation {
  id: string;
  user: string;
  userAvatar?: string;
  contactId: string;
  originalMessage: WhatsAppMessage | SocialMediaMessage;
  responseMessage?: WhatsAppMessage | SocialMediaMessage;
  platform: 'whatsapp' | 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'gmail' | 'googleReviews';
  timestamp: Timestamp | Date | number;
  isRead: boolean;
  isReplied: boolean;
}

// Interfaz para los mensajes de redes sociales
interface SocialMediaMessage {
  id: string;
  platform: string;
  sender: {
    name: string;
    avatar?: string;
  };
  content: string;
  timestamp: Date | Timestamp;
  read: boolean;
  replied: boolean;
  accountId: string;
  threadId?: string;   // Para identificar hilos de conversación
  subject?: string;    // Para correos electrónicos
}

const Conversations = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [unreadCount, setUnreadCount] = useState<{[key: string]: number}>({
    whatsapp: 0,
    instagram: 0,
    facebook: 0,
    gmail: 0,
    twitter: 0,
    googleReviews: 0,
    linkedin: 0
  });
  const [replyingTo, setReplyingTo] = useState<Conversation | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const replyInputRef = useRef<HTMLTextAreaElement>(null);
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [selectedThread, setSelectedThread] = useState<EmailMessage[] | null>(null);
  const [loadingThread, setLoadingThread] = useState<boolean>(false);

  useEffect(() => {
    const fetchConversations = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        console.log("Iniciando carga de conversaciones...");
        // 1. Obtener mensajes de WhatsApp
        const whatsappConversations = await fetchWhatsAppConversations();
        console.log(`Conversaciones de WhatsApp obtenidas: ${whatsappConversations.length}`);
        
        // 2. Obtener mensajes de redes sociales
        const socialConversations = await fetchSocialMediaConversations();
        console.log(`Conversaciones de redes sociales obtenidas: ${socialConversations.length}`);
        
        // 3. Combinar y ordenar por fecha
        const allConversations = [...whatsappConversations, ...socialConversations]
          .sort((a, b) => {
            const dateA = getTimestampValue(a.timestamp);
            const dateB = getTimestampValue(b.timestamp);
            return dateB - dateA;
          });
        
        console.log(`Total de conversaciones combinadas: ${allConversations.length}`);
        
        // 4. Contar mensajes no leídos
        const unread = {
          whatsapp: whatsappConversations.filter(c => !c.isRead).length,
          instagram: socialConversations.filter(c => c.platform === 'instagram' && !c.isRead).length,
          facebook: socialConversations.filter(c => c.platform === 'facebook' && !c.isRead).length,
          gmail: socialConversations.filter(c => c.platform === 'gmail' && !c.isRead).length,
          twitter: socialConversations.filter(c => c.platform === 'twitter' && !c.isRead).length,
          googleReviews: socialConversations.filter(c => c.platform === 'googleReviews' && !c.isRead).length,
          linkedin: socialConversations.filter(c => c.platform === 'linkedin' && !c.isRead).length,
        };
        
        setUnreadCount(unread);
        setConversations(allConversations);
      } catch (error) {
        console.error("Error al cargar conversaciones:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [currentUser]);

  // Función para convertir cualquier tipo de timestamp a número para comparación
  const getTimestampValue = (timestamp: Timestamp | Date | number): number => {
    if (timestamp instanceof Date) {
      return timestamp.getTime();
    } else if (typeof timestamp === 'number') {
      return timestamp;
    } else if (timestamp?.toDate) {
      return timestamp.toDate().getTime();
    }
    return 0;
  };

  // Obtener conversaciones de WhatsApp
  const fetchWhatsAppConversations = async (): Promise<Conversation[]> => {
    if (!currentUser) return [];
    
    console.log("Obteniendo mensajes de WhatsApp...");
    // Obtener mensajes de WhatsApp utilizando la función de servicio
    const whatsappMessages = await getWhatsAppMessages(currentUser.uid, 100);
    
    if (whatsappMessages.length === 0) {
      console.log("No se encontraron mensajes de WhatsApp");
      return [];
    }
    
    console.log(`Encontrados ${whatsappMessages.length} mensajes de WhatsApp`);
    
    // Crear conversaciones a partir de los mensajes
    const conversationsData: Conversation[] = [];
    
    // Separar mensajes originales y respuestas
    const originalMessages: WhatsAppMessage[] = [];
    const responseMessages: WhatsAppMessage[] = [];
    
    whatsappMessages.forEach(message => {
      console.log(`Procesando mensaje: ID=${message.id}, from=${message.from}, to=${message.to}, isFromMe=${message.isFromMe}, originalMessageId=${message.originalMessageId}`);
      console.log(`Contenido: "${message.body?.substring(0, 50)}..."`);
      console.log(`¿Tiene respuesta de agente? ${!!message.agentResponseText}`);
      
      // Ignorar mensajes sin remitente o cuerpo
      if (!message.from || !message.body) {
        console.log("Ignorando mensaje sin remitente o cuerpo");
        return;
      }
      
      if (message.originalMessageId) {
        // Es una respuesta
        console.log(`Mensaje ${message.id} es una respuesta al mensaje ${message.originalMessageId}`);
        responseMessages.push(message);
      } else {
        // Es un mensaje original
        console.log(`Mensaje ${message.id} es un mensaje original`);
        originalMessages.push(message);
      }
    });
    
    console.log(`Mensajes originales: ${originalMessages.length}, Respuestas: ${responseMessages.length}`);
    
    // Si no hay mensajes originales pero hay respuestas, usamos las respuestas como originales
    if (originalMessages.length === 0 && responseMessages.length > 0) {
      console.log("No hay mensajes originales, usando respuestas como originales");
      originalMessages.push(...responseMessages);
      responseMessages.length = 0;
    }
    
    // Agrupar mensajes originales por contacto (from)
    const messagesByContact = new Map<string, WhatsAppMessage[]>();
    
    originalMessages.forEach(message => {
      const contactId = message.isFromMe ? message.to : message.from;
      if (!messagesByContact.has(contactId)) {
        messagesByContact.set(contactId, []);
      }
      
      messagesByContact.get(contactId)?.push(message);
    });
    
    console.log(`Contactos agrupados: ${messagesByContact.size}`);
    
    // Para cada contacto, crear una conversación con el mensaje más reciente
    for (const [contactId, messages] of messagesByContact.entries()) {
      console.log(`Procesando contacto: ${contactId} con ${messages.length} mensajes`);
      
      // Ordenar mensajes por timestamp (el más reciente primero)
      messages.sort((a, b) => {
        const timeA = a.timestamp instanceof Timestamp ? a.timestamp.toMillis() : 
                    typeof a.timestamp === 'number' ? a.timestamp : 0;
        const timeB = b.timestamp instanceof Timestamp ? b.timestamp.toMillis() : 
                    typeof b.timestamp === 'number' ? b.timestamp : 0;
        return timeB - timeA;
      });
      
      // El primer mensaje del array es el más reciente
      const latestMessage = messages[0];
      
      // Buscar respuesta al mensaje si existe
      const responseMessage = responseMessages.find(msg => 
        msg.originalMessageId === latestMessage.messageId || msg.originalMessageId === latestMessage.id
      );
      
      // Si no encontramos respuesta directa, buscar por respondido flag
      let hasResponse = !!responseMessage;
      let hasAgentResponse = false;
      
      // Verificar si tiene respuesta de agente (puede ser booleano o string)
      const agentResponseIsString = typeof latestMessage.agentResponse === 'string';
      const agentResponseText = agentResponseIsString ? latestMessage.agentResponse : '';
      const hasAgentResponseText = agentResponseIsString && agentResponseText.trim().length > 0;
      
      if (hasAgentResponseText) {
        hasAgentResponse = true;
        console.log(`Mensaje ${latestMessage.id} tiene respuesta de agente en campo agentResponse (string)`);
      } else if (latestMessage.agentResponseText && typeof latestMessage.agentResponseText === 'string' && latestMessage.agentResponseText.trim().length > 0) {
        hasAgentResponse = true;
        console.log(`Mensaje ${latestMessage.id} tiene respuesta de agente en campo agentResponseText`);
      } else if (latestMessage.agentResponse === true) {
        hasAgentResponse = true;
        console.log(`Mensaje ${latestMessage.id} tiene agentResponse=true pero sin texto`);
      }
      
      console.log(`Mensaje ${latestMessage.id} - Respondido: ${latestMessage.responded}, HasAgentResponse: ${hasAgentResponse}`);
      
      // Crear un objeto de respuesta a partir del agentResponseText si existe
      let agentResponseMessage: WhatsAppMessage | null = null;
      
      if (hasAgentResponse && !responseMessage) {
        // Obtener el texto de respuesta del campo correcto
        const responseText = typeof latestMessage.agentResponse === 'string' 
          ? latestMessage.agentResponse 
          : latestMessage.agentResponseText || "";
        
        console.log(`Creando objeto de respuesta para agente con texto: "${responseText.substring(0, 50)}..."`);
        
        agentResponseMessage = {
          id: `agent_${latestMessage.id}`,
          messageId: `agent_${latestMessage.id}`,
          body: responseText,
          from: latestMessage.to, // Invertir emisor/receptor
          to: latestMessage.from,
          timestamp: latestMessage.timestamp, // Usamos el mismo timestamp por simplicidad
          isFromMe: true,
          senderName: "Asistente IA",
          messageType: "text",
          status: "sent",
          type: "text",
          aiAssisted: true,
          originalMessageId: latestMessage.id
        };
        
        hasResponse = true;
      }
      
      if (!hasResponse && latestMessage.responded) {
        console.log(`Mensaje marcado como respondido pero sin respuesta encontrada. Buscando respuestas posibles...`);
        // Buscar la respuesta más cercana por tiempo
        const possibleResponses = responseMessages.filter(msg => 
          msg.from === latestMessage.to && msg.to === latestMessage.from
        );
        
        if (possibleResponses.length > 0) {
          console.log(`Se encontraron ${possibleResponses.length} posibles respuestas por inversión de from/to`);
          // Ordenar por cercanía de tiempo al mensaje original
          possibleResponses.sort((a, b) => {
            const timeA = a.timestamp instanceof Timestamp ? a.timestamp.toMillis() : 
                        typeof a.timestamp === 'number' ? a.timestamp : 0;
            const timeB = b.timestamp instanceof Timestamp ? b.timestamp.toMillis() : 
                        typeof b.timestamp === 'number' ? b.timestamp : 0;
            const originalTime = latestMessage.timestamp instanceof Timestamp ? 
                                latestMessage.timestamp.toMillis() : 
                                typeof latestMessage.timestamp === 'number' ? 
                                latestMessage.timestamp : 0;
            
            return Math.abs(timeA - originalTime) - Math.abs(timeB - originalTime);
          });
          
          // Usar la respuesta más cercana en tiempo
          const nearestResponse = possibleResponses[0];
          hasResponse = true;
          
          console.log(`Usando respuesta más cercana con ID ${nearestResponse.id}`);
          
          conversationsData.push({
            id: latestMessage.id,
            user: latestMessage.senderName || contactId,
            contactId: contactId,
            originalMessage: latestMessage,
            responseMessage: nearestResponse,
            platform: 'whatsapp',
            timestamp: latestMessage.timestamp || new Date(),
            isRead: latestMessage.status === 'read',
            isReplied: true
          });
          
          continue; // Saltamos a la siguiente iteración
        }
      }
      
      conversationsData.push({
        id: latestMessage.id,
        user: latestMessage.senderName || contactId,
        contactId: contactId,
        originalMessage: latestMessage,
        responseMessage: responseMessage || agentResponseMessage || undefined,
        platform: 'whatsapp',
        timestamp: latestMessage.timestamp || new Date(),
        isRead: latestMessage.status === 'read',
        isReplied: !!responseMessage || latestMessage.responded || hasAgentResponse || false
      });
    }
    
    console.log(`Conversaciones generadas: ${conversationsData.length}`);
    return conversationsData;
  };

  // Obtener conversaciones de redes sociales y correos electrónicos
  const fetchSocialMediaConversations = async (): Promise<Conversation[]> => {
    if (!currentUser) return [];
    
    const socialConversations: Conversation[] = [];
    
    try {
      // 1. Obtener conversaciones de correo electrónico desde Firebase usando el servicio de email
      const emailMessages = await getEmailMessages(currentUser.uid, 50);
      
      if (emailMessages.length > 0) {
        console.log(`Encontrados ${emailMessages.length} mensajes de email`);
        
        // Procesar emails
        emailMessages.forEach(email => {
          // Convertir datos del servicio al formato SocialMediaMessage
          const emailMessage: SocialMediaMessage = {
            id: email.id,
            platform: 'gmail',
            sender: {
              name: email.senderName || email.from || "desconocido@email.com",
              avatar: email.senderAvatar || ""
            },
            content: email.body || email.subject || "",
            timestamp: email.timestamp || email.createdAt,
            read: email.isRead || false,
            replied: email.isReplied || false,
            accountId: email.accountId || "gmail1",
            threadId: email.threadId,
            subject: email.subject
          };
          
          // Crear conversación a partir del mensaje
          socialConversations.push({
            id: email.id,
            user: emailMessage.sender.name,
            userAvatar: emailMessage.sender.avatar,
            contactId: emailMessage.sender.name,
            originalMessage: emailMessage,
            platform: 'gmail',
            timestamp: emailMessage.timestamp,
            isRead: emailMessage.read,
            isReplied: emailMessage.replied
          });
        });
      } else {
        console.log("No se encontraron mensajes de email");
      }
      
      // 2. Añadir datos simulados para otras redes sociales
      // (Mantenemos los datos simulados mientras implementamos las demás redes)
      
      const socialMessages: SocialMediaMessage[] = [
        // Instagram
        {
          id: "sm1",
          platform: "instagram",
          sender: {
            name: "cliente_satisfecho",
            avatar: "https://randomuser.me/api/portraits/women/32.jpg"
          },
          content: "Hola, ¿tienen disponible el modelo nuevo en color azul? Lo vi en su última publicación y me encantó.",
          timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutos atrás
          read: true,
          replied: false,
          accountId: "instagram1",
          threadId: "sm1_thread",
          subject: "Modelo nuevo en color azul"
        },
        // Facebook
        {
          id: "sm3",
          platform: "facebook",
          sender: {
            name: "Juan Pérez",
            avatar: "https://randomuser.me/api/portraits/men/42.jpg"
          },
          content: "Me encantó su producto, ¿hacen envíos a Canarias? Tengo familia allí y quiero enviarles un regalo.",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 horas atrás
          read: true,
          replied: true,
          accountId: "facebook1",
          threadId: "sm3_thread",
          subject: "Regalo para familia"
        },
        // Twitter
        {
          id: "sm4",
          platform: "twitter",
          sender: {
            name: "@usuario_interesado",
            avatar: "https://randomuser.me/api/portraits/women/22.jpg"
          },
          content: "¿Cuándo estará disponible la próxima colección? ¡Estoy muy emocionada! #NuevaColeccion #Moda #Ansiosa",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 horas atrás
          read: false,
          replied: false,
          accountId: "twitter1",
          threadId: "sm4_thread",
          subject: "Próxima colección"
        }
      ];
      
      // Convertir mensajes simulados a formato Conversation y añadir a las conversaciones
      socialMessages.forEach(msg => {
        socialConversations.push({
          id: msg.id,
          user: msg.sender.name,
          userAvatar: msg.sender.avatar,
          contactId: msg.sender.name,
          originalMessage: msg,
          platform: msg.platform as any,
          timestamp: msg.timestamp,
          isRead: msg.read,
          isReplied: msg.replied
        });
      });
      
    } catch (error) {
      console.error("Error al obtener conversaciones sociales:", error);
    }
    
    return socialConversations;
  };

  // Función para enviar una respuesta
  const sendReply = async () => {
    if (!replyingTo || !replyText.trim() || !currentUser) {
      return;
    }
    
    setSendingReply(true);
    
    try {
      if (replyingTo.platform === 'whatsapp') {
        // Lógica para responder mensajes de WhatsApp
        const whatsappMessage = replyingTo.originalMessage as WhatsAppMessage;
        
        // Crear un mensaje de respuesta en Firestore
        const responseData = {
          body: replyText,
          from: whatsappMessage.to, // Invertir el destinatario como remitente
          to: whatsappMessage.from, // Invertir el remitente como destinatario
          timestamp: serverTimestamp(),
          isFromMe: true,
          senderName: "Mi Empresa", // O usar un nombre más específico
          messageType: "text",
          originalMessageId: whatsappMessage.messageId || whatsappMessage.id, // Importante: vincular con el original
          responded: false,
          platform: "whatsapp",
          userId: currentUser.uid,
          status: "sent",
          type: "text",
          aiAssisted: true // Marcar como respuesta asistida por IA
        };
        
        // Guardar respuesta en Firestore
        const messagesRef = collection(db, "messages");
        const newResponseDoc = await addDoc(messagesRef, responseData);
        
        // Actualizar el mensaje original para marcarlo como respondido
        const originalMessageRef = doc(db, "messages", whatsappMessage.id);
        await updateDoc(originalMessageRef, {
          responded: true,
          updatedAt: serverTimestamp()
        });
        
        // Actualizar la UI
        const updatedConversations = conversations.map(conv => {
          if (conv.id === replyingTo.id) {
            // Crear objeto de respuesta con los campos necesarios
            const responseMessage: WhatsAppMessage = {
              id: newResponseDoc.id,
              messageId: newResponseDoc.id,
              body: replyText,
              from: whatsappMessage.to,
              to: whatsappMessage.from,
              timestamp: Timestamp.now(),
              isFromMe: true,
              senderName: "Mi Empresa",
              messageType: "text",
              originalMessageId: whatsappMessage.messageId || whatsappMessage.id,
              status: "sent",
              type: "text",
              aiAssisted: true
            };
            
            return {
              ...conv,
              isReplied: true,
              responseMessage: responseMessage
            };
          }
          return conv;
        });
        
        // Actualizar estado de conversaciones
        setConversations(updatedConversations);
      }
      
      // Mostrar confirmación
      toast({
        title: "Respuesta enviada",
        description: "Tu respuesta ha sido enviada correctamente.",
      });
      
      // Limpiar estado de respuesta
      setReplyText("");
      setReplyingTo(null);
    } catch (error) {
      console.error("Error al enviar respuesta:", error);
      toast({
        title: "Error",
        description: "No se pudo enviar la respuesta. Intenta nuevamente.",
        variant: "destructive"
      });
    } finally {
      setSendingReply(false);
    }
  };

  // Efecto para enfocar el campo de texto cuando se empieza a responder
  useEffect(() => {
    if (replyingTo && replyInputRef.current) {
      replyInputRef.current.focus();
    }
  }, [replyingTo]);

  // Filtrar conversaciones por búsqueda y pestaña activa
  const getFilteredConversations = () => {
    return conversations.filter(conversation => {
      // Filtro por plataforma
      if (activeTab !== 'all' && conversation.platform !== activeTab) {
        return false;
      }
      
      // Filtro por búsqueda
      const isWhatsApp = conversation.platform === 'whatsapp';
      
      // Búsqueda para mensajes de WhatsApp
      if (isWhatsApp) {
        const whatsappMsg = conversation.originalMessage as WhatsAppMessage;
        return conversation.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
               whatsappMsg.body.toLowerCase().includes(searchTerm.toLowerCase()) ||
               conversation.contactId.includes(searchTerm);
      }
      
      // Búsqueda para mensajes de redes sociales
      const socialMsg = conversation.originalMessage as SocialMediaMessage;
      return conversation.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
             socialMsg.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
             conversation.contactId.includes(searchTerm);
    });
  };

  // Función para formatear timestamp
  const formatTimestamp = (timestamp: number | Timestamp | Date | undefined) => {
    if (!timestamp) return { date: 'Fecha desconocida', time: 'Hora desconocida' };
    
    let date: Date;
    if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === 'number') {
      date = new Date(timestamp);
    } else if (timestamp.toDate) {
      date = timestamp.toDate();
    } else {
      date = new Date();
    }
    
    return {
      date: format(date, 'yyyy-MM-dd'),
      time: format(date, 'HH:mm'),
      formatted: format(date, "d 'de' MMMM, HH:mm", { locale: es })
    };
  };

  // Obtener el contenido del mensaje según el tipo
  const getMessageContent = (message: WhatsAppMessage | SocialMediaMessage) => {
    if ('body' in message) {
      return message.body;
    } else if ('content' in message) {
      return message.content;
    }
    return '';
  };

  // Renderizar icono según plataforma
  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'whatsapp':
        return <MessageCircle className="h-5 w-5 text-green-600" />;
      case 'facebook':
        return <Facebook className="h-5 w-5 text-blue-600" />;
      case 'instagram':
        return <Instagram className="h-5 w-5 text-pink-600" />;
      case 'twitter':
        return <Twitter className="h-5 w-5 text-blue-400" />;
      case 'linkedin':
        return <Linkedin className="h-5 w-5 text-blue-800" />;
      case 'gmail':
        return <Mail className="h-5 w-5 text-red-500" />;
      case 'googlereviews':
        return <Star className="h-5 w-5 text-yellow-500" />;
      default:
        return <MessageSquare className="h-5 w-5 text-gray-600" />;
    }
  };

  // Renderizar color de fondo según plataforma
  const getPlatformBgColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'whatsapp':
        return 'bg-green-50';
      case 'facebook':
        return 'bg-blue-50';
      case 'instagram':
        return 'bg-pink-50';
      case 'twitter':
        return 'bg-blue-50';
      case 'linkedin':
        return 'bg-blue-100';
      case 'gmail':
        return 'bg-red-50';
      case 'googlereviews':
        return 'bg-yellow-50';
      default:
        return 'bg-gray-50';
    }
  };

  // Renderizar badge según plataforma
  const getPlatformBadge = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'whatsapp':
        return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">WhatsApp</Badge>;
      case 'facebook':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">Facebook</Badge>;
      case 'instagram':
        return <Badge variant="outline" className="bg-pink-100 text-pink-800 hover:bg-pink-100">Instagram</Badge>;
      case 'twitter':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">Twitter</Badge>;
      case 'linkedin':
        return <Badge variant="outline" className="bg-blue-200 text-blue-800 hover:bg-blue-200">LinkedIn</Badge>;
      case 'gmail':
        return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">Gmail</Badge>;
      case 'googlereviews':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">G. Reviews</Badge>;
      default:
        return <Badge variant="outline">Otro</Badge>;
    }
  };

  // Cargar el hilo completo de una conversación de email
  const loadEmailThread = async (conversation: Conversation) => {
    if (conversation.platform !== 'gmail') return;
    
    setLoadingThread(true);
    try {
      const emailMessage = conversation.originalMessage as SocialMediaMessage;
      const threadId = emailMessage.threadId || emailMessage.id;
      
      // Buscar todos los emails relacionados con este hilo
      const threadEmails = await searchEmails(currentUser.uid, threadId);
      
      if (threadEmails.length > 0) {
        // Ordenar por fecha (más antiguos primero)
        threadEmails.sort((a, b) => {
          const timeA = a.timestamp instanceof Timestamp ? a.timestamp.toMillis() : 
                      typeof a.timestamp === 'number' ? a.timestamp : 0;
          const timeB = b.timestamp instanceof Timestamp ? b.timestamp.toMillis() : 
                      typeof b.timestamp === 'number' ? b.timestamp : 0;
          return timeA - timeB;
        });
        
        setSelectedThread(threadEmails);
      } else {
        // Si no hay hilos relacionados, mostrar solo el email actual
        setSelectedThread([{
          id: emailMessage.id,
          subject: emailMessage.subject || '',
          body: emailMessage.content,
          from: emailMessage.sender.name,
          to: 'yo',
          timestamp: emailMessage.timestamp as Timestamp,
          isRead: emailMessage.read,
          isReplied: emailMessage.replied,
          userId: currentUser.uid,
          createdAt: emailMessage.timestamp as Timestamp,
          platform: 'email'
        }]);
      }
    } catch (error) {
      console.error("Error al cargar hilo de correos:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar la conversación completa. Intenta nuevamente.",
        variant: "destructive"
      });
    } finally {
      setLoadingThread(false);
    }
  };

  // Función para marcar mensaje como leído o no leído
  const markAsRead = async (conversation: Conversation) => {
    if (!currentUser) return;
    
    // Actualizar en la UI
    const updatedConversations = conversations.map(conv => {
      if (conv.id === conversation.id) {
        return {
          ...conv,
          isRead: !conv.isRead
        };
      }
      return conv;
    });
    
    setConversations(updatedConversations);
    
    // Actualizar en Firestore
    try {
      if (conversation.platform === 'whatsapp') {
        const msgRef = doc(db, "messages", conversation.id);
        await updateDoc(msgRef, {
          status: !conversation.isRead ? 'read' : 'delivered',
          updatedAt: serverTimestamp()
        });
        
        // Actualizar conteo
        const newUnreadCount = {
          ...unreadCount,
          whatsapp: !conversation.isRead 
            ? Math.max(0, unreadCount.whatsapp - 1) 
            : unreadCount.whatsapp + 1
        };
        setUnreadCount(newUnreadCount);
      }
      // Para otras plataformas, implementar lógica similar
    } catch (error) {
      console.error("Error al actualizar estado de lectura:", error);
      // Revertir cambio en UI
      setConversations(conversations);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del mensaje.",
        variant: "destructive"
      });
    }
  };

  // Función para iniciar respuesta a un mensaje
  const startReply = (conversation: Conversation) => {
    setReplyingTo(conversation);
    setReplyText(''); // Limpiar texto de respuesta anterior
    
    // Si es WhatsApp y el mensaje no está leído, marcarlo como leído
    if (conversation.platform === 'whatsapp' && !conversation.isRead) {
      markAsRead(conversation);
    }
  };

  // Función para manejar el clic en una conversación
  const handleConversationClick = (conversation: Conversation) => {
    // Si no está leído, marcarlo como leído
    if (!conversation.isRead) {
      markAsRead(conversation);
    } else {
      // Si ya está leído, alternar estado
      markAsRead(conversation);
    }
    
    // Si no está respondido, iniciar la respuesta
    if (!conversation.isReplied) {
      startReply(conversation);
    }
  };

  // Render de un hilo de correo electrónico
  const renderEmailThread = () => {
    if (!selectedThread || !replyingTo || replyingTo.platform !== 'gmail') return null;
    
    return (
      <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-4">
        <h3 className="text-sm font-medium text-gray-700">Conversación completa:</h3>
        
        {selectedThread.map((email, index) => (
          <div 
            key={email.id} 
            className={`p-3 rounded-lg ${email.from === 'yo' ? 'bg-blue-50 ml-8' : 'bg-white mr-8'}`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="text-sm font-semibold">{email.from}</div>
              <div className="text-xs text-gray-500">
                {formatTimestamp(email.timestamp).formatted}
              </div>
            </div>
            
            {index === 0 && email.subject && (
              <div className="text-sm font-medium mb-2">
                {email.subject}
              </div>
            )}
            
            <div className="text-sm whitespace-pre-wrap">{email.body}</div>
          </div>
        ))}
      </div>
    );
  };

  const filteredConversations = getFilteredConversations();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Conversaciones</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-4">
        <TabsList className="flex w-full overflow-x-auto">
          <TabsTrigger value="all" className="flex-shrink-0">
            Todas
            {conversations.filter(c => !c.isRead).length > 0 && (
              <span className="ml-2 text-xs bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                {conversations.filter(c => !c.isRead).length}
              </span>
            )}
          </TabsTrigger>
          
          <TabsTrigger value="whatsapp" className="flex-shrink-0">
            WhatsApp
            {unreadCount.whatsapp > 0 && (
              <span className="ml-2 text-xs bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount.whatsapp}
              </span>
            )}
          </TabsTrigger>
          
          <TabsTrigger value="instagram" className="flex-shrink-0">
            Instagram
            {unreadCount.instagram > 0 && (
              <span className="ml-2 text-xs bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount.instagram}
              </span>
            )}
          </TabsTrigger>
          
          <TabsTrigger value="facebook" className="flex-shrink-0">
            Facebook
            {unreadCount.facebook > 0 && (
              <span className="ml-2 text-xs bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount.facebook}
              </span>
            )}
          </TabsTrigger>
          
          <TabsTrigger value="gmail" className="flex-shrink-0">
            Gmail
            {unreadCount.gmail > 0 && (
              <span className="ml-2 text-xs bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount.gmail}
              </span>
            )}
          </TabsTrigger>
          
          <TabsTrigger value="twitter" className="flex-shrink-0">
            Twitter
            {unreadCount.twitter > 0 && (
              <span className="ml-2 text-xs bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount.twitter}
              </span>
            )}
          </TabsTrigger>
          
          <TabsTrigger value="googleReviews" className="flex-shrink-0">
            Google Reviews
            {unreadCount.googleReviews > 0 && (
              <span className="ml-2 text-xs bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount.googleReviews}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
          <Input
            placeholder="Buscar conversaciones..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="flex items-center gap-2 whitespace-nowrap">
          <Filter className="h-4 w-4" />
          Filtrar
        </Button>
      </div>

      {/* Lista de conversaciones */}
      <div className="grid gap-6 mt-4">
        {loading ? (
          // Mostrar estado de carga
          <div className="flex justify-center my-12">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mb-4"></div>
              <p className="text-gray-500">Cargando conversaciones...</p>
            </div>
          </div>
        ) : filteredConversations.length === 0 ? (
          // Mostrar estado vacío
          <div className="text-center p-8 border rounded-lg bg-gray-50">
            <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <h3 className="text-lg font-medium text-gray-700">No hay conversaciones</h3>
            <p className="text-gray-500 mt-1 mb-4">
              {searchTerm ? 
                "No se encontraron resultados para tu búsqueda." : 
                "Cuando recibas mensajes, aparecerán aquí."}
            </p>
          </div>
        ) : (
          // Renderizar lista de conversaciones
          filteredConversations.map((conversation) => {
            const isWhatsApp = conversation.platform === 'whatsapp';
            
            // Obtener información del mensaje
            const messageContent = getMessageContent(conversation.originalMessage);
            const messageTime = formatTimestamp(conversation.timestamp);
            
            // Obtener información de la respuesta
            const hasResponse = !!conversation.responseMessage;
            const responseContent = hasResponse ? getMessageContent(conversation.responseMessage!) : '';
            const responseTime = hasResponse ? formatTimestamp(conversation.responseMessage!.timestamp) : null;
            
            return (
              <div 
                key={conversation.id}
                className={`relative border rounded-lg p-4 transition-all hover:border-gray-400 ${
                  conversation.isRead ? 'bg-white' : 'bg-blue-50'
                }`}
              >
                {/* Mostrar indicador de no leído */}
                {!conversation.isRead && (
                  <div className="absolute top-4 right-4 w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
                )}
                
                {/* Encabezado */}
                <div className="flex items-center mb-3">
                  {/* Avatar */}
                  <div className="flex-shrink-0 mr-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {conversation.user.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  
                  {/* Información del usuario */}
                  <div className="flex-grow">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <h4 className="font-medium">{conversation.user}</h4>
                        <Badge 
                          variant="outline" 
                          className="ml-2 px-1.5 py-0 text-xs flex items-center"
                        >
                          {getPlatformIcon(conversation.platform)}
                          <span className="ml-1">{conversation.platform}</span>
                        </Badge>
                      </div>
                      <span className="text-xs text-gray-500">
                        {messageTime.formatted}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Contenido del mensaje */}
                <div className="mb-2 relative">
                  {/* Mensaje original */}
                  <div className="text-sm text-gray-700">
                    {isWhatsApp ? (
                      <div className="flex gap-3 items-start">
                        <User className="h-5 w-5 text-gray-500 mt-0.5 shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm">{messageContent}</p>
                        </div>
                      </div>
                    ) : (
                      <p>{messageContent}</p>
                    )}
                  </div>
                  
                  {/* Respuesta de la IA si existe */}
                  {hasResponse && (
                    <div className="flex gap-3 items-start mt-3 bg-green-50 p-3 rounded-lg ml-6">
                      <Bot className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-700">
                          {isWhatsApp 
                            ? (conversation.responseMessage as WhatsAppMessage).body 
                            : (conversation.responseMessage as SocialMediaMessage).content
                          }
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {responseTime?.formatted || 'Fecha desconocida'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Acciones */}
                <div className="flex justify-end gap-2 mt-2">
                  {!conversation.isReplied && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-xs"
                      onClick={() => handleConversationClick(conversation)}
                    >
                      <MessageCircle className="h-3.5 w-3.5 mr-1" />
                      Responder
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-xs"
                    onClick={() => handleConversationClick(conversation)}
                  >
                    <Check className="h-3.5 w-3.5 mr-1" />
                    {conversation.isRead ? "Marcar como no leído" : "Marcar como leído"}
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Conversación seleccionada */}
      {replyingTo && (
        <Card className="mt-4">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg flex items-center gap-2">
                {getPlatformIcon(replyingTo.platform)}
                <span>Responder a {replyingTo.user}</span>
              </CardTitle>
              <Button variant="ghost" onClick={() => setReplyingTo(null)} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>
              {replyingTo.platform === 'whatsapp' ? 
                (replyingTo.originalMessage as WhatsAppMessage).from : 
                (replyingTo.originalMessage as SocialMediaMessage).sender.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Mostrar el hilo completo para emails */}
            {replyingTo.platform === 'gmail' && renderEmailThread()}
            
            {/* Mensaje Original */}
            <div className={`${getPlatformBgColor(replyingTo.platform)} p-3 rounded-lg mb-4`}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex gap-2 items-center">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={replyingTo.userAvatar} />
                    <AvatarFallback>{replyingTo.user.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{replyingTo.user}</span>
                </div>
                <span className="text-xs text-gray-500">
                  {formatTimestamp(replyingTo.timestamp).formatted}
                </span>
              </div>
              <p className="text-sm">
                {getMessageContent(replyingTo.originalMessage)}
              </p>
            </div>
            
            {/* Campo para responder */}
            <div className="border rounded-lg p-2 bg-white">
              <Textarea
                ref={replyInputRef}
                placeholder="Escribe tu respuesta..."
                className="border-0 focus-visible:ring-0 resize-none"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={4}
              />
              <div className="flex justify-end mt-2">
                <Button 
                  onClick={sendReply} 
                  disabled={sendingReply || !replyText.trim()}
                  className="flex items-center gap-2"
                >
                  {sendingReply ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Enviar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Conversations;
