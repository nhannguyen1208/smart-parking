import { io } from "socket.io-client";
import { getToken } from "./auth";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5050";

let socket;

export function getSocket() {
  if (!socket) {
    socket = io(API_URL, {
      autoConnect: false,
      transports: ["websocket", "polling"],
      auth: (cb) => cb({ token: getToken() }),
    });
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  s.auth = { token: getToken() };
  if (!s.connected) s.connect();
  else s.emit("join", {});
  return s;
}

export function disconnectSocket() {
  if (socket?.connected) socket.disconnect();
}
