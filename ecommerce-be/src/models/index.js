import { Sequelize } from "sequelize";
import initModels from "./init-models.js"; // Đảm bảo init-models đã có export default
import dotenv from "dotenv";

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
    port: process.env.DB_PORT || 3306,
    logging: false,
  },
);

const db = initModels(sequelize);

// Quan trọng: Export default ở đây
export default {
  ...db,
  sequelize,
};
