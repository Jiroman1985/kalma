// n8nConfig.ts - Configuración y plantillas para integración con n8n

/**
 * URL base de n8n según entorno
 */
export const N8N_CONFIG = {
  // URL base del servidor n8n
  baseUrl: process.env.REACT_APP_N8N_BASE_URL || "https://n8n.aura-social.com",
  
  // Token secreto compartido para la autenticación de webhooks
  webhookSecret: process.env.REACT_APP_N8N_WEBHOOK_SECRET || "shared-secret-token",
  
  // Tiempos de espera para reconexión en caso de errores
  retryIntervals: [1000, 5000, 15000], // milisegundos
  
  // Endpoints comunes
  endpoints: {
    webhook: "/webhook",
    instagram: "/webhook/instagram",
    facebook: "/webhook/facebook",
  },
  
  // Credenciales de conexión OAuth para desarrollo local
  devOAuthCredentials: {
    instagram: {
      appId: process.env.REACT_APP_INSTAGRAM_APP_ID || "instagram-dev-app-id",
      appSecret: process.env.REACT_APP_INSTAGRAM_APP_SECRET || "instagram-dev-app-secret",
      // Nuevos scopes para Instagram Business
      scopes: [
        "instagram_basic",
        "pages_show_list",
        "instagram_manage_messages",
        "instagram_manage_comments",
        "instagram_manage_insights"
      ].join(",")
    }
  }
};

/**
 * Ejemplos de workflows para n8n
 * Estos objetos JSON se pueden importar directamente en n8n
 */
