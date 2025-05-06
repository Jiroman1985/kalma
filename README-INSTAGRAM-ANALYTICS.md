# Integración de Instagram en Analytics

Este documento explica cómo funciona la integración entre Instagram y el panel de Analytics de Kalma.

## Arquitectura de la integración

El flujo completo para mostrar datos de Instagram en Analytics consta de tres componentes principales:

1. **Almacenamiento de tokens** - Los tokens de acceso y el ID de Instagram se guardan en Firestore después de la autenticación con Facebook/Instagram.

2. **API de Instagram Insights** - Un endpoint serverless en Netlify que consulta la API de Instagram Business y devuelve métricas formateadas.

3. **Componente InstagramMetrics** - Un componente de React que muestra las métricas obtenidas y gestiona los estados de conexión.

## Datos almacenados en Firestore

Después de completar la autenticación, se guardan estos datos en:

```
/users/{userId}/socialTokens/instagram
```

Los datos almacenados incluyen:
- `accessToken`: Token de página de Facebook (válido para Instagram Business API)
- `instagramUserId`: ID de la cuenta de Instagram Business
- `tokenExpiry`: Timestamp de cuando expira el token (60 días)
- `username`: Nombre de usuario de Instagram (si está disponible)
- `lastSynced`: Fecha y hora de la última sincronización
- `followerCount`: Último número de seguidores conocido
- `mediaCount`: Último número de publicaciones conocido

## API de Instagram Insights

Se ha implementado un endpoint serverless en:

```
/.netlify/functions/instagram-insights
```

### Parámetros

- `userId` (requerido): ID del usuario
- `username` (opcional): Nombre de usuario de Instagram para Business Discovery

### Respuesta

Devuelve un objeto JSON con datos de la cuenta de Instagram:

```json
{
  "username": "nombre_de_cuenta",
  "name": "Nombre Completo",
  "profile_picture_url": "https://...",
  "biography": "Descripción del perfil",
  "followers_count": 1234,
  "follows_count": 567,
  "media_count": 89,
  "posts": [
    {
      "id": "id_del_post",
      "media_type": "IMAGE",
      "permalink": "https://instagram.com/p/...",
      "like_count": 45,
      "comments_count": 12,
      "timestamp": "2023-05-15T12:30:00+0000"
    },
    // Más posts...
  ]
}
```

### Códigos de estado

- `200`: Éxito, devuelve los datos
- `400`: Faltan parámetros requeridos o datos incompletos
- `401`: Token expirado o inválido
- `403`: Problemas de permisos (cuenta no es Business)
- `404`: No se encontraron datos
- `500`: Error interno del servidor

### Ejemplo de uso

```javascript
// En un componente de React
const fetchInsights = async (userId) => {
  try {
    const response = await fetch(`/.netlify/functions/instagram-insights?userId=${userId}`);
    
    if (!response.ok) {
      const error = await response.json();
      if (error.error === 'TOKEN_EXPIRED') {
        // Mostrar mensaje para reconectar
      }
      throw new Error(error.message);
    }
    
    const data = await response.json();
    // Usar los datos para actualizar la UI
  } catch (error) {
    console.error('Error:', error);
  }
};
```

## Flujo en la UI

### Componente Channels

1. **Verificación de conexión**: Al cargar, verifica si existe una conexión activa con Instagram.
2. **Estado de conexión**: Muestra "Conectado" o "Expirado" según el estado.
3. **Botones contextuales**:
   - "Conectar" (si no hay conexión)
   - "Cambiar cuenta" (si hay conexión activa)
   - "Reconectar" (si el token expiró)

### Componente InstagramMetrics

1. **Verificación de conexión**: Al cargar, verifica si hay tokens válidos.
2. **Estados de conexión**:
   - `loading`: Cargando datos
   - `connected`: Conectado y con datos
   - `disconnected`: Sin conexión
   - `expired`: Token expirado
   - `error`: Error en la conexión
3. **Métricas**: Muestra métricas reales cuando está conectado:
   - Número de seguidores
   - Número de publicaciones
   - Engagement por publicación
   - Gráficos de crecimiento

## Reconexión de cuenta

Cuando un token expira (después de aproximadamente 60 días), el usuario debe reconectar su cuenta:

1. Se muestra un mensaje de "Token expirado" en Analytics
2. El usuario hace clic en "Reconectar" en el panel de Canales
3. Se ejecuta la función `disconnectInstagram()` que:
   - Marca el token como inválido
   - Actualiza el estado en la UI
4. El usuario es redirigido al flujo de autenticación de Facebook/Instagram
5. Después de la autenticación, se guardan los nuevos tokens
6. Al volver a Analytics, se muestran los datos actualizados

## Manejo de errores

- **Token expirado**: Se muestra un mensaje para reconectar
- **Cuenta no conectada**: Se muestra un botón para conectar
- **Errores de API**: Se muestra un mensaje genérico con opción para reintentar
- **Sin datos**: Se muestran gráficos vacíos o mensajes informativos

## Consideraciones de seguridad

- Los tokens de acceso solo se almacenan en Firestore con reglas de seguridad
- Las llamadas a la API se realizan desde funciones serverless, nunca desde el cliente
- Los tokens expirados se marcan como inválidos para evitar su uso

## Mejoras futuras

- Implementar renovación automática de tokens
- Añadir más métricas de engagement
- Mostrar análisis de mejores horarios para publicar
- Añadir notificaciones de crecimiento o caídas significativas 