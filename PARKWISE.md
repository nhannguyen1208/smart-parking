# ParkWise — Prisma / SQLite demo (optional)

Alternate stack under:

- `backend/parkwise-sqlite` — Express + Prisma + SQLite (:5050)
- `frontend/zalo-miniapp` — Vite UI (:5173)

Main production-shaped app is **`frontend/` + `backend/`** (Mongo). Prefer that path unless you specifically need this SQLite demo.

## Quick start

```bash
cd backend/parkwise-sqlite
npm install
npx prisma db push
npm run db:seed
npm run dev

# other terminal
cd frontend/zalo-miniapp
npm install
npm run dev
```

Or from root: `npm run parkwise:sqlite` and `npm run parkwise:app`.

Prisma Studio: `npm run parkwise:db`
