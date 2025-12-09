import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Permite acesso de outros dispositivos na rede
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Separar node_modules em chunks específicos
          if (id.includes('node_modules')) {
            // React core (menor) - jsx runtime
            if (id.includes('react/jsx-runtime') || id.includes('react/jsx-dev-runtime')) {
              return 'react-core';
            }
            
            // React DOM separado do React
            if (id.includes('react-dom')) {
              return 'react-dom-vendor';
            }
            
            // React principal
            if (id.includes('/react/') && !id.includes('react-dom') && !id.includes('jsx-runtime')) {
              return 'react-vendor';
            }
            
            // Scheduler (usado pelo React)
            if (id.includes('scheduler')) {
              return 'react-scheduler';
            }
            
            // React Icons (pode ser grande)
            if (id.includes('react-icons')) {
              return 'react-icons-vendor';
            }
            
            // Bibliotecas de PDF e canvas (carregar apenas quando necessário)
            if (id.includes('html2canvas') || id.includes('jspdf')) {
              return 'pdf-vendor';
            }
            
            // Recharts (gráficos)
            if (id.includes('recharts')) {
              return 'charts-vendor';
            }
            
            // Axios
            if (id.includes('axios')) {
              return 'axios-vendor';
            }
            
            // Outras dependências grandes
            return 'vendor';
          }
          
          // Separar componentes grandes da aplicação
          if (id.includes('components/AdminPanel') || id.includes('components/Gerenciamento')) {
            return 'admin-components';
          }
          
          if (id.includes('components/LandingPage')) {
            return 'landing-page';
          }
          
          if (id.includes('components/TutorialOnboarding')) {
            return 'tutorial';
          }
          
          if (id.includes('components/PainelAdmin')) {
            return 'painel-admin';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1200, // Aumentar para 1.2MB - React é naturalmente grande (~1.4MB)
  },
})
