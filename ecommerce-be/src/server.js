import app from "./app.js";
import connection from "./config/connectDB.js";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 8080;

connection();

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
