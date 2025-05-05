const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  console.log('Instagram callback function triggered');
  
  // Responder a la verificación de webhook si es una solicitud GET
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
  
  // Procesar solicitudes POST para intercambio de código por token
  if (event.httpMethod === 'POST') {
    try {
      const { code, state } = JSON.parse(event.body);
      if (!code) {
        console.log('No se recibió el parámetro code');
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Falta el parámetro code' })
        };
      }

      const client_id = process.env.INSTAGRAM_CLIENT_ID || '3029546990541926';
      const client_secret = process.env.INSTAGRAM_CLIENT_SECRET || '5ed60bb513324c22a3ec1db6faf9e92f';
      const redirect_uri = 'https://kalma-lab.netlify.app/.netlify/functions/instagram-callback';

      console.log('REDIRECT_URI usado en backend:', redirect_uri);
      console.log('Datos enviados a Instagram:', { client_id, redirect_uri });

      // 1. Obtener el token de corta duración
      const params = new URLSearchParams();
      params.append('client_id', client_id);
      params.append('client_secret', client_secret);
      params.append('grant_type', 'authorization_code');
      params.append('redirect_uri', redirect_uri);
      params.append('code', code);

      const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
      });

      const shortTokenData = await tokenResponse.json();
      console.log('Respuesta de token de corta duración:', shortTokenData);

      if (shortTokenData.error_type || shortTokenData.error_message) {
        return {
          statusCode: 400,
          body: JSON.stringify({ 
            error: shortTokenData.error_message || 'Error de Instagram', 
            details: shortTokenData 
          })
        };
      }

      // 2. Intercambiar por token de larga duración
      const longTokenUrl = `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${client_secret}&access_token=${shortTokenData.access_token}`;
      
      const longTokenResponse = await fetch(longTokenUrl);
      const longTokenData = await longTokenResponse.json();
      
      console.log('Respuesta de token de larga duración:', longTokenData);
      
      if (longTokenData.error) {
        return {
          statusCode: 400,
          body: JSON.stringify({ 
            error: 'Error al obtener token de larga duración', 
            details: longTokenData 
          })
        };
      }
      
      // 3. Devolver ambos tokens y datos
      const responseData = {
        user_id: shortTokenData.user_id,
        username: shortTokenData.username,
        access_token: longTokenData.access_token,
        token_type: longTokenData.token_type,
        expires_in: longTokenData.expires_in,
        obtained_at: Date.now()
      };
      
      // Redireccionar al usuario a la página de callback en el frontend
      return {
        statusCode: 302,
        headers: {
          'Location': `https://kalma-lab.netlify.app/auth/instagram/callback?code=${code}&userId=${shortTokenData.user_id}`
        },
        body: JSON.stringify(responseData)
      };
    } catch (error) {
      console.error('Error interno en la función serverless:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Error interno', details: error.message })
      };
    }
  }
  
  // Método no permitido para otros tipos de solicitudes
  return {
    statusCode: 405,
    body: JSON.stringify({ error: 'Método no permitido' })
  };
}; 