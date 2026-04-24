import express from "express";
import cors from "cors";
import morgan from "morgan";
import initApiRoutes from "./routes/api.js";
import cookieParser from "cookie-parser";

const app = express();
app.use(cookieParser());

//  Normalize origins: xóa trailing slash
const normalizeOrigin = (origin) => {
  if (!origin) return "";
  return origin.replace(/\/$/, "").trim(); // Xóa dấu / cuối + khoảng trắng
};

const allowedOrigins = [
  "http://localhost:5173",
  "https://e-commerce-fe-hmfd.onrender.com", // ← Xóa dấu /
  process.env.FRONTEND_URL,
]
  .filter(Boolean)
  .map(normalizeOrigin);

console.log(" Allowed CORS Origins:", allowedOrigins);

app.use(
  cors({
    origin: function (origin, callback) {
      // Normalize origin từ request
      const normalizedOrigin = normalizeOrigin(origin);

      // Kiểm tra origin có trong whitelist không
      if (!origin || allowedOrigins.includes(normalizedOrigin)) {
        callback(null, true);
      } else {
        console.warn(" CORS blocked:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

initApiRoutes(app);

export default app;
