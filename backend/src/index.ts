import http from "node:http";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase } from "./db/connect.js";
import { startMqttBridge } from "./services/mqtt.service.js";
import { createSocketServer } from "./services/socket.service.js";

async function start() {
  await connectDatabase();
  const app = createApp();
  const server = http.createServer(app);
  createSocketServer(server);
  startMqttBridge();

  server.listen(env.PORT, () => {
    console.log(`VNUK ParkWise API → http://localhost:${env.PORT}`);
    console.log(`DEMO_MODE → ${env.DEMO_MODE}`);
    console.log(`MQTT_ENABLED → ${env.MQTT_ENABLED}`);
  });
}

start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
