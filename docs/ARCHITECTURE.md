# Architecture

```text
frontend/ (Next.js :3000)  ──┐
                              ├── REST + JWT (cookie / Bearer)
frontend/zalo-miniapp  ───────┘
                              ▼
backend/ (Express :4000)   ← one public API host (buy domain → tunnel here)
        ├── MongoDB (shared users: studentId / email / phone / zaloUserId)
        ├── Socket.IO
        └── MQTT (optional)

Legacy (optional hardware demos only):
  backend/parkwise-sqlite — not required for Mini App / web login
```

Core parking rules: `backend/src/services/parking.service.ts`
