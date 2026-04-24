import brcypt from "bcrypt";
import db from "../models/index.js";
import { Op, literal, col } from "sequelize";

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
    const isEmailAvailable = await checkUserEmail(userData.email);
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
      password_hash: hashedPassword,
      user_name: userData.user_name,
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

// service/userService.js
export const getUserDetailWithOrders = async (userId) => {
  try {
    let data = await db.users.findOne({
      where: { id: userId },
      attributes: ["id", "email", "user_name", "active"],
      include: [
        // 1. LẤY THÔNG TIN ROLES
        {
          model: db.roles,
          as: "roles",
          attributes: ["id", "name", "description"],
          through: { attributes: [] },
        },
        // 2. LẤY THÔNG TIN ORDERS VÀ PRODUCTS
        {
          model: db.orders,
          as: "orders",
          attributes: [
            "id",
            "code",
            "grand_total",
            "order_date",
            "payment_status",
            "order_status",
          ],
          include: [
            {
              model: db.order_products,
              as: "order_products",
              attributes: ["name", "price", "quantity", "subtotal"],
            },
          ],
        },
      ],
      // Sắp xếp đơn hàng mới nhất lên đầu
      order: [[{ model: db.orders, as: "orders" }, "order_date", "DESC"]],
    });

    if (data) {
      return { EM: "Lấy chi tiết thành công", EC: 0, DT: data };
    }
    return { EM: "Không tìm thấy user", EC: 1, DT: [] };
  } catch (e) {
    console.log(">>> Error tại Service:", e);
    return { EM: "Lỗi server", EC: -1, DT: [] };
  }
};

export const getUserWithPagination = async (page, limit, filters) => {
  try {
    const { search, sortBy, sortOrder } = filters;
    let offset = (page - 1) * limit;

    let whereUser = {};
    if (search) {
      whereUser[Op.or] = [
        { email: { [Op.like]: `%${search}%` } },
        { user_name: { [Op.like]: `%${search}%` } },
      ];
    }

    // Thiết lập logic sắp xếp (Mặc định là id DESC)
    let orderStrategy = [["id", "DESC"]];
    if (sortBy === "totalSpent") {
      orderStrategy = [[literal("totalSpent"), sortOrder || "DESC"]];
    } else if (sortBy === "role") {
      // Sắp xếp theo tên của Role trong bảng Join
      orderStrategy = [[col("roles.name"), sortOrder || "ASC"]];
    }

    const { count, rows } = await db.users.findAndCountAll({
      where: whereUser,
      offset: offset,
      limit: limit,
      attributes: [
        "id",
        "email",
        "user_name",
        "active",
        // Tính tổng chi tiêu trực tiếp bằng SQL Subquery
        [
          literal(`(
            SELECT COALESCE(SUM(grand_total), 0)
            FROM orders
            WHERE orders.user_id = users.id
          )`),
          "totalSpent",
        ],
      ],
      include: [
        {
          model: db.roles,
          as: "roles",
          attributes: ["id", "name"],
          through: { attributes: [] },
        },
      ],
      distinct: true,
      subQuery: false, // Bắt buộc phải có để Order theo cột ảo/join không bị lỗi
      order: orderStrategy,
    });

    const users = rows.map((user) => user.get({ plain: true }));

    return {
      EM: "Lấy danh sách thành công",
      EC: 0,
      DT: {
        totalRows: count,
        totalPages: Math.ceil(count / limit),
        users: users,
      },
    };
  } catch (e) {
    console.log(">>> Error:", e);
    return { EM: "Lỗi service", EC: -1, DT: "" };
  }
};

export const changePasswordService = async (
  userId,
  oldPassword,
  newPassword,
) => {
  try {
    const user = await db.users.findOne({ where: { id: userId } });
    if (!user) {
      return { EC: 1, EM: "Người dùng không tồn tại!", DT: "" };
    }

    const isCorrectPassword = await brcypt.compare(
      oldPassword,
      user.password_hash,
    );
    if (!isCorrectPassword) {
      return { EC: 1, EM: "Mật khẩu hiện tại không chính xác!", DT: "" };
    }

    const hashedPassword = await brcypt.hash(newPassword, salt);
    await user.update({ password_hash: hashedPassword });

    return { EC: 0, EM: "Đổi mật khẩu thành công!", DT: "" };
  } catch (error) {
    console.error(">>> Error in changePasswordService:", error);
    return { EC: -1, EM: "Lỗi hệ thống", DT: "" };
  }
};
