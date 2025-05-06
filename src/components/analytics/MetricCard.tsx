import React from 'react';
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUp, ArrowDown, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: string;
  trendValue?: number;
  trendLabel?: string;
  trendDirection?: 'up' | 'down' | 'neutral' | 'down-good' | 'up-good';
  loading?: boolean;
  isLoading?: boolean;
  color?: 'blue' | 'pink' | 'purple' | 'amber' | 'green' | 'slate';
  className?: string;
}

const MetricCard = ({
  title,
  value,
  icon,
  description,
  trend,
  trendValue,
  trendLabel,
  trendDirection = 'neutral',
  loading = false,
  isLoading = false,
  color = 'blue',
  className
}: MetricCardProps) => {
  // Usar cualquiera de los estados de carga
  const isCardLoading = loading || isLoading;
  
  // Determinar si la tendencia es positiva
  const isPositive = trendDirection === 'up' || trendDirection === 'up-good' || 
                     (trendValue !== undefined && trendValue > 0 && trendDirection !== 'down-good');
  
  // Determinar si la tendencia es negativa
  const isNegative = trendDirection === 'down' || trendDirection === 'down-good' ||
                     (trendValue !== undefined && trendValue < 0 && trendDirection !== 'up-good');
  
  // Determinar si "negativo" es bueno
  const isNegativeGood = trendDirection === 'down-good';
  
  // Determinar si "positivo" es bueno
  const isPositiveGood = trendDirection === 'up-good';
  
  // Determinar color de tendencia
  const getTrendColor = () => {
    if (isNegative && !isNegativeGood) return "text-red-500";
    if (isNegative && isNegativeGood) return "text-green-500";
    if (isPositive && !isPositiveGood) return "text-green-500";
    if (isPositive && isPositiveGood) return "text-green-500";
    return "text-gray-500";
  };
  
  // Renderizar icono de tendencia
  const renderTrendIcon = () => {
    if (isPositive) return <ArrowUp className="h-3 w-3" />;
    if (isNegative) return <ArrowDown className="h-3 w-3" />;
    return <ArrowRight className="h-3 w-3" />;
  };
  
  // Formatear valor de tendencia
  const formatTrendValue = () => {
    if (trendValue !== undefined) {
      const prefix = trendValue > 0 ? '+' : '';
      return `${prefix}${trendValue}%`;
    }
    return trend || '0%';
  };

  return (
    <Card className={cn("p-4", className)}>
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={cn(
              "p-2 rounded-full", 
              color === 'blue' ? 'bg-blue-100 text-blue-500' :
              color === 'pink' ? 'bg-pink-100 text-pink-500' :
              color === 'purple' ? 'bg-purple-100 text-purple-500' :
              color === 'amber' ? 'bg-amber-100 text-amber-500' :
              color === 'green' ? 'bg-green-100 text-green-500' :
              color === 'slate' ? 'bg-slate-100 text-slate-500' :
              'bg-blue-100 text-blue-500'
            )}>
              {icon}
            </div>
          </div>
          
          {isCardLoading ? (
            <>
              <Skeleton className="h-10 w-3/4 mb-2" />
            </>
          ) : (
            <div className="flex items-center justify-between w-full">
              <div>
                <h3 className="font-medium text-gray-500 text-sm">{title}</h3>
                <div className="text-2xl font-bold">{value}</div>
                {description && (
                  <p className="text-xs text-gray-500 mt-1">{description}</p>
                )}
                {trendLabel && (
                  <p className="text-xs text-gray-500 mt-1">{trendLabel}</p>
                )}
              </div>
              
              <div>
                {(trend !== undefined || trendValue !== undefined) && (
                  <div className={cn("flex items-center text-xs font-medium", getTrendColor())}>
                    {renderTrendIcon()}
                    <span>{formatTrendValue()}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default MetricCard; 