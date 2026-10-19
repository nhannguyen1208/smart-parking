# Hardware integration

## Current mode

- `MQTT_ENABLED=false` (default): Guard/Admin **Simulate scan** calls `ParkingService` with `source=DEMO`.
- `MQTT_ENABLED=true`: subscribe `parkwise/v1/gates/+/events` — same service path.

## To activate a real reader

1. Map reader UID → credential raw token used at registration (hashed at rest).
2. Publish schemaVersion=1 JSON (see master prompt) with unique `eventId`.
3. Set gate `mode=CONNECTED` after heartbeat proves online.
4. Never open a barrier automatically solely because MQTT is down — fail closed / guard review.

Do not claim physical readers work until configured and tested end-to-end.
