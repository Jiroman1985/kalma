import React from "react";
import { motion } from "framer-motion";
import { MessageCircle, Phone, Mail, Instagram, Video, Eye, Clock, UserCheck } from "lucide-react";

const FeatureCard = ({ 
  icon, 
  iconBg, 
  title, 
  description, 
  delay 
}: { 
  icon: React.ReactNode; 
  iconBg: string; 
  title: string; 
  description: string;
  delay: number;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true, margin: "-50px" }}
      className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 flex flex-col gap-4"
    >
      <div className={`${iconBg} w-12 h-12 rounded-xl flex items-center justify-center`}>
        {icon}
      </div>
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </motion.div>
  );
};

const FeaturesGrid: React.FC = () => {
  const features = [
    {
      icon: <MessageCircle className="h-6 w-6 text-white" />,
      iconBg: "bg-emerald-500",
      title: "WhatsApp Business API",
      description: "Conecta tu WhatsApp Business y automatiza las consultas frecuentes de tus clientes."
    },
    {
      icon: <Phone className="h-6 w-6 text-white" />,
      iconBg: "bg-blue-500",
      title: "Atención telefónica con IA",
      description: "La IA atiende las llamadas, identifica intenciones y deriva a agentes humanos solo cuando es necesario."
    },
    {
      icon: <Mail className="h-6 w-6 text-white" />,
      iconBg: "bg-red-500",
      title: "Email Inteligente",
      description: "Procesa y categoriza tus emails entrantes, respondiendo automáticamente a los más comunes."
    },
    {
      icon: <Instagram className="h-6 w-6 text-white" />,
      iconBg: "bg-pink-500",
      title: "Instagram Business",
      description: "Gestiona mensajes directos y comentarios con respuestas automáticas personalizadas."
    },
    {
      icon: <Video className="h-6 w-6 text-white" />,
      iconBg: "bg-purple-500",
      title: "Microsoft Teams",
      description: "Integra tu Microsoft Teams y mantén todas tus comunicaciones profesionales en un mismo lugar."
    },
    {
      icon: <Eye className="h-6 w-6 text-white" />,
      iconBg: "bg-amber-500",
      title: "Visión 360°",
      description: "Todas las conversaciones unificadas en un solo lugar, con historial completo del cliente."
    },
    {
      icon: <Clock className="h-6 w-6 text-white" />,
      iconBg: "bg-blue-500",
      title: "Ahorra hasta 80% de tiempo",
      description: "Automatiza tareas repetitivas y dedica más tiempo a lo que realmente importa."
    },
    {
      icon: <UserCheck className="h-6 w-6 text-white" />,
      iconBg: "bg-teal-500",
      title: "Mejora la satisfacción",
      description: "Respuestas instantáneas 24/7 que mejoran la experiencia de cliente y aumentan su fidelización."
    }
  ];

  return (
    <section className="py-20 bg-gradient-page">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-4xl font-bold mb-6">
            Todo lo que <span className="text-gradient">necesitas</span> en un solo lugar
          </h2>
          <p className="text-lg text-muted-foreground">
            Kalma te permite unificar todos tus canales de comunicación con tus clientes en una
            única plataforma potenciada por IA.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              iconBg={feature.iconBg}
              title={feature.title}
              description={feature.description}
              delay={index * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesGrid; 