import React, { useEffect, memo, useRef } from "react";
import { Button } from "./ui/button";
import { ChevronRight, MessageCircle, Shield, Bot, Clock, BriefcaseBusiness, BarChart3, Smartphone, Globe, Zap, Users, Sparkles, ArrowRight, Check, LayoutDashboard, BrainCircuit, HeartHandshake, Instagram, Facebook, Twitter } from "lucide-react";
import { motion, useAnimation, useInView } from "framer-motion";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";

// Componente memoizado para la decoración del fondo
const BackgroundDecoration = memo(() => (
  <div 
    className="absolute top-0 left-0 w-full h-full -z-10 opacity-20 optimize-paint"
    style={{
      backgroundImage: `radial-gradient(circle at 20% 20%, rgba(167, 139, 250, 0.15) 0%, transparent 25%), 
                       radial-gradient(circle at 80% 80%, rgba(216, 180, 254, 0.15) 0%, transparent 25%)`
    }}
  />
));

BackgroundDecoration.displayName = 'BackgroundDecoration';

// Componentes memoizados para botones
const PrimaryButton = memo(({ href, children }: { href: string, children: React.ReactNode }) => (
  <a href={href} className="btn-primary-gradient flex items-center gap-2 transform-gpu">
    {children}
  </a>
));

PrimaryButton.displayName = 'PrimaryButton';

const SecondaryButton = memo(({ href, children }: { href: string, children: React.ReactNode }) => (
  <a href={href} className="btn-secondary-gradient flex items-center gap-2 transform-gpu">
    {children}
  </a>
));

SecondaryButton.displayName = 'SecondaryButton';

