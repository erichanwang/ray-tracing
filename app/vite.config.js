import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three/')) return 'three'
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) return 'react-vendor'
          if (id.includes('node_modules/@react-three/')) return 'r3f-vendor'
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
})
