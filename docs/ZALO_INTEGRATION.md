# Zalo integration

Theo [Zalo Mini App CLI](https://docs.zaloplatforms.com/docs/MA/devtools/cli/intro) và [convert Web App → Mini App](https://docs.zaloplatforms.com/docs/MA/intro/getting-started/convert-web-app-to-mini-app).

## Current status

| Layer | Status |
|-------|--------|
| Browser / zmp-cli shell | **Ready** — `frontend/zalo-miniapp` |
| Mini App API (demo) | **Ready** — `backend/parkwise-sqlite` (:5050) |
| `app-config.json` + `#app` + Vite ZMP build | **Done** |
| Official Mini App ID / OA / ZNS | **Needs your credentials** |

Student web UI remains Next.js (`frontend/` → Mongo `backend/` :4000).

## Quick start (CLI)

```bash
npm install -g zmp-cli

# API
npm run parkwise:seed
npm run parkwise:sqlite

# Mini App
cd frontend/zalo-miniapp
cp .env.example .env   # điền APP_ID từ mini.zalo.me
npm install
zmp login              # QR Zalo
zmp init               # Use ZMP to deploy only
npm run zmp:start      # hoặc npm run zmp:device
# sau khi ổn:
npm run zmp:deploy
```

Chi tiết: `frontend/zalo-miniapp/README.md`.

## Production credentials (later)

`backend/.env`:

- `ZALO_APP_ID`, `ZALO_APP_SECRET`, `ZALO_MINI_APP_ID`, `ZALO_OA_ID`
- Server-side verify access token + `appsecret_proof` — never trust client-only Zalo IDs

Until then, Admin → Integrations stays `NOT_CONFIGURED` / `DEMO`.
