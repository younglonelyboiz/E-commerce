import { Sequelize } from "sequelize";
import initModels from "./init-models.js";
import dotenv from "dotenv";

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
    // Railway dùng port lẻ (ví dụ 34215), Đức nhớ điền DB_PORT trên Render nhé
    port: process.env.DB_PORT || 3306,
    logging: false,
    dialectOptions: {
      ssl: {
        // PHẢI LÀ FALSE thì Railway mới cho kết nối từ Render vào
        rejectUnauthorized: false,
      },
    },
  },
);

const db = initModels(sequelize);

export default {
  ...db,
  sequelize,
};
