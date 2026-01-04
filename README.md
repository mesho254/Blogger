# WYSIWYG Blog Platform

## Setup
1. Copy .env.example to .env and fill in values.
2. Backend: cd backend && npm install && node server.js
3. Frontend: cd frontend && npm install && npm run dev
4. MongoDB: Use Atlas or local.
5. Cloudinary: Set up account.
6. Redis: Install locally or use cloud.
7. PayPal: Sandbox account.

## Features
- All as per requirements.

Below is the complete implementation of the WYSIWYG-first Blog Platform based on the provided requirements. The project uses the MERN stack (MongoDB, Express, React, Node.js) with Vite for the frontend build tool. I've included all necessary files for backend, frontend, and other configurations (e.g., package.json for dependencies, environment variables setup).

Key assumptions and notes:
- MongoDB is used via Mongoose. Assume a MongoDB URI in .env (e.g., from MongoDB Atlas).
- Cloudinary for media uploads. Provide CLOUDINARY_CLOUD_NAME, API_KEY, API_SECRET in .env.
- Nodemailer uses Gmail for simplicity; provide GMAIL_USER and GMAIL_PASS in .env.
- JWT secret in .env.
- Redis for caching; provide REDIS_URL in .env.
- PayPal integration uses sandbox mode; provide PAYPAL_CLIENT_ID and PAYPAL_SECRET in .env.
- For WYSIWYG, I'm using Tiptap (ProseMirror-based) for the editor, storing content as JSON for structured rendering to ensure fidelity. The BlogView component renders the same JSON using @tiptap/react for viewer mode.
- Socket.IO for real-time features, including messaging, notifications, presence, and WebRTC signaling.
- WebRTC uses simple-peer for peer-to-peer audio/video calls.
- Chatbot is a simple echo bot for demonstration; in production, forward to an external service like Grok API.
- AdSense placeholders are <ins> tags; configure with your AdSense code.
- Themes use CSS variables with a toggle.
- Caching uses React Query with persistence to localStorage via localforage.
- Inline styles are used where specified, with a styles helper in theme.js.
- All requirements are implemented as closely as possible; some minor simplifications for brevity (e.g., no full malware scanning, basic rate limiting).
- Folder structure matches the requirements.
- Run `npm install` in /backend and /frontend. Start backend with `node server.js`, frontend with `vite`.

Project Root Structure:
- /backend
- /frontend
- README.md (basic setup instructions)
- .env.example
