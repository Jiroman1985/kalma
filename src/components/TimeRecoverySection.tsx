import React, { useEffect, useRef, memo } from "react";
import { motion, useInView, useAnimation } from "framer-motion";
import { Check } from "lucide-react";

// Componente memoizado para los items de beneficios
const BenefitItem = memo(({ benefit, index, controls }: { 
  benefit: string; 
  index: number;
  controls: any;
}) => {
  // Retardos simples y consistentes
  const delay = 0.6 + (index * 0.1);

  return (
    <motion.div 
      key={index}
      initial={{ opacity: 0, x: -10 }}
      animate={controls}
      variants={{
        visible: {
          opacity: 1,
          x: 0,
          transition: { 
            duration: 0.5, 
            delay: delay,
            ease: "easeOut"
          }
        }
      }}
      className="flex items-start gap-3"
    >
      <div className="mt-1 bg-primary/10 rounded-full p-1">
        <Check size={16} className="text-primary" />
      </div>
      <p className="text-foreground/90">{benefit}</p>
    </motion.div>
  );
});

BenefitItem.displayName = 'BenefitItem';

// Reloj simplificado sin animaciones complejas
const SimpleClock = memo(({ isVisible }: { isVisible: boolean }) => {
  // Usamos una única animación fade-in suave
  return (
    <div className="relative w-full max-w-[400px] mx-auto">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: isVisible ? 1 : 0,
          transition: { duration: 0.8, ease: "easeOut" }
        }}
        className="relative aspect-square rounded-full border-[15px] border-slate-200"
      >
        {/* Borde de progreso con animación simple de una sola vez */}
        <motion.div 
          className="absolute inset-[-15px] rounded-full border-[15px] border-transparent border-t-primary border-r-primary" 
          initial={{ transform: 'rotate(0deg)', opacity: 0 }}
          animate={{ 
            transform: isVisible ? 'rotate(80deg)' : 'rotate(0deg)',
            opacity: isVisible ? 1 : 0,
            transition: { 
              duration: 1, 
              delay: 0.3,
              ease: "easeOut" 
            }
          }}
          style={{ 
            clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%, 50% 50%)'
          }}
        />
        
        {/* Círculo interior sin animaciones adicionales */}
        <div className="absolute inset-[15px] rounded-full bg-gradient-to-br from-slate-50 to-slate-100 shadow-inner"></div>
        
        {/* Números del reloj con fade-in simple */}
        <div className="absolute w-full h-full">
          {[...Array(12)].map((_, i) => {
            const angle = (i * 30) * (Math.PI / 180);
            const x = 50 + 45 * Math.sin(angle);
            const y = 50 - 45 * Math.cos(angle);
            
            return (
              <motion.div 
                key={i} 
                className="absolute font-bold text-slate-500"
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: isVisible ? 1 : 0,
                  transition: { 
                    duration: 0.5, 
                    delay: 0.5 + (i * 0.03),
                    ease: "easeOut" 
                  }
                }}
                style={{ 
                  top: `${y}%`, 
                  left: `${x}%`, 
                  transform: 'translate(-50%, -50%)'
                }}
              >
                {i === 0 ? 12 : i}
              </motion.div>
            );
          })}
        </div>
        
        {/* Centro del reloj */}
        <motion.div 
          className="absolute top-1/2 left-1/2 w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 -translate-x-1/2 -translate-y-1/2 shadow-md"
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: isVisible ? 1 : 0,
            transition: { duration: 0.5, delay: 0.6 }
          }}
        />
        
        {/* Manecillas con animación simple */}
        <motion.div 
          className="absolute top-1/2 left-1/2 w-1.5 h-[40%] bg-gradient-to-b from-purple-500 to-indigo-500 rounded-full origin-bottom"
          initial={{ opacity: 0, transform: 'translate(-50%, -100%) rotate(0deg)' }}
          animate={{ 
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translate(-50%, -100%) rotate(240deg)' : 'translate(-50%, -100%) rotate(0deg)',
            transition: { 
              duration: 0.8, 
              delay: 0.8,
              ease: "easeOut" 
            }
          }}
          style={{ transformOrigin: 'center bottom' }}
        />
        
        <motion.div 
          className="absolute top-1/2 left-1/2 w-3 h-[30%] bg-gradient-to-b from-pink-500 to-rose-600 rounded-full origin-bottom"
          initial={{ opacity: 0, transform: 'translate(-50%, -100%) rotate(0deg)' }}
          animate={{ 
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translate(-50%, -100%) rotate(320deg)' : 'translate(-50%, -100%) rotate(0deg)',
            transition: { 
              duration: 0.8, 
              delay: 1,
              ease: "easeOut" 
            }
          }}
          style={{ transformOrigin: 'center bottom' }}
        />
      </motion.div>
    </div>
  );
});

