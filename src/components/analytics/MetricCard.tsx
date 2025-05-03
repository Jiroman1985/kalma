import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: number;
  color?: string;
  isLoading?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  description,
  trend,
  color = "bg-blue-500",
  isLoading = false
}) => {
  // Determinar color de tendencia
  const trendColor = trend && trend > 0 ? 'text-green-500' : 'text-red-500';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden border-0 shadow-md">
        <div className={cn("h-1 w-full", color)} />
        <CardContent className="p-6">
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-4 w-1/2 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 w-1/3 bg-gray-300 rounded mb-4"></div>
              <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-medium text-gray-500">{title}</h3>
                <div className={cn("p-2 rounded-full", color, "bg-opacity-10")}>
                  {React.cloneElement(icon as React.ReactElement, {
                    className: cn("h-5 w-5", color.replace('bg-', 'text-'))
                  })}
                </div>
              </div>
              
              <div className="flex items-end gap-2">
                <p className="text-2xl font-bold">{value}</p>
                
                {trend !== undefined && (
                  <div className={cn("flex items-center text-sm", trendColor)}>
                    {trend > 0 ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    <span>{Math.abs(trend)}%</span>
                  </div>
                )}
              </div>
              
              {description && (
                <p className="text-xs text-gray-500 mt-1">{description}</p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MetricCard; 