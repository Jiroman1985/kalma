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

exports.handler = async (event) => {
  console.log('Instagram callback function triggered');
  
  const { code, state } = event.queryStringParameters;
  if (!code) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Falta el parámetro "code"' })
    };
  }
  
  try {
    // Extraer el userId del state
    let stateUserId;
    try {
      const decodedState = JSON.parse(atob(state));
      stateUserId = decodedState.userId;
    } catch (error) {
      console.error('Error al decodificar state:', error);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'State inválido' })
      };
    }
    
    // 1) Intercambiar code por FB short-lived token
    console.log('Solicitando Facebook short-lived token...');
    const fbRes = await fetch(`https://graph.facebook.com/v17.0/oauth/access_token?` + new URLSearchParams({
      client_id: process.env.FACEBOOK_APP_ID,
      redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
      client_secret: process.env.FACEBOOK_APP_SECRET,
      code
    }));
    
    if (!fbRes.ok) {
      const errorText = await fbRes.text();
      console.error('Error al obtener Facebook token:', errorText);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Error al obtener Facebook token', details: errorText })
      };
    }
    
    const fbData = await fbRes.json();
    console.log('Facebook token obtenido. Datos recibidos:', Object.keys(fbData).join(', '));
    
    if (!fbData.access_token) {
      console.error('No se recibió Facebook token:', fbData);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No se recibió Facebook token' })
      };
    }
    
    const fbShortToken = fbData.access_token;

    // 2) Intercambiar FB token por IG long-lived token
    console.log('Intercambiando por Instagram long-lived token...');
    const igRes = await fetch(`https://graph.instagram.com/access_token?` + new URLSearchParams({
      grant_type: 'ig_exchange_token',
      client_secret: process.env.INSTAGRAM_APP_SECRET,
      access_token: fbShortToken
    }));
    
    if (!igRes.ok) {
      const errorText = await igRes.text();
      console.error('Error al obtener Instagram token:', errorText);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Error al obtener Instagram token', details: errorText })
      };
    }
    
    const igData = await igRes.json();
    console.log('Instagram token obtenido. Datos recibidos:', Object.keys(igData).join(', '));
    
    if (!igData.access_token) {
      console.error('No se recibió Instagram token:', igData);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No se recibió Instagram token' })
      };
    }
    
    const igLongToken = igData.access_token;
    const expiresIn = igData.expires_in;

    // 3) Guardar en Firestore
    if (!firebaseInitialized || !db) {
      console.error('Firebase no está inicializado correctamente');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Error de configuración del servidor' })
      };
    }
    
    console.log('Guardando tokens en Firestore para usuario:', stateUserId);
    await db.collection('users').doc(stateUserId).update({
      'socialNetworks.instagram': {
        accessToken: igLongToken,
        tokenExpiresAt: Date.now() + expiresIn * 1000,
        obtainedAt: Date.now()
      }
    });
    
    console.log('Tokens guardados correctamente');

    // 4) Redirigir al cliente
    return {
      statusCode: 302,
      headers: {
        Location: `https://kalma-lab.netlify.app/auth/instagram/success?userId=${stateUserId}&instagramId=${igData.user_id}`
      },
      body: ''
    };
  } catch (error) {
    console.error('Error en el procesamiento del callback de Instagram:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error interno del servidor', details: error.message })
    };
  }
}; 