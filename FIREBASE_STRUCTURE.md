# Estructura de Firebase para WhatsApp Analytics

Este documento describe la estructura de datos en Firebase para almacenar y analizar los mensajes de WhatsApp que se insertan directamente desde n8n.

## Colecciones y Documentos

### 1. Usuarios

Base path: `/users/{userId}`

- Cada usuario autenticado tiene un documento principal con su información básica.
- El `userId` es el identificador único generado por Firebase Authentication.

Campos del documento:
```
{
  email: string,
  displayName: string,
  photoURL: string,
  phoneNumber: string,     // Número de teléfono vinculado a WhatsApp
  createdAt: timestamp,
  lastLogin: timestamp,
  // otros campos según la aplicación
}
```

### 2. Mensajes de WhatsApp

Base path: `/users/{userId}/whatsapp/messages/{messageId}`

- Cada mensaje de WhatsApp se almacena como un documento individual.
- El `messageId` normalmente es auto-generado por Firestore.

Campos del documento:
```
{
  id: string,                  // ID del mensaje (proporcionado por WhatsApp)
  messageId: string,           // ID único del mensaje (puede ser igual que id)
  body: string,                // Contenido del mensaje
  from: string,                // Número del remitente (formato: 34XXXXXXXXX, sin @c.us)
  to: string,                  // Número del destinatario
  timestamp: number,           // Marca de tiempo en segundos o milisegundos
  isFromMe: boolean,           // Si el mensaje fue enviado por el usuario o recibido
  senderName: string,          // Nombre del remitente si está disponible
  messageType: string,         // Tipo de mensaje (texto, imagen, audio, etc.)
  storedAt: timestamp,         // Marca de tiempo de cuándo se guardó
  // Campos adicionales para respuestas y categorización
  category: string,            // Categoría del mensaje (consulta, venta, soporte, otro)
  responded: boolean,          // Si el mensaje ha sido respondido
  responseId: string,          // ID del mensaje de respuesta (si existe)
  responseTimestamp: number,   // Cuándo fue respondido
  agentResponse: boolean,      // Si fue respondido por el agente IA o un humano
  responseTime: number,        // Tiempo que tardó en ser respondido (ms)
  hourOfDay: number            // Hora del día en que se recibió (0-23)
}
```

### 3. Analíticas de WhatsApp

Base path: `/users/{userId}/analytics/whatsapp`

- Un único documento que almacena las métricas agregadas de las conversaciones de WhatsApp.

Campos del documento:
```
{
  totalMessages: number,                // Total de mensajes
  lastMessageTimestamp: number,         // Timestamp del último mensaje
  activeChats: number,                  // Número de conversaciones activas
  messagesPerDay: {                     // Mensajes por día
    "YYYY-MM-DD": number,
    ...
  },
  firstMessageTimestamp: timestamp,     // Timestamp del primer mensaje
  lastUpdated: timestamp,               // Timestamp de la última actualización
  // Campos adicionales para analíticas extendidas
  respondedMessages: number,            // Total de mensajes respondidos
  unrespondedMessages: number,          // Total de mensajes sin responder
  avgResponseTime: number,              // Tiempo promedio de respuesta (ms)
  agentResponses: number,               // Número de respuestas por la IA
  humanResponses: number,               // Número de respuestas humanas
  messageCategories: {                  // Distribución por categoría
    consultas: number,
    ventas: number,
    soporte: number,
    otros: number
  },
  messagesByHour: {                     // Distribución por hora del día
    "0": number,                        // 12 AM (medianoche)
    "1": number,
    ...
    "23": number                        // 11 PM
  },
  activeByWeekday: {                    // Actividad por día de la semana
    "0": number,                        // Domingo
    "1": number,                        // Lunes
    ...
    "6": number                         // Sábado
  }
}
```

### 4. Mensajes sin asignar

Base path: `/unassigned_messages/{messageId}`

- Mensajes que no se pudieron vincular a ningún usuario (porque no se encontró un usuario con ese número de teléfono).

Campos del documento: Igual que los mensajes normales.

## Configuración en n8n

Para insertar datos correctamente desde n8n a Firebase:

1. **Configuración de autenticación**:
   - Usa un Token de Servicio de Firebase Admin en n8n para autenticar las operaciones.
   - Configura un Webhook en n8n para recibir los datos de WhatsApp.

