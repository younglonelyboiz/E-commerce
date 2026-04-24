import { sendResponse } from "../utils/apiResponse.js";
import {
  createUser,
  getUserWithPagination,
  getUserDetailWithOrders,
  changePasswordService,
} from "../services/userService.js";
import {
  loginUser,
  generateGoogleAuthUrlService,
  handleGoogleCallbackService,
} from "../services/authService.js";

const checkValidUserData = (data) => {
  console.log(data);
  if (
    !data.email ||
    !data.password ||
    !data.confirmPassword ||
    !data.user_name
  ) {
    return {
      valid: false,
      message: "Missing required fields",
    };
  }

  if (data.password !== data.confirmPassword) {
    return {
      valid: false,
      message: "Passwords do not match",
    };
  }

  return { valid: true };
};

export const registerNewUser = async (req, res) => {
  console.log("đenadauaudaudu");
  try {
    const userData = req.body;

    const check = checkValidUserData(userData);
    if (!check.valid) {
      return sendResponse(res, 1, check.message, null);
    }

    const data = {
      email: userData.email,
      password: userData.password,
      user_name: userData.user_name,
    };

    const result = await createUser(data);
    return sendResponse(res, result.EC, result.EM, result.DT);
  } catch (error) {
    console.error("Error creating user:", error);
    return sendResponse(res, -1, "Error creating user", null);
  }
};

export const handleLogin = async (req, res) => {
  try {
    let data = await loginUser(req.body);

    if (data && +data.EC === 0) {
      // 1. Đóng gói Cookie
      res.cookie("access_token", data.DT.access_token, {
        httpOnly: true,
        secure: true, // Tạm thời để false để test chắc chắn trên localhost
        maxAge: 3600 * 1000,
        path: "/",
        sameSite: "none",
      });

      // 2. Xóa access_token khỏi dữ liệu trả về để bảo mật tuyệt đối
      // Client (React) chỉ cần thông tin User để hiển thị giao diện
      delete data.DT.access_token;
    }

    return sendResponse(res, data.EC, data.EM, data.DT);
  } catch (error) {
    console.log(error);
    return sendResponse(res, -1, "Internal Server Error", null);
  }
};

export const getUserAccount = async (req, res) => {
  // Middleware checkUserJWT đã giải mã token và lưu vào req.user
  return res.status(200).json({
    EC: 0,
    EM: "Lấy thông tin tài khoản thành công!",
    DT: {
      id: req.user.id,
      email: req.user.email,
      userName: req.user.userName,
      roles: req.user.roles,
    },
  });
};

export const handleLogout = (req, res) => {
  res.clearCookie("access_token", {
    httpOnly: true,
    secure: true,
    path: "/",
    sameSite: "none",
  });
  return sendResponse(res, 0, "Logout successfully", null);
};

export const getUserDetail = async (req, res) => {
  try {
    let id = req.params.id;
    let data = await getUserDetailWithOrders(id);
    return sendResponse(res, data.EC, data.EM, data.DT);
  } catch (e) {
    return sendResponse(res, -1, "error from server", "");
  }
};

export const readUsersAdmin = async (req, res) => {
  try {
    let page = req.query.page || 1;
    let limit = req.query.limit || 15;

    // Lấy các tham số từ Query String
    let filters = {
      search: req.query.search || "",
      sortBy: req.query.sortBy || "id", // 'id', 'role', hoặc 'totalSpent'
      sortOrder: req.query.sortOrder || "DESC", // 'ASC' hoặc 'DESC'
    };

    let data = await getUserWithPagination(+page, +limit, filters);

    return sendResponse(res, data.EC, data.EM, data.DT);
  } catch (e) {
    console.log(">>> Error in readUsersAdmin:", e);
    return sendResponse(res, -1, "Error from server", "");
  }
};

// ==================================================
// GOOGLE OAUTH CONTROLLERS
// ==================================================
export const getGoogleAuthUrl = async (req, res) => {
  try {
    const result = generateGoogleAuthUrlService();
    if (result.EC === 0) {
      // Set Cookie HttpOnly lưu State chống CSRF (Domain BE tự gửi Cookie cho trình duyệt)
      res.cookie("oauth_state", result.DT.state, {
        httpOnly: true,
        secure: true, // Ép lên true vì Render chạy HTTPS
        maxAge: 5 * 60 * 1000,
        path: "/",
        sameSite: "none", // BẮT BUỘC phải là none nếu FE và BE khác domain (Render/Vercel)
      });
      // Trả URL về cho Frontend tự Redirect (Đảm bảo Axios không bị lỗi CORS)
      return sendResponse(res, 0, "OK", result.DT.googleAuthUrl);
    }
    return sendResponse(res, -1, result.EM, null);
  } catch (error) {
    console.error(">>> Error getGoogleAuthUrl:", error);
    return sendResponse(res, -1, "Lỗi server", null);
  }
};

export const handleGoogleCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    const storedState = req.cookies?.oauth_state;
    res.clearCookie("oauth_state"); // Xóa state cũ ngay sau khi lấy ra

    if (!code)
      return res.redirect(
        `${process.env.FRONTEND_URL}/login?error=google_auth_failed`,
      );

    const result = await handleGoogleCallbackService(code, state, storedState);

    if (result.EC === 0) {
      // Đăng nhập thành công -> Set JWT vào Cookie
      res.cookie("access_token", result.DT.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/",
        sameSite: "none",
      });
      console.log(">>> Redirecting to:", process.env.FRONTEND_URL);

      return res.redirect(
        `${process.env.FRONTEND_URL || "https://e-commerce-sbz7.onrender.com"}`,
      );
      return res.redirect(`${process.env.FRONTEND_URL}`); // Chuyển hướng người dùng về trang chủ
    } else {
      return res.redirect(
        `${process.env.FRONTEND_URL}/login?error=${encodeURIComponent(
          result.EM,
        )}`,
      );
    }
  } catch (error) {
    console.error(">>> Error handleGoogleCallback:", error);
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
  }
};

export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return sendResponse(res, 1, "Vui lòng nhập đầy đủ mật khẩu!", "");
    }

    let data = await changePasswordService(userId, oldPassword, newPassword);
    return sendResponse(res, data.EC, data.EM, data.DT);
  } catch (error) {
    console.error(">>> Error in changePassword Controller:", error);
    return sendResponse(res, -1, "Lỗi server", "");
  }
};

export const readUserDetail = async (req, res) => {
  try {
    let id = req.params.id;
    let data = await getUserDetailWithOrders(id);
    return sendResponse(res, data.EC, data.EM, data.DT);
  } catch (e) {
    console.log(">>> Error in readUserDetail:", e);
    return sendResponse(res, -1, "Error from server", "");
  }
};
