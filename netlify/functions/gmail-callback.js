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
  const REDIRECT_URI = process.env.URL_GOOGLE + '/auth/gmail/callback';
  
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