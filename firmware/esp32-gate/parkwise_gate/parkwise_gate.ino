/**
 * ParkWise ESP32 Gate — 1 file (Arduino IDE Upload)
 *
 * Libraries: MFRC522, ESP32Servo, PubSubClient, ArduinoJson 6.x
 * (HTTPClient / WebServer / Preferences có sẵn ESP32 core)
 *
 * Kết nối WEB (khuyến nghị):
 *   Portal → điền "API base URL" = http://<IP-máy-chạy-backend>:4000
 *   Device key = parkwise-device (trùng DEVICE_API_KEY backend)
 *   Quét thẻ → POST /api/v1/device/gate-events → Guard web thấy event
 *
 * Không WiFi → SoftAP "ParkWise-Gate" → http://192.168.4.1
 * BOOT ngắn = ENTRY/EXIT | BOOT 3s = mở lại portal
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <WebServer.h>
#include <DNSServer.h>
#include <Preferences.h>
#include <PubSubClient.h>
#include <SPI.h>
#include <MFRC522.h>
#include <ESP32Servo.h>
#include <ArduinoJson.h>
#include <esp_system.h>
#include <time.h>
#include <strings.h>

// ── Pins ────────────────────────────────────────────────────────────────────
static const int PIN_SERVO_ENTRY = 13;
static const int PIN_SERVO_EXIT  = 12;
static const int PIN_RFID_SS     = 5;
static const int PIN_RFID_RST    = 22;
static const int PIN_DIR_BTN     = 0;
static const int PIN_STATUS_LED  = 2;

static const int SERVO_ANGLE_CLOSED = 0;
static const int SERVO_ANGLE_OPEN   = 90;
static const int BARRIER_HOLD_MS    = 3500;

static const char* GATE_ENTRY_ID = "GATE_A_IN";
static const char* GATE_EXIT_ID  = "GATE_A_OUT";
static const char* LOT_ID        = "LOT_A";

// 0 = chỉ mở cổng khi web trả ALLOWED (thẻ đã đăng ký). Không mở thẻ lạ / offline.
#ifndef LOCAL_DEMO_OPEN
#define LOCAL_DEMO_OPEN 0
#endif

static const unsigned long SCAN_COOLDOWN_MS = 2500;
static const unsigned long HEARTBEAT_MS     = 15000;
static const unsigned long WIFI_CONNECT_TIMEOUT_MS = 15000;
static const char* WIFI_PORTAL_AP_SSID = "ParkWise-Gate";

struct UidCredentialMap {
  const char* uidHex;
  const char* credential;
};
static const UidCredentialMap UID_MAP[] = {
    // {"AABBCCDD", "RFID-A1B2C3"},
};
static const size_t UID_MAP_LEN = sizeof(UID_MAP) / sizeof(UID_MAP[0]);

struct GateSettings {
  String wifiSsid;
  String wifiPass;
  String apiBaseUrl;   // http://192.168.1.10:4000  (ParkWise backend)
  String deviceKey;    // X-Device-Key
  String mqttHost;
  uint16_t mqttPort;
  String mqttUser;
  String mqttPass;
  String mqttClientId;
};

GateSettings gSettings;
Preferences gPrefs;
WebServer gPortal(80);
DNSServer gDns;
bool gPortalActive = false;

enum GateDirection : uint8_t { DIR_ENTRY = 0, DIR_EXIT = 1 };

MFRC522 mfrc522(PIN_RFID_SS, PIN_RFID_RST);
Servo servoEntry;
Servo servoExit;
WiFiClient wifiClient;
PubSubClient mqtt(wifiClient);

GateDirection direction = DIR_ENTRY;
bool entryOpen = false;
bool exitOpen = false;
unsigned long entryCloseAt = 0;
unsigned long exitCloseAt = 0;
unsigned long lastHeartbeat = 0;
unsigned long lastScanAt = 0;
unsigned long lastMqttAttempt = 0;
String lastUidHex;
bool btnWasPressed = false;
unsigned long btnDownAt = 0;
bool btnLongHandled = false;

static const char* gateIdFor(GateDirection d) {
  return d == DIR_ENTRY ? GATE_ENTRY_ID : GATE_EXIT_ID;
}

void setStatusLed(bool on) { digitalWrite(PIN_STATUS_LED, on ? HIGH : LOW); }

void blinkStatus(int times, int onMs = 80, int offMs = 80) {
  for (int i = 0; i < times; i++) {
    setStatusLed(true);
    delay(onMs);
    setStatusLed(false);
    delay(offMs);
  }
  if (!gPortalActive) setStatusLed(direction == DIR_ENTRY);
}

String htmlEscape(const String& s) {
  String o;
  o.reserve(s.length() + 8);
  for (size_t i = 0; i < s.length(); i++) {
    char c = s[i];
    if (c == '&') o += F("&amp;");
    else if (c == '<') o += F("&lt;");
    else if (c == '>') o += F("&gt;");
    else if (c == '"') o += F("&quot;");
    else o += c;
  }
  return o;
}

void loadSettings() {
  gPrefs.begin("parkwise", true);
  gSettings.wifiSsid = gPrefs.getString("wifiSsid", "");
  gSettings.wifiPass = gPrefs.getString("wifiPass", "");
  gSettings.apiBaseUrl = gPrefs.getString("apiUrl", "");
  gSettings.deviceKey = gPrefs.getString("devKey", "parkwise-device");
  gSettings.mqttHost = gPrefs.getString("mqttHost", "");
  gSettings.mqttPort = gPrefs.getUShort("mqttPort", 1883);
  gSettings.mqttUser = gPrefs.getString("mqttUser", "");
  gSettings.mqttPass = gPrefs.getString("mqttPass", "");
  gSettings.mqttClientId = gPrefs.getString("mqttCid", "parkwise-esp32-gate");
  gPrefs.end();
}

void saveSettings() {
  gPrefs.begin("parkwise", false);
  gPrefs.putString("wifiSsid", gSettings.wifiSsid);
  gPrefs.putString("wifiPass", gSettings.wifiPass);
  gPrefs.putString("apiUrl", gSettings.apiBaseUrl);
  gPrefs.putString("devKey", gSettings.deviceKey);
  gPrefs.putString("mqttHost", gSettings.mqttHost);
  gPrefs.putUShort("mqttPort", gSettings.mqttPort);
  gPrefs.putString("mqttUser", gSettings.mqttUser);
  gPrefs.putString("mqttPass", gSettings.mqttPass);
  gPrefs.putString("mqttCid", gSettings.mqttClientId);
  gPrefs.end();
  Serial.println(F("[cfg] saved"));
}

void clearWifiSettings() {
  gPrefs.begin("parkwise", false);
  gPrefs.remove("wifiSsid");
  gPrefs.remove("wifiPass");
  gPrefs.end();
  gSettings.wifiSsid = "";
  gSettings.wifiPass = "";
}

String portalPageHtml() {
  String html;
  html.reserve(3200);
  html += F(
      "<!DOCTYPE html><html><head><meta charset=utf-8>"
      "<meta name=viewport content=\"width=device-width,initial-scale=1\">"
      "<title>ParkWise Gate</title><style>"
      "body{font-family:system-ui,sans-serif;background:#0f172a;color:#e2e8f0;"
      "margin:0;padding:24px;max-width:440px;margin-inline:auto}"
      "h1{font-size:1.35rem;margin:0 0 4px}p{color:#94a3b8;margin:0 0 16px;font-size:.9rem}"
      "label{display:block;font-size:.8rem;color:#94a3b8;margin:12px 0 4px}"
      "input{width:100%;box-sizing:border-box;padding:12px;border-radius:10px;"
      "border:1px solid #334155;background:#1e293b;color:#f8fafc;font-size:1rem}"
      "button{width:100%;margin-top:20px;padding:14px;border:0;border-radius:10px;"
      "background:#22c55e;color:#052e16;font-weight:700;font-size:1rem}"
      ".card{background:#1e293b;border-radius:16px;padding:20px}"
      "h2{font-size:.95rem;margin:20px 0 0;color:#38bdf8}"
      "</style></head><body><div class=card>"
      "<h1>ParkWise Gate</h1>"
      "<p>Kết nối WiFi + API web ParkWise. Lưu xong board restart.</p>"
      "<form method=POST action=/save>"
      "<label>WiFi SSID</label><input name=ssid required value=\"");
  html += htmlEscape(gSettings.wifiSsid);
  html += F(
      "\"><label>WiFi mật khẩu</label>"
      "<input name=pass type=password placeholder=\"(trống = giữ cũ)\">"
      "<h2>Web API (ParkWise backend)</h2>"
      "<label>API base URL</label>"
      "<input name=api placeholder=\"http://192.168.1.10:4000\" value=\"");
  html += htmlEscape(gSettings.apiBaseUrl);
  html += F(
      "\"><label>Device key (X-Device-Key)</label><input name=devkey value=\"");
  html += htmlEscape(gSettings.deviceKey);
  html += F(
      "\"><h2>MQTT (tuỳ chọn)</h2>"
      "<label>MQTT host</label><input name=mqtt value=\"");
  html += htmlEscape(gSettings.mqttHost);
  html += F("\"><label>MQTT port</label><input name=port type=number value=\"");
  html += String(gSettings.mqttPort);
  html += F("\"><label>MQTT user</label><input name=muser value=\"");
  html += htmlEscape(gSettings.mqttUser);
  html += F(
      "\"><label>MQTT password</label><input name=mpass type=password>"
      "<label>MQTT client id</label><input name=cid value=\"");
  html += htmlEscape(gSettings.mqttClientId);
  html += F(
      "\"><button type=submit>Lưu &amp; kết nối</button></form>"
      "<p style=\"margin-top:16px;font-size:.75rem\">BOOT 3 giây = mở lại trang này.</p>"
      "</div></body></html>");
  return html;
}

void handlePortalRoot() { gPortal.send(200, "text/html", portalPageHtml()); }

void handlePortalSave() {
  if (gPortal.hasArg("ssid")) {
    gSettings.wifiSsid = gPortal.arg("ssid");
    gSettings.wifiSsid.trim();
  }
  if (gPortal.hasArg("pass") && gPortal.arg("pass").length() > 0) {
    gSettings.wifiPass = gPortal.arg("pass");
  }
  if (gPortal.hasArg("api")) {
    gSettings.apiBaseUrl = gPortal.arg("api");
    gSettings.apiBaseUrl.trim();
    while (gSettings.apiBaseUrl.endsWith("/")) {
      gSettings.apiBaseUrl.remove(gSettings.apiBaseUrl.length() - 1);
    }
  }
  if (gPortal.hasArg("devkey")) {
    gSettings.deviceKey = gPortal.arg("devkey");
    gSettings.deviceKey.trim();
  }
  if (gPortal.hasArg("mqtt")) {
    gSettings.mqttHost = gPortal.arg("mqtt");
    gSettings.mqttHost.trim();
  }
  if (gPortal.hasArg("port") && gPortal.arg("port").length()) {
    gSettings.mqttPort = (uint16_t)gPortal.arg("port").toInt();
  }
  if (gPortal.hasArg("muser")) gSettings.mqttUser = gPortal.arg("muser");
  if (gPortal.hasArg("mpass") && gPortal.arg("mpass").length()) {
    gSettings.mqttPass = gPortal.arg("mpass");
  }
  if (gPortal.hasArg("cid") && gPortal.arg("cid").length()) {
    gSettings.mqttClientId = gPortal.arg("cid");
  }
  saveSettings();
  gPortal.send(
      200,
      "text/html",
      F("<!DOCTYPE html><meta charset=utf-8><body style=\"font-family:sans-serif;"
        "background:#0f172a;color:#e2e8f0;padding:2rem\">"
        "<h2>Đã lưu</h2><p>ESP32 đang khởi động lại…</p></body>"));
  delay(600);
  ESP.restart();
}

void handlePortalNotFound() {
  gPortal.sendHeader("Location", String("http://") + WiFi.softAPIP().toString() + "/", true);
  gPortal.send(302, "text/plain", "");
}

void startConfigPortal() {
  if (gPortalActive) return;
  Serial.println(F("[portal] SoftAP ParkWise-Gate → http://192.168.4.1"));
  WiFi.mode(WIFI_AP_STA);
  WiFi.softAP(WIFI_PORTAL_AP_SSID);
  delay(200);
  IPAddress apIp = WiFi.softAPIP();
  gDns.start(53, "*", apIp);
  gPortal.on("/", HTTP_GET, handlePortalRoot);
  gPortal.on("/save", HTTP_POST, handlePortalSave);
  gPortal.onNotFound(handlePortalNotFound);
  gPortal.begin();
  gPortalActive = true;
  Serial.printf("[portal] AP %s\n", apIp.toString().c_str());
}

void servicePortal() {
  if (!gPortalActive) return;
  gDns.processNextRequest();
  gPortal.handleClient();
}

bool tryConnectWifi(unsigned long timeoutMs = WIFI_CONNECT_TIMEOUT_MS) {
  if (gSettings.wifiSsid.length() == 0) return false;
  WiFi.mode(WIFI_STA);
  WiFi.begin(gSettings.wifiSsid.c_str(), gSettings.wifiPass.c_str());
  Serial.printf("[wifi] \"%s\"", gSettings.wifiSsid.c_str());
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < timeoutMs) {
    delay(400);
    Serial.print('.');
  }
  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("[wifi] OK %s\n", WiFi.localIP().toString().c_str());
    configTime(0, 0, "pool.ntp.org", "time.nist.gov");
    return true;
  }
  return false;
}

bool setupWifiOrPortal(bool forcePortal) {
  loadSettings();
  if (forcePortal) {
    startConfigPortal();
    return true;
  }
  if (tryConnectWifi()) return false;
  startConfigPortal();
  return true;
}

String uidToHex(const MFRC522::Uid& uid) {
  String hex;
  hex.reserve(uid.size * 2);
  for (byte i = 0; i < uid.size; i++) {
    if (uid.uidByte[i] < 0x10) hex += '0';
    hex += String(uid.uidByte[i], HEX);
  }
  hex.toUpperCase();
  return hex;
}

String resolveCredential(const String& uidHex) {
  for (size_t i = 0; i < UID_MAP_LEN; i++) {
    if (uidHex.equalsIgnoreCase(UID_MAP[i].uidHex)) return String(UID_MAP[i].credential);
  }
  return uidHex;
}

String newEventId() {
  char buf[40];
  snprintf(
      buf,
      sizeof(buf),
      "esp32-%08lX-%lu-%04X",
      (unsigned long)(ESP.getEfuseMac() & 0xFFFFFFFF),
      (unsigned long)millis(),
      (unsigned)random(0, 0xFFFF));
  return String(buf);
}

String iso8601Now() {
  time_t now = time(nullptr);
  if (now < 1700000000) return String();
  struct tm tmInfo;
  gmtime_r(&now, &tmInfo);
  char buf[25];
  strftime(buf, sizeof(buf), "%Y-%m-%dT%H:%M:%SZ", &tmInfo);
  return String(buf);
}

void closeBarrier(GateDirection d) {
  if (d == DIR_ENTRY) {
    servoEntry.write(SERVO_ANGLE_CLOSED);
    entryOpen = false;
    entryCloseAt = 0;
  } else {
    servoExit.write(SERVO_ANGLE_CLOSED);
    exitOpen = false;
    exitCloseAt = 0;
  }
  Serial.printf("[barrier] CLOSE %s\n", gateIdFor(d));
}

void openBarrier(GateDirection d, unsigned long holdMs = BARRIER_HOLD_MS) {
  if (d == DIR_ENTRY) {
    servoEntry.write(SERVO_ANGLE_OPEN);
    entryOpen = true;
    entryCloseAt = millis() + holdMs;
  } else {
    servoExit.write(SERVO_ANGLE_OPEN);
    exitOpen = true;
    exitCloseAt = millis() + holdMs;
  }
  Serial.printf("[barrier] OPEN %s\n", gateIdFor(d));
}

void serviceBarriers() {
  const unsigned long now = millis();
  if (entryOpen && entryCloseAt && (long)(now - entryCloseAt) >= 0) closeBarrier(DIR_ENTRY);
  if (exitOpen && exitCloseAt && (long)(now - exitCloseAt) >= 0) closeBarrier(DIR_EXIT);
}

bool publishJson(const String& topic, const JsonDocument& doc) {
  char payload[384];
  size_t n = serializeJson(doc, payload, sizeof(payload));
  if (!n || n >= sizeof(payload)) return false;
  bool ok = mqtt.publish(topic.c_str(), payload, false);
  Serial.printf("[mqtt] %s %s\n", ok ? "OK" : "FAIL", topic.c_str());
  return ok;
}

void publishHeartbeat(GateDirection d) {
  if (!mqtt.connected()) return;
  StaticJsonDocument<192> doc;
  doc["schemaVersion"] = 1;
  doc["gateId"] = gateIdFor(d);
  doc["status"] = "ONLINE";
  doc["rssi"] = WiFi.RSSI();
  doc["uptimeMs"] = millis();
  publishJson(String("parkwise/v1/gates/") + gateIdFor(d) + "/heartbeat", doc);
}

void publishScanMqtt(const String& credential, GateDirection d) {
  StaticJsonDocument<384> doc;
  doc["schemaVersion"] = 1;
  doc["eventId"] = newEventId();
  doc["gateId"] = gateIdFor(d);
  doc["lotId"] = LOT_ID;
  doc["eventType"] = d == DIR_ENTRY ? "ENTRY" : "EXIT";
  doc["credentialRef"] = credential;
  doc["source"] = "REAL_DEVICE";
  String occurred = iso8601Now();
  if (occurred.length()) doc["occurredAt"] = occurred;
  publishJson(String("parkwise/v1/gates/") + gateIdFor(d) + "/events", doc);
}

// true = server tự ENTRY/EXIT theo session; false = theo nút BOOT (servo D13 / D12)
bool gAutoMode = false;
GateDirection gLastWebDirection = DIR_ENTRY;

/**
 * POST scan lên ParkWise web API.
 * return: 1 = ALLOWED, 0 = DENIED/REVIEW, -1 = lỗi mạng / chưa cấu hình
 */
