import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'offline.html'],
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
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        // Se la pagina non è in cache e manca la rete, mostra la pagina offline
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,svg,png}']
      }
    })
  ]
})
