# Zalo integration

Theo [Zalo Mini App CLI](https://docs.zaloplatforms.com/docs/MA/devtools/cli/intro) và [convert Web App → Mini App](https://docs.zaloplatforms.com/docs/MA/intro/getting-started/convert-web-app-to-mini-app).

## Current status

| Layer | Status |
|-------|--------|
| Browser / zmp-cli shell | **Ready** — `frontend/zalo-miniapp` |
| Shared API | **Ready** — `backend/` Mongo Express **:4000** (same as web) |
| Linked demo user | **Ready** — `22040002` / phone `84898466842` / `zalo_demo_001` |
| `app-config.json` + `#app` + Vite ZMP build | **Done** |
| Official Mini App ID / OA / ZNS | **Needs your credentials** |
| Public domain | Point Cloudflare tunnel → `:4000` (`npm run parkwise:tunnel:setup -- api.yourdomain.com`) |

Web + Mini App share one User store (JWT). Mini App login: `POST /api/auth/phone-login`.

## Quick start (CLI)

```bash
npm install -g zmp-cli

# Shared API + seed (Mongo)
npm run seed
npm run dev:backend

# Mini App
cd frontend/zalo-miniapp
cp .env.example .env   # VITE_API_URL=http://localhost:4000 + APP_ID
npm install
zmp login              # QR Zalo
zmp init               # Use ZMP to deploy only
npm run zmp:start      # hoặc npm run zmp:device
# Phone + HTTPS tunnel (domain):
npm run parkwise:zalo
npm run zmp:deploy
```

Chi tiết: `frontend/zalo-miniapp/README.md`.

## Production credentials

`backend/.env`:

- `ZALO_APP_ID`, `ZALO_APP_SECRET`, `ZALO_MINI_APP_ID`, `ZALO_OA_ID`
- Server-side phone exchange via Graph API — never trust client-only Zalo IDs

Until then, Admin → Integrations stays `NOT_CONFIGURED` / `DEMO`.
