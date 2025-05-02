import crypto from 'crypto';
import { Request } from 'express';

/**
 * Verifica la firma del webhook de Instagram
 * @param req Request de Express
 * @returns boolean indicando si la firma es válida
 */
export function verifyInstagramWebhook(req: Request): boolean {
  const signature = req.headers['x-hub-signature'];
  
  if (!signature || typeof signature !== 'string') {
    return false;
  }

  try {
    // Obtener el cuerpo de la solicitud como string
    const body = JSON.stringify(req.body);
    
    // Calcular el HMAC usando el secreto compartido
    const hmac = crypto.createHmac('sha1', process.env.INSTAGRAM_APP_SECRET || '');
    const expectedSignature = 'sha1=' + hmac.update(body).digest('hex');
    
    // Comparar las firmas usando un método seguro contra timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Error verificando firma del webhook:', error);
    return false;
  }
} 