// El componente principal
const HeroSection: React.FC = () => {
  const controls = useAnimation();
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { 
    once: true, 
    amount: 0.1,
    margin: "0px 0px -30% 0px" // Comenzar a cargar antes de entrar en la vista
  });
  
  // Iniciar animaciones solo cuando el componente es visible o cuando se carga
  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);

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
      description: "Centraliza toda tu comunicación digital en una sola interfaz intuitiva.",
      icon: <Globe className="h-12 w-12 text-primary transform-gpu" />,
      bgColor: "bg-primary/5"
    },
    {
      title: "Automatización Inteligente",
      description: "Implementa respuestas automáticas personalizadas basadas en IA.",
      icon: <BrainCircuit className="h-12 w-12 text-secondary transform-gpu" />,
      bgColor: "bg-secondary/5"
    },
    {
      title: "Analítica Multi-Plataforma",
      description: "Visualiza patrones de comunicación y optimiza tu estrategia.",
      icon: <LayoutDashboard className="h-12 w-12 text-accent transform-gpu" />,
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
    <section 
      ref={sectionRef}
      className="relative min-h-screen pt-20 pb-20 bg-gradient-page overflow-hidden optimize-size"
    >
      <BackgroundDecoration />

      <div className="container mx-auto px-4 pt-16 md:pt-24">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={controls}
            variants={{
              visible: {
                opacity: 1, 
                y: 0,
                transition: { duration: 0.3 }
              }
            }}
            className="inline-block px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm text-primary font-medium text-sm mb-6 shadow-sm transform-gpu"
          >
            Gestiona con <span className="text-gradient font-semibold">Kalma</span> Todas tus comunicaciones
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={controls}
            variants={{
              visible: {
                opacity: 1, 
                y: 0,
                transition: { duration: 0.3, delay: 0.05 }
              }
            }}
            className="text-4xl md:text-6xl font-bold leading-tight mb-6 transform-gpu"
          >
            Encuentra la{" "}
            <span className="text-gradient font-bold">kalma</span>{" "}
            en tu comunicación digital
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={controls}
            variants={{
              visible: {
                opacity: 1, 
                y: 0,
                transition: { duration: 0.3, delay: 0.1 }
              }
            }}
            className="text-lg text-foreground/80 mb-8 max-w-3xl mx-auto"
          >
            Ahorra tiempo y mejora la experiencia de tus clientes con una plataforma
            de comunicación unificada potenciada por inteligencia artificial.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={controls}
            variants={{
              visible: {
                opacity: 1, 
                y: 0,
                transition: { duration: 0.3, delay: 0.15 }
              }
            }}
            className="flex flex-wrap justify-center items-center gap-4 mb-10"
          >
            <PrimaryButton href="#prueba-gratis">
              Comenzar prueba gratuita <ChevronRight size={16} />
            </PrimaryButton>
            <SecondaryButton href="#como-funciona">
              Ver demostración <ArrowRight size={16} />
            </SecondaryButton>
          </motion.div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={controls}
          variants={{
            visible: {
              opacity: 1, 
              y: 0,
              transition: { duration: 0.4, delay: 0.1 }
            }
          }}
          className="relative mx-auto max-w-5xl transform-gpu"
        >
          <div className="relative z-10 w-full rounded-2xl overflow-hidden shadow-xl border border-white/20 bg-white/5 backdrop-blur-sm">
            <div className="bg-gradient-main p-1 rounded-t-2xl">
              <div className="flex items-center gap-2 px-3 py-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <div className="ml-4 text-xs text-white opacity-80">kalma - Plataforma de comunicación unificada</div>
              </div>
            </div>
            
            {/* Contenido simplificado para mejor rendimiento */}
            <div className="grid md:grid-cols-5 h-[500px] bg-white optimize-paint">
              {/* Sidebar */}
              <div className="hidden md:block md:col-span-1 bg-gradient-soft border-r border-gray-100">
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 rounded-full bg-gradient-main flex items-center justify-center">
                      <span className="text-white font-bold">K</span>
                    </div>
                    <span className="font-semibold text-gradient">kalma</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary font-medium flex items-center gap-2">
                      <MessageCircle size={18} />
                      <span>Conversaciones</span>
                    </div>
                    <div className="p-2 rounded-lg text-muted-foreground flex items-center gap-2">
                      <BarChart3 size={18} />
                      <span>Analíticas</span>
                    </div>
                    <div className="p-2 rounded-lg text-muted-foreground flex items-center gap-2">
                      <Bot size={18} />
                      <span>Automatización</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Main content area */}
              <div className="col-span-5 md:col-span-4 p-4 bg-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">Conversaciones</h3>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="rounded-full">
                      Filtrar
                    </Button>
                    <Button size="sm" className="rounded-full bg-gradient-main">
                      Nueva conversación
                    </Button>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="col-span-1 border border-gray-100 rounded-xl overflow-hidden">
                    <div className="bg-muted p-3 border-b border-gray-100">
                      <div className="font-medium">Conversaciones recientes</div>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {/* Elementos estáticos pre-renderizados */}
                      <div className="p-3 bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-soft flex items-center justify-center">
                            <span className="text-primary font-medium">MP</span>
                          </div>
                          <div>
                            <div className="font-medium">María Pérez</div>
                            <div className="text-xs text-muted-foreground">Último mensaje hace 2 min</div>
                          </div>
                        </div>
                      </div>
                      <div className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-soft flex items-center justify-center">
                            <span className="text-primary font-medium">JD</span>
                          </div>
                          <div>
                            <div className="font-medium">Juan Díaz</div>
                            <div className="text-xs text-muted-foreground">Último mensaje hace 4 min</div>
                          </div>
                        </div>
                      </div>
                      <div className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-soft flex items-center justify-center">
                            <span className="text-primary font-medium">AR</span>
                          </div>
                          <div>
                            <div className="font-medium">Ana Ruiz</div>
                            <div className="text-xs text-muted-foreground">Último mensaje hace 6 min</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-span-2 border border-gray-100 rounded-xl overflow-hidden">
                    <div className="bg-muted p-3 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-soft flex items-center justify-center">
                          <span className="text-primary font-medium">MP</span>
                        </div>
                        <div>
                          <div className="font-medium">María Pérez</div>
                          <div className="text-xs text-muted-foreground">WhatsApp • En línea</div>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 h-[250px] overflow-y-auto flex flex-col gap-3">
                      <div className="self-start max-w-[80%] bg-muted rounded-lg rounded-tl-none p-3">
                        <p className="text-sm">Hola, quisiera saber si tienen disponible el modelo que vi en su catálogo online.</p>
                        <span className="text-xs text-muted-foreground">10:30 AM</span>
                      </div>
                      
                      <div className="self-end max-w-[80%] bg-gradient-main rounded-lg rounded-tr-none p-3">
                        <p className="text-sm text-white">¡Hola María! Sí, tenemos ese modelo disponible en varias tallas y colores. ¿Cuál te interesa?</p>
                        <span className="text-xs text-white/70">10:32 AM</span>
                      </div>
                      
                      <div className="self-start max-w-[80%] bg-muted rounded-lg rounded-tl-none p-3">
                        <p className="text-sm">Me gustaría el modelo en talla M y color azul. ¿Cuál sería el tiempo de entrega?</p>
                        <span className="text-xs text-muted-foreground">10:35 AM</span>
                      </div>
                    </div>
                    <div className="p-3 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <input 
                          type="text" 
                          placeholder="Escribe un mensaje..." 
                          className="flex-1 px-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-1 focus:ring-primary/30"
                        />
                        <Button size="icon" className="rounded-full bg-gradient-main">
                          <ArrowRight size={18} className="text-white" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Elementos decorativos con menor impacto en rendimiento */}
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-gradient-to-tr from-purple-500/20 to-indigo-500/20 rounded-full blur-xl optimize-paint"></div>
          <div className="absolute -top-6 -left-6 w-32 h-32 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-xl optimize-paint"></div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
