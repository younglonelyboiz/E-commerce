import db from "../models/index.js";
import bcrypt from "bcryptjs";
import { createJWT } from "../middlewares/JWTAction.js";
import axios from "axios";
import crypto from "crypto";
import { URLSearchParams } from "url";

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
        id: payload.id,
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

const generateGoogleAuthUrlService = () => {
  const state = crypto.randomBytes(16).toString("hex"); // Tạo state ngẫu nhiên

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams(
    {
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      response_type: "code",
      scope:
        "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
      access_type: "offline", // Để nhận refresh_token
      prompt: "consent", // Luôn hỏi người dùng cấp quyền
      state: state,
    },
  ).toString()}`;

  return { EC: 0, EM: "OK", DT: { googleAuthUrl, state } };
};

const handleGoogleCallbackService = async (
  code,
  receivedState,
  storedState,
) => {
  // 1. Kiểm tra state để chống CSRF
  if (receivedState !== storedState) {
    return {
      EC: 1,
      EM: "State không hợp lệ. Có thể là tấn công CSRF!",
      DT: "",
    };
  }

  try {
    // 2. Đổi code lấy tokens
    const tokenResponse = await axios.post(
      "https://oauth2.googleapis.com/token",
      new URLSearchParams({
        code: code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );

    const { access_token, id_token, refresh_token } = tokenResponse.data;

    // 3. Lấy thông tin người dùng từ Google
    const userInfoResponse = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      },
    );
    const googleUser = userInfoResponse.data;

    // 4. Xử lý logic Database: Tìm hoặc tạo người dùng
    let user = await db.users.findOne({
      where: { email: googleUser.email },
      include: [
        {
          model: db.roles,
          as: "roles",
          attributes: ["id", "name", "slug"],
          through: { attributes: [] },
          include: [
            {
              model: db.permissions,
              as: "permissions",
              attributes: ["id", "name", "slug", "url", "method"],
              through: { attributes: [] },
            },
          ],
        },
      ],
    });

    if (!user) {
      // Tạo người dùng mới nếu chưa tồn tại
      user = await db.users.create({
        email: googleUser.email,
        user_name: googleUser.name,
        // Bạn có thể lưu thêm google_id, avatar_url nếu cần
        // password_hash: null (vì đăng nhập bằng Google)
      });
      // Gán role mặc định cho người dùng mới (ví dụ: 'customer')
      const defaultRole = await db.roles.findOne({
        where: { slug: "customer" },
      });
      if (defaultRole) {
        await user.addRole(defaultRole);
        user.roles = [defaultRole]; // Cập nhật roles cho đối tượng user hiện tại
      }
    }

    // 5. Chuẩn bị Payload và tạo JWT của ứng dụng
    const roles = user.roles.map((item) => item.slug.toUpperCase());
    let permissions = [];
    user.roles.forEach((role) => {
      if (role.permissions)
        role.permissions.forEach((p) =>
          permissions.push({ url: p.url, method: p.method }),
        );
    });
    const payload = {
      id: user.id,
      email: user.email,
      userName: user.user_name,
      roles,
      permissions,
    };
    const appToken = createJWT(payload);

    return {
      EC: 0,
      EM: "Đăng nhập Google thành công!",
      DT: {
        id: user.id,
        access_token: appToken,
        userName: user.user_name,
        roles,
        email: user.email,
      },
    };
  } catch (error) {
    console.error(
      ">>> Google OAuth Error:",
      error.response?.data || error.message,
    );
    return {
      EC: -1,
      EM: "Đăng nhập Google thất bại. Vui lòng thử lại!",
      DT: "",
    };
  }
};

export { loginUser, generateGoogleAuthUrlService, handleGoogleCallbackService };
