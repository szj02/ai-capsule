# AI Capsule — Cloud-Deployed AI Prompt Manager

A small full-stack app for saving and managing AI prompts, protected behind
GitHub OAuth + an application JWT. Built for CSE3CWA/CSE5006 Assignment 3.

> **TODO before you submit:** fill in every `[FILL IN]` below with your own
> real values, screenshots and cURL output. Do not leave placeholders in
> your final submission.

## 1. Deployed application

- **Public URL:** `[FILL IN — e.g. https://ai-capsule-yourname.onrender.com]`
- **Cloud platform used:** `[FILL IN — Render / Azure App Service / other]`

## 2. Tech stack

- **Frontend:** React (Vite), plain CSS, React Router
- **Backend:** Node.js + Express
- **Auth:** GitHub OAuth → Express issues its own application JWT
- **Session storage:** JWT in a `Secure, HttpOnly` cookie named `token`
- **Database:** SQLite (via `better-sqlite3`)

## 3. Project structure

```
ai-capsule/
├── server/
│   ├── index.js          # Express app entry point, serves API + React build
│   ├── db.js              # SQLite connection + schema
│   ├── auth.js             # JWT sign/verify helpers + middleware
│   └── routes/
│       ├── auth.js         # /auth/github, /auth/github/callback, /auth/me, /auth/logout
│       └── capsules.js     # /api/capsules CRUD (all JWT-protected)
├── client/                 # React app (Vite)
│   └── src/
│       ├── pages/Landing.jsx
│       ├── pages/Login.jsx
│       └── pages/Dashboard.jsx
├── .env.example
└── package.json
```

## 4. Running locally

### 4.1 Prerequisites
- Node.js 18+
- A GitHub account (to register an OAuth App)

### 4.2 Create a GitHub OAuth App (for local dev)
1. Go to GitHub → Settings → Developer settings → OAuth Apps → **New OAuth App**.
2. Homepage URL: `http://localhost:5000`
3. Authorization callback URL: `http://localhost:5000/auth/github/callback`
4. Save the app, then generate a **Client Secret**.
5. Copy the Client ID and Client Secret.

### 4.3 Configure environment variables
```bash
cp .env.example .env
```
Fill in `.env`:
```
JWT_SECRET=<a long random string>
GITHUB_CLIENT_ID=<from GitHub OAuth App>
GITHUB_CLIENT_SECRET=<from GitHub OAuth App>
GITHUB_CALLBACK_URL=http://localhost:5000/auth/github/callback
```

### 4.4 Install and run
```bash
npm install              # installs backend deps + client deps (postinstall)
npm run build             # builds the React app into client/dist
npm start                 # starts Express on http://localhost:5000
```
Open `http://localhost:5000`.

For frontend hot-reload during development, you can instead run the
backend and Vite dev server side by side:
```bash
npm run dev:server        # Express on :5000
npm run dev:client        # Vite dev server on :5173 (proxies /api and /auth to :5000)
```

## 5. API routes

| Route | Access | Purpose |
|---|---|---|
| `GET /` | Public | React landing page |
| `GET /login` | Public | React login page (starts OAuth) |
| `GET /dashboard` | Protected (client-side check via `/auth/me`) | User's records |
| `GET /api/health` | Public | `{ "status": "ok" }` |
| `GET /auth/github` | Public | Redirects to GitHub OAuth |
| `GET /auth/github/callback` | Public | OAuth callback, issues app JWT |
| `GET /auth/me` | Protected | Returns decoded JWT identity |
| `POST /auth/logout` | Public | Clears the `token` cookie |
| `GET /api/capsules` | Protected | Read own records |
| `POST /api/capsules` | Protected | Create own record |
| `PUT /api/capsules/:id` | Protected | Update own record |
| `DELETE /api/capsules/:id` | Protected | Delete own record |

The React frontend talks to Express purely over `fetch()` calls to these
same-origin paths (`/api/...`, `/auth/...`), with `credentials: 'include'`
so the browser sends the `token` cookie automatically. Because both the
frontend build and the API are served by the same Express app, there's no
CORS or cross-origin cookie configuration needed.

## 6. OAuth + JWT flow

