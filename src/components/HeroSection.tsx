
import { Button } from "./ui/button";
import { ChevronRight, MessageCircle, Shield, Bot, Clock } from "lucide-react";
import { motion } from "framer-motion";

const HeroSection: React.FC = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      } 
    }
  };

  return (
    <section className="relative pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden bg-gradient-to-br from-white to-accent">
      <div className="container mx-auto px-4">
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div className="order-2 md:order-1" variants={itemVariants}>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
              Tu Asistente IA por 
              <span className="text-whatsapp-dark"> WhatsApp </span> 
              para tu PYME
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Automatiza respuestas, genera leads y atiende a tus clientes 24/7 con un asistente virtual personalizado, sin perder el control de tu número.
            </p>
            
            <div className="flex flex-wrap items-center gap-4 mb-10">
              <Button asChild size="lg" className="bg-whatsapp hover:bg-whatsapp-dark transition-all shadow-lg hover:shadow-xl">
                <a href="#prueba-gratis" className="flex items-center gap-2">
                  Prueba Gratis 15 días <ChevronRight size={16} />
                </a>
              </Button>
              <a href="#como-funciona" className="text-whatsapp-dark hover:text-whatsapp flex items-center gap-1 font-medium">
                Cómo Funciona <ChevronRight size={14} />
              </a>
            </div>
            
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <Shield size={18} className="text-whatsapp" />
                <span className="text-sm text-gray-600">Control total de tu número</span>
              </div>
              <div className="flex items-center gap-2">
                <Bot size={18} className="text-whatsapp" />
                <span className="text-sm text-gray-600">IA personalizada</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-whatsapp" />
                <span className="text-sm text-gray-600">Disponible 24/7</span>
              </div>
            </div>
          </motion.div>
          
          <motion.div className="order-1 md:order-2" variants={itemVariants}>
            <div className="relative">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-light/10 rounded-full filter blur-3xl"></div>
              <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-whatsapp/10 rounded-full filter blur-3xl"></div>
              
              <div className="relative bg-white/80 backdrop-blur-sm border border-white/20 p-6 rounded-2xl shadow-xl md:transform md:-rotate-2 hover:rotate-0 transition-transform duration-300">
                <div className="bg-whatsapp/10 p-4 rounded-xl mb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <MessageCircle className="text-whatsapp" />
                    <h3 className="font-semibold">WhatsApp Business</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex gap-3 items-start">
                      <div className="bg-gray-200 w-8 h-8 rounded-full flex-shrink-0"></div>
                      <div className="bg-gray-100 rounded-lg p-3 text-sm">
                        Hola, me gustaría saber el horario de atención
                      </div>
                    </div>
                    <div className="flex gap-3 items-start flex-row-reverse">
                      <div className="bg-whatsapp/20 w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center">
                        <Bot size={16} className="text-whatsapp-dark" />
                      </div>
                      <div className="bg-whatsapp/10 rounded-lg p-3 text-sm">
                        ¡Hola! Nuestro horario de atención es de lunes a viernes de 9:00 a 18:00h. ¿En qué puedo ayudarte? 😊
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Tu asistente IA responde al instante</span>
                  <div className="flex -space-x-2">
                    <div className="w-6 h-6 rounded-full bg-blue-light/30 flex items-center justify-center text-xs text-blue-dark">✓</div>
                    <div className="w-6 h-6 rounded-full bg-whatsapp/30 flex items-center justify-center text-xs text-whatsapp-dark">✓</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
