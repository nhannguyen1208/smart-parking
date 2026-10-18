import { io } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5050";

let socket;

export function getSocket() {
  if (!socket) {
    socket = io(API_URL, {
      autoConnect: false,
      transports: ["websocket", "polling"],
    });
  }
  return socket;
}

export function connectSocket({ zaloUserId, vehicleId }) {
  const s = getSocket();
  if (!s.connected) s.connect();
  s.emit("join", { zaloUserId, vehicleId });
  return s;
}
