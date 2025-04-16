
import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Check, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const CtaSection: React.FC = () => {
  const [formState, setFormState] = useState({
    company: "",
    email: "",
    purpose: "",
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormState({
      ...formState,
      [e.target.name]: e.target.value,
    });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulación de envío
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      
      // Resetear después de 3 segundos
      setTimeout(() => {
        setIsSubmitted(false);
        setFormState({
          company: "",
          email: "",
          purpose: "",
        });
      }, 3000);
    }, 1500);
  };

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
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-xl font-semibold mb-6">Solicita tu prueba gratuita</h3>
              
              {isSubmitted ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="w-16 h-16 bg-whatsapp/20 rounded-full flex items-center justify-center mb-4">
                    <Check size={28} className="text-whatsapp" />
                  </div>
                  <h4 className="text-xl font-medium mb-2">¡Solicitud Enviada!</h4>
                  <p className="text-center text-gray-600">
                    Nos pondremos en contacto contigo en las próximas 24 horas.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre de la empresa
                      </label>
                      <Input
                        id="company"
                        name="company"
                        value={formState.company}
                        onChange={handleChange}
                        required
                        placeholder="Tu empresa"
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email de contacto
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formState.email}
                        onChange={handleChange}
                        required
                        placeholder="correo@tuempresa.com"
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-1">
                        ¿Para qué necesitas el asistente IA?
                      </label>
                      <Textarea
                        id="purpose"
                        name="purpose"
                        value={formState.purpose}
                        onChange={handleChange}
                        required
                        placeholder="Cuéntanos brevemente para qué utilizarías el asistente..."
                        className="w-full min-h-[100px]"
                      />
                    </div>
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full mt-6 bg-whatsapp hover:bg-whatsapp-dark"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={18} className="mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      "Solicitar Prueba Gratuita"
                    )}
                  </Button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;