int postScanToWeb(const String& credential, GateDirection preferredDir) {
  if (gSettings.apiBaseUrl.length() == 0) return -1;
  if (WiFi.status() != WL_CONNECTED) return -1;

  const char* typeStr = gAutoMode ? "AUTO"
                                  : (preferredDir == DIR_ENTRY ? "ENTRY" : "EXIT");
  const char* gateStr =
      (gAutoMode || preferredDir == DIR_ENTRY) ? GATE_ENTRY_ID : GATE_EXIT_ID;

  String url = gSettings.apiBaseUrl + "/api/v1/device/gate-events";
  StaticJsonDocument<384> body;
  body["eventId"] = newEventId();
  body["eventType"] = typeStr;
  body["gateId"] = gateStr;
  body["gateCode"] = gateStr;
  body["credentialRef"] = credential;
  body["lotId"] = LOT_ID;
  body["source"] = "REAL_DEVICE";
  String occurred = iso8601Now();
  if (occurred.length()) body["occurredAt"] = occurred;

  String payload;
  serializeJson(body, payload);

  HTTPClient http;
  http.setTimeout(8000);
  if (!http.begin(url)) {
    Serial.println(F("[web] begin failed"));
    return -1;
  }
  http.addHeader("Content-Type", "application/json");
  if (gSettings.deviceKey.length()) {
    http.addHeader("X-Device-Key", gSettings.deviceKey);
  }

  Serial.printf("[web] POST %s type=%s gate=%s\n", url.c_str(), typeStr, gateStr);
  int code = http.POST(payload);
  String resp = http.getString();
  http.end();
  Serial.printf("[web] HTTP %d %s\n", code, resp.c_str());

  if (code < 200 || code >= 300) return -1;

  StaticJsonDocument<768> doc;
  if (deserializeJson(doc, resp)) return -1;
  const char* result = doc["data"]["result"] | "";
  const char* resolved = doc["data"]["eventType"] | "";
  const char* unreg = doc["data"]["unregisteredCredential"] | "";
  bool openBarrierFlag = doc["data"]["openBarrier"] | false;

  // Servo nào mở: theo server (AUTO) hoặc theo BOOT (manual)
  if (gAutoMode) {
    gLastWebDirection = (strcasecmp(resolved, "EXIT") == 0) ? DIR_EXIT : DIR_ENTRY;
  } else {
    gLastWebDirection = preferredDir;
  }

  if (unreg[0]) {
    Serial.printf("[web] UNREGISTERED UID=%s → Guard /guard/cards\n", unreg);
  }

  if (openBarrierFlag || strcasecmp(result, "ALLOWED") == 0) {
    Serial.printf(
        "[web] ALLOWED %s → servo %s (pin %d)\n",
        resolved[0] ? resolved : typeStr,
        gLastWebDirection == DIR_ENTRY ? "ENTRY" : "EXIT",
        gLastWebDirection == DIR_ENTRY ? PIN_SERVO_ENTRY : PIN_SERVO_EXIT);
    return 1;
  }
  Serial.printf("[web] %s %s\n", result, doc["data"]["reason"] | "");
  return 0;
}

