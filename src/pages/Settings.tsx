
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Clock, Globe, MessageSquare } from "lucide-react";

const Settings = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    
    // Simulando una petición
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: "Configuración guardada",
        description: "Los cambios han sido guardados correctamente."
      });
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Configuración general del bot */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Configuración del Agente IA
            </CardTitle>
            <CardDescription>
              Personaliza cómo responderá tu asistente de IA en WhatsApp
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="botName">Nombre del Agente</Label>
                <Input id="botName" defaultValue="AsistenteAI" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="welcomeMessage">Mensaje de Bienvenida</Label>
                <Textarea 
                  id="welcomeMessage" 
                  rows={3}
                  defaultValue="¡Hola! Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="knowledgeBase">Base de Conocimiento</Label>
                <Textarea 
                  id="knowledgeBase" 
                  rows={5}
                  placeholder="Añade información específica sobre tu negocio, productos, servicios, políticas, etc."
                  defaultValue="Somos una empresa dedicada a la venta de productos electrónicos. Ofrecemos garantía de 1 año en todos nuestros productos. Nuestro horario de atención es de lunes a viernes de 9:00 a 18:00."
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Configuración de disponibilidad */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Configuración de Disponibilidad
            </CardTitle>
            <CardDescription>
              Define cuándo tu asistente estará activo para responder mensajes
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="schedule">Horario de Actividad</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime" className="text-xs">Hora inicio</Label>
                    <Input id="startTime" type="time" defaultValue="09:00" />
                  </div>
                  <div>
                    <Label htmlFor="endTime" className="text-xs">Hora fin</Label>
                    <Input id="endTime" type="time" defaultValue="18:00" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Días activos</Label>
                <div className="flex flex-wrap gap-2">
                  {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"].map((day) => (
                    <Button 
                      key={day}
                      type="button"
                      variant={day !== "Sábado" && day !== "Domingo" ? "default" : "outline"}
                      className={`${
                        day !== "Sábado" && day !== "Domingo" 
                          ? "bg-whatsapp text-white" 
                          : ""
                      } rounded-full px-4`}
                    >
                      {day.substring(0, 3)}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="outOfHoursMessage">Mensaje Fuera de Horario</Label>
                <Textarea 
                  id="outOfHoursMessage" 
                  rows={3}
                  defaultValue="Gracias por tu mensaje. En este momento estamos fuera de horario. Te responderemos tan pronto como sea posible durante nuestro horario de atención."
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </CardFooter>
          </form>
        </Card>
        
        {/* Configuración de idiomas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Configuración de Idiomas
            </CardTitle>
            <CardDescription>
              Define en qué idiomas podrá comunicarse tu asistente
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Idiomas soportados</Label>
                <div className="flex flex-wrap gap-2">
                  {["Español", "Inglés", "Francés", "Alemán", "Italiano", "Portugués"].map((language) => (
                    <Button 
                      key={language}
                      type="button"
                      variant={language === "Español" || language === "Inglés" ? "default" : "outline"}
                      className={`${
                        language === "Español" || language === "Inglés" 
                          ? "bg-whatsapp text-white" 
                          : ""
                      } rounded-full px-4`}
                    >
                      {language}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="primaryLanguage">Idioma principal</Label>
                <Input id="primaryLanguage" defaultValue="Español" />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