SimpleClock.displayName = 'SimpleClock';

// Tarjetas de estadísticas simplificadas
const StatCard = memo(({ 
  children, 
  position, 
  delay, 
  isVisible 
}: { 
  children: React.ReactNode;
  position: "top" | "bottom";
  delay: number;
  isVisible: boolean;
}) => (
  <motion.div 
    initial={{ opacity: 0, y: position === "top" ? -10 : 10 }}
    animate={{ 
      opacity: isVisible ? 1 : 0,
      y: isVisible ? 0 : (position === "top" ? -10 : 10),
      transition: { duration: 0.7, delay, ease: "easeOut" }
    }}
    className={`absolute ${position === "top" ? "top-0 right-0" : "bottom-10 left-0"} bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-md border border-slate-100`}
  >
    {children}
  </motion.div>
));

StatCard.displayName = 'StatCard';

const TimeRecoverySection: React.FC = () => {
  const controls = useAnimation();
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { 
    once: true, // Garantiza que la animación ocurra una sola vez
    amount: 0.3, // Aumentar para una detección más temprana
    margin: "0px 0px -20% 0px" // Precargar antes de llegar a la vista
  });
  
  // Iniciar animaciones solo una vez cuando el componente sea visible
  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);
  
  // Lista de beneficios
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
      className="py-16 md:py-20 bg-gradient-page relative overflow-hidden"
      id="ahorro-tiempo"
    >
      {/* Elementos decorativos estáticos sin animaciones */}
      <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-gradient-to-bl from-purple-300/3 to-transparent rounded-full filter blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-[30%] h-[30%] bg-gradient-to-tr from-blue-300/3 to-transparent rounded-full filter blur-3xl"></div>
      
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={controls}
            variants={{
              visible: { 
                opacity: 1,
                transition: { 
                  duration: 0.8,
                  ease: "easeOut" 
                }
              }
            }}
            className="relative"
          >
            {/* Reloj con animaciones simplificadas */}
            <div className="relative max-w-[400px] mx-auto">
              <SimpleClock isVisible={isInView} />
              
              {/* Etiquetas de estadísticas */}
              <StatCard position="top" delay={1.2} isVisible={isInView}>
                <p className="text-lg font-bold text-gradient">+10 horas</p>
                <p className="text-sm text-muted-foreground">ahorradas por semana</p>
              </StatCard>
              
              <StatCard position="bottom" delay={1.4} isVisible={isInView}>
                <p className="text-3xl font-bold text-gradient">80%</p>
                <p className="text-sm text-muted-foreground">menos tiempo en tareas repetitivas</p>
              </StatCard>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={controls}
            variants={{
              visible: {
                opacity: 1,
                transition: { 
                  duration: 0.7,
                  ease: "easeOut"
                }
              }
            }}
            className="relative"
          >
            <motion.h2 
              initial={{ opacity: 0 }}
              animate={controls}
              variants={{
                visible: {
                  opacity: 1,
                  transition: { 
                    duration: 0.6,
                    delay: 0.1,
                    ease: "easeOut"
                  }
                }
              }}
              className="text-3xl md:text-4xl font-bold mb-5"
            >
              Recupera tu tiempo y <span className="text-gradient">vive con Kalma</span>
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={controls}
              variants={{
                visible: {
                  opacity: 1,
                  transition: { 
                    duration: 0.6,
                    delay: 0.2,
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
              initial={{ opacity: 0 }}
              animate={controls}
              variants={{
                visible: {
                  opacity: 1,
                  transition: { 
                    duration: 0.6, 
                    delay: 1.5,
                    ease: "easeOut"
                  }
                }
              }}
              whileHover={{ 
                scale: 1.02,
                transition: { duration: 0.2 }
              }}
              className="btn-primary-gradient inline-block"
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