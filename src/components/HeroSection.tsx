import React from "react";
import { Button } from "./ui/button";
import { ChevronRight, MessageCircle, Shield, Bot, Clock, BriefcaseBusiness, BarChart3, Smartphone, Globe, Zap, Users, Sparkles, ArrowRight, Check, LayoutDashboard, BrainCircuit, HeartHandshake, Instagram, Facebook, Twitter } from "lucide-react";
import { motion } from "framer-motion";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";

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

  const chatMessages = [
    {
      type: "user",
      message: "¿Puedo gestionar todas mis redes sociales desde aquí?",
    },
    {
      type: "assistant",
      message: "¡Claro! Con kalma puedes administrar todas tus redes (Instagram, Facebook, Twitter) y WhatsApp desde un único panel. Verás todas las conversaciones centralizadas y podrás responder sin cambiar de plataforma.",
    },
    {
      type: "user",
      message: "¿Y puedo automatizar respuestas?",
    },
    {
      type: "assistant",
      message: "kalma puede automatizar respuestas en WhatsApp y todas tus redes sociales. Configuremos reglas personalizadas para respuestas instantáneas mientras mantienes el control total de la comunicación.",
    },
  ];

  const features = [
    {
      title: "Gestión Multicanal Unificada",
      description: "Centraliza toda tu comunicación digital: WhatsApp, Instagram, Facebook, Twitter y más en una sola interfaz intuitiva sin necesidad de cambiar entre apps.",
      icon: <Globe className="h-12 w-12 text-teal-600" />,
      bgColor: "bg-teal-50"
    },
    {
      title: "Automatización Inteligente",
      description: "Implementa respuestas automáticas personalizadas basadas en IA que evolucionan con cada interacción con tus clientes en cualquier plataforma.",
      icon: <BrainCircuit className="h-12 w-12 text-violet-600" />,
      bgColor: "bg-violet-50"
    },
    {
      title: "Analítica Multi-Plataforma",
      description: "Visualiza patrones de comunicación entre todas tus redes sociales, compara rendimiento entre canales y optimiza tu estrategia con datos procesables.",
      icon: <LayoutDashboard className="h-12 w-12 text-cyan-600" />,
      bgColor: "bg-cyan-50"
    }
  ];

  const useCases = [
    {
      icon: <HeartHandshake className="h-8 w-8 text-teal-600" />,
      title: "Atención al Cliente Omnicanal",
      description: "Respuestas inmediatas 24/7 en WhatsApp, Messenger e Instagram sin necesidad de monitorear cada plataforma individualmente."
    },
    {
      icon: <BriefcaseBusiness className="h-8 w-8 text-violet-600" />,
      title: "Generación de Leads",
      description: "Califica prospectos automáticamente de diferentes canales y programa seguimientos unificados para tu equipo de ventas."
    },
    {
      icon: <Sparkles className="h-8 w-8 text-cyan-600" />,
      title: "Marketing Integrado",
      description: "Lanza y monitorea campañas sincronizadas a través de WhatsApp y redes sociales desde un único panel."
    }
  ];

  return (
    <>
      {/* Hero Main Section */}
      <section className="relative pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden bg-gradient-to-br from-white to-teal-50">
        <div className="absolute top-0 right-0 -z-10 w-[40%] h-full bg-gradient-to-bl from-violet-50 to-transparent"></div>
        <div className="absolute top-1/3 left-0 -z-10 w-1/3 h-1/3 bg-gradient-to-tr from-cyan-50 to-transparent rounded-full filter blur-3xl"></div>
        
        <div className="container mx-auto px-4">
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.div className="order-2 md:order-1" variants={itemVariants}>
              <div className="inline-block px-3 py-1 rounded-full bg-teal-100 text-teal-700 font-medium text-sm mb-6">
                Plataforma Unificada de Comunicación
              </div>
              <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
                Gestiona todas tus redes con{" "}
                <span className="text-gradient bg-gradient-to-r from-teal-600 to-cyan-600"> kalma </span>
              </h1>
              <p className="text-lg text-gray-700 mb-8 leading-relaxed">
                Unifica WhatsApp, Instagram, Facebook, Twitter y más en un solo lugar. Automatiza respuestas con IA y obtén analíticas avanzadas para optimizar tu comunicación empresarial.
              </p>
              
              <div className="flex flex-wrap items-center gap-4 mb-10">
                <Button asChild size="lg" className="bg-teal-600 hover:bg-teal-700 transition-all shadow-lg hover:shadow-xl">
                  <a href="#prueba-gratis" className="flex items-center gap-2">
                    Prueba Gratis 15 días <ChevronRight size={16} />
                  </a>
                </Button>
                <a href="#como-funciona" className="text-teal-600 hover:text-teal-700 flex items-center gap-1 font-medium">
                  Ver Cómo Funciona <ChevronRight size={14} />
                </a>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                    <Smartphone size={18} className="text-teal-600" />
                  </div>
                  <span className="text-sm text-gray-700">WhatsApp Business</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
                    <Instagram size={18} className="text-violet-600" />
                  </div>
                  <span className="text-sm text-gray-700">Instagram DM</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center">
                    <Facebook size={18} className="text-cyan-600" />
                  </div>
                  <span className="text-sm text-gray-700">Facebook Messenger</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                    <Twitter size={18} className="text-teal-600" />
                  </div>
                  <span className="text-sm text-gray-700">Twitter/X DM</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
                    <Bot size={18} className="text-violet-600" />
                  </div>
                  <span className="text-sm text-gray-700">IA personalizada</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center">
                    <BarChart3 size={18} className="text-cyan-600" />
                  </div>
                  <span className="text-sm text-gray-700">Analíticas unificadas</span>
                </div>
              </div>
            </motion.div>
            
            <motion.div className="order-1 md:order-2" variants={itemVariants}>
              <div className="relative">
                <div className="absolute -top-20 -right-20 w-72 h-72 bg-violet-100/40 rounded-full filter blur-3xl"></div>
                <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-teal-100/40 rounded-full filter blur-3xl"></div>
                
                <div className="relative lg:w-[120%] bg-white/90 backdrop-blur-sm border border-white/20 p-6 rounded-2xl shadow-xl md:transform md:-rotate-1 hover:rotate-0 transition-all duration-300 hover:shadow-2xl">
                  <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-4 rounded-xl mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <Avatar>
                          <AvatarImage src="/avatar.png" />
                          <AvatarFallback>AI</AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex-grow">
                        <h3 className="font-semibold">kalma Assistant</h3>
                        <p className="text-sm text-gray-500">Asistente virtual</p>
                      </div>
                      <span className="text-xs text-teal-600 font-medium">kalma</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Una plataforma para todas tus comunicaciones</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50" id="como-funciona">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Plataforma unificada para todas tus comunicaciones</h2>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto">
              Gestiona WhatsApp, Instagram, Facebook, Twitter y más en un solo lugar. Optimiza tu comunicación empresarial y evita saltar entre aplicaciones.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all"
              >
                <div className={`h-48 ${feature.bgColor} relative flex items-center justify-center`}>
                  {feature.icon}
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${feature.bgColor}`}>
                      {feature.icon && React.cloneElement(feature.icon, { className: `h-6 w-6 ${feature.icon.props.className?.split(' ').filter(cls => cls.includes('text-')).join(' ')}` })}
                    </div>
                    <h3 className="font-bold text-xl">{feature.title}</h3>
                  </div>
                  <p className="text-gray-700">{feature.description}</p>
                  <a href="#saber-mas" className="inline-flex items-center gap-1 text-teal-600 font-medium mt-4 hover:underline">
                    Saber más <ArrowRight size={14} />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 bg-gradient-to-br from-white to-violet-50/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Soluciones adaptadas a tus necesidades</h2>
              <p className="text-lg text-gray-700 max-w-3xl mx-auto">
                Descubre cómo kalma integra WhatsApp y todas tus redes sociales para maximizar los resultados de tu negocio
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {useCases.map((useCase, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all"
                >
                  <div className="p-4 rounded-lg bg-gradient-to-br from-teal-50 to-violet-50 inline-block mb-4">
                    {useCase.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{useCase.title}</h3>
                  <p className="text-gray-700">{useCase.description}</p>
                  <ul className="mt-4 space-y-2">
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <Check size={16} className="text-teal-600" />
                      <span>Configuración en minutos</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <Check size={16} className="text-teal-600" />
                      <span>Personalización avanzada</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <Check size={16} className="text-teal-600" />
                      <span>Integración con tus sistemas</span>
                    </li>
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-teal-600 to-cyan-700 text-white" id="prueba-gratis">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Gestiona todas tus comunicaciones con kalma hoy mismo</h2>
            <p className="text-xl mb-8 text-white/90">
              Unifica WhatsApp, Instagram, Facebook y Twitter en una sola plataforma y ahorra tiempo con automatizaciones inteligentes
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button asChild size="lg" className="bg-white text-teal-600 hover:bg-gray-100 transition-all">
                <a href="#prueba-gratis" className="flex items-center gap-2">
                  Prueba Gratis 15 días <ChevronRight size={16} />
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/10 transition-all">
                <a href="#demo" className="flex items-center gap-2">
                  Solicitar Demo <ChevronRight size={16} />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default HeroSection;
