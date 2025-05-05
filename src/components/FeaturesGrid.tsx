import React, { memo, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { MessageCircle, Phone, Mail, Instagram, Video, Eye, Clock, UserCheck } from "lucide-react";

// Componente de icono memoizado con animación única
const AnimatedIcon = memo(({ icon, bg, isInView, delay }: { 
  icon: React.ReactNode; 
  bg: string; 
  isInView: boolean; 
  delay: number 
}) => (
  <motion.div
    initial={{ scale: 0.8, opacity: 0 }}
    animate={isInView ? {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.6,
        delay: delay,
        ease: [0.23, 1, 0.32, 1] // Curva de Easing más suave
      }
    } : {}}
    className={`${bg} w-12 h-12 rounded-xl flex items-center justify-center`}
  >
    {icon}
  </motion.div>
));

AnimatedIcon.displayName = 'AnimatedIcon';

// Componente de tarjeta simplificado
const FeatureCard = memo(({ 
  icon, 
  iconBg, 
  title, 
  description, 
  index,
  total
}: { 
  icon: React.ReactNode; 
  iconBg: string; 
  title: string; 
  description: string;
  index: number;
  total: number;
}) => {
  // Referencia individual para controlar la visibilidad de la tarjeta
  const cardRef = useRef(null);
  const isInView = useInView(cardRef, { 
    once: true,  // Garantiza que la animación ocurra solo una vez
    amount: 0.3, // Mayor valor para activar de forma más confiable
    margin: "0px 0px -5% 0px" // Margen reducido para activación más precisa
  });

  // Simplificar las animaciones para evitar conflictos
  // Crear una progresión de retrasos más gradual
  const baseDelay = 0.15;
  const delay = baseDelay + (index * 0.08); // Mayor separación entre elementos
  
  // Efecto hover único y sutil
  const hoverEffect = { 
    y: -5, 
    boxShadow: "0 8px 25px rgba(0,0,0,0.08)", 
    transition: { duration: 0.3 } 
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 15 }}
      animate={isInView ? {
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.6,
          delay: delay,
          ease: [0.23, 1, 0.32, 1] // Curva de Easing suave
        }
      } : {}}
      whileHover={hoverEffect}
      className="bg-white rounded-xl p-5 shadow-sm flex flex-col gap-3"
    >
      <AnimatedIcon 
        icon={icon} 
        bg={iconBg} 
        isInView={isInView} 
        delay={delay + 0.1} 
      />
      
      <motion.h3 
        initial={{ opacity: 0 }}
        animate={isInView ? { 
          opacity: 1, 
          transition: { 
            duration: 0.4, 
            delay: delay + 0.15, 
            ease: "easeOut" 
          } 
        } : {}}
        className="text-lg font-semibold"
      >
        {title}
      </motion.h3>
      
      <motion.p 
        initial={{ opacity: 0 }}
        animate={isInView ? { 
          opacity: 1, 
          transition: { 
            duration: 0.4, 
            delay: delay + 0.2,
            ease: "easeOut" 
          } 
        } : {}}
        className="text-muted-foreground text-sm"
      >
        {description}
      </motion.p>
    </motion.div>
  );
});

FeatureCard.displayName = 'FeatureCard';

// Componente de encabezado con animaciones simplificadas
const SectionHeader = memo(({ isInView }: { isInView: boolean }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={isInView ? { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.7, 
        ease: [0.23, 1, 0.32, 1] 
      } 
    } : {}}
    className="text-center max-w-3xl mx-auto mb-12"
  >
    <motion.span
      initial={{ opacity: 0 }}
      animate={isInView ? { 
        opacity: 1, 
        transition: { 
          duration: 0.5, 
          delay: 0.1,
          ease: "easeOut" 
        } 
      } : {}}
      className="inline-block px-4 py-1 rounded-full bg-primary/5 text-primary text-sm font-medium mb-4"
    >
      Plataforma Todo en Uno
    </motion.span>
    
    <motion.h2 
      initial={{ opacity: 0 }}
      animate={isInView ? { 
        opacity: 1, 
        transition: { 
          duration: 0.5, 
          delay: 0.2,
          ease: "easeOut" 
        } 
      } : {}}
      className="text-3xl md:text-4xl font-bold mb-4"
    >
      Todo lo que <span className="text-gradient">necesitas</span> en un solo lugar
    </motion.h2>
    
    <motion.p 
      initial={{ opacity: 0 }}
      animate={isInView ? { 
        opacity: 1, 
        transition: { 
          duration: 0.5, 
          delay: 0.3,
          ease: "easeOut" 
        } 
      } : {}}
      className="text-lg text-muted-foreground"
    >
      Kalma te permite unificar todos tus canales de comunicación con tus clientes en una
      única plataforma potenciada por IA.
    </motion.p>
  </motion.div>
));

SectionHeader.displayName = 'SectionHeader';

// Elementos decorativos estáticos para evitar interferencia con animaciones principales
const Decorations = memo(() => (
  <>
    <div className="absolute top-10 right-10 w-64 h-64 bg-gradient-to-bl from-indigo-500/3 to-transparent rounded-full blur-3xl"></div>
    <div className="absolute bottom-20 left-10 w-48 h-48 bg-gradient-to-tr from-purple-500/3 to-transparent rounded-full blur-3xl"></div>
    <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-gradient-to-tr from-pink-500/3 to-transparent rounded-full blur-3xl"></div>
  </>
));

Decorations.displayName = 'Decorations';

const FeaturesGrid: React.FC = () => {
  // Optimizar usando un solo ref para la sección
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { 
    once: true, 
    amount: 0.1,
    margin: "0px 0px -10% 0px"
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
      className="py-16 md:py-24 bg-gradient-page relative overflow-hidden"
      id="caracteristicas"
    >
      <Decorations />
      
      <div className="container mx-auto px-4 relative z-10">
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
              total={features.length}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesGrid; 