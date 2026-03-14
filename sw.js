// sw.js
self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()));

self.addEventListener('message', (event) => {
    if (event.data.type === 'INIT_PERSISTENCE') {
        setInterval(() => {
            fetch('/heartbeat', { 
                method: 'HEAD', 
                headers: { 'X-Neural-Token': 'delta-v-882-alpha' } 
            }).catch(() => {});
        }, 60000);
    }
});
