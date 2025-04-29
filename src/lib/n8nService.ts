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

// URL base de n8n
const N8N_BASE_URL = process.env.REACT_APP_N8N_BASE_URL || "https://n8n.aura-social.com";

// Secret compartido para autenticar solicitudes
const N8N_SECRET = process.env.REACT_APP_N8N_SECRET || "local_development_secret";

// Configuración específica de cada plataforma para OAuth
const OAUTH_CONFIG = {
  instagram: {
    authorizeUrl: "https://www.facebook.com/v18.0/dialog/oauth",
    clientId: process.env.REACT_APP_INSTAGRAM_CLIENT_ID || '925270751978648',
    redirectUri: `${window.location.origin}/auth/callback/instagram`,
    scopes: [
      "instagram_basic",
      "pages_show_list",
      "instagram_manage_messages",
      "instagram_manage_comments",
      "instagram_manage_insights"
    ]
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
  authUrl.searchParams.append("client_id", platformConfig.clientId);
  authUrl.searchParams.append("redirect_uri", platformConfig.redirectUri);
  authUrl.searchParams.append("scope", platformConfig.scopes.join(","));
  authUrl.searchParams.append("response_type", "code");
  authUrl.searchParams.append("state", state);
  
  return authUrl.toString();
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
    
    // Intercambiar código por tokens (en producción, esto debería hacerse en el servidor)
    // Para este MVP, simularemos una respuesta exitosa
    const now = new Date();
    const expiresIn = 3600 * 24 * 30; // 30 días (para simulación)
    
    // Datos simulados del token (en producción, estos vendrían de la API)
    const tokenData: OAuthResponseData = {
      accessToken: `simulated_access_token_${platform}_${Date.now()}`,
      refreshToken: `simulated_refresh_token_${platform}_${Date.now()}`,
      expiresIn: expiresIn,
      tokenType: "Bearer",
      scope: OAUTH_CONFIG[platform as keyof typeof OAUTH_CONFIG]?.scopes.join(" ") || ""
    };
    
    // Guardar tokens en Firestore
    await saveTokensToFirestore(userId, platform, tokenData);
    
    // En el flujo real, aquí se llamaría a n8n para registrar el webhook
    await registerWebhookWithN8n(userId, platform, tokenData.accessToken);
    
    return tokenData;
  } catch (error) {
    console.error("Error al procesar el callback de OAuth:", error);
    return null;
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