void testBothServos() {
  Serial.println(F("[test] ENTRY servo D13 open…"));
  openBarrier(DIR_ENTRY, 2000);
  delay(2200);
  Serial.println(F("[test] EXIT servo D12 open…"));
  openBarrier(DIR_EXIT, 2000);
  delay(2200);
  Serial.println(F("[test] done"));
}

GateDirection directionFromGateId(const char* gateId) {
  if (gateId && strcasecmp(gateId, GATE_EXIT_ID) == 0) return DIR_EXIT;
  return DIR_ENTRY;
}

void handleCommand(const String& topic, const JsonDocument& doc) {
  int gatesIdx = topic.indexOf("/gates/");
  int cmdIdx = topic.indexOf("/commands");
  String gateId = GATE_ENTRY_ID;
  if (gatesIdx >= 0 && cmdIdx > gatesIdx) gateId = topic.substring(gatesIdx + 7, cmdIdx);
  const char* action = doc["action"] | "";
  unsigned long holdMs = doc["holdMs"] | BARRIER_HOLD_MS;
  GateDirection d = directionFromGateId(gateId.c_str());
  if (strcasecmp(action, "OPEN") == 0) openBarrier(d, holdMs);
  else if (strcasecmp(action, "CLOSE") == 0) closeBarrier(d);
}

