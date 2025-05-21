# Sistema de Mensajería Multicanal en Kalma

Este documento describe la implementación del sistema de mensajería multicanal en Kalma, que permite gestionar conversaciones desde múltiples plataformas (WhatsApp, Email, Instagram) a través de una interfaz unificada.

## 1. Arquitectura General

El sistema de mensajería multicanal está compuesto por los siguientes componentes:

### 1.1 Componentes Frontend
- **ConversationsView**: Componente principal que integra la lista y el panel de conversaciones
- **ConversationList**: Muestra y filtra las conversaciones disponibles
- **ConversationPanel**: Muestra los mensajes de una conversación y permite responder

### 1.2 Servicios Backend
- **messageService**: Gestiona las operaciones con la colección de mensajes en Firestore
- **sendMessage**: Servicio para enviar mensajes a diferentes plataformas (WhatsApp, Email, Instagram)
- **n8n workflows**: Procesan webhooks entrantes, normalizan los datos y guardan los mensajes en Firestore

### 1.3 Almacenamiento de Datos
- **Firestore**: Colección `messages` con un formato unificado para todos los canales

## 2. Estructura de Datos

### 2.1 Interfaz de Mensaje Unificado

```typescript
interface Message {
  id: string;
  platform: 'whatsapp' | 'email' | 'instagram' | 'facebook' | string;
  userId: string;
  sender: string;
  recipient: string;
  content: string;
  timestamp: Timestamp;
  threadId: string;
  isRead: boolean;
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'received';
  // Campos para clasificación IA
  sentiment?: 'positive' | 'neutral' | 'negative';
  category?: string;
  // Campos específicos por tipo
  attachments?: Attachment[];
  metadata?: Record<string, any>;
  // Campos para correos
  subject?: string;
  folder?: string;
  // Campos para métricas
  isFromMe?: boolean;
  responded?: boolean;
  responseId?: string;
  responseTimestamp?: Timestamp;
  responseTime?: number;
  aiAssisted?: boolean;
}
```

### 2.2 Organización en Hilos de Conversación (Threads)

Los mensajes se agrupan en hilos de conversación (threads) basados en:
- **WhatsApp**: Número de teléfono del contacto
- **Email**: Dirección de correo electrónico
- **Instagram**: ID de usuario de Instagram

Cada mensaje tiene un `threadId` que permite agrupar la conversación independientemente del canal.

## 3. Flujo de Mensajes

### 3.1 Recepción de Mensajes

1. Los mensajes entrantes llegan a través de webhooks configurados en cada plataforma
2. Los workflows de n8n procesan estos webhooks:
   - Normalizan los datos al formato unificado
   - Clasifican el contenido con IA para determinar sentimiento y categoría
   - Guardan los mensajes en Firestore

### 3.2 Envío de Mensajes

1. El usuario selecciona una conversación en la interfaz
2. Escribe una respuesta en el panel de la conversación
3. El servicio `sendMessage` determina la plataforma y envía el mensaje por el canal correspondiente:
   - WhatsApp: API de WhatsApp Business
   - Email: API de correo configurada
   - Instagram: API de Instagram Direct
4. El mensaje enviado se guarda en Firestore con `isFromMe: true`

## 4. Componentes UI

### 4.1 ConversationsView

Componente principal que organiza la vista de conversaciones:
- Divide la pantalla en dos secciones (lista y panel)
- Gestiona el estado de la conversación seleccionada

### 4.2 ConversationList

Muestra la lista de conversaciones disponibles:
- Filtrado por plataforma (WhatsApp, Email, Instagram)
- Búsqueda por texto en remitente, asunto o contenido
- Filtrado por estado (leídos/no leídos)
- Visualización de la fecha/hora del último mensaje
- Indicadores de plataforma y estado

### 4.3 ConversationPanel

Muestra y permite interactuar con una conversación:
- Visualización de mensajes con formato según la plataforma
- Compositor de mensajes para responder
- Indicadores de envío/lectura
- Función de generación de respuestas con IA

## 5. Características Avanzadas

### 5.1 Generación de Respuestas con IA

El sistema incluye un botón para generar automáticamente borradores de respuesta usando IA:
- Utiliza el contexto de la conversación
- Adapta el tono y estilo según la plataforma
- Permite editar el borrador antes de enviar

### 5.2 Estadísticas de Conversaciones

El sistema recopila métricas sobre las conversaciones:
- Tiempo de respuesta
- Tasa de respuesta
- Sentimiento de los mensajes
- Uso de asistencia de IA

## 6. Implementación Técnica

### 6.1 Componentes React

Los componentes están implementados con React y Next.js:
- Uso de hooks para gestión de estado y efectos
- Importación dinámica para evitar problemas de SSR
- Estilizado con Tailwind CSS

### 6.2 Integración con Firebase

La aplicación utiliza Firebase para:
- Autenticación de usuarios
- Almacenamiento de mensajes en Firestore
- Funciones en la nube para procesamiento de mensajes

### 6.3 Conexión con APIs Externas

El sistema se conecta con varias APIs:
- API de WhatsApp Business para mensajes de WhatsApp
- APIs de correo (SMTP/IMAP) para mensajes de correo
- API de Instagram para mensajes directos
- API de clasificación IA para análisis de sentimiento

## 7. Próximos Pasos

Algunas mejoras planificadas para el sistema:
- Soporte para más tipos de adjuntos (documentos, ubicaciones)
- Plantillas de respuesta predefinidas
- Vista de conversación en tiempo real (actualizaciones en vivo)
- Estadísticas avanzadas y reporting
- Integración con sistema de tickets
- Soporte para más plataformas (Twitter, Facebook Messenger, Telegram) 