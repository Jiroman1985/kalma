import { db } from "@/lib/firebase";
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  query, 
  where, 
  addDoc, 
  serverTimestamp, 
  updateDoc,
  getDocs,
  orderBy,
  limit,
  Timestamp
} from "firebase/firestore";

// Define la interfaz para los mensajes de correo electrónico
export interface EmailMessage {
  id: string;
  subject: string;
  body: string;
  from: string;
  to: string;
  cc?: string[];
  bcc?: string[];
  timestamp: Timestamp;
  isRead: boolean;
  isReplied: boolean;
  isStarred?: boolean;
  attachments?: {
    name: string;
    url: string;
    type: string;
    size: number;
  }[];
  labels?: string[];
  folder?: 'inbox' | 'sent' | 'draft' | 'trash' | 'spam' | string;
  userId: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  platform: 'email';
  senderName?: string;
  senderEmail?: string;
  senderAvatar?: string;
  accountId?: string; // ID de la cuenta de Gmail asociada
  threadId?: string;  // Para agrupar conversaciones
}

// Enumeración para carpetas de correo
export enum EmailFolder {
  INBOX = 'inbox',
  SENT = 'sent',
  DRAFT = 'draft',
  TRASH = 'trash',
  SPAM = 'spam'
}

/**
 * Obtiene los mensajes de correo electrónico de un usuario
 */
export const getEmailMessages = async (
  userId: string,
  messageLimit: number = 100,
  folder: EmailFolder = EmailFolder.INBOX
): Promise<EmailMessage[]> => {
  try {
    console.log(`Buscando mensajes de email para el usuario: ${userId} en carpeta: ${folder}`);
    
    // Consulta principal para obtener mensajes de email
    const emailQuery = query(
      collection(db, "messages"),
      where("userId", "==", userId),
      where("platform", "==", "email"),
      where("folder", "==", folder),
      orderBy("createdAt", "desc"),
      limit(messageLimit)
    );
    
    const querySnapshot = await getDocs(emailQuery);
    
    if (!querySnapshot.empty) {
      console.log(`Encontrados ${querySnapshot.size} mensajes de email`);
      
      // Convertir documentos a objetos de mensaje
      const messages: EmailMessage[] = [];
      
      querySnapshot.forEach(doc => {
        const data = doc.data();
        
        // Normalizar datos
        messages.push({
          id: doc.id,
          subject: data.subject || "",
          body: data.body || data.content || "",
          from: data.from || data.senderEmail || "",
          to: data.to || data.recipientEmail || "",
          cc: data.cc || [],
          bcc: data.bcc || [],
          timestamp: data.timestamp || data.createdAt,
          isRead: data.isRead || false,
          isReplied: data.isReplied || false,
          isStarred: data.isStarred || false,
          attachments: data.attachments || [],
          labels: data.labels || [],
          folder: data.folder || folder,
          userId: data.userId,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          platform: 'email',
          senderName: data.senderName || data.from,
          senderEmail: data.senderEmail || data.from,
          senderAvatar: data.senderAvatar || "",
          accountId: data.accountId || "",
          threadId: data.threadId || ""
        });
      });
      
      return messages;
    }
    
    console.log("No se encontraron mensajes de email");
    return [];
    
  } catch (error) {
    console.error("Error al obtener mensajes de email:", error);
    return [];
  }
};

/**
 * Obtiene un mensaje específico por ID
 */
export const getEmailById = async (userId: string, emailId: string): Promise<EmailMessage | null> => {
  try {
    const emailRef = doc(db, "messages", emailId);
    const emailDoc = await getDoc(emailRef);
    
    if (emailDoc.exists() && emailDoc.data().userId === userId) {
      const data = emailDoc.data();
      
      // Marcar como leído al obtener
      if (!data.isRead) {
        await updateDoc(emailRef, {
          isRead: true,
          updatedAt: serverTimestamp()
        });
      }
      
      return {
        id: emailDoc.id,
        ...data
      } as EmailMessage;
    }
    
    return null;
  } catch (error) {
    console.error("Error al obtener mensaje de email:", error);
    return null;
  }
};

