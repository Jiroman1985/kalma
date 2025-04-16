
import { useEffect } from "react";
import { motion, useAnimation } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Star, Quote } from "lucide-react";

interface TestimonialProps {
  quote: string;
  author: string;
  position: string;
  company: string;
  rating: number;
  delay: number;
}

const Testimonial: React.FC<TestimonialProps> = ({ quote, author, position, company, rating, delay }) => {
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
      className="bg-white border border-gray-100 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300"
    >
      <div className="flex mb-4">
        {[...Array(rating)].map((_, i) => (
          <Star key={i} size={16} className="text-yellow-400 fill-yellow-400" />
        ))}
      </div>
      
      <div className="relative">
        <Quote size={40} className="absolute -left-2 -top-2 text-gray-100 opacity-50" />
        <p className="text-gray-600 mb-6 relative z-10">{quote}</p>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-whatsapp/30 to-blue-light/30 flex items-center justify-center text-lg font-medium text-whatsapp-dark">
          {author.charAt(0)}
        </div>
        <div>
          <p className="font-medium">{author}</p>
          <p className="text-sm text-gray-500">{position}, {company}</p>
        </div>
      </div>
    </motion.div>
  );
};

const TestimonialSection: React.FC = () => {
  const testimonials = [
    {
      quote: "El asistente IA ha transformado la forma en que atendemos a nuestros clientes. Ahora respondemos al instante y no perdemos ninguna oportunidad de venta.",
      author: "María González",
      position: "Gerente",
      company: "Boutique Flores",
      rating: 5
    },
    {
      quote: "La posibilidad de personalizar las respuestas según nuestros servicios ha sido clave. Nuestros clientes no notan que hablan con una IA.",
      author: "Carlos Rodríguez",
      position: "Director",
      company: "Taller Mecánico CR",
      rating: 5
    },
    {
      quote: "La implementación fue super sencilla y el soporte técnico excelente. Ha mejorado nuestra productividad de forma notable.",
      author: "Laura Martínez",
      position: "Propietaria",
      company: "Centro Estética Bella",
      rating: 5
    }
  ];

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-4">Lo Que Dicen Nuestros Clientes</h2>
          <p className="text-gray-600">
            PYMEs de todos los sectores ya están aprovechando el poder de los asistentes IA en WhatsApp.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Testimonial
              key={index}
              quote={testimonial.quote}
              author={testimonial.author}
              position={testimonial.position}
              company={testimonial.company}
              rating={testimonial.rating}
              delay={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialSection;
