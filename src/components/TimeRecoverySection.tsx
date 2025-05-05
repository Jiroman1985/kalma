import React, { useEffect, useRef, memo } from "react";
import { motion, useInView, useAnimation } from "framer-motion";
import { Check } from "lucide-react";

// Componente memoizado para los items de beneficios con animaciones variadas
const BenefitItem = memo(({ benefit, index, controls }: { 
  benefit: string; 
  index: number;
  controls: any;
}) => {
  // Calcular retardos escalonados pero no lineales para un efecto más natural
  const delays = [0.15, 0.22, 0.28, 0.33, 0.37, 0.4];
  const delay = delays[index] || 0.2 + (index * 0.02);

  return (
    <motion.div 
      key={index}
      initial={{ opacity: 0, x: index % 2 === 0 ? 15 : -15 }} // Alternar dirección para más dinamismo
      animate={controls}
      variants={{
        visible: {
          opacity: 1,
          x: 0,
          transition: { 
            duration: 0.3, 
            delay: delay,
            ease: index % 2 === 0 ? "easeOut" : "easeInOut" // Variar la función de tiempo
          }
        }
      }}
      className="flex items-start gap-3 transform-gpu"
    >
      <div className={`mt-1 rounded-full p-1 ${index % 3 === 0 ? 'bg-primary/10' : index % 3 === 1 ? 'bg-secondary/10' : 'bg-accent/10'}`}>
        <Check size={16} className={index % 3 === 0 ? 'text-primary' : index % 3 === 1 ? 'text-secondary' : 'text-accent'} />
      </div>
      <p className="text-foreground/90">{benefit}</p>
    </motion.div>
  );
});

BenefitItem.displayName = 'BenefitItem';

// Componente de reloj con animaciones más naturales
const AnimatedClock = memo(({ isInView }: { isInView: boolean }) => (
  <div className="relative w-full max-w-[400px] mx-auto">
    {/* Base del reloj con efecto de "respiración" sutil */}
    <div className={`relative aspect-square rounded-full border-[15px] border-slate-200 transform-gpu animate-breathe ${isInView ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}>
      {/* Borde de progreso con animación más fluida */}
      <div className={`absolute inset-[-15px] rounded-full border-[15px] border-transparent border-t-primary border-r-primary transition-all duration-1500 ease-out ${isInView ? 'opacity-100' : 'opacity-0'}`} 
        style={{ 
          clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%, 50% 50%)',
          transform: isInView ? 'rotate(80deg)' : 'rotate(0deg)',
          transitionDelay: '0.2s',
          transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' // Bouncy effect
        }}
      />
      
      {/* Círculo interior con gradiente y efecto de brillo */}
      <div className={`absolute inset-[15px] rounded-full bg-gradient-to-br from-slate-50 to-slate-100 shadow-inner ${isInView ? 'animate-pulse-ring' : ''}`}></div>
      
      {/* Números del reloj con aparición secuencial */}
      <div className="absolute w-full h-full">
        {[...Array(12)].map((_, i) => {
          const angle = (i * 30) * (Math.PI / 180); // Convertir a radianes
          const x = 50 + 45 * Math.sin(angle);
          const y = 50 - 45 * Math.cos(angle);
          
          return (
            <div 
              key={i} 
              className={`absolute font-bold text-slate-500 transition-all duration-300 ${isInView ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} 
              style={{ 
                top: `${y}%`, 
                left: `${x}%`, 
                transform: 'translate(-50%, -50%)',
                transitionDelay: `${0.2 + i * 0.05}s` 
              }}
            >
              {i === 0 ? 12 : i}
            </div>
          );
        })}
      </div>
      
      {/* Centro del reloj con efecto de pulso */}
      <div className={`absolute top-1/2 left-1/2 w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 -translate-x-1/2 -translate-y-1/2 shadow-md ${isInView ? 'animate-pulse' : ''}`}></div>
      
      {/* Manecillas con movimientos más naturales */}
      <div className={`absolute top-1/2 left-1/2 w-1.5 h-[40%] bg-gradient-to-b from-purple-500 to-indigo-500 rounded-full origin-bottom transition-all duration-1000 ${isInView ? 'opacity-100' : 'opacity-0'}`} 
        style={{ 
          transformOrigin: 'center bottom',
          transform: isInView ? 'translate(-50%, -100%) rotate(240deg)' : 'translate(-50%, -100%) rotate(0deg)',
          transitionDelay: '0.5s',
          transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' // Bouncy effect
        }} 
      />
      
      <div className={`absolute top-1/2 left-1/2 w-3 h-[30%] bg-gradient-to-b from-pink-500 to-rose-600 rounded-full origin-bottom transition-all duration-1200 ${isInView ? 'opacity-100' : 'opacity-0'}`} 
        style={{ 
          transformOrigin: 'center bottom',
          transform: isInView ? 'translate(-50%, -100%) rotate(320deg)' : 'translate(-50%, -100%) rotate(0deg)',
          transitionDelay: '0.7s',
          transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' // Bouncy effect
        }} 
      />
      
      {/* Marcadores de minutos */}
      {[...Array(60)].map((_, i) => {
        if (i % 5 === 0) return null; // Saltar donde hay números
        
        const angle = (i * 6) * (Math.PI / 180);
        const outerX = 50 + 48 * Math.sin(angle);
        const outerY = 50 - 48 * Math.cos(angle);
        const innerX = 50 + 46 * Math.sin(angle);
        const innerY = 50 - 46 * Math.cos(angle);
        
        return (
          <div 
            key={i} 
            className={`absolute w-[1px] h-[1px] bg-slate-300 transition-all duration-300 ${isInView ? 'opacity-70' : 'opacity-0'}`} 
            style={{ 
              top: `${outerY}%`, 
              left: `${outerX}%`, 
              width: '1px',
              height: '3px',
              transform: `translate(-50%, -50%) rotate(${angle * (180/Math.PI)}deg)`,
              transitionDelay: `${0.8 + (i % 15) * 0.02}s` 
            }}
          />
        );
      })}
    </div>
  </div>
));

