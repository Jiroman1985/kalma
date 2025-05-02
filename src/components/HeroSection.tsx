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
        staggerChildren: 0.3
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.8,
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
      icon: <Globe className="h-12 w-12 text-primary" />,
      bgColor: "bg-primary/5"
    },
    {
      title: "Automatización Inteligente",
      description: "Implementa respuestas automáticas personalizadas basadas en IA que evolucionan con cada interacción con tus clientes en cualquier plataforma.",
      icon: <BrainCircuit className="h-12 w-12 text-secondary" />,
      bgColor: "bg-secondary/5"
    },
    {
      title: "Analítica Multi-Plataforma",
      description: "Visualiza patrones de comunicación entre todas tus redes sociales, compara rendimiento entre canales y optimiza tu estrategia con datos procesables.",
      icon: <LayoutDashboard className="h-12 w-12 text-accent" />,
      bgColor: "bg-accent/5"
    }
  ];

  const useCases = [
    {
      icon: <HeartHandshake className="h-8 w-8 text-primary" />,
      title: "Atención al Cliente Omnicanal",
      description: "Respuestas inmediatas 24/7 en WhatsApp, Messenger e Instagram sin necesidad de monitorear cada plataforma individualmente."
    },
    {
      icon: <BriefcaseBusiness className="h-8 w-8 text-secondary" />,
      title: "Generación de Leads",
      description: "Califica prospectos automáticamente de diferentes canales y programa seguimientos unificados para tu equipo de ventas."
    },
    {
      icon: <Sparkles className="h-8 w-8 text-accent" />,
      title: "Marketing Integrado",
      description: "Lanza y monitorea campañas sincronizadas a través de WhatsApp y redes sociales desde un único panel."
    }
  ];

  return (
    <>
      {/* Hero Main Section */}
      <section className="relative pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden bg-gradient-zen">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -z-10 w-[50%] h-full bg-gradient-calm opacity-60"></div>
        <div className="absolute top-1/3 left-0 -z-10 w-1/3 h-1/3 bg-gradient-to-tr from-accent/20 to-transparent rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 -z-10 w-1/4 h-1/4 bg-gradient-to-bl from-secondary/20 to-transparent rounded-full filter blur-3xl"></div>
        
        <div className="container mx-auto px-4">
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.div className="order-2 md:order-1" variants={itemVariants}>
              <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6 shadow-calm">
                Simplifica tu Comunicación Digital
              </div>
              <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
                Encuentra la{" "}
                <span className="text-gradient"> kalma </span>
                en tu comunicación digital
              </h1>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Unifica WhatsApp, Instagram, Facebook, Twitter y más en un solo lugar. Automatiza respuestas con IA y obtén analíticas avanzadas para optimizar tu comunicación empresarial.
              </p>
              
              <div className="flex flex-wrap items-center gap-4 mb-10">
                <Button asChild size="lg" className="bg-primary hover:bg-primary/90 transition-calm shadow-calm hover:shadow-lg">
                  <a href="#prueba-gratis" className="flex items-center gap-2">
                    Prueba Gratis 15 días <ChevronRight size={16} />
                  </a>
                </Button>
                <a href="#como-funciona" className="text-primary hover:text-primary/90 flex items-center gap-1 font-medium transition-calm">
                  Ver Cómo Funciona <ChevronRight size={14} />
                </a>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shadow-calm">
                    <Smartphone size={18} className="text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">WhatsApp Business</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center shadow-calm">
                    <Instagram size={18} className="text-secondary" />
                  </div>
                  <span className="text-sm text-muted-foreground">Instagram DM</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shadow-calm">
                    <Facebook size={18} className="text-accent" />
                  </div>
                  <span className="text-sm text-muted-foreground">Facebook Messenger</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shadow-calm">
                    <Twitter size={18} className="text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">Twitter/X DM</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center shadow-calm">
                    <Bot size={18} className="text-secondary" />
                  </div>
                  <span className="text-sm text-muted-foreground">IA personalizada</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shadow-calm">
                    <BarChart3 size={18} className="text-accent" />
                  </div>
                  <span className="text-sm text-muted-foreground">Analíticas unificadas</span>
                </div>
              </div>
            </motion.div>
            
            <motion.div className="order-1 md:order-2" variants={itemVariants}>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-calm p-6 relative">
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-primary to-secondary rounded-xl p-4 shadow-calm">
                    <BrainCircuit size={32} className="text-white" />
                  </div>
                </div>
                
                <div className="mt-8">
                  <h3 className="text-xl font-semibold text-center mb-2">kalma Assistant</h3>
                  <p className="text-muted-foreground text-center mb-6">Tu asistente virtual inteligente</p>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-primary/10 rounded-full p-2 shadow-calm">
                        <MessageCircle size={20} className="text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">Gestión Unificada</h4>
                        <p className="text-sm text-muted-foreground">Centraliza todas tus conversaciones en un solo lugar</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="bg-secondary/10 rounded-full p-2 shadow-calm">
                        <Bot size={20} className="text-secondary" />
                      </div>
                      <div>
                        <h4 className="font-medium">Respuestas Automáticas</h4>
                        <p className="text-sm text-muted-foreground">IA que aprende de tus respuestas frecuentes</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="bg-accent/10 rounded-full p-2 shadow-calm">
                        <BarChart3 size={20} className="text-accent" />
                      </div>
                      <div>
                        <h4 className="font-medium">Analíticas Detalladas</h4>
                        <p className="text-sm text-muted-foreground">Métricas y reportes unificados</p>
                      </div>
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
