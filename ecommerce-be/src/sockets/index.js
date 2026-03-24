import userHandler from "./userHandler.js";
import adminHandler from "./adminHandler.js";
import paymentHandler from "./paymentHandler.js";
import jwt from "jsonwebtoken";

const initSocket = (io) => {
  // Middleware xác thực JWT cho Socket
  io.use((socket, next) => {
    try {
      let token = null;

      // Đọc trực tiếp Token từ Cookie tự động gửi lên của trình duyệt
      if (socket.request.headers.cookie) {
        const cookieString = socket.request.headers.cookie;
        const match = cookieString.match(
          new RegExp("(^| )access_token=([^;]+)"),
        );
        if (match) {
          token = match[2];
        }
      }

      if (!token) {
        // Nếu không có token (khách chưa đăng nhập), cho qua nhưng không gán user
        return next();
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded; // Gắn thông tin user vào socket
      next();
    } catch (err) {
      console.error("[Socket] Authentication Error:", err.message);
      return next(new Error("Authentication error: Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // TỰ ĐỘNG GÁN PHÒNG TỪ BE MÀ KHÔNG CẦN CHỜ FE
    if (socket.user) {
      const isAdmin =
        socket.user.roles &&
        socket.user.roles.some((role) => role.toUpperCase() === "ADMIN");
      if (isAdmin) {
        socket.join("admin_group");
        console.log(
          `[Socket] Admin (ID: ${socket.user.id}) auto-joined room: admin_group`,
        );
      } else {
        const roomName = `customer_${socket.user.id}`;
        socket.join(roomName);
        console.log(
          `[Socket] User (ID: ${socket.user.id}) auto-joined room: ${roomName}`,
        );
      }
    }

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
