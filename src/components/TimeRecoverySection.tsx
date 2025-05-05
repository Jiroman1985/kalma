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

// Componente de reloj estático (sin animaciones SVG complejas)
const StaticClock = memo(({ isInView }: { isInView: boolean }) => (
  <div className="relative w-full max-w-[400px] mx-auto">
    {/* Reloj estático con CSS para mejor rendimiento */}
    <div className="relative aspect-square rounded-full border-[15px] border-slate-200 transform-gpu optimize-paint">
      {/* Borde de progreso con CSS en lugar de SVG */}
      <div className={`absolute inset-[-15px] rounded-full border-[15px] border-transparent border-t-primary border-r-primary transition-all duration-1000 ease-out ${isInView ? 'opacity-100' : 'opacity-0'}`} 
        style={{ 
          clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%, 50% 50%)',
          transform: isInView ? 'rotate(80deg)' : 'rotate(0deg)',
          transitionDelay: '0.1s'
        }}
      />
      
      {/* Números del reloj - pre-renderizados */}
      <div className="absolute w-full h-full">
        <div className="absolute top-[5%] left-1/2 -translate-x-1/2 font-bold text-slate-500">12</div>
        <div className="absolute top-[15%] right-[15%] font-bold text-slate-500">1</div>
        <div className="absolute top-[35%] right-[5%] font-bold text-slate-500">2</div>
        <div className="absolute top-1/2 right-[2%] -translate-y-1/2 font-bold text-slate-500">3</div>
        <div className="absolute bottom-[35%] right-[5%] font-bold text-slate-500">4</div>
        <div className="absolute bottom-[15%] right-[15%] font-bold text-slate-500">5</div>
        <div className="absolute bottom-[5%] left-1/2 -translate-x-1/2 font-bold text-slate-500">6</div>
        <div className="absolute bottom-[15%] left-[15%] font-bold text-slate-500">7</div>
        <div className="absolute bottom-[35%] left-[5%] font-bold text-slate-500">8</div>
        <div className="absolute top-1/2 left-[2%] -translate-y-1/2 font-bold text-slate-500">9</div>
        <div className="absolute top-[35%] left-[5%] font-bold text-slate-500">10</div>
        <div className="absolute top-[15%] left-[15%] font-bold text-slate-500">11</div>
      </div>
      
      {/* Centro del reloj */}
      <div className="absolute top-1/2 left-1/2 w-5 h-5 rounded-full bg-purple-500 -translate-x-1/2 -translate-y-1/2" />
      
      {/* Manecillas - con CSS Transform en lugar de SVG */}
      <div className={`absolute top-1/2 left-1/2 w-1.5 h-[40%] bg-purple-500 rounded-full origin-bottom transition-transform duration-700 ease-out ${isInView ? 'opacity-100' : 'opacity-0'}`} 
        style={{ 
          transformOrigin: 'center bottom',
          transform: isInView ? 'translate(-50%, -100%) rotate(240deg)' : 'translate(-50%, -100%) rotate(0deg)',
          transitionDelay: '0.2s'
        }} 
      />
      
      <div className={`absolute top-1/2 left-1/2 w-3 h-[30%] bg-pink-500 rounded-full origin-bottom transition-transform duration-700 ease-out ${isInView ? 'opacity-100' : 'opacity-0'}`} 
        style={{ 
          transformOrigin: 'center bottom',
          transform: isInView ? 'translate(-50%, -100%) rotate(320deg)' : 'translate(-50%, -100%) rotate(0deg)',
          transitionDelay: '0.3s'
        }} 
      />
    </div>
  </div>
));

StaticClock.displayName = 'StaticClock';

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
            initial={{ opacity: 0, scale: 0.98 }}
            animate={controls}
            variants={{
              visible: { 
                opacity: 1, 
                scale: 1,
                transition: { duration: 0.3 }
              }
            }}
            className="relative transform-gpu"
          >
            {/* Reloj estático con animaciones CSS */}
            <div className="relative max-w-[400px] mx-auto">
              <StaticClock isInView={isInView} />
              
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