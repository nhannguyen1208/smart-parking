# VNUK ParkWise — Implementation Status

Last updated: 2026-10-18

## Repository mapping

| Spec responsibility | This repo |
|---------------------|-----------|
| API + Mongo + MQTT + Socket.IO | `backend/` (`/api/v1` + legacy `/api`) |
| Student / Guard / Admin web UI | `frontend/` (Next.js) |
| Docker Mongo + Mosquitto | `infra/docker-compose.yml` |
| Docs | `docs/`, this file, `PARKWISE.md` |
| Alternate Zalo Vite + Prisma SQLite | `frontend/zalo-miniapp/`, `backend/parkwise-sqlite/` |

## Working (runnable locally)

- [x] Auth STUDENT / GUARD / ADMIN (cookie JWT) + demo seed users
- [x] Vehicles + RFID credentials (SHA-256 hash, display suffix only)
- [x] Parking lots with capacity estimates + status
- [x] `ParkingService` entry/exit/idempotency/capacity/fees
- [x] Gate devices + gate events (`eventId` unique)
- [x] MQTT client optional (`MQTT_ENABLED=false` → Guard DEMO scan)
- [x] Guard: dashboard, simulate scan, sessions close, occupancy reconcile, exceptions
- [x] Admin: overview, users, events, integrations status, feature flags
- [x] Student: dashboard v1, Backup Pass, Kill-Switch, SOS, rewards ledger, profile RFID
- [x] Demo adapters: Zalo / Payment / LPR / LMS (`DEMO` / `NOT_CONFIGURED`)
- [x] Vitest: fee calculator + ParkingService integration
- [x] Socket.IO rooms (capacity / guards / admins / user)
- [x] `server` `tsc --noEmit` passes

## Mock / demo-only (honest labels)

- Physical UHF RFID readers — Guard **Simulate scan** / MQTT DEMO payloads
- Zalo Mini App — **zmp-cli ready** (`app-config.json`, `#app`, Vite ZMP build, `zmp sync-config`); need your Mini App ID + `zmp login` / `zmp deploy` for real Zalo; OA/ZNS not configured
- Payment — `MockPaymentProvider` (sample ledger)
- AI-LPR — manual/simulated plate only
- LMS — demo/CSV path only (no live LMS)
- Zero-Lost Nudge — reminder notification only (not key sensor)
- Kill-Switch — disables ParkWise access, not the motorcycle engine

## Tests run

| Check | Result |
|-------|--------|
| `cd server && npm test` (vitest) | **5 passed** |
| `cd server && npm run typecheck` | **pass** |
| Manual smoke: login Nhi + Guard ENTRY `RFID-NHI-001` | **ALLOWED**, session created |
| `npm run lint` (repo root) | Many pre-existing warnings/errors outside this MVP scope |

## Outstanding for production

- Mosquitto TLS + ACL + non-anonymous auth
- Real Zalo Mini App credentials + OA templates + institutional policy
- Physical gate controller protocol wiring
- Payment provider keys + reconciliation
- LPR service URL/key
- Official LMS API approval
- Refresh-token rotation hardening / rate limits / Helmet (partial next)

## Known limitations

- Capacity is **lot-level estimate**; guard reconciliation required when drift occurs.
- Demo fee rates are **sample**, not official VNUK policy.
- Carpool / schedule-priority UI modules are flag-ready on API settings; full boards are minimal.
- Next.js lint baseline still noisy; API typecheck is clean.
