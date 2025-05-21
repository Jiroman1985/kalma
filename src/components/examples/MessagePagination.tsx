import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getMessages } from '@/lib/messageService';
import { Message } from '@/lib/messageService';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, getDocs, orderBy, limit, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const MessagePagination = () => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastVisibleDoc, setLastVisibleDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const messagesPerPage = 10;

  // Cargar mensajes iniciales al montar el componente
  useEffect(() => {
    if (currentUser) {
      loadInitialMessages();
    }
  }, [currentUser]);

  // Función para cargar los mensajes iniciales
  const loadInitialMessages = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      // 1. Obtener el primer lote de mensajes
      const firstBatch = await getMessages(currentUser.uid, { 
        limit: messagesPerPage,
        orderByField: 'timestamp',
        orderDirection: 'desc'
      });

      setMessages(firstBatch);

      // 2. Guardar referencia al último documento visible para paginación
      if (firstBatch.length > 0) {
        // Para usar startAfter necesitamos obtener el documento original, no solo los datos
        // Esto es crucial para que la paginación funcione correctamente
        const lastMessageId = firstBatch[firstBatch.length - 1].id;
        const lastMessageQuery = query(
          collection(db, "messages"),
          where("id", "==", lastMessageId)
        );
        const lastMessageSnapshot = await getDocs(lastMessageQuery);
        
        if (!lastMessageSnapshot.empty) {
          setLastVisibleDoc(lastMessageSnapshot.docs[0]);
        }
      }

      // Verificar si hay más mensajes para cargar
      setHasMoreMessages(firstBatch.length >= messagesPerPage);
    } catch (error) {
      console.error("Error al cargar mensajes iniciales:", error);
    } finally {
      setLoading(false);
    }
  };

  // Función para cargar más mensajes (paginación)
  const loadMoreMessages = async () => {
    if (!currentUser || !lastVisibleDoc || !hasMoreMessages) return;
    
    setLoadingMore(true);
    try {
      // 3. Obtener el siguiente lote de mensajes usando startAfter
      const nextBatch = await getMessages(currentUser.uid, {
        limit: messagesPerPage,
        orderByField: 'timestamp',
        orderDirection: 'desc',
        startAfter: lastVisibleDoc
      });

      // Añadir los nuevos mensajes al estado existente
      setMessages(prevMessages => [...prevMessages, ...nextBatch]);

      // 4. Actualizar referencia al último documento para la próxima paginación
      if (nextBatch.length > 0) {
        const lastMessageId = nextBatch[nextBatch.length - 1].id;
        const lastMessageQuery = query(
          collection(db, "messages"),
          where("id", "==", lastMessageId)
        );
        const lastMessageSnapshot = await getDocs(lastMessageQuery);
        
        if (!lastMessageSnapshot.empty) {
          setLastVisibleDoc(lastMessageSnapshot.docs[0]);
        }
      }

      // Verificar si hay más mensajes para cargar
      setHasMoreMessages(nextBatch.length >= messagesPerPage);
    } catch (error) {
      console.error("Error al cargar más mensajes:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Formatear fecha
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Fecha desconocida';
    
    const date = timestamp instanceof Date 
      ? timestamp 
      : timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6 p-4">
      <h2 className="text-2xl font-bold">Mensajes con Paginación</h2>
      
      {loading ? (
        // Mostrar esqueletos durante la carga inicial
        Array(3).fill(0).map((_, index) => (
          <Card key={`skeleton-${index}`} className="mb-4">
            <CardHeader>
              <Skeleton className="h-5 w-1/3" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-4 w-1/4 mt-2" />
            </CardContent>
          </Card>
        ))
      ) : (
        <>
          {messages.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p>No hay mensajes para mostrar.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Lista de mensajes */}
              {messages.map((message) => (
                <Card key={message.id} className="mb-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium flex justify-between">
                      <span>{message.sender || 'Remitente Desconocido'}</span>
                      <span className="text-xs text-gray-500">
                        {formatDate(message.timestamp)}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{message.content}</p>
                    <div className="mt-2 text-sm text-gray-500 flex justify-between">
                      <span>Plataforma: {message.platform}</span>
                      {message.isRead ? (
                        <span className="text-green-500">✓ Leído</span>
                      ) : (
                        <span className="text-yellow-500">No leído</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* Botón para cargar más */}
              {hasMoreMessages && (
                <div className="mt-4 text-center">
                  <Button 
                    onClick={loadMoreMessages} 
                    disabled={loadingMore}
                    variant="outline"
                  >
                    {loadingMore ? "Cargando..." : "Cargar más mensajes"}
                  </Button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default MessagePagination; 