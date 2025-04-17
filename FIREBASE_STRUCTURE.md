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
  id: string,           // ID del mensaje (proporcionado por WhatsApp)
  messageId: string,    // ID único del mensaje (puede ser igual que id)
  body: string,         // Contenido del mensaje
  from: string,         // Número del remitente (formato: 34XXXXXXXXX, sin @c.us)
  to: string,           // Número del destinatario
  timestamp: number,    // Marca de tiempo en segundos o milisegundos
  isFromMe: boolean,    // Si el mensaje fue enviado por el usuario o recibido
  senderName: string,   // Nombre del remitente si está disponible
  messageType: string,  // Tipo de mensaje (texto, imagen, audio, etc.)
  storedAt: timestamp   // Marca de tiempo de cuándo se guardó
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
  lastUpdated: timestamp                // Timestamp de la última actualización
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

2. **Procesamiento de mensajes**:
   - Extrae el número de teléfono del remitente (from) del mensaje.
   - Busca en Firebase si existe un usuario con ese número de teléfono:
     ```javascript
     // Query para buscar el usuario
     const usersRef = admin.firestore().collection('users');
     const snapshot = await usersRef.where('phoneNumber', '==', cleanPhoneNumber).get();
     
     if (!snapshot.empty) {
       // Usuario encontrado, obtener ID
       const userId = snapshot.docs[0].id;
       // ...
     }
     ```

3. **Guardado del mensaje**:
   - Si el usuario existe:
     ```javascript
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
         storedAt: admin.firestore.FieldValue.serverTimestamp()
       });
     ```

4. **Actualización de analíticas**:
   - Actualizar el documento de analíticas:
     ```javascript
     const analyticsRef = admin.firestore().doc(`users/${userId}/analytics/whatsapp`);
     const analyticsDoc = await analyticsRef.get();
     
     if (analyticsDoc.exists) {
       const data = analyticsDoc.data();
       const today = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
       const messagesPerDay = data.messagesPerDay || {};
       messagesPerDay[today] = (messagesPerDay[today] || 0) + 1;
       
       await analyticsRef.update({
         totalMessages: admin.firestore.FieldValue.increment(1),
         lastMessageTimestamp: message.timestamp,
         messagesPerDay: messagesPerDay,
         lastUpdated: admin.firestore.FieldValue.serverTimestamp()
       });
     } else {
       // Inicializar documento de analíticas si no existe
       const today = new Date().toISOString().split('T')[0];
       const messagesPerDay = {};
       messagesPerDay[today] = 1;
       
       await analyticsRef.set({
         totalMessages: 1,
         lastMessageTimestamp: message.timestamp,
         messagesPerDay: messagesPerDay,
         activeChats: 1,
         firstMessageTimestamp: admin.firestore.FieldValue.serverTimestamp(),
         lastUpdated: admin.firestore.FieldValue.serverTimestamp()
       });
     }
     ```

5. **Mensajes sin asignar**:
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

2. **Límites**:
   - Controla el volumen de datos para evitar costos excesivos.
   - Implementa TTL (time-to-live) para mensajes antiguos si es necesario.

3. **Respaldos**:
   - Configura respaldos periódicos para evitar pérdida de datos.

4. **Monitoreo**:
   - Monitorea errores y latencia en las operaciones de escritura. 