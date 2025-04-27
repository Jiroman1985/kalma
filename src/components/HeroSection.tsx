import { Button } from "./ui/button";
import { ChevronRight, MessageCircle, Shield, Bot, Clock, BriefcaseBusiness, BarChart3, Smartphone } from "lucide-react";
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

  const chatExamples = [
    {
      question: "Hola, ¿cuáles son sus horarios de atención?",
      answer: "¡Hola! Nuestro horario de atención es de lunes a viernes de 9:00 a 18:00h. ¿En qué puedo ayudarte? 😊",
      icon: <Clock size={16} className="text-whatsapp-dark" />
    },
    {
      question: "Quiero cotizar un servicio para mi empresa",
      answer: "Por supuesto. Para brindarte una cotización personalizada necesito algunos detalles de tu empresa. ¿Podrías indicarme el tamaño aproximado de tu negocio y qué servicios te interesan?",
      icon: <BriefcaseBusiness size={16} className="text-whatsapp-dark" />
    },
    {
      question: "¿Cómo puedo integrar mis redes sociales con WhatsPyme?",
      answer: "¡Es muy sencillo! En tu dashboard, ve a la sección de 'Redes Sociales', conecta tus cuentas y establece reglas de gestión automática. ¿Te gustaría una guía paso a paso?",
      icon: <Smartphone size={16} className="text-whatsapp-dark" />
    }
  ];

  return (
    <section className="relative pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden bg-gradient-to-br from-white to-accent/20">
      <div className="absolute top-0 right-0 -z-10 w-[40%] h-full bg-gradient-to-bl from-whatsapp/5 to-transparent"></div>
      <div className="absolute top-1/3 left-0 -z-10 w-1/3 h-1/3 bg-gradient-to-tr from-blue-light/10 to-transparent rounded-full filter blur-3xl"></div>
      
      <div className="container mx-auto px-4">
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div className="order-2 md:order-1" variants={itemVariants}>
            <div className="inline-block px-3 py-1 rounded-full bg-whatsapp/10 text-whatsapp-dark font-medium text-sm mb-6">
              Tu negocio, más inteligente
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              Tu Asistente IA por 
              <span className="text-whatsapp-dark"> WhatsApp </span> 
              para tu PYME
            </h1>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Automatiza respuestas, genera leads y atiende a tus clientes 24/7 con un asistente virtual personalizado que integra WhatsApp, redes sociales y analíticas en una sola plataforma.
            </p>
            
            <div className="flex flex-wrap items-center gap-4 mb-10">
              <Button asChild size="lg" className="bg-whatsapp hover:bg-whatsapp-dark transition-all shadow-lg hover:shadow-xl">
                <a href="#prueba-gratis" className="flex items-center gap-2">
                  Prueba Gratis 15 días <ChevronRight size={16} />
                </a>
              </Button>
              <a href="#como-funciona" className="text-whatsapp-dark hover:text-whatsapp flex items-center gap-1 font-medium">
                Ver Cómo Funciona <ChevronRight size={14} />
              </a>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-whatsapp/10 flex items-center justify-center">
                  <Shield size={18} className="text-whatsapp-dark" />
                </div>
                <span className="text-sm text-gray-600">Control total de tu número</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-whatsapp/10 flex items-center justify-center">
                  <Bot size={18} className="text-whatsapp-dark" />
                </div>
                <span className="text-sm text-gray-600">IA personalizada</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-whatsapp/10 flex items-center justify-center">
                  <Clock size={18} className="text-whatsapp-dark" />
                </div>
                <span className="text-sm text-gray-600">Disponible 24/7</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-whatsapp/10 flex items-center justify-center">
                  <BarChart3 size={18} className="text-whatsapp-dark" />
                </div>
                <span className="text-sm text-gray-600">Analíticas avanzadas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-whatsapp/10 flex items-center justify-center">
                  <Smartphone size={18} className="text-whatsapp-dark" />
                </div>
                <span className="text-sm text-gray-600">Multiredes sociales</span>
              </div>
            </div>
          </motion.div>
          
          <motion.div className="order-1 md:order-2" variants={itemVariants}>
            <div className="relative">
              <div className="absolute -top-20 -right-20 w-72 h-72 bg-blue-light/10 rounded-full filter blur-3xl"></div>
              <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-whatsapp/10 rounded-full filter blur-3xl"></div>
              
              <div className="relative lg:w-[120%] bg-white/90 backdrop-blur-sm border border-white/20 p-6 rounded-2xl shadow-xl md:transform md:-rotate-1 hover:rotate-0 transition-all duration-300 hover:shadow-2xl">
                <div className="bg-gray-50 p-4 rounded-xl mb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <MessageCircle className="text-whatsapp" />
                    <h3 className="font-semibold">WhatsPyme Assistant</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {chatExamples.map((example, index) => (
                      <motion.div 
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ 
                          opacity: 1, 
                          y: 0,
                          transition: { delay: 0.3 + (index * 0.2) }
                        }}
                        className="space-y-3"
                      >
                        <div className="flex gap-3 items-start">
                          <div className="bg-gray-200 w-8 h-8 rounded-full flex-shrink-0"></div>
                          <div className="bg-gray-100 rounded-lg p-3 text-sm">
                            {example.question}
                          </div>
                        </div>
                        <div className="flex gap-3 items-start flex-row-reverse">
                          <div className="bg-whatsapp/20 w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center">
                            {example.icon}
                          </div>
                          <div className="bg-whatsapp/10 rounded-lg p-3 text-sm">
                            {example.answer}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Respuestas personalizadas al instante</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-whatsapp-dark font-medium">WhatsPyme</span>
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
