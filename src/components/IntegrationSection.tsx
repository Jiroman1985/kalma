import React from 'react';

const integrations = [
  {
    name: "WhatsApp",
    icon: "https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg",
    color: "bg-green-500"
  },
  {
    name: "Instagram",
    icon: "https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg",
    color: "bg-pink-500"
  },
  {
    name: "Gmail",
    icon: "https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg",
    color: "bg-red-500"
  },
  {
    name: "Microsoft Teams",
    icon: "https://upload.wikimedia.org/wikipedia/commons/c/c9/Microsoft_Office_Teams_%282018%E2%80%93present%29.svg",
    color: "bg-blue-500"
  },
  {
    name: "Facebook Messenger",
    icon: "https://upload.wikimedia.org/wikipedia/commons/b/be/Facebook_Messenger_logo_2020.svg",
    color: "bg-blue-600"
  },
  {
    name: "Slack",
    icon: "https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg",
    color: "bg-purple-500"
  }
];

const IntegrationSection = () => {
  return (
    <section className="py-20 relative">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Integra todos tus <span className="text-gradient">canales</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Kalma se conecta con todas las plataformas que utilizas para comunicarte con tus clientes
          </p>
        </div>

        <div className="relative">
          {/* Central hub visualization - Improved with shadow and glow */}
          <div className="w-40 h-40 mx-auto mb-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-xl relative overflow-hidden border-2 border-primary/20">
            <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
            <div className="text-primary font-bold text-center relative z-10">
              <span className="block text-3xl">Kalma</span>
              <span className="text-sm">Central Hub</span>
            </div>
            <div className="absolute -bottom-10 -right-10 w-20 h-20 bg-primary/20 rounded-full filter blur-xl"></div>
          </div>

          {/* Connection lines with gradient and improved visibility */}
          <div className="hidden md:block absolute top-20 left-1/2 transform -translate-x-1/2 pointer-events-none">
            <svg width="800" height="300" viewBox="0 0 800 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-60">
              <defs>
                <linearGradient id="line-gradient-1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#9b87f5" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#25D366" stopOpacity="0.6" />
                </linearGradient>
                <linearGradient id="line-gradient-2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#9b87f5" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#E1306C" stopOpacity="0.6" />
                </linearGradient>
                <linearGradient id="line-gradient-3" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#9b87f5" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#EA4335" stopOpacity="0.6" />
                </linearGradient>
                <linearGradient id="line-gradient-4" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#9b87f5" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#4285F4" stopOpacity="0.6" />
                </linearGradient>
                <linearGradient id="line-gradient-5" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#9b87f5" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#0078FF" stopOpacity="0.6" />
                </linearGradient>
                <linearGradient id="line-gradient-6" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#9b87f5" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#4A154B" stopOpacity="0.6" />
                </linearGradient>
              </defs>
              {/* Curved connecting lines to each integration */}
              <path d="M400 40 C300 60, 200 80, 100 180" stroke="url(#line-gradient-1)" strokeWidth="2" />
              <path d="M400 40 C350 60, 300 80, 240 180" stroke="url(#line-gradient-2)" strokeWidth="2" />
              <path d="M400 40 C400 60, 400 80, 400 180" stroke="url(#line-gradient-3)" strokeWidth="2" />
              <path d="M400 40 C450 60, 500 80, 560 180" stroke="url(#line-gradient-4)" strokeWidth="2" />
              <path d="M400 40 C500 60, 600 80, 700 180" stroke="url(#line-gradient-5)" strokeWidth="2" />
              <path d="M400 40 C550 60, 700 80, 800 180" stroke="url(#line-gradient-6)" strokeWidth="2" />
            </svg>
          </div>

          {/* Integration icons with improved appearance */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 max-w-4xl mx-auto">
            {integrations.map((integration, index) => (
              <div key={index} className="flex flex-col items-center">
                <div 
                  className={`w-20 h-20 rounded-lg ${integration.color} flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer`}
                  style={{
                    boxShadow: `0 8px 20px -6px ${integration.color === 'bg-green-500' ? 'rgba(37, 211, 102, 0.6)' : 
                              integration.color === 'bg-pink-500' ? 'rgba(225, 48, 108, 0.6)' : 
                              integration.color === 'bg-red-500' ? 'rgba(234, 67, 53, 0.6)' : 
                              integration.color === 'bg-blue-500' ? 'rgba(66, 133, 244, 0.6)' : 
                              integration.color === 'bg-blue-600' ? 'rgba(0, 120, 255, 0.6)' : 'rgba(74, 21, 75, 0.6)'}`
                  }}
                >
                  <img 
                    src={integration.icon} 
                    alt={integration.name} 
                    className="w-12 h-12 object-contain" 
                    onError={(e) => {
                      // Fallback for SVG loading issues
                      e.currentTarget.src = `https://placehold.co/100x100/808080/FFF?text=${integration.name[0]}`;
                    }}
                  />
                </div>
                <span className="mt-2 font-medium">{integration.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-lg font-medium">¿No ves la integración que necesitas? <a href="#" className="text-primary underline hover:text-primary/80 transition-colors">Contacta con nosotros</a></p>
        </div>
      </div>
    </section>
  );
};

export default IntegrationSection; 