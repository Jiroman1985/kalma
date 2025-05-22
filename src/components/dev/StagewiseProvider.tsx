import { StagewiseToolbar } from '@stagewise/toolbar-react';
import { createRoot } from 'react-dom/client';

// Este componente no renderiza nada en el árbol principal
export function StagewiseProvider() {
  return null;
}

// Inicializar Stagewise en un contenedor separado
function initStagewise() {
  // Solo en desarrollo y en el navegador
  if (process.env.NODE_ENV !== 'development' || typeof window === 'undefined') {
    return;
  }
  
  // Crear un contenedor separado para Stagewise
  const stagewise = document.createElement('div');
  stagewise.id = 'stagewise-container';
  document.body.appendChild(stagewise);
  
  // Configuración básica
  const stagewiseConfig = {
    plugins: []
  };
  
  // Renderizar Stagewise en su propio árbol de React
  const root = createRoot(stagewise);
  root.render(<StagewiseToolbar config={stagewiseConfig} />);
}

// Inicializar después de que el DOM esté completamente cargado
if (typeof window !== 'undefined') {
  if (document.readyState === 'complete') {
    initStagewise();
  } else {
    window.addEventListener('load', initStagewise);
  }
} 