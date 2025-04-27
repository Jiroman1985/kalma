# Integración con n8n para WhatsPyme - Redes Sociales

Este documento detalla cómo implementar la integración entre WhatsPyme y n8n para recibir eventos en tiempo real de redes sociales.

## Arquitectura propuesta

```
[Redes Sociales] → [Webhooks] → [n8n] → [Firestore] → [Frontend React]
```

## Requisitos previos

1. Instalación de n8n (se recomienda la versión self-hosted)
2. Proyecto Firebase con Firestore configurado
3. Cuentas de desarrollador en las plataformas sociales a integrar

## Flujo de autenticación OAuth

### 1. Proceso de autenticación

1. El usuario inicia el proceso de conexión de una red social en WhatsPyme
2. La aplicación redirige al usuario a la página de autenticación de la plataforma
3. Después de autorizar, la plataforma redirige al backend de WhatsPyme con un código temporal
4. El backend intercambia el código por tokens de acceso y refresco
5. Los tokens se almacenan de forma segura en Firestore

### 2. Estructura en Firestore para tokens

```
/users/{userId}/socialTokens/{platform}
```

Cada documento contendrá:
- `accessToken`: Token de acceso para la API
- `refreshToken`: Token para renovar el acceso
- `tokenExpiry`: Fecha de expiración del token
- `scope`: Alcance de los permisos
- `lastSynced`: Última vez que se sincronizaron datos

## Configuración en n8n

### 1. Flujo de trabajo para recepción de webhooks

1. **Nodos de Webhook**: Configurar un nodo webhook para cada plataforma
   - Configurar ruta con formato: `/webhook/{userId}/{platform}`
   - Método: POST
   - Autenticación: Header con secreto compartido

2. **Nodos de procesamiento**: Para cada plataforma
   - Extraer datos relevantes del webhook
   - Normalizar a formato común

3. **Nodo Firestore**: Para almacenar mensajes
   - Escribir en la colección `/users/{userId}/messages`
   - Añadir metadatos y marcas de tiempo

### 2. Flujo de trabajo para respuestas

1. **Nodo HTTP Request**: Para obtener tokens de Firestore
   - Solicitar a función Cloud Function tokens actuales
   - La función maneja refrescar tokens si han expirado

2. **Nodos de plataforma**: Para enviar respuestas
   - Utilizar los tokens para autenticar solicitudes a APIs
   - Enviar respuestas a comentarios/mensajes

## Instrucciones paso a paso

### 1. Configuración de n8n

#### 1.1. Crear flujo para recepción de webhooks de Instagram

```
[Webhook] → [Function] → [IF] → [HTTP Request] → [Firestore]
```

1. Configurar **Webhook**:
   - Método: POST
   - Ruta: `/webhook/instagram/:userId`
   - Autenticación: Basic

2. Configurar **Function**:
   ```javascript
   // Normalizar datos de Instagram
   return {
     json: {
       platform: "instagram",
       externalId: $input.item.entry[0].id,
       contactId: $input.item.entry[0].messaging[0].sender.id,
       content: $input.item.entry[0].messaging[0].message.text,
       timestamp: new Date().toISOString(),
       direction: "incoming",
       status: "unread",
       userId: $input.params.userId
     }
   }
   ```

3. Configurar **IF**:
   - Condición: `{{$json.content !== undefined}}`

4. Configurar **HTTP Request** para verificar suscripción:
   - Solo necesario para validación inicial de webhook

5. Configurar **Firestore**:
   - Operación: Create Document
   - Colección: `users/{{$json.userId}}/messages`
   - Documento: Autogenerar
   - Datos: `{{$json}}`

#### 1.2. Crear flujo similar para Gmail

```
[Webhook] → [Gmail Trigger] → [Function] → [Firestore]
```

#### 1.3. Crear flujo similar para Google Reviews

```
[Webhook] → [Google My Business Trigger] → [Function] → [Firestore]
```

### 2. Configuración de Firebase

#### 2.1. Cloud Function para gestión de tokens

