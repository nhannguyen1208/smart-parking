# ParkWise Demo Guide (local)

## Start

```bash
npm run infra:up   # optional

cd backend
npm install
npm run seed
npm run dev

# another terminal
cd frontend
npm install
npm run dev
```

- API: http://localhost:4000  
- Web: http://localhost:3000  

## Demo credentials (LOCAL ONLY)

| Role | ID / email | Password |
|------|------------|----------|
| Student Nhi | `STU-NHI` / `nhi.demo@vnuk.local` | `password123` |
| Student Tân | `STU-TAN` | `password123` |
| Student Nghĩa | `STU-NGHIA` | `password123` |
| Guard | `G-1001` / `guard001@vnuk.local` | `password123` |
| Admin | `A-9001` / `admin001@vnuk.local` | `password123` |

RFID demo tags: `RFID-NHI-001`, `RFID-TAN-001`, `RFID-NGHIA-001`

## Suggested flows

1. Login as Nhi → Profile Kill-Switch → Guard simulate ENTRY with `RFID-NHI-001` → expect DENIED.  
2. Restore access → Guard ENTRY → session + occupancy +1.  
3. Student Backup Pass → Guard verify with token → single use (earns Rewards).  
4. Admin → Integrations shows DEMO / Not configured.
