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
    // TiDB Serverless dùng port 4000, mặc định 3306 sẽ bị từ chối
    port: process.env.DB_PORT || 4000,
    logging: false,
    /* ĐOẠN NÀY LÀ CỨU CÁNH CỦA ĐỨC */
    dialectOptions: {
      // CHỈ BẬT SSL KHI CHẠY TRÊN RENDER (PRODUCTION)
      ssl:
        process.env.NODE_ENV === "production"
          ? {
              minVersion: "TLSv1.2",
              rejectUnauthorized: true,
            }
          : false, // Ở local thì tắt đi
    },
  },
);

const db = initModels(sequelize);

export default {
  ...db,
  sequelize,
};
