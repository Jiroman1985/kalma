import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Clock, Globe, MessageSquare, Loader2, ArrowLeft, ArrowRight, LockOpen } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Switch } from "@/components/ui/switch";

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
  whatsappNumber: string;
  // Campos para controlar la visibilidad de los bloques
  companyInfoCompleted: boolean;
  agentConfigCompleted: boolean;
  availabilityConfigCompleted: boolean;
  languageConfigCompleted: boolean;
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
  supportedLanguages: ["Español", "Inglés"],
  whatsappNumber: "",
  // Por defecto, solo el primer bloque está visible
  companyInfoCompleted: false,
  agentConfigCompleted: false,
  availabilityConfigCompleted: false,
  languageConfigCompleted: false
};

const Settings = () => {
  const { currentUser, userData, activateFreeTrial, setVinculado } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  // Estado para controlar el carrusel
  const [activeStep, setActiveStep] = useState(0);
  const [activatingTrial, setActivatingTrial] = useState(false);
  
  // Función para activar el período de prueba gratuito
  const handleActivateTrial = async () => {
    if (!userData || userData.freeTier) return;
    
    setActivatingTrial(true);
    try {
      const success = await activateFreeTrial();
      if (success) {
        toast({
          title: "¡Prueba gratuita activada!",
          description: "Has activado tu período de prueba gratuito por 15 días."
        });
      }
    } catch (error) {
      console.error("Error al activar la prueba:", error);
    } finally {
      setActivatingTrial(false);
    }
  };

  // Cargar los datos del usuario al iniciar
  useEffect(() => {
    const loadUserSettings = async () => {
      if (currentUser) {
        setIsLoading(true);
        try {
          console.log("Intentando cargar configuraciones para el usuario:", currentUser.uid);
          const userDocRef = doc(db, "users", currentUser.uid);
          
          // Verificamos si existe el documento del usuario
          console.log("Verificando si existe el documento del usuario...");
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            console.log("Documento de usuario encontrado, cargando configuraciones...");
            const userData = userDocSnap.data() as Partial<UserSettings>;
            console.log("Datos obtenidos:", userData);
            
            // Combinar los datos existentes con los valores por defecto
            const combinedSettings = {
              ...defaultSettings,
              ...userData
            };
            
            console.log("Configuración combinada:", combinedSettings);
            setSettings(combinedSettings);
            
            // Determinar qué paso mostrar basado en la configuración del usuario
            if (combinedSettings.languageConfigCompleted) {
              setActiveStep(3);
            } else if (combinedSettings.availabilityConfigCompleted) {
              setActiveStep(2);
            } else if (combinedSettings.agentConfigCompleted) {
              setActiveStep(1);
            } else {
              setActiveStep(0);
            }
          } else {
            console.log("No se encontró el documento del usuario, creando uno nuevo con valores por defecto...");
            
            // Inicializar el documento con valores por defecto
            try {
              await setDoc(userDocRef, defaultSettings);
              console.log("Documento de usuario creado exitosamente con valores por defecto");
              setSettings(defaultSettings);
              setActiveStep(0);
            } catch (initError) {
              console.error("Error al inicializar documento de usuario:", initError);
              
              // Informar al usuario sobre el error
              toast({
                title: "Error de inicialización",
                description: "No se pudo crear la configuración inicial. Verifica tu conexión e inténtalo nuevamente.",
                variant: "destructive"
              });
            }
          }
        } catch (error) {
          console.error("Error al cargar los datos del usuario:", error);
          
          // Proporcionar un mensaje de error más descriptivo
          let errorMessage = "No se pudieron cargar tus configuraciones. Por favor, recarga la página e intenta de nuevo.";
          
          if (error instanceof Error) {
            console.error("Detalles del error:", error.message);
            
            // Personalizar mensaje según el tipo de error
            if (error.message.includes("permission-denied")) {
              errorMessage = "No tienes permiso para acceder a estas configuraciones. Contacta al administrador.";
            } else if (error.message.includes("not-found")) {
              errorMessage = "No se encontró tu perfil. Puede que necesites crear uno nuevo.";
            } else if (error.message.includes("network")) {
              errorMessage = "Error de conexión. Verifica tu conexión a internet e intenta nuevamente.";
            }
          }
          
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive"
          });
          
          // En caso de error, usar los valores por defecto
          setSettings(defaultSettings);
          setActiveStep(0);
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
  
  // Guardar los ajustes del usuario y habilitar el siguiente bloque
  const handleSubmit = async (event: React.FormEvent, section: 'company' | 'agent' | 'availability' | 'language') => {
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
      
      // Marcar la sección como completada
      switch (section) {
        case 'company':
          cleanedSettings.companyInfoCompleted = true;
          break;
        case 'agent':
          cleanedSettings.agentConfigCompleted = true;
          break;
        case 'availability':
          cleanedSettings.availabilityConfigCompleted = true;
          break;
        case 'language':
          cleanedSettings.languageConfigCompleted = true;
          
          // Si es la última sección y el usuario tiene freeTier pero no está vinculado, 
          // actualizamos el campo vinculado y mostramos mensaje especial
          if (userData?.freeTier && !userData?.vinculado) {
            // Actualizar el documento en Firestore para registrar que el usuario ha terminado la configuración
            // pero aún necesita vincular su WhatsApp
            try {
              await setVinculado(false);
              
              // Mostrar mensaje especial de vinculación de WhatsApp
              toast({
                title: "¡Configuración completada!",
                description: "En breve recibirás en tu email las instrucciones necesarias para vincular tu WhatsApp junto con el código QR.",
                duration: 6000
              });
            } catch (vinculacionError) {
              console.error("Error al actualizar estado de vinculación:", vinculacionError);
            }
          } else {
            toast({
              title: "Configuración guardada",
              description: "Los cambios han sido guardados correctamente."
            });
          }
          break;
        default:
          toast({
            title: "Configuración guardada",
            description: "Los cambios han sido guardados correctamente."
          });
          break;
      }
      
      console.log("Guardando configuración:", cleanedSettings);
      
      // Verificar si existe el documento del usuario
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) {
        console.log("Documento de usuario no encontrado, creando uno nuevo");
        await setDoc(userDocRef, cleanedSettings);
      } else {
        console.log("Actualizando documento de usuario existente");
        await updateDoc(userDocRef, cleanedSettings);
      }
      
      // Actualizar el estado local
      setSettings(cleanedSettings);
      
      // Avanzar al siguiente paso en el carrusel
      if (activeStep < 3) {
        setActiveStep(activeStep + 1);
      }
      
      console.log("Configuración guardada correctamente");
    } catch (error) {
      console.error("Error detallado al guardar la configuración:", error);
      
      // Mostrar mensaje de error más detallado si está disponible
      let errorMessage = "No se pudieron guardar los cambios. Por favor, inténtalo de nuevo.";
      
      if (error instanceof Error) {
        console.error("Detalles del error:", error.message);
        console.error("Stack trace:", error.stack);
        
        // Si el error tiene un mensaje específico, lo mostramos
        if (error.message.includes("permission-denied")) {
          errorMessage = "No tienes permisos para guardar esta configuración. Contacta al administrador.";
        } else if (error.message.includes("network")) {
          errorMessage = "Error de conexión. Verifica tu conexión a internet e intenta nuevamente.";
        } else if (error.message.includes("quota-exceeded")) {
          errorMessage = "Se ha excedido el límite de operaciones. Intenta más tarde.";
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

      {/* Bloque de activación de prueba gratuita */}
      {userData && !userData.isPaid && (
        <Card className="mb-6 bg-gradient-to-r from-whatsapp/10 to-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Período de prueba gratuito (15 días)
            </CardTitle>
            <CardDescription>
              Activa tu período de prueba gratuito y disfruta de todas las funcionalidades
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                {userData.freeTier ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <LockOpen className="h-4 w-4" />
                    <span className="font-medium">
                      Tu prueba gratuita está activa hasta: {userData.freeTierFinishDate}
                    </span>
                  </div>
                ) : userData.isTrialExpired ? (
                  <span className="text-orange-600">
                    Tu período de prueba ha finalizado. Considera actualizar a un plan de pago.
                  </span>
                ) : (
                  <span>Activa tu prueba gratuita para acceder a todas las funcionalidades.</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={userData.freeTier}
                  disabled={userData.freeTier || userData.isPaid || activatingTrial}
                  onCheckedChange={handleActivateTrial}
                />
                <span>{userData.freeTier ? "Activado" : "Desactivado"}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="my-8">
        <Carousel 
          className="w-full" 
          opts={{ 
            align: "start",
            loop: false,
            startIndex: activeStep,
            dragFree: false
          }}
          orientation="horizontal"
        >
          <CarouselContent>
            {/* Información de la empresa */}
            <CarouselItem className="basis-full">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Información de Empresa
                  </CardTitle>
                  <CardDescription>
                    Estos datos nos ayudan a personalizar mejor tu asistente IA
                  </CardDescription>
                </CardHeader>
                <form onSubmit={(e) => handleSubmit(e, 'company')}>
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
                  <CardFooter className="flex justify-end">
                    <Button 
                      type="submit" 
                      className="w-full md:w-auto bg-whatsapp hover:bg-whatsapp-dark"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</>
                      ) : (
                        <>Continuar <ArrowRight className="ml-2 h-4 w-4" /></>
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </CarouselItem>

            {/* Configuración general del bot */}
            <CarouselItem className="basis-full">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Configuración del Agente IA
                  </CardTitle>
                  <CardDescription>
                    Personaliza cómo responderá tu asistente de IA en WhatsApp
                  </CardDescription>
                </CardHeader>
                <form onSubmit={(e) => handleSubmit(e, 'agent')}>
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
                  <CardFooter className="flex justify-between">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setActiveStep(0)}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" /> Atrás
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>Continuar <ArrowRight className="ml-2 h-4 w-4" /></>
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </CarouselItem>

            {/* Configuración de disponibilidad */}
            <CarouselItem className="basis-full">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Configuración de Disponibilidad
                  </CardTitle>
                  <CardDescription>
                    Define cuándo tu asistente estará activo para responder mensajes
                  </CardDescription>
                </CardHeader>
                <form onSubmit={(e) => handleSubmit(e, 'availability')}>
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
                  <CardFooter className="flex justify-between">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setActiveStep(1)}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" /> Atrás
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>Continuar <ArrowRight className="ml-2 h-4 w-4" /></>
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </CarouselItem>
            
            {/* Configuración de idiomas */}
            <CarouselItem className="basis-full">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Configuración de Idiomas
                  </CardTitle>
                  <CardDescription>
                    Define en qué idiomas podrá comunicarse tu asistente
                  </CardDescription>
                </CardHeader>
                <form onSubmit={(e) => handleSubmit(e, 'language')}>
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
                  <CardFooter className="flex justify-between">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setActiveStep(2)}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" /> Atrás
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>Finalizar</>
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </CarouselItem>
          </CarouselContent>
          
          <div className="flex justify-center w-full mt-4">
            <div className="flex gap-1">
              {[0, 1, 2, 3].map((index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="icon"
                  className={`h-2 w-2 rounded-full ${activeStep === index ? 'bg-whatsapp' : 'bg-muted'}`}
                  onClick={() => {
                    if (
                      (index === 1 && settings.companyInfoCompleted) ||
                      (index === 2 && settings.agentConfigCompleted) ||
                      (index === 3 && settings.availabilityConfigCompleted) ||
                      index < activeStep
                    ) {
                      setActiveStep(index);
                    }
                  }}
                />
              ))}
            </div>
          </div>
        </Carousel>
      </div>

      {/* En la vista inicial al cargar la página, mostrar mensaje si corresponde */}
      {userData?.freeTier && !userData?.vinculado && settings.languageConfigCompleted && (
        <Card className="mb-6 bg-gradient-to-r from-green-100 to-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              Vinculación de WhatsApp pendiente
            </CardTitle>
            <CardDescription>
              Tu cuenta está pendiente de vinculación con WhatsApp
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              En breve recibirás en tu email ({currentUser?.email}) las instrucciones necesarias 
              para vincular tu WhatsApp junto con el código QR. Si no recibes el email en los 
              próximos minutos, revisa tu carpeta de spam.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Settings;
