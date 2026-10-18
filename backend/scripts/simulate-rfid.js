/**
 * Simulate an RFID reader publish / inject.
 *
 * Usage:
 *   node scripts/simulate-rfid.js
 *   node scripts/simulate-rfid.js EXIT
 *   node scripts/simulate-rfid.js ENTRY RFID-A1B2C3
 *
 * With a real Mosquitto broker (MOCK_MQTT=false):
 *   mosquitto_pub -h 127.0.0.1 -t parking/gate/entry -m '{"rfidTag":"RFID-A1B2C3"}'
 */

const direction = (process.argv[2] ?? "ENTRY").toUpperCase();
const rfidTag = process.argv[3] ?? "RFID-A1B2C3";
const base = process.env.API_URL ?? "http://localhost:5050";

const res = await fetch(`${base}/api/simulate/rfid`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ rfidTag, direction }),
});

const body = await res.json();
console.log(res.status, body);
