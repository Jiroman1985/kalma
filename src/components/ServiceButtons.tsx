import React, { useState } from 'react';

interface Service {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const services: Service[] = [
  { 
    id: 'gmail', 
    name: 'Gmail', 
    icon: '✉️', 
    color: 'bg-red-500 hover:bg-red-600' 
  },
  { 
    id: 'google-calendar', 
    name: 'Google Calendar', 
    icon: '📅', 
    color: 'bg-blue-500 hover:bg-blue-600' 
  },
  { 
    id: 'outlook', 
    name: 'Outlook', 
    icon: '📨', 
    color: 'bg-blue-700 hover:bg-blue-800' 
  },
  { 
    id: 'instagram', 
    name: 'Instagram', 
    icon: '📷', 
    color: 'bg-pink-500 hover:bg-pink-600' 
  }
];

const ServiceButtons: React.FC = () => {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{serviceId: string, connected: boolean}[]>([]);

  const handleConnect = (service: Service) => {
    setSelectedService(service.id);
    setIsConnecting(true);
    
    // Simular el proceso de conexión
    console.log(`Conectando con ${service.name}...`);
    
    // En una implementación real, aquí iría el código para obtener el token y conectar con Nango:
    /*
    // 1. Obtener token desde el backend
    const response = await fetch('/api/nango/session-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'current-user-id' })
    });
    const { token } = await response.json();
    
    // 2. Inicializar Nango con el token
    const nango = new Nango({ connectSessionToken: token });
    
    // 3. Iniciar el flujo de autorización
    nango.auth(service.id)
      .then(result => {
        console.log('Conexión exitosa:', result);
        setConnectionStatus(prev => [...prev, { serviceId: service.id, connected: true }]);
      })
      .catch(error => {
        console.error('Error de conexión:', error);
      })
      .finally(() => {
        setIsConnecting(false);
        setSelectedService(null);
      });
    */
    
    // Simular una conexión exitosa después de un tiempo
    setTimeout(() => {
      alert(`Simulando conexión con ${service.name}\n\nEn una implementación real, se abriría una ventana para autenticar al usuario con ${service.name} y se enviaría la información a Nango siguiendo la documentación:\n\nhttps://docs.nango.dev/guides/api-authorization/authorize-in-your-app-custom-ui`);
      
      setConnectionStatus(prev => [...prev, { serviceId: service.id, connected: true }]);
      setIsConnecting(false);
      setSelectedService(null);
    }, 1500);
  };

  const isConnected = (serviceId: string) => {
    return connectionStatus.some(status => status.serviceId === serviceId && status.connected);
  };

  return (
    <div className="py-8">
      <h2 className="text-3xl font-bold text-center mb-8">Conecta tus servicios</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {services.map(service => (
          <div 
            key={service.id}
            className="bg-white rounded-lg shadow-md overflow-hidden"
          >
            <div className={`h-2 ${service.color}`}></div>
            <div className="p-6">
              <div className="flex items-center mb-4">
                <span className="text-2xl mr-3">{service.icon}</span>
                <h3 className="text-xl font-semibold">{service.name}</h3>
                {isConnected(service.id) && (
                  <span className="ml-auto bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    Conectado
                  </span>
                )}
              </div>
              
              <p className="text-gray-600 mb-4">
                Conecta tu cuenta de {service.name} para sincronizar datos y automatizar tareas.
              </p>
              
              <button
                onClick={() => handleConnect(service)}
                disabled={isConnecting && selectedService === service.id}
                className={`w-full py-2 px-4 rounded-lg text-white ${
                  isConnecting && selectedService === service.id
                    ? 'bg-gray-400 cursor-not-allowed'
                    : isConnected(service.id)
                      ? 'bg-green-500 hover:bg-green-600'
                      : service.color
                }`}
              >
                {isConnecting && selectedService === service.id ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Conectando...
                  </span>
                ) : isConnected(service.id) ? (
                  'Reconectar'
                ) : (
                  `Conectar con ${service.name}`
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {connectionStatus.length > 0 && (
        <div className="mt-8 p-6 bg-white rounded-lg shadow-md max-w-4xl mx-auto">
          <h3 className="text-xl font-semibold mb-4">Servicios conectados</h3>
          <ul className="space-y-2">
            {connectionStatus.map((status, index) => {
              const service = services.find(s => s.id === status.serviceId);
              return (
                <li key={index} className="flex items-center">
                  <span className="mr-2">{service?.icon}</span>
                  <span>{service?.name}</span>
                  <span className="ml-auto text-green-600">✓ Conectado</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ServiceButtons; 