import mqtt from "mqtt";
import { findUserByZaloId, findVehicleByRfid, pushEvent } from "./db.js";
import { notifyGateSuccess } from "./zaloNotify.js";

const ENTRY_TOPIC = process.env.MQTT_TOPIC_ENTRY ?? "parking/gate/entry";
const EXIT_TOPIC = process.env.MQTT_TOPIC_EXIT ?? "parking/gate/exit";
const GATE_CMD_TOPIC = process.env.MQTT_TOPIC_GATE_CMD ?? "parking/gate/command";

/**
 * MQTT bridge for RFID readers / gate controllers.
 * When MOCK_MQTT=true (default), we keep an in-process mock broker API
 * so the MVP runs without Mosquitto installed.
 */
export function createMqttService({ onGateEvent, io }) {
  const mockMode = String(process.env.MOCK_MQTT ?? "true") === "true";
  let client = null;
  const listeners = new Set();

  function emitLocal(topic, payload) {
    for (const listener of listeners) listener(topic, payload);
  }

  function broadcastGate(event) {
    onGateEvent?.(event);
    io?.emit("gate:event", event);
    if (event.message) io?.emit("gate-alert", event.message);
  }

  async function handleRfidMessage(topic, raw) {
    let payload;
    try {
      payload = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
      payload = { rfidTag: String(raw) };
    }

    const rfidTag = payload.rfidTag ?? payload.tag ?? payload.uid;
    if (!rfidTag) {
      console.warn("[mqtt] RFID message missing rfidTag", payload);
      return;
    }

    const direction = topic.includes("exit") ? "EXIT" : "ENTRY";
    const vehicle = await findVehicleByRfid(rfidTag);

    if (!vehicle) {
      const event = await pushEvent({
        type: "RFID_UNKNOWN",
        direction,
        rfidTag,
        message: "Unknown RFID tag at gate",
      });
      broadcastGate(event);
      return;
    }

    if (vehicle.locked) {
      const event = await pushEvent({
        type: "RFID_IGNORED_LOCKED",
        direction,
        rfidTag,
        vehicleId: vehicle.id,
        plate: vehicle.plate,
        message: `Kill-Switch active — ignored ${direction} for ${vehicle.plate}`,
      });
      broadcastGate(event);
      if (vehicle.zaloUserId) {
        io?.to(vehicle.zaloUserId).emit("vehicle:lock-block", event);
        io?.to(vehicle.zaloUserId).emit("gate-alert", event.message);
      }
      console.log(`[mqtt] ignored locked vehicle ${vehicle.plate}`);
      return;
    }

    publish(GATE_CMD_TOPIC, {
      action: "OPEN",
      gate: direction === "ENTRY" ? "entry" : "exit",
      vehicleId: vehicle.id,
      plate: vehicle.plate,
      reason: "RFID_AUTHORIZED",
    });

    const event = await pushEvent({
      type: direction === "ENTRY" ? "VEHICLE_ENTERED" : "VEHICLE_EXITED",
      direction,
      rfidTag,
      vehicleId: vehicle.id,
      plate: vehicle.plate,
      ownerName: vehicle.ownerName,
      zaloUserId: vehicle.zaloUserId,
      message:
        direction === "ENTRY"
          ? `Vehicle ${vehicle.plate} entered campus`
          : `Vehicle ${vehicle.plate} has exited`,
    });

    broadcastGate(event);

    let user = null;
    if (vehicle.zaloUserId) {
      try {
        user = await findUserByZaloId(vehicle.zaloUserId);
      } catch (err) {
        console.warn("[mqtt] load user for notify failed", err.message);
      }
    }

    try {
      await notifyGateSuccess({
        io,
        direction,
        vehicle,
        user: user || {
          zaloUserId: vehicle.zaloUserId,
          displayName: vehicle.ownerName,
        },
      });
    } catch (err) {
      console.error("[mqtt] zalo notify failed", err);
      if (vehicle.zaloUserId) {
        io?.to(vehicle.zaloUserId).emit("gate:notification", event);
        io?.to(vehicle.zaloUserId).emit("gate-alert", event.message);
      }
    }
  }

  function publish(topic, payload) {
    const message = JSON.stringify(payload);
    if (client?.connected) {
      client.publish(topic, message);
    } else {
      console.log(`[mqtt:mock-publish] ${topic} ${message}`);
      emitLocal(topic, payload);
    }
  }

  function connect() {
    if (mockMode) {
      console.log("[mqtt] MOCK_MQTT=true — using in-process mock (no broker required)");
      listeners.add((topic, payload) => {
        if (topic === ENTRY_TOPIC || topic === EXIT_TOPIC) {
          handleRfidMessage(topic, payload).catch((err) =>
            console.error("[mqtt] handle failed", err),
          );
        }
      });
      return;
    }

    const url = process.env.MQTT_URL ?? "mqtt://127.0.0.1:1883";
    client = mqtt.connect(url, {
      reconnectPeriod: 2000,
      clientId: `parkwise-backend-${Math.random().toString(16).slice(2, 8)}`,
    });

    client.on("connect", () => {
      console.log(`[mqtt] connected to ${url}`);
      client.subscribe([ENTRY_TOPIC, EXIT_TOPIC], (err) => {
        if (err) console.error("[mqtt] subscribe failed", err);
        else console.log(`[mqtt] subscribed to ${ENTRY_TOPIC}, ${EXIT_TOPIC}`);
      });
    });

    client.on("message", (topic, buf) => {
      handleRfidMessage(topic, buf.toString("utf8")).catch((err) =>
        console.error("[mqtt] handle failed", err),
      );
    });

    client.on("error", (err) => {
      console.error("[mqtt] error", err.message);
    });
  }

  function injectRfid({ rfidTag, direction = "ENTRY" }) {
    const topic = direction === "EXIT" ? EXIT_TOPIC : ENTRY_TOPIC;
    const payload = { rfidTag, ts: Date.now() };
    if (client?.connected) {
      client.publish(topic, JSON.stringify(payload));
      return;
    }
    handleRfidMessage(topic, payload).catch((err) =>
      console.error("[mqtt] inject failed", err),
    );
  }

  return {
    connect,
    publish,
    injectRfid,
    topics: { ENTRY_TOPIC, EXIT_TOPIC, GATE_CMD_TOPIC },
  };
}
