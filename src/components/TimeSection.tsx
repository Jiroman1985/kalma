import React from 'react';
import { Button } from "@/components/ui/button";
import { CheckCircle } from 'lucide-react';

const benefits = [
  "IA que aprende de tus comunicaciones más efectivas",
  "Unificación de todos los canales de comunicación",
  "Estadísticas y analítica en tiempo real",
  "Plantillas de respuesta personalizables",
  "Chatbot avanzado con conocimiento de tu negocio",
  "Transferencia a agente humano cuando sea necesario"
];

const TimeSection = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-primary/5 to-indigo-50 dark:from-primary/10 dark:to-indigo-900/30 relative">
      {/* Abstract shapes */}
      <div className="absolute top-0 left-0 right-0 bottom-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-96 h-96 border border-primary/20 dark:border-primary/30 rounded-full"></div>
        <div className="absolute top-40 -left-10 w-64 h-64 border border-primary/20 dark:border-primary/30 rounded-full"></div>
        <div className="absolute -bottom-10 right-40 w-40 h-40 border border-primary/20 dark:border-primary/30 rounded-full"></div>
      </div>

      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-12 relative z-10">
          {/* Left: Image/Illustration */}
          <div className="lg:w-1/2 relative">
            <div className="relative">
              {/* Clock/Time Illustration */}
              <div className="w-80 h-80 mx-auto relative">
                <div className="absolute inset-0 flex items-center justify-center animate-spin-slow">
                  {/* Clock face */}
                  <div className="w-full h-full rounded-full border-4 border-primary/30 dark:border-primary/40 relative">
                    {/* Clock numbers */}
                    {[...Array(12)].map((_, i) => (
                      <div 
                        key={i} 
                        className="absolute w-6 h-6 flex items-center justify-center font-bold" 
                        style={{ 
                          top: `${50 - 45 * Math.cos(Math.PI * 2 * (i / 12))}%`, 
                          left: `${50 + 45 * Math.sin(Math.PI * 2 * (i / 12))}%`,
                          transform: 'translate(-50%, -50%)'
                        }}
                      >
                        {i === 0 ? 12 : i}
                      </div>
                    ))}
                    
                    {/* Center dot */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full"></div>
                  </div>
                </div>
                
                {/* Hour hand (static) */}
                <div className="absolute top-1/2 left-1/2 w-16 h-2 bg-primary rounded-full origin-left"
                  style={{ transform: 'translateY(-50%) rotate(45deg)' }}
                ></div>
                
                {/* Minute hand (static) */}
                <div className="absolute top-1/2 left-1/2 w-24 h-1.5 bg-primary/70 rounded-full origin-left"
                  style={{ transform: 'translateY(-50%) rotate(180deg)' }}
                ></div>
                
                {/* Second hand (animated) */}
                <div className="absolute top-1/2 left-1/2 w-28 h-1 bg-red-500 rounded-full origin-left animate-spin-slow"
                  style={{ transformOrigin: '0 50%' }}
                ></div>
              </div>
              
              {/* Time saved indicators */}
              <div className="absolute -top-10 -right-10 bg-white/80 backdrop-blur-sm rounded-xl p-4 animate-float shadow-xl">
                <div className="text-xl font-bold text-primary">+10 horas</div>
                <div className="text-sm">ahorradas por semana</div>
              </div>
              
              <div className="absolute -bottom-5 -left-5 bg-white/80 backdrop-blur-sm rounded-xl p-4 animate-float animate-delay-200 shadow-xl">
                <div className="text-xl font-bold text-primary">80%</div>
                <div className="text-sm">menos tiempo en tareas repetitivas</div>
              </div>
            </div>
          </div>

          {/* Right: Content */}
          <div className="lg:w-1/2">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Recupera tu tiempo y <span className="text-gradient">vive con Kalma</span>
            </h2>
            <p className="text-xl mb-6">
              Automatiza las comunicaciones con tus clientes y dedica más tiempo a hacer crecer tu negocio y a disfrutar de lo que realmente importa.
            </p>

            <div className="mb-8 space-y-3">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-2">
                  <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>

            <Button className="bg-gradient-main hover:opacity-90 text-white">
              Prueba Kalma gratis por 14 días
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TimeSection; 