void onMqttMessage(char* topic, byte* payload, unsigned int length) {
  StaticJsonDocument<256> doc;
  if (deserializeJson(doc, payload, length)) return;
  String t(topic);
  if (t.indexOf("/commands") >= 0) handleCommand(t, doc);
}

void ensureMqtt() {
  if (mqtt.connected() || gPortalActive) return;
  if (gSettings.mqttHost.length() == 0) return;
  if (WiFi.status() != WL_CONNECTED) return;
  if (millis() - lastMqttAttempt < 4000) return;
  lastMqttAttempt = millis();
  mqtt.setServer(gSettings.mqttHost.c_str(), gSettings.mqttPort);
  bool ok = gSettings.mqttUser.length()
                ? mqtt.connect(
                      gSettings.mqttClientId.c_str(),
                      gSettings.mqttUser.c_str(),
                      gSettings.mqttPass.c_str())
                : mqtt.connect(gSettings.mqttClientId.c_str());
  if (!ok) {
    Serial.printf("[mqtt] fail rc=%d\n", mqtt.state());
    return;
  }
  Serial.println(F("[mqtt] ok"));
  mqtt.subscribe("parkwise/v1/gates/+/commands");
  publishHeartbeat(DIR_ENTRY);
  publishHeartbeat(DIR_EXIT);
  lastHeartbeat = millis();
}

