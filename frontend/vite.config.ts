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
            // React e React DOM juntos
            if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
              return 'react-vendor';
            }
            
            // React Icons (pode ser grande)
            if (id.includes('react-icons')) {
              return 'react-icons-vendor';
            }
            
            // Bibliotecas de PDF e canvas
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
            if (id.includes('node_modules')) {
              return 'vendor';
            }
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
        },
      },
    },
    chunkSizeWarningLimit: 600, // Reduzir para 600KB para manter avisos úteis
  },
})
