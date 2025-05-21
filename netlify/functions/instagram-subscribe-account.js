const fetch = require('node-fetch');
const crypto = require('crypto');

/**
 * Esta función está diseñada exclusivamente para suscribir una cuenta de Instagram 
 * específica a los webhooks de Instagram después de la autenticación.
 */
exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método no permitido, usa POST' })
    };
  }

  console.log('Función de suscripción de cuenta Instagram invocada');
  
  try {
    const payload = JSON.parse(event.body);
    const { accessToken, instagramUserId, userId } = payload;
    
    if (!accessToken || !instagramUserId || !userId) {
      console.error('Faltan parámetros obligatorios');
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Faltan parámetros requeridos', 
          requiredParams: ['accessToken', 'instagramUserId', 'userId']
        })
      };
    }
    
    console.log('Suscribiendo cuenta de Instagram a los webhooks');
    console.log('Instagram User ID:', instagramUserId);
    console.log('User ID:', userId);
    
    // URL del webhook de n8n para este usuario
    const webhookUrl = process.env.N8N_WEBHOOK_URL || 'https://n8n.my.com/webhook/instagram';
    const completeWebhookUrl = `${webhookUrl}/${userId}`;
    
    console.log('URL del webhook:', completeWebhookUrl);
    
    // Secreto compartido para validar webhooks
    const webhookSecret = process.env.INSTAGRAM_WEBHOOK_SECRET || 'shared-webhook-secret';
    
    // 1. Primero, verificar si la app está registrada para webhooks en general
    // Esto es un prerequisito para suscribir cuentas individuales
    
    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    const appAccessToken = `${appId}|${appSecret}`;
    
    // Verificar suscripción de la app al webhook para Instagram
    const getAppSubscriptionsParams = new URLSearchParams();
    getAppSubscriptionsParams.append('access_token', appAccessToken);
    
    const appSubscriptionsResponse = await fetch(
      `https://graph.facebook.com/v18.0/${appId}/subscriptions`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );
    
    const appSubscriptions = await appSubscriptionsResponse.json();
    console.log('Suscripciones actuales de la app:', appSubscriptions);
    
    // Verificar si ya existe una suscripción para Instagram
    let instagramSubscriptionExists = false;
    if (appSubscriptions.data) {
      instagramSubscriptionExists = appSubscriptions.data.some(
        sub => sub.object === 'instagram' && sub.callback_url.includes(webhookUrl)
      );
    }
    
    // Si no existe, crear la suscripción de la app a Instagram
    if (!instagramSubscriptionExists) {
      console.log('Creando suscripción de la app a Instagram');
      
      const subscribeParams = new URLSearchParams();
      subscribeParams.append('object', 'instagram');
      subscribeParams.append('callback_url', completeWebhookUrl);
      subscribeParams.append('fields', 'messages,comments,message_reactions,mentions');
      subscribeParams.append('verify_token', webhookSecret);
      subscribeParams.append('access_token', appAccessToken);
      
      const subscribeResponse = await fetch(
        `https://graph.facebook.com/v18.0/${appId}/subscriptions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: subscribeParams.toString()
        }
      );
      
      const subscribeData = await subscribeResponse.json();
      console.log('Respuesta de suscripción de app:', subscribeData);
      
      if (!subscribeResponse.ok) {
        console.error('Error al suscribir la app al webhook', subscribeData);
        return {
          statusCode: 500,
          body: JSON.stringify({ 
            error: 'Error al suscribir la app al webhook', 
            details: subscribeData
          })
        };
      }
    } else {
      console.log('La app ya está suscrita a eventos de Instagram');
    }
    
    // 2. Suscribir la cuenta específica a la app (esto lo hace recibir eventos)
    // Formatear la solicitud para suscribir la cuenta específica al webhook
    const params = new URLSearchParams();
    params.append('access_token', accessToken);
    
    // Realizar la llamada a la API Graph para suscribir la cuenta
    const subscribeResponse = await fetch(
      `https://graph.facebook.com/v18.0/${instagramUserId}/subscribed_apps`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
      }
    );
    
    const data = await subscribeResponse.json();
    console.log('Respuesta de suscripción de cuenta:', data);
    
    if (!subscribeResponse.ok) {
      console.error('Error al suscribir la cuenta', data);
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Error al suscribir cuenta al webhook', 
          details: data
        })
      };
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        message: 'Cuenta de Instagram suscrita correctamente a los webhooks',
        webhookUrl: completeWebhookUrl
      })
    };
    
  } catch (error) {
    console.error('Error al suscribir cuenta de Instagram:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Error al procesar la solicitud', 
        details: error.message
      })
    };
  }
}; 