export const N8N_WORKFLOWS = {
  // Workflow básico que recibe mensajes de Instagram y los almacena en Firestore
  instagramBasic: `{
    "name": "Instagram DM a Firestore",
    "nodes": [
      {
        "parameters": {
          "httpMethod": "POST",
          "path": "instagram/{{$json.userId}}",
          "responseMode": "lastNode",
          "options": {}
        },
        "name": "Webhook",
        "type": "n8n-nodes-base.webhook",
        "typeVersion": 1
      },
      {
        "parameters": {
          "operation": "create",
          "projectId": "=aura-platform",
          "collection": "='users/' + $json.userId + '/messages'",
          "options": {}
        },
        "name": "Firestore",
        "type": "n8n-nodes-base.firestore",
        "typeVersion": 1
      }
    ],
    "connections": {
      "Webhook": {
        "main": [
          [
            {
              "node": "Firestore",
              "type": "main",
              "index": 0
            }
          ]
        ]
      }
    }
  }`,
  
  // Workflow avanzado que procesa mensajes de Instagram, analiza sentimiento y genera respuestas automáticas
  instagramAdvanced: `{
    "name": "Instagram Procesamiento Avanzado",
    "nodes": [
      {
        "parameters": {
          "httpMethod": "POST",
          "path": "instagram/{{$json.userId}}",
          "responseMode": "lastNode",
          "options": {}
        },
        "name": "Webhook",
        "type": "n8n-nodes-base.webhook",
        "typeVersion": 1
      },
      {
        "parameters": {
          "functionCode": "// Normalizar los datos de entrada\\nreturn {\\n  json: {\\n    messageId: $input.item.entry[0].id,\\n    platform: 'instagram',\\n    senderId: $input.item.entry[0].messaging[0].sender.id,\\n    senderName: $input.item.entry[0].messaging[0].sender.name || 'Unknown User',\\n    content: $input.item.entry[0].messaging[0].message.text,\\n    timestamp: new Date().toISOString(),\\n    userId: $input.params.userId,\\n    read: false,\\n    replied: false\\n  }\\n};"
        },
        "name": "Normalizar Datos",
        "type": "n8n-nodes-base.function",
        "typeVersion": 1
      },
      {
        "parameters": {
          "jsCode": "// Analizar sentimiento del mensaje\\nconst text = $input.json.content;\\n\\n// Palabras positivas y negativas para un análisis simple\\nconst positiveWords = ['gracias', 'genial', 'excelente', 'increíble', 'me gusta', 'bueno', 'fantástico', 'maravilloso', 'encanta'];\\nconst negativeWords = ['problema', 'error', 'malo', 'terrible', 'horrible', 'no funciona', 'queja', 'decepciona', 'devolver'];\\n\\n// Contar ocurrencias\\nlet positiveCount = 0;\\nlet negativeCount = 0;\\n\\npositiveWords.forEach(word => {\\n  if (text.toLowerCase().includes(word)) positiveCount++;\\n});\\n\\nnegativeWords.forEach(word => {\\n  if (text.toLowerCase().includes(word)) negativeCount++;\\n});\\n\\n// Determinar sentimiento\\nlet sentiment;\\nif (positiveCount > negativeCount) {\\n  sentiment = 'positive';\\n} else if (negativeCount > positiveCount) {\\n  sentiment = 'negative';\\n} else {\\n  sentiment = 'neutral';\\n}\\n\\n// Añadir a los datos\\n$input.json.sentiment = sentiment;\\nreturn $input;"
        },
        "name": "Análisis de Sentimiento",
        "type": "n8n-nodes-base.code",
        "typeVersion": 1
      },
      {
        "parameters": {
          "conditions": {
            "string": [
              {
                "value1": "={{$json.sentiment}}",
                "operation": "equal",
                "value2": "positive"
              }
            ]
          }
        },
        "name": "Es Positivo?",
        "type": "n8n-nodes-base.if",
        "typeVersion": 1
      },
      {
        "parameters": {
          "functionCode": "// Respuesta para sentimiento positivo\\n$input.json.autoReply = '¡Gracias por tu mensaje tan positivo! Nos alegra que estés contento con nuestros servicios. Un representante te responderá pronto.';\\nreturn $input;"
        },
        "name": "Respuesta Positiva",
        "type": "n8n-nodes-base.function",
        "typeVersion": 1
      },
      {
        "parameters": {
          "conditions": {
            "string": [
              {
                "value1": "={{$json.sentiment}}",
                "operation": "equal",
                "value2": "negative"
              }
            ]
          }
        },
        "name": "Es Negativo?",
        "type": "n8n-nodes-base.if",
        "typeVersion": 1
      },
      {
        "parameters": {
          "functionCode": "// Respuesta para sentimiento negativo\\n$input.json.autoReply = 'Lamentamos los inconvenientes que has experimentado. Tu caso ha sido priorizado y un especialista se pondrá en contacto contigo a la brevedad.';\\nreturn $input;"
        },
        "name": "Respuesta Negativa",
        "type": "n8n-nodes-base.function",
        "typeVersion": 1
      },
      {
        "parameters": {
          "functionCode": "// Respuesta para sentimiento neutral\\n$input.json.autoReply = 'Gracias por contactarnos. En breve un representante revisará tu mensaje y te responderá.';\\nreturn $input;"
        },
        "name": "Respuesta Neutral",
        "type": "n8n-nodes-base.function",
        "typeVersion": 1
      },
      {
        "parameters": {
          "operation": "create",
          "projectId": "=aura-platform",
          "collection": "='users/' + $json.userId + '/messages'",
          "options": {}
        },
        "name": "Guardar en Firestore",
        "type": "n8n-nodes-base.firestore",
        "typeVersion": 1
      }
    ],
    "connections": {
      "Webhook": {
        "main": [
          [
            {
              "node": "Normalizar Datos",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Normalizar Datos": {
        "main": [
          [
            {
              "node": "Análisis de Sentimiento",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Análisis de Sentimiento": {
        "main": [
          [
            {
              "node": "Es Positivo?",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Es Positivo?": {
        "main": [
          [
            {
              "node": "Respuesta Positiva",
              "type": "main",
              "index": 0
            }
          ],
          [
            {
              "node": "Es Negativo?",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Respuesta Positiva": {
        "main": [
          [
            {
              "node": "Guardar en Firestore",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Es Negativo?": {
        "main": [
          [
            {
              "node": "Respuesta Negativa",
              "type": "main",
              "index": 0
            }
          ],
          [
            {
              "node": "Respuesta Neutral",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Respuesta Negativa": {
        "main": [
          [
            {
              "node": "Guardar en Firestore",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Respuesta Neutral": {
        "main": [
          [
            {
              "node": "Guardar en Firestore",
              "type": "main",
              "index": 0
            }
          ]
        ]
      }
    }
  }`
};

/**
 * Ejemplos de payloads de Instagram para probar la integración
 */
