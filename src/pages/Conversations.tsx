import { useState, useEffect } from "react";
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
import { Search, MessageSquare, User, Calendar, Clock, Filter, MessageCircle, Bot } from "lucide-react";
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
  or
} from "firebase/firestore";
import { WhatsAppMessage, getAgentRespondedMessages } from "@/lib/whatsappService";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
  const { currentUser } = useAuth();

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
    // Usar la nueva función que obtiene mensajes respondidos por agente IA
    const respondedByAgentMessages = await getAgentRespondedMessages(currentUser.uid, 50);
    
    if (respondedByAgentMessages.length === 0) {
      return [];
    }
    
    // Obtener todos los mensajes para encontrar las respuestas
    const whatsappCollectionRef = collection(db, 'users', currentUser.uid, 'whatsapp');
    const messagesQuery = query(whatsappCollectionRef, orderBy("timestamp", "desc"));
    const messagesSnapshot = await getDocs(messagesQuery);
    
    // Extraer los mensajes de respuesta
    const allMessages: WhatsAppMessage[] = [];
    messagesSnapshot.forEach(doc => {
      const message = doc.data() as WhatsAppMessage;
      message.id = doc.id;
      allMessages.push(message);
    });
    
    // Crear conversaciones con los mensajes respondidos por agente y sus respuestas
    const conversationsData: Conversation[] = [];
    
    for (const message of respondedByAgentMessages) {
      // Buscar la respuesta como mensaje separado si existe
      let responseMessage = allMessages.find(msg => 
        msg.originalMessageId === message.messageId
      );
      
      // Si no hay mensaje de respuesta separado pero existe texto de respuesta en el mensaje original
      const hasAgentResponseInSameDoc = typeof message.agentResponseText === 'string' && message.agentResponseText.trim().length > 0;
      
      // Si tenemos respuesta en el mismo documento, crear un mensaje simulado de respuesta
      if (!responseMessage && hasAgentResponseInSameDoc) {
        responseMessage = {
          id: `${message.id}_response`,
          messageId: `${message.id}_response`,
          body: message.agentResponseText || '',
          from: message.to, // Invertimos remitente y destinatario
          to: message.from,
          timestamp: message.timestamp, // Usamos el mismo timestamp por ahora
          isFromMe: true,
          senderName: 'Asistente IA',
          messageType: 'chat',
          responded: false,
          originalMessageId: message.messageId
        } as WhatsAppMessage;
      }
      
      if (message.from && message.body) {
        conversationsData.push({
          id: message.id,
          user: message.senderName || "Usuario de WhatsApp",
          contactId: message.from,
          originalMessage: message,
          responseMessage: responseMessage,
          platform: 'whatsapp',
          timestamp: message.timestamp || new Date(),
          isRead: true, // Asumimos que los mensajes de WhatsApp ya fueron leídos
          isReplied: !!responseMessage
        });
      }
    }
    
    return conversationsData;
  };

  // Obtener conversaciones de redes sociales
  const fetchSocialMediaConversations = async (): Promise<Conversation[]> => {
    // En un caso real, obtendríamos estos mensajes de Firestore
    // Para esta implementación, usaremos datos simulados
    
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
        accountId: "instagram1"
      },
      {
        id: "sm2",
        platform: "instagram",
        sender: {
          name: "nuevo_seguidor",
          avatar: "https://randomuser.me/api/portraits/men/55.jpg"
        },
        content: "Acabo de descubrir su perfil y me encantan sus productos. ¿Hacen colaboraciones con influencers? Tengo 10K seguidores en mi cuenta de lifestyle.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 día atrás
        read: false,
        replied: false,
        accountId: "instagram1"
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
        accountId: "facebook1"
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
        accountId: "twitter1"
      },
      
      // Gmail
      {
        id: "sm5",
        platform: "gmail",
        sender: {
          name: "cliente_corporativo@empresa.com",
          avatar: ""
        },
        content: "Estimados señores,\n\nEstamos interesados en realizar un pedido mayorista para nuestra cadena de tiendas. ¿Podrían enviarnos su catálogo actual con precios para distribuidores?\n\nAgradecemos su atención.\n\nAtentamente,\nDpto. Compras - Empresa S.A.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 días atrás
        read: true,
        replied: false,
        accountId: "gmail1"
      },
      
      // Google Reviews
      {
        id: "sm6",
        platform: "googleReviews",
        sender: {
          name: "Ana Martín",
          avatar: "https://randomuser.me/api/portraits/women/33.jpg"
        },
        content: "⭐⭐⭐ La tienda está bien, pero el tiempo de espera para la entrega fue más largo de lo prometido. Por lo demás todo correcto.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 36), // 36 horas atrás
        read: false,
        replied: false,
        accountId: "googleReviews1"
      }
    ];
    
    // Convertir a formato Conversation
    return socialMessages.map(msg => ({
      id: msg.id,
      user: msg.sender.name,
      userAvatar: msg.sender.avatar,
      contactId: msg.sender.name,
      originalMessage: msg,
      platform: msg.platform as any,
      timestamp: msg.timestamp,
      isRead: msg.read,
      isReplied: msg.replied
    }));
  };

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
                      <div>
                        <p className="text-sm text-gray-700">{messageContent}</p>
                        <p className="text-xs text-gray-500 mt-1">{originalTime.formatted}</p>
                      </div>
                    </div>
                    
                    {/* Respuesta si existe */}
                    {conversation.responseMessage && (
                      <div className="flex gap-3 items-start bg-green-50 p-3 rounded-lg ml-6">
                        <Bot className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                        <div>
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
                  </CardContent>
                  
                  <CardFooter>
                    <div className="w-full flex justify-end">
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
    </div>
  );
};

export default Conversations;