void setDirection(GateDirection d) {
  direction = d;
  Serial.printf(
      "[dir] %s → servo pin %d (%s)\n",
      gateIdFor(d),
      d == DIR_ENTRY ? PIN_SERVO_ENTRY : PIN_SERVO_EXIT,
      gAutoMode ? "AUTO vẫn theo session" : "manual");
  blinkStatus(d == DIR_ENTRY ? 1 : 2);
}

void enterConfigPortalFromButton() {
  clearWifiSettings();
  if (mqtt.connected()) mqtt.disconnect();
  WiFi.disconnect(true, false);
  startConfigPortal();
  blinkStatus(5, 60, 60);
}

void serviceDirectionButton() {
  bool pressed = digitalRead(PIN_DIR_BTN) == LOW;
  if (pressed && !btnWasPressed) {
    btnWasPressed = true;
    btnLongHandled = false;
    btnDownAt = millis();
  } else if (pressed && btnWasPressed && !btnLongHandled) {
    if (millis() - btnDownAt >= 3000) {
      btnLongHandled = true;
      enterConfigPortalFromButton();
    }
  } else if (!pressed && btnWasPressed) {
    unsigned long held = millis() - btnDownAt;
    btnWasPressed = false;
    if (!btnLongHandled && held < 800 && !gPortalActive) {
      setDirection(direction == DIR_ENTRY ? DIR_EXIT : DIR_ENTRY);
    }
  }
}

