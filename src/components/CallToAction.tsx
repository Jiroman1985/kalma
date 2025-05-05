import React from 'react';
import { Button } from "@/components/ui/button";
import { Check } from 'lucide-react';

const features = [
  "Integración con WhatsApp, Instagram, Email, Teléfono y más",
  "IA que aprende de tus comunicaciones más efectivas",
  "Panel unificado para gestionar todas tus conversaciones",
  "Soporte técnico prioritario",
  "Cancelación en cualquier momento"
];

const CallToAction = () => {
  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-blue-50 dark:from-primary/10 dark:to-blue-900/30 opacity-80"></div>
      
      {/* Floating shapes */}
      <div className="absolute h-64 w-64 rounded-full bg-primary/10 -top-20 -left-20"></div>
      <div className="absolute h-40 w-40 rounded-full bg-blue-300/20 bottom-12 right-12"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-8 md:p-12">
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Empieza a gestionar tus comunicaciones <span className="text-gradient">con Kalma</span>
                </h2>
                <p className="text-xl">
                  Prueba Kalma gratis durante 14 días. Sin compromisos, cancela cuando quieras.
                </p>
              </div>
              
              <div className="flex flex-col lg:flex-row gap-8 items-center">
                <div className="lg:w-1/2">
                  <ul className="space-y-3">
                    {features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="lg:w-1/2">
                  <div className="bg-white dark:bg-primary/5 rounded-xl p-6 shadow-lg">
                    <div className="text-center mb-6">
                      <div className="text-sm font-medium text-primary">OFERTA DE LANZAMIENTO</div>
                      <div className="flex items-center justify-center">
                        <span className="text-3xl font-bold">29€</span>
                        <span className="text-muted-foreground ml-2">/mes</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <s>Antes 49€/mes</s> · Ahorro de 40%
                      </div>
                    </div>
                    
                    <Button className="bg-gradient-main w-full text-white hover:opacity-90 mb-4">
                      Comenzar prueba gratuita
                    </Button>
                    
                    <div className="text-center text-sm text-muted-foreground">
                      No se requiere tarjeta de crédito
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction; 