2. **Procesamiento de mensajes entrantes**:
   - Extrae el número de teléfono del remitente (from) del mensaje.
   - Busca en Firebase si existe un usuario con ese número de teléfono.
   - Analiza y clasifica el contenido del mensaje para determinar su categoría.
   - Registra la hora del día en que se recibió el mensaje.

3. **Guardado del mensaje entrante**:
   - Si el usuario existe:
     ```javascript
     // Determinar categoría según el contenido del mensaje
     let category = 'otros';
     if (message.body.match(/\b(precio|cuánto cuesta|comprar|adquirir)\b/i)) {
       category = 'ventas';
     } else if (message.body.match(/\b(ayuda|problema|error|no funciona)\b/i)) {
       category = 'soporte';
     } else if (message.body.match(/\b(información|pregunta|cómo|dónde|cuándo)\b/i)) {
       category = 'consultas';
     }
     
     // Extraer hora del día
     const hourOfDay = new Date(message.timestamp * 1000).getHours();
     
     // Guardar el mensaje
     await admin.firestore()
       .collection(`users/${userId}/whatsapp/messages`)
       .add({
         id: message.id,
         messageId: message.id.split('_').pop(),
         body: message.body,
         from: message.from.replace('@c.us', ''),
         to: message.to.replace('@c.us', ''),
         timestamp: message.timestamp,
         isFromMe: message.fromMe,
         senderName: message.notifyName || message.sender?.pushname || '',
         messageType: message.type || 'chat',
         storedAt: admin.firestore.FieldValue.serverTimestamp(),
         category: category,
         responded: false,
         responseId: null,
         responseTimestamp: null,
         agentResponse: false,
         responseTime: null,
         hourOfDay: hourOfDay
       });
     ```

4. **Actualización de analíticas para mensajes entrantes**:
   - Actualizar el documento de analíticas:
     ```javascript
     const analyticsRef = admin.firestore().doc(`users/${userId}/analytics/whatsapp`);
     const analyticsDoc = await analyticsRef.get();
     
     if (analyticsDoc.exists) {
       const data = analyticsDoc.data();
       const today = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
       const messagesPerDay = data.messagesPerDay || {};
       messagesPerDay[today] = (messagesPerDay[today] || 0) + 1;
       
       // Actualizar distribución por categoría
       const messageCategories = data.messageCategories || { consultas: 0, ventas: 0, soporte: 0, otros: 0 };
       messageCategories[category] = (messageCategories[category] || 0) + 1;
       
       // Actualizar distribución por hora
       const messagesByHour = data.messagesByHour || {};
       messagesByHour[hourOfDay.toString()] = (messagesByHour[hourOfDay.toString()] || 0) + 1;
       
       // Actualizar actividad por día de la semana
       const dayOfWeek = new Date(message.timestamp * 1000).getDay().toString();
       const activeByWeekday = data.activeByWeekday || { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
       activeByWeekday[dayOfWeek] = (activeByWeekday[dayOfWeek] || 0) + 1;
       
       await analyticsRef.update({
         totalMessages: admin.firestore.FieldValue.increment(1),
         lastMessageTimestamp: message.timestamp,
         messagesPerDay: messagesPerDay,
         unrespondedMessages: admin.firestore.FieldValue.increment(1),
         messageCategories: messageCategories,
         messagesByHour: messagesByHour,
         activeByWeekday: activeByWeekday,
         lastUpdated: admin.firestore.FieldValue.serverTimestamp()
       });
     } else {
       // Inicializar documento de analíticas si no existe
       const today = new Date().toISOString().split('T')[0];
       const messagesPerDay = {};
       messagesPerDay[today] = 1;
       
       // Inicializar categorías
       const messageCategories = { consultas: 0, ventas: 0, soporte: 0, otros: 0 };
       messageCategories[category] = 1;
       
       // Inicializar horas
       const messagesByHour = {};
       messagesByHour[hourOfDay.toString()] = 1;
       
       // Inicializar días de la semana
       const dayOfWeek = new Date(message.timestamp * 1000).getDay().toString();
       const activeByWeekday = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
       activeByWeekday[dayOfWeek] = 1;
       
       await analyticsRef.set({
         totalMessages: 1,
         lastMessageTimestamp: message.timestamp,
         messagesPerDay: messagesPerDay,
         activeChats: 1,
         firstMessageTimestamp: admin.firestore.FieldValue.serverTimestamp(),
         lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
         respondedMessages: 0,
         unrespondedMessages: 1,
         avgResponseTime: 0,
         agentResponses: 0,
         humanResponses: 0,
         messageCategories: messageCategories,
         messagesByHour: messagesByHour,
         activeByWeekday: activeByWeekday
       });
     }
     ```

