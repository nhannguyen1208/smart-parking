import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { env } from "../config/env.js";
import { UserRole } from "../types/enums.js";
import { TOKEN_COOKIE, verifyToken } from "../utils/jwt.js";
import { setParkingSocketBus } from "./parking.service.js";

function tokenFromHandshake(socket: {
  handshake: { auth?: Record<string, unknown>; headers: { cookie?: string } };
}) {
  const authToken = socket.handshake.auth?.token;
  if (typeof authToken === "string" && authToken) return authToken;

  const cookieHeader = socket.handshake.headers.cookie || "";
  for (const part of cookieHeader.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === TOKEN_COOKIE) return rest.join("=");
  }
  return "";
}

export function createSocketServer(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN.split(",").map((s) => s.trim()),
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const raw = tokenFromHandshake(socket);
      if (!raw) {
        socket.data.role = "ANON";
        return next();
      }
      const payload = verifyToken(raw);
      socket.data.userId = payload.sub;
      socket.data.role = payload.role;
      return next();
    } catch {
      socket.data.role = "ANON";
      return next();
    }
  });

  io.on("connection", (socket) => {
    const role = socket.data.role as string;
    const userId = socket.data.userId as string | undefined;

    if (userId) socket.join(`user:${userId}`);
    if (role === UserRole.GUARD || role === UserRole.ADMIN) {
      socket.join("guards");
    }
    if (role === UserRole.ADMIN) {
      socket.join("admins");
    }
    socket.join("capacity");
    socket.emit("connected", { role, userId: userId ?? null });
  });

  setParkingSocketBus({
    emitToGuards: (event, payload) => io.to("guards").emit(event, payload),
    emitToAdmins: (event, payload) => io.to("admins").emit(event, payload),
    emitToUser: (uid, event, payload) => io.to(`user:${uid}`).emit(event, payload),
    emitCapacity: (payload) =>
      io.to("capacity").emit("parking:capacity-updated", payload),
  });

  return io;
}
