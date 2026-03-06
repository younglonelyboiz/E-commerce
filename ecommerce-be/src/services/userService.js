import brcypt from "bcrypt";
import db from "../models/index.js";
import { Op } from "sequelize";

const salt = 10;

const checkUserEmail = async (email) => {
  try {
    const user = await db.users.findOne({
      where: {
        email: email,
      },
    });
    return user;
  } catch (error) {
    console.error("Error checking user email:", error);
    return null;
  }
};

export const createUser = async (userData) => {
  try {
    if (!checkUserEmail(userData.email)) {
      return {
        EM: "Email is already in use",
        EC: 1,
        DT: null,
      };
    }
    const hashedPassword = await brcypt.hash(userData.password, salt);
    const data = {
      email: userData.email,
      passwordHash: hashedPassword,
      userName: userData.user_name,
    };
    const user = await db.users.create({
      ...data,
    });
    return {
      EM: "User created successfully",
      EC: 0,
      DT: user,
    };
  } catch (error) {
    console.error("Error creating user:", error);
    return {
      EM: "Error creating user",
      EC: -1,
      DT: null,
    };
  }
};
