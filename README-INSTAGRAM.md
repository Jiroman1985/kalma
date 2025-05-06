# Integración con Instagram Business API

Este documento explica en detalle el flujo completo de autenticación y uso de la API de Instagram Business en Kalma.

## Arquitectura del flujo OAuth

La autenticación con Instagram Business requiere varios pasos debido a que necesitamos:

1. Un token de usuario de Facebook (corto)
2. Un token específico de Instagram (largo)
3. Identificar las páginas de Facebook administradas por el usuario
4. Obtener la cuenta de Instagram Business asociada a una página

## Flujo de autenticación paso a paso

### 1. Redirección inicial a diálogo de Facebook

El usuario inicia el proceso haciendo clic en "Conectar Instagram" lo que lo lleva a:

```
https://www.facebook.com/v17.0/dialog/oauth
  ?client_id={FACEBOOK_APP_ID}
  &redirect_uri={INSTAGRAM_REDIRECT_URI}
  &scope=pages_show_list,instagram_basic,instagram_manage_comments
  &response_type=code
  &state={STATE_DATA}
```

### 2. Callback y procesamiento en el backend

Tras la autorización, Facebook redirige a `/.netlify/functions/instagram-callback` con un `code`.

La función serverless realiza estos pasos:

1. **Obtener token de corta duración de Facebook**
   ```
   GET https://graph.facebook.com/v17.0/oauth/access_token
     ?client_id={FACEBOOK_APP_ID}
     &redirect_uri={INSTAGRAM_REDIRECT_URI}
     &client_secret={FACEBOOK_APP_SECRET}
     &code={CODE}
   ```
   
   ⚠️ **IMPORTANTE**: El token obtenido en este paso (FB short-lived token) es el que debe
   usarse para intercambiar por el token de Instagram en el paso 3.

2. **Intercambiar por token de larga duración de Facebook** (opcional, para uso de Facebook)
   ```
   GET https://graph.facebook.com/v17.0/oauth/access_token
     ?grant_type=fb_exchange_token
     &client_id={FACEBOOK_APP_ID}
     &client_secret={FACEBOOK_APP_SECRET}
     &fb_exchange_token={FB_SHORT_TOKEN}
   ```

3. **Obtener token específico de Instagram** (usando el token corto de Facebook)
   ```
   GET https://graph.instagram.com/access_token
     ?grant_type=ig_exchange_token
     &client_secret={FACEBOOK_APP_SECRET}
     &access_token={FB_SHORT_TOKEN}
   ```

4. **Obtener páginas de Facebook e identificar Instagram Business**
   ```
   GET https://graph.facebook.com/v17.0/me/accounts
     ?access_token={FB_TOKEN}
     &fields=name,instagram_business_account
   ```
   Nota: Aquí puede usarse tanto el token corto como el largo de Facebook.

5. **Guardar toda la información en Firestore**
   ```
   /users/{userId}/socialNetworks/instagram
   ```

### 3. Confirmación al usuario y redirección

Finalmente, se redirige al usuario a la página de éxito:
```
/auth/instagram/success?userId={USER_ID}&instagramId={INSTAGRAM_ID}
```

## Estructura de datos en Firestore

Los datos se guardan en `/users/{userId}/socialNetworks/instagram` con esta estructura:

```json
{
  "fbAccessToken": "EAAxxxx...",        // Token de Facebook
  "fbTokenExpiresAt": 1234567890000,    // Timestamp expiración FB
  "igAccessToken": "IGQxxxx...",        // Token específico Instagram
  "igTokenExpiresAt": 1234567890000,    // Timestamp expiración IG
  "instagramBusinessId": "1784140xxxx", // ID cuenta Instagram Business
  "pageId": "1234567890",               // ID página Facebook asociada
  "pageName": "Mi Página",              // Nombre de la página
  "pageAccessToken": "EAAxxxx...",      // Token de acceso a la página
  "connected": true,                    // Indica conexión activa
  "connectionType": "business",         // Tipo de conexión
  "obtainedAt": 1234567890000,          // Timestamp creación 
  "lastUpdated": 1234567890000,         // Última actualización
  "isValid": true                       // Validez del token
}
```

## Tipos de conexión

Se pueden tener distintos niveles de conexión:

1. **business**: Conexión completa con todos los datos
2. **incomplete**: Conexión parcial (faltan algunos datos)

## Posibles problemas y soluciones

### 1. "Cannot parse access token"

Este error ocurre cuando:
- Se usa un endpoint incorrecto (usar siempre los indicados arriba)
- El token FB ha expirado antes de intercambiarlo
- Fallo al hacer el intercambio con parámetros incorrectos

### 2. No se encuentra Instagram Business asociado

Posibles causas:
- El usuario no tiene una cuenta de Instagram Business
- La página de Facebook no está vinculada con Instagram Business
- Falta el permiso `instagram_basic` en el scope

### 3. Error 401 en las peticiones a la API

Posibles causas:
- Token expirado
- Token con permisos insuficientes
- El usuario ha revocado los permisos

## Cómo verificar una conexión correcta

1. Confirmar que `connected` es `true` en Firestore
2. Verificar que `connectionType` es `business`
3. Confirmar presencia de `instagramBusinessId` y `fbAccessToken`
4. Verificar fechas de expiración (`fbTokenExpiresAt`, `igTokenExpiresAt`)

## Comandos curl para debugging

Verificar token de Facebook:
```bash
curl -i "https://graph.facebook.com/debug_token?input_token={FB_TOKEN}&access_token={FB_TOKEN}"
```

Obtener páginas:
```bash
curl -i "https://graph.facebook.com/v17.0/me/accounts?access_token={FB_TOKEN}"
```

Verificar Instagram Business:
```bash
curl -i "https://graph.facebook.com/v17.0/{PAGE_ID}?fields=instagram_business_account&access_token={PAGE_TOKEN}"
```

## Variables de entorno necesarias

En Netlify deben configurarse estas variables:

```
FACEBOOK_APP_ID=925270751978648
FACEBOOK_APP_SECRET=[valor secreto]
INSTAGRAM_REDIRECT_URI=https://kalma-lab.netlify.app/.netlify/functions/instagram-callback
```

## Renovación de tokens

Los tokens de larga duración expiran cada 60 días. Se debe implementar un proceso de renovación:

```
GET https://graph.instagram.com/refresh_access_token
  ?grant_type=ig_refresh_token
  &access_token={IG_LONG_TOKEN}
``` 