void handleCard(const String& uidHex) {
  const unsigned long now = millis();
  if (uidHex == lastUidHex && (now - lastScanAt) < SCAN_COOLDOWN_MS) return;
  lastUidHex = uidHex;
  lastScanAt = now;

  String credential = resolveCredential(uidHex);
  Serial.printf(
      "[rfid] uid=%s cred=%s dir=%s\n",
      uidHex.c_str(),
      credential.c_str(),
      direction == DIR_ENTRY ? "ENTRY" : "EXIT");
  blinkStatus(3, 40, 40);

  int webResult = postScanToWeb(credential, direction);
  if (webResult == 1) {
    // Chỉ mở khi thẻ đã đăng ký + ALLOWED — đúng 1 servo theo hướng
    openBarrier(gLastWebDirection, BARRIER_HOLD_MS);
    Serial.printf(
        "[gate] OPEN pin %d (%s)\n",
        gLastWebDirection == DIR_ENTRY ? PIN_SERVO_ENTRY : PIN_SERVO_EXIT,
        gLastWebDirection == DIR_ENTRY ? "VÀO" : "RA");
  } else if (webResult == 0) {
    Serial.println(F("[gate] CLOSED — thẻ chưa đăng ký / DENIED (xem /guard/cards)"));
    blinkStatus(6, 50, 50);
  } else {
    if (mqtt.connected()) publishScanMqtt(credential, direction);
    if (gSettings.apiBaseUrl.length() == 0) {
      Serial.println(F("[gate] CLOSED — CHƯA CÓ API URL"));
      Serial.println(F("  Serial: api http://192.168.10.102:4000"));
      Serial.println(F("  hoặc portal http://192.168.4.1 điền API base URL"));
    } else if (WiFi.status() != WL_CONNECTED) {
      Serial.println(F("[gate] CLOSED — chưa nối WiFi nhà (đang SoftAP?)"));
      Serial.println(F("  Serial: wifi TEN_WIFI MAT_KHAU"));
    } else {
      Serial.println(F("[gate] CLOSED — web không ALLOWED / ping lỗi — gõ: ping"));
    }
    blinkStatus(4, 80, 80);
#if LOCAL_DEMO_OPEN
    openBarrier(direction, BARRIER_HOLD_MS);
    Serial.println(F("[gate] LOCAL_DEMO_OPEN override"));
#endif
  }
}

