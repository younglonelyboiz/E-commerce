import app from "./app.js";
import connection from "./config/connectDB.js";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import { Op } from "sequelize";
import db from "./models/index.js";
import { updateOrderStatusService } from "./services/orderService.js";

dotenv.config();

const PORT = process.env.PORT || 8080;

connection();

// 1. Khởi tạo HTTP Server bọc Express App
const server = http.createServer(app);

// 2. Khởi tạo Socket.io với cấu hình CORS đồng nhất với app.js
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  },
});

// 3. Nhúng biến `io` vào Express App để sử dụng ở mọi Controller (như paymentController)
app.set("io", io);

// 4. Lắng nghe các sự kiện kết nối Socket
io.on("connection", (socket) => {
  console.log("Client connected socket ID:", socket.id);

  socket.on("join_order", (orderCode) => {
    socket.join(orderCode);
    console.log(` Socket [${socket.id}] joined room order: ${orderCode}`);
  });

  socket.on("disconnect", () => {
    console.log(" Client disconnected:", socket.id);
  });
});

// 5. Cronjob: Tự động hủy đơn quá 24h (Chạy ngầm mỗi 1 tiếng)
setInterval(async () => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const expiredOrders = await db.orders.findAll({
      where: {
        payment_method: "BANK",
        payment_status: "pending",
        order_status: "pending", // Chỉ hủy đơn đang chờ
        order_date: {
          [Op.lt]: oneDayAgo,
        },
      },
    });

    for (const order of expiredOrders) {
      // Gọi lại hàm hủy đơn -> Tự động hoàn kho!
      await updateOrderStatusService(
        order.id,
        "cancelled",
        "Hệ thống tự động hủy: Quá hạn thanh toán 24h",
      );
      console.log(`[Auto-Cancel] Hủy tự động đơn hàng ${order.code}`);
    }
  } catch (error) {
    console.error("[Auto-Cancel] Lỗi quét đơn quá hạn:", error);
  }
}, 60 * 60 * 1000);

// 6. Chạy ứng dụng bằng server.listen thay vì app.listen
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
