import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Inicialización de Firebase Admin
const serviceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '', 'base64').toString()
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const logFilePath = path.join(__dirname, 'migration_log.txt');
const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

const log = (message: string) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(logMessage);
  logStream.write(logMessage);
};

interface MigrationResult {
  totalProcessed: number;
  totalSuccess: number;
  totalFailed: number;
  failedIds: string[];
}

/**
 * Migra mensajes de WhatsApp desde la estructura antigua a la nueva colección unificada
 */
async function migrateWhatsAppMessages(): Promise<MigrationResult> {
  log('Iniciando migración de mensajes de WhatsApp...');
  
  const result: MigrationResult = {
    totalProcessed: 0,
    totalSuccess: 0,
    totalFailed: 0,
    failedIds: []
  };
  
  try {
    // Obtener todos los usuarios
    const usersSnapshot = await db.collection('users').get();
    log(`Encontrados ${usersSnapshot.docs.length} usuarios para procesar`);
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      log(`Procesando usuario: ${userId}`);
      
      // Obtener mensajes de WhatsApp del usuario
      const whatsappMsgsSnapshot = await db.collection(`users/${userId}/whatsapp`).get();
      log(`Encontrados ${whatsappMsgsSnapshot.docs.length} mensajes de WhatsApp para el usuario ${userId}`);
      
      let userSuccessCount = 0;
      let userFailedCount = 0;
      
      // Procesar en lotes de 500 para evitar problemas de rendimiento
      const batchSize = 500;
      const batches = Math.ceil(whatsappMsgsSnapshot.docs.length / batchSize);
      
      for (let i = 0; i < batches; i++) {
        const batch = db.batch();
        const start = i * batchSize;
        const end = Math.min(start + batchSize, whatsappMsgsSnapshot.docs.length);
        
        log(`Procesando lote ${i+1}/${batches} para usuario ${userId}`);
        
        for (let j = start; j < end; j++) {
          const msgDoc = whatsappMsgsSnapshot.docs[j];
          const sourceData = msgDoc.data();
          
          try {
            // Crear nuevo documento en la colección messages
            const newDocRef = db.collection('messages').doc(msgDoc.id);
            
            // Mapear campos de la estructura antigua a la nueva
            const newData = {
              platform: "whatsapp",
              userId: userId,
              sender: sourceData.sender || sourceData.from,
              recipient: sourceData.recipient || sourceData.to,
              content: sourceData.content || sourceData.text || sourceData.body,
              timestamp: sourceData.timestamp || sourceData.ts || sourceData.createdAt || admin.firestore.FieldValue.serverTimestamp(),
              status: sourceData.status || 'received',
              isRead: !!sourceData.isRead,
              threadId: sourceData.threadId || sourceData.chatId || 'default',
              attachments: sourceData.attachments || [],
              metadata: {
                originalId: msgDoc.id,
                migratedAt: admin.firestore.FieldValue.serverTimestamp(),
                originalPath: `users/${userId}/whatsapp/${msgDoc.id}`
              }
            };
            
            // Añadir operación al lote
            batch.set(newDocRef, newData);
            
            // Solo marcar para eliminación si la operación fue exitosa
            // Lo eliminaremos en un paso posterior para asegurar la integridad
            userSuccessCount++;
            result.totalSuccess++;
          } catch (error) {
            userFailedCount++;
            result.totalFailed++;
            result.failedIds.push(msgDoc.id);
            log(`Error al migrar mensaje ${msgDoc.id} del usuario ${userId}: ${error}`);
          }
          
          result.totalProcessed++;
        }
        
        // Ejecutar el lote
        try {
          await batch.commit();
          log(`Lote ${i+1}/${batches} para usuario ${userId} procesado correctamente`);
        } catch (error) {
          log(`Error al procesar lote ${i+1}/${batches} para usuario ${userId}: ${error}`);
          // Marcar todos los mensajes en este lote como fallidos
          userFailedCount += (end - start);
          userSuccessCount -= (end - start);
          result.totalFailed += (end - start);
          result.totalSuccess -= (end - start);
        }
      }
      
      log(`Usuario ${userId}: ${userSuccessCount} mensajes migrados exitosamente, ${userFailedCount} fallidos`);
    }
    
    log(`Migración completada: ${result.totalSuccess} de ${result.totalProcessed} mensajes migrados exitosamente (${result.totalFailed} fallidos)`);
    
    // Ahora eliminamos los mensajes originales que fueron migrados correctamente
    // Solo si el % de éxito es mayor al 95%
    const successRate = (result.totalSuccess / result.totalProcessed) * 100;
    if (successRate >= 95) {
      log(`Tasa de éxito (${successRate.toFixed(2)}%) es ≥ 95%. Procediendo a eliminar mensajes originales...`);
      await deleteOriginalMessages();
    } else {
      log(`Tasa de éxito (${successRate.toFixed(2)}%) es < 95%. NO se eliminarán los mensajes originales. Revisar el log para errores.`);
    }
    
    return result;
  } catch (error) {
    log(`Error crítico durante la migración: ${error}`);
    throw error;
  } finally {
    logStream.end();
  }
}

