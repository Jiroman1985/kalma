import axios from 'axios';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface SendMessageOptions {
  platform: 'whatsapp' | 'email' | 'instagram';
  to: string;            // ID del destinatario (número, email, ID de Instagram)
  text: string;          // Contenido del mensaje
  threadId?: string;     // ID de la conversación (si existe)
  userId: string;        // ID del usuario en Firestore
  files?: Array<{
    type: 'image' | 'video' | 'document';
    url?: string;
    base64?: string;
    name?: string;
  }>;
  subject?: string;      // Asunto (solo para email)
}

/**
 * Obtiene los tokens necesarios para la plataforma
 */
const getTokensForPlatform = async (userId: string, platform: string) => {
  try {
    const tokenDocRef = doc(db, 'users', userId, 'socialTokens', platform);
    const tokenDoc = await getDoc(tokenDocRef);
    
    if (!tokenDoc.exists()) {
      throw new Error(`No hay tokens para la plataforma ${platform}`);
    }
    
    return tokenDoc.data();
  } catch (error) {
    console.error(`Error al obtener tokens para ${platform}:`, error);
    throw error;
  }
};

/**
 * Envía un mensaje a WhatsApp a través de n8n
 */
const sendWhatsAppMessage = async (options: SendMessageOptions) => {
  try {
    // Preparar los datos para el webhook de n8n
    const webhookPayload = {
      userId: options.userId,
      to: options.to,
      text: options.text,
      files: options.files || [],
      timestamp: new Date().toISOString()
    };
    
    // URL del webhook de n8n para WhatsApp
    const webhookUrl = process.env.REACT_APP_N8N_WEBHOOK_URL + '/wa/send';
    
    // Enviar la solicitud al webhook
    const response = await axios.post(webhookUrl, webhookPayload);
    
    return {
      success: response.status >= 200 && response.status < 300,
      externalId: response.data?.messageId || null,
      data: response.data
    };
  } catch (error) {
    console.error('Error al enviar mensaje de WhatsApp:', error);
    throw error;
  }
};

/**
 * Envía un correo electrónico usando Gmail API
 */
const sendEmailMessage = async (options: SendMessageOptions) => {
  try {
    // Obtener token de Gmail
    const tokens = await getTokensForPlatform(options.userId, 'gmail');
    
    if (!tokens.accessToken) {
      throw new Error('No hay token de acceso para Gmail');
    }
    
    // Preparar los datos para la API de Gmail
    const emailPayload = {
      userId: options.userId,
      accessToken: tokens.accessToken,
      to: options.to,
      subject: options.subject || 'Mensaje desde Kalma',
      text: options.text,
      threadId: options.threadId,
      files: options.files || []
    };
    
    // URL de la función de Cloud Functions
    const functionUrl = process.env.REACT_APP_CLOUD_FUNCTIONS_URL + '/send-email';
    
    // Enviar la solicitud
    const response = await axios.post(functionUrl, emailPayload);
    
    return {
      success: response.status >= 200 && response.status < 300,
      externalId: response.data?.messageId || null,
      threadId: response.data?.threadId || options.threadId,
      data: response.data
    };
  } catch (error) {
    console.error('Error al enviar correo electrónico:', error);
    throw error;
  }
};

/**
 * Envía un mensaje a Instagram usando la API de Meta
 */
const sendInstagramMessage = async (options: SendMessageOptions) => {
  try {
    // Obtener tokens y datos de Instagram
    const tokens = await getTokensForPlatform(options.userId, 'instagram');
    
    if (!tokens.accessToken || !tokens.instagramUserId) {
      throw new Error('Faltan credenciales para Instagram');
    }
    
    // Preparar los datos para la API de Instagram
    const instagramPayload = {
      accessToken: tokens.accessToken,
      recipientId: options.to,
      text: options.text,
      attachments: options.files
    };
    
    // URL del endpoint de Instagram Messaging
    const messageEndpoint = `https://graph.facebook.com/v18.0/${tokens.instagramUserId}/messages`;
    
    // Preparar parámetros en formato form-urlencoded para la API de Instagram
    const params = new URLSearchParams();
    params.append('access_token', instagramPayload.accessToken);
    params.append('recipient', JSON.stringify({ id: instagramPayload.recipientId }));
    params.append('message', JSON.stringify({ text: instagramPayload.text }));
    
    // Enviar la solicitud a la API de Instagram
    const response = await axios.post(messageEndpoint, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    return {
      success: response.status >= 200 && response.status < 300,
      externalId: response.data?.message_id || null,
      data: response.data
    };
  } catch (error) {
    console.error('Error al enviar mensaje de Instagram:', error);
    throw error;
  }
};

/**
 * Guarda el mensaje enviado en Firestore
 */
const saveMessageToFirestore = async (options: SendMessageOptions, resultData: any) => {
  try {
    const messagesCollection = collection(db, 'messages');
    
    const messageData = {
      platform: options.platform,
      userId: options.userId,
      sender: `user_${options.userId}`,
      recipient: options.to,
      content: options.text,
      timestamp: serverTimestamp(),
      threadId: options.threadId || resultData.threadId || options.to,
      isRead: true,
      status: 'sent',
      externalId: resultData.externalId,
      isFromMe: true,
      attachments: options.files?.map(file => ({
        type: file.type,
        url: file.url
      })) || [],
      metadata: {
        response: resultData.data
      }
    };
    
    // Agregar campos específicos según la plataforma
    if (options.platform === 'email') {
      messageData['subject'] = options.subject;
    }
    
    // Guardar el mensaje en Firestore
    const docRef = await addDoc(messagesCollection, messageData);
    
    return {
      ...resultData,
      messageId: docRef.id
    };
  } catch (error) {
    console.error('Error al guardar mensaje en Firestore:', error);
    throw error;
  }
};

/**
 * Función principal para enviar mensajes - implementa la interfaz genérica
 */
export const sendMessage = async (options: SendMessageOptions) => {
  try {
    let result;
    
    // Según la plataforma, elegir la función apropiada
    switch (options.platform) {
      case 'whatsapp':
        result = await sendWhatsAppMessage(options);
        break;
      case 'email':
        result = await sendEmailMessage(options);
        break;
      case 'instagram':
        result = await sendInstagramMessage(options);
        break;
      default:
        throw new Error(`Plataforma no soportada: ${options.platform}`);
    }
    
    // Si el envío fue exitoso, guardar en Firestore
    if (result.success) {
      const savedResult = await saveMessageToFirestore(options, result);
      return {
        success: true,
        messageId: savedResult.messageId,
        externalId: result.externalId,
        threadId: result.threadId || options.threadId,
        data: result.data
      };
    } else {
      throw new Error(`Error al enviar mensaje: ${JSON.stringify(result.data)}`);
    }
  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default {
  sendMessage
}; 