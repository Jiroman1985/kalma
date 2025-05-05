import React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

const TimeRecoverySection: React.FC = () => {
  const benefits = [
    "IA que aprende de tus comunicaciones más efectivas",
    "Unificación de todos los canales de comunicación",
    "Estadísticas y analítica en tiempo real",
    "Plantillas de respuesta personalizables",
    "Chatbot avanzado con conocimiento de tu negocio",
    "Transferencia a agente humano cuando sea necesario"
  ];

  return (
    <section className="py-24 bg-gradient-page relative overflow-hidden">
      {/* Elementos decorativos */}
      <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-gradient-to-bl from-purple-300/20 to-transparent rounded-full filter blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-[30%] h-[30%] bg-gradient-to-tr from-blue-300/20 to-transparent rounded-full filter blur-3xl"></div>
      
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, margin: "-100px" }}
            className="relative"
          >
            {/* Contenedor de reloj */}
            <div className="relative max-w-[400px] mx-auto">
              {/* Círculo exterior */}
              <svg className="w-full h-auto" viewBox="0 0 400 400">
                <circle 
                  cx="200" 
                  cy="200" 
                  r="180" 
                  fill="none" 
                  stroke="#e2e8f0" 
                  strokeWidth="15"
                />
                <motion.circle 
                  cx="200" 
                  cy="200" 
                  r="180" 
                  fill="none" 
                  stroke="url(#gradient)" 
                  strokeWidth="15"
                  strokeDasharray="1130"
                  strokeDashoffset="1130"
                  initial={{ strokeDashoffset: 1130 }}
                  whileInView={{ strokeDashoffset: 226 }}
                  transition={{ duration: 2, ease: "easeOut" }}
                  viewport={{ once: true }}
                />
                
                {/* Números del reloj */}
                {[...Array(12)].map((_, i) => {
                  const angle = ((i + 1) * 30 * Math.PI) / 180;
                  const x = 200 + 160 * Math.sin(angle);
                  const y = 200 - 160 * Math.cos(angle);
                  return (
                    <text 
                      key={i} 
                      x={x} 
                      y={y} 
                      textAnchor="middle" 
                      dominantBaseline="middle"
                      fontSize="18"
                      fontWeight="bold"
                      fill="#64748b"
                    >
                      {i + 1}
                    </text>
                  );
                })}
                
                {/* Manecillas del reloj */}
                <motion.line 
                  x1="200" 
                  y1="200" 
                  x2="200" 
                  y2="100" 
                  stroke="#f43f5e" 
                  strokeWidth="6" 
                  strokeLinecap="round"
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 320 }}
                  transition={{ duration: 1, delay: 0.5 }}
                  style={{ transformOrigin: "center center" }}
                />
                
                <motion.line 
                  x1="200" 
                  y1="200" 
                  x2="310" 
                  y2="200" 
                  stroke="#8b5cf6" 
                  strokeWidth="3" 
                  strokeLinecap="round"
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 240 }}
                  transition={{ duration: 1.5, delay: 0.5 }}
                  style={{ transformOrigin: "center center" }}
                />
                
                <circle cx="200" cy="200" r="10" fill="#8b5cf6" />
                
                {/* Definición del gradiente */}
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </svg>
              
              {/* Etiqueta de +10 horas */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 1 }}
                viewport={{ once: true }}
                className="absolute top-0 right-0 bg-white px-4 py-2 rounded-lg shadow-lg"
              >
                <p className="text-lg font-bold text-gradient">+10 horas</p>
                <p className="text-sm text-muted-foreground">ahorradas por semana</p>
              </motion.div>
              
              {/* Etiqueta de 80% */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.2 }}
                viewport={{ once: true }}
                className="absolute bottom-10 left-0 bg-white px-4 py-2 rounded-lg shadow-lg"
              >
                <p className="text-3xl font-bold text-gradient">80%</p>
                <p className="text-sm text-muted-foreground">menos tiempo en tareas repetitivas</p>
              </motion.div>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <h2 className="text-4xl font-bold mb-6">
              Recupera tu tiempo y <span className="text-gradient">vive con Kalma</span>
            </h2>
            
            <p className="text-lg text-foreground/80 mb-8">
              Automatiza las comunicaciones con tus clientes y dedica más tiempo a
              hacer crecer tu negocio y a disfrutar de lo que realmente importa.
            </p>
            
            <div className="space-y-4 mb-10">
              {benefits.map((benefit, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-start gap-3"
                >
                  <div className="mt-1 bg-primary/10 rounded-full p-1">
                    <Check size={16} className="text-primary" />
                  </div>
                  <p className="text-foreground/90">{benefit}</p>
                </motion.div>
              ))}
            </div>
            
            <motion.a 
              href="#prueba"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.6 }}
              viewport={{ once: true }}
              className="btn-primary-gradient inline-block"
            >
              Prueba Kalma gratis por 14 días
            </motion.a>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default TimeRecoverySection; 