```javascript
exports.getSocialToken = functions.https.onCall(async (data, context) => {
  // Verificar autenticación
  if (!context.auth || !context.auth.token.n8n_service) {
    throw new functions.https.HttpsError('unauthenticated', 'Unauthorized');
  }

  const { userId, platform } = data;
  
  // Recuperar token de Firestore
  const tokenDoc = await admin.firestore()
    .collection('users')
    .doc(userId)
    .collection('socialTokens')
    .doc(platform)
    .get();
    
  if (!tokenDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Token not found');
  }
  
  const tokenData = tokenDoc.data();
  
  // Verificar si el token ha expirado
  if (new Date(tokenData.tokenExpiry) < new Date()) {
    // Lógica para refrescar token usando refreshToken
    const newToken = await refreshSocialToken(platform, tokenData.refreshToken);
    
    // Actualizar en Firestore
    await tokenDoc.ref.update({
      accessToken: newToken.accessToken,
      tokenExpiry: newToken.expiry
    });
    
    return { accessToken: newToken.accessToken };
  }
  
  return { accessToken: tokenData.accessToken };
});
```

### 3. Integración en el frontend de WhatsPyme

#### 3.1. Suscripción a actualizaciones en tiempo real

```javascript
useEffect(() => {
  if (!currentUser) return;
  
  // Suscribirse a cambios en la colección de mensajes
  const unsubscribe = onSnapshot(
    query(
      collection(db, "users", currentUser.uid, "messages"),
      orderBy("timestamp", "desc"),
      limit(50)
    ),
    (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(newMessages);
      
      // Notificar al usuario si hay mensajes nuevos
      const unreadCount = newMessages.filter(m => m.status === "unread").length;
      if (unreadCount > 0) {
        // Mostrar notificación
      }
    }
  );
  
  return () => unsubscribe();
}, [currentUser]);
```

## Configuración de Webhooks por Plataforma

### Instagram

1. Crear una aplicación en [Facebook for Developers](https://developers.facebook.com/)
2. Configurar los Productos > Webhooks
3. Añadir URL de callback: `https://n8n.whatspyme.com/webhook/instagram/{userId}`
4. Verificar token: `your_verify_token`
5. Suscribirse a: `messages`, `comments`, `mentions`

### Gmail

1. Configurar [Google Pub/Sub](https://console.cloud.google.com/cloudpubsub)
2. Crear un tema de Pub/Sub
3. Configurar la suscripción push a: `https://n8n.whatspyme.com/webhook/gmail/{userId}`
4. Configurar [Watch](https://developers.google.com/gmail/api/reference/rest/v1/users/watch) en Gmail API

### Google Reviews

1. Utilizar la [API de Google My Business](https://developers.google.com/my-business)
2. Configurar notificaciones push
3. Apuntar a: `https://n8n.whatspyme.com/webhook/googleReviews/{userId}`

## Seguridad

### 1. Protección de webhooks

- Utilizar verificación por token secreto en todas las rutas
- Añadir validación de origen para asegurar que las solicitudes provienen de las plataformas esperadas
- Limitar las tasas de solicitud para prevenir abusos

### 2. Almacenamiento seguro de tokens

- Cifrar tokens antes de almacenarlos en Firestore
- Utilizar [Firebase Security Rules](https://firebase.google.com/docs/firestore/security/get-started) para restringir el acceso

```
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/socialTokens/{platform} {
      allow read, write: if request.auth.uid == userId 
                          || request.auth.token.n8n_service == true;
    }
  }
}
```

## Pruebas y Depuración

### Simulación de webhooks

Para probar la integración sin necesidad de eventos reales:

1. Utilizar [Webhook Tester](https://webhook.site/) para ver la estructura de payloads reales
2. Crear payloads de prueba basados en estructuras reales
3. Enviar a puntos finales n8n usando Postman o curl:

```bash
curl -X POST https://n8n.whatspyme.com/webhook/instagram/USER_ID \
  -H "Content-Type: application/json" \
  -d '{"entry":[{"id":"123","messaging":[{"sender":{"id":"sender_id"},"message":{"text":"Mensaje de prueba"}}]}]}'
```

## Escalado y Mantenimiento

### 1. Monitoreo

- Implementar registro de todas las solicitudes y respuestas
- Configurar alertas para errores frecuentes o fallos de autenticación
- Rastrear tasas de uso para cada usuario y plataforma

### 2. Actualización de tokens

- Implementar proceso automático para refrescar tokens antes de que expiren
- Notificar a usuarios si los tokens no pueden renovarse

## Próximos pasos

1. Implementar la función Cloud Function para gestión de tokens
2. Configurar los flujos de trabajo en n8n
3. Implementar la lógica de OAuth en el frontend y backend
4. Realizar pruebas con datos reales 