# Gestión de Conversaciones en Kalma

## Descripción General
El módulo de Conversaciones en Kalma permite a los usuarios gestionar y visualizar mensajes de diferentes canales de comunicación (WhatsApp y correo electrónico) en una interfaz unificada. Esta funcionalidad facilita la comunicación con clientes y seguidores desde una única plataforma.

## Características Principales

### Visualización Unificada
- Interfaz centralizada para ver mensajes de WhatsApp y correos electrónicos
- Filtrado por tipo de canal (WhatsApp/Email)
- Vista cronológica de conversaciones

### Funcionalidad de WhatsApp
- Conexión con la API de WhatsApp Business
- Recepción y envío de mensajes
- Visualización de historial de conversaciones
- Gestión de estados de mensajes (leído/no leído)

### Funcionalidad de Email
- Integración con cuentas de Gmail
- Visualización de hilos de conversación completos
- Acceso a asunto y contenido del correo
- Capacidad de respuesta directa

## Estructura de Datos

### Mensaje Unificado (`SocialMediaMessage`)
```typescript
interface SocialMediaMessage {
  id: string;
  channel: "whatsapp" | "instagram" | "email";
  timestamp: number;
  text: string;
  from: string;
  to: string;
  isIncoming: boolean;
  threadId?: string;  // Para hilos de correo electrónico
  subject?: string;   // Para asuntos de correo electrónico
}
```

### Conversación
```typescript
interface Conversation {
  id: string;
  channel: "whatsapp" | "instagram" | "email";
  contactName: string;
  contactId: string;
  lastMessage: string;
  lastTimestamp: number;
  unreadCount: number;
}
```

## Flujo de Trabajo

1. **Carga inicial**: Al acceder a la sección de Conversaciones, se cargan las conversaciones de WhatsApp y correo electrónico.
2. **Selección de conversación**: El usuario selecciona una conversación específica.
3. **Carga de mensajes**: Se cargan todos los mensajes asociados a esa conversación.
4. **Interacción**: El usuario puede leer y responder a los mensajes desde la interfaz.

## Integración con Firebase

Los mensajes y conversaciones se almacenan en Firestore siguiendo esta estructura:

- **WhatsApp**: `users/{userId}/whatsappMessages/{messageId}`
- **Email**: `users/{userId}/emailMessages/{messageId}`

## Servicios Relacionados

### WhatsApp Service
Maneja la conexión con la API de WhatsApp Business y gestiona el envío/recepción de mensajes.

### Email Service
Gestiona la autenticación con Gmail y el procesamiento de correos electrónicos.

## Consideraciones Técnicas

- La autenticación con Gmail requiere permisos específicos para acceder al contenido de los correos.
- La integración con WhatsApp depende de la configuración correcta de webhooks para recibir mensajes en tiempo real.
- Se recomienda implementar un sistema de notificaciones para alertar sobre nuevos mensajes.

## Futuras Mejoras

- Integración con más plataformas de mensajería (Telegram, Facebook Messenger)
- Sistema de etiquetas para categorizar conversaciones
- Implementación de respuestas automáticas y chatbots
- Análisis de sentimiento para mensajes entrantes 