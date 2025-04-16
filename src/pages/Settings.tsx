import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Clock, Globe, MessageSquare, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

// Definición del tipo para los datos del usuario
interface UserSettings {
  companyName: string;
  businessType: string;
  contactPhone: string;
  websiteUrl: string;
  botName: string;
  welcomeMessage: string;
  knowledgeBase: string;
  startTime: string;
  endTime: string;
  activeDays: string[];
  outOfHoursMessage: string;
  primaryLanguage: string;
  supportedLanguages: string[];
}

// Valores por defecto para los ajustes del usuario
const defaultSettings: UserSettings = {
  companyName: "",
  businessType: "",
  contactPhone: "",
  websiteUrl: "",
  botName: "AsistenteAI",
  welcomeMessage: "¡Hola! Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?",
  knowledgeBase: "Somos una empresa dedicada a la venta de productos electrónicos. Ofrecemos garantía de 1 año en todos nuestros productos. Nuestro horario de atención es de lunes a viernes de 9:00 a 18:00.",
  startTime: "09:00",
  endTime: "18:00",
  activeDays: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"],
  outOfHoursMessage: "Gracias por tu mensaje. En este momento estamos fuera de horario. Te responderemos tan pronto como sea posible durante nuestro horario de atención.",
  primaryLanguage: "Español",
  supportedLanguages: ["Español", "Inglés"]
};

