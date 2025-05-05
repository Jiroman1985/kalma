import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight } from 'lucide-react';

const phrases = [
  "WhatsApp",
  "Instagram",
  "Email",
  "Llamadas telefónicas",
  "Microsoft Teams",
  "Todas tus comunicaciones"
];

const HeroSection = () => {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [displayPhrase, setDisplayPhrase] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  
  useEffect(() => {
    const phrase = phrases[currentPhraseIndex];
    let timer: NodeJS.Timeout;

    if (isTyping) {
      if (displayPhrase.length < phrase.length) {
        timer = setTimeout(() => {
          setDisplayPhrase(phrase.substring(0, displayPhrase.length + 1));
        }, 150); // Slowed down from 80ms to 150ms
      } else {
        setIsTyping(false);
        // Extended pause at the end of typing to give more time to read
        timer = setTimeout(() => {
          setIsTyping(false);
        }, 3500); // Increased from 2000ms to 3500ms
      }
    } else {
      if (displayPhrase.length > 0) {
        timer = setTimeout(() => {
          setDisplayPhrase(phrase.substring(0, displayPhrase.length - 1));
        }, 75); // Slowed down from 50ms to 75ms
      } else {
        setIsTyping(true);
        setCurrentPhraseIndex((currentPhraseIndex + 1) % phrases.length);
      }
    }

    return () => clearTimeout(timer);
  }, [currentPhraseIndex, displayPhrase, isTyping]);

  return (
    <section className="relative min-h-screen flex flex-col justify-center items-center text-center overflow-hidden pt-16">
      {/* Background gradients */}
      <div className="absolute top-0 left-0 right-0 bottom-0 overflow-hidden">
        <div className="absolute top-20 -left-20 w-96 h-96 bg-purple-400 opacity-10 rounded-full filter blur-3xl animate-pulse-slow"></div>
        <div className="absolute top-40 -right-20 w-96 h-96 bg-blue-400 opacity-10 rounded-full filter blur-3xl animate-pulse-slow animation-delay-200"></div>
        <div className="absolute bottom-20 left-40 w-64 h-64 bg-indigo-300 opacity-10 rounded-full filter blur-3xl animate-pulse-slow animation-delay-300"></div>
      </div>

      <div className="container px-4 mx-auto z-10">
        <h1 className="text-4xl md:text-6xl font-heading font-bold mb-6">
          Gestiona <span className="text-gradient">con Kalma</span>
          <br />
          <span className="inline-block h-16 md:h-24 overflow-hidden">
            <span className="block">{displayPhrase}<span className={`inline-block w-1 h-6 md:h-8 ml-1 bg-primary ${isTyping ? 'animate-blink' : 'opacity-0'}`}></span></span>
          </span>
        </h1>

        <p className="text-xl md:text-2xl max-w-3xl mx-auto mb-8">
          Ahorra tiempo y mejora la experiencia de tus clientes con una 
          plataforma de comunicación unificada potenciada por inteligencia artificial.
        </p>

        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <Button size="lg" className="bg-gradient-main hover:opacity-90 text-white text-lg px-8">
            Comenzar prueba gratuita
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="border-primary text-primary hover:bg-primary/10 text-lg px-8"
          >
            Ver demostración <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {/* Platform animation */}
        <div className="relative mt-16 max-w-4xl mx-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-xl">
            <div className="relative rounded-lg overflow-hidden aspect-video bg-gradient-to-br from-primary/10 to-secondary/10">
              {/* Animated chat interface visualization */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full max-w-3xl grid grid-cols-12 gap-4 p-4">
                  {/* Left sidebar */}
                  <div className="col-span-3 h-64 bg-white rounded-lg shadow-md flex flex-col animate-float p-2">
                    <div className="h-4 w-3/4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 w-1/2 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 w-5/6 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 w-4/6 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 w-3/6 bg-gray-200 rounded"></div>
                    <div className="mt-auto flex space-x-1">
                      <div className="h-8 w-8 bg-primary rounded-full"></div>
                      <div className="h-8 w-8 bg-blue-400 rounded-full"></div>
                      <div className="h-8 w-8 bg-green-400 rounded-full"></div>
                    </div>
                  </div>
                  
                  {/* Main content */}
                  <div className="col-span-9 h-64 bg-white rounded-lg shadow-md flex flex-col animate-float animate-delay-100 p-3">
                    <div className="flex justify-between items-center mb-2">
                      <div className="h-5 w-1/3 bg-gray-200 rounded"></div>
                      <div className="flex space-x-1">
                        <div className="h-5 w-5 bg-primary rounded-full"></div>
                        <div className="h-5 w-5 bg-blue-400 rounded-full"></div>
                      </div>
                    </div>
                    
                    <div className="flex-grow overflow-hidden relative">
                      <div className="absolute bottom-0 left-0 right-0 flex flex-col space-y-2">
                        <div className="flex">
                          <div className="h-8 w-8 bg-blue-400 rounded-full mr-2"></div>
                          <div className="h-12 w-3/4 bg-blue-100 rounded-lg"></div>
                        </div>
                        <div className="flex justify-end">
                          <div className="h-10 w-2/3 bg-primary/10 rounded-lg"></div>
                          <div className="h-8 w-8 bg-primary rounded-full ml-2"></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="h-8 bg-gray-100 rounded-lg flex items-center justify-between px-3">
                      <div className="h-3 w-3/4 bg-gray-200 rounded"></div>
                      <div className="h-4 w-4 bg-primary rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Floating logos */}
          <div className="absolute -top-6 -left-6 h-16 w-16 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center animate-float shadow-lg">
            <span className="text-2xl">💬</span>
          </div>
          <div className="absolute top-1/4 -right-6 h-16 w-16 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center animate-float animate-delay-200 shadow-lg">
            <span className="text-2xl">📱</span>
          </div>
          <div className="absolute -bottom-6 left-1/4 h-16 w-16 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center animate-float animate-delay-300 shadow-lg">
            <span className="text-2xl">📧</span>
          </div>
          <div className="absolute -bottom-6 right-1/3 h-16 w-16 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center animate-float animate-delay-100 shadow-lg">
            <span className="text-2xl">📞</span>
          </div>
        </div>
      </div>

      {/* Down arrow */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 5V19M12 19L19 12M12 19L5 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;
