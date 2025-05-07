const axios = require('axios');
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Configuración de Firebase Admin
const initializeFirebaseAdmin = () => {
  if (getApps().length === 0) {
    const serviceAccount = JSON.parse(
      Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY, 'base64').toString()
    );
    
    initializeApp({
      credential: cert(serviceAccount)
    });
  }
  
  return getFirestore();
};

exports.handler = async function(event, context) {
  // Verificar que sea una solicitud GET
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método no permitido' })
    };
  }

  const { code, state, error } = event.queryStringParameters || {};
  
  // Si hay un error en la autenticación
  if (error) {
    console.error('Error en la autenticación de Gmail:', error);
    return {
      statusCode: 302,
      headers: {
        Location: '/auth/gmail/error?error=' + encodeURIComponent(error)
      },
      body: ''
    };
  }
  
  // Verificar que tenemos el código y el estado
  if (!code || !state) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Falta el código o estado de autenticación' })
    };
  }
  
  try {
    // Decodificar el estado para obtener userId
    const decodedState = JSON.parse(Buffer.from(state, 'base64').toString());
    const { userId } = decodedState;
    
    if (!userId) {
      throw new Error('No se encontró el userId en el estado');
    }
    
    // Intercambiar el código por tokens
    const tokenResponse = await exchangeCodeForTokens(code);
    
    if (!tokenResponse || !tokenResponse.access_token) {
      throw new Error('No se pudieron obtener los tokens');
    }
    
    // Obtener información del perfil de Gmail
    const profileInfo = await fetchEmailProfile(tokenResponse.access_token);
    
    // Guardar tokens y perfil en Firestore
    await saveGmailTokens(userId, {
      ...tokenResponse,
      profile: profileInfo,
      createdAt: new Date()
    });
    
    // Guardar en la estructura legacy (socialNetworks.gmail)
    await saveLegacyGmailData(userId, {
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      tokenExpiresAt: Date.now() + (tokenResponse.expires_in * 1000),
      profile: profileInfo,
      obtainedAt: Date.now(),
      lastUpdated: Date.now(),
      connected: true,
      isValid: true
    });
    
    // Crear entrada en channelConnections para activar el canal en la plataforma
    await createChannelConnection(userId, {
      channelId: 'gmail',
      username: profileInfo.email,
      profileUrl: `https://mail.google.com/mail/u/${profileInfo.email}`,
      profileImage: profileInfo.picture,
      connectedAt: new Date(),
      status: 'active',
      lastSync: new Date()
    });
    
    // Redireccionar a la página de éxito - cambiar a /dashboard/channels para mantener consistencia
    return {
      statusCode: 302,
      headers: {
        Location: '/dashboard/channels'
      },
      body: ''
    };
    
  } catch (error) {
    console.error('Error en el callback de Gmail:', error);
    
    return {
      statusCode: 302,
      headers: {
        Location: '/auth/gmail/error?error=' + encodeURIComponent(error.message)
      },
      body: ''
    };
  }
};

// Función para intercambiar el código por tokens
async function exchangeCodeForTokens(code) {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const REDIRECT_URI = process.env.URL_GOOGLE + '/.netlify/functions/gmail-callback';
  
  console.log('Intercambiando código por tokens con los siguientes parámetros:');
  console.log('REDIRECT_URI:', REDIRECT_URI);
  console.log('GOOGLE_CLIENT_ID:', GOOGLE_CLIENT_ID.substring(0, 10) + '...');
  
  try {
    // Usar URLSearchParams para enviar datos como application/x-www-form-urlencoded
    // en lugar de JSON, que es lo que espera Google
    const formData = new URLSearchParams();
    formData.append('code', code);
    formData.append('client_id', GOOGLE_CLIENT_ID);
    formData.append('client_secret', GOOGLE_CLIENT_SECRET);
    formData.append('redirect_uri', REDIRECT_URI);
    formData.append('grant_type', 'authorization_code');
    
    const response = await axios.post(
      'https://oauth2.googleapis.com/token', 
      formData.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    console.log('Respuesta de tokens recibida:', JSON.stringify(response.data).substring(0, 100) + '...');
    return response.data;
  } catch (error) {
    console.error('Error al intercambiar código por tokens:');
    if (error.response) {
      console.error('Datos de respuesta:', JSON.stringify(error.response.data));
      console.error('Estado HTTP:', error.response.status);
      console.error('Cabeceras:', JSON.stringify(error.response.headers));
    } else {
      console.error('Error:', error.message);
    }
    throw new Error('No se pudieron obtener los tokens de acceso: ' + (error.response?.data?.error_description || error.message));
  }
}

// Función para obtener información del perfil de Gmail
async function fetchEmailProfile(accessToken) {
  try {
    const response = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error al obtener información del perfil:', error.response?.data || error.message);
    throw new Error('No se pudo obtener la información del perfil de Gmail');
  }
}

// Función para guardar tokens en Firestore
async function saveGmailTokens(userId, tokenData) {
  const db = initializeFirebaseAdmin();
  
  try {
    // Guardar en la colección socialTokens
    await db.collection('socialTokens').doc(userId).set({
      gmail: tokenData
    }, { merge: true });
    
    console.log('Tokens de Gmail guardados correctamente para el usuario:', userId);
    return true;
  } catch (error) {
    console.error('Error al guardar tokens de Gmail:', error);
    throw new Error('No se pudieron guardar los tokens en la base de datos');
  }
}

// Función para guardar datos de Gmail en la estructura legacy
async function saveLegacyGmailData(userId, gmailData) {
  const db = initializeFirebaseAdmin();
  
  try {
    // Guardar en la estructura socialNetworks.gmail del documento del usuario
    await db.collection('users').doc(userId).update({
      'socialNetworks.gmail': gmailData
    });
    
    console.log('Datos de Gmail guardados en estructura legacy para el usuario:', userId);
    return true;
  } catch (error) {
    console.error('Error al guardar datos legacy de Gmail:', error);
    console.log('Intentando crear el documento del usuario si no existe...');
    
    try {
      // Si el update falla, puede ser porque el documento o el campo no existen
      // Intentar con set + merge
      await db.collection('users').doc(userId).set({
        socialNetworks: {
          gmail: gmailData
        }
      }, { merge: true });
      
      console.log('Datos de Gmail guardados con set+merge para el usuario:', userId);
      return true;
    } catch (secondError) {
      console.error('Error al intentar set+merge para Gmail:', secondError);
      throw new Error('No se pudieron guardar los datos legacy de Gmail');
    }
  }
}

// Función para crear entrada en channelConnections
async function createChannelConnection(userId, connectionData) {
  const db = initializeFirebaseAdmin();
  
  try {
    // Crear un documento en la colección channelConnections
    const connectionId = `gmail_${connectionData.username.replace(/[@\.]/g, '_')}`;
    
    await db.collection('users').doc(userId)
      .collection('channelConnections').doc(connectionId)
      .set({
        id: connectionId,
        ...connectionData
      });
    
    console.log('Conexión de canal creada para Gmail:', connectionId);
    return true;
  } catch (error) {
    console.error('Error al crear conexión de canal para Gmail:', error);
    throw new Error('No se pudo activar el canal de Gmail en la plataforma');
  }
} 