import express from "express";
import cors from "cors";
import morgan from "morgan";
import initApiRoutes from "./routes/api.js";

const app = express();

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
