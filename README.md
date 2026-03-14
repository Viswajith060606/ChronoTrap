🚀 ChronoTrap C2: Render Deployment Edition
Project Overview: > A high-fidelity Proof-of-Concept (PoC) demonstrating the dangers of Social Engineering and Permission Over-privileging on modern mobile OS (iOS/Android).

The Pretext: > An "AI Age Predictor" that lures users into granting Camera and GPS access.

Technical Features:

Encryption: Full AES-256-GCM authenticated encryption for all exfiltrated biometric data.

Evasion: Payload masking using a GIF-header injection to bypass basic network inspection.

Persistence: Background Service Worker (PWA) heartbeat to maintain a connection even if the browser tab is minimized.

Infrastructure: Cloud-native Node.js backend deployed on Render with automated SSL termination.

C2 Integration: Real-time data exfiltration via secure Discord Webhooks.

🛡️ Why it's on Render
Automatic HTTPS: Ensures the "Handshake" works by providing a trusted SSL certificate (required for Camera/GPS access).

Persistent Logs: Allows us to monitor the exfiltration "tunnel" live during the seminar.

⚠️ Educational Disclaimer
This project is built strictly for educational purposes. It is designed to show that hardware security (like Apple's sandbox) cannot protect a user who is tricked into granting permissions via Social Engineering.
