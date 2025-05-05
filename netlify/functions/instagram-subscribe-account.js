const fetch = require('node-fetch');

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
    const { accessToken, instagramUserId } = payload;
    
    if (!accessToken || !instagramUserId) {
      console.error('Faltan parámetros obligatorios');
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Faltan parámetros requeridos', 
          requiredParams: ['accessToken', 'instagramUserId']
        })
      };
    }
    
    console.log('Suscribiendo cuenta de Instagram a los webhooks');
    console.log('Instagram User ID:', instagramUserId);
    
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
    console.log('Respuesta de suscripción:', data);
    
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
    
    if (data.success === true) {
      console.log('Cuenta suscrita exitosamente al webhook');
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          success: true, 
          message: 'Cuenta de Instagram suscrita correctamente a los webhooks'
        })
      };
    } else {
      console.warn('Respuesta sin éxito explícito', data);
      return {
        statusCode: 202,
        body: JSON.stringify({ 
          warning: 'Respuesta ambigua de la API', 
          details: data
        })
      };
    }
    
  } catch (error) {
    console.error('Error en función de suscripción:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Error interno del servidor', 
        message: error.message 
      })
    };
  }
}; 