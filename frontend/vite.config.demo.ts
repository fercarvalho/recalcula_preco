import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuração específica para build demo do GitHub Pages
export default defineConfig({
  plugins: [react()],
  base: '/recalcula_preco/',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './index-demo.html',
      },
      output: {
        manualChunks: (id) => {
          // Separar node_modules em chunks específicos
          if (id.includes('node_modules')) {
            if (id.includes('react/jsx-runtime') || id.includes('react/jsx-dev-runtime')) {
              return 'react-core';
            }
            if (id.includes('react-dom')) {
              return 'react-dom-vendor';
            }
            if (id.includes('/react/') && !id.includes('react-dom') && !id.includes('jsx-runtime')) {
              return 'react-vendor';
            }
            if (id.includes('scheduler')) {
              return 'react-scheduler';
            }
            if (id.includes('react-icons')) {
              return 'react-icons-vendor';
            }
            if (id.includes('html2canvas') || id.includes('jspdf')) {
              return 'pdf-vendor';
            }
            if (id.includes('recharts')) {
              return 'charts-vendor';
            }
            if (id.includes('axios')) {
              return 'axios-vendor';
            }
            return 'vendor';
          }
          
          // Separar componentes demo
          if (id.includes('components/') && (id.includes('Demo') || id.includes('Basic'))) {
            return 'demo-components';
          }
        },
      },
    },
    chunkSizeWarningLimit: 2000,
  },
})

