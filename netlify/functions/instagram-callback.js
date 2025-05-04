const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  console.log('Instagram callback function triggered');
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método no permitido' })
    };
  }

  try {
    const { code } = JSON.parse(event.body);
    if (!code) {
      console.log('No se recibió el parámetro code');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Falta el parámetro code' })
      };
    }

    const client_id = process.env.INSTAGRAM_CLIENT_ID || '3029546990541926';
    const client_secret = process.env.INSTAGRAM_CLIENT_SECRET || '5ed60bb513324c22a3ec1db6faf9e92f';
    const redirect_uri = 'https://kalma-lab.netlify.app/auth/instagram/callback';

    console.log('REDIRECT_URI usado en backend:', redirect_uri);
    console.log('Datos enviados a Instagram:', { client_id, redirect_uri });

    const params = new URLSearchParams();
    params.append('client_id', client_id);
    params.append('client_secret', client_secret);
    params.append('grant_type', 'authorization_code');
    params.append('redirect_uri', redirect_uri);
    params.append('code', code);

    const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    const data = await tokenResponse.json();

    console.log('Respuesta de Instagram:', data);

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
    console.error('Error interno en la función serverless:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error interno', details: error.message })
    };
  }
}; 