import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Service worker scritto da noi in src/sw.js (cache, pagina offline, notifiche)
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      includeAssets: ['icon.svg', 'offline.html'],
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png}']
      },
      manifest: {
        name: 'Studio Dentistico – Gestionale',
        short_name: 'Studio',
        description: 'Gestione pazienti e appuntamenti dello studio dentistico',
        lang: 'it',
        theme_color: '#14505c',
        background_color: '#f4f8f8',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'iconv2-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'iconv2-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'iconv2-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      }
    })
  ]
})
