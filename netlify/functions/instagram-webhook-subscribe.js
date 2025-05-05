const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método no permitido' })
    };
  }

  try {
    // Obtención de parámetros
    const { userId, instagramUserId, accessToken } = JSON.parse(event.body);
    if (!userId || !instagramUserId || !accessToken) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Faltan parámetros requeridos' })
      };
    }

    const appId = process.env.INSTAGRAM_CLIENT_ID || '3029546990541926';
    const appSecret = process.env.INSTAGRAM_CLIENT_SECRET || '5ed60bb513324c22a3ec1db6faf9e92f';
    const verifyToken = process.env.INSTAGRAM_VERIFY_TOKEN || 'kalma-instagram-webhook-verify-token';
    
    // URL del webhook en la función serverless
    const webhookUrl = 'https://calma-lab.netlify.app/.netlify/functions/webhook-instagram';
    
    // 1. Suscribir la aplicación a los eventos de Instagram
    console.log('Configurando suscripción del webhook para Instagram...');
    
    // Crear token de aplicación (app_id|app_secret)
    const appAccessToken = `${appId}|${appSecret}`;
    
    // Configurar parámetros para la suscripción del webhook
    const subscribeParams = new URLSearchParams();
    subscribeParams.append('object', 'instagram');
    subscribeParams.append('callback_url', webhookUrl);
    subscribeParams.append('fields', 'messages,comments,message_reactions,live_comments');
    subscribeParams.append('verify_token', verifyToken);
    subscribeParams.append('access_token', appAccessToken);

    // Realizar llamada para suscribir la aplicación
    const subscribeResponse = await fetch(
      `https://graph.facebook.com/v18.0/${appId}/subscriptions`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: subscribeParams.toString()
      }
    );

    const subscribeData = await subscribeResponse.json();
    console.log('Respuesta de suscripción del webhook:', subscribeData);

    if (!subscribeResponse.ok) {
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Error al configurar webhook de la aplicación', 
          details: subscribeData 
        })
      };
    }

    // 2. Suscribir la cuenta específica de Instagram a la aplicación
    console.log('Suscribiendo cuenta de Instagram a la aplicación...');
    
    // Parámetros para suscribir la cuenta
    const userParams = new URLSearchParams();
    userParams.append('access_token', accessToken);

    // Realizar la suscripción de la cuenta
    const userSubscribeResponse = await fetch(
      `https://graph.facebook.com/v18.0/${instagramUserId}/subscribed_apps`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: userParams.toString()
      }
    );

    const userSubscribeData = await userSubscribeResponse.json();
    console.log('Respuesta de suscripción de cuenta:', userSubscribeData);

    if (!userSubscribeResponse.ok) {
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Error al suscribir cuenta a la aplicación', 
          details: userSubscribeData 
        })
      };
    }

    // Éxito en ambas operaciones
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        webhookSubscription: subscribeData,
        appSubscription: userSubscribeData
      })
    };
  } catch (error) {
    console.error('Error en la configuración de webhooks:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error interno', details: error.message })
    };
  }
}; 