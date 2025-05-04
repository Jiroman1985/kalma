import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection,
  serverTimestamp
} from "firebase/firestore";
import { db } from "./firebase";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";

// Interfaces para la configuración OAuth
interface OAuthConfigBase {
  authorizeUrl: string;
  clientId: string;
  redirectUri: string;
  scopes: string[];
  additionalParams?: Record<string, string>;
}

interface InstagramOAuthConfig extends OAuthConfigBase {
  clientSecret: string;
}

type OAuthConfigType = {
  instagram: InstagramOAuthConfig;
  facebook: OAuthConfigBase;
  twitter: OAuthConfigBase;
};

// URL base de n8n
const N8N_BASE_URL = process.env.REACT_APP_N8N_BASE_URL || "https://n8n.aura-social.com";

// Secret compartido para autenticar solicitudes
const N8N_SECRET = process.env.REACT_APP_N8N_SECRET || "local_development_secret";

// Configuración específica de cada plataforma para OAuth
const OAUTH_CONFIG: OAuthConfigType = {
  instagram: {
    authorizeUrl: "https://www.facebook.com/v18.0/dialog/oauth",
    clientId: process.env.REACT_APP_INSTAGRAM_CLIENT_ID || '3029546990541926',
    clientSecret: process.env.REACT_APP_INSTAGRAM_CLIENT_SECRET || '5ed60bb513324c22a3ec1db6faf9e92f',
    redirectUri: `${window.location.origin}/auth/instagram/callback`,
    scopes: [
      "instagram_basic",
      "pages_show_list",
      "instagram_manage_messages"
    ],
    additionalParams: {}
  },
  facebook: {
    authorizeUrl: "https://www.facebook.com/v16.0/dialog/oauth",
    clientId: process.env.REACT_APP_FACEBOOK_CLIENT_ID || "",
    redirectUri: `${window.location.origin}/auth/callback/facebook`,
    scopes: ["pages_show_list", "pages_messaging", "pages_manage_metadata", "pages_read_engagement"]
  },
  twitter: {
    authorizeUrl: "https://twitter.com/i/oauth2/authorize",
    clientId: process.env.REACT_APP_TWITTER_CLIENT_ID || "",
    redirectUri: `${window.location.origin}/auth/callback/twitter`,
    scopes: ["tweet.read", "users.read", "dm.read", "dm.write"]
  }
};

interface OAuthResponseData {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  scope: string;
}

interface InstagramBusinessAccount {
  pageId: string;
  pageAccessToken: string;
  igBusinessAccountId: string;
}

/**
 * Inicia el flujo OAuth para una plataforma específica
 * @param platform La plataforma a conectar (instagram, facebook, etc.)
 * @param userId ID del usuario en Firebase
 * @returns URL de autorización para redirigir al usuario
 */
export const initiateOAuthFlow = (platform: string, userId: string): string => {
  // Validar que la plataforma está soportada
  const platformConfig = OAUTH_CONFIG[platform.toLowerCase() as keyof typeof OAUTH_CONFIG];
  
  if (!platformConfig) {
    throw new Error(`Plataforma no soportada: ${platform}`);
  }

  // Crear estado para protección CSRF
  const state = btoa(JSON.stringify({
    userId,
    platform,
    timestamp: Date.now()
  }));
  
  // Construir URL de autorización
  const authUrl = new URL(platformConfig.authorizeUrl);
  
  // Agregar parámetros básicos
  authUrl.searchParams.append("client_id", platformConfig.clientId);
  authUrl.searchParams.append("redirect_uri", platformConfig.redirectUri);
  authUrl.searchParams.append("scope", platformConfig.scopes.join(","));
  authUrl.searchParams.append("response_type", "code");
  authUrl.searchParams.append("state", state);
  
  // Agregar parámetros adicionales específicos de la plataforma
  if (platformConfig.additionalParams) {
    Object.entries(platformConfig.additionalParams).forEach(([key, value]) => {
      authUrl.searchParams.append(key, value as string);
    });
  }
  
  return authUrl.toString();
};

/**
 * Obtiene la cuenta de Instagram Business asociada a una página de Facebook
 */
