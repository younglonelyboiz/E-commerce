import express from "express";
import cors from "cors";
import morgan from "morgan";
import initApiRoutes from "./routes/api.js";
import cookieParser from "cookie-parser";

const app = express();
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

initApiRoutes(app);

export default app;
