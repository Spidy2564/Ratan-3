import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  build: {
    // Optimize production build
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          wallet: ['ethers', '@walletconnect/sign-client'],
          router: ['react-router-dom']
        }
      }
    },
    // Reduce chunk size warnings
    chunkSizeWarningLimit: 1000,
    // Enable source maps for debugging
    sourcemap: false
  },
  define: {
    global: 'globalThis',
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  }
})
