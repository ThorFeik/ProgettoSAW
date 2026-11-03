/* Service worker personalizzato (vite-plugin-pwa, strategia injectManifest) */
import { clientsClaim } from 'workbox-core'
import { cleanupOutdatedCaches, createHandlerBoundToURL, matchPrecache, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute, setCatchHandler } from 'workbox-routing'

// Aggiornamento automatico: la nuova versione prende subito il controllo
self.skipWaiting()
clientsClaim()

// Precaching: tutti i file della build (elenco iniettato da vite-plugin-pwa)
cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

// App shell: ogni navigazione serve index.html dalla cache (single page application)
registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html')))

// Pagina offline di fallback: se una navigazione fallisce si mostra offline.html (precachata)
setCatchHandler(async ({ request }) => {
  if (request.destination === 'document') {
    return (await matchPrecache('/offline.html')) || Response.error()
  }
  return Response.error()
})

// Clic su una notifica: porta in primo piano l'app (o la apre se è chiusa)
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      for (const client of windows) {
        if ('focus' in client) return client.focus()
      }
      return self.clients.openWindow('/')
    })()
  )
})
