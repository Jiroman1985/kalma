import React, { useState } from 'react';

const SimpleNangoDemo: React.FC = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionId, setConnectionId] = useState<string | null>(null);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      
      // Simple timeout para simular una operación asíncrona
      setTimeout(() => {
        // Mostrar un mensaje en vez de intentar la conexión real
        alert('En una implementación real, aquí se abriría la ventana de Nango para conectar con el proveedor.\n\nPara completar la implementación se necesita:\n1. Configurar una clave secreta en el servidor\n2. Crear un endpoint para generar tokens\n3. Configurar los proveedores en Nango');
        
        setConnectionId('demo-connection-id-123');
        setIsConnecting(false);
      }, 1000);
      
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setIsConnecting(false);
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Demo de Nango</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p><strong>Error:</strong> {error}</p>
        </div>
      )}
      
      {connectionId && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <p><strong>Conexión exitosa:</strong> {connectionId}</p>
        </div>
      )}
      
      <p className="mb-4 text-gray-600">
        Este es un componente de demostración para probar la integración con Nango.
      </p>
      
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className={`w-full py-2 px-4 rounded-lg ${
          isConnecting 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}
      >
        {isConnecting ? 'Conectando...' : 'Conectar servicio'}
      </button>
      
      <div className="mt-4 text-sm text-gray-500">
        <p>Para completar esta integración:</p>
        <ol className="list-decimal ml-5 mt-2">
          <li>Configura Nango con tus credenciales</li>
          <li>Implementa un endpoint para generar tokens de sesión</li>
          <li>Configura los webhooks para recibir eventos</li>
        </ol>
      </div>
    </div>
  );
};

export default SimpleNangoDemo; 