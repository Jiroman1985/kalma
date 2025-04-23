import { Button } from "./ui/button";
import { ArrowRight, Check } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const CtaSection: React.FC = () => {
  const fadeInAnimation = {
    hidden: { opacity: 0, y: 40 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.7, 
        ease: "easeOut" 
      } 
    }
  };
  
  return (
    <section id="prueba-gratis" className="py-20 bg-gradient-to-br from-accent to-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInAnimation}
          >
            <h2 className="text-3xl font-bold mb-4">
              Prueba Gratis Durante <span className="text-whatsapp-dark">15 Días</span>
            </h2>
            <p className="text-gray-600 mb-6">
              Descubre cómo un asistente IA en WhatsApp puede transformar la comunicación con tus clientes y liberar tiempo para que te enfoques en hacer crecer tu negocio.
            </p>
            
            <div className="space-y-6">
              <div className="flex items-start gap-3">
                <div className="bg-whatsapp/10 p-2 rounded-full mt-1">
                  <Check size={18} className="text-whatsapp-dark" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">Sin compromiso</h3>
                  <p className="text-sm text-gray-600">Prueba el servicio sin ningún tipo de compromiso durante 15 días</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-whatsapp/10 p-2 rounded-full mt-1">
                  <Check size={18} className="text-whatsapp-dark" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">Configuración asistida</h3>
                  <p className="text-sm text-gray-600">Te ayudamos a configurar el asistente para que se adapte perfectamente a tu negocio</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-whatsapp/10 p-2 rounded-full mt-1">
                  <Check size={18} className="text-whatsapp-dark" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">Soporte personalizado</h3>
                  <p className="text-sm text-gray-600">Contarás con soporte técnico durante todo el proceso de prueba</p>
                </div>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInAnimation}
            style={{ transition: "delay 0.3s" }}
          >
            <div className="bg-whatsapp/10 backdrop-blur-sm rounded-xl border border-whatsapp/30 p-10 text-center">
              <h3 className="text-2xl font-bold mb-4">¡Comienza tu prueba gratuita ahora!</h3>
              <p className="text-gray-700 mb-8">
                No necesitas tarjeta de crédito. Configura tu asistente en menos de 5 minutos y empieza a automatizar tus conversaciones de WhatsApp.
              </p>
              
              <div className="transform hover:scale-105 transition-transform duration-300">
                <Button 
                  asChild
                  size="lg" 
                  className="w-full md:w-auto px-10 py-6 text-lg font-semibold bg-whatsapp hover:bg-whatsapp-dark shadow-lg hover:shadow-xl"
                >
                  <Link to="/login">
                    Comenzar Ahora <ArrowRight className="ml-2" />
                  </Link>
                </Button>
              </div>
              
              <p className="mt-6 text-sm text-gray-600">
                Prueba durante 15 días sin compromiso. Cancela en cualquier momento.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;
