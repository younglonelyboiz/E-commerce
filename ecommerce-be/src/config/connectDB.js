import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306, // Đổi default về 3306 cho chuẩn MySQL/Railway
    dialect: "mysql",
    logging: false,
    dialectOptions: {
      ssl: {
        // minVersion: "TLSv1.2", // Có thể comment dòng này nếu không cần thiết
        rejectUnauthorized: false, // <--- SỬA THÀNH FALSE LÀ ĂN NGAY
      },
    },
  },
);

const connection = async () => {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};

export default connection;
