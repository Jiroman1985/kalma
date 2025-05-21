import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getConversationThreads, Message } from '@/lib/messageService';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Instagram, MessageCircle, Mail, Search, Filter, Loader2 } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';

interface ConversationListProps {
  onSelectConversation: (conversation: Message) => void;
  selectedConversationId?: string;
}

const ConversationList: React.FC<ConversationListProps> = ({ 
  onSelectConversation, 
  selectedConversationId 
}) => {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState<Message[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([
    'whatsapp', 'email', 'instagram'
  ]);

  // Cargar conversaciones al iniciar
  useEffect(() => {
    if (currentUser) {
      loadConversations();
    }
  }, [currentUser]);

  // Filtrar conversaciones cuando cambia la búsqueda o plataformas seleccionadas
  useEffect(() => {
    filterConversations();
  }, [searchTerm, selectedPlatforms, activeTab, conversations]);

  // Cargar conversaciones desde Firestore
  const loadConversations = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      const threads = await getConversationThreads(currentUser.uid);
      setConversations(threads);
    } catch (error) {
      console.error('Error al cargar conversaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar conversaciones según búsqueda y plataformas seleccionadas
  const filterConversations = () => {
    if (!conversations.length) {
      setFilteredConversations([]);
      return;
    }

    let filtered = [...conversations];

    // Filtrar por plataforma
    if (selectedPlatforms.length > 0 && selectedPlatforms.length < 3) {
      filtered = filtered.filter(conv => selectedPlatforms.includes(conv.platform));
    }

    // Filtrar por pestaña seleccionada
    if (activeTab === 'unread') {
      filtered = filtered.filter(conv => !conv.isRead);
    }

    // Filtrar por término de búsqueda
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(conv => {
        const sender = (conv.sender || '').toLowerCase();
        const content = (conv.content || '').toLowerCase();
        const subject = (conv.subject || '').toLowerCase();
        
        return sender.includes(term) || content.includes(term) || subject.includes(term);
      });
    }

    // Ordenar por fecha (más recientes primero)
    filtered.sort((a, b) => {
      const timeA = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0;
      const timeB = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0;
      return timeB - timeA;
    });

    setFilteredConversations(filtered);
  };

  // Formatear la fecha para mostrar
  const formatConversationDate = (timestamp: any) => {
    if (!timestamp) return '';
    
    const date = timestamp instanceof Date 
      ? timestamp 
      : timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const dayDiff = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (dayDiff === 0) {
      // Hoy, mostrar solo la hora
      return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } else if (dayDiff === 1) {
      // Ayer
      return 'Ayer';
    } else if (dayDiff < 7) {
      // Esta semana, mostrar el día
      return date.toLocaleDateString('es-ES', { weekday: 'short' });
    } else {
      // Más antiguo, mostrar la fecha
      return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
    }
  };

  // Obtener ícono para la plataforma
  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return <Instagram className="text-pink-500" />;
      case 'whatsapp':
        return <MessageCircle className="text-green-500" />;
      case 'email':
        return <Mail className="text-blue-500" />;
      default:
        return <MessageCircle className="text-gray-500" />;
    }
  };

  // Alternar plataformas seleccionadas
  const togglePlatform = (platform: string) => {
    if (selectedPlatforms.includes(platform)) {
      if (selectedPlatforms.length > 1) {
        // Permite deseleccionar solo si hay más de una plataforma seleccionada
        setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform));
      }
    } else {
      setSelectedPlatforms([...selectedPlatforms, platform]);
    }
  };

  // Truncar texto
  const truncateText = (text: string, maxLength: number) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Cabecera de la lista */}
      <div className="p-3 border-b">
        <div className="relative mb-3">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar conversaciones..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* Pestañas para filtrar */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-3">
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">Todas</TabsTrigger>
            <TabsTrigger value="unread" className="flex-1">No leídas</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {/* Filtros por plataforma */}
        <div className="flex gap-2">
          <Button 
            variant={selectedPlatforms.includes('whatsapp') ? "default" : "outline"}
            size="sm"
            className="flex-1"
            onClick={() => togglePlatform('whatsapp')}
          >
            <MessageCircle className="w-4 h-4 mr-1" />
            WhatsApp
          </Button>
          <Button 
            variant={selectedPlatforms.includes('email') ? "default" : "outline"}
            size="sm"
            className="flex-1"
            onClick={() => togglePlatform('email')}
          >
            <Mail className="w-4 h-4 mr-1" />
            Email
          </Button>
          <Button 
            variant={selectedPlatforms.includes('instagram') ? "default" : "outline"}
            size="sm"
            className="flex-1"
            onClick={() => togglePlatform('instagram')}
          >
            <Instagram className="w-4 h-4 mr-1" />
            Instagram
          </Button>
        </div>
      </div>
      
      {/* Lista de conversaciones */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            {searchTerm ? 'No hay conversaciones que coincidan con tu búsqueda' : 'No hay conversaciones disponibles'}
          </div>
        ) : (
          <div>
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.threadId || conversation.id}
                className={`p-3 hover:bg-gray-50 cursor-pointer border-b ${
                  (conversation.threadId || conversation.id) === selectedConversationId
                    ? 'bg-blue-50'
                    : ''
                } ${!conversation.isRead ? 'font-medium' : ''}`}
                onClick={() => onSelectConversation(conversation)}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    {getPlatformIcon(conversation.platform)}
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div className="font-medium truncate">
                        {conversation.sender || 'Desconocido'}
                      </div>
                      <div className="text-xs text-gray-500 whitespace-nowrap ml-2">
                        {formatConversationDate(conversation.timestamp)}
                      </div>
                    </div>
                    
                    {conversation.platform === 'email' && conversation.subject && (
                      <div className="text-sm truncate font-medium">
                        {truncateText(conversation.subject, 40)}
                      </div>
                    )}
                    
                    <div className="text-sm text-gray-600 truncate">
                      {truncateText(conversation.content || '', 60)}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="px-1 py-0 h-5 text-xs">
                        {conversation.platform}
                      </Badge>
                      
                      {!conversation.isRead && (
                        <Badge className="px-1 py-0 h-5 text-xs">
                          Sin leer
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationList; 