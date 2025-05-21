import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getThreadMessages, markMessageAsRead, markThreadAsRead } from '@/lib/messageService';
import { Message } from '@/lib/messageService';
import { sendMessage } from '@/services/sendMessage';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { SendIcon, Instagram, MessageCircle, Mail, Loader2, Sparkles } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';

interface ConversationPanelProps {
  conversation: Message | null;
}

const ConversationPanel: React.FC<ConversationPanelProps> = ({ conversation }) => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [generating, setGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Cargar mensajes cuando cambia la conversación
  useEffect(() => {
    if (conversation && currentUser) {
      loadMessages();
      
      // Marcar toda la conversación como leída
      if (conversation.threadId) {
        markThreadAsRead(currentUser.uid, conversation.threadId);
      }
    } else {
      setMessages([]);
    }
  }, [conversation, currentUser]);

  // Desplazarse al último mensaje
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Cargar mensajes de la conversación
  const loadMessages = async () => {
    if (!conversation || !currentUser) return;
    
    try {
      setLoading(true);
      
      // Obtener mensajes del hilo
      const threadMessages = await getThreadMessages(
        currentUser.uid, 
        conversation.threadId || conversation.id
      );
      
      // Ordenar por timestamp (más antiguos primero)
      const sortedMessages = threadMessages.sort((a, b) => {
        const timeA = a.timestamp?.toMillis() || 0;
        const timeB = b.timestamp?.toMillis() || 0;
        return timeA - timeB;
      });
      
      setMessages(sortedMessages);
    } catch (error) {
      console.error('Error al cargar mensajes:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los mensajes de la conversación',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Formatear timestamp para mostrar
  const formatMessageDate = (timestamp: any) => {
    if (!timestamp) return '';
    
    const date = timestamp instanceof Date 
      ? timestamp 
      : timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      
    return date.toLocaleString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };

  // Enviar mensaje
  const handleSendMessage = async () => {
    if (!messageText.trim() || !conversation || !currentUser) return;
    
    // Determinar el destinatario según la plataforma
    let recipient = '';
    
    if (conversation.platform === 'whatsapp') {
      recipient = conversation.sender; // El número de teléfono
    } else if (conversation.platform === 'email') {
      recipient = conversation.sender; // Dirección de correo electrónico
    } else if (conversation.platform === 'instagram') {
      recipient = conversation.sender; // ID del remitente en Instagram
    }
    
    try {
      setSending(true);
      
      const result = await sendMessage({
        platform: conversation.platform as 'whatsapp' | 'email' | 'instagram',
        to: recipient,
        text: messageText,
        threadId: conversation.threadId,
        userId: currentUser.uid
      });
      
      if (result.success) {
        // Limpiar el campo de texto
        setMessageText('');
        
        // Recargar mensajes para ver el nuevo mensaje
        loadMessages();
        
        toast({
          title: 'Mensaje enviado',
          description: 'Tu mensaje ha sido enviado correctamente'
        });
      } else {
        throw new Error(result.error || 'Error al enviar el mensaje');
      }
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      toast({
        title: 'Error',
        description: 'No se pudo enviar el mensaje',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  // Generar respuesta con IA
  const generateAIResponse = async () => {
    if (!conversation || !currentUser) return;
    
    try {
      setGenerating(true);
      
      // Preparar el contexto (último mensaje recibido)
      const lastIncomingMessage = [...messages].reverse().find(msg => !msg.isFromMe);
      
      if (!lastIncomingMessage) {
        throw new Error('No hay mensajes previos para generar una respuesta');
      }
      
      // Llamar a Cloud Function para generar borrador
      const apiUrl = process.env.REACT_APP_CLOUD_FUNCTIONS_URL + '/generateDraft';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: currentUser.uid,
          platform: conversation.platform,
          message: lastIncomingMessage.content,
          threadId: conversation.threadId
        })
      });
      
      if (!response.ok) {
        throw new Error('Error al generar respuesta con IA');
      }
      
      const data = await response.json();
      
      // Establecer el texto generado en el área de texto
      setMessageText(data.text);
      
      toast({
        title: 'Respuesta generada',
        description: 'Se ha generado un borrador de respuesta con IA'
      });
    } catch (error) {
      console.error('Error al generar respuesta:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo generar una respuesta con IA',
        variant: 'destructive'
      });
    } finally {
      setGenerating(false);
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

  // Si no hay conversación seleccionada
  if (!conversation) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 p-4">
        <div className="text-center">
          <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">Ninguna conversación seleccionada</h3>
          <p className="text-gray-500">Selecciona una conversación de la lista para ver los mensajes</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Cabecera de la conversación */}
      <div className="p-4 border-b flex items-center gap-3">
        <Avatar className="h-10 w-10 border">
          {getPlatformIcon(conversation.platform)}
        </Avatar>
        <div className="flex-1">
          <h3 className="font-medium">
            {conversation.sender || 'Desconocido'}
          </h3>
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="px-1 py-0 h-5 text-xs">
              {conversation.platform}
            </Badge>
          </div>
        </div>
      </div>
      
      {/* Mensajes */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center items-center h-full text-gray-500">
            No hay mensajes en esta conversación
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div 
                key={message.id}
                className={`mb-4 max-w-[80%] ${message.isFromMe ? 'ml-auto' : 'mr-auto'}`}
              >
                <div 
                  className={`p-3 rounded-lg ${
                    message.isFromMe 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white border'
                  }`}
                >
                  {/* Si es un correo, mostrar el asunto */}
                  {message.platform === 'email' && message.subject && (
                    <div className={`font-medium mb-1 ${message.isFromMe ? 'text-blue-100' : 'text-gray-700'}`}>
                      {message.subject}
                    </div>
                  )}
                  
                  {/* Contenido del mensaje */}
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
                <div 
                  className={`text-xs mt-1 flex gap-2 items-center ${
                    message.isFromMe ? 'text-right text-gray-500 justify-end' : 'text-gray-500'
                  }`}
                >
                  <span>{formatMessageDate(message.timestamp)}</span>
                  
                  {/* Mostrar estado del mensaje (para los enviados) */}
                  {message.isFromMe && (
                    <span>
                      {message.status === 'sent' && '✓'}
                      {message.status === 'delivered' && '✓✓'}
                      {message.status === 'read' && '✓✓'}
                    </span>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      {/* Compositor de mensajes */}
      <div className="p-3 border-t bg-white">
        <div className="flex gap-2">
          <Textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder={`Escribir mensaje para ${conversation.platform}...`}
            className="resize-none"
            rows={3}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <div className="flex flex-col gap-2">
            <Button 
              size="icon"
              onClick={handleSendMessage}
              disabled={!messageText.trim() || sending}
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SendIcon className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              title="Sugerir con IA"
              onClick={generateAIResponse}
              disabled={generating || loading || messages.length === 0}
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        <div className="text-xs text-gray-500 mt-2 flex justify-between items-center">
          <span>
            Escribiendo como: {currentUser?.displayName || currentUser?.email}
          </span>
          <span className="italic">
            Plataforma: {conversation.platform}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ConversationPanel; 