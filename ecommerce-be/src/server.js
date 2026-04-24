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
const HOST = "0.0.0.0";

connection();

const server = http.createServer(app);

//  Normalize origins function
const normalizeOrigin = (origin) => {
  if (!origin) return "";
  return origin.replace(/\/$/, "").trim();
};

const allowedOrigins = [
  "http://localhost:5173",
  "https://e-commerce-fe-hmfd.onrender.com", // ← Xóa dấu /
  process.env.FRONTEND_URL,
]
  .filter(Boolean)
  .map(normalizeOrigin);

const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      const normalizedOrigin = normalizeOrigin(origin);
      if (!origin || allowedOrigins.includes(normalizedOrigin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowEIO3: true, //  Support cả EIO3 và EIO4
  },
});

app.set("io", io);

initSocket(io);

// 5. Cronjob
setInterval(async () => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const expiredOrders = await db.orders.findAll({
      where: {
        payment_method: "BANK",
        payment_status: "pending",
        order_status: "pending",
        order_date: {
          [Op.lt]: oneDayAgo,
        },
      },
    });

    for (let order of expiredOrders) {
      await updateOrderStatusService(order.code, "cancelled");
    }
  } catch (error) {
    console.error(">>> Cronjob Error:", error);
  }
}, 60 * 60 * 1000);

server.listen(PORT, HOST, () => {
  console.log(` Server running at http://${HOST}:${PORT}`);
  console.log(` Socket.io listening on ws://${HOST}:${PORT}`);
  console.log(` Allowed CORS Origins:`, allowedOrigins);
});