void pollRfid() {
  if (!mfrc522.PICC_IsNewCardPresent() || !mfrc522.PICC_ReadCardSerial()) return;
  String uid = uidToHex(mfrc522.uid);
  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();
  handleCard(uid);
}

void handleSerial() {
  if (!Serial.available()) return;
  String line = Serial.readStringUntil('\n');
  line.trim();
  String lower = line;
  lower.toLowerCase();
  if (lower == "entry") setDirection(DIR_ENTRY);
  else if (lower == "exit") setDirection(DIR_EXIT);
  else if (lower == "open") openBarrier(direction);
  else if (lower == "open entry") openBarrier(DIR_ENTRY);
  else if (lower == "open exit") openBarrier(DIR_EXIT);
  else if (lower == "close") {
    closeBarrier(DIR_ENTRY);
    closeBarrier(DIR_EXIT);
  } else if (lower == "test" || lower == "testservos") testBothServos();
  else if (lower == "auto") {
    gAutoMode = true;
    Serial.println(F("[mode] AUTO — check-in→D13, check-out→D12"));
  } else if (lower == "manual") {
    gAutoMode = false;
    Serial.println(F("[mode] MANUAL — BOOT chọn VÀO(D13) / RA(D12)"));
  } else if (lower == "portal") enterConfigPortalFromButton();
  else if (lower == "cfg") {
    Serial.printf(
        "[cfg] wifi=\"%s\" ip=%s api=%s key=%s portal=%d auto=%d\n",
        gSettings.wifiSsid.c_str(),
        WiFi.status() == WL_CONNECTED ? WiFi.localIP().toString().c_str() : "(no wifi)",
        gSettings.apiBaseUrl.c_str(),
        gSettings.deviceKey.c_str(),
        gPortalActive,
        gAutoMode);
  } else if (lower.startsWith("api ")) {
    gSettings.apiBaseUrl = line.substring(4);
    gSettings.apiBaseUrl.trim();
    while (gSettings.apiBaseUrl.endsWith("/")) {
      gSettings.apiBaseUrl.remove(gSettings.apiBaseUrl.length() - 1);
    }
    if (gSettings.deviceKey.length() == 0) gSettings.deviceKey = "parkwise-device";
    saveSettings();
    Serial.printf("[cfg] api saved → %s\n", gSettings.apiBaseUrl.c_str());
    Serial.println(F("  gõ ping để thử (cần WiFi nhà, không phải SoftAP)"));
  } else if (lower.startsWith("wifi ")) {
    String rest = line.substring(5);
    rest.trim();
    int sp = rest.indexOf(' ');
    if (sp <= 0) {
      Serial.println(F("usage: wifi TEN_WIFI MAT_KHAU"));
      return;
    }
    gSettings.wifiSsid = rest.substring(0, sp);
    gSettings.wifiPass = rest.substring(sp + 1);
    gSettings.wifiSsid.trim();
    gSettings.wifiPass.trim();
    saveSettings();
    Serial.printf("[cfg] wifi saved \"%s\" — restarting…\n", gSettings.wifiSsid.c_str());
    delay(400);
    ESP.restart();
  } else if (lower == "ping") {
    if (gSettings.apiBaseUrl.length() == 0) {
      Serial.println(F("[web] chưa có API — ví dụ: api http://192.168.10.102:4000"));
      return;
    }
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println(F("[web] chưa WiFi STA — wifi TEN_WIFI MAT_KHAU rồi restart"));
      return;
    }
    HTTPClient http;
    String url = gSettings.apiBaseUrl + "/api/v1/device/ping";
    http.begin(url);
    if (gSettings.deviceKey.length()) http.addHeader("X-Device-Key", gSettings.deviceKey);
    int code = http.GET();
    Serial.printf("[web] ping %d %s\n", code, http.getString().c_str());
    http.end();
  } else if (lower.startsWith("scan ")) handleCard(line.substring(5));
  else if (lower.length()) {
    Serial.println(F("cmds: cfg|api URL|wifi SSID PASS|ping|entry|exit|test|portal|scan UID"));
  }
}

