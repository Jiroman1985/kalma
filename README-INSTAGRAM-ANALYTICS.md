# Análisis y Métricas de Instagram en Kalma

Este documento describe en detalle las capacidades de análisis de Instagram Business implementadas en Kalma. La integración proporciona una visión completa del rendimiento de la cuenta de Instagram, con métricas avanzadas y recomendaciones personalizadas.

## Métricas disponibles

### Métricas básicas
- **Número de seguidores**: Total de seguidores de la cuenta
- **Número de seguidos**: Cuentas que sigue el usuario
- **Publicaciones totales**: Cantidad de posts publicados
- **Engagement rate**: Tasa de interacción promedio (likes + comentarios / seguidores * 100)

### Métricas avanzadas
- **Engagement por publicación**: Desglose del engagement individual de cada post
- **Tipos de contenido**: Distribución entre fotos, videos y carruseles
- **Mejores momentos para publicar**: Análisis de días y horas con mayor engagement
- **Hashtags más efectivos**: Análisis de los hashtags más utilizados
- **Frecuencia de publicación**: Promedio de publicaciones por día

## Visualizaciones

La plataforma ofrece varias visualizaciones para interpretar mejor los datos:

1. **Gráfico de tendencia de seguidores**: Evolución del número de seguidores
2. **Gráfico de engagement**: Engagement de las últimas publicaciones
3. **Gráfico circular de tipos de contenido**: Distribución de fotos, videos y carruseles
4. **Gráfico de barras de hashtags**: Los hashtags más utilizados y su frecuencia
5. **Gráfico de horas óptimas**: Las mejores horas del día para publicar

## Recomendaciones inteligentes

El sistema analiza los datos para ofrecer recomendaciones personalizadas:

- **Optimización de engagement**: Sugerencias para aumentar la tasa de interacción
- **Mejores momentos para publicar**: Recomendaciones sobre cuándo publicar para maximizar el alcance
- **Estrategia de hashtags**: Sugerencias sobre los hashtags más efectivos
- **Balance de contenido**: Recomendaciones sobre qué tipos de contenido priorizar

## Implementación técnica

### API de Instagram Business

La integración utiliza la API de Instagram Business a través de Graph API de Facebook:

```
GET https://graph.facebook.com/v17.0/{igUserId}
  ?fields=business_discovery.username({username}){
    username,name,profile_picture_url,biography,website,follows_count,followers_count,
    media_count,media.limit(25){id,caption,media_type,media_url,permalink,
    thumbnail_url,timestamp,like_count,comments_count,children{media_url,media_type}}
  }
  &access_token={pageAccessToken}
```

### Endpoint de Insights

El endpoint `instagram-insights` realiza las siguientes funciones:

1. Verifica la validez del token de acceso
2. Obtiene datos básicos del perfil y publicaciones recientes
3. Calcula métricas avanzadas (engagement, mejores momentos para publicar, etc.)
4. Analiza hashtags y tipos de contenido
5. Devuelve un objeto JSON con todos los datos procesados

### Componente InstagramMetrics

El componente `InstagramMetrics.tsx` procesa los datos del endpoint y:

1. Verifica el estado de la conexión (conectado, desconectado, expirado)
2. Muestra métricas básicas en tarjetas y gráficos
3. Visualiza métricas avanzadas en gráficos interactivos
4. Genera recomendaciones personalizadas basadas en el análisis de datos

## Limitaciones y consideraciones

- Las métricas avanzadas analizan solo las últimas 25 publicaciones
- La predicción de mejores momentos para publicar se basa en datos históricos
- El engagement rate se calcula usando likes y comentarios (no incluye guardados o compartidos)
- Las recomendaciones son generadas algorítmicamente y deben considerarse como sugerencias

## Mejoras futuras planificadas

- **Análisis de competencia**: Comparar métricas con otras cuentas del mismo sector
- **Análisis de contenido con IA**: Detectar automáticamente qué tipo de contenido genera más engagement
- **Predicciones de crecimiento**: Proyecciones de crecimiento basadas en tendencias históricas
- **Exportación de informes**: Generación de informes PDF con métricas clave
- **Alertas y notificaciones**: Notificaciones sobre cambios importantes en las métricas

## Solución de problemas

### Token inválido o expirado
Si aparece un error de token inválido, es necesario volver a conectar la cuenta desde la sección Canales.

### No aparecen datos o aparecen incompletos
Verifica que:
- La cuenta esté conectada como Instagram Business (no personal)
- La cuenta tenga publicaciones visibles públicamente
- El token tenga los permisos necesarios

### Error en carga de métricas
Si el componente muestra un error al cargar métricas:
1. Verifica la consola del navegador para ver errores específicos
2. Comprueba que el endpoint `instagram-insights` responda correctamente
3. Intenta reconectar la cuenta desde Canales 