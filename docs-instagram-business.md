# Configuración del OAuth para Instagram Business API

Este documento explica el flujo completo para conectar cuentas de Instagram Business en Kalma.

## Resumen del flujo

La autenticación para Instagram Business API tiene los siguientes pasos:

1. Obtener token de corta duración de Facebook mediante OAuth
2. Intercambiar por token de larga duración de Facebook (60 días)
3. Obtener las páginas de Facebook del usuario con el token de larga duración
4. Obtener el ID de la cuenta de Instagram Business asociada a la página
5. Guardar el token y el ID para uso posterior

## Variables de entorno necesarias

En el panel de Netlify (Site settings > Environment variables), asegúrate de configurar:

```bash
# ID de la app de Facebook
FACEBOOK_APP_ID=925270751978648

# Secreto de la app de Facebook (¡NO lo incluyas en archivos de código!)
FACEBOOK_APP_SECRET=tu-secreto-aquí

# URL para redirección tras autorización
INSTAGRAM_REDIRECT_URI=https://kalma-lab.netlify.app/.netlify/functions/instagram-callback
```

## Flujo de autenticación paso a paso

### 1. Obtener el token corto de Facebook

Primero redirige al diálogo de autorización de Facebook:

```javascript
const authURL = [
  'https://www.facebook.com/v17.0/dialog/oauth',
  `?client_id=${FACEBOOK_APP_ID}`,
  `&redirect_uri=${encodeURIComponent(INSTAGRAM_REDIRECT_URI)}`,
  '&response_type=code',
  '&scope=pages_show_list,instagram_basic,instagram_manage_comments'
].join('');

window.location.href = authURL;
```

Tras la autorización, Facebook redirige a tu REDIRECT_URI con un parámetro `code`.

Intercambia este código por un token corto:

```bash
curl -i "https://graph.facebook.com/v17.0/oauth/access_token\
?client_id=TU_APP_ID\
&client_secret=TU_APP_SECRET\
&redirect_uri=TU_REDIRECT_URI\
&code=EL_CODIGO_RECIBIDO"
```

### 2. Obtener el token largo de Facebook

A continuación, intercambia el token corto por uno de larga duración:

```bash
curl -i "https://graph.facebook.com/v17.0/oauth/access_token\
?grant_type=fb_exchange_token\
&client_id=TU_APP_ID\
&client_secret=TU_APP_SECRET\
&fb_exchange_token=TU_TOKEN_CORTO"
```

El token largo dura 60 días y es necesario para todas las operaciones futuras.

### 3. Obtener páginas de Facebook del usuario

Con el token largo, obtén las páginas administradas por el usuario:

```bash
curl -i "https://graph.facebook.com/v17.0/me/accounts?access_token=TU_TOKEN_LARGO"
```

Esto devolverá una lista de páginas cada una con:
- `id` - ID de la página
- `access_token` - Token específico de la página
- `name` - Nombre de la página

### 4. Obtener cuenta de Instagram Business

Con el ID de la página y su token, obtén la cuenta de Instagram Business:

```bash
curl -i "https://graph.facebook.com/v17.0/{page_id}?fields=instagram_business_account&access_token={PAGE_TOKEN}"
```

La respuesta incluirá `instagram_business_account.id`, que es el ID de la cuenta de Instagram.

### 5. Usar la API de Instagram Business

Finalmente, puedes usar el ID de Instagram Business y el token de la página para obtener:

- Comentarios:
  ```bash
  curl -i "https://graph.facebook.com/v17.0/{instagram_id}/comments?access_token={PAGE_TOKEN}"
  ```

- Media:
  ```bash
  curl -i "https://graph.facebook.com/v17.0/{instagram_id}/media?access_token={PAGE_TOKEN}"
  ```

## Resolución de problemas

### Error "Cannot parse access token"

Este error ocurre cuando se mezclan los flujos de Instagram Basic Display API y Facebook Graph API. Asegúrate de:

1. Usar `https://graph.facebook.com/v17.0/oauth/access_token` con `grant_type=fb_exchange_token` para obtener el token largo (NO usar graph.instagram.com)
2. Usar el parámetro `fb_exchange_token` (no `access_token`) para pasar el token corto

### Token inválido o expirado

Los tokens de corta duración expiran rápidamente. Si obtienes un error de token inválido:

1. Verifica que estás usando un token recién generado
2. Verifica que el `redirect_uri` coincide exactamente con el registrado en Facebook

## Herramientas de depuración

Puedes probar manualmente el intercambio de tokens usando:

```
https://kalma-lab.netlify.app/.netlify/functions/test-ig-token?token=TU_TOKEN_CORTO&secret=TU_APP_SECRET
```

También puedes usar el [Explorador de Graph API](https://developers.facebook.com/tools/explorer/) para probar tus tokens. 