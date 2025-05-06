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
    
    // Redireccionar a la página de éxito
    return {
      statusCode: 302,
      headers: {
        Location: '/auth/gmail/success'
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
  const REDIRECT_URI = process.env.URL + '/auth/gmail/callback';
  
  try {
    const response = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code'
    });
    
    return response.data;
  } catch (error) {
    console.error('Error al intercambiar código por tokens:', error.response?.data || error.message);
    throw new Error('No se pudieron obtener los tokens de acceso');
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