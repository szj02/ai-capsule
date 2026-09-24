# AI Capsule — Cloud-Deployed AI Prompt Manager

A small full-stack app for saving and managing AI prompts, protected behind
GitHub OAuth + an application JWT. Built for CSE3CWA/CSE5006 Assignment 3.

## 1. Deployed application

- **Public URL:** `https://ai-capsule-2w8t.onrender.com`
- **Cloud platform used:** `Render (free Web Service tier)`

## 2. Tech stack

- **Frontend:** React (Vite), plain CSS, React Router
- **Backend:** Node.js + Express
- **Auth:** GitHub OAuth → Express issues its own application JWT
- **Session storage:** JWT in a `Secure, HttpOnly` cookie named `token`
- **Database:** SQLite (via `better-sqlite3`)

## 3. Project structure

ai-capsule/
├── server/
│ ├── index.js # Express app entry point, serves API + React build
│ ├── db.js # SQLite connection + schema
│ ├── auth.js # JWT sign/verify helpers + middleware
│ └── routes/
│ ├── auth.js # /auth/github, /auth/github/callback, /auth/me, /auth/logout
│ └── capsules.js # /api/capsules CRUD (all JWT-protected)
├── client/ # React app (Vite)
│ └── src/
│ ├── pages/Landing.jsx
│ ├── pages/Login.jsx
│ └── pages/Dashboard.jsx
├── .env.example
└── package.json


## 4. Running locally

### 4.1 Prerequisites
- Node.js 20.x
- A GitHub account (to register an OAuth App)

### 4.2 Create a GitHub OAuth App (for local dev)
1. Go to GitHub → Settings → Developer settings → OAuth Apps → **New OAuth App**.
2. Homepage URL: `http://localhost:3000`
3. Authorization callback URL: `http://localhost:3000/auth/github/callback`
4. Save the app, then generate a **Client Secret**.
5. Copy the Client ID and Client Secret.

### 4.3 Configure environment variables
```bash
cp .env.example .env
```
Fill in `.env`:

PORT=3000
JWT_SECRET=<a long random string>
GITHUB_CLIENT_ID=<from GitHub OAuth App>
GITHUB_CLIENT_SECRET=<from GitHub OAuth App>
GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback


### 4.4 Install and run
```bash
npm install              # installs backend deps + client deps (postinstall)
npm run build             # builds the React app into client/dist
npm start                 # starts Express on http://localhost:3000
```
Open `http://localhost:3000`.

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
- **Persistence:** Deployed on Render's free web service tier. The SQLite
  database file lives on the container's local filesystem, which is
  ephemeral — it is recreated empty after a restart or redeploy. This is
  acceptable per the assignment spec but means data is not durable across
  deploys long-term.

## 9. Required cURL checks

Run against the deployed URL:

```bash
# Test 1 - no authentication
curl -i https://ai-capsule-2w8t.onrender.com/api/capsules
```

HTTP/1.1 401 Unauthorized
Content-Type: application/json; charset=utf-8
{"error":"Unauthorized"}


```bash
# Test 2 - fake / invalid JWT
curl -i -H "Cookie: token=fake-token-123" https://ai-capsule-2w8t.onrender.com/api/capsules
```

HTTP/1.1 401 Unauthorized
Content-Type: application/json; charset=utf-8
{"error":"Unauthorized"}


## 10. Known limitation

SQLite storage is ephemeral on Render's free tier and resets on redeploy,
so capsule data isn't durable long-term without upgrading to a persistent
disk or managed Postgres.

## 11. AI-assisted development statement

- **AI tool(s) used:** Claude (Anthropic)

- **What it helped with:** Scaffolding the Express backend (routes, JWT
  middleware, GitHub OAuth flow), the React frontend (CRUD form and
  dashboard), the deployment configuration for Render, and troubleshooting
  build errors during deployment.

- **What I personally completed:** Set up and ran the project locally,
  created the GitHub OAuth Apps (dev and production), created the GitHub
  repository and pushed the code, created the Render account and
  configured the Web Service, set all environment variables, diagnosed and
  fixed two deployment failures by reading Render's build logs, ran and
  verified both required cURL checks against the deployed URL, and tested
  full CRUD and login manually in the browser.

- **One problem found and corrected in AI-generated code/config:** During
  deployment, the build failed with `vite: not found`. I had set
  `NODE_ENV=production` as an environment variable on Render, which caused
  npm to skip installing devDependencies (including `vite`, which builds
  the React app) when the build script ran `npm install` inside the
  client folder. I fixed this by changing the build script to
  `npm install --include=dev && npm run build`, forcing dev dependencies
  to install regardless of `NODE_ENV`.

- **How OAuth/JWT/protected API behaviour was verified:** Confirmed
  `GET /api/capsules` returns 401 with no cookie and with a fake cookie
  (`token=fake-token-123`), both locally and against the deployed URL,
  then confirmed it returns real data only after completing GitHub OAuth
  login.

- **How CRUD and ownership were verified:** Created, edited, and deleted
  capsule records through the deployed UI while signed in via GitHub,
  confirming each operation updates the correct record tied to my GitHub
  user ID.

- **One implementation/deployment decision I can explain:** Serving the
  built React frontend directly from the Express server (rather than
  hosting it separately) so the app and API share one origin, avoiding
  CORS and cross-origin cookie complications for the JWT auth cookie.