5. **Procesamiento y registro de respuestas del agente IA**:
   - Cuando el agente IA responde a un mensaje:
     ```javascript
     // Registrar la respuesta del agente
     const responseId = `resp_${Date.now()}`;
     const responseTimestamp = Date.now();
     const responseTime = responseTimestamp - originalMessage.timestamp;
     
     // Guardar la respuesta como un nuevo mensaje
     await admin.firestore()
       .collection(`users/${userId}/whatsapp/messages`)
       .add({
         id: responseId,
         messageId: responseId,
         originalMessageId: originalMessage.id, // Mensaje al que responde
         body: responseText,
         from: agentNumber,
         to: originalMessage.from,
         timestamp: responseTimestamp,
         isFromMe: true,
         senderName: "AI Agent",
         messageType: "response",
         storedAt: admin.firestore.FieldValue.serverTimestamp(),
         category: originalMessage.category,
         responded: true,
         responseId: null,  // Las respuestas no tienen respuestas
         responseTimestamp: null,
         agentResponse: true,
         hourOfDay: new Date(responseTimestamp).getHours()
       });
     
     // Actualizar el mensaje original para marcar como respondido
     await admin.firestore()
       .doc(`users/${userId}/whatsapp/messages/${originalMessage.id}`)
       .update({
         responded: true,
         responseId: responseId,
         responseTimestamp: responseTimestamp,
         agentResponse: true,
         responseTime: responseTime
       });
     
     // Actualizar analytics
     const analyticsRef = admin.firestore().doc(`users/${userId}/analytics/whatsapp`);
     const analyticsDoc = await analyticsRef.get();
     
     if (analyticsDoc.exists()) {
       const data = analyticsDoc.data();
       
       // Calcular nuevo tiempo promedio de respuesta
       const totalResponseTime = data.avgResponseTime * data.respondedMessages + responseTime;
       const newRespondedMessages = data.respondedMessages + 1;
       const newAvgResponseTime = totalResponseTime / newRespondedMessages;
       
       await analyticsRef.update({
         respondedMessages: admin.firestore.FieldValue.increment(1),
         unrespondedMessages: admin.firestore.FieldValue.increment(-1),
         avgResponseTime: newAvgResponseTime,
         agentResponses: admin.firestore.FieldValue.increment(1),
         lastUpdated: admin.firestore.FieldValue.serverTimestamp()
       });
     }
     ```

6. **Mensajes sin asignar**:
   - Si no encuentra un usuario con ese número:
     ```javascript
     await admin.firestore()
       .collection('unassigned_messages')
       .add({
         // Mismos campos que arriba
         // ...
       });
     ```

## Seguridad

Las reglas de seguridad de Firestore están configuradas para:

1. Permitir a los usuarios leer/escribir solo en sus propios datos.
2. Permitir a n8n (autenticado con token de servicio) escribir en las colecciones de mensajes y analíticas.
3. Restringir el acceso a mensajes no asignados solo a administradores.

## Mejores prácticas

1. **Índices**:
   - Crea índices para `timestamp` en la colección de mensajes para queries eficientes.
   - Crea índices para `phoneNumber` en la colección de usuarios.
   - Crea índices para `category`, `hourOfDay` y `responded` para análisis rápido.

2. **Límites**:
   - Controla el volumen de datos para evitar costos excesivos.
   - Implementa TTL (time-to-live) para mensajes antiguos si es necesario.

3. **Respaldos**:
   - Configura respaldos periódicos para evitar pérdida de datos.

4. **Monitoreo**:
   - Monitorea errores y latencia en las operaciones de escritura.
   - Establece alertas para volúmenes inusuales de mensajes o fallos en las respuestas. 