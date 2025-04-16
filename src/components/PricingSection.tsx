
import { Button } from "./ui/button";
import { Check } from "lucide-react";

const PricingSection: React.FC = () => {
  return (
    <section id="precios" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-4">Planes Adaptados a tu Negocio</h2>
          <p className="text-gray-600">
            Todas las funcionalidades incluidas en un único plan, sin sorpresas ni costes adicionales.
          </p>
        </div>
        
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100">
            <div className="bg-gradient-to-r from-whatsapp/20 to-blue-light/20 p-8 text-center">
              <div className="inline-block text-whatsapp-dark text-xs font-semibold bg-white/80 backdrop-blur-sm rounded-full px-3 py-1 mb-3">
                OFERTA DE LANZAMIENTO
              </div>
              <h3 className="text-2xl font-bold mb-2">Plan Profesional</h3>
              <div className="flex items-center justify-center gap-1 mb-4">
                <span className="text-4xl font-bold">99€</span>
                <span className="text-gray-500">/mes</span>
              </div>
              
              <div className="bg-white/50 backdrop-blur-sm text-whatsapp-dark text-sm font-medium rounded-lg py-2 px-3 inline-block">
                15 días de prueba GRATIS
              </div>
            </div>
            
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                {[
                  "Asistente IA personalizado",
                  "Control total de tu número",
                  "Activación/desactivación a demanda",
                  "Configuración de respuestas",
                  "Horarios personalizables",
                  "Transcripción de audio",
                  "Estadísticas básicas",
                  "Soporte prioritario"
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check size={18} className="text-whatsapp flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-8">
                <Button asChild size="lg" className="w-full bg-whatsapp hover:bg-whatsapp-dark">
                  <a href="#prueba-gratis">Comenzar Prueba Gratuita</a>
                </Button>
                <p className="text-center text-sm text-gray-500 mt-3">
                  Sin compromiso de permanencia. Cancela cuando quieras.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
