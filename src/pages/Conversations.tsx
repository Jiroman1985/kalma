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
import { Search, MessageSquare, User, Calendar, Clock, Filter, MessageCircle, Bot, Send, X } from "lucide-react";
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
        // 1. Obtener mensajes de WhatsApp
        const whatsappConversations = await fetchWhatsAppConversations();
        
        // 2. Obtener mensajes de redes sociales
        const socialConversations = await fetchSocialMediaConversations();
        
        // 3. Combinar y ordenar por fecha
        const allConversations = [...whatsappConversations, ...socialConversations]
          .sort((a, b) => {
            const dateA = getTimestampValue(a.timestamp);
            const dateB = getTimestampValue(b.timestamp);
            return dateB - dateA;
          });
        
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
    
    // Obtener mensajes de WhatsApp utilizando la función de servicio
    const whatsappMessages = await getWhatsAppMessages(currentUser.uid, 100);
    
    if (whatsappMessages.length === 0) {
      console.log("No se encontraron mensajes de WhatsApp");
      return [];
    }
    
    console.log(`Encontrados ${whatsappMessages.length} mensajes de WhatsApp`);
    
    // Crear conversaciones a partir de los mensajes
    const conversationsData: Conversation[] = [];
    
    // Agrupar mensajes por contacto (from)
    const messagesByContact = new Map<string, WhatsAppMessage[]>();
    
    whatsappMessages.forEach(message => {
      // Ignorar mensajes sin remitente o cuerpo
      if (!message.from || !message.body) return;
      
      const contactId = message.isFromMe ? message.to : message.from;
      if (!messagesByContact.has(contactId)) {
        messagesByContact.set(contactId, []);
      }
      
      messagesByContact.get(contactId)?.push(message);
    });
    
    // Para cada contacto, crear una conversación con el mensaje más reciente
    for (const [contactId, messages] of messagesByContact.entries()) {
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
      const responseMessage = messages.find(msg => 
        msg.originalMessageId === latestMessage.messageId
      );
      
      conversationsData.push({
        id: latestMessage.id,
        user: latestMessage.senderName || contactId,
        contactId: contactId,
        originalMessage: latestMessage,
        responseMessage: responseMessage,
        platform: 'whatsapp',
        timestamp: latestMessage.timestamp || new Date(),
        isRead: latestMessage.status === 'read',
        isReplied: !!responseMessage || latestMessage.responded || false
      });
    }
    
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

  // Actualizar función sendReply para usar el servicio de email para respuestas
  const sendReply = async () => {
    if (!replyingTo || !replyText.trim()) return;
    
    setSendingReply(true);
    
    try {
      if (replyingTo.platform === 'whatsapp') {
        // Lógica para responder mensajes de WhatsApp (se mantiene igual)
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
          originalMessageId: whatsappMessage.messageId || whatsappMessage.id,
          responded: false,
          platform: "whatsapp",
          userId: currentUser.uid,
          status: "sent",
          type: "text"
        };
        
        // Guardar respuesta en Firestore
        const messagesRef = collection(db, "messages");
        await addDoc(messagesRef, responseData);
        
        // Actualizar el mensaje original para marcarlo como respondido
        const originalMessageRef = doc(db, "messages", whatsappMessage.id);
        await updateDoc(originalMessageRef, {
          responded: true,
          updatedAt: serverTimestamp()
        });
      } 
      else if (replyingTo.platform === 'gmail') {
        // Usar el servicio de email para enviar respuestas
        const emailId = replyingTo.id;
        const response = await replyToEmail(currentUser.uid, emailId, replyText);
        
        if (!response) {
          throw new Error("No se pudo enviar la respuesta al correo electrónico");
        }
      }
      else {
        // Para redes sociales: En un escenario real, esto enviaría la respuesta a través de API
        // En esta versión de demostración, simularemos la respuesta

        // Simular un identificador único para la respuesta
        const responseId = `resp_${Date.now()}`;
        
        // Construir una respuesta simulada
        const socialResponse = {
          id: responseId,
          platform: replyingTo.platform,
          sender: {
            name: "Mi Empresa",
            avatar: "https://ui-avatars.com/api/?name=Mi+Empresa"
          },
          content: replyText,
          timestamp: new Date(),
          read: true,
          replied: false,
          accountId: (replyingTo.originalMessage as SocialMediaMessage).accountId
        };

        // Actualizar la conversación localmente para mostrar la respuesta
        const updatedConversations = conversations.map(conv => {
          if (conv.id === replyingTo.id) {
            return {
              ...conv,
              responseMessage: socialResponse,
              isReplied: true
            };
          }
          return conv;
        });

        // Actualizar estado
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

  // Actualizar handleConversationClick para cargar hilos de email
  const handleConversationClick = (conversation: Conversation) => {
    setReplyingTo(conversation);
    
    // Si es un correo electrónico, intentar cargar el hilo completo
    if (conversation.platform === 'gmail') {
      loadEmailThread(conversation);
    } else {
      // Para otras plataformas, resetear el hilo seleccionado
      setSelectedThread(null);
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

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conversation) => {
              const isWhatsApp = conversation.platform === 'whatsapp';
              const messageContent = getMessageContent(conversation.originalMessage);
              const originalTime = formatTimestamp(conversation.timestamp);
              const responseTime = conversation.responseMessage 
                ? formatTimestamp('timestamp' in conversation.responseMessage 
                    ? conversation.responseMessage.timestamp 
                    : ('timestamp' in conversation.originalMessage ? conversation.originalMessage.timestamp : new Date()))
                : null;
              
              const isReplying = replyingTo?.id === conversation.id;
              
              return (
                <Card 
                  key={conversation.id} 
                  className={`hover:bg-gray-50 transition-colors ${!conversation.isRead ? 'border-l-4 border-l-blue-500' : ''}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          {conversation.userAvatar ? (
                            <Avatar>
                              <AvatarImage src={conversation.userAvatar} alt={conversation.user} />
                              <AvatarFallback>{conversation.user.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="bg-gray-200 rounded-full p-2">
                              <User className="h-5 w-5 text-gray-600" />
                            </div>
                          )}
                          {!conversation.isRead && (
                            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-blue-500"></span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base">{conversation.user}</CardTitle>
                            {getPlatformBadge(conversation.platform)}
                          </div>
                          <CardDescription className="text-xs">{conversation.contactId}</CardDescription>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="h-3 w-3" />
                          <span>{originalTime.date}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>{originalTime.time}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Mensaje original */}
                    <div className={`flex gap-3 items-start ${getPlatformBgColor(conversation.platform)} p-3 rounded-lg`}>
                      {getPlatformIcon(conversation.platform)}
                      <div className="flex-1">
                        <p className="text-sm text-gray-700">{messageContent}</p>
                        <p className="text-xs text-gray-500 mt-1">{originalTime.formatted}</p>
                      </div>
                    </div>
                    
                    {/* Respuesta si existe */}
                    {conversation.responseMessage && (
                      <div className="flex gap-3 items-start bg-green-50 p-3 rounded-lg ml-6">
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
                    
                    {/* Formulario de respuesta */}
                    {isReplying && (
                      <div className="flex flex-col gap-2 p-3 border rounded-lg ml-6 bg-blue-50">
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="text-sm font-medium">Responder a {conversation.user}</h4>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => setReplyingTo(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <Textarea
                          ref={replyInputRef}
                          placeholder={`Escribe tu respuesta para ${conversation.user}...`}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          className="min-h-[80px]"
                        />
                        <div className="flex justify-end mt-2">
                          <Button 
                            onClick={sendReply} 
                            disabled={sendingReply || !replyText.trim()}
                            className="flex items-center gap-2"
                          >
                            {sendingReply ? (
                              <>
                                <div className="h-4 w-4 border-t-2 border-r-2 border-white rounded-full animate-spin"></div>
                                Enviando...
                              </>
                            ) : (
                              <>
                                <Send className="h-4 w-4" />
                                Enviar
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                  
                  <CardFooter className="flex justify-between">
                    <div className="flex">
                      {!conversation.isReplied && !isReplying && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setReplyingTo(conversation)}
                        >
                          Responder
                        </Button>
                      )}
                    </div>
                    <div className="flex justify-end">
                      <span 
                        className={`text-xs px-2 py-1 rounded-full ${
                          conversation.isReplied 
                            ? "bg-green-100 text-green-800" 
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {conversation.isReplied ? "Respondido" : "Pendiente"}
                      </span>
                    </div>
                  </CardFooter>
                </Card>
              );
            })
          ) : (
            <div className="text-center py-10">
              <MessageSquare className="mx-auto h-8 w-8 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron conversaciones</h3>
              <p className="mt-1 text-sm text-gray-500">
                No hay conversaciones que coincidan con tu búsqueda.
              </p>
            </div>
          )}
        </div>
      )}

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
