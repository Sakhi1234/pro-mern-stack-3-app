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

## Server rendering

The UI now runs through a Node/Express server. Direct requests to `/about`
(including a reload) fetch `/api/about` and `/api/user` on the server in parallel,
forwarding the incoming cookie to the configured API. The response includes
the populated React HTML, extracted MUI/Emotion styles, and escaped bootstrap
JSON containing only the public UI data. The browser hydrates this HTML without
repeating those initial API requests. Subsequent client-side visits fetch fresh
About data.

Direct `/issues` requests similarly load the user and issue list in parallel.
The same query parser is used by server and browser requests for `status`,
`effortMin`, `effortMax`, and `page`. Issue rows, filter values, and pagination
are included in the initial HTML. Hydration skips the initial list/user requests;
changing filters/pages, returning with browser Back, or revisiting the route
fetches fresh data in the browser. Issue dates are revived from ISO strings on
both sides. Creation dates use the viewer's browser timezone. Server HTML and
the first hydration render use UTC, then React updates timestamps to the browser
timezone without fetching data again. A UTC timestamp near midnight can therefore
briefly show a different day until hydration completes.

All page routes now support server rendering on direct loads:

| Route         | Initial rendered content                                     |
| ------------- | ------------------------------------------------------------ |
| `/issues`     | Filtered/paginated issue list                                |
| `/issues/:id` | Selected issue description and existing comments             |
| `/edit/:id`   | Populated issue form and existing comments                   |
| `/create`     | Empty form with one server-generated draft and date defaults |
| `/report`     | Owner/status counts for the URL filters                      |
| `/about`      | About/API version message                                    |

Route definitions are shared between the UI server and client router.
Each page declares a `fetchData({ get, url, params })` function for its initial
SSR data. `ui/src/entry-server.jsx` matches the shared component-bearing routes
in `ui/src/routes/routes.js`, then calls the matched page's loader and
`Page.fetchData()` (the current user) in parallel. The `get` helper is created
for each request and forwards only that request's cookies to the API. Wrapped
pages expose their loader on the exported toast wrapper as well.

The server entry renders with the existing request-specific providers and
returns HTML, Emotion styles, initial data, and HTTP status to Express.
`ui/server/renderDocument.js` inserts those results into the HTML template and
safely serializes the initial data for hydration. Express handles HTTP responses,
redirects, and proxying; it does not import React page components directly.
There is no separate route metadata file or central page-loading switch.

`/` returns a 301 redirect to `/issues`. Unknown routes and missing or invalid
issue IDs return a rendered HTTP 404 page. Initial data loading failures return
HTTP 503. Creation, updates, comments, deletion/restoration, and AI summaries
remain explicit browser-triggered API operations; rendering never performs a
mutation or generates an AI summary.

After a successful creation, the browser opens `/issues/:id`, showing the saved
issue's number, title, description, and comments. A success notification appears
on that destination page. The submitted create form is replaced in browser
history, and the notification is consumed so refresh or Back does not replay it.

The Created field in edit/create forms and comment timestamps also switch to
the browser timezone after hydration. Comments include a timezone abbreviation
or offset. `useTimeZone()` uses React's `useSyncExternalStore` server snapshot
to keep the initial browser render identical to server output. Due dates remain
calendar dates, using the UTC calendar day consistently with their `yyyy-mm-dd`
input and parsing. Draft dates are serialized with the create page so hydration
does not generate a new timestamp. For example, a creation timestamp of
`2026-11-15T18:43:26.397Z` displays as **Mon Nov 16 2026** in IST after hydration.
New drafts default Due to the viewer's calendar day plus ten calendar days,
represented as midnight UTC for the API. The server supplies a UTC draft for
hydration; the browser adjusts its untouched default to the local calendar day.
Focusing or editing Due preserves that value, including a cleared date. Display,
input, and submission use the same calendar date. Existing saved due timestamps
are not migrated automatically.

The list card's disabled Create Issue button uses the same arrow tooltip as the
navbar: **Sign in to create an issue** for anonymous users, and **Create a new
issue** for signed-in users. Both disabled buttons have a span wrapper so mouse
hover can reach the tooltip.

The existing commands still apply:

```bash
npm run dev
npm run build
npm run preview
```

Development defaults to port 9000; production preview defaults to port 4173.
Build output is now split into `ui/dist/client` and `ui/dist/server`. Production
requires the UI Node service, not just static hosting. Keep the API running in
another terminal. To use a different API origin, set the server-only environment
variable `UI_SERVER_API_ORIGIN` (default: `http://localhost:3000`) in the shell
that launches the UI. This variable is not read from Vite's `.env` files.

For a separate verification preview:

```bash
npm --prefix ui run preview -- --port 4174
```

Verify `/about` by checking **View Page Source**: `Issue Tracker API v2.0`
should be present inside the page markup, alongside `data-emotion` style tags
and the `initial-data` JSON script. On a direct load, the browser Network panel
should show no `/api/about` or `/api/user` request. Check Console for hydration
errors and verify Issue List navigation and returning to About still work.
For `/issues`, check that actual issue titles and dates are in **View Page
Source**, including when opening a filtered/paginated URL directly. A direct
load should show no browser `/api/issues` or `/api/user` request. Changing a
filter or page after hydration should issue a browser request and update the
rows. The local database may have only one page.

For detail/edit/report/create pages, the initial markup should similarly contain
their content/form values, with no duplicate browser user or page-data request
during hydration. Verify comments, form input, client navigation, and report
filters after hydration as well.

If the API cannot supply the initial data, the SSR route returns HTTP 503.
Personalized HTML uses `Cache-Control: private, no-store`.

The before-SSR measurements and comparison procedure are recorded in
[the performance baseline](docs/ssr-performance-baseline.md). Repeat three
production reloads with the same throttling, cache, CPU, and viewport settings
before claiming a performance improvement.

## Local API Proxy

The UI Express server proxies `/api` and `/auth` to the configured API origin,
so browser requests stay same-origin in development and production preview.
API connection failures return HTTP 502 before response headers are sent. If an
API response is interrupted after headers, the browser connection is closed
instead of left waiting. Browser disconnects cancel the upstream API request.

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
