import { Button } from "./ui/button";
import { Check, Crown, Star } from "lucide-react";
import { Link } from "react-router-dom";

const PricingSection: React.FC = () => {
  return (
    <section id="precios" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-4">Planes Adaptados a tu Negocio</h2>
          <p className="text-gray-600">
            Elige el plan que mejor se adapte a las necesidades de tu empresa.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Plan Básico */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100 flex flex-col h-full">
            <div className="bg-gradient-to-r from-whatsapp/10 to-blue-light/10 p-8 text-center">
              <h3 className="text-2xl font-bold mb-2">Plan Básico</h3>
              <div className="flex items-center justify-center gap-1 mb-4">
                <span className="text-4xl font-bold">9,99€</span>
                <span className="text-gray-500">/mes</span>
              </div>
            </div>
            
            <div className="p-8 flex-grow">
              <div className="space-y-4">
                {[
                  "Agente IA conectado a WhatsApp",
                  "Mensajes ilimitados al mes",
                  "Subida de documentos propios de la empresa",
                  "Personalización de tu asistente (tono, tipo de preguntas a responder, idiomas, etc)"
                ].map((feature, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Check size={18} className="text-teal-600 flex-shrink-0 mt-1" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-8">
                <Button asChild size="lg" className="w-full bg-teal-600 hover:bg-teal-700">
                  <Link to="/login">Seleccionar Plan</Link>
                </Button>
                <p className="text-center text-sm text-gray-500 mt-3">
                  Sin compromiso de permanencia
                </p>
              </div>
            </div>
          </div>
          
          {/* Plan Pro - Destacado */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-xl border-2 border-teal-400/40 flex flex-col h-full relative transform md:-translate-y-4 scale-105">
            <div className="absolute top-0 right-0 bg-teal-600 text-white text-xs font-semibold px-4 py-1 rounded-bl-lg">
              <div className="flex items-center gap-1">
                <Crown size={14} />
                <span>El más elegido</span>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-teal-100/20 to-cyan-100/20 p-8 text-center">
              <h3 className="text-2xl font-bold mb-2">Plan Pro</h3>
              <div className="flex items-center justify-center gap-1 mb-4">
                <span className="text-4xl font-bold">19,99€</span>
                <span className="text-gray-500">/mes</span>
              </div>
            </div>
            
            <div className="p-8 flex-grow">
              <div className="space-y-4">
                <p className="text-gray-500 italic mb-2">Todo lo del Plan Básico más:</p>
                {[
                  "Visualización de mensajes contestados por la IA",
                  "Analíticas avanzadas (categoría de preguntas, mensajes diarios, volumen de mensajes por horas, tiempo ahorrado por la IA, etc)",
                  "Acceso al calendario por parte de la IA para contestar preguntas sobre horarios y disponibilidad"
                ].map((feature, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Star size={18} className="text-teal-600 flex-shrink-0 mt-1" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-8">
                <Button asChild size="lg" className="w-full bg-teal-600 hover:bg-teal-700">
                  <Link to="/login">Seleccionar Plan</Link>
                </Button>
                <p className="text-center text-sm text-gray-500 mt-3">
                  Sin compromiso de permanencia
                </p>
              </div>
            </div>
          </div>
          
          {/* Plan Empresarial */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100 flex flex-col h-full">
            <div className="bg-gradient-to-r from-blue-light/20 to-purple-300/20 p-8 text-center">
              <h3 className="text-2xl font-bold mb-2">Plan Custom</h3>
              <div className="flex items-center justify-center gap-1 mb-4">
                <span className="text-2xl font-bold">Personalizado</span>
              </div>
            </div>
            
            <div className="p-8 flex-grow">
              <div className="space-y-4">
                <p className="text-gray-500 italic mb-2">Todo lo del Plan Pro más:</p>
                {[
                  "Integraciones con herramientas propias del negocio",
                  "Motor de reservas",
                  "Integración con CRM",
                  "Venta de productos",
                  "Soluciones a medida"
                ].map((feature, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Check size={18} className="text-teal-600 flex-shrink-0 mt-1" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-8">
                <Button 
                  size="lg" 
                  className="w-full bg-gradient-to-r from-teal-600 to-purple-600 hover:from-teal-700 hover:to-purple-700 text-white"
                  onClick={() => window.open('https://wa.me/34648258558', '_blank')}
                >
                  Contactar
                </Button>
                <p className="text-center text-sm text-gray-500 mt-3">
                  Hablemos sobre tu proyecto
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
