import { io } from "socket.io-client";

export const socket = io("http://localhost:5004", {
  transports: ["websocket"],
  reconnection: true,
});
