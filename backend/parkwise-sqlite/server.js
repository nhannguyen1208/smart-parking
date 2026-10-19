import cors from "cors";
import express from "express";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createApiRouter } from "./src/routes/api.js";
import { createMqttService } from "./src/mqttService.js";
import { createSocketService } from "./src/socketService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Lightweight .env loader (no dotenv dependency required)
try {
  const envPath = path.join(__dirname, ".env");
  const fs = await import("node:fs");
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const i = trimmed.indexOf("=");
      if (i === -1) continue;
      const key = trimmed.slice(0, i).trim();
      const value = trimmed.slice(i + 1).trim();
      if (!(key in process.env)) process.env[key] = value;
    }
  }
} catch {
  // ignore
}

const PORT = Number(process.env.PORT ?? 5050);
const CORS_ORIGIN =
  process.env.CORS_ORIGIN ?? "http://localhost:5173,https://h5.zdn.vn";

const app = express();
const server = http.createServer(app);

const allowedOrigins = CORS_ORIGIN.split(",").map((s) => s.trim()).filter(Boolean);
app.use(
  cors({
    origin(origin, callback) {
      // Mobile Zalo WebView / tools may omit Origin; allow in demo
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
        return callback(null, true);
      }
      // Also allow Zalo H5 hosts in case of subdomain variants
      if (/^https:\/\/([a-z0-9-]+\.)?zdn\.vn$/i.test(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  }),
);
app.use(express.json());

const io = createSocketService(server, CORS_ORIGIN);
const mqtt = createMqttService({ io });
mqtt.connect();

app.use("/api", createApiRouter({ mqtt, io }));

app.get("/", (_req, res) => {
  res.type("html").send(`<!doctype html>
  <html><head><title>ParkWise Backend</title>
  <style>body{font-family:system-ui;padding:2rem;background:#0b2e59;color:#fff}
  a{color:#9ec5ff}</style></head>
  <body>
    <h1>ParkWise — The Silent Gate</h1>
    <p>API is running. Mini App: <code>${CORS_ORIGIN}</code></p>
    <ul>
      <li><a href="/api/health">/api/health</a></li>
      <li><a href="/api/me">/api/me</a></li>
      <li>POST /api/simulate/rfid — mock hardware</li>
    </ul>
  </body></html>`);
});

server.listen(PORT, () => {
  console.log(`ParkWise backend → http://localhost:${PORT}`);
  console.log(`CORS origin → ${CORS_ORIGIN}`);
  console.log(`MOCK_MQTT → ${process.env.MOCK_MQTT ?? "true"}`);
});
