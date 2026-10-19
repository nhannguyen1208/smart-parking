import mqtt, { type MqttClient } from "mqtt";
import { z } from "zod";
import { env, isDemoMode } from "../config/env.js";
import { GateEventSource } from "../types/enums.js";
import { processGateEvent } from "./parking.service.js";

const gateEventSchema = z.object({
  schemaVersion: z.literal(1),
  eventId: z.string().min(8).max(128),
  gateId: z.string().min(1),
  lotId: z.string().optional(),
  eventType: z.enum(["ENTRY", "EXIT"]),
  credentialRef: z.string().optional(),
  plateNumber: z.string().optional(),
  occurredAt: z.string().datetime().optional(),
  source: z.enum(["REAL_DEVICE", "MQTT", "DEMO", "MANUAL"]).optional(),
});

let client: MqttClient | null = null;

export function startMqttBridge() {
  if (!env.MQTT_ENABLED) {
    console.log(
      "[mqtt] MQTT_ENABLED=false — DEMO mode: use Guard/Admin simulate scan (no broker required)",
    );
    return null;
  }

  const options: mqtt.IClientOptions = {
    clientId: `${env.MQTT_CLIENT_ID}-${Math.random().toString(16).slice(2, 6)}`,
    reconnectPeriod: 3000,
  };
  if (env.MQTT_USERNAME) {
    options.username = env.MQTT_USERNAME;
    options.password = env.MQTT_PASSWORD;
  }

  client = mqtt.connect(env.MQTT_URL, options);

  client.on("connect", () => {
    console.log(`[mqtt] connected to ${env.MQTT_URL}`);
    client?.subscribe("parkwise/v1/gates/+/events", (err) => {
      if (err) console.error("[mqtt] subscribe failed", err.message);
      else console.log("[mqtt] subscribed parkwise/v1/gates/+/events");
    });
    client?.subscribe("parkwise/v1/gates/+/heartbeat");
  });

  client.on("message", async (topic, buf) => {
    try {
      if (topic.includes("/heartbeat")) return;
      const raw = JSON.parse(buf.toString("utf8"));
      const parsed = gateEventSchema.safeParse(raw);
      if (!parsed.success) {
        console.warn("[mqtt] invalid payload rejected", parsed.error.flatten());
        return;
      }
      const p = parsed.data;
      // credentialRef is expected to be a tokenized/demo raw tag for lookup in DEMO
      await processGateEvent({
        eventId: p.eventId,
        gateCode: p.gateId,
        eventType: p.eventType,
        credentialRaw: p.credentialRef,
        plateNumber: p.plateNumber,
        occurredAt: p.occurredAt,
        source: (p.source as GateEventSource) || GateEventSource.MQTT,
      });
    } catch (error) {
      console.error("[mqtt] handle failed", error);
    }
  });

  client.on("error", (err) => {
    console.error("[mqtt] error", err.message);
    if (isDemoMode()) {
      console.warn("[mqtt] continuing — use DEMO simulate scan if broker unavailable");
    }
  });

  return client;
}

export function publishGateCommand(gateCode: string, command: unknown) {
  if (!client?.connected) {
    console.log(`[mqtt:demo-command] ${gateCode}`, command);
    return;
  }
  client.publish(
    `parkwise/v1/gates/${gateCode}/commands`,
    JSON.stringify(command),
  );
}
