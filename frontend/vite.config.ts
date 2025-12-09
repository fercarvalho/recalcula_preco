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
            if (id.includes('react') || id.includes('react-dom')) {
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
            
            // Outras dependências
            return 'vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Aumentar o limite de aviso para 1MB
  },
})
