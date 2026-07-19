# pro-mern-stack-3-app

Migrated from `pro-mern-stack-2` to a modern stack:

- Frontend: React 19 + Vite + MUI + react-router-dom
- Backend: Express REST API + MongoDB

## Requirements

- Node.js 20+
- npm
- MongoDB running locally or reachable by `DB_URL`

## Local Setup

You need two terminal windows when running locally:

- Terminal 1: UI (`npm run dev`)
- Terminal 2: API (`npm run api:dev`)

The frontend and backend are separate processes, so both must be running for the app to work end to end.

## Frontend setup

1. Copy `.env.example` to `.env` and update values if needed.
2. Install deps: `npm install`
3. Run UI: `npm run dev`

## API setup

1. Copy `api/sample.env` to `api/.env`
2. Install API deps: `npm --prefix api install`
3. Run API: `npm run api:dev`

API runs on `http://localhost:3000`.
REST base endpoint: `http://localhost:3000/api`
Auth endpoint: `http://localhost:3000/auth`

## AI-assisted issue summaries

- Add `GROQ_API_KEY` in `api/.env` to enable AI summarization.
- Optional: set `GROQ_MODEL` (default `llama-3.1-8b-instant`).
- Open an issue and use **Summarize with AI** to generate a concise summary of the issue and its comments.

## CORS and local dev

- Vite proxies `/api` and `/auth` to backend, so browser requests stay same-origin in local dev.
- Backend CORS is enabled with credentials and preflight handling for the configured `UI_SERVER_ORIGIN`.

## Notes

- Use the custom account form to create an account with name, email, and password.
- Passport local auth verifies those credentials on sign in.
- `COOKIE_DOMAIN` is optional and usually not needed for local development on `localhost`.
- Set `JWT_SECRET` in `api/.env` for production. The API uses a temporary dev secret only when `JWT_SECRET` is missing outside production.
