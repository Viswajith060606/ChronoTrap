// sw.js - The Persistence Engine
const STEALTH_TOKEN = "delta-v-882-alpha";

self.addEventListener('install', (event) => {
    self.skipWaiting(); // Force activation
    console.log("[sw] Persistence Engine Installed.");
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
    console.log("[sw] Persistence Engine Active.");
});

// Listen for the "Start Persistence" command from the main page
self.addEventListener('message', (event) => {
    if (event.data.type === 'INIT_PERSISTENCE') {
        const payload = event.data.payload;
        
        // Start a background loop that survives tab closure
        setInterval(async () => {
            // In a real scenario, we would use a sync-event or 
            // periodic-sync, but for this POC, a robust loop works.
            try {
                // Background exfiltration logic would go here
                // Note: Service Workers cannot access the Camera directly
                // So we use this to "Heartbeat" or exfiltrate cached data
                console.log("[sw] Background Heartbeat Sent.");
            } catch (e) {}
        }, 30000);
    }
});
