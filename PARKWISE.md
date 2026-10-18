# ParkWise — The Silent Gate (MVP)

Frictionless campus parking MVP with **Zalo Mini App** UX and an **RFID/MQTT** gate backend.

> This lives alongside the existing ParkEase Next.js app (`/src`, `/server`).  
> ParkWise packages: `/backend` + `/zalo-miniapp`.

## Architecture

```
Zalo Mini App (React + ZMP-style UI)
        │  HTTPS REST + Socket.io
        ▼
Node / Express API  (:5050)
        │
        ├── Prisma + SQLite  (backend/prisma/dev.db)
        ├── Socket.io        (real-time gate notifications)
        └── MQTT.js          (RFID readers / gate commands)
                 │
                 ▼
         Gate hardware (mocked in MVP)
```

## Killer features

1. **Kill-Switch** — lock vehicle → backend ignores RFID MQTT for that tag  
2. **Guest Pass** — time-limited QR + validate endpoint  
3. **Zone Memory** — save/display parked location  
4. **Night-Owl Safe Ride** — geolocation tracking link (force demo anytime)

## Quick start

### 1) Backend

```bash
cd backend
npm install          # also runs prisma generate
npx prisma db push   # create/sync SQLite schema
npm run db:seed      # seed demo vehicle veh_001
npm run dev
```

API: http://localhost:5050  
Health: http://localhost:5050/api/health

### 2) Edit database (Prisma Studio)

```bash
# from repo root
npm run parkwise:db

# or
cd backend && npm run db:studio
```

Opens Prisma Studio (default http://localhost:5555) for Vehicle / GuestPass / Event tables.

### 3) Zalo Mini App (local simulator)

```bash
cd zalo-miniapp
npm install
npm run dev
```

Open: http://localhost:5173

### 4) Simulate RFID hardware

With backend running (`MOCK_MQTT=true` by default):

```bash
cd backend
npm run simulate:rfid
# or
npm run simulate:rfid -- EXIT
npm run simulate:rfid -- ENTRY RFID-A1B2C3
```

Or via curl:

```bash
curl -X POST http://localhost:5050/api/simulate/rfid \
  -H 'Content-Type: application/json' \
  -d '{"rfidTag":"RFID-A1B2C3","direction":"ENTRY"}'
```

### 5) Real Mosquitto (optional)

```bash
# terminal A — broker
mosquitto

# backend/.env
MOCK_MQTT=false
MQTT_URL=mqtt://127.0.0.1:1883

# terminal B — publish RFID
mosquitto_pub -h 127.0.0.1 -t parking/gate/entry \
  -m '{"rfidTag":"RFID-A1B2C3"}'
```

## Demo vehicle (seed)

| Field | Value |
|-------|-------|
| vehicleId | `veh_001` |
| plate | `59X1-12345` |
| rfidTag | `RFID-A1B2C3` |
| zaloUserId | `zalo_demo_001` |

Re-seed anytime: `npm run parkwise:seed` (or `cd backend && npm run db:seed`).

## Key API routes

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/me` | Current vehicle + zone memory |
| POST | `/api/lock-vehicle` | Kill-Switch `{ vehicleId, locked }` |
| POST | `/api/save-zone` | Zone Memory `{ zone, row, note }` |
| POST | `/api/generate-guest-pass` | Create QR guest pass |
| POST | `/api/validate-guest-pass` | Gate validates `{ code }` |
| POST | `/api/safe-ride/start` | Night-Owl tracking link |
| POST | `/api/simulate/rfid` | Mock hardware trigger |

## Kill-Switch test script

1. Open Mini App → toggle **Lock** ON  
2. Run `npm run simulate:rfid` in `/backend`  
3. Mini App feed shows `RFID_IGNORED_LOCKED` (gate does **not** open)  
4. Unlock → simulate again → `VEHICLE_ENTERED` / gate command published  

## Project layout

```
backend/
  server.js
  prisma/schema.prisma
  prisma/seed.js
  prisma/dev.db           # local SQLite (gitignored)
  src/mqttService.js
  src/socketService.js
  src/db.js               # Prisma client + helpers
  src/routes/api.js
  scripts/simulate-rfid.js

zalo-miniapp/
  src/components/Dashboard.jsx
  src/components/zmp/*          # ZMP UI stand-ins
  src/lib/api.js
  src/lib/socket.js
```

## Notes

- Persistence is **Prisma + SQLite** (`DATABASE_URL=file:./dev.db`). Use Prisma Studio to browse/edit rows.  
- ZMP UI is simulated with local components styled like Zalo Mini App chrome — swap for real `zmp-ui` when deploying to Zalo.  
- Socket rooms are keyed by `zaloUserId` for per-user gate alerts.