export const INSTAGRAM_MESSAGE_SAMPLES = {
  // Mensaje directo estándar
  directMessage: {
    "object": "instagram",
    "entry": [
      {
        "id": "123456789",
        "time": 1578642492062,
        "messaging": [
          {
            "sender": {
              "id": "987654321",
              "name": "usuario_instagram"
            },
            "recipient": {
              "id": "111222333"
            },
            "timestamp": 1578642491889,
            "message": {
              "mid": "m_lkjhgfdsa987654321",
              "text": "Hola, ¿tienen disponibilidad del producto que mostraron en su última publicación?"
            }
          }
        ]
      }
    ]
  },
  
  // Comentario en una publicación
  commentOnPost: {
    "object": "instagram",
    "entry": [
      {
        "id": "123456789",
        "time": 1578642492062,
        "changes": [
          {
            "field": "comments",
            "value": {
              "media_id": "17895695/2431234567891234",
              "comment_id": "17891234567123456",
              "text": "¡Me encanta esta prenda! ¿La tienen en talla M?",
              "from": {
                "id": "987654321",
                "username": "usuario_instagram"
              }
            }
          }
        ]
      }
    ]
  },
  
  // Mención en una publicación o historia
  mention: {
    "object": "instagram",
    "entry": [
      {
        "id": "123456789",
        "time": 1578642492062,
        "changes": [
          {
            "field": "mentions",
            "value": {
              "media_id": "17895695/2431234567891234",
              "mention_id": "17891234567123456",
              "text": "Usando los increíbles productos de @tu_marca ¡Son maravillosos!",
              "from": {
                "id": "987654321",
                "username": "usuario_instagram"
              }
            }
          }
        ]
      }
    ]
  }
};

/**
 * Estructura de mensajes normalizados para almacenamiento en Firestore
 */
export interface NormalizedMessage {
  id: string;
  platform: 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'gmail' | 'googleReviews';
  externalId: string;
  userId: string;
  senderId: string;
  senderName: string;
  senderUsername?: string;
  senderProfileUrl?: string;
  senderAvatar?: string;
  type: 'directMessage' | 'comment' | 'mention' | 'review' | 'email';
  content: string;
  mediaUrl?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  autoReply?: string;
  autoReplySent: boolean;
  manualReply?: string;
  status: 'unread' | 'read' | 'replied' | 'archived';
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  metadata?: Record<string, any>;
}

/**
 * Directrices para despliegue de n8n
 */
export const N8N_DEPLOYMENT_GUIDE = `
# Guía de Despliegue de n8n para AURA

## Requisitos
- Servidor con Docker y Docker Compose
- Dominio configurado (ej: n8n.aura-social.com)
- Certificado SSL

## Instrucciones de Despliegue

1. Crear docker-compose.yml:
\`\`\`yaml
version: '3'

services:
  n8n:
    image: n8nio/n8n
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_HOST=${N8N_HOST}
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - N8N_ENCRYPTION_KEY=${ENCRYPTION_KEY}
      - N8N_JWT_SECRET=${JWT_SECRET}
      - NODE_ENV=production
      - WEBHOOK_URL=https://${N8N_HOST}
      - N8N_DIAGNOSTICS_ENABLED=false
    volumes:
      - n8n_data:/home/node/.n8n
    networks:
      - n8n-network

  caddy:
    image: caddy:2
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - caddy_data:/data
      - caddy_config:/config
      - ./Caddyfile:/etc/caddy/Caddyfile
    networks:
      - n8n-network

volumes:
  n8n_data:
  caddy_data:
  caddy_config:

networks:
  n8n-network:
\`\`\`

2. Crear Caddyfile para reverse proxy:
\`\`\`
n8n.aura-social.com {
  reverse_proxy n8n:5678
}
\`\`\`

3. Crear archivo .env con las variables necesarias:
\`\`\`
N8N_HOST=n8n.aura-social.com
ENCRYPTION_KEY=encryption-key-random-string
JWT_SECRET=jwt-secret-random-string
\`\`\`

4. Iniciar servicios:
\`\`\`bash
docker-compose up -d
\`\`\`

5. Importar workflows preconstruidos:
   - Acceder a la interfaz en https://n8n.aura-social.com
   - Ir a "Workflows" > "Import from File"
   - Pegar el JSON de los workflows definidos en N8N_WORKFLOWS
`;

export default N8N_CONFIG; 