const getInstagramBusinessAccount = async (accessToken: string): Promise<InstagramBusinessAccount> => {
  try {
    // 1. Obtener páginas de Facebook
    const pagesResponse = await axios.get('https://graph.facebook.com/v18.0/me/accounts', {
      params: { access_token: accessToken }
    });
    
    if (!pagesResponse.data.data || pagesResponse.data.data.length === 0) {
      throw new Error('No se encontraron páginas de Facebook asociadas');
    }

    // 2. Obtener la primera página (podríamos permitir seleccionar una específica en el futuro)
    const page = pagesResponse.data.data[0];
    const pageAccessToken = page.access_token;
    const pageId = page.id;

    // 3. Obtener la cuenta de Instagram Business asociada
    const igAccountResponse = await axios.get(`https://graph.facebook.com/v18.0/${pageId}`, {
      params: {
        fields: 'instagram_business_account',
        access_token: pageAccessToken
      }
    });

    if (!igAccountResponse.data.instagram_business_account) {
      throw new Error('No se encontró una cuenta de Instagram Business asociada');
    }

    const igBusinessAccountId = igAccountResponse.data.instagram_business_account.id;

    return {
      pageId,
      pageAccessToken,
      igBusinessAccountId
    };
  } catch (error) {
    console.error('Error al obtener cuenta de Instagram Business:', error);
    throw error;
  }
};

/**
 * Suscribe una cuenta de Instagram Business a nuestra aplicación
 */
const subscribeInstagramBusinessAccount = async (
  igBusinessAccountId: string,
  pageAccessToken: string
): Promise<void> => {
  try {
    await axios.post(
      `https://graph.facebook.com/v18.0/${igBusinessAccountId}/subscribed_apps`,
      null,
      { params: { access_token: pageAccessToken } }
    );
    
    console.log(`Cuenta de Instagram Business ${igBusinessAccountId} suscrita exitosamente`);
  } catch (error) {
    console.error('Error al suscribir cuenta de Instagram Business:', error);
    throw error;
  }
};

/**
 * Procesa el callback de OAuth y almacena los tokens
 * @param code Código de autorización recibido
 * @param state Estado para validación CSRF
 * @returns Datos del token si tuvo éxito
 */
