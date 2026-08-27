# pro-mern-stack-3-app

This project is split into two app packages:

- `ui/`: React 19 + Vite + MUI frontend
- `api/`: Express REST API + MongoDB backend

## Requirements

- Node.js 20+
- npm
- MongoDB running locally or reachable by `DB_URL`

## Local Setup

Run the API and UI in separate terminal windows.

### API

```bash
cd api
cp sample.env .env
npm install
npm run dev
```

API runs on `http://localhost:3000`.
REST base endpoint: `http://localhost:3000/api`.
Auth endpoint: `http://localhost:3000/auth`.

For Google sign-in, set these values in `api/.env`:

```bash
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

In Google Cloud Console, add this authorized redirect URI:

```text
http://localhost:3000/auth/google/callback
```

### UI

```bash
cd ui
cp .env.example .env
npm install
npm run dev
```

UI runs on `http://localhost:9000`.

## Local API Proxy

The UI Vite dev server proxies `/api` and `/auth` to `http://localhost:3000`, so browser requests stay same-origin in local development.

The API also enables credentialed CORS for `UI_SERVER_ORIGIN`, which defaults to `http://localhost:9000`.

## Auth

- Users sign in with Google.
- Passport Google OAuth verifies the Google account.
- The API stores the app JWT in an HTTP-only cookie named `jwt`.
- `COOKIE_DOMAIN` is optional and usually not needed for local development on `localhost`.
- Set `JWT_SECRET` in `api/.env` for production.

## AI-Assisted Issue Summaries

- Add `GROQ_API_KEY` in `api/.env` to enable AI summarization.
- Optional: set `GROQ_MODEL`, which defaults to `llama-3.1-8b-instant`.
- Open an issue and use **Summarize with AI** to generate a concise summary of the issue and its comments.

## Useful Commands

From `api/`:

```bash
npm run dev
npm run start
```

From `ui/`:

```bash
npm run dev
npm run lint
npm run build
npm run preview
```
