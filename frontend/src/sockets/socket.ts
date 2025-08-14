// src/sockets/socket.ts
import { io } from "socket.io-client";

const socket = io("http://localhost:3001", {
  autoConnect: false, // Do not connect automatically
});

socket.on("connect", () => {
  console.log("🔗 Підключено до Socket.IO сервера. ID:", socket.id);
});

socket.on("disconnect", () => {
  console.log("❌ Відключено від Socket.IO сервера");
});

export default socket;
