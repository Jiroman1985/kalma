import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  MessageSquare, 
  Phone, 
  Mail, 
  Instagram, 
  Video, 
  Users, 
  Clock, 
  RefreshCcw 
} from 'lucide-react';

const features = [
  {
    title: "WhatsApp Business API",
    description: "Conecta tu WhatsApp Business y automatiza las consultas frecuentes de tus clientes.",
    icon: MessageSquare,
    color: "bg-green-500"
  },
  {
    title: "Atención telefónica con IA",
    description: "La IA atiende las llamadas, identifica intenciones y deriva a agentes humanos solo cuando es necesario.",
    icon: Phone,
    color: "bg-blue-500"
  },
  {
    title: "Email Inteligente",
    description: "Procesa y categoriza tus emails entrantes, respondiendo automáticamente a los más comunes.",
    icon: Mail,
    color: "bg-red-500"
  },
  {
    title: "Instagram Business",
    description: "Gestiona mensajes directos y comentarios con respuestas automáticas personalizadas.",
    icon: Instagram,
    color: "bg-pink-500"
  },
  {
    title: "Microsoft Teams",
    description: "Integra tu Microsoft Teams y mantén todas tus comunicaciones profesionales en un mismo lugar.",
    icon: Video,
    color: "bg-purple-500"
  },
  {
    title: "Visión 360º",
    description: "Todas las conversaciones unificadas en un solo lugar, con historial completo del cliente.",
    icon: RefreshCcw,
    color: "bg-amber-500"
  },
  {
    title: "Ahorra hasta 80% de tiempo",
    description: "Automatiza tareas repetitivas y dedica más tiempo a lo que realmente importa.",
    icon: Clock,
    color: "bg-indigo-500"
  },
  {
    title: "Mejora la satisfacción",
    description: "Respuestas instantáneas 24/7 que mejoran la experiencia de cliente y aumentan su fidelización.",
    icon: Users,
    color: "bg-cyan-500"
  }
];

const FeatureSection = () => {
  return (
    <section id="features" className="py-20 relative">
      {/* Background gradients - Reduced intensity */}
      <div className="absolute top-0 left-0 right-0 bottom-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-purple-400 opacity-5 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-40 left-20 w-96 h-96 bg-blue-400 opacity-5 rounded-full filter blur-3xl animate-pulse animation-delay-200"></div>
      </div>

      {/* Subtle pattern background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Todo lo que <span className="text-gradient">necesitas</span> en un solo lugar
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Kalma te permite unificar todos tus canales de comunicación con tus clientes en una única plataforma
            potenciada por IA.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="overflow-hidden group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
            >
              <CardHeader className="pb-0">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`${feature.color} text-white p-2 rounded-md group-hover:scale-110 transition-transform`}>
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureSection; 