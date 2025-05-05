const crypto = require('crypto');
const admin = require('firebase-admin');

// Inicializar Firebase Admin si no está ya inicializado
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}')),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
}

const db = admin.firestore();

exports.handler = async function(event, context) {
  console.log('Instagram webhook function triggered');
  
  // Verificación del webhook cuando Instagram lo solicita mediante GET
  if (event.httpMethod === 'GET') {
    console.log('Recibida solicitud GET para verificación de webhook con parámetros:', event.queryStringParameters);
    
    const mode = event.queryStringParameters['hub.mode'];
    const token = event.queryStringParameters['hub.verify_token'];
    const challenge = event.queryStringParameters['hub.challenge'];
    
    if (!mode || !token || !challenge) {
      console.log('Parámetros de verificación incompletos');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Parámetros de verificación incompletos' })
      };
    }
    
    const VERIFY_TOKEN = process.env.INSTAGRAM_VERIFY_TOKEN || 'kalma-instagram-webhook-verify-token';
    
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('Webhook verificado exitosamente, devolviendo challenge:', challenge);
      return {
        statusCode: 200,
        body: challenge
      };
    } else {
      console.log('Verificación de webhook fallida. Mode:', mode, 'Token recibido:', token, 'Token esperado:', VERIFY_TOKEN);
      return {
        statusCode: 403,
        body: 'Verificación fallida'
      };
    }
  }
  
  // Procesamiento de eventos del webhook mediante POST
  if (event.httpMethod === 'POST') {
    try {
      console.log('Recibido evento webhook POST');
      
      // Verificar la firma X-Hub-Signature para validar autenticidad
      const signature = event.headers['x-hub-signature'];
      const CLIENT_SECRET = process.env.INSTAGRAM_CLIENT_SECRET || '5ed60bb513324c22a3ec1db6faf9e92f';
      
      if (signature) {
        console.log('Verificando firma de webhook:', signature);
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
          console.log('Firma verificada correctamente');
        }
      }
      
      // Procesar la carga útil del webhook
      const payload = JSON.parse(event.body);
      console.log('Payload de webhook recibido:', JSON.stringify(payload));
      
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
                  // Guardar en Firestore
                  try {
                    await db.collection('instagramEvents')
                      .doc(value.id || Date.now().toString())
                      .set({
                        type: 'comment',
                        data: value,
                        createdAt: admin.firestore.FieldValue.serverTimestamp()
                      });
                    console.log('Comentario guardado en Firestore');
                  } catch (dbError) {
                    console.error('Error al guardar comentario:', dbError);
                  }
                  break;
                
                case 'mentions':
                  console.log('Nueva mención:', value.text);
                  // Guardar en Firestore
                  try {
                    await db.collection('instagramEvents')
                      .doc(value.id || Date.now().toString())
                      .set({
                        type: 'mention',
                        data: value,
                        createdAt: admin.firestore.FieldValue.serverTimestamp()
                      });
                    console.log('Mención guardada en Firestore');
                  } catch (dbError) {
                    console.error('Error al guardar mención:', dbError);
                  }
                  break;
                
                case 'messages':
                  console.log('Nuevo mensaje:', value.message);
                  // Guardar en Firestore
                  try {
                    await db.collection('instagramEvents')
                      .doc(value.id || Date.now().toString())
                      .set({
                        type: 'message',
                        data: value,
                        createdAt: admin.firestore.FieldValue.serverTimestamp()
                      });
                    console.log('Mensaje guardado en Firestore');
                  } catch (dbError) {
                    console.error('Error al guardar mensaje:', dbError);
                  }
                  break;
                
                default:
                  console.log(`Tipo de evento no manejado: ${field}`);
                  // Guardar como evento genérico
                  try {
                    await db.collection('instagramEvents')
                      .doc(Date.now().toString())
                      .set({
                        type: field,
                        data: value,
                        createdAt: admin.firestore.FieldValue.serverTimestamp()
                      });
                    console.log('Evento genérico guardado en Firestore');
                  } catch (dbError) {
                    console.error('Error al guardar evento genérico:', dbError);
                  }
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