/**
 * Envía un mensaje de correo electrónico
 */
export const sendEmail = async (
  userId: string,
  emailData: Omit<EmailMessage, 'id' | 'createdAt' | 'userId' | 'platform'>
): Promise<string | null> => {
  try {
    // Datos completos para guardar
    const completeEmailData = {
      ...emailData,
      userId,
      platform: 'email',
      folder: EmailFolder.SENT,
      isRead: true,
      isReplied: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    // Guardar en Firebase
    const emailCollection = collection(db, "messages");
    const docRef = await addDoc(emailCollection, completeEmailData);
    
    console.log("Email enviado y guardado con ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error al enviar email:", error);
    return null;
  }
};

/**
 * Marca un mensaje como leído o no leído
 */
export const markEmailAsRead = async (emailId: string, isRead: boolean): Promise<boolean> => {
  try {
    const emailRef = doc(db, "messages", emailId);
    await updateDoc(emailRef, {
      isRead,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error("Error al marcar email como leído:", error);
    return false;
  }
};

/**
 * Marca un mensaje como destacado/favorito
 */
export const starEmail = async (emailId: string, isStarred: boolean): Promise<boolean> => {
  try {
    const emailRef = doc(db, "messages", emailId);
    await updateDoc(emailRef, {
      isStarred,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error("Error al destacar email:", error);
    return false;
  }
};

/**
 * Mueve un mensaje a otra carpeta
 */
export const moveEmailToFolder = async (emailId: string, folder: EmailFolder): Promise<boolean> => {
  try {
    const emailRef = doc(db, "messages", emailId);
    await updateDoc(emailRef, {
      folder,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error(`Error al mover email a la carpeta ${folder}:`, error);
    return false;
  }
};

/**
 * Elimina un mensaje (lo mueve a la papelera)
 */
export const deleteEmail = async (emailId: string): Promise<boolean> => {
  return moveEmailToFolder(emailId, EmailFolder.TRASH);
};

/**
 * Responde a un mensaje de correo electrónico
 */
export const replyToEmail = async (
  userId: string,
  originalEmailId: string, 
  replyContent: string
): Promise<string | null> => {
  try {
    // Obtener el email original
    const originalEmail = await getEmailById(userId, originalEmailId);
    
    if (!originalEmail) {
      throw new Error("Email original no encontrado");
    }
    
    // Crear la respuesta
    const replyData: Partial<EmailMessage> = {
      subject: `Re: ${originalEmail.subject}`,
      body: replyContent,
      from: originalEmail.to, // Invertimos direcciones
      to: originalEmail.from,
      timestamp: Timestamp.now(),
      isRead: true,
      isReplied: false,
      folder: EmailFolder.SENT,
      threadId: originalEmail.threadId || originalEmail.id,
      platform: 'email'
    };
    
    // Guardar la respuesta
    const emailId = await sendEmail(userId, replyData as any);
    
    if (emailId) {
      // Marcar el email original como respondido
      const originalEmailRef = doc(db, "messages", originalEmailId);
      await updateDoc(originalEmailRef, {
        isReplied: true,
        updatedAt: serverTimestamp()
      });
    }
    
    return emailId;
  } catch (error) {
    console.error("Error al responder email:", error);
    return null;
  }
};

/**
 * Busca emails que coincidan con un término de búsqueda
 */
export const searchEmails = async (
  userId: string,
  searchTerm: string,
  messageLimit: number = 50
): Promise<EmailMessage[]> => {
  try {
    // Nota: Esta es una búsqueda básica. Para una búsqueda completa, 
    // se debería usar Algolia, Elasticsearch o similar.
    
    // Obtenemos todos los emails del usuario primero
    const emailQuery = query(
      collection(db, "messages"),
      where("userId", "==", userId),
      where("platform", "==", "email"),
      orderBy("createdAt", "desc"),
      limit(200) // Límite alto para búsqueda
    );
    
    const querySnapshot = await getDocs(emailQuery);
    
    if (querySnapshot.empty) {
      return [];
    }
    
    // Filtramos en memoria
    const searchTermLower = searchTerm.toLowerCase();
    const results: EmailMessage[] = [];
    
    querySnapshot.forEach(doc => {
      const data = doc.data() as EmailMessage;
      
      // Buscar en asunto, cuerpo, remitente y destinatario
      if (
        data.subject?.toLowerCase().includes(searchTermLower) ||
        data.body?.toLowerCase().includes(searchTermLower) ||
        data.from?.toLowerCase().includes(searchTermLower) ||
        data.to?.toLowerCase().includes(searchTermLower) ||
        data.senderName?.toLowerCase().includes(searchTermLower)
      ) {
        results.push({
          id: doc.id,
          ...data
        } as EmailMessage);
      }
    });
    
    // Limitar resultados
    return results.slice(0, messageLimit);
    
  } catch (error) {
    console.error("Error al buscar emails:", error);
    return [];
  }
};

/**
 * Obtiene los conteos de mensajes por carpeta
 */
export const getEmailCounts = async (userId: string): Promise<Record<EmailFolder | 'unread', number>> => {
  try {
    const counts: Record<EmailFolder | 'unread', number> = {
      [EmailFolder.INBOX]: 0,
      [EmailFolder.SENT]: 0,
      [EmailFolder.DRAFT]: 0,
      [EmailFolder.TRASH]: 0,
      [EmailFolder.SPAM]: 0,
      unread: 0
    };
    
    // Obtener conteo para cada carpeta
    for (const folder of Object.values(EmailFolder)) {
      const folderQuery = query(
        collection(db, "messages"),
        where("userId", "==", userId),
        where("platform", "==", "email"),
        where("folder", "==", folder)
      );
      
      const querySnapshot = await getDocs(folderQuery);
      counts[folder] = querySnapshot.size;
    }
    
    // Conteo especial para no leídos
    const unreadQuery = query(
      collection(db, "messages"),
      where("userId", "==", userId),
      where("platform", "==", "email"),
      where("folder", "==", EmailFolder.INBOX),
      where("isRead", "==", false)
    );
    
    const unreadSnapshot = await getDocs(unreadQuery);
    counts['unread'] = unreadSnapshot.size;
    
    return counts;
  } catch (error) {
    console.error("Error al obtener conteos de email:", error);
    return {
      [EmailFolder.INBOX]: 0,
      [EmailFolder.SENT]: 0,
      [EmailFolder.DRAFT]: 0,
      [EmailFolder.TRASH]: 0,
      [EmailFolder.SPAM]: 0,
      unread: 0
    };
  }
};

/**
 * Verifica si el usuario tiene una conexión activa con Gmail
 */
export const checkGmailConnection = async (userId: string): Promise<{
  connected: boolean;
  profileInfo?: {
    email?: string;
    name?: string;
    picture?: string;
  };
}> => {
  try {
    const socialTokensRef = doc(db, "socialTokens", userId);
    const socialTokensDoc = await getDoc(socialTokensRef);
    
    if (socialTokensDoc.exists() && socialTokensDoc.data().gmail) {
      const gmailData = socialTokensDoc.data().gmail;
      
      // Verificar si tenemos información de perfil
      if (gmailData.profile) {
        return {
          connected: true,
          profileInfo: {
            email: gmailData.profile.email,
            name: gmailData.profile.name,
            picture: gmailData.profile.picture
          }
        };
      }
      
      return { connected: true };
    }
    
    return { connected: false };
  } catch (error) {
    console.error("Error al verificar conexión con Gmail:", error);
    return { connected: false };
  }
}; 