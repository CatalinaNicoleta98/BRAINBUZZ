import type { Server } from "socket.io";

export function registerSocketHandlers(io: Server) {
  io.on("connection", (socket) => {
    socket.emit("state:sync", {
      message: "Socket layer ready",
      socketId: socket.id,
    });
  });
}
