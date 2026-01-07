import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    {
      name: 'html-transform',
      transformIndexHtml(html) {
        if (process.env.NODE_ENV === 'production') {
          return [
            {
              tag: 'script',
              attrs: {
                defer: true,
                src: 'https://51.210.6.50:3010/script.js',
                'data-website-id': '472a48fd-8c86-4a48-8cbf-3b816f37c944'
              },
              injectTo: 'head'
            }
          ];
        }
      }
    }
  ],
  server: {
    port: 3006,
    strictPort: true
  },
  preview: {
    port: 3006,
    strictPort: true
  }
})
