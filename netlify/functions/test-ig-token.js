// Script de prueba para intercambiar un token corto de Facebook por un token largo de Instagram
const fetch = require('node-fetch');

exports.handler = async (event) => {
  console.log('Script de prueba para tokens de Instagram');
  
  // Parámetros esperados: token (token corto de Facebook), secret (app secret de Facebook)
  const { token, secret } = event.queryStringParameters || {};
  
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
    
    // Intentar el intercambio por token largo de Instagram
    console.log('Llamando a la API de Instagram para intercambiar token...');
    const response = await fetch(`https://graph.instagram.com/access_token?` + 
      new URLSearchParams({
        grant_type: 'ig_exchange_token',
        client_secret: secret,
        access_token: token
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
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        resultado: statusCode === 200 ? 'éxito' : 'error',
        statusCode,
        responseData,
        responseText: responseData ? null : responseText,
        tokenLength: token.length,
        tokenPreview: token.substring(0, 5) + '...' + token.substring(token.length - 5)
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