/**
 * Elimina los mensajes originales que ya fueron migrados exitosamente
 */
async function deleteOriginalMessages(): Promise<void> {
  log('Iniciando eliminación de mensajes originales...');
  
  try {
    // Obtener todos los mensajes migrados con metadata
    const migratedMsgsSnapshot = await db.collection('messages')
      .where('platform', '==', 'whatsapp')
      .where('metadata.migratedAt', '!=', null)
      .get();
    
    log(`Encontrados ${migratedMsgsSnapshot.docs.length} mensajes migrados para eliminar`);
    
    // Agrupar por usuario para procesamiento por lotes
    const messagesByUser: Record<string, {path: string, ref: FirebaseFirestore.DocumentReference}[]> = {};
    
    for (const msgDoc of migratedMsgsSnapshot.docs) {
      const data = msgDoc.data();
      const userId = data.userId;
      const originalPath = data.metadata?.originalPath;
      
      if (userId && originalPath) {
        if (!messagesByUser[userId]) {
          messagesByUser[userId] = [];
        }
        
        const originalRef = db.doc(originalPath);
        messagesByUser[userId].push({
          path: originalPath,
          ref: originalRef
        });
      }
    }
    
    // Eliminar por lotes para cada usuario
    for (const [userId, messages] of Object.entries(messagesByUser)) {
      log(`Eliminando ${messages.length} mensajes originales para el usuario ${userId}`);
      
      const batchSize = 500;
      const batches = Math.ceil(messages.length / batchSize);
      
      for (let i = 0; i < batches; i++) {
        const batch = db.batch();
        const start = i * batchSize;
        const end = Math.min(start + batchSize, messages.length);
        
        log(`Procesando lote de eliminación ${i+1}/${batches} para usuario ${userId}`);
        
        for (let j = start; j < end; j++) {
          batch.delete(messages[j].ref);
        }
        
        await batch.commit();
        log(`Lote de eliminación ${i+1}/${batches} para usuario ${userId} completado`);
      }
    }
    
    log('Eliminación de mensajes originales completada');
  } catch (error) {
    log(`Error durante la eliminación de mensajes originales: ${error}`);
    throw error;
  }
}

// Ejecutar la migración si este script se ejecuta directamente
if (require.main === module) {
  migrateWhatsAppMessages()
    .then(result => {
      log(`Migración finalizada: ${result.totalSuccess}/${result.totalProcessed} exitosos (${result.totalFailed} fallidos)`);
      process.exit(0);
    })
    .catch(error => {
      log(`Error fatal: ${error}`);
      process.exit(1);
    });
}

export { migrateWhatsAppMessages }; 