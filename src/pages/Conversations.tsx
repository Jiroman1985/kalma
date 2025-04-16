
import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MessageSquare, User, Calendar, Clock, Filter } from "lucide-react";

// Datos de ejemplo para conversaciones
const conversationsData = [
  {
    id: 1,
    user: "Juan Pérez",
    phone: "+34612345678",
    lastMessage: "¿Cuál es el horario de atención?",
    date: "2025-04-15",
    time: "10:23",
    status: "respondido"
  },
  {
    id: 2,
    user: "María López",
    phone: "+34698765432",
    lastMessage: "Necesito información sobre el producto X",
    date: "2025-04-15",
    time: "11:45",
    status: "respondido"
  },
  {
    id: 3,
    user: "Carlos Rodríguez",
    phone: "+34634567890",
    lastMessage: "¿Tienen disponibilidad para una reunión mañana?",
    date: "2025-04-14",
    time: "17:12",
    status: "pendiente"
  },
  {
    id: 4,
    user: "Laura Martínez",
    phone: "+34654321098",
    lastMessage: "Gracias por la información",
    date: "2025-04-14",
    time: "16:05",
    status: "respondido"
  },
  {
    id: 5,
    user: "Antonio Sánchez",
    phone: "+34678901234",
    lastMessage: "¿Cuál es el precio del servicio premium?",
    date: "2025-04-13",
    time: "09:30",
    status: "respondido"
  }
];

const Conversations = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [conversations, setConversations] = useState(conversationsData);

  const filteredConversations = conversations.filter(conversation => 
    conversation.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conversation.lastMessage.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conversation.phone.includes(searchTerm)
  );

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

      <div className="grid grid-cols-1 gap-4">
        {filteredConversations.length > 0 ? (
          filteredConversations.map((conversation) => (
            <Card key={conversation.id} className="hover:bg-gray-50 cursor-pointer transition-colors">
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
                      <span>{conversation.date}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>{conversation.time}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 items-start">
                  <MessageSquare className="h-4 w-4 text-gray-500 mt-0.5 shrink-0" />
                  <p className="text-sm truncate">{conversation.lastMessage}</p>
                </div>
                <div className="flex justify-end mt-2">
                  <span 
                    className={`text-xs px-2 py-1 rounded-full ${
                      conversation.status === "respondido" 
                        ? "bg-green-100 text-green-800" 
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {conversation.status === "respondido" ? "Respondido" : "Pendiente"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-10">
            <MessageSquare className="mx-auto h-8 w-8 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron conversaciones</h3>
            <p className="mt-1 text-sm text-gray-500">No hay conversaciones que coincidan con tu búsqueda.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Conversations;
