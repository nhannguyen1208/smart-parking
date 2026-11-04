# ParkWise ESP32 Gate

Một file: `parkwise_gate/parkwise_gate.ino` — Upload Arduino IDE.

## Kết nối với web ParkWise

```text
ESP32 (RFID) ──HTTP──► backend :4000 ──► Mongo + Guard web (/guard)
```

1. Chạy API: `cd backend && npm run dev`
2. Nạp sketch, mở portal `ParkWise-Gate` → `http://192.168.4.1`
3. Điền:
   - WiFi
   - **API base URL** = `http://<IP Mac của bạn>:4000` (không dùng localhost)
   - **Device key** = `parkwise-device`
4. Web: login Guard → `/guard` — quét thẻ sẽ hiện trong Recent gate events (auto 3s)
5. Serial: gõ `ping` để kiểm tra API

Map UID thẻ → `RFID-A1B2C3` trong `UID_MAP` (trong `.ino`) nếu thẻ thật khác seed.

## Libraries

MFRC522, ESP32Servo, PubSubClient, ArduinoJson **6.x**
