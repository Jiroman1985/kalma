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
import { useAuth } from "@/contexts/AuthContext";
import { db, auth } from "@/lib/firebase";
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  Timestamp 
} from "firebase/firestore";
import { WhatsAppMessage, getAgentRespondedMessages } from "@/lib/whatsappService";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Conversation {
  id: string;
  user: string;
  phone: string;
  originalMessage: WhatsAppMessage;
  responseMessage?: WhatsAppMessage;
}

const Conversations = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchConversations = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Usar la nueva función que obtiene mensajes respondidos por agente IA
        const respondedByAgentMessages = await getAgentRespondedMessages(currentUser.uid, 100);
        console.log(`Se encontraron ${respondedByAgentMessages.length} mensajes respondidos`);
        
        if (respondedByAgentMessages.length === 0) {
          setConversations([]);
          setLoading(false);
          return;
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
              user: message.senderName || "Usuario",
              phone: message.from,
              originalMessage: message,
              responseMessage: responseMessage
            });
          }
        }
        
        console.log(`Se crearon ${conversationsData.length} conversaciones con mensajes reales`);
        setConversations(conversationsData);
      } catch (error) {
        console.error("Error al cargar conversaciones:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [currentUser]);

  const filteredConversations = conversations.filter(conversation =>
    conversation.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conversation.originalMessage.body.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conversation.phone.includes(searchTerm)
  );

  // Función para formatear timestamp
  const formatTimestamp = (timestamp: number | Timestamp | undefined) => {
    if (!timestamp) return { date: 'Fecha desconocida', time: 'Hora desconocida' };
    
    let date: Date;
    if (typeof timestamp === 'number') {
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Conversaciones</h1>
      </div>

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
              const originalTime = formatTimestamp(conversation.originalMessage.timestamp);
              const responseTime = conversation.responseMessage?.timestamp 
                ? formatTimestamp(conversation.responseMessage.timestamp) 
                : null;
              
              return (
                <Card key={conversation.id} className="hover:bg-gray-50 transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <div className="bg-gray-200 rounded-full p-2">
                          <User className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{conversation.user}</CardTitle>
                          <CardDescription className="text-xs">{conversation.phone}</CardDescription>
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
                    <div className="flex gap-3 items-start bg-gray-50 p-3 rounded-lg">
                      <MessageCircle className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm text-gray-700">{conversation.originalMessage.body}</p>
                        <p className="text-xs text-gray-500 mt-1">{originalTime.formatted}</p>
                      </div>
                    </div>
                    
                    {/* Respuesta del agente */}
                    {conversation.responseMessage && (
                      <div className="flex gap-3 items-start bg-green-50 p-3 rounded-lg ml-6">
                        <Bot className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm text-gray-700">{conversation.responseMessage.body}</p>
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
                        className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800"
                      >
                        Respondido
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
                No hay conversaciones respondidas que coincidan con tu búsqueda.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Conversations;