const Settings = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  
  // Cargar los datos del usuario al iniciar
  useEffect(() => {
    const loadUserSettings = async () => {
      if (currentUser) {
        setIsLoading(true);
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data() as Partial<UserSettings>;
            // Combinar los datos existentes con los valores por defecto
            setSettings({
              ...defaultSettings,
              ...userData
            });
          } else {
            console.log("No se encontró el documento del usuario, usando valores por defecto");
            // Inicializar el documento con valores por defecto
            await setDoc(userDocRef, defaultSettings);
          }
        } catch (error) {
          console.error("Error al cargar los datos del usuario:", error);
          toast({
            title: "Error",
            description: "No se pudieron cargar tus configuraciones. Por favor, inténtalo de nuevo.",
            variant: "destructive"
          });
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    loadUserSettings();
  }, [currentUser, toast]);
  
  // Manejar cambios en los campos de formulario
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    field: keyof UserSettings
  ) => {
    setSettings({
      ...settings,
      [field]: e.target.value
    });
  };
  
  // Manejar cambios en los días activos
  const handleDayToggle = (day: string) => {
    const updatedDays = settings.activeDays.includes(day)
      ? settings.activeDays.filter(d => d !== day)
      : [...settings.activeDays, day];
    
    setSettings({
      ...settings,
      activeDays: updatedDays
    });
  };
  
  // Manejar cambios en los idiomas soportados
  const handleLanguageToggle = (language: string) => {
    const updatedLanguages = settings.supportedLanguages.includes(language)
      ? settings.supportedLanguages.filter(l => l !== language)
      : [...settings.supportedLanguages, language];
    
    setSettings({
      ...settings,
      supportedLanguages: updatedLanguages
    });
  };
  
  // Guardar los ajustes del usuario
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!currentUser) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para guardar tu configuración.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log("Iniciando guardado de configuración para usuario:", currentUser.uid);
      const userDocRef = doc(db, "users", currentUser.uid);
      
      // Asegurarnos de que no haya campos undefined que puedan causar problemas
      const cleanedSettings = { ...settings };
      Object.keys(cleanedSettings).forEach(key => {
        // Convertir cualquier valor undefined a string vacío para evitar errores
        if (cleanedSettings[key as keyof UserSettings] === undefined) {
          // @ts-ignore - Manejamos esta asignación dinámicamente
          cleanedSettings[key] = "";
        }
      });
      
      console.log("Guardando configuración:", cleanedSettings);
      await setDoc(userDocRef, cleanedSettings, { merge: true });
      console.log("Configuración guardada correctamente");
      
      toast({
        title: "Configuración guardada",
        description: "Los cambios han sido guardados correctamente."
      });
    } catch (error) {
      console.error("Error al guardar la configuración:", error);
      
      // Mostrar mensaje de error más detallado si está disponible
      let errorMessage = "No se pudieron guardar los cambios. Por favor, inténtalo de nuevo.";
      if (error instanceof Error) {
        console.error("Detalles del error:", error.message);
        // Si el error tiene un mensaje específico, lo mostramos
        if (error.message.includes("permission-denied")) {
          errorMessage = "No tienes permisos para guardar esta configuración. Contacta al administrador.";
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Información de la empresa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Información de Empresa
            </CardTitle>
            <CardDescription>
              Estos datos nos ayudan a personalizar mejor tu asistente IA
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Nombre de la Empresa</Label>
                <Input 
                  id="companyName" 
                  value={settings.companyName} 
                  onChange={(e) => handleChange(e, 'companyName')}
                  placeholder="Tu Empresa S.L."
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="businessType">Tipo de Negocio</Label>
                <Input 
                  id="businessType" 
                  value={settings.businessType} 
                  onChange={(e) => handleChange(e, 'businessType')}
                  placeholder="Ej: Tienda de ropa, Restaurante, Consultoría..."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Teléfono de Contacto</Label>
                  <Input 
                    id="contactPhone" 
                    value={settings.contactPhone} 
                    onChange={(e) => handleChange(e, 'contactPhone')}
                    placeholder="+34 XXX XXX XXX"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="websiteUrl">Sitio Web</Label>
                  <Input 
                    id="websiteUrl" 
                    value={settings.websiteUrl} 
                    onChange={(e) => handleChange(e, 'websiteUrl')}
                    placeholder="https://tuempresa.com"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                type="submit" 
                className="w-full md:w-auto bg-whatsapp hover:bg-whatsapp-dark"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</>
                ) : (
                  <>Guardar Información</>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

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
                <Input 
                  id="botName" 
                  value={settings.botName} 
                  onChange={(e) => handleChange(e, 'botName')}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="welcomeMessage">Mensaje de Bienvenida</Label>
                <Textarea 
                  id="welcomeMessage" 
                  rows={3}
                  value={settings.welcomeMessage}
                  onChange={(e) => handleChange(e, 'welcomeMessage')}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="knowledgeBase">Base de Conocimiento</Label>
                <Textarea 
                  id="knowledgeBase" 
                  rows={5}
                  placeholder="Añade información específica sobre tu negocio, productos, servicios, políticas, etc."
                  value={settings.knowledgeBase}
                  onChange={(e) => handleChange(e, 'knowledgeBase')}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : "Guardar Cambios"}
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
                    <Input 
                      id="startTime" 
                      type="time" 
                      value={settings.startTime}
                      onChange={(e) => handleChange(e, 'startTime')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime" className="text-xs">Hora fin</Label>
                    <Input 
                      id="endTime" 
                      type="time" 
                      value={settings.endTime}
                      onChange={(e) => handleChange(e, 'endTime')}
                    />
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
                      variant={settings.activeDays.includes(day) ? "default" : "outline"}
                      className={`${
                        settings.activeDays.includes(day)
                          ? "bg-whatsapp text-white" 
                          : ""
                      } rounded-full px-4`}
                      onClick={() => handleDayToggle(day)}
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
                  value={settings.outOfHoursMessage}
                  onChange={(e) => handleChange(e, 'outOfHoursMessage')}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : "Guardar Cambios"}
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
                      variant={settings.supportedLanguages.includes(language) ? "default" : "outline"}
                      className={`${
                        settings.supportedLanguages.includes(language)
                          ? "bg-whatsapp text-white" 
                          : ""
                      } rounded-full px-4`}
                      onClick={() => handleLanguageToggle(language)}
                    >
                      {language}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="primaryLanguage">Idioma principal</Label>
                <Input 
                  id="primaryLanguage" 
                  value={settings.primaryLanguage}
                  onChange={(e) => handleChange(e, 'primaryLanguage')}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : "Guardar Cambios"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
