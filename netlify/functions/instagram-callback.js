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
    
    // 2) Intercambiar FB short-lived token por FB long-lived token
    console.log('Intercambiando por Facebook long-lived token...');
    
    // Generar comando curl para el segundo paso (ocultando información sensible)
    const fbLongTokenCurl = `curl -i "https://graph.facebook.com/v17.0/oauth/access_token\\
?grant_type=fb_exchange_token\\
&client_id=${process.env.FACEBOOK_APP_ID}\\
&client_secret=APP_SECRET\\
&fb_exchange_token=TOKEN_FB_CORTO"`;
    console.log('>> Comando curl para probar segundo paso:', fbLongTokenCurl);
    
    // Construir la URL completa para mejor depuración
    const fbLongTokenUrl = `https://graph.facebook.com/v17.0/oauth/access_token?` + 
      new URLSearchParams({
        grant_type: 'fb_exchange_token',
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        fb_exchange_token: fbShortToken
      });
    
    console.log('>> URL de intercambio:', 
      fbLongTokenUrl.substring(0, fbLongTokenUrl.indexOf('fb_exchange_token=') + 17) + 
      '...TOKEN_OCULTO...');
    
    const fbLongRes = await fetch(fbLongTokenUrl);
    
    if (!fbLongRes.ok) {
      const errorText = await fbLongRes.text();
      console.error('Error al obtener Facebook token de larga duración:', errorText);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Error al obtener Facebook token de larga duración', details: errorText })
      };
    }
    
    const fbLongData = await fbLongRes.json();
    console.log('Facebook token de larga duración obtenido. Datos recibidos:', Object.keys(fbLongData).join(', '));
    
    // Verificar si hay un error en la respuesta JSON
    if (fbLongData.error) {
      console.error('Error en respuesta de Facebook:', fbLongData.error);
      const errorDetails = JSON.stringify(fbLongData.error);
      console.error('Detalles del error:', errorDetails);
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Error en respuesta de Facebook', 
          details: fbLongData.error
        })
      };
    }
    
    if (!fbLongData.access_token) {
      console.error('No se recibió Facebook token de larga duración:', fbLongData);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No se recibió Facebook token de larga duración' })
      };
    }
    
    const fbLongToken = fbLongData.access_token;
    const fbExpiresIn = fbLongData.expires_in || 5184000; // 60 días por defecto si no viene
    
    // Loggear token parcial
    console.log('>> FB long-lived token (parcial):', 
      fbLongToken.substring(0, 6) + '...' + 
      fbLongToken.substring(fbLongToken.length - 6));
    
    // 4) Obtener páginas de FB e ID de Instagram Business
    console.log('Obteniendo páginas de Facebook e ID de Instagram Business...');
    
    let paginaConInstagram = null;
    let instagramBusinessId = null;
    let pageId = null;
    let pageToken = null;
    
    try {
      const pagesUrl = `https://graph.facebook.com/v17.0/me/accounts?` + 
        new URLSearchParams({
          access_token: fbLongToken,
          fields: 'name,instagram_business_account,access_token'
        });
      
      const pagesRes = await fetch(pagesUrl);
      
      if (pagesRes.ok) {
        const pagesData = await pagesRes.json();
        console.log('Respuesta de páginas recibida:', Object.keys(pagesData).join(', '));
        
        if (pagesData.data && Array.isArray(pagesData.data) && pagesData.data.length > 0) {
          console.log(`Se encontraron ${pagesData.data.length} páginas de Facebook`);
          
          // Buscar la primera página que tenga una cuenta de Instagram asociada
          paginaConInstagram = pagesData.data.find(page => page.instagram_business_account && page.instagram_business_account.id);
          
          if (paginaConInstagram) {
            console.log('Se encontró página con Instagram Business:', paginaConInstagram.name);
            instagramBusinessId = paginaConInstagram.instagram_business_account.id;
            pageId = paginaConInstagram.id;
            pageToken = paginaConInstagram.access_token;
            
            console.log('>> Instagram Business ID:', instagramBusinessId);
            console.log('>> Page ID:', pageId);
            console.log('>> Page token (parcial):', 
              pageToken.substring(0, 6) + '...' + 
              pageToken.substring(pageToken.length - 6));
          } else {
            console.log('No se encontró ninguna página con cuenta de Instagram Business asociada');
          }
        } else {
          console.log('No se encontraron páginas de Facebook');
        }
      } else {
        const errorText = await pagesRes.text();
        console.error('Error al obtener páginas de Facebook:', errorText);
      }
    } catch (error) {
      console.error('Excepción al obtener páginas de Facebook:', error);
    }
    
    // 5) Guardar datos en Firestore según lo que hayamos podido obtener
    if (!firebaseInitialized || !db) {
      console.error('Firebase no está inicializado correctamente');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Error de configuración del servidor' })
      };
    }
    
    try {
      console.log('Guardando datos en Firestore para usuario:', stateUserId);
      
      // MODIFICACIÓN: Ya no intentamos obtener un token específico de Instagram
      // En su lugar, usamos el token de página de Facebook como token principal
      // para la API de Instagram Business
      
      // 1. Guardar token de página si está disponible (este es el token importante)
      if (pageToken) {
        await db
          .collection('users').doc(stateUserId)
          .collection('socialTokens').doc('instagram')
          .set({
            accessToken: pageToken,              // Usamos el token de página de FB
            tokenExpiry: Date.now() + fbExpiresIn * 1000,
            lastSynced: new Date().toISOString()
          }, { merge: true });
        
        console.log('Token de página de Facebook guardado como token de Instagram en socialTokens/instagram');
      } else {
        console.warn('No se pudo obtener token de página para guardar');
      }
      
      // 2. Guardar ID de Instagram Business si está disponible
      if (instagramBusinessId) {
        await db
          .collection('users').doc(stateUserId)
          .collection('socialTokens').doc('instagram')
          .set({ 
            instagramUserId: instagramBusinessId 
          }, { merge: true });
        
        console.log('ID de Instagram Business guardado:', instagramBusinessId);
      } else {
        console.warn('No se encontró ID de Instagram Business para guardar');
      }
      
      // 3. Mantener compatibilidad con la estructura anterior (opcional)
      let instagramData = {
        fbAccessToken: fbLongToken,
        fbTokenExpiresAt: Date.now() + fbExpiresIn * 1000,
        obtainedAt: Date.now(),
        lastUpdated: Date.now(),
        connected: true,
        isValid: true
      };
      
      // Añadir datos de Instagram Business si los obtuvimos
      if (instagramBusinessId && pageId && pageToken) {
        instagramData = {
          ...instagramData,
          instagramBusinessId,
          pageId,
          pageName: paginaConInstagram.name,
          pageAccessToken: pageToken,     // El mismo token que guardamos como principal
          connectionType: 'business'
        };
      } else {
        instagramData = {
          ...instagramData,
          connectionType: 'incomplete',
          needsSetup: true
        };
      }
      
      await db.collection('users').doc(stateUserId).update({
        'socialNetworks.instagram': instagramData
      });
      
      console.log('Datos también guardados en la estructura legacy (socialNetworks.instagram)');
    } catch (error) {
      console.error('Error al guardar datos en Firestore:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Error al guardar datos', details: error.message })
      };
    }
    
    // 6) Redirigir al cliente a la página de éxito
    console.log('Redirigiendo al cliente...');
    
    // CORREGIR: Usar la ruta correcta (/dashboard/canales) en la redirección
    const successUrl = 'https://kalma-lab.netlify.app/auth/instagram/success';
    const redirectUrl = `${successUrl}?userId=${stateUserId}` + 
      (instagramBusinessId ? `&instagramId=${instagramBusinessId}` : '');
    
    return {
      statusCode: 302,
      headers: {
        Location: redirectUrl
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