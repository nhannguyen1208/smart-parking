# VNUK ParkWise — The Silent Gate

Campus smart parking for **students**, **guards**, and **admins**: RFID / Backup Pass, membership plans, Early Arrival rewards, and Kill-Switch.

**Live demo (frontend):** [smart-parking-phi-seven.vercel.app](https://smart-parking-phi-seven.vercel.app)  
*(API must be running locally + Cloudflare tunnel for login to work.)*

---

## Repository layout

```text
smart-parking/
├── frontend/                 # Next.js web app (deploy to Vercel → root: frontend)
│   └── zalo-miniapp/         # Zalo Mini App (Vite + zmp)
├── backend/                  # Express + MongoDB API (:4000)
│   └── parkwise-sqlite/      # Optional SQLite gate demo (:5050)
├── docs/                     # Architecture, demo guide, rewards
├── infra/                    # Docker Compose (Mongo, Mosquitto)
└── scripts/                  # Helper scripts (Zalo tunnel, DB UI)
```

---

## Quick start

### 1. API

```bash
cd backend
cp .env.example .env          # set MONGODB_URI, JWT_SECRET, CORS_ORIGIN
npm install
npm run seed
npm run dev                   # → http://localhost:4000
```

### 2. Web

```bash
cd frontend
cp .env.example .env.local    # NEXT_PUBLIC_API_URL=http://localhost:4000
npm install
npm run dev                   # → http://localhost:3000
```

From repo root (after `npm install` in each package):

```bash
npm run dev:backend
npm run dev:frontend
npm run seed
```

---

## Demo accounts (local / DEMO only)

| Role | Login | Password |
|------|-------|----------|
| Student Nhi | `STU-NHI` | `password123` |
| Student Tân | `STU-TAN` | `password123` |
| Student Nghĩa | `STU-NGHIA` | `password123` |
| Guard | `G-1001` | `password123` |
| Admin | `A-9001` | `password123` |

RFID tags: `RFID-NHI-001`, `RFID-TAN-001`, `RFID-NGHIA-001`

---

## Deploy (Vercel frontend)

1. Import this repo on Vercel  
2. **Root Directory:** `frontend`  
3. Env: `NEXT_PUBLIC_API_URL` = public HTTPS API URL  
4. On the API host, set:
   - `CORS_ORIGIN=https://your-app.vercel.app`
   - `CROSS_SITE_COOKIES=true`

Auth on Vercel uses a **Bearer token** in `localStorage` (cross-site cookies to tunnels are unreliable).

---

## Optional demos

| Command | What |
|---------|------|
| `npm run parkwise:zalo` | Zalo mini app + sqlite API + tunnel helpers |
| `npm run parkwise:sqlite` | SQLite gate backend only |
| `npm run infra:up` | Mongo + Mosquitto via Docker |

More: [docs/DEMO_GUIDE.md](./docs/DEMO_GUIDE.md) · [docs/REWARDS.md](./docs/REWARDS.md) · [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md)
