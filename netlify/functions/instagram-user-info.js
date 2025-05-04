const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  console.log('Instagram user info function triggered');
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método no permitido' })
    };
  }

  try {
    const { access_token, user_id } = JSON.parse(event.body);
    
    if (!access_token || !user_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Faltan parámetros requeridos: access_token o user_id' })
      };
    }

    console.log('Solicitando información de usuario con ID:', user_id);

    // 1. Primero obtenemos información básica del usuario 
    const userResponse = await fetch(
      `https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${access_token}`
    );

    if (!userResponse.ok) {
      const errorData = await userResponse.text();
      console.error('Error en respuesta de Instagram:', errorData);
      return {
        statusCode: userResponse.status,
        body: JSON.stringify({ error: 'Error al obtener información del usuario', details: errorData })
      };
    }

    const userData = await userResponse.json();
    console.log('Información básica de usuario obtenida:', userData);

    // 2. Obtener información adicional, incluidas las cuentas de negocio si están disponibles
    let extendedInfo = {};
    try {
      const longLivedTokenResponse = await fetch(
        `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${process.env.INSTAGRAM_CLIENT_SECRET}&access_token=${access_token}`
      );
      
      if (longLivedTokenResponse.ok) {
        const tokenData = await longLivedTokenResponse.json();
        console.log('Token de larga duración obtenido');
        
        // Obtener información del perfil usando el token de larga duración
        const profileResponse = await fetch(
          `https://graph.instagram.com/me?fields=account_type,id,username,media_count,media{id,caption,media_type,media_url,thumbnail_url,permalink,timestamp}&access_token=${tokenData.access_token}`
        );
        
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          extendedInfo = profileData;
          console.log('Información extendida del perfil obtenida');
        } else {
          console.warn('No se pudo obtener información extendida del perfil');
        }
      }
    } catch (error) {
      console.warn('Error al obtener información extendida:', error.message);
      // Continuamos con la información básica que ya tenemos
    }

    // 3. Construir objeto de respuesta combinando la información básica y extendida
    const fullUserData = {
      ...userData,
      ...extendedInfo,
      // Datos simulados para los campos que la API básica no proporciona
      followers_count: extendedInfo.followers_count || 0,
      profile_picture_url: extendedInfo.profile_picture_url || null,
      // Aseguramos que el username esté disponible
      username: userData.username || extendedInfo.username || "instagram_user"
    };

    console.log('Datos completos del usuario a devolver:', {
      id: fullUserData.id,
      username: fullUserData.username,
      account_type: fullUserData.account_type
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullUserData)
    };
  } catch (error) {
    console.error('Error interno en función de información de usuario:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error interno del servidor', details: error.message })
    };
  }
}; 