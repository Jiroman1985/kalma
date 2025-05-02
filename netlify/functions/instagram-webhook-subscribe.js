const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método no permitido' })
    };
  }

  try {
    const { userId, instagramUserId, accessToken } = JSON.parse(event.body);
    if (!userId || !instagramUserId || !accessToken) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Faltan parámetros requeridos' })
      };
    }

    // Suscribir la cuenta al webhook usando la API de Instagram Graph
    const response = await fetch(`https://graph.facebook.com/v18.0/${instagramUserId}/subscribed_apps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: accessToken })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Error al suscribir al webhook', details: data })
      };
    }

    // Puedes guardar la suscripción en una base de datos aquí si lo necesitas

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, data })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error interno', details: error.message })
    };
  }
}; 