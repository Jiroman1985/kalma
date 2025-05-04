import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Instagram, Info, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { initiateOAuthFlow } from '@/lib/n8nService';

interface InstagramAuthModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const InstagramAuthModal: React.FC<InstagramAuthModalProps> = ({ 
  open, 
  onClose,
  onSuccess
}) => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const handleConnect = async () => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para conectar tu cuenta de Instagram",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Iniciar el flujo de autenticación OAuth con Instagram
      // Redireccionar a la página de inicio de autenticación
      window.location.href = '/auth/instagram/start';
      
      // Si estamos en modo desarrollo/prueba, mostramos un mensaje
      toast({
        title: "Redirigiendo...",
        description: "Serás redirigido a Instagram para autorizar la conexión",
      });
      
      // En caso de ser un mock, simular éxito después de un tiempo
      if (process.env.NODE_ENV === 'development') {
        // Solo para desarrollo - Simular el proceso
        await new Promise(resolve => setTimeout(resolve, 2000));
        onClose();
        
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      console.error("Error al iniciar autenticación con Instagram:", error);
      toast({
        title: "Error de conexión",
        description: "No se pudo iniciar el proceso de autenticación con Instagram",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Instagram className="h-5 w-5 mr-2 text-pink-500" />
            Conectar cuenta de Instagram
          </DialogTitle>
          <DialogDescription>
            Conecta tu cuenta de Instagram para recibir y responder automáticamente a DMs, menciones y comentarios.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="bg-blue-50 p-4 rounded-md">
            <div className="flex space-x-2">
              <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />
              <div className="text-sm text-blue-700">
                <p className="font-medium">¿Cómo funciona?</p>
                <ol className="list-decimal list-inside mt-1 space-y-1">
                  <li>Serás redirigido a Instagram para iniciar sesión</li>
                  <li>Autoriza a kalma para acceder a mensajes y comentarios</li>
                  <li>Volverás automáticamente a kalma una vez completado</li>
                </ol>
              </div>
            </div>
          </div>
          
          <div className="border p-4 rounded-md">
            <h4 className="font-medium text-sm mb-2">Con esta conexión podrás:</h4>
            <ul className="text-sm space-y-2">
              <li className="flex items-start">
                <span className="bg-green-100 p-1 rounded-full mr-2 mt-0.5">✓</span>
                <span>Recibir mensajes directos de Instagram en kalma</span>
              </li>
              <li className="flex items-start">
                <span className="bg-green-100 p-1 rounded-full mr-2 mt-0.5">✓</span>
                <span>Ver y responder a comentarios en tus publicaciones</span>
              </li>
              <li className="flex items-start">
                <span className="bg-green-100 p-1 rounded-full mr-2 mt-0.5">✓</span>
                <span>Configurar respuestas automáticas con IA</span>
              </li>
              <li className="flex items-start">
                <span className="bg-green-100 p-1 rounded-full mr-2 mt-0.5">✓</span>
                <span>Obtener análisis de rendimiento de tus interacciones</span>
              </li>
              <li className="flex items-start">
                <span className="bg-green-100 p-1 rounded-full mr-2 mt-0.5">✓</span>
                <span>Ver y gestionar tu perfil completo de Instagram</span>
              </li>
            </ul>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConnect} 
            disabled={isLoading}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Conectando...
              </>
            ) : (
              <>
                <Instagram className="h-4 w-4 mr-2" />
                Conectar Instagram
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InstagramAuthModal;