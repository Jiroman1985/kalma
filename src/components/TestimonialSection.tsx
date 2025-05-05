import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from 'lucide-react';

const testimonials = [
  {
    name: "María González",
    position: "CEO, Tienda Online",
    image: "/placeholder.svg",
    content: "Kalma ha transformado por completo la manera en que atendemos a nuestros clientes. Hemos reducido el tiempo de respuesta de horas a minutos y nuestros clientes están encantados.",
    stars: 5
  },
  {
    name: "Javier Rodríguez",
    position: "Director de Marketing, Agencia Creativa",
    image: "/placeholder.svg",
    content: "Con Kalma podemos gestionar todas nuestras comunicaciones en un solo lugar. La IA se encarga de clasificar y priorizar los mensajes, lo que nos permite concentrarnos en lo que es verdaderamente importante.",
    stars: 5
  },
  {
    name: "Laura Martínez",
    position: "Propietaria, Centro de Bienestar",
    image: "/placeholder.svg",
    content: "Hace un año, pasaba 3 horas diarias respondiendo WhatsApps. Ahora, Kalma gestiona el 80% de las consultas automáticamente, y solo intervengo cuando es realmente necesario.",
    stars: 5
  },
];

const TestimonialSection = () => {
  return (
    <section className="py-20 bg-primary/5 dark:bg-primary/10 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 opacity-[0.03]" style={{ 
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}/>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Lo que nuestros clientes <span className="text-gradient">dicen</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Descubre cómo Kalma está transformando la manera en que los negocios se comunican
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="overflow-hidden hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.stars)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                
                <blockquote className="text-base mb-6">
                  "{testimonial.content}"
                </blockquote>
                
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={testimonial.image} alt={testimonial.name} />
                    <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.position}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-primary/10 dark:bg-primary/20 rounded-full">
            <span className="text-lg font-medium">⭐ 4.9/5 valoración media</span>
            <span className="text-muted-foreground">basada en más de 500 opiniones</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialSection;
