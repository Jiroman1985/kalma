// Script de prueba para intercambiar un token corto de Facebook por un token largo de Facebook
// para usar con Instagram Business API
const fetch = require('node-fetch');

exports.handler = async (event) => {
  console.log('Script de prueba para tokens de Facebook/Instagram Business');
  
  // Parámetros esperados: token (token corto de Facebook), secret (app secret de Facebook), client_id
  const { token, secret, client_id } = event.queryStringParameters || {};
  const appId = client_id || '925270751978648'; // Usa el proporcionado o el default
  
  if (!token || !secret) {
    return {
      statusCode: 400,
      body: JSON.stringify({ 
        error: 'Faltan parámetros requeridos', 
        mensaje: 'Debes proporcionar token y secret como query params' 
      })
    };
  }
  
  try {
    console.log(`Probando intercambio con token corto de ${token.length} caracteres`);
    console.log(`Primeros 5 caracteres del token: ${token.substring(0, 5)}...`);
    
    // Validación básica del token
    if (token.length < 50) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Token demasiado corto', 
          mensaje: `El token de Facebook debe tener más de 50 caracteres. El proporcionado tiene ${token.length} caracteres.` 
        })
      };
    }
    
    // Intentar el intercambio por token largo de Facebook
    console.log('Llamando a la API de Facebook para intercambiar token...');
    const response = await fetch(`https://graph.facebook.com/v17.0/oauth/access_token?` + 
      new URLSearchParams({
        grant_type: 'fb_exchange_token',
        client_id: appId,
        client_secret: secret,
        fb_exchange_token: token
      }));
    
    // Capturar tanto el status code como el body completo para diagnóstico
    const statusCode = response.status;
    let responseText;
    
    try {
      responseText = await response.text();
    } catch (e) {
      responseText = `Error al leer respuesta: ${e.message}`;
    }
    
    // Intentar parsear como JSON si es posible
    let responseData = null;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      // Si no es JSON, dejamos responseData como null
    }
    
    // Si fue exitoso y tenemos un token, mostrar información sobre siguientes pasos
    let nextSteps = null;
    if (statusCode === 200 && responseData && responseData.access_token) {
      nextSteps = {
        paso1: "Obtener páginas de Facebook usando este token largo:",
        curl1: `curl -i "https://graph.facebook.com/v17.0/me/accounts?access_token=${responseData.access_token.substring(0, 5)}...RECORTADO"`,
        paso2: "Luego, obtener la cuenta de Instagram Business asociada a la página:",
        curl2: "curl -i \"https://graph.facebook.com/v17.0/{page_id}?fields=instagram_business_account&access_token={PAGE_TOKEN}\""
      };
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        resultado: statusCode === 200 ? 'éxito' : 'error',
        statusCode,
        responseData,
        responseText: responseData ? null : responseText,
        tokenLength: token.length,
        tokenPreview: token.substring(0, 5) + '...' + token.substring(token.length - 5),
        nextSteps
      }, null, 2)
    };
  } catch (error) {
    console.error('Error en test de token:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Error interno', 
        mensaje: error.message,
        stack: error.stack
      })
    };
  }
}; 