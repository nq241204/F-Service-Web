import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  },
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress warnings about dynamic imports
        if (warning.code === 'DYNAMIC_IMPORT') {
          return;
        }
        // Suppress warnings about eval
        if (warning.code === 'EVAL') {
          return;
        }
        warn(warning);
      }
    }
  }
})
