import { Server } from "socket.io";
import { findVehicleById, setVehicleLocked, pushEvent } from "./db.js";

export function createSocketService(httpServer, corsOrigin) {
  const io = new Server(httpServer, {
    cors: {
      origin: corsOrigin?.split(",").map((s) => s.trim()) ?? "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`[socket] connected ${socket.id}`);

    socket.on("join", ({ zaloUserId, vehicleId }) => {
      if (zaloUserId) {
        socket.join(String(zaloUserId));
        console.log(`[socket] ${socket.id} joined room ${zaloUserId}`);
      }
      if (vehicleId) {
        socket.join(`vehicle:${vehicleId}`);
      }
      socket.emit("joined", { zaloUserId, vehicleId });
    });

    socket.on("toggle-lock", async ({ vehicleId = "veh_001", locked } = {}) => {
      try {
        const vehicle = await findVehicleById(vehicleId);
        if (!vehicle) {
          socket.emit("gate-alert", "Vehicle not found");
          return;
        }

        const nextLocked =
          typeof locked === "boolean" ? locked : !vehicle.locked;
        const updated = await setVehicleLocked(vehicleId, nextLocked);

        const message = nextLocked
          ? `🔒 Kill-Switch ON — ${updated.plate} is secured`
          : `🟢 Kill-Switch OFF — ${updated.plate} ready at the gate`;

        await pushEvent({
          type: nextLocked ? "VEHICLE_LOCKED" : "VEHICLE_UNLOCKED",
          vehicleId,
          message,
        });

        const payload = { vehicle: updated, message };
        io.emit("vehicle:lock-changed", payload);
        io.emit("gate-alert", message);
        if (updated.zaloUserId) {
          io.to(updated.zaloUserId).emit("gate-alert", message);
          io.to(updated.zaloUserId).emit("vehicle:lock-changed", payload);
        }
      } catch (error) {
        console.error("[socket] toggle-lock failed", error);
        socket.emit("gate-alert", "Failed to toggle lock");
      }
    });

    socket.on("ping", () => {
      socket.emit("pong", { at: Date.now() });
    });

    socket.on("disconnect", () => {
      console.log(`[socket] disconnected ${socket.id}`);
    });
  });

  return io;
}
