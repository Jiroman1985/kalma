import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: string | number;
  trendDirection?: 'up' | 'down' | 'neutral';
  loading?: boolean;
  color?: string;
  className?: string;
}

const MetricCard = ({
  title,
  value,
  icon,
  description,
  trend,
  trendDirection = 'neutral',
  loading = false,
  color = 'blue',
  className
}: MetricCardProps) => {
  
  // Convertir valores negativos para mostrar correctamente
  const trendValue = typeof trend === 'number' 
    ? Math.abs(trend) 
    : typeof trend === 'string' && trend.startsWith('-')
      ? trend.substring(1)
      : trend;

  // Determinar colores basados en el color proporcionado
  const colorMap: Record<string, { bg: string, text: string, light: string }> = {
    blue: { bg: 'bg-blue-500', text: 'text-blue-600', light: 'bg-blue-50' },
    indigo: { bg: 'bg-indigo-500', text: 'text-indigo-600', light: 'bg-indigo-50' },
    purple: { bg: 'bg-purple-500', text: 'text-purple-600', light: 'bg-purple-50' },
    pink: { bg: 'bg-pink-500', text: 'text-pink-600', light: 'bg-pink-50' },
    red: { bg: 'bg-red-500', text: 'text-red-600', light: 'bg-red-50' },
    orange: { bg: 'bg-orange-500', text: 'text-orange-600', light: 'bg-orange-50' },
    amber: { bg: 'bg-amber-500', text: 'text-amber-600', light: 'bg-amber-50' },
    yellow: { bg: 'bg-yellow-500', text: 'text-yellow-600', light: 'bg-yellow-50' },
    lime: { bg: 'bg-lime-500', text: 'text-lime-600', light: 'bg-lime-50' },
    green: { bg: 'bg-green-500', text: 'text-green-600', light: 'bg-green-50' },
    emerald: { bg: 'bg-emerald-500', text: 'text-emerald-600', light: 'bg-emerald-50' },
    teal: { bg: 'bg-teal-500', text: 'text-teal-600', light: 'bg-teal-50' },
    cyan: { bg: 'bg-cyan-500', text: 'text-cyan-600', light: 'bg-cyan-50' },
    sky: { bg: 'bg-sky-500', text: 'text-sky-600', light: 'bg-sky-50' },
  };

  const colorClasses = colorMap[color] || colorMap.blue;

  // Determinar la clase de color para la tendencia
  const trendColorClass = trendDirection === 'up' 
    ? 'text-green-600' 
    : trendDirection === 'down' 
      ? 'text-red-600' 
      : colorClasses.text;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="font-medium text-sm text-gray-500">{title}</div>
          <div className={cn(
            "p-2 rounded-full", 
            colorClasses.light
          )}>
            {React.cloneElement(icon as React.ReactElement, {
              className: cn("h-5 w-5", colorClasses.text)
            })}
          </div>
        </div>
        
        {loading ? (
          <>
            <Skeleton className="h-10 w-3/4 mb-2" />
            <Skeleton className="h-5 w-1/2" />
          </>
        ) : (
          <>
            <div className="text-3xl font-bold mb-1">
              {value}
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                {description}
              </span>
              
              {trend !== undefined && (
                <div className={cn("flex items-center text-xs font-medium", trendColorClass)}>
                  {trendDirection === 'up' ? (
                    <ArrowUpIcon className="h-3 w-3 mr-1" />
                  ) : trendDirection === 'down' ? (
                    <ArrowDownIcon className="h-3 w-3 mr-1" />
                  ) : null}
                  {trendValue}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default MetricCard; 