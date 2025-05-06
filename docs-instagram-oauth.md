# Configuración del OAuth de Facebook/Instagram

Este documento explica cómo configurar correctamente la autenticación OAuth para conectar cuentas de Instagram en Kalma.

## Variables de entorno necesarias

En el panel de Netlify (Site settings > Environment variables), asegúrate de configurar las siguientes variables:

```bash
# ID de la app de Facebook
FACEBOOK_APP_ID=925270751978648

# Secreto de la app de Facebook (¡NO lo incluyas en archivos de código!)
FACEBOOK_APP_SECRET=tu-secreto-aquí

# URL exacta que recibirá el callback con el código
INSTAGRAM_REDIRECT_URI=https://kalma-lab.netlify.app/.netlify/functions/instagram-callback
```

## Flujo de autenticación

1. El usuario accede a la página `/auth/instagram/start`
2. Es redirigido a Facebook para autorizar la conexión con Instagram
3. Tras la autorización, Facebook redirige a la URL de callback con un `code`
4. La función serverless intercambia el código por un token de Facebook
5. Ese token se intercambia por un token de larga duración de Instagram
6. El token se guarda en Firestore y el usuario es redirigido al frontend

## Solución de problemas comunes

### Error: "Invalid OAuth access token – Cannot parse access token"

Este error ocurre cuando hay un problema al intercambiar el token de Facebook por el token de Instagram. Asegúrate de:

1. Usar `https://graph.instagram.com/access_token` (no graph.facebook.com)
2. Usar el parámetro `grant_type=ig_exchange_token`
3. Usar `client_secret` con el valor de `FACEBOOK_APP_SECRET` (no INSTAGRAM_APP_SECRET)
4. Pasar correctamente el token de Facebook en `access_token`

### Verificación con curl

Para probar el intercambio de tokens directamente:

```bash
# Obtener token de Facebook con el código
curl -i "https://graph.facebook.com/v17.0/oauth/access_token\
?client_id=TU_FACEBOOK_APP_ID\
&redirect_uri=TU_REDIRECT_URI\
&client_secret=TU_FACEBOOK_APP_SECRET\
&code=EL_CODIGO_RECIBIDO"

# Intercambiar por token de Instagram
curl -i "https://graph.instagram.com/access_token\
?grant_type=ig_exchange_token\
&client_secret=TU_FACEBOOK_APP_SECRET\
&access_token=TOKEN_FB_OBTENIDO"
```

## Actualización del token (opcional)

Los tokens de Instagram expiran después de 60 días. Para refrescarlos antes de que expiren, puedes llamar a:

```bash
curl -i "https://graph.instagram.com/refresh_access_token\
?grant_type=ig_refresh_token\
&access_token=TU_TOKEN_INSTAGRAM"
``` 