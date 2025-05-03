import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Info, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ChartContainerProps {
  title: string;
  description?: string;
  infoTooltip?: string;
  children: React.ReactNode;
  tabs?: Array<{ value: string; label: string; content: React.ReactNode }>;
  allowDownload?: boolean;
  allowRefresh?: boolean;
  onRefresh?: () => void;
  isLoading?: boolean;
  className?: string;
}

const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  description,
  infoTooltip,
  children,
  tabs,
  allowDownload = false,
  allowRefresh = false,
  onRefresh,
  isLoading = false,
  className = ""
}) => {
  const [activeTab, setActiveTab] = useState<string>(tabs && tabs.length > 0 ? tabs[0].value : "");

  // Función para descargar datos (simulada)
  const handleDownload = () => {
    // En una implementación real, aquí convertirías los datos a CSV/Excel
    console.log("Descargando datos de:", title);
    alert("Función de descarga simulada para: " + title);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      );
    }

    if (tabs && tabs.length > 0) {
      return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              {tabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {renderActions()}
          </div>
          
          {tabs.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="p-0">
              {tab.content}
            </TabsContent>
          ))}
        </Tabs>
      );
    }

    return (
      <>
        <div className="flex justify-end mb-2">
          {renderActions()}
        </div>
        {children}
      </>
    );
  };

  const renderActions = () => (
    <div className="flex gap-2">
      {allowRefresh && (
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="sr-only">Actualizar</span>
        </Button>
      )}
      
      {allowDownload && (
        <Button 
          variant="ghost" 
          size="sm"
          onClick={handleDownload}
        >
          <Download className="h-4 w-4" />
          <span className="sr-only">Descargar</span>
        </Button>
      )}
    </div>
  );

  return (
    <Card className={`shadow-sm ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              {title}
              {infoTooltip && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">{infoTooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </CardTitle>
            {description && (
              <CardDescription>{description}</CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default ChartContainer; 