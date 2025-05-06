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

// Función para guardar métricas históricas
const guardarMetricasHistoricas = async (userId, insights) => {
  if (!firebaseInitialized || !db) {
    console.error('Firebase no está inicializado para guardar métricas históricas');
    return false;
  }
  
  try {
    const fecha = new Date();
    const fechaStr = fecha.toISOString().split('T')[0]; // Formato YYYY-MM-DD
    
    // Comprobar si ya existe registro para hoy
    const metricasRef = db.collection('users').doc(userId)
      .collection('instagramMetrics').doc(fechaStr);
      
    const doc = await metricasRef.get();
    
    if (!doc.exists) {
      // Solo guardar una vez al día
      console.log(`📊 [Instagram Insights] Guardando métricas históricas para ${fechaStr}`);
      
      await metricasRef.set({
        fecha: admin.firestore.Timestamp.fromDate(fecha),
        seguidores: insights.followers_count || 0,
        engagement: insights.metrics?.engagement_rate || 0,
        mensajesDirectos: insights.direct_messages_count || 0,
        tiempoRespuesta: insights.response_time || 0,
        interacciones: {
          likes: insights.posts?.reduce((sum, post) => sum + (post.like_count || 0), 0) || 0,
          comentarios: insights.posts?.reduce((sum, post) => sum + (post.comments_count || 0), 0) || 0,
          guardados: 0, // Esta información no está disponible directamente en la API
          compartidos: 0 // Esta información no está disponible directamente en la API
        }
      });
      
      console.log(`✅ [Instagram Insights] Métricas históricas guardadas para: ${fechaStr}`);
      return true;
    } else {
      console.log(`ℹ️ [Instagram Insights] Ya existía registro de métricas para hoy (${fechaStr})`);
      return false;
    }
  } catch (error) {
    console.error('❌ [Instagram Insights] Error al guardar métricas históricas:', error);
    return false;
  }
};

