const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const REDIRECT_URI = process.env.URL_GOOGLE + '/auth/gmail/callback';
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify'
];

exports.handler = async function(event, context) {
  console.log('Iniciando flujo de autenticación de Gmail');
  
  // Verificar si existe el ID del cliente
  if (!GOOGLE_CLIENT_ID) {
    console.error('No se ha configurado GOOGLE_CLIENT_ID en las variables de entorno');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'No se ha configurado GOOGLE_CLIENT_ID en las variables de entorno' })
    };
  }

  try {
    // Obtener userId de la query (pasado desde el frontend)
    const { userId } = event.queryStringParameters || {};
    
    if (!userId) {
      console.error('Se requiere userId para la autenticación');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Se requiere userId para la autenticación' })
      };
    }
    
    console.log('Iniciando autenticación para el usuario:', userId);
    console.log('URL de redirección configurada:', REDIRECT_URI);

    // Crear estado para seguridad que incluye userId para mantener la referencia
    const state = Buffer.from(JSON.stringify({ userId })).toString('base64');
    
    // Construir URL de autorización
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.append('client_id', GOOGLE_CLIENT_ID);
    authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', SCOPES.join(' '));
    authUrl.searchParams.append('access_type', 'offline');
    authUrl.searchParams.append('prompt', 'consent');
    authUrl.searchParams.append('state', state);

    console.log('URL de autorización generada:', authUrl.toString().replace(GOOGLE_CLIENT_ID, 'CLIENT_ID_CENSURADO'));
    
    // Redireccionar a la URL de autorización
    return {
      statusCode: 302,
      headers: {
        Location: authUrl.toString(),
        'Cache-Control': 'no-cache'
      },
      body: ''
    };
  } catch (error) {
    console.error('Error al iniciar la autenticación de Gmail:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error al iniciar la autenticación de Gmail' })
    };
  }
}; 