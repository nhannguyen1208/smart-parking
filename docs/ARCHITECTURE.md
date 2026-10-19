# Architecture

```text
frontend/ (Next.js :3000)
        │  REST + cookie JWT
        ▼
backend/ (Express :4000)
        ├── MongoDB
        ├── Socket.IO
        └── MQTT (optional)

Optional demos:
  frontend/zalo-miniapp  →  backend/parkwise-sqlite (Prisma)
```

Core parking rules: `backend/src/services/parking.service.ts`
