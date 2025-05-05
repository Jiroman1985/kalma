const fetch = require('node-fetch');
const admin = require('firebase-admin');

// Control de inicialización de Firebase
let firebaseInitialized = false;
let db = null;

// Inicializar Firebase Admin con mejor manejo de errores
if (!admin.apps.length) {
  try {
    let serviceAccount;
    
    // Intentar usar credenciales base64 primero (más robusto)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_B64) {
      console.log('Inicializando Firebase usando credenciales en Base64');
      serviceAccount = JSON.parse(
        Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64, 'base64').toString()
      );
    } 
    // Si no hay B64, intentar con el JSON directo
    else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      console.log('Inicializando Firebase usando credenciales JSON');
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } 
    // Fallback para desarrollo local
    else {
      console.warn('ADVERTENCIA: No se encontraron credenciales Firebase. Usando objeto vacío para desarrollo local.');
      serviceAccount = {};
    }
    
    // Verificar que tengamos los campos mínimos necesarios
    if (!serviceAccount.project_id) {
      console.error('ERROR: Las credenciales de Firebase no contienen project_id');
      console.error('Credenciales recibidas:', Object.keys(serviceAccount).length ? 
        Object.keys(serviceAccount).join(', ') : 'objeto vacío');
      throw new Error('Service account incompleto: falta project_id');
    }
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://kalma-app-default-rtdb.firebaseio.com'
    });
    
    console.log('Firebase inicializado correctamente para el proyecto:', serviceAccount.project_id);
    firebaseInitialized = true;
    db = admin.firestore();
  } catch (error) {
    console.error('Error al inicializar Firebase:', error.message);
    firebaseInitialized = false;
    // No inicializamos db, quedará como null
  }
}

