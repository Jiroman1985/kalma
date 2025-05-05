import React, { useEffect, useRef, memo } from "react";
import { motion, useInView, useAnimation } from "framer-motion";
import { Check } from "lucide-react";

// Componente memoizado para los items de beneficios
const BenefitItem = memo(({ benefit, index, controls }: { 
  benefit: string; 
  index: number;
  controls: any;
}) => (
  <motion.div 
    key={index}
    initial={{ opacity: 0, x: 15 }}
    animate={controls}
    variants={{
      visible: {
        opacity: 1,
        x: 0,
        transition: { 
          duration: 0.25, 
          delay: 0.2 + (index * 0.03) 
        }
      }
    }}
    className="flex items-start gap-3 transform-gpu"
  >
    <div className="mt-1 bg-primary/10 rounded-full p-1">
      <Check size={16} className="text-primary" />
    </div>
    <p className="text-foreground/90">{benefit}</p>
  </motion.div>
));

BenefitItem.displayName = 'BenefitItem';

// Componente del reloj memoizado
const ClockComponent = memo(({ controls }: { controls: any }) => (
  <svg className="w-full h-auto" viewBox="0 0 400 400">
    <circle 
      cx="200" 
      cy="200" 
      r="180" 
      fill="none" 
      stroke="#e2e8f0" 
      strokeWidth="15"
    />
    <motion.circle 
      cx="200" 
      cy="200" 
      r="180" 
      fill="none" 
      stroke="url(#gradient)" 
      strokeWidth="15"
      strokeDasharray="1130"
      strokeDashoffset="1130"
      animate={controls}
      variants={{
        visible: {
          strokeDashoffset: 226,
          transition: { 
            duration: 1.2, 
            ease: "easeOut"
          }
        }
      }}
    />
    
    {/* Números del reloj - Pre-renderizados para evitar cálculos en tiempo real */}
    <text x="200" y="50" textAnchor="middle" dominantBaseline="middle" fontSize="18" fontWeight="bold" fill="#64748b">12</text>
    <text x="275" y="75" textAnchor="middle" dominantBaseline="middle" fontSize="18" fontWeight="bold" fill="#64748b">1</text>
    <text x="325" y="125" textAnchor="middle" dominantBaseline="middle" fontSize="18" fontWeight="bold" fill="#64748b">2</text>
    <text x="350" y="200" textAnchor="middle" dominantBaseline="middle" fontSize="18" fontWeight="bold" fill="#64748b">3</text>
    <text x="325" y="275" textAnchor="middle" dominantBaseline="middle" fontSize="18" fontWeight="bold" fill="#64748b">4</text>
    <text x="275" y="325" textAnchor="middle" dominantBaseline="middle" fontSize="18" fontWeight="bold" fill="#64748b">5</text>
    <text x="200" y="350" textAnchor="middle" dominantBaseline="middle" fontSize="18" fontWeight="bold" fill="#64748b">6</text>
    <text x="125" y="325" textAnchor="middle" dominantBaseline="middle" fontSize="18" fontWeight="bold" fill="#64748b">7</text>
    <text x="75" y="275" textAnchor="middle" dominantBaseline="middle" fontSize="18" fontWeight="bold" fill="#64748b">8</text>
    <text x="50" y="200" textAnchor="middle" dominantBaseline="middle" fontSize="18" fontWeight="bold" fill="#64748b">9</text>
    <text x="75" y="125" textAnchor="middle" dominantBaseline="middle" fontSize="18" fontWeight="bold" fill="#64748b">10</text>
    <text x="125" y="75" textAnchor="middle" dominantBaseline="middle" fontSize="18" fontWeight="bold" fill="#64748b">11</text>
    
    {/* Manecillas del reloj con animaciones optimizadas */}
    <motion.line 
      x1="200" 
      y1="200" 
      x2="200" 
      y2="100" 
      stroke="#f43f5e" 
      strokeWidth="6" 
      strokeLinecap="round"
      animate={controls}
      variants={{
        visible: {
          rotate: 320,
          transition: { 
            duration: 0.6, 
            ease: "easeOut" 
          }
        }
      }}
      style={{ transformOrigin: "center center" }}
    />
    
    <motion.line 
      x1="200" 
      y1="200" 
      x2="310" 
      y2="200" 
      stroke="#8b5cf6" 
      strokeWidth="3" 
      strokeLinecap="round"
      animate={controls}
      variants={{
        visible: {
          rotate: 240,
          transition: { 
            duration: 0.8, 
            ease: "easeOut" 
          }
        }
      }}
      style={{ transformOrigin: "center center" }}
    />
    
    <circle cx="200" cy="200" r="10" fill="#8b5cf6" />
    
    {/* Definición del gradiente */}
    <defs>
      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#8b5cf6" />
        <stop offset="100%" stopColor="#6366f1" />
      </linearGradient>
    </defs>
  </svg>
));

ClockComponent.displayName = 'ClockComponent';

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
  
  // Lista de beneficios predefinida para evitar recreaciones innecesarias
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
      {/* Elementos decorativos simplificados para mejor rendimiento */}
      <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-gradient-to-bl from-purple-300/5 to-transparent rounded-full filter blur-3xl optimize-paint"></div>
      <div className="absolute bottom-0 left-0 w-[30%] h-[30%] bg-gradient-to-tr from-blue-300/5 to-transparent rounded-full filter blur-3xl optimize-paint"></div>
      
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={controls}
            variants={{
              visible: { 
                opacity: 1, 
                scale: 1,
                transition: { duration: 0.4 }
              }
            }}
            className="relative transform-gpu"
          >
            {/* Contenedor de reloj optimizado con componente memoizado */}
            <div className="relative max-w-[400px] mx-auto">
              {/* Reloj como componente separado y memoizado */}
              <ClockComponent controls={controls} />
              
              {/* Etiqueta de +10 horas */}
              <motion.div 
                className="absolute top-0 right-0 bg-white px-4 py-2 rounded-lg shadow-md transform-gpu"
                animate={controls}
                variants={{
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.25, delay: 0.7 }
                  }
                }}
                initial={{ opacity: 0, y: 15 }}
              >
                <p className="text-lg font-bold text-gradient">+10 horas</p>
                <p className="text-sm text-muted-foreground">ahorradas por semana</p>
              </motion.div>
              
              {/* Etiqueta de 80% */}
              <motion.div 
                className="absolute bottom-10 left-0 bg-white px-4 py-2 rounded-lg shadow-md transform-gpu"
                animate={controls}
                variants={{
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.25, delay: 0.8 }
                  }
                }}
                initial={{ opacity: 0, y: 15 }}
              >
                <p className="text-3xl font-bold text-gradient">80%</p>
                <p className="text-sm text-muted-foreground">menos tiempo en tareas repetitivas</p>
              </motion.div>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 15 }}
            animate={controls}
            variants={{
              visible: {
                opacity: 1,
                x: 0,
                transition: { duration: 0.3 }
              }
            }}
            className="transform-gpu"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-5">
              Recupera tu tiempo y <span className="text-gradient">vive con Kalma</span>
            </h2>
            
            <p className="text-lg text-foreground/80 mb-6">
              Automatiza las comunicaciones con tus clientes y dedica más tiempo a
              hacer crecer tu negocio y a disfrutar de lo que realmente importa.
            </p>
            
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
              initial={{ opacity: 0, y: 10 }}
              animate={controls}
              variants={{
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.25, delay: 0.5 }
                }
              }}
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