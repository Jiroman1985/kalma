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

Documento que contiene los datos del mensaje de WhatsApp directamente:
- `messageId`: ID del mensaje de WhatsApp
- `body`: Contenido del mensaje
- `from`: Nombre del remitente
- `to`: Número del destinatario
- `timestamp`: Marca de tiempo (en milisegundos)
- `isFromMe`: Si fue enviado por el usuario
- `senderName`: Nombre del remitente
- `messageType`: Tipo de mensaje (texto, imagen, etc.)
- `category`: Categoría (consulta, venta, soporte, otro)
- `responded`: Si ha sido respondido
- `responseId`: ID del mensaje de respuesta
- `responseTimestamp`: Cuando fue respondido
- `agentResponse`: Si fue respondido por un agente
- `responseTime`: Tiempo que tardó en responderse
- `minutesOfDay`: Minuto del día (0-59)
- `hourOfDay`: Hora del día (0-23)
- `day`: Día del mes
- `month`: Mes del año (1-12)

### Mensajes sin asignar
**Base Path**: `/unassigned_messages/{messageId}`

Mensajes que no pudieron ser asignados a un usuario:
- Misma estructura que el documento WhatsApp
- Campo adicional `processedAt`: Marca de tiempo cuando fue procesado

## Configuración en n8n

Para que n8n inserte correctamente los datos en Firebase, debe seguir los siguientes pasos:

1. **Autenticación**: Configurar un nodo de Firebase Admin con credenciales de servicio

2. **Procesamiento de Mensajes**:
   - Extraer el número de teléfono del remitente (`from`)
   - Buscar el usuario correspondiente mediante una consulta a `/users` con `where("phoneNumber", "==", cleanPhoneNumber)`

3. **Guardado de Mensajes**:
   - Si se encuentra un usuario: Guardar en `/users/{userId}/whatsapp` directamente
   - Si no se encuentra: Guardar en `/unassigned_messages/{auto-id}`

4. **Ejemplo de estructura JSON para inserción**:
   ```json
   {
     "fields": {
       "messageId": {
         "stringValue": "ID_DEL_MENSAJE"
       },
       "body": {
         "stringValue": "TEXTO_DEL_MENSAJE"
       },
       "from": {
         "stringValue": "NOMBRE_REMITENTE"
       },
       "to": {
         "stringValue": "NUMERO_DESTINATARIO"
       },
       "timestamp": {
         "integerValue": 1654321098765
       },
       "isFromMe": {
         "booleanValue": false
       },
       "senderName": {
         "stringValue": "NOMBRE_NOTIFICACIÓN"
       },
       "messageType": {
         "stringValue": "chat"
       },
       "category": {
         "stringValue": "CATEGORÍA_MENSAJE"
       },
       "responded": {
         "booleanValue": false
       },
       "responseId": {
         "nullValue": null
       },
       "responseTimestamp": {
         "nullValue": null
       },
       "agentResponse": {
         "booleanValue": false
       },
       "responseTime": {
         "nullValue": null
       },
       "minutesOfDay": {
         "integerValue": 30
       },
       "hourOfDay": {
         "integerValue": 15
       },
       "day": {
         "integerValue": 10
       },
       "month": {
         "integerValue": 6
       }
     }
   }
   ```

## Visualización en Aplicación

Los datos almacenados en el documento `whatsapp` se utilizan para mostrar:

1. **Resumen General**:
   - Total de mensajes 
   - Conversaciones activas
   - Promedio de mensajes diarios

2. **Gráficos de Análisis**:
   - Distribución por día de la semana (basado en `day` y `month`)
   - Categorías de conversaciones (basado en `category`)
   - Distribución horaria (basado en `hourOfDay`)

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