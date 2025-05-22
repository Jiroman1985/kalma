import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import App from './App.tsx'
import './index.css'
import { StagewiseProvider } from './components/dev/StagewiseProvider'

// Desactivar las advertencias de desarrollo en producción
if (import.meta.env.PROD) {
  console.log = () => {}
  console.warn = () => {}
  console.error = () => {}
}

// Crear el contenedor raíz con renderizado de alta prioridad
const container = document.getElementById('root')
const root = createRoot(container!)

// Renderizar la aplicación dentro de StrictMode para detectar problemas durante el desarrollo
root.render(
  <StrictMode>
    <App />
    {/* Stagewise solo se renderiza en modo desarrollo */}
    <StagewiseProvider />
  </StrictMode>
)
