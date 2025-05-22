import { StagewiseToolbar } from '@stagewise/toolbar-react';

export function StagewiseProvider() {
  // Solo renderizar en desarrollo
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const stagewiseConfig = {
    plugins: []
  };

  return <StagewiseToolbar config={stagewiseConfig} />;
} 