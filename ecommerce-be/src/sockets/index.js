import userHandler from "./userHandler.js";
import adminHandler from "./adminHandler.js";
import paymentHandler from "./paymentHandler.js";

const initSocket = (io) => {
  // Middleware xác thực JWT cho Socket (Sẽ implement sau)
  // io.use((socket, next) => { ... });

  io.on("connection", (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Phân luồng xử lý sự kiện
    paymentHandler(io, socket);
    userHandler(io, socket);
    adminHandler(io, socket);

    socket.on("disconnect", () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });
};

export default initSocket;
