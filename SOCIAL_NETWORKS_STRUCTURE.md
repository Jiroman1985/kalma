# Estructura de Redes Sociales en WhatsPyme

Este documento describe la estructura y funcionalidad del módulo de Redes Sociales integrado en WhatsPyme.

## Objetivo

El módulo de Redes Sociales permite a los usuarios gestionar múltiples cuentas de redes sociales desde una plataforma unificada, recibir notificaciones, responder mensajes y analizar el rendimiento de sus interacciones sociales.

## Estructura de datos

### Usuario

El modelo de usuario se ha extendido para incluir información relacionada con las redes sociales:

```typescript
interface UserData {
  // Campos existentes
  isPaid: boolean;
  freeTier: boolean;
  freeTierFinishDate: string | null;
  hasFullAccess: boolean;
  isTrialExpired: boolean;
  vinculado: boolean;
  
  // Campos nuevos para redes sociales
  socialNetworks?: {
    subscriptions: {
      [platformId: string]: {
        active: boolean;
        activatedAt: Timestamp | null;
        subscriptionEndDate: string | null;
      }
    };
    notificationPreferences: {
      [platformId: string]: boolean;
    };
    autoResponseSettings: {
      [platformId: string]: {
        enabled: boolean;
        mode: 'autonomous' | 'draft';
      }
    };
  }
}
```

### Cuentas de Redes Sociales

Cada cuenta de red social se almacena como un documento en una subcolección del usuario:

```typescript
interface SocialAccount {
  id: string;
  platform: string;      // "facebook", "instagram", "twitter", "linkedin", etc.
  username: string;      // nombre de usuario en la plataforma
  url: string;           // URL del perfil
  createdAt: Timestamp;  // fecha de creación
  connected: boolean;    // si la cuenta está conectada correctamente
}
```

Las cuentas se almacenan en la colección `users/{userId}/socialAccounts`.

### Mensajes de Redes Sociales

Los mensajes de las redes sociales se modelan así:

```typescript
interface SocialMediaMessage {
  id: string;
  platform: string;
  sender: {
    name: string;
    avatar?: string;
  };
  content: string;
  timestamp: Date;
  read: boolean;
  replied: boolean;
  accountId: string;     // ID de la cuenta asociada
}
```

## Flujo de Trabajo

1. **Configuración de Cuentas**:
   - El usuario añade sus cuentas de redes sociales
   - Se almacenan en Firestore

2. **Suscripciones**:
   - El usuario activa suscripciones para las plataformas que desea utilizar
   - La suscripción tiene una duración de 30 días

3. **Configuración**:
   - El usuario puede personalizar las preferencias de notificaciones
   - Activar/desactivar respuestas automáticas y seleccionar modo (borrador o autónomo)

4. **Gestión de Mensajes**:
   - Recepción de mensajes de diferentes plataformas en una bandeja unificada
   - Respuesta a mensajes desde la plataforma
   - Generación de borradores de respuesta asistida por IA

5. **Analíticas**:
   - Visualización de métricas clave: número de interacciones, tasa de respuesta, etc.
   - Distribución de mensajes por plataforma

## Escalabilidad Futura

El sistema está diseñado para soportar fácilmente la adición de nuevas plataformas mediante:

1. Adición de nuevas plataformas en el array `platforms`
2. El uso de índices dinámicos en las interfaces (`[key: string]`)
3. Funciones genéricas para manejar cualquier tipo de plataforma

## Integración

La integración con las APIs de las plataformas sociales se realizará en una fase posterior del desarrollo. La estructura actual facilita esta integración mediante:

- Interfaces bien definidas
- Separación clara entre UI y lógica de negocio
- Sistema de estado que permite actualizar datos en tiempo real

## Descripción de Componentes UI

1. **Pestaña "Mis Cuentas"**: Gestión de cuentas conectadas
2. **Pestaña "Suscripciones"**: Activación y gestión de suscripciones
3. **Pestaña "Configuración"**: Preferencias de notificaciones y respuestas automáticas
4. **Pestaña "Analíticas"**: Métricas de rendimiento
5. **Pestaña "Mensajes"**: Bandeja unificada para todos los mensajes sociales

## Estado Actual

El módulo de redes sociales tiene implementada la interfaz de usuario y la estructura de datos en Firestore. La integración con las APIs reales de las redes sociales está pendiente para una fase posterior. 