AnimatedClock.displayName = 'AnimatedClock';

// Elementos de estadística con animaciones variadas
const StatLabel = memo(({ children, position, delay, isInView }: { 
  children: React.ReactNode;
  position: "top" | "bottom";
  delay: number;
  isInView: boolean;
}) => {
  const variants = {
    hidden: { 
      opacity: 0, 
      y: position === "top" ? -15 : 15,
      x: position === "top" ? 0 : -5
    },
    visible: { 
      opacity: 1, 
      y: 0, 
      x: 0,
      transition: { 
        duration: 0.4, 
        delay,
        ease: "easeOut"
      }
    }
  };
  
  return (
    <motion.div 
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variants}
      className={`absolute ${position === "top" ? "top-0 right-0" : "bottom-10 left-0"} bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-md transform-gpu border border-slate-100`}
    >
      {children}
    </motion.div>
  );
});

StatLabel.displayName = 'StatLabel';

const TimeRecoverySection: React.FC = () => {
  const controls = useAnimation();
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { 
    once: true, 
    amount: 0.2,
    margin: "0px 0px -25% 0px" // Comenzar a cargar antes de estar completamente visible
  });
  
  // Iniciar animaciones solo cuando el componente es visible
  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);
  
  // Lista de beneficios enriquecida
  const benefits = [
    "IA que aprende de tus comunicaciones más efectivas",
    "Unificación de todos los canales de comunicación",
    "Estadísticas y analítica en tiempo real",
    "Plantillas de respuesta personalizables",
    "Chatbot avanzado con conocimiento de tu negocio",
    "Transferencia a agente humano cuando sea necesario"
  ];

  return (
    <section 
      ref={sectionRef} 
      className="py-16 md:py-20 bg-gradient-page relative overflow-hidden optimize-size"
    >
      {/* Elementos decorativos con movimiento sutil */}
      <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-gradient-to-bl from-purple-300/5 to-transparent rounded-full filter blur-3xl optimize-paint animate-float"></div>
      <div className="absolute bottom-0 left-0 w-[30%] h-[30%] bg-gradient-to-tr from-blue-300/5 to-transparent rounded-full filter blur-3xl optimize-paint animate-float" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-[40%] left-[10%] w-[15%] h-[15%] bg-gradient-to-tr from-pink-300/5 to-transparent rounded-full filter blur-3xl optimize-paint animate-float" style={{ animationDelay: '1.5s' }}></div>
      
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={controls}
            variants={{
              visible: { 
                opacity: 1, 
                scale: 1,
                transition: { 
                  duration: 0.5,
                  ease: "easeOut" 
                }
              }
            }}
            className="relative transform-gpu"
          >
            {/* Reloj con animaciones mejoradas */}
            <div className="relative max-w-[400px] mx-auto">
              <AnimatedClock isInView={isInView} />
              
              {/* Etiquetas con animaciones variadas */}
              <StatLabel position="top" delay={0.9} isInView={isInView}>
                <p className="text-lg font-bold text-gradient">+10 horas</p>
                <p className="text-sm text-muted-foreground">ahorradas por semana</p>
              </StatLabel>
              
              <StatLabel position="bottom" delay={1.1} isInView={isInView}>
                <p className="text-3xl font-bold text-gradient">80%</p>
                <p className="text-sm text-muted-foreground">menos tiempo en tareas repetitivas</p>
              </StatLabel>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 15 }}
            animate={controls}
            variants={{
              visible: {
                opacity: 1,
                x: 0,
                transition: { 
                  duration: 0.5,
                  ease: "easeOut"
                }
              }
            }}
            className="transform-gpu"
          >
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              animate={controls}
              variants={{
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { 
                    duration: 0.4,
                    ease: "easeOut"
                  }
                }
              }}
              className="text-3xl md:text-4xl font-bold mb-5"
            >
              Recupera tu tiempo y <span className="text-gradient animate-bg-shift">vive con Kalma</span>
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={controls}
              variants={{
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { 
                    duration: 0.4,
                    delay: 0.1,
                    ease: "easeOut"
                  }
                }
              }}
              className="text-lg text-foreground/80 mb-6"
            >
              Automatiza las comunicaciones con tus clientes y dedica más tiempo a
              hacer crecer tu negocio y a disfrutar de lo que realmente importa.
            </motion.p>
            
            <div className="space-y-3 mb-8">
              {benefits.map((benefit, index) => (
                <BenefitItem 
                  key={index}
                  benefit={benefit} 
                  index={index} 
                  controls={controls} 
                />
              ))}
            </div>
            
            <motion.a 
              href="#prueba"
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={controls}
              variants={{
                visible: {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: { 
                    duration: 0.4, 
                    delay: 0.6,
                    ease: "easeOut"
                  }
                }
              }}
              whileHover={{ 
                scale: 1.03,
                boxShadow: "0px 10px 25px rgba(139, 92, 246, 0.2)",
                transition: { duration: 0.2 }
              }}
              whileTap={{ scale: 0.97 }}
              className="btn-primary-gradient inline-block transform-gpu"
            >
              Prueba Kalma gratis por 14 días
            </motion.a>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default TimeRecoverySection; 