import { io } from "socket.io-client";

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export const realtimeSocket = io(apiUrl, {
  autoConnect: false,
});
