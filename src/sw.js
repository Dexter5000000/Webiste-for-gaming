import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { StaleWhileRevalidate } from 'workbox-strategies'

// Precache the shell
cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

// Cache static assets
registerRoute(
  ({ request }) => request.destination === 'script' ||
                   request.destination === 'style' ||
                   request.destination === 'image',
  new StaleWhileRevalidate({
    cacheName: 'static-resources',
  })
)

registerRoute(
  ({ url }) => url.pathname.startsWith('/assets/'),
  new StaleWhileRevalidate({
    cacheName: 'instrument-assets',
  })
)

// Handle offline fallback for navigation
registerRoute(
  ({ request }) => request.mode === 'navigate',
  async ({ event }) => {
    try {
      return await fetch(event.request)
    } catch (error) {
      const cached = await caches.match('/index.html')
      return cached || new Response('Offline', { status: 503 })
    }
  }
)