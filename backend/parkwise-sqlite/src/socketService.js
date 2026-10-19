import { Server } from "socket.io";
import { verifyToken } from "./auth.js";
import { toggleVehicleLock } from "./services/vehicleService.js";

export function createSocketService(httpServer, corsOrigin) {
  const io = new Server(httpServer, {
    cors: {
      origin: corsOrigin?.split(",").map((s) => s.trim()) ?? "*",
      methods: ["GET", "POST"],
    },
  });

  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.query?.token ||
      null;
    const payload = verifyToken(token);
    if (!payload?.sub) {
      return next(new Error("UNAUTHORIZED"));
    }
    socket.data.auth = {
      userId: payload.sub,
      zaloUserId: payload.zaloUserId,
      vehicleId: payload.vehicleId,
    };
    return next();
  });

  io.on("connection", (socket) => {
    const auth = socket.data.auth;
    console.log(`[socket] connected ${socket.id} user=${auth.zaloUserId}`);

    if (auth.zaloUserId) socket.join(String(auth.zaloUserId));
    if (auth.vehicleId) socket.join(`vehicle:${auth.vehicleId}`);
    socket.emit("joined", {
      zaloUserId: auth.zaloUserId,
      vehicleId: auth.vehicleId,
    });

    socket.on("join", ({ zaloUserId, vehicleId } = {}) => {
      // Rooms already set from JWT; allow extra joins only for same user
      if (zaloUserId && zaloUserId === auth.zaloUserId) {
        socket.join(String(zaloUserId));
      }
      if (vehicleId && vehicleId === auth.vehicleId) {
        socket.join(`vehicle:${vehicleId}`);
      }
      socket.emit("joined", {
        zaloUserId: auth.zaloUserId,
        vehicleId: auth.vehicleId,
      });
    });

    socket.on("toggle-lock", async ({ locked } = {}) => {
      try {
        await toggleVehicleLock({
          vehicleId: auth.vehicleId,
          locked,
          io,
        });
      } catch (error) {
        console.error("[socket] toggle-lock failed", error);
        socket.emit("gate-alert", error.message || "Failed to toggle lock");
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
