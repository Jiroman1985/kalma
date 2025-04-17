import { processWhatsAppWebhook } from '@/lib/whatsappService';

export async function POST(request: Request) {
  try {
    const webhookData = await request.json();
    console.log('Webhook recibido:', JSON.stringify(webhookData).substring(0, 500) + '...');
    
    // Procesar los datos del webhook
    const result = await processWhatsAppWebhook(webhookData);
    
    if (result.success) {
      console.log('Datos de WhatsApp procesados correctamente para el usuario:', result.userId);
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Datos procesados correctamente' 
      }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      console.error('Error al procesar datos:', result.error);
      return new Response(JSON.stringify({ 
        success: false, 
        error: result.error 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Error en el endpoint del webhook:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Error interno del servidor' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 