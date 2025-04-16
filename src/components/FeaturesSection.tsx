
import { 
  SmartphoneNfc, Shield, Bot, Power, Settings, Clock, Headphones, 
  MessageSquare, Zap, BarChart3, MessageCircle, CheckCircle 
} from "lucide-react";
import { motion, useAnimation } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useEffect } from "react";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, delay }) => {
  const controls = useAnimation();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  useEffect(() => {
    if (inView) {
      controls.start({
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, delay: delay * 0.2 }
      });
    }
  }, [controls, inView, delay]);

  return (
    <motion.div 
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={controls}
      className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 duration-300"
    >
      <div className="bg-accent/50 text-whatsapp-dark w-12 h-12 rounded-lg flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </motion.div>
  );
};

const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: <SmartphoneNfc />,
      title: "Control de tu Número",
      description: "Mantén el control total de tu número de WhatsApp Business, sin intermediarios.",
    },
    {
      icon: <Bot />,
      title: "IA Personalizada",
      description: "Adapta el asistente a tu negocio, con su propio estilo y conocimientos específicos.",
    },
    {
      icon: <Power />,
      title: "Activación Bajo Demanda",
      description: "Activa o desactiva tu asistente cuando quieras, tú tienes el control.",
    },
    {
      icon: <Settings />,
      title: "Configuración Avanzada",
      description: "Define exactamente qué tipo de preguntas puede responder y cuáles derivar a tu equipo.",
    },
    {
      icon: <Clock />,
      title: "Horarios Personalizables",
      description: "Configura cuándo debe actuar el asistente y cuándo no estar disponible.",
    },
    {
      icon: <Headphones />,
      title: "Transcripción de Audio",
      description: "Convierte mensajes de voz en texto para que tu asistente pueda responderlos.",
    },
  ];

  return (
    <section id="caracteristicas" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-4">Características que Transformarán tu Negocio</h2>
          <p className="text-gray-600">
            Nuestro asistente IA para WhatsApp te permitirá optimizar la atención al cliente, generar más ventas y liberar tiempo para lo que realmente importa.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              delay={index * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
