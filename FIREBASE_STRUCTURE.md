# Estructura de la Base de Datos Firebase para WhatsApp Analytics

Este documento describe la estructura de la base de datos Firebase utilizada para almacenar y gestionar los datos de WhatsApp en la aplicación.

## Colecciones y Documentos

### Usuarios
**Base Path**: `/users/{userId}`

Datos de usuario:
- `email`: Correo electrónico del usuario
- `displayName`: Nombre completo
- `photoURL`: URL de imagen de perfil
- `phoneNumber`: Número de teléfono
- `createdAt`: Fecha de creación de la cuenta
- `lastLogin`: Último inicio de sesión

### WhatsApp
**Base Path**: `/users/{userId}/whatsapp`

Datos de análisis de WhatsApp:
- `totalMessages`: Número total de mensajes
- `lastMessageTimestamp`: Marca de tiempo del último mensaje
- `messagesPerDay`: Objeto con conteo de mensajes por día (formato: `{"YYYY-MM-DD": count}`)
- `activeChats`: Número de conversaciones activas
- `firstMessageTimestamp`: Marca de tiempo del primer mensaje
- `lastUpdated`: Última actualización de los datos
- `respondedMessages`: Total de mensajes respondidos
- `unrespondedMessages`: Total de mensajes sin responder
- `avgResponseTime`: Tiempo promedio de respuesta (en milisegundos)
- `agentResponses`: Número de respuestas por IA
- `humanResponses`: Número de respuestas por humanos
- `messageCategories`: Objeto con distribución por categoría
  - `consultas`: Número de consultas
  - `ventas`: Número de ventas
  - `soporte`: Número de soportes
  - `otros`: Otros tipos
- `messagesByHour`: Objeto con distribución por hora (formato: `{"0": count, "1": count, ..., "23": count}`)
- `activeByWeekday`: Actividad por día de la semana (formato: `{"0": count, "1": count, ..., "6": count}`)

### Mensajes de WhatsApp
**Base Path**: `/users/{userId}/whatsapp/messages/{messageId}`

Datos de mensaje individual:
- `id`: Identificador del mensaje
- `messageId`: ID del mensaje de WhatsApp
- `body`: Contenido del mensaje
- `from`: Número del remitente
- `to`: Número del destinatario
- `timestamp`: Marca de tiempo
- `isFromMe`: Si fue enviado por el usuario
- `senderName`: Nombre del remitente
- `messageType`: Tipo de mensaje (texto, imagen, etc.)
- `storedAt`: Cuando fue almacenado
- `category`: Categoría (consulta, venta, soporte, otro)
- `responded`: Si ha sido respondido
- `responseId`: ID del mensaje de respuesta
- `responseTime`: Tiempo que tardó en responderse
- `hourOfDay`: Hora del día (0-23)

### Mensajes sin asignar
**Base Path**: `/unassigned_messages/{messageId}`

Mensajes que no pudieron ser asignados a un usuario:
- Misma estructura que Mensajes de WhatsApp
- Campo adicional `processedAt`: Marca de tiempo cuando fue procesado

## Configuración en n8n

Para que n8n inserte correctamente los datos en Firebase, debe seguir los siguientes pasos:

1. **Autenticación**: Configurar un nodo de Firebase Admin con credenciales de servicio

2. **Procesamiento de Mensajes**:
   - Extraer el número de teléfono del remitente (`from`)
   - Buscar el usuario correspondiente mediante una consulta a `/users` con `where("phoneNumber", "==", cleanPhoneNumber)`

3. **Guardado de Mensajes**:
   - Si se encuentra un usuario: Guardar en `/users/{userId}/whatsapp/messages/{auto-id}`
   - Si no se encuentra: Guardar en `/unassigned_messages/{auto-id}`

4. **Actualización de Analíticas**:
   - Actualizar el documento `/users/{userId}/whatsapp`:
     - Incrementar `totalMessages`
     - Actualizar `lastMessageTimestamp`
     - Incrementar contador en `messagesPerDay` para la fecha actual
     - Actualizar otros campos relevantes

5. **Procesamiento de Mensajes Sin Asignar**:
   - Implementar un proceso periódico para revisar `/unassigned_messages`
   - Intentar encontrar usuarios correspondientes
   - Mover mensajes a las ubicaciones correctas si se encuentran coincidencias

## Seguridad

Se deben implementar reglas de seguridad de Firestore para:

1. Permitir que los usuarios solo accedan a sus propios datos
2. Permitir que n8n escriba en las rutas especificadas
3. Restringir el acceso público a los mensajes

## Mejores Prácticas

1. **Indexación**: Crear índices para consultas frecuentes (por timestamp, etc.)
2. **Control de Datos**: Limitar cantidad de mensajes por usuario para evitar costos excesivos
3. **Copias de Seguridad**: Programar copias de seguridad periódicas
4. **Monitoreo**: Implementar alertas para detectar problemas de inserción

---

Última actualización: Junio 2024 