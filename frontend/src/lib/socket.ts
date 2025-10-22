import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_API_BASE?.replace("/api", "") ||
  "http://localhost:5004";   // must match backend port

export const socket = io(SOCKET_URL, {
  transports: ["websocket"],  // skip polling if needed
  withCredentials: false,
});
