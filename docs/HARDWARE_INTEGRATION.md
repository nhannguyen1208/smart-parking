# Hardware integration

## Current mode

- `MQTT_ENABLED=false` (default): Guard/Admin **Simulate scan** calls `ParkingService` with `source=DEMO`.
- `MQTT_ENABLED=true`: subscribe `parkwise/v1/gates/+/events` — same service path.
- **ESP32 → Web (recommended):** `POST /api/v1/device/gate-events` with header `X-Device-Key`.

## ESP32 → ParkWise web (HTTP)

1. Run API on LAN: `cd backend && npm run dev` (`:4000`).
2. In `backend/.env` set `DEVICE_API_KEY=parkwise-device` (default).
3. Flash [`firmware/esp32-gate/parkwise_gate/parkwise_gate.ino`](../firmware/esp32-gate/parkwise_gate/parkwise_gate.ino).
4. Join SoftAP **ParkWise-Gate** → `http://192.168.4.1`:
   - WiFi nhà / lab
   - **API base URL** = `http://<IP-máy-chạy-backend>:4000`
   - **Device key** = `parkwise-device`
5. **Đăng ký thẻ trên web:** Guard → `/guard/cards` — tìm MSSV, dán UID (hoặc bấm thẻ lạ từ ESP32), Lưu.
6. Quét lại: backend **AUTO** check-in (chưa đỗ) / check-out (đang đỗ). ALLOWED → mở servo ENTRY hoặc EXIT.
7. Guard home `/guard` và `/guard/verify` theo dõi / mô phỏng cùng pipeline.

Ping test (Serial `ping` or curl):

```bash
curl -H "X-Device-Key: parkwise-device" http://127.0.0.1:4000/api/v1/device/ping
```

## MQTT (optional)

Source: same firmware — fill MQTT host if Mosquitto is running (`npm run infra:up`, `MQTT_ENABLED=true`).

## Fail-closed (bắt buộc thẻ đã đăng ký)

Barrier **chỉ mở** khi API trả `result: ALLOWED` (thẻ đã gắn trên `/guard/cards`).  
Thẻ lạ / DENIED / mất mạng → cổng **đóng**. `LOCAL_DEMO_OPEN` mặc định `0`.
