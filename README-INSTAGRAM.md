# Integración con Instagram Business API

Este documento explica en detalle el flujo completo de autenticación y uso de la API de Instagram Business en Kalma.

## Arquitectura del flujo OAuth

La autenticación con Instagram Business requiere varios pasos:

1. Un token de usuario de Facebook (corto)
2. Un token de usuario de Facebook (largo)
3. Identificar las páginas de Facebook administradas por el usuario
4. Obtener el token de página y la cuenta de Instagram Business asociada

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

1. **Obtener token de corta duración de Facebook (FB short-lived token)**
   ```
   GET https://graph.facebook.com/v17.0/oauth/access_token
     ?client_id={FACEBOOK_APP_ID}
     &redirect_uri={INSTAGRAM_REDIRECT_URI}
     &client_secret={FACEBOOK_APP_SECRET}
     &code={CODE}
   ```

2. **Intercambiar por token de larga duración de Facebook (FB long-lived token)**
   ```
   GET https://graph.facebook.com/v17.0/oauth/access_token
     ?grant_type=fb_exchange_token
     &client_id={FACEBOOK_APP_ID}
     &client_secret={FACEBOOK_APP_SECRET}
     &fb_exchange_token={FB_SHORT_TOKEN}
   ```

3. **Obtener páginas de Facebook con sus tokens de acceso e identificar Instagram Business**
   ```
   GET https://graph.facebook.com/v17.0/me/accounts
     ?access_token={FB_LONG_TOKEN}
     &fields=name,instagram_business_account,access_token
   ```
   
   ⚠️ **IMPORTANTE**: A diferencia de la Instagram Basic Display API, para Instagram Business API 
   NO se necesita obtener un token específico de Instagram. 
   En su lugar, usamos el token de página de Facebook (PAGE_TOKEN) para todas las 
   llamadas a la Instagram Graph API.

4. **Guardar datos importantes en Firestore**
   ```
   /users/{userId}/socialTokens/instagram
   {
     accessToken: "{PAGE_TOKEN}",         // Token de PÁGINA de Facebook 
     instagramUserId: "{IG_BUSINESS_ID}", // ID de la cuenta de Instagram Business
     tokenExpiry: 5184000000,             // ~60 días en milisegundos
     lastSynced: "2023-06-01T12:00:00Z"   // Fecha ISO
   }
   ```

### 3. Confirmación al usuario y redirección

Finalmente, se redirige al usuario a la página de éxito:
```
/auth/instagram/success?userId={USER_ID}&instagramId={INSTAGRAM_ID}
```

## Estructura de datos en Firestore

La información de la conexión con Instagram se guarda en dos ubicaciones:

1. **Estructura principal (actual):**
   ```
   /users/{userId}/socialTokens/instagram
   {
     accessToken: "{PAGE_TOKEN}",
     instagramUserId: "{IG_BUSINESS_ID}",
     tokenExpiry: 5184000000,
     lastSynced: "2023-06-01T12:00:00Z"
   }
   ```

2. **Estructura legacy (para compatibilidad):**
   ```
   /users/{userId}/socialNetworks/instagram
   {
     fbAccessToken: "{FB_LONG_TOKEN}",
     fbTokenExpiresAt: 1678900000000,
     instagramBusinessId: "{IG_BUSINESS_ID}",
     pageId: "{PAGE_ID}",
     pageName: "Nombre de la Página",
     pageAccessToken: "{PAGE_TOKEN}", 
     connectionType: "business",
     connected: true,
     isValid: true,
     obtainedAt: 1676300000000,
     lastUpdated: 1676300000000
   }
   ```

## Consumo de la API desde el frontend

### Ejemplos de uso

Para obtener los posts de Instagram:

```javascript
// Obtener datos de Firestore
const instagramDoc = await getDoc(doc(db, 'users', userId, 'socialTokens', 'instagram'));
const instagramData = instagramDoc.data();

// Usar el token de página para llamar a la API de Instagram
const igPosts = await fetch(
  `https://graph.instagram.com/${instagramData.instagramUserId}/media?` +
  `fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&` +
  `access_token=${instagramData.accessToken}`
).then(res => res.json());

console.log('Posts de Instagram:', igPosts.data);
```

## Problemas comunes

1. **Error "Cannot parse access token"** - Este error puede ocurrir si estás tratando de usar un token incorrecto. Para Instagram Business API, usa siempre el token de página de Facebook, NO intentes intercambiarlo por un token de Instagram.

2. **Error 404 en rutas anidadas** - Si el dashboard muestra 404 tras la autenticación, verifica que:
   - La ruta de redirección existe en tu aplicación (debe ser `/dashboard/channels`, no `/dashboard/canales`)
   - El archivo `_redirects` está correctamente configurado en Netlify

3. **No se muestran datos de Instagram** - Verifica que:
   - El token de página está guardado como `accessToken`
   - El ID de Instagram Business está guardado como `instagramUserId`
   - La cuenta de Instagram está vinculada a una página de Facebook
   - La cuenta de Instagram es de tipo Business

## Variables de entorno

Las siguientes variables son necesarias en Netlify:

```
FACEBOOK_APP_ID=XXXXXX
FACEBOOK_APP_SECRET=XXXXXX
INSTAGRAM_REDIRECT_URI=https://kalma-lab.netlify.app/.netlify/functions/instagram-callback
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

## Renovación de tokens

Los tokens de larga duración expiran cada 60 días. Se debe implementar un proceso de renovación:

```
GET https://graph.instagram.com/refresh_access_token
  ?grant_type=ig_refresh_token
  &access_token={IG_LONG_TOKEN}
``` 