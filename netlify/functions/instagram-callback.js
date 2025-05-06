const fetch = require('node-fetch');
const admin = require('firebase-admin');

// Función para verificar si un token parece ser un token de Facebook válido
function pareceTokenFacebookValido(token) {
  if (!token) return { valido: false, razon: 'Token vacío' };
  
  // Los tokens de Facebook suelen empezar con "EAA" (generalmente)
  if (!token.startsWith('EAA')) {
    return { 
      valido: false, 
      razon: `El token no tiene el prefijo típico de Facebook (EAA). Comienza con: ${token.substring(0, 3)}` 
    };
  }
  
  // Longitud típica de tokens de FB (180+ caracteres normalmente)
  if (token.length < 100) {
    return { 
      valido: false, 
      razon: `El token es demasiado corto (${token.length} caracteres). Los tokens de FB suelen tener 100+ caracteres.` 
    };
  }
  
  // Verifica si el token sólo contiene caracteres válidos
  if (!/^[A-Za-z0-9_-]+$/.test(token)) {
    return { 
      valido: false, 
      razon: 'El token contiene caracteres no válidos para un token de FB (solo se permiten letras, números, guiones y guiones bajos)' 
    };
  }
  
  return { valido: true };
}

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
    const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;
    console.log('>> Redirect URI exacto:', redirectUri);
    
    // Generar comando curl para pruebas manuales (ocultando información sensible)
    const fbCurlTest = `curl -i "https://graph.facebook.com/v17.0/oauth/access_token\\
?client_id=${process.env.FACEBOOK_APP_ID}\\
&redirect_uri=${encodeURIComponent(redirectUri)}\\
&client_secret=APP_SECRET\\
&code=CODE_RECIBIDO"`;
    console.log('>> Comando curl para probar primer paso:', fbCurlTest);
    
    const fbRes = await fetch(`https://graph.facebook.com/v17.0/oauth/access_token?` + new URLSearchParams({
      client_id: process.env.FACEBOOK_APP_ID,
      redirect_uri: redirectUri,
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
    // Loggear los primeros y últimos caracteres del token (evitando exponer el token completo en logs)
    console.log('>> FB short-lived token (parcial):', 
      fbShortToken.substring(0, 6) + '...' + 
      fbShortToken.substring(fbShortToken.length - 6));
    console.log('>> FB token length:', fbShortToken.length);
    
    // Validar si el token parece ser un token válido de Facebook
    const validacionToken = pareceTokenFacebookValido(fbShortToken);
    console.log('>> Validación de token FB:', validacionToken);
    
    if (!validacionToken.valido) {
      console.error('Advertencia: El token obtenido no parece un token válido de Facebook:', validacionToken.razon);
      // Continuamos de todos modos, porque podría ser un token atípico pero válido
    }
    
    // 2) Intercambiar FB token por IG long-lived token
    console.log('Intercambiando por Instagram long-lived token...');
    
    // Generar comando curl para el segundo paso (ocultando información sensible)
    const igCurlTest = `curl -i "https://graph.instagram.com/access_token\\
?grant_type=ig_exchange_token\\
&client_secret=APP_SECRET\\
&access_token=TOKEN_FB_CORTO"`;
    console.log('>> Comando curl para probar segundo paso:', igCurlTest);
    
    // Construir la URL completa para mejor depuración
    const igExchangeUrl = `https://graph.instagram.com/access_token?` + 
      new URLSearchParams({
        grant_type: 'ig_exchange_token',
        client_secret: process.env.FACEBOOK_APP_SECRET,
        access_token: fbShortToken
      });
    
    console.log('>> URL de intercambio:', 
      igExchangeUrl.substring(0, igExchangeUrl.indexOf('access_token=') + 13) + 
      '...TOKEN_OCULTO...');
    
    const igRes = await fetch(igExchangeUrl);
    
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
    
    // Verificar si hay un error en la respuesta JSON (a veces Facebook devuelve 200 OK pero con error en el cuerpo)
    if (igData.error) {
      console.error('Error en respuesta de Instagram:', igData.error);
      const errorDetails = JSON.stringify(igData.error);
      console.error('Detalles del error:', errorDetails);
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Error en respuesta de Instagram', 
          details: igData.error,
          fbTokenLength: fbShortToken.length,
          fbTokenPreview: fbShortToken.substring(0, 4) + '...' + fbShortToken.substring(fbShortToken.length - 4)
        })
      };
    }
    
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