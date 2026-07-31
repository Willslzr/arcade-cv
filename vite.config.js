import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],

  resolve: {
    alias: {
      // Imports absolutos: '@/game/core/Engine.js' en vez de
      // cadenas de '../../..' que se rompen al mover ficheros.
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // El motor se separa de la UI: si sólo cambia el CV, el
        // navegador conserva el bundle del juego en caché.
        manualChunks(id) {
          if (id.includes('/src/game/')) return 'game'
        },
      },
    },
  },

  server: {
    // `vercel dev` levanta las funciones en el 3000; en desarrollo
    // suelto se redirige /api hacia allí para no tocar el código.
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
