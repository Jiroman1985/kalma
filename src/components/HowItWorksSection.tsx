
import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

const steps = [
  {
    number: 1,
    title: "Personalización",
    description: "Configuramos tu asistente según las necesidades específicas de tu negocio",
    details: ["Entrenamiento personalizado", "Adaptación a tu marca", "Conocimiento específico de tu sector"]
  },
  {
    number: 2,
    title: "Integración",
    description: "Conectamos el asistente a tu número de WhatsApp Business existente",
    details: ["Sin perder tu número actual", "Proceso sencillo y guiado", "Soporte técnico incluido"]
  },
  {
    number: 3,
    title: "Activación",
    description: "Tu asistente comienza a trabajar respondiendo consultas automáticamente",
    details: ["Respuestas inmediatas", "Derivación de casos complejos", "Estadísticas y reportes"]
  }
];

const HowItWorksSection: React.FC = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        duration: 0.5
      } 
    }
  };

  return (
    <section id="como-funciona" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-4">¿Cómo Funciona?</h2>
          <p className="text-gray-600">
            Implementar nuestro asistente IA en WhatsApp es un proceso sencillo y rápido, sin complicaciones técnicas.
          </p>
        </div>
        
        <motion.div 
          ref={ref}
          className="flex flex-col lg:flex-row gap-8"
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={containerVariants}
        >
          {steps.map((step, index) => (
            <motion.div key={index} className="flex-1 relative" variants={itemVariants}>
              {/* Connector */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 right-0 w-full h-0.5 bg-gray-200 translate-x-1/2 z-0"></div>
              )}
              
              <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm h-full relative z-10 hover:shadow-lg transition-shadow">
                <div className="flex gap-4 items-start mb-6">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-whatsapp flex items-center justify-center text-white font-bold text-lg">
                    {step.number}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                    <p className="text-gray-600">{step.description}</p>
                  </div>
                </div>
                
                <div className="space-y-2 mt-4">
                  {step.details.map((detail, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-whatsapp flex-shrink-0" />
                      <span className="text-sm text-gray-700">{detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
