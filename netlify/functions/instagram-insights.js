const fetch = require('node-fetch');
const admin = require('firebase-admin');

let firebaseInitialized = false;
let db = null;

// Inicializar Firebase Admin
if (!admin.apps.length) {
  try {
    let serviceAccount;
    
    if (process.env.FIREBASE_SERVICE_ACCOUNT_B64) {
      serviceAccount = JSON.parse(
        Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64, 'base64').toString()
      );
    } 
    else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } 
    else {
      serviceAccount = {};
    }
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://kalma-app-default-rtdb.firebaseio.com'
    });
    
    firebaseInitialized = true;
    db = admin.firestore();
  } catch (error) {
    console.error('Error al inicializar Firebase:', error.message);
    firebaseInitialized = false;
  }
}

exports.handler = async (event, context) => {
  // Permitir solo solicitudes GET
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método no permitido' })
    };
  }

  // Extraer userId del query string
  const { userId, username } = event.queryStringParameters || {};
  
  if (!userId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Se requiere userId' })
    };
  }

  console.log(`📊 [Instagram Insights] Obteniendo datos para usuario: ${userId}`);
  
  try {
    if (!firebaseInitialized || !db) {
      console.error('Firebase no está inicializado correctamente');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Error de configuración del servidor' })
      };
    }

    // 1. Obtener los tokens e ID de Instagram guardados en Firestore
    const instagramTokenRef = db.collection('users').doc(userId).collection('socialTokens').doc('instagram');
    const instagramTokenDoc = await instagramTokenRef.get();
    
    if (!instagramTokenDoc.exists) {
      console.log('No se encontraron datos de Instagram para este usuario');
      return {
        statusCode: 404,
        body: JSON.stringify({ 
          error: 'TOKEN_NOT_FOUND',
          message: 'No hay conexión con Instagram para este usuario' 
        })
      };
    }
    
    const instagramData = instagramTokenDoc.data();
    
    if (!instagramData.accessToken || !instagramData.instagramUserId) {
      console.log('Faltan datos necesarios: accessToken o instagramUserId');
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'INCOMPLETE_DATA',
          message: 'Faltan datos necesarios para la conexión con Instagram' 
        })
      };
    }
    
    const accessToken = instagramData.accessToken;
    const instagramUserId = instagramData.instagramUserId;
    const tokenExpiry = instagramData.tokenExpiry;
    
    // Verificar si el token ha expirado
    if (tokenExpiry && Date.now() > tokenExpiry) {
      console.log('El token de Instagram ha expirado');
      return {
        statusCode: 401,
        body: JSON.stringify({ 
          error: 'TOKEN_EXPIRED',
          message: 'El token de Instagram ha expirado, por favor reconecta tu cuenta'
        })
      };
    }
    
    console.log(`📊 [Instagram Insights] Datos encontrados - ID: ${instagramUserId}`);
    
    // 2. Obtener información básica de cuenta para verificar conexión
    const accountInfoUrl = `https://graph.facebook.com/v17.0/${instagramUserId}?fields=name,username,profile_picture_url&access_token=${accessToken}`;
    console.log(`📊 [Instagram Insights] Verificando conexión básica (usando API de Facebook)...`);
    
    let accountInfo;
    try {
      const accountResponse = await fetch(accountInfoUrl);
      
      if (!accountResponse.ok) {
        const errorText = await accountResponse.text();
        console.error('Error en respuesta de Instagram (info básica):', errorText);
        
        // Verificar si el error es por token expirado o inválido
        if (errorText.includes('invalid') || errorText.includes('expired')) {
          return {
            statusCode: 401,
            body: JSON.stringify({ 
              error: 'TOKEN_EXPIRED',
              message: 'El token de Instagram es inválido o ha expirado' 
            })
          };
        }
        
        return {
          statusCode: 500,
          body: JSON.stringify({ 
            error: 'API_ERROR',
            message: 'Error al comunicarse con la API de Instagram' 
          })
        };
      }
      
      accountInfo = await accountResponse.json();
      console.log(`📊 [Instagram Insights] Cuenta verificada: @${accountInfo.username}`);
      
      // NOTA: La estructura de la respuesta de la API de Facebook puede ser diferente
      // a la que esperábamos de Instagram. Si hay problemas al acceder a los campos,
      // puede ser necesario ajustar cómo se procesan los datos aquí.
      
      // Guardar el username en Firestore si no existe y tenemos uno
      if (accountInfo.username && !instagramData.username) {
        await instagramTokenRef.update({ 
          username: accountInfo.username,
          lastVerified: new Date().toISOString() 
        });
        console.log(`📊 [Instagram Insights] Username guardado: @${accountInfo.username}`);
      }
      
    } catch (error) {
      console.error('Error al verificar cuenta de Instagram:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'API_ERROR',
          message: 'Error al verificar la cuenta de Instagram' 
        })
      };
    }
    
    // 3. Obtener métricas usando Business Discovery
    // Usamos el username de la consulta o el que obtuvimos en la verificación
    const targetUsername = username || accountInfo.username;
    
    if (!targetUsername) {
      console.error('No se pudo determinar el username para business discovery');
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'USERNAME_REQUIRED',
          message: 'Se requiere username para obtener métricas' 
        })
      };
    }
    
    const businessDiscoveryUrl = `https://graph.facebook.com/v17.0/${instagramUserId}?` +
      `fields=business_discovery.username(${targetUsername}){` + 
      'username,name,profile_picture_url,biography,follows_count,followers_count,media_count,' +
      'media{comments_count,like_count,media_type,permalink,timestamp}}' +
      `&access_token=${accessToken}`;
    
    console.log(`📊 [Instagram Insights] Obteniendo métricas para @${targetUsername}...`);
    
    try {
      const metricsResponse = await fetch(businessDiscoveryUrl);
      
      if (!metricsResponse.ok) {
        const errorText = await metricsResponse.text();
        console.error('Error en respuesta de Instagram (business discovery):', errorText);
        
        // Verificar tipo de error
        if (errorText.includes('invalid') || errorText.includes('expired')) {
          return {
            statusCode: 401,
            body: JSON.stringify({ 
              error: 'TOKEN_EXPIRED',
              message: 'El token de Instagram es inválido o ha expirado' 
            })
          };
        }
        
        if (errorText.includes('not a valid business account') || errorText.includes('permission')) {
          return {
            statusCode: 403,
            body: JSON.stringify({ 
              error: 'PERMISSION_ERROR',
              message: 'La cuenta no es de tipo Business o faltan permisos' 
            })
          };
        }
        
        return {
          statusCode: 500,
          body: JSON.stringify({ 
            error: 'API_ERROR',
            message: 'Error al obtener métricas de Instagram Business API' 
          })
        };
      }
      
      const metricsData = await metricsResponse.json();
      
      // Extraer datos relevantes
      const businessDiscovery = metricsData.business_discovery;
      
      if (!businessDiscovery) {
        console.error('No se encontraron datos de business discovery');
        return {
          statusCode: 404,
          body: JSON.stringify({ 
            error: 'NO_DATA',
            message: 'No se encontraron datos de la cuenta' 
          })
        };
      }
      
      // Procesar datos para la respuesta
      const insights = {
        username: businessDiscovery.username,
        name: businessDiscovery.name,
        profile_picture_url: businessDiscovery.profile_picture_url,
        biography: businessDiscovery.biography,
        followers_count: businessDiscovery.followers_count || 0,
        follows_count: businessDiscovery.follows_count || 0,
        media_count: businessDiscovery.media_count || 0,
        posts: []
      };
      
      // Añadir los últimos posts si están disponibles
      if (businessDiscovery.media && businessDiscovery.media.data) {
        insights.posts = businessDiscovery.media.data.map(post => ({
          id: post.id,
          media_type: post.media_type,
          permalink: post.permalink,
          like_count: post.like_count || 0,
          comments_count: post.comments_count || 0,
          timestamp: post.timestamp
        }));
      }
      
      // Guardar última actualización y métricas básicas en Firestore
      await instagramTokenRef.update({
        lastSynced: new Date().toISOString(),
        followerCount: insights.followers_count,
        mediaCount: insights.media_count,
        username: insights.username
      });
      
      console.log(`📊 [Instagram Insights] Métricas obtenidas: ${insights.followers_count} seguidores, ${insights.media_count} posts`);
      
      return {
        statusCode: 200,
        body: JSON.stringify(insights)
      };
      
    } catch (error) {
      console.error('Error al obtener métricas de Instagram:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'SERVER_ERROR',
          message: 'Error interno al procesar la solicitud' 
        })
      };
    }
    
  } catch (error) {
    console.error('Error general:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'SERVER_ERROR',
        message: 'Error interno del servidor' 
      })
    };
  }
}; 