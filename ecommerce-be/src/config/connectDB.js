import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

// SSL chỉ bật khi deploy (Railway/Render), tắt khi chạy Docker local
const useSSL = process.env.DB_SSL === "true";

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: "mysql",
    logging: false,
    ...(useSSL && {
      dialectOptions: {
        ssl: {
          rejectUnauthorized: false,
        },
      },
    }),
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
