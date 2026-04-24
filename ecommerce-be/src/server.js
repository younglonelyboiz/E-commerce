import app from "./app.js";
import connection from "./config/connectDB.js";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import { Op } from "sequelize";
import db from "./models/index.js";
import { updateOrderStatusService } from "./services/orderService.js";
import initSocket from "./sockets/index.js";

dotenv.config();

const PORT = process.env.PORT || 8080;
const HOST = "0.0.0.0"; // Lắng nghe trên tất cả các giao diện mạng

connection();

// 1. Khởi tạo HTTP Server bọc Express App
const server = http.createServer(app);

// 2. Khởi tạo Socket.io với cấu hình CORS đồng nhất với app.js
const io = new Server(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL,
      "https://e-commerce-fe-hmfd.onrender.com",
      "https://e-commerce-fe-hmfd.onrender.com/",
      "http://localhost:5173",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  },
});

// 3. Nhúng biến `io` vào Express App để sử dụng ở mọi Controller (như paymentController)
app.set("io", io);

// 4. Khởi tạo toàn bộ luồng sự kiện Socket (Chat, Payment...)
// Truyền trực tiếp instance `io` sang thư mục sockets quản lý
initSocket(io);

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
server.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});
