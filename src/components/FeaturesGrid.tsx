import React, { memo, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { MessageCircle, Phone, Mail, Instagram, Video, Eye, Clock, UserCheck } from "lucide-react";

// Array de animaciones variadas para las tarjetas
const cardAnimations = [
  {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
  },
  {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } }
  },
  {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeInOut" } }
  },
  {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: "easeOut" } }
  },
];

// Componente de icono memoizado con animación
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
        duration: 0.4,
        delay: delay,
        ease: "easeOut"
      }
    } : {}}
    className={`${bg} w-12 h-12 rounded-xl flex items-center justify-center transform-gpu`}
  >
    {icon}
  </motion.div>
));

AnimatedIcon.displayName = 'AnimatedIcon';

// Componente de tarjeta memoizado con animaciones variadas
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
  // Cada tarjeta tiene su propio ref y lógica de visibilidad
  const cardRef = useRef(null);
  const isInView = useInView(cardRef, { 
    once: true, 
    amount: 0.2,
    margin: "0px 0px -10% 0px"
  });

  // Seleccionar una animación basada en patrones para crear variedad
  const animIndex = index % cardAnimations.length;
  const animation = cardAnimations[animIndex];
  
  // Crear retardos no lineales para simular un efecto más natural
  // Variar por filas y columnas en una cuadrícula para un efecto de "onda"
  const row = Math.floor(index / 4);
  const col = index % 4;
  const baseDelay = 0.1;
  const rowDelay = row * 0.08;
  const colDelay = col * 0.05;
  const delay = baseDelay + rowDelay + colDelay;
  
  // Alternar efectos de hover para mayor variedad
  const hoverEffect = index % 3 === 0 
    ? { scale: 1.03, y: -5, transition: { duration: 0.2 } }
    : index % 3 === 1 
      ? { scale: 1.02, boxShadow: "0 10px 30px rgba(0,0,0,0.05)", transition: { duration: 0.2 } }
      : { y: -3, boxShadow: "0 8px 25px rgba(0,0,0,0.04)", transition: { duration: 0.2 } };

  return (
    <motion.div
      ref={cardRef}
      initial={animation.initial}
      animate={isInView ? {
        ...animation.animate,
        transition: {
          ...animation.animate.transition,
          delay: delay
        }
      } : {}}
      whileHover={hoverEffect}
      className="bg-white rounded-xl p-5 shadow-sm transition-all duration-200 flex flex-col gap-3 transform-gpu optimize-paint"
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
            duration: 0.3, 
            delay: delay + 0.2 
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
            duration: 0.3, 
            delay: delay + 0.3 
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

// Componente de encabezado con animación de texto
const SectionHeader = memo(({ isInView }: { isInView: boolean }) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={isInView ? { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.5, 
        ease: "easeOut" 
      } 
    } : {}}
    className="text-center max-w-3xl mx-auto mb-12 optimize-paint"
  >
    <motion.span
      initial={{ opacity: 0, y: 10 }}
      animate={isInView ? { 
        opacity: 1, 
        y: 0, 
        transition: { 
          duration: 0.3, 
          delay: 0.1 
        } 
      } : {}}
      className="inline-block px-4 py-1 rounded-full bg-primary/5 text-primary text-sm font-medium mb-4"
    >
      Plataforma Todo en Uno
    </motion.span>
    
    <motion.h2 
      initial={{ opacity: 0, y: 10 }}
      animate={isInView ? { 
        opacity: 1, 
        y: 0, 
        transition: { 
          duration: 0.4, 
          delay: 0.2 
        } 
      } : {}}
      className="text-3xl md:text-4xl font-bold mb-4"
    >
      Todo lo que <span className="text-gradient animate-bg-shift">necesitas</span> en un solo lugar
    </motion.h2>
    
    <motion.p 
      initial={{ opacity: 0, y: 10 }}
      animate={isInView ? { 
        opacity: 1, 
        y: 0, 
        transition: { 
          duration: 0.4, 
          delay: 0.3 
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

const FeaturesGrid: React.FC = () => {
  // Optimizar usando un solo ref para la sección
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { 
    once: true, 
    amount: 0.1,
    margin: "0px 0px -20% 0px"
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

  // Elementos decorativos con movimiento para añadir vida a la sección
  const Decorations = () => (
    <>
      <div className="absolute top-10 right-10 w-64 h-64 bg-gradient-to-bl from-indigo-500/5 to-transparent rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-20 left-10 w-48 h-48 bg-gradient-to-tr from-purple-500/5 to-transparent rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }}></div>
      <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-gradient-to-tr from-pink-500/5 to-transparent rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }}></div>
    </>
  );

  return (
    <section 
      ref={sectionRef} 
      className="py-16 md:py-24 bg-gradient-page relative overflow-hidden optimize-size"
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