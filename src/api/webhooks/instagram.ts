import express from 'express';
import { getFirestore } from 'firebase-admin/firestore';
import { verifyInstagramWebhook } from '../utils/instagram';

const router = express.Router();

// Verificación del webhook de Instagram
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // Verificar que es una solicitud de verificación válida
  if (mode === 'subscribe' && token === process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN) {
    console.log('Webhook de Instagram verificado');
    res.status(200).send(challenge);
  } else {
    console.error('Verificación de webhook fallida');
    res.sendStatus(403);
  }
});

// Recepción de eventos del webhook
router.post('/', async (req, res) => {
  try {
    // Verificar la firma del webhook
    if (!verifyInstagramWebhook(req)) {
      console.error('Firma de webhook inválida');
      return res.sendStatus(403);
    }

    const { object, entry } = req.body;

    // Verificar que es un evento de Instagram
    if (object !== 'instagram') {
      console.error('Evento no es de Instagram');
      return res.sendStatus(400);
    }

    // Procesar cada entrada del webhook
    for (const item of entry) {
      const { id: instagramUserId, changes } = item;

      // Buscar el usuario asociado a esta cuenta de Instagram
      const db = getFirestore();
      const usersSnapshot = await db
        .collection('users')
        .where('socialNetworks.instagram.instagramUserId', '==', instagramUserId)
        .get();

      if (usersSnapshot.empty) {
        console.error(`No se encontró usuario para Instagram ID: ${instagramUserId}`);
        continue;
      }

      const user = usersSnapshot.docs[0];

      // Procesar cada cambio en la entrada
      for (const change of changes) {
        const { field, value } = change;

        // Crear el evento en la base de datos
        await db.collection('users').doc(user.id).collection('events').add({
          type: 'instagram',
          field,
          value,
          instagramUserId,
          timestamp: new Date(),
          processed: false
        });

        // Si es un mensaje o comentario, enviarlo al sistema de IA
        if (field === 'messages' || field === 'comments') {
          await processInstagramInteraction(user.id, field, value);
        }
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Error procesando webhook de Instagram:', error);
    res.sendStatus(500);
  }
});

// Suscripción al webhook
router.post('/subscribe', async (req, res) => {
  try {
    const { userId, instagramUserId, accessToken } = req.body;

    // Verificar parámetros requeridos
    if (!userId || !instagramUserId || !accessToken) {
      return res.status(400).json({ error: 'Faltan parámetros requeridos' });
    }

    // Suscribir la cuenta al webhook usando la API de Instagram
    const response = await fetch(
      `https://graph.instagram.com/v12.0/${instagramUserId}/subscribed_apps`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: accessToken,
          verify_token: process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN,
          callback_url: `${process.env.API_BASE_URL}/webhooks/instagram`
        })
      }
    );

    if (!response.ok) {
      throw new Error('Error al suscribir al webhook');
    }

    // Guardar la suscripción en la base de datos
    const db = getFirestore();
    await db.collection('users').doc(userId).update({
      'socialNetworks.instagram.webhookSubscribed': true,
      'socialNetworks.instagram.webhookSubscribedAt': new Date()
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error en suscripción al webhook:', error);
    res.status(500).json({ error: 'Error al suscribir al webhook' });
  }
});

async function processInstagramInteraction(userId: string, field: string, value: any) {
  try {
    const db = getFirestore();
    
    // Crear un nuevo documento en la colección de interacciones
    await db.collection('users').doc(userId).collection('interactions').add({
      platform: 'instagram',
      type: field,
      data: value,
      timestamp: new Date(),
      status: 'pending',
      aiResponse: null
    });

    // Aquí se puede agregar la lógica para enviar la interacción al sistema de IA
    // Por ejemplo:
    // await sendToAISystem({
    //   userId,
    //   platform: 'instagram',
    //   type: field,
    //   data: value
    // });

  } catch (error) {
    console.error('Error procesando interacción de Instagram:', error);
    throw error;
  }
}

export default router; 