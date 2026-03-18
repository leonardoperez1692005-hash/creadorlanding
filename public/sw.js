// =============================================
// BrandVortix Pol — Service Worker
// =============================================
// ONLY handles push notifications.
// NO fetch handler — iOS PWA compatibility + Next.js handles caching.

self.addEventListener('push', function (event) {
    if (!event.data) return

    try {
        var data = event.data.json()
        var options = {
            body: data.body || '',
            icon: '/logo.png',
            badge: '/logo.png',
            data: { url: data.url || '/dashboard' },
            tag: data.tag || 'brandvortix-notification',
            renotify: true,
        }
        event.waitUntil(self.registration.showNotification(data.title || 'BrandVortix', options))
    } catch (e) {
        // Fallback for plain text
        event.waitUntil(
            self.registration.showNotification('BrandVortix', {
                body: event.data.text(),
                icon: '/logo.png',
            }),
        )
    }
})

self.addEventListener('notificationclick', function (event) {
    event.notification.close()
    var url = (event.notification.data && event.notification.data.url) || '/dashboard'

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (windowClients) {
            // Focus existing tab if open
            for (var i = 0; i < windowClients.length; i++) {
                var client = windowClients[i]
                if (client.url.indexOf(url) >= 0 && 'focus' in client) {
                    return client.focus()
                }
            }
            // Open new tab
            if (clients.openWindow) {
                return clients.openWindow(url)
            }
        }),
    )
})
