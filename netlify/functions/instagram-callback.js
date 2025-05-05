const fetch = require('node-fetch');
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
  console.log('Instagram callback function triggered');
  
  // OAuth callback - Instagram redirige aquí después de la autorización
  if (event.httpMethod === 'GET') {
    try {
      const code = event.queryStringParameters.code;
      const state = event.queryStringParameters.state;
      
      if (!code) {
        console.log('No se recibió el parámetro code');
        return redirectToError('missing_code');
      }
      
      // Validar el state para evitar CSRF
      if (!state) {
        console.log('No se recibió el parámetro state');
        return redirectToError('missing_state');
      }
      
      // Intentar decodificar el state para obtener el userId
      let userId;
      try {
        const decodedState = JSON.parse(atob(state));
        userId = decodedState.userId;
        
        // Verificar timestamp para evitar ataques de replay
        const stateTime = decodedState.timestamp;
        const now = Date.now();
        const MAX_STATE_AGE = 1000 * 60 * 15; // 15 minutos
        
        if (!stateTime || now - stateTime > MAX_STATE_AGE) {
          console.log('Estado expirado o inválido');
          return redirectToError('expired_state');
        }
      } catch (stateError) {
        console.error('Error al decodificar state:', stateError);
        return redirectToError('invalid_state');
      }
      
      if (!userId) {
        console.log('No se pudo extraer el userId del state');
        return redirectToError('missing_user_id');
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

      if (!tokenResponse.ok) {
        console.error('Error en respuesta de token:', await tokenResponse.text());
        return redirectToError('token_error');
      }

      const shortTokenData = await tokenResponse.json();
      console.log('Respuesta de token de corta duración:', shortTokenData);

      if (shortTokenData.error_type || shortTokenData.error_message) {
        return redirectToError('instagram_error', shortTokenData.error_message);
      }

      // 2. Intercambiar por token de larga duración
      const longTokenUrl = `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${client_secret}&access_token=${shortTokenData.access_token}`;
      
      const longTokenResponse = await fetch(longTokenUrl);
      
      if (!longTokenResponse.ok) {
        console.error('Error en respuesta de token largo:', await longTokenResponse.text());
        return redirectToError('long_token_error');
      }
      
      const longTokenData = await longTokenResponse.json();
      console.log('Respuesta de token de larga duración:', longTokenData);
      
      if (longTokenData.error) {
        return redirectToError('long_token_instagram_error', longTokenData.error.message);
      }
      
      // 3. Guardar tokens y datos en Firebase
      try {
        // Verificar que el usuario existe en Firestore
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) {
          console.error('El usuario no existe en Firebase:', userId);
          return redirectToError('user_not_found');
        }
        
        // Datos a guardar
        const instagramData = {
          connected: true,
          instagramUserId: shortTokenData.user_id,
          username: shortTokenData.username || '',
          accessToken: longTokenData.access_token, // Token de larga duración
          tokenExpiresIn: longTokenData.expires_in,
          tokenObtainedAt: Date.now(),
          tokenExpiresAt: Date.now() + (longTokenData.expires_in * 1000)
        };
        
        // Guardar datos de Instagram en el documento del usuario
        await userRef.update({
          'socialNetworks.instagram': instagramData
        });
        
        console.log('Datos de Instagram guardados para usuario:', userId);
        
        // Guardar también en channelConnections
        const channelRef = db.collection('users').doc(userId).collection('channelConnections').doc('instagram');
        await channelRef.set({
          channelId: 'instagram',
          username: shortTokenData.username || '',
          connectedAt: admin.firestore.FieldValue.serverTimestamp(),
          status: 'active',
          lastSync: admin.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('Conexión de canal guardada');
        
        // 4. Obtener información básica de usuario para mostrar en el frontend
        // Cargar información de usuario (sin token - solo para UI)
        const igUserResponse = await fetch(
          `https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${longTokenData.access_token}`
        );
        
        if (!igUserResponse.ok) {
          console.warn('No se pudo obtener información de usuario, pero continuamos');
        } else {
          const igUserData = await igUserResponse.json();
          
          // Actualizar con información adicional
          await userRef.update({
            'socialNetworks.instagram.accountType': igUserData.account_type || '',
            'socialNetworks.instagram.mediaCount': igUserData.media_count || 0,
            'socialNetworks.instagram.profileUrl': igUserData.username ? `https://instagram.com/${igUserData.username}` : ''
          });
          
          console.log('Información de usuario actualizada');
        }
        
        // 5. Redireccionar al frontend con éxito
        return {
          statusCode: 302,
          headers: {
            'Location': `https://kalma-lab.netlify.app/auth/instagram/success?userId=${userId}&instagramId=${shortTokenData.user_id}`
          },
          body: ''
        };
      } catch (firestoreError) {
        console.error('Error al guardar en Firestore:', firestoreError);
        return redirectToError('database_error');
      }
    } catch (error) {
      console.error('Error interno en la función serverless:', error);
      return redirectToError('server_error');
    }
  }
  
  // Procesar solicitudes POST (para compatibilidad con versiones anteriores)
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
      
      // Resto del código similar al flujo GET pero devolviendo JSON
      // Este método es menos seguro y se mantiene por compatibilidad
      
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true })
      };
    } catch (error) {
      console.error('Error en solicitud POST:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Error interno', details: error.message })
      };
    }
  }
  
  // Si llegamos aquí, no se cumplió ninguna de las condiciones anteriores
  return {
    statusCode: 400,
    body: JSON.stringify({ error: 'Solicitud no válida: Los parámetros de la solicitud no son válidos.' })
  };
};

// Función para redireccionar a página de error
function redirectToError(errorCode, errorMessage = '') {
  return {
    statusCode: 302,
    headers: {
      'Location': `https://kalma-lab.netlify.app/auth/instagram/error?code=${errorCode}${errorMessage ? '&message=' + encodeURIComponent(errorMessage) : ''}`
    },
    body: ''
  };
} 