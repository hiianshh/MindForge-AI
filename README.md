# MindForge AI

MindForge turns a curious read into a short speaking practice, then gives structured, evidence-based feedback on comprehension, vocabulary, grammar, and fluency.

## Requirements

- Node.js 18 or newer and npm
- A Google AI Studio API key
- MongoDB, local or hosted, for persistent session history

## Setup

1. Install dependencies from the repository root: `npm install`.
2. Copy `server/.env.example` to `server/.env` and set `GEMINI_API_KEY`. Set `MONGO_URI` to your MongoDB connection string to enable history. The default model is `gemini-3.5-flash-lite`; choose a model available to your AI Studio project with `GEMINI_MODEL`.
3. Start both apps with `npm run dev` from the repository root.
4. Open `http://localhost:5173`.

The client runs on port 5173 and the API on port 4000. Set `CLIENT_ORIGIN` if the client uses a different origin. For a separately hosted API, set `VITE_API_URL` in the client build environment.

Speech recognition requires a supported browser and microphone permission. Live Web Speech transcription stays in the browser. If its network service is unavailable, the MediaRecorder fallback holds audio locally and sends it to Gemini only when you submit; MongoDB stores the resulting transcript, not the audio. Manual transcript entry remains available. Pronunciation and vocal delivery cannot be judged from transcript text. History is partitioned by a random browser-local identifier; it is not account authentication, so add an authentication layer before storing sensitive production data.

If MongoDB is unavailable, passage generation and evaluation still work; the history API reports that persistence is offline. A successful evaluation is shown even when MongoDB cannot save it.

## Production build

Run `npm run build` from the repository root to verify the static client build. Vercel serves the built client and Express API from the same origin.

## Deploy to Vercel

This repository includes `vercel.json`: Vercel builds the Vite client into `client/dist` and routes `/api/*` requests to the Express function in `api/[...path].js`.

1. Push the repository to a Git provider and import it in Vercel. Keep the project root set to the repository root (not `client/` or `server/`).
2. In **Project Settings → Environment Variables**, add `GEMINI_API_KEY` and `MONGO_URI` for Production (and Preview if needed). Do not add the local key to Git or set `VITE_API_URL` to localhost. The client uses same-origin `/api` routes.
3. Ensure the MongoDB deployment accepts connections from Vercel, or use an appropriate secured network integration. Set `GEMINI_MODEL` if you need a model other than the default.
4. Deploy from Vercel or push a commit to the connected Git branch. Verify `/api/health` on the deployment; it should report `aiConfigured: true` and `database: "connected"`.

Vercel Functions have a request-body size ceiling, so the audio-to-transcription fallback is capped at 3 MB. Browser live speech recognition and manual transcript entry are unaffected.