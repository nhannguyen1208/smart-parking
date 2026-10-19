# ParkWise Rewards — Early Arrival Challenge

Gamified parking rewards for VNUK ParkWise (Mongo / Express `/api/v1`).

## Student journey

1. Open **Rewards** in the sidebar (`/rewards`).
2. Check **Today’s mission** window (Asia/Ho_Chi_Minh).
3. Scan registered RFID at the gate during the window — points are awarded automatically.
4. Redeem catalog rewards when you have enough points.

DEMO: use **DEMO: Simulate early check-in** on `/rewards` (seed students only). This calls the same `processGateEvent` path with a labeled simulator flag — not physical hardware. With `forceWindow`, it snaps into the mission time **and** an allowed weekday (so weekends still demo correctly).

## Data models

| Model | Purpose |
|-------|---------|
| `RewardMission` | Active challenge window, points, days of week |
| `ParkingReward` | Catalog items (cost, benefit days, validity) |
| `RewardTransaction` | Append-only ledger (`EARN` / `SPEND`) |
| `RewardRedemption` | Redeemed passes + remaining benefit days |

## API

### Student

- `GET /api/v1/student/rewards` — overview (balance, mission, catalog, history)
- `POST /api/v1/student/rewards/redeem` — `{ rewardId }`
- `POST /api/v1/student/rewards/simulate-checkin` — DEMO only `{ forceWindow?: boolean }`

### Admin

- `GET /api/v1/admin/rewards/stats`
- `GET|POST /api/v1/admin/rewards/missions`, `PATCH .../missions/:id`
- `GET|POST /api/v1/admin/rewards/catalog`, `PATCH .../catalog/:id`

UI: `/admin/rewards`

## Seed defaults

After `npm run seed` (backend):

- Mission: **Early Arrival Challenge** 07:10–07:20 weekdays, **+10** points
- Catalog: Weekly (100 pts / 5 days), Monthly (350 pts / 20 days)
- STU-NHI starts with **80** welcome points

## Rules

- Award on successful student **ENTRY** inside an active mission window — RFID, registered plate, or **Backup Pass** QR (lost/forgot card), plus DEMO sim
- Backup Pass is the student’s own check-in and **does** earn challenge points (once per day, same as RFID)
- At most one earn per student / mission / day (unique ledger index)
- Missed missions never deduct points or block parking
- Redemption checks balance; spend row uses unique `REDEEM:{id}` reason
- Campus timezone: `Asia/Ho_Chi_Minh`

## Test

```bash
cd backend
npm test -- src/services/rewards.service.test.ts
```

Requires `MONGODB_URI`.
