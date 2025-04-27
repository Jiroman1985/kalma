import { Button } from "./ui/button";
import { ChevronRight, MessageCircle, Shield, Bot, Clock, BriefcaseBusiness, BarChart3, Smartphone, Globe, Zap, Users, Sparkles, ArrowRight, Check } from "lucide-react";
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
      question: "Necesito ver cómo están funcionando mis redes sociales",
      answer: "¡Claro! En tu dashboard de NEXUS encontrarás un resumen unificado de todas tus redes sociales con métricas clave como engagement, alcance y conversiones en un solo lugar.",
      icon: <BarChart3 size={16} className="text-primary" />
    },
    {
      question: "Tengo muchos mensajes sin responder en diferentes plataformas",
      answer: "NEXUS puede automatizar respuestas en todas tus redes sociales. Configuremos reglas personalizadas para respuestas instantáneas mientras mantienes el control total de la comunicación.",
      icon: <Zap size={16} className="text-primary" />
    },
    {
      question: "¿Cómo puedo saber qué canal es más efectivo para mi negocio?",
      answer: "Nuestras analíticas avanzadas comparan el rendimiento de todos tus canales. Te mostraré exactamente dónde invierte mejor tu tiempo y recursos para maximizar conversiones.",
      icon: <Globe size={16} className="text-primary" />
    }
  ];

  const features = [
    {
      title: "Gestión Multicanal",
      description: "Centraliza toda tu comunicación digital: WhatsApp, Instagram, Facebook, Twitter y más en una sola interfaz intuitiva.",
      icon: <Globe className="h-8 w-8 text-primary" />,
      imageSrc: "/images/dashboard-preview.png"
    },
    {
      title: "Automatización Inteligente",
      description: "Implementa respuestas automáticas personalizadas basadas en IA que evolucionan con cada interacción con tus clientes.",
      icon: <Bot className="h-8 w-8 text-primary" />,
      imageSrc: "/images/ai-automation.png" 
    },
    {
      title: "Analítica Avanzada",
      description: "Visualiza patrones de comunicación, identifica oportunidades de negocio y optimiza tu estrategia con datos procesables.",
      icon: <BarChart3 className="h-8 w-8 text-primary" />,
      imageSrc: "/images/analytics-dashboard.png"
    }
  ];

  const useCases = [
    {
      icon: <Users className="h-6 w-6 text-primary" />,
      title: "Soporte al Cliente",
      description: "Respuestas inmediatas 24/7 que resuelven dudas y solicitudes sin intervención humana"
    },
    {
      icon: <BriefcaseBusiness className="h-6 w-6 text-primary" />,
      title: "Generación de Leads",
      description: "Califica prospectos automáticamente y programa seguimientos para tu equipo de ventas"
    },
    {
      icon: <Sparkles className="h-6 w-6 text-primary" />,
      title: "Marketing Omnicanal",
      description: "Lanza y monitorea campañas sincronizadas a través de múltiples plataformas"
    }
  ];

  const testimonials = [
    {
      quote: "NEXUS transformó completamente nuestra estrategia de comunicación digital. Ahorramos 15 horas semanales en gestión de mensajes.",
      author: "María Rodríguez",
      company: "Boutique Elegance",
      avatar: "/images/testimonial-1.jpg"
    },
    {
      quote: "Incrementamos nuestras conversiones en un 37% al poder responder consultas de clientes en tiempo real, incluso fuera de horario laboral.",
      author: "Carlos Mendoza",
      company: "TechSoluciones",
      avatar: "/images/testimonial-2.jpg"
    }
  ];

  return (
    <>
      {/* Hero Main Section */}
      <section className="relative pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden bg-gradient-to-br from-white to-blue-50">
        <div className="absolute top-0 right-0 -z-10 w-[40%] h-full bg-gradient-to-bl from-indigo-50 to-transparent"></div>
        <div className="absolute top-1/3 left-0 -z-10 w-1/3 h-1/3 bg-gradient-to-tr from-purple-50 to-transparent rounded-full filter blur-3xl"></div>
        
        <div className="container mx-auto px-4">
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.div className="order-2 md:order-1" variants={itemVariants}>
              <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6">
                Comunicación Empresarial Inteligente
              </div>
              <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
                Gestión integral con 
                <span className="text-primary"> NEXUS </span> 
                para tu empresa
              </h1>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Unifica todos tus canales de comunicación, automatiza respuestas con IA y obtén analíticas avanzadas para optimizar tu negocio. Ahorra tiempo y mejora la gestión de tu comunicación empresarial.
              </p>
              
              <div className="flex flex-wrap items-center gap-4 mb-10">
                <Button asChild size="lg" className="bg-primary hover:bg-primary-dark transition-all shadow-lg hover:shadow-xl">
                  <a href="#prueba-gratis" className="flex items-center gap-2">
                    Prueba Gratis 15 días <ChevronRight size={16} />
                  </a>
                </Button>
                <a href="#como-funciona" className="text-primary hover:text-primary-dark flex items-center gap-1 font-medium">
                  Ver Cómo Funciona <ChevronRight size={14} />
                </a>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Globe size={18} className="text-primary" />
                  </div>
                  <span className="text-sm text-gray-600">Multiredes integradas</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot size={18} className="text-primary" />
                  </div>
                  <span className="text-sm text-gray-600">IA personalizada</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Clock size={18} className="text-primary" />
                  </div>
                  <span className="text-sm text-gray-600">Ahorro de tiempo</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <BarChart3 size={18} className="text-primary" />
                  </div>
                  <span className="text-sm text-gray-600">Analíticas unificadas</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Zap size={18} className="text-primary" />
                  </div>
                  <span className="text-sm text-gray-600">Automatización total</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Smartphone size={18} className="text-primary" />
                  </div>
                  <span className="text-sm text-gray-600">Acceso móvil 24/7</span>
                </div>
              </div>
            </motion.div>
            
            <motion.div className="order-1 md:order-2" variants={itemVariants}>
              <div className="relative">
                <div className="absolute -top-20 -right-20 w-72 h-72 bg-indigo-100/40 rounded-full filter blur-3xl"></div>
                <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-purple-100/40 rounded-full filter blur-3xl"></div>
                
                <div className="relative lg:w-[120%] bg-white/90 backdrop-blur-sm border border-white/20 p-6 rounded-2xl shadow-xl md:transform md:-rotate-1 hover:rotate-0 transition-all duration-300 hover:shadow-2xl">
                  <div className="bg-gray-50 p-4 rounded-xl mb-4">
                    <div className="flex items-center gap-3 mb-3">
                      <MessageCircle className="text-primary" />
                      <h3 className="font-semibold">NEXUS Assistant</h3>
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
                            <div className="bg-primary/20 w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center">
                              {example.icon}
                            </div>
                            <div className="bg-primary/10 rounded-lg p-3 text-sm">
                              {example.answer}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Gestión inteligente en todos tus canales</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-primary font-medium">NEXUS</span>
                      <div className="w-6 h-6 rounded-full bg-primary/30 flex items-center justify-center text-xs text-primary-dark">✓</div>
                    </div>
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Herramientas AI completas para tu negocio</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Optimiza tu comunicación empresarial, retención de usuarios e interacciones con clientes con nuestras herramientas de IA diseñadas para cualquier tipo de negocio
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
                <div className="h-48 bg-gray-100 relative">
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    {feature.imageSrc ? (
                      <img 
                        src={feature.imageSrc} 
                        alt={feature.title} 
                        className="w-full h-full object-cover"
                      />
                    ) : feature.icon}
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      {feature.icon}
                    </div>
                    <h3 className="font-bold text-xl">{feature.title}</h3>
                  </div>
                  <p className="text-gray-600">{feature.description}</p>
                  <a href="#saber-mas" className="inline-flex items-center gap-1 text-primary font-medium mt-4 hover:underline">
                    Saber más <ArrowRight size={14} />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 bg-gradient-to-br from-white to-indigo-50/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Soluciones adaptadas a tus necesidades</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Descubre cómo NEXUS se adapta a diferentes escenarios empresariales para maximizar resultados
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
                  <div className="p-3 rounded-lg bg-primary/10 inline-block mb-4">
                    {useCase.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{useCase.title}</h3>
                  <p className="text-gray-600">{useCase.description}</p>
                  <ul className="mt-4 space-y-2">
                    <li className="flex items-center gap-2 text-sm text-gray-600">
                      <Check size={16} className="text-primary" />
                      <span>Configuración en minutos</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-600">
                      <Check size={16} className="text-primary" />
                      <span>Personalización avanzada</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-600">
                      <Check size={16} className="text-primary" />
                      <span>Integración con tus sistemas</span>
                    </li>
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Lo que dicen nuestros clientes</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Empresas de todos los tamaños están transformando su comunicación con NEXUS
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gray-50 p-8 rounded-xl relative"
              >
                <div className="absolute -top-5 -left-2 text-6xl text-primary/20">"</div>
                <p className="text-gray-700 mb-6 relative z-10">{testimonial.quote}</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-300 overflow-hidden">
                    {testimonial.avatar && (
                      <img 
                        src={testimonial.avatar} 
                        alt={testimonial.author} 
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold">{testimonial.author}</h4>
                    <p className="text-sm text-gray-500">{testimonial.company}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary/90 to-indigo-700 text-white" id="prueba-gratis">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Potencia tu negocio con NEXUS hoy mismo</h2>
            <p className="text-xl mb-8 text-white/90">
              Únete a miles de empresas que están elevando su comunicación digital con NEXUS
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button asChild size="lg" className="bg-white text-primary hover:bg-gray-100 transition-all">
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
