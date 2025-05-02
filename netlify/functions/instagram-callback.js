const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método no permitido' })
    };
  }

  try {
    const { code } = JSON.parse(event.body);
    if (!code) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Falta el parámetro code' })
      };
    }

    const client_id = process.env.INSTAGRAM_CLIENT_ID;
    const client_secret = process.env.INSTAGRAM_CLIENT_SECRET;
    const redirect_uri = process.env.INSTAGRAM_REDIRECT_URI;

    const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id,
        client_secret,
        grant_type: 'authorization_code',
        redirect_uri,
        code
      })
    });

    const data = await tokenResponse.json();

    if (data.error_type || data.error_message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: data.error_message || 'Error de Instagram', details: data })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error interno', details: error.message })
    };
  }
}; 