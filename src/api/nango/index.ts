import { Nango } from '@nangohq/node';

// Inicializar cliente de Nango con la clave secreta
const nango = new Nango({ 
  secretKey: import.meta.env.VITE_NANGO_SECRET_KEY 
});

// Función para generar un token de sesión de Nango
export const createNangoSessionToken = async (userId: string, integrationIds: string[] = ['gmail']) => {
  try {
    const response = await nango.createConnectSession({
      end_user: {
        id: userId,
      },
      allowed_integrations: integrationIds,
    });

    return { 
      success: true, 
      token: response.data.token 
    };
  } catch (error) {
    console.error('Error al crear token de sesión de Nango:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    };
  }
}; 