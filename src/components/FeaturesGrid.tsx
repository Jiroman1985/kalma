import React, { memo, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { MessageCircle, Phone, Mail, Instagram, Video, Eye, Clock, UserCheck } from "lucide-react";

// Componente de tarjeta memoizado para evitar re-renders innecesarios
const FeatureCard = memo(({ 
  icon, 
  iconBg, 
  title, 
  description, 
  index 
}: { 
  icon: React.ReactNode; 
  iconBg: string; 
  title: string; 
  description: string;
  index: number;
}) => {
  // Cada tarjeta tiene su propio ref y lógica de visibilidad para mejorar el rendimiento
  const cardRef = useRef(null);
  const isInView = useInView(cardRef, { 
    once: true, 
    amount: 0.1,
    margin: "0px 0px -10% 0px" // Cargar justo antes de aparecer en pantalla
  });

  // Animación simplificada solo cuando la tarjeta es visible
  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 15 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ 
        duration: 0.25, 
        delay: index * 0.03,
        ease: "easeOut" 
      }}
      className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-3 transform-gpu optimize-paint"
    >
      <div className={`${iconBg} w-12 h-12 rounded-xl flex items-center justify-center`}>
        {icon}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </motion.div>
  );
});

FeatureCard.displayName = 'FeatureCard';

// Componente de encabezado separado y memoizado
const SectionHeader = memo(({ isInView }: { isInView: boolean }) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={isInView ? { opacity: 1, y: 0 } : {}}
    transition={{ duration: 0.3 }}
    className="text-center max-w-3xl mx-auto mb-12 optimize-paint"
  >
    <h2 className="text-3xl md:text-4xl font-bold mb-4">
      Todo lo que <span className="text-gradient">necesitas</span> en un solo lugar
    </h2>
    <p className="text-lg text-muted-foreground">
      Kalma te permite unificar todos tus canales de comunicación con tus clientes en una
      única plataforma potenciada por IA.
    </p>
  </motion.div>
));

SectionHeader.displayName = 'SectionHeader';

const FeaturesGrid: React.FC = () => {
  // Optimizar usando un solo ref para la sección
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { 
    once: true, 
    amount: 0.1,
    margin: "0px 0px -20% 0px" // Cargar antes de aparecer completamente en pantalla
  });
  
  // Datos estáticos predefinidos para evitar recreaciones
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
      description: "La IA atiende las llamadas e identifica intenciones, derivando solo cuando es necesario."
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
      description: "Integra Microsoft Teams y mantén todas tus comunicaciones profesionales en un solo lugar."
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
      description: "Respuestas instantáneas 24/7 que mejoran la experiencia y aumentan la fidelización."
    }
  ];

  return (
    <section 
      ref={sectionRef} 
      className="py-16 md:py-20 bg-gradient-page optimize-size"
    >
      <div className="container mx-auto px-4">
        <SectionHeader isInView={isInView} />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              iconBg={feature.iconBg}
              title={feature.title}
              description={feature.description}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesGrid; 