1. User clicks **Sign in with GitHub** → browser goes to `GET /auth/github`.
2. Express redirects to GitHub's OAuth consent screen.
3. GitHub redirects back to `GET /auth/github/callback?code=...`.
4. Express exchanges the code for a GitHub access token, then fetches the
   GitHub profile (`/user`).
5. Express creates **its own application JWT** (`server/auth.js:generateToken`)
   containing `{ id, username, name }`, signed with `JWT_SECRET`. This is
   **not** the GitHub access token.
6. That JWT is set as a cookie named `token`, with `httpOnly: true`,
   `secure: true` (in production), `sameSite: 'lax'`.
7. Every request to `/api/capsules/*` runs through `verifyJWT` middleware
   (`server/auth.js`), which reads `req.cookies.token`, verifies it with
   `jsonwebtoken.verify`, and rejects with `401` if it's missing or invalid.
8. `req.user.id` (the GitHub user ID, from the verified JWT) is the only
   source of truth for record ownership — never taken from the client.

## 7. Environment variables

| Name | Purpose |
|---|---|
| `PORT` | Port Express listens on |
| `NODE_ENV` | `production` on the deployed app (enables `secure` cookies) |
| `JWT_SECRET` | Signs/verifies the application JWT |
| `GITHUB_CLIENT_ID` | GitHub OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App client secret |
| `GITHUB_CALLBACK_URL` | Must match the OAuth App's callback URL exactly |
| `DATABASE_PATH` | Path to the SQLite file |

No secret values are committed to this repository — see `.gitignore` and
`.env.example`.

## 8. Database & persistence

- SQLite via `better-sqlite3`. Schema created automatically on startup
  (`server/db.js`) if it doesn't already exist.
- `user_id` on every row is the GitHub user ID taken from the verified JWT.
- **Persistence:** `[FILL IN — e.g. "Deployed on Render's free web service,
  whose local filesystem is ephemeral: the SQLite file is recreated (empty)
  after a restart or redeploy. For this assignment that's acceptable per
  the spec, but it means data isn't durable across deploys." OR, if you
  used Render/Azure managed Postgres or a persistent disk, describe that
  instead.]`

## 9. Required cURL checks

Run these against your **deployed** URL before submitting, and paste the
actual output here (and show them live in the video):

```bash
# Test 1 - no authentication
curl -i https://YOUR-APP/api/capsules
```
```
[FILL IN — paste the actual response headers/status here, expect 401]
```

```bash
# Test 2 - fake / invalid JWT
curl -i -H "Cookie: token=fake-token-123" https://YOUR-APP/api/capsules
```
```
[FILL IN — paste the actual response headers/status here, expect 401]
```

## 10. Known limitation

`[FILL IN — one honest limitation, e.g. "SQLite storage is ephemeral on
Render's free tier and will reset on redeploy" or "Only GitHub OAuth is
implemented, no Google fallback" or similar.]`

## 11. AI-assisted development statement

- **AI tool(s) used:** `[FILL IN — e.g. Claude]`
- **What it helped with:** `[FILL IN — e.g. scaffolding the Express routes,
  the OAuth/JWT flow, the React CRUD form, this README structure]`
- **What I personally completed:** `[FILL IN — e.g. deployed to Render,
  created the GitHub OAuth App, configured environment variables, tested
  and fixed the callback URL, verified the cURL checks]`
- **One problem found and corrected in AI-generated code/config:**
  `[FILL IN — describe a real bug you hit and how you fixed it, e.g. "the
  callback URL didn't match between GitHub's OAuth App settings and
  GITHUB_CALLBACK_URL, causing a redirect_uri_mismatch error — fixed by
  making them match exactly, including trailing slashes."]`
- **How OAuth/JWT/protected API behaviour was verified:** `[FILL IN — e.g.
  "confirmed GET /api/capsules returns 401 with no cookie and with a fake
  cookie, then confirmed it returns data only after a real GitHub login"]`
- **How CRUD and ownership were verified:** `[FILL IN — e.g. "created
  records as one GitHub account, logged in as a second GitHub account, and
  confirmed the second account could not see, edit or delete the first
  account's records"]`
- **One implementation/deployment decision I can explain:** `[FILL IN —
  e.g. "chose to serve the React build directly from Express instead of a
  separate frontend host, to avoid CORS and cross-origin cookie issues"]`
