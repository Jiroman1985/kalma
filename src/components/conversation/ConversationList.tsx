import React, { useState, useEffect } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Search, MessageCircle, Mail, Instagram, Filter, Check } from 'lucide-react';
import { getConversationThreads } from '@/lib/messageService';
import { useAuth } from '@/contexts/AuthContext';
import { Timestamp } from 'firebase/firestore';
import { Message } from '@/lib/messageService';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

interface ConversationListProps {
  onSelectConversation: (conversation: Message) => void;
  activeConversation?: Message | null;
}

const ConversationList: React.FC<ConversationListProps> = ({ 
  onSelectConversation,
  activeConversation 
}) => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Message[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  // Cargar conversaciones
  useEffect(() => {
    if (currentUser) {
      loadConversations();
    }
  }, [currentUser]);

  // Filtrar conversaciones
  useEffect(() => {
    if (conversations.length > 0) {
      let filtered = [...conversations];
      
      // Filtrar por plataforma seleccionada en los tabs
      if (activeTab !== 'all') {
        filtered = filtered.filter(conversation => conversation.platform === activeTab);
      }
      
      // Filtrar por chips de plataforma seleccionados
      if (selectedPlatforms.length > 0) {
        filtered = filtered.filter(conversation => 
          selectedPlatforms.includes(conversation.platform)
        );
      }
      
      // Filtrar por término de búsqueda
      if (searchTerm) {
        const searchTermLower = searchTerm.toLowerCase();
        filtered = filtered.filter(conversation => 
          (conversation.sender && conversation.sender.toLowerCase().includes(searchTermLower)) ||
          (conversation.content && conversation.content.toLowerCase().includes(searchTermLower))
        );
      }
      
      setFilteredConversations(filtered);
    } else {
      setFilteredConversations([]);
    }
  }, [conversations, searchTerm, activeTab, selectedPlatforms]);

  // Cargar conversaciones desde Firestore
  const loadConversations = async () => {
    try {
      setLoading(true);
      const threads = await getConversationThreads(currentUser.uid);
      setConversations(threads);
    } catch (error) {
      console.error('Error al cargar conversaciones:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las conversaciones',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Formatear timestamp de manera amigable
  const formatTimestamp = (timestamp: Timestamp | Date | null | undefined) => {
    if (!timestamp) return '';
    
    const date = timestamp instanceof Date 
      ? timestamp 
      : timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return 'Ahora';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    
    // Para mensajes más antiguos mostrar la fecha
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: '2-digit'
    });
  };

  // Mostrar icono según la plataforma
  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return <Instagram size={16} className="text-pink-500" />;
      case 'whatsapp': 
        return <MessageCircle size={16} className="text-green-500" />;
      case 'email':
        return <Mail size={16} className="text-blue-500" />;
      default:
        return <MessageCircle size={16} className="text-gray-500" />;
    }
  };

  // Alternar selección de plataforma para filtrado avanzado
  const togglePlatformFilter = (platform: string) => {
    setSelectedPlatforms(prevSelected => 
      prevSelected.includes(platform)
        ? prevSelected.filter(p => p !== platform)
        : [...prevSelected, platform]
    );
  };

  return (
    <div className="flex flex-col h-full border-r">
      {/* Cabecera y buscador */}
      <div className="p-3 border-b">
        <h2 className="text-lg font-bold mb-2">Conversaciones</h2>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar conversaciones..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {/* Tabs para filtrar por plataforma */}
      <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="w-full p-0 h-12">
          <TabsTrigger value="all" className="flex-1 h-full rounded-none">
            Todos
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="flex-1 h-full rounded-none">
            <MessageCircle className="mr-1 h-4 w-4" />
            WhatsApp
          </TabsTrigger>
          <TabsTrigger value="email" className="flex-1 h-full rounded-none">
            <Mail className="mr-1 h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="instagram" className="flex-1 h-full rounded-none">
            <Instagram className="mr-1 h-4 w-4" />
            Instagram
          </TabsTrigger>
        </TabsList>
      </Tabs>
      
      {/* Filtros avanzados */}
      <div className="p-2 border-b bg-gray-50 flex flex-wrap gap-2">
        <Button 
          variant={selectedPlatforms.includes('whatsapp') ? 'default' : 'outline'} 
          size="sm"
          className="h-7"
          onClick={() => togglePlatformFilter('whatsapp')}
        >
          {selectedPlatforms.includes('whatsapp') && <Check className="mr-1 h-3 w-3" />}
          WhatsApp
        </Button>
        <Button 
          variant={selectedPlatforms.includes('email') ? 'default' : 'outline'} 
          size="sm"
          className="h-7"
          onClick={() => togglePlatformFilter('email')}
        >
          {selectedPlatforms.includes('email') && <Check className="mr-1 h-3 w-3" />}
          Email
        </Button>
        <Button 
          variant={selectedPlatforms.includes('instagram') ? 'default' : 'outline'} 
          size="sm"
          className="h-7"
          onClick={() => togglePlatformFilter('instagram')}
        >
          {selectedPlatforms.includes('instagram') && <Check className="mr-1 h-3 w-3" />}
          Instagram
        </Button>
      </div>
      
      {/* Lista de conversaciones */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          // Esqueletos de carga
          Array(5).fill(0).map((_, index) => (
            <div key={index} className="flex items-center gap-3 p-3 border-b">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-1/3 mb-1" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))
        ) : filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {searchTerm ? 'No se encontraron conversaciones' : 'No hay conversaciones disponibles'}
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <div 
              key={conversation.id}
              className={`flex items-start gap-3 p-3 border-b hover:bg-gray-50 cursor-pointer ${
                activeConversation?.id === conversation.id ? 'bg-blue-50' : ''
              }`}
              onClick={() => onSelectConversation(conversation)}
            >
              <Avatar className="h-10 w-10 border">
                {getPlatformIcon(conversation.platform)}
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium truncate">
                    {conversation.sender || 'Desconocido'}
                  </h3>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {formatTimestamp(conversation.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 truncate">{conversation.content}</p>
                <div className="flex mt-1 items-center gap-1">
                  <Badge variant="outline" className="px-1 py-0 h-5 text-xs">
                    {conversation.platform}
                  </Badge>
                  {!conversation.isRead && (
                    <Badge className="w-2 h-2 rounded-full p-0 bg-blue-500" />
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ConversationList; 