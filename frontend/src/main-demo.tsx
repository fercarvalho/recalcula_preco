import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import AppBasic from './AppBasic.tsx'
import LoginBasic from './components/LoginBasic.tsx'
import LandingPageBasic from './components/LandingPageBasic.tsx'
import { ThemeProvider } from './contexts/ThemeContext'
import './index.css'

const root = createRoot(document.getElementById('root')!)

// Verificar autenticação
const isAuthenticated = sessionStorage.getItem('demo_authenticated') === 'true';
const hasStarted = sessionStorage.getItem('demo_started') === 'true';

if (!hasStarted) {
  // Mostrar landing page
  root.render(
    <StrictMode>
      <ThemeProvider>
        <LandingPageBasic onStartClick={() => {
          sessionStorage.setItem('demo_started', 'true');
          window.location.reload();
        }} />
      </ThemeProvider>
    </StrictMode>
  )
} else if (!isAuthenticated) {
  // Mostrar login
  root.render(
    <StrictMode>
      <ThemeProvider>
        <LoginBasic onLoginSuccess={() => {
          window.location.reload();
        }} />
      </ThemeProvider>
    </StrictMode>
  )
} else {
  // Mostrar app
  root.render(
    <StrictMode>
      <ThemeProvider>
        <AppBasic />
      </ThemeProvider>
    </StrictMode>
  )
}

