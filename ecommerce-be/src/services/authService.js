import db from "../models/index.js";
import bcrypt from "bcryptjs";
import { createJWT } from "../middlewares/JWTAction.js";

const loginUser = async (rawData) => {
  try {
    // 1. Kiểm tra Email tồn tại
    const user = await db.users.findOne({
      where: { email: rawData.email },
      include: [
        {
          model: db.roles,
          as: "roles", // ĐÃ SỬA: Phải khớp với 'as' trong initModels
          attributes: ["id", "name", "slug"],
          through: { attributes: [] }, // Ẩn bảng trung gian user_roles cho sạch data
          include: [
            {
              model: db.permissions,
              as: "permissions", // Lấy luôn danh sách quyền (user.view, product.manage...)
              attributes: ["id", "name", "slug", "url", "method"],
              through: { attributes: [] },
            },
          ],
        },
      ],
    });

    if (!user) {
      return { EC: 1, EM: "Email hoặc mật khẩu không chính xác!", DT: "" };
    }

    // 2. So khớp mật khẩu
    // Lưu ý: Kiểm tra tên cột trong DB của bạn là password hay password_hash nhé!
    const isPasswordCorrect = bcrypt.compareSync(
      rawData.password,
      user.password || user.password_hash,
    );

    if (!isPasswordCorrect) {
      return { EC: 1, EM: "Email hoặc mật khẩu không chính xác!", DT: "" };
    }

    // 3. Chuẩn bị Payload cho Token
    // Lấy danh sách tên Role (ADMIN, USER...)
    const roles = user.roles.map((item) => item.slug.toUpperCase());

    // Gom tất cả permissions của các roles lại thành một mảng phẳng
    let permissions = [];
    user.roles.forEach((role) => {
      if (role.permissions) {
        role.permissions.forEach((p) =>
          permissions.push({
            url: p.url,
            method: p.method,
          }),
        );
      }
    });

    const payload = {
      id: user.id,
      email: user.email,
      userName: user.user_name || user.userName,
      roles: roles,
      permissions: permissions, // Payload đầy đủ để check quyền API
    };

    // 4. Tạo Token
    const token = createJWT(payload);

    return {
      EC: 0,
      EM: "Đăng nhập thành công!",
      DT: {
        access_token: token,
        userName: payload.userName,
        roles: payload.roles,
        email: payload.email,
      },
    };
  } catch (e) {
    console.log(">>> Error login:", e);
    return { EC: -1, EM: "Lỗi hệ thống...", DT: "" };
  }
};

export { loginUser };
