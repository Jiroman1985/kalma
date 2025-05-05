const crypto = require('crypto');

exports.handler = async function(event, context) {
  console.log('Instagram webhook recibido');
  
  // Verificación del webhook cuando Instagram lo solicita mediante GET
  if (event.httpMethod === 'GET') {
    const mode = event.queryStringParameters['hub.mode'];
    const token = event.queryStringParameters['hub.verify_token'];
    const challenge = event.queryStringParameters['hub.challenge'];
    
    const VERIFY_TOKEN = process.env.INSTAGRAM_VERIFY_TOKEN || 'kalma-instagram-webhook-verify-token';
    
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('Webhook verificado exitosamente');
      return {
        statusCode: 200,
        body: challenge
      };
    } else {
      console.log('Verificación de webhook fallida');
      return {
        statusCode: 403,
        body: 'Verificación fallida'
      };
    }
  }
  
  // Procesamiento de eventos del webhook mediante POST
  if (event.httpMethod === 'POST') {
    try {
      // Verificar la firma X-Hub-Signature para validar autenticidad
      const signature = event.headers['x-hub-signature'];
      const CLIENT_SECRET = process.env.INSTAGRAM_CLIENT_SECRET || '5ed60bb513324c22a3ec1db6faf9e92f';
      
      if (signature) {
        const [signatureType, signatureHash] = signature.split('=');
        
        if (signatureType === 'sha1') {
          const computedHash = crypto
            .createHmac('sha1', CLIENT_SECRET)
            .update(event.body)
            .digest('hex');
          
          if (computedHash !== signatureHash) {
            console.log('Firma no válida, posible solicitud fraudulenta');
            return {
              statusCode: 401,
              body: JSON.stringify({ error: 'Firma inválida' })
            };
          }
        }
      }
      
      // Procesar la carga útil del webhook
      const payload = JSON.parse(event.body);
      console.log('Payload de webhook recibido:', JSON.stringify(payload));
      
      // Aquí procesaríamos los diferentes tipos de eventos
      // Por ejemplo, actualizaciones de comentarios, mensajes, reacciones, etc.
      
      // Por cada entrada (entry) en el webhook...
      if (payload.entry && Array.isArray(payload.entry)) {
        for (const entry of payload.entry) {
          // Capturar timestamp de la entrada
          const entryTime = entry.time;
          
          // Procesar los cambios
          if (entry.changes && Array.isArray(entry.changes)) {
            for (const change of entry.changes) {
              // Verificar el tipo de cambio
              const field = change.field; // Por ejemplo, 'comments', 'messages', etc.
              const value = change.value;
              
              console.log(`Recibido cambio de tipo: ${field}`);
              
              // Implementar lógica específica basada en el tipo de cambio
              switch (field) {
                case 'comments':
                  // Procesar nuevos comentarios
                  console.log('Nuevo comentario:', value.text);
                  // TODO: Guardar en base de datos, enviar notificación, etc.
                  break;
                
                case 'mentions':
                  console.log('Nueva mención:', value.text);
                  // TODO: Procesar menciones
                  break;
                
                case 'messages':
                  console.log('Nuevo mensaje:', value.message);
                  // TODO: Procesar mensajes
                  break;
                
                default:
                  console.log(`Tipo de evento no manejado: ${field}`);
              }
            }
          }
        }
      }
      
      // Instagram espera una respuesta 200 OK para confirmar la recepción
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true })
      };
    } catch (error) {
      console.error('Error procesando webhook:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Error interno', details: error.message })
      };
    }
  }
  
  // Para métodos no soportados
  return {
    statusCode: 405,
    body: JSON.stringify({ error: 'Método no permitido' })
  };
}; 