void servicePortalLed() {
  if (!gPortalActive) return;
  setStatusLed((millis() / 400) % 2 == 0);
}

void setup() {
  Serial.begin(115200);
  delay(200);
  Serial.println();
  Serial.println(F("=== ParkWise ESP32 Gate → Web ==="));

  pinMode(PIN_DIR_BTN, INPUT_PULLUP);
  pinMode(PIN_STATUS_LED, OUTPUT);
  setStatusLed(false);

  bool forcePortal = digitalRead(PIN_DIR_BTN) == LOW;

  ESP32PWM::allocateTimer(0);
  ESP32PWM::allocateTimer(1);
  servoEntry.setPeriodHertz(50);
  servoExit.setPeriodHertz(50);
  servoEntry.attach(PIN_SERVO_ENTRY, 500, 2400);
  servoExit.attach(PIN_SERVO_EXIT, 500, 2400);
  closeBarrier(DIR_ENTRY);
  closeBarrier(DIR_EXIT);

  SPI.begin();
  mfrc522.PCD_Init();
  delay(50);
  byte v = mfrc522.PCD_ReadRegister(mfrc522.VersionReg);
  Serial.printf("[rfid] 0x%02X %s\n", v, (v == 0x00 || v == 0xFF) ? "CHECK WIRING" : "OK");

  setupWifiOrPortal(forcePortal);

  mqtt.setCallback(onMqttMessage);
  mqtt.setBufferSize(512);
  mqtt.setKeepAlive(30);

  setDirection(DIR_ENTRY);
  Serial.printf(
      "[cfg] api=%s key=%s mqtt=%s portal=%d\n",
      gSettings.apiBaseUrl.c_str(),
      gSettings.deviceKey.c_str(),
      gSettings.mqttHost.c_str(),
      gPortalActive);
  Serial.println(F("[servo] VÀO=D13 | RA=D12 — BOOT đổi hướng"));
  if (gSettings.apiBaseUrl.length() == 0 || gPortalActive) {
    Serial.println(F("!!! CHƯA NỐI WEB — làm lần lượt trên Serial 115200:"));
    Serial.println(F("  1) wifi TEN_WIFI MAT_KHAU"));
    Serial.println(F("  2) api http://192.168.10.102:4000"));
    Serial.println(F("  3) ping"));
  }
}

void loop() {
  servicePortal();
  servicePortalLed();

  if (!gPortalActive && WiFi.status() == WL_CONNECTED) {
    ensureMqtt();
    if (mqtt.connected()) mqtt.loop();
  }

  if (mqtt.connected() && millis() - lastHeartbeat >= HEARTBEAT_MS) {
    publishHeartbeat(DIR_ENTRY);
    publishHeartbeat(DIR_EXIT);
    lastHeartbeat = millis();
  }

  pollRfid();
  serviceBarriers();
  serviceDirectionButton();
  handleSerial();
}