export const handleOAuthCallback = async (code: string, state: string): Promise<OAuthResponseData | null> => {
  try {
    // Decodificar el estado
    const stateData = JSON.parse(atob(state));
    const { userId, platform, timestamp } = stateData;
    
    // Validar estado (expiración después de 10 minutos)
    if (Date.now() - timestamp > 10 * 60 * 1000) {
      throw new Error("El enlace de autorización ha expirado");
    }

    if (platform === 'instagram') {
      // 1. Intercambiar código por token de acceso
      const tokenResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
        params: {
          client_id: OAUTH_CONFIG.instagram.clientId,
          client_secret: OAUTH_CONFIG.instagram.clientSecret,
          redirect_uri: OAUTH_CONFIG.instagram.redirectUri,
          code
        }
      });

      const { access_token, expires_in } = tokenResponse.data;

      // 2. Obtener cuenta de Instagram Business
      const igAccount = await getInstagramBusinessAccount(access_token);

      // 3. Suscribir la cuenta al webhook
      await subscribeInstagramBusinessAccount(igAccount.igBusinessAccountId, igAccount.pageAccessToken);

      // 4. Guardar datos en Firestore
      const tokenRef = doc(db, "users", userId, "socialTokens", "instagram");
      await setDoc(tokenRef, {
        accessToken: igAccount.pageAccessToken,
        pageId: igAccount.pageId,
        igBusinessAccountId: igAccount.igBusinessAccountId,
        tokenExpiry: new Date(Date.now() + expires_in * 1000).toISOString(),
        scope: OAUTH_CONFIG.instagram.scopes.join(","),
        lastSynced: new Date().toISOString(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // 5. Actualizar estado de la conexión
      const accountsRef = collection(db, "users", userId, "socialAccounts");
      await setDoc(doc(accountsRef, "instagram"), {
        connected: true,
        pageId: igAccount.pageId,
        igBusinessAccountId: igAccount.igBusinessAccountId,
        lastConnectedAt: serverTimestamp()
      });

      return {
        accessToken: igAccount.pageAccessToken,
        refreshToken: '', // No necesario para tokens de página
        expiresIn: expires_in,
        tokenType: "Bearer",
        scope: OAUTH_CONFIG.instagram.scopes.join(",")
      };
    }

    // Manejo de otras plataformas...
    return null;
  } catch (error) {
    console.error("Error al procesar el callback de OAuth:", error);
    throw error;
  }
};

/**
 * Guarda los tokens en Firestore
 * @param userId ID del usuario
 * @param platform Plataforma (instagram, facebook, etc.)
 * @param tokenData Datos del token
 */
const saveTokensToFirestore = async (
  userId: string, 
  platform: string, 
  tokenData: OAuthResponseData
): Promise<void> => {
  try {
    const tokenRef = doc(db, "users", userId, "socialTokens", platform.toLowerCase());
    
    // Calcular fecha de expiración
    const expiryDate = new Date();
    expiryDate.setSeconds(expiryDate.getSeconds() + tokenData.expiresIn);
    
    await setDoc(tokenRef, {
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      tokenExpiry: expiryDate.toISOString(),
      scope: tokenData.scope,
      lastSynced: new Date().toISOString(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    // Actualizar el estado de la conexión en la colección de cuentas sociales
    const accountsRef = collection(db, "users", userId, "socialAccounts");
    const accountsSnapshot = await getDoc(doc(accountsRef, platform.toLowerCase()));
    
    if (accountsSnapshot.exists()) {
      await updateDoc(doc(accountsRef, platform.toLowerCase()), {
        connected: true,
        lastConnectedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error("Error al guardar tokens en Firestore:", error);
    throw error;
  }
};

/**
 * Registra un webhook con n8n
 * @param userId ID del usuario
 * @param platform Plataforma (instagram, facebook, etc.)
 * @param accessToken Token de acceso
 */
const registerWebhookWithN8n = async (
  userId: string,
  platform: string,
  accessToken: string
): Promise<void> => {
  try {
    // URL del webhook de n8n para esta plataforma
    const webhookUrl = `${N8N_BASE_URL}/webhook/${platform}/${userId}`;
    
    // En un entorno real, aquí haríamos una solicitud a la API de la plataforma
    // para registrar nuestro webhook. Para este MVP, simularemos éxito.
    console.log(`[Simulación] Webhook registrado para ${platform} del usuario ${userId}`);
    console.log(`[Simulación] URL del webhook: ${webhookUrl}`);
    console.log(`[Simulación] Token de acceso: ${accessToken.substring(0, 10)}...`);
    
    // Registrar la URL del webhook en Firestore para referencia
    const webhookRef = doc(db, "users", userId, "webhooks", platform.toLowerCase());
    await setDoc(webhookRef, {
      url: webhookUrl,
      platform: platform.toLowerCase(),
      active: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error(`Error al registrar webhook de ${platform}:`, error);
    throw error;
  }
};

/**
 * Verifica si un usuario tiene conexión activa con una plataforma
 * @param userId ID del usuario
 * @param platform Plataforma a verificar
 * @returns true si está conectado, false si no
 */
export const isConnectedToPlatform = async (userId: string, platform: string): Promise<boolean> => {
  try {
    const tokenRef = doc(db, "users", userId, "socialTokens", platform.toLowerCase());
    const tokenDoc = await getDoc(tokenRef);
    
    if (!tokenDoc.exists()) {
      return false;
    }
    
    const tokenData = tokenDoc.data();
    
    // Verificar si el token ha expirado
    const tokenExpiry = new Date(tokenData.tokenExpiry);
    const now = new Date();
    
    return tokenExpiry > now;
  } catch (error) {
    console.error(`Error al verificar conexión con ${platform}:`, error);
    return false;
  }
};

/**
 * Desconecta una plataforma
 * @param userId ID del usuario
 * @param platform Plataforma a desconectar
 */
export const disconnectPlatform = async (userId: string, platform: string): Promise<void> => {
  try {
    // Obtener referencia al documento de tokens
    const tokenRef = doc(db, "users", userId, "socialTokens", platform.toLowerCase());
    
    // Eliminar el token
    await setDoc(tokenRef, {
      accessToken: null,
      refreshToken: null,
      tokenExpiry: null,
      scope: null,
      lastSynced: new Date().toISOString(),
      updatedAt: serverTimestamp(),
      disconnectedAt: serverTimestamp()
    });
    
    // Actualizar el estado de la conexión en la colección de cuentas sociales
    const accountsRef = collection(db, "users", userId, "socialAccounts");
    const accountsSnapshot = await getDoc(doc(accountsRef, platform.toLowerCase()));
    
    if (accountsSnapshot.exists()) {
      await updateDoc(doc(accountsRef, platform.toLowerCase()), {
        connected: false,
        lastDisconnectedAt: serverTimestamp()
      });
    }
    
    // Desactivar webhook
    const webhookRef = doc(db, "users", userId, "webhooks", platform.toLowerCase());
    const webhookDoc = await getDoc(webhookRef);
    
    if (webhookDoc.exists()) {
      await updateDoc(webhookRef, {
        active: false,
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error(`Error al desconectar ${platform}:`, error);
    throw error;
  }
};

/**
 * Obtiene la URL de n8n para una plataforma específica
 * @param userId ID del usuario
 * @param platform Plataforma (instagram, facebook, etc.)
 * @returns URL del webhook para configuración manual
 */
export const getN8nWebhookUrl = (userId: string, platform: string): string => {
  return `${N8N_BASE_URL}/webhook/${platform.toLowerCase()}/${userId}`;
}; 