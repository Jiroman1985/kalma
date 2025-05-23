import React, { useState } from 'react';
import NangoConnect from '../components/NangoConnect';
import { useAuth } from '../contexts/AuthContext';

const NangoTest: React.FC = () => {
  const { currentUser } = useAuth();
  const [connections, setConnections] = useState<Array<{id: string, provider: string}>>([]);

  const handleConnectionSuccess = (connectionId: string, providerKey: string) => {
    setConnections(prev => [...prev, { id: connectionId, provider: providerKey }]);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Prueba de Integración Nango</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4">Conectar servicios</h2>
        <p className="text-gray-600 mb-4">
          Haz clic en los botones a continuación para conectar diferentes servicios a través de Nango.
        </p>
        
        <div className="flex flex-wrap gap-4">
          <NangoConnect
            userId={currentUser?.uid || 'anonymous'}
            provider="gmail"
            buttonText="Conectar Gmail"
            onSuccess={handleConnectionSuccess}
            className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg"
          />
          
          <NangoConnect
            userId={currentUser?.uid || 'anonymous'}
            provider="google-calendar"
            buttonText="Conectar Google Calendar"
            onSuccess={handleConnectionSuccess}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg"
          />
          
          <NangoConnect
            userId={currentUser?.uid || 'anonymous'}
            provider="outlook"
            buttonText="Conectar Outlook"
            onSuccess={handleConnectionSuccess}
            className="bg-blue-700 hover:bg-blue-800 text-white font-medium py-2 px-4 rounded-lg"
          />
        </div>
      </div>
      
      {connections.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Conexiones activas</h2>
          <ul className="list-disc pl-5">
            {connections.map((connection, index) => (
              <li key={index} className="mb-2">
                <span className="font-medium">{connection.provider}</span>: {connection.id}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default NangoTest; 