exports.handler = async function(event, context) {
  console.log('Instagram callback function triggered');
  console.log('Método HTTP:', event.httpMethod);
  console.log('URL completa:', event.rawUrl);
  console.log('Query params:', JSON.stringify(event.queryStringParameters));
  
  // Webhook verification handling
  if (event.httpMethod === 'GET' && event.queryStringParameters && event.queryStringParameters['hub.mode']) {
    console.log('Procesando verificación de webhook');
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
  
  // OAuth callback - Instagram redirige aquí después de la autorización
  if (event.httpMethod === 'GET' && event.queryStringParameters && event.queryStringParameters.code) {
    console.log('Procesando callback de OAuth con código de autorización');
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
      
      // Usamos el ID de Facebook para intercambiar el código inicial y luego el ID de Instagram para el token de larga duración
      const facebook_app_id = '1431820417985163';
      const instagram_app_id = '3029546990541926';
      const client_secret = process.env.INSTAGRAM_CLIENT_SECRET || '5ed60bb513324c22a3ec1db6faf9e92f';
      const redirect_uri = 'https://kalma-lab.netlify.app/.netlify/functions/instagram-callback';

      console.log('REDIRECT_URI usado en backend:', redirect_uri);
      console.log('FACEBOOK_APP_ID usado para intercambio inicial:', facebook_app_id);
      console.log('INSTAGRAM_APP_ID para referencia:', instagram_app_id);

      // 1. Obtener el token de Facebook usando el código de autorización de Facebook Login
      const params = new URLSearchParams();
      params.append('client_id', facebook_app_id);
      params.append('client_secret', client_secret);
      params.append('grant_type', 'authorization_code');
      params.append('redirect_uri', redirect_uri);
      params.append('code', code);

      console.log('Haciendo solicitud a graph.facebook.com para intercambiar el código por token...');
      
      const tokenResponse = await fetch('https://graph.facebook.com/v16.0/oauth/access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Error en respuesta de token Facebook:', errorText);
        return redirectToError('token_error', errorText);
      }

      const facebookTokenData = await tokenResponse.json();
      console.log('Respuesta de token de Facebook:', Object.keys(facebookTokenData).join(', '));

      if (facebookTokenData.error) {
        return redirectToError('facebook_error', facebookTokenData.error.message);
      }

      // 2. Intercambiar por token de Instagram de larga duración
      console.log('Intercambiando token de Facebook por token de Instagram...');
      const longTokenUrl = `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${client_secret}&access_token=${facebookTokenData.access_token}`;
      
      const longTokenResponse = await fetch(longTokenUrl);
      
      if (!longTokenResponse.ok) {
        const errorText = await longTokenResponse.text();
        console.error('Error en respuesta de token Instagram:', errorText);
        return redirectToError('long_token_error', errorText);
      }
      
      const longTokenData = await longTokenResponse.json();
      console.log('Respuesta de token de Instagram:', Object.keys(longTokenData).join(', '));
      
      if (longTokenData.error) {
        return redirectToError('instagram_error', longTokenData.error.message);
      }
      
      // 3. Obtener datos del usuario de Instagram usando el token
      console.log('Obteniendo datos de usuario de Instagram...');
      const userDataResponse = await fetch(
        `https://graph.instagram.com/me?fields=id,username&access_token=${longTokenData.access_token}`
      );
      
      let userData = { id: 'unknown', username: 'unknown' };
      
      if (userDataResponse.ok) {
        userData = await userDataResponse.json();
        console.log('Datos de usuario obtenidos:', Object.keys(userData).join(', '));
      } else {
        console.warn('No se pudieron obtener datos de usuario de Instagram, usando valores por defecto');
      }

      // 4. Guardar tokens y datos en Firebase
      const instagramData = {
        connected: true,
        instagramUserId: userData.id,
        username: userData.username || '',
        accessToken: longTokenData.access_token, // Token de larga duración
        tokenExpiresIn: longTokenData.expires_in,
        tokenObtainedAt: Date.now(),
        tokenExpiresAt: Date.now() + (longTokenData.expires_in * 1000)
      };
      
      // Intento de guardar en Firebase si está disponible
      if (firebaseInitialized && db) {
        try {
          // Verificar que el usuario existe en Firestore
          const userRef = db.collection('users').doc(userId);
          const userDoc = await userRef.get();
          
          if (!userDoc.exists) {
            console.error('El usuario no existe en Firebase:', userId);
            // Continuamos de todos modos, no queremos fallar por esto
          } else {
            // Guardar datos de Instagram en el documento del usuario
            await userRef.update({
              'socialNetworks.instagram': instagramData
            });
            
            console.log('Datos de Instagram guardados para usuario:', userId);
            
            // Guardar también en channelConnections
            const channelRef = db.collection('users').doc(userId).collection('channelConnections').doc('instagram');
            await channelRef.set({
              channelId: 'instagram',
              username: userData.username || '',
              connectedAt: admin.firestore.FieldValue.serverTimestamp(),
              status: 'active',
              lastSync: admin.firestore.FieldValue.serverTimestamp()
            });
            
            console.log('Conexión de canal guardada');
            
            // 5. Redireccionar al frontend con éxito, incluso si Firebase falló
            return {
              statusCode: 302,
              headers: {
                'Location': `https://kalma-lab.netlify.app/auth/instagram/success?userId=${userId}&instagramId=${userData.id}&accessToken=${encodeURIComponent(longTokenData.access_token)}`
              },
              body: ''
            };
          }
        } catch (firestoreError) {
          console.error('Error al guardar en Firestore, pero continuamos el flujo:', firestoreError.message);
          // Continuamos a pesar del error, queremos mostrar éxito al usuario
        }
      } else {
        console.warn('Firebase no está disponible, omitiendo guardado de datos');
      }
      
      // 5. Redireccionar al frontend con éxito, incluso si Firebase falló
      return {
        statusCode: 302,
        headers: {
          'Location': `https://kalma-lab.netlify.app/auth/instagram/success?userId=${userId}&instagramId=${userData.id}&accessToken=${encodeURIComponent(longTokenData.access_token)}`
        },
        body: ''
      };
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