exports.handler = async (event, context) => {
  // Permitir solo solicitudes GET
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método no permitido' })
    };
  }

  // Extraer userId del query string
  const { userId, username, forceUpdate } = event.queryStringParameters || {};
  
  if (!userId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Se requiere userId' })
    };
  }

  // Verificar si debemos forzar actualización
  const skipCache = forceUpdate === 'true';
  console.log(`📊 [Instagram Insights] Obteniendo datos para usuario: ${userId}${skipCache ? ' (forzando actualización)' : ''}`);
  
  try {
    if (!firebaseInitialized || !db) {
      console.error('Firebase no está inicializado correctamente');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Error de configuración del servidor' })
      };
    }

    // Verificar caché si no estamos forzando actualización
    if (!skipCache) {
      // Comprobar si hay datos en caché
      const configRef = db.collection('users').doc(userId).collection('config').doc('instagram');
      const configDoc = await configRef.get();
      
      if (configDoc.exists) {
        const config = configDoc.data();
        if (config.ultimaActualizacion && config.cacheData) {
          const ultimaAct = config.ultimaActualizacion.toDate();
          const ahora = new Date();
          
          // Si hace menos de 3 horas, usar caché
          if ((ahora.getTime() - ultimaAct.getTime()) < 3 * 60 * 60 * 1000) {
            console.log(`📊 [Instagram Insights] Usando datos en caché de hace ${Math.round((ahora.getTime() - ultimaAct.getTime()) / (60 * 1000))} minutos`);
            return {
              statusCode: 200,
              body: JSON.stringify({
                ...config.cacheData,
                fromCache: true,
                cacheTimestamp: config.ultimaActualizacion.toDate().toISOString()
              })
            };
          }
        }
      }
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
    
    console.log(`📊 [Instagram Insights] Obteniendo métricas para @${targetUsername}...`);
    
    const businessDiscoveryUrl = `https://graph.facebook.com/v17.0/${instagramUserId}?` +
      `fields=business_discovery.username(${targetUsername}){` + 
      'username,name,profile_picture_url,biography,website,follows_count,followers_count,media_count,' +
      'media.limit(25){id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,like_count,comments_count,children{media_url,media_type,thumbnail_url}}}' +
      `&access_token=${accessToken}`;
    
    try {
      console.log(`📊 [Instagram Insights] URL de business discovery (sin token): https://graph.facebook.com/v17.0/${instagramUserId}?fields=business_discovery.username(${targetUsername}){...}`);
      
      const metricsResponse = await fetch(businessDiscoveryUrl);
      
      if (!metricsResponse.ok) {
        const errorText = await metricsResponse.text();
        console.error('❌ Error en respuesta de Instagram (business discovery):', errorText);
        console.error('❌ Código de estado:', metricsResponse.status);
        
        // Guardar error en registro para depuración
        try {
          const errorLogRef = db.collection('errorLogs').doc();
          await errorLogRef.set({
            userId: userId,
            timestamp: admin.firestore.Timestamp.now(),
            endpoint: 'instagram-insights',
            statusCode: metricsResponse.status,
            errorMessage: errorText,
            instagramUserId: instagramUserId,
            username: targetUsername
          });
          console.log('📝 Error registrado en Firestore para depuración');
        } catch (logError) {
          console.error('❌ No se pudo registrar el error en logs:', logError);
        }
        
        // Verificar errores comunes con mensajes más descriptivos
        if (errorText.includes('invalid') || errorText.includes('expired')) {
          console.error('❌ Error de token inválido o expirado');
          return {
            statusCode: 401,
            body: JSON.stringify({ 
              error: 'TOKEN_EXPIRED',
              message: 'El token de Instagram es inválido o ha expirado',
              details: errorText
            })
          };
        }
        
        if (errorText.includes('not a valid business account') || errorText.includes('permission')) {
          console.error('❌ Error de permisos o cuenta no válida');
          return {
            statusCode: 403,
            body: JSON.stringify({ 
              error: 'PERMISSION_ERROR',
              message: 'La cuenta no es de tipo Business o faltan permisos',
              details: errorText
            })
          };
        }
        
        if (errorText.includes('Object does not exist') || errorText.includes('does not exist')) {
          console.error('❌ Error: El usuario o recurso no existe');
          return {
            statusCode: 404,
            body: JSON.stringify({
              error: 'RESOURCE_NOT_FOUND',
              message: 'El usuario o recurso de Instagram no existe',
              details: errorText
            })
          };
        }
        
        if (errorText.includes('rate limit')) {
          console.error('❌ Error: Límite de tasa excedido');
          return {
            statusCode: 429,
            body: JSON.stringify({
              error: 'RATE_LIMIT',
              message: 'Se ha excedido el límite de solicitudes a la API de Instagram',
              details: errorText
            })
          };
        }
        
        // Error genérico si ninguno de los anteriores
        return {
          statusCode: 500,
          body: JSON.stringify({ 
            error: 'API_ERROR',
            message: 'Error al obtener métricas de Instagram Business API',
            details: errorText,
            statusCode: metricsResponse.status
          })
        };
      }
      
      const metricsData = await metricsResponse.json();
      
      // Validar la respuesta de la API
      if (!metricsData) {
        console.error('❌ La respuesta de la API está vacía o es inválida');
        return {
          statusCode: 500,
          body: JSON.stringify({
            error: 'INVALID_RESPONSE',
            message: 'La respuesta de Instagram es inválida o está vacía'
          })
        };
      }
      
      // Extraer datos relevantes
      const businessDiscovery = metricsData.business_discovery;
      
      if (!businessDiscovery) {
        console.error('❌ No se encontraron datos de business discovery en la respuesta');
        console.error('❌ Respuesta recibida:', JSON.stringify(metricsData));
        
        return {
          statusCode: 404,
          body: JSON.stringify({ 
            error: 'NO_DATA',
            message: 'No se encontraron datos de la cuenta en Instagram',
            apiResponse: metricsData
          })
        };
      }
      
      // Procesar datos para la respuesta
      const insights = {
        username: businessDiscovery.username,
        name: businessDiscovery.name,
        profile_picture_url: businessDiscovery.profile_picture_url,
        biography: businessDiscovery.biography,
        website: businessDiscovery.website || "",
        followers_count: businessDiscovery.followers_count || 0,
        follows_count: businessDiscovery.follows_count || 0,
        media_count: businessDiscovery.media_count || 0,
        posts: [],
        metrics: {
          engagement_rate: 0,
          content_types: { image: 0, video: 0, carousel: 0 },
          best_posting_times: { day: "", hour: 0 },
          top_hashtags: [],
          posting_frequency: 0,
          avg_likes_per_post: 0,
          avg_comments_per_post: 0
        }
      };
      
      // Añadir los últimos posts si están disponibles
      let totalLikes = 0;
      let totalComments = 0;
      let totalEngagement = 0;
      const hashtagCounts = {};
      const dayOfWeekCounts = {};
      const hourCounts = {};
      const dayEngagement = {};
      const hourEngagement = {};
      
      if (businessDiscovery.media && businessDiscovery.media.data) {
        const posts = businessDiscovery.media.data;
        
        // Extraer y analizar posts
        insights.posts = posts.map(post => {
          // Extraer hashtags del caption
          const hashtags = [];
          if (post.caption) {
            const hashtagRegex = /#(\w+)/g;
            let match;
            while ((match = hashtagRegex.exec(post.caption)) !== null) {
              hashtags.push(match[1].toLowerCase());
              // Contar hashtags para análisis
              if (!hashtagCounts[match[1].toLowerCase()]) hashtagCounts[match[1].toLowerCase()] = 0;
              hashtagCounts[match[1].toLowerCase()]++;
            }
          }
          
          // Calcular engagement para este post
          const likes = post.like_count || 0;
          const comments = post.comments_count || 0;
          const engagement = likes + comments;
          totalLikes += likes;
          totalComments += comments;
          totalEngagement += engagement;
          
          // Analizar día y hora para mejores tiempos de publicación
          if (post.timestamp) {
            const postDate = new Date(post.timestamp);
            const dayOfWeek = postDate.toLocaleDateString('es-ES', { weekday: 'long' });
            const hour = postDate.getHours();
            
            // Contar publicaciones por día y hora
            if (!dayOfWeekCounts[dayOfWeek]) dayOfWeekCounts[dayOfWeek] = 0;
            if (!hourCounts[hour]) hourCounts[hour] = 0;
            dayOfWeekCounts[dayOfWeek]++;
            hourCounts[hour]++;
            
            // Sumar engagement por día y hora
            if (!dayEngagement[dayOfWeek]) dayEngagement[dayOfWeek] = 0;
            if (!hourEngagement[hour]) hourEngagement[hour] = 0;
            dayEngagement[dayOfWeek] += engagement;
            hourEngagement[hour] += engagement;
          }
          
          // Contar tipo de contenido
          if (post.media_type === 'IMAGE') {
            insights.metrics.content_types.image++;
          } else if (post.media_type === 'VIDEO') {
            insights.metrics.content_types.video++;
          } else if (post.media_type === 'CAROUSEL_ALBUM') {
            insights.metrics.content_types.carousel++;
          }
          
          // Devolver objeto de post enriquecido asegurando que no hay valores undefined
          return {
            id: post.id || '',
            caption: post.caption || '',
            media_type: post.media_type || 'UNKNOWN',
            media_url: post.media_url || '',
            permalink: post.permalink || '',
            thumbnail_url: post.thumbnail_url || null,
            like_count: likes,
            comments_count: comments,
            engagement: engagement,
            engagement_rate: insights.followers_count > 0 ? (engagement / insights.followers_count) * 100 : 0,
            timestamp: post.timestamp || '',
            hashtags: hashtags,
            has_children: post.children ? true : false,
            children_count: post.children ? post.children.data.length : 0
          };
        });
        
        // Calcular métricas agregadas
        if (posts.length > 0) {
          // Engagement general promedio
          insights.metrics.avg_likes_per_post = totalLikes / posts.length;
          insights.metrics.avg_comments_per_post = totalComments / posts.length;
          insights.metrics.engagement_rate = insights.followers_count > 0 
            ? (totalEngagement / (posts.length * insights.followers_count)) * 100 
            : 0;
            
          // Frecuencia de publicación (calcular días entre primera y última publicación)
          if (posts.length >= 2) {
            const oldestPost = new Date(posts[posts.length - 1].timestamp);
            const newestPost = new Date(posts[0].timestamp);
            const daysDiff = (newestPost.getTime() - oldestPost.getTime()) / (1000 * 3600 * 24);
            insights.metrics.posting_frequency = daysDiff > 0 ? posts.length / daysDiff : posts.length;
          }
          
          // Calcular mejores momentos para publicar
          let bestDay = "";
          let bestHour = 0;
          let maxDayEngagement = 0;
          let maxHourEngagement = 0;
          
          for (const day in dayEngagement) {
            const avgEngagement = dayEngagement[day] / dayOfWeekCounts[day];
            if (avgEngagement > maxDayEngagement) {
              maxDayEngagement = avgEngagement;
              bestDay = day;
            }
          }
          
          for (const hour in hourEngagement) {
            const avgEngagement = hourEngagement[hour] / hourCounts[hour];
            if (avgEngagement > maxHourEngagement) {
              maxHourEngagement = avgEngagement;
              bestHour = parseInt(hour);
            }
          }
          
          insights.metrics.best_posting_times = { day: bestDay, hour: bestHour };
          
          // Calcular top hashtags
          const hashtagEntries = Object.entries(hashtagCounts);
          insights.metrics.top_hashtags = hashtagEntries
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([tag, count]) => ({ tag, count }));
        }
      }
      
      // Guardar última actualización y métricas básicas en Firestore
      await instagramTokenRef.update({
        lastSynced: new Date().toISOString(),
        followerCount: insights.followers_count,
        mediaCount: insights.media_count,
        username: insights.username,
        engagementRate: insights.metrics.engagement_rate,
        profilePictureUrl: insights.profile_picture_url || null
      });
      
      console.log(`📊 [Instagram Insights] Métricas obtenidas: ${insights.followers_count} seguidores, ${insights.media_count} posts, Engagement: ${insights.metrics.engagement_rate.toFixed(2)}%`);
      
      // Guardar métricas históricas
      await guardarMetricasHistoricas(userId, insights);
      
      // Limpiar cualquier objeto para asegurar que no haya valores undefined antes de guardar en Firestore
      const insightsForCache = JSON.parse(JSON.stringify(insights));
      
      // Actualizar caché
      const configRef = db.collection('users').doc(userId).collection('config').doc('instagram');
      try {
        await configRef.set({
          ultimaActualizacion: admin.firestore.Timestamp.now(),
          cacheData: insightsForCache
        }, { merge: true });
        console.log('✅ [Instagram Insights] Datos guardados correctamente en caché');
      } catch (cacheError) {
        console.error('❌ [Instagram Insights] Error al guardar en caché:', cacheError);
        // Si hay error al guardar la caché, no interrumpir el flujo principal
      }
      
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