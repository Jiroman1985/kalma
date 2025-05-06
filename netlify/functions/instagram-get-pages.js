// Función para obtener las páginas de Facebook del usuario y sus cuentas de Instagram Business
const fetch = require('node-fetch');
const admin = require('firebase-admin');

// Control de inicialización de Firebase
let firebaseInitialized = false;
let db = null;

// Inicializar Firebase Admin
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
    else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      console.log('Inicializando Firebase usando credenciales JSON');
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } 
    else {
      console.warn('ADVERTENCIA: No se encontraron credenciales Firebase. Usando objeto vacío para desarrollo local.');
      serviceAccount = {};
    }
    
    if (!serviceAccount.project_id) {
      console.error('ERROR: Las credenciales de Firebase no contienen project_id');
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
  }
}

exports.handler = async (event) => {
  console.log('Función instagram-get-pages invocada');
  
  // Esta función requiere userId y puede ser llamada después de obtener el token
  // o como un paso separado más adelante
  const { userId } = event.queryStringParameters || {};
  
  if (!userId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Falta el parámetro userId' })
    };
  }
  
  try {
    // Verificar si Firebase está disponible
    if (!firebaseInitialized || !db) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Firebase no está inicializado correctamente' })
      };
    }
    
    // Obtener el token de FB de la base de datos
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Usuario no encontrado' })
      };
    }
    
    const userData = userDoc.data();
    
    // Verificar que el usuario tenga datos de Instagram/Facebook
    if (!userData.socialNetworks || !userData.socialNetworks.instagram || 
        !userData.socialNetworks.instagram.accessToken) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'El usuario no tiene un token de Facebook para Instagram',
          needsAuth: true 
        })
      };
    }
    
    const fbToken = userData.socialNetworks.instagram.accessToken;
    
    // 1. Obtener las páginas de Facebook del usuario
    console.log('Obteniendo páginas de Facebook...');
    const pagesResponse = await fetch(`https://graph.facebook.com/v17.0/me/accounts?access_token=${fbToken}`);
    
    if (!pagesResponse.ok) {
      const errorText = await pagesResponse.text();
      console.error('Error al obtener páginas de Facebook:', errorText);
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Error al obtener páginas de Facebook', 
          details: errorText,
          needsAuth: true // Probablemente necesita renovar la autorización
        })
      };
    }
    
    const pagesData = await pagesResponse.json();
    console.log(`Se encontraron ${pagesData.data?.length || 0} páginas de Facebook`);
    
    if (!pagesData.data || pagesData.data.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ 
          error: 'No se encontraron páginas de Facebook', 
          pages: [] 
        })
      };
    }
    
    // Array para almacenar páginas e info de Instagram
    const pagesWithInstagram = [];
    
    // 2. Para cada página, intentar obtener la cuenta de Instagram Business asociada
    for (const page of pagesData.data) {
      console.log(`Procesando página: ${page.name} (ID: ${page.id})`);
      const pageWithIG = {
        id: page.id,
        name: page.name,
        accessToken: page.access_token,
        category: page.category,
        hasInstagram: false
      };
      
      try {
        // Consultar si la página tiene una cuenta de Instagram Business asociada
        const igResponse = await fetch(
          `https://graph.facebook.com/v17.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
        );
        
        if (igResponse.ok) {
          const igData = await igResponse.json();
          
          if (igData.instagram_business_account && igData.instagram_business_account.id) {
            pageWithIG.hasInstagram = true;
            pageWithIG.instagramBusinessAccountId = igData.instagram_business_account.id;
            
            // Intentar obtener información adicional de la cuenta de Instagram
            try {
              const igInfoResponse = await fetch(
                `https://graph.facebook.com/v17.0/${igData.instagram_business_account.id}?fields=username,profile_picture_url,name&access_token=${page.access_token}`
              );
              
              if (igInfoResponse.ok) {
                const igInfoData = await igInfoResponse.json();
                pageWithIG.instagramUsername = igInfoData.username;
                pageWithIG.instagramProfilePicture = igInfoData.profile_picture_url;
                pageWithIG.instagramName = igInfoData.name;
              }
            } catch (igInfoError) {
              console.error('Error al obtener información adicional de Instagram:', igInfoError);
            }
          }
        }
      } catch (igError) {
        console.error(`Error al verificar cuenta de Instagram para página ${page.id}:`, igError);
      }
      
      pagesWithInstagram.push(pageWithIG);
    }
    
    // 3. Guardar la información en Firestore para uso futuro
    try {
      // Actualizar la info de Instagram del usuario con páginas encontradas
      await userRef.update({
        'socialNetworks.instagram.pages': pagesWithInstagram,
        'socialNetworks.instagram.lastPagesSyncAt': Date.now()
      });
      
      console.log('Información de páginas guardada en Firestore');
    } catch (updateError) {
      console.error('Error al guardar información de páginas en Firestore:', updateError);
    }
    
    // 4. Devolver la lista de páginas con sus cuentas de Instagram
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        pages: pagesWithInstagram,
        instagramPages: pagesWithInstagram.filter(page => page.hasInstagram)
      })
    };
    
  } catch (error) {
    console.error('Error general en instagram-get-pages:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Error interno del servidor', 
        details: error.message 
      })
    };
  }
}; 