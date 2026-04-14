import jwt from "jsonwebtoken";

// Hàm tạo Token (Dùng lại ở Login/Register nếu cần)
const createJWT = (payload) => {
  let key = process.env.JWT_SECRET;
  let token = null;
  try {
    token = jwt.sign(payload, key, {
      expiresIn: process.env.JWT_EXPIRES_IN || "1h",
    });
  } catch (err) {
    console.log(">>> JWT Error:", err);
  }
  return token;
};

// Middleware kiểm tra xem người dùng đã đăng nhập chưa
// src/middleware/JWTAction.js
const checkUserJWT = (req, res, next) => {
  // 1. Lấy token từ Cookie (Ưu tiên)
  let token = req.cookies?.access_token;

  // 2. Nếu không có cookie, lấy từ Header Authorization
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(" ");
    if (parts.length === 2 && parts[0] === "Bearer") {
      token = parts[1]; // Lấy đúng chuỗi Token
    } else {
      token = parts[0]; // Đề phòng trường hợp gửi token trực tiếp không có chữ Bearer
    }
  }

  if (!token) {
    return res.status(401).json({
      EC: -1,
      EM: "Bạn chưa đăng nhập. Vui lòng đăng nhập để tiếp tục!",
      DT: "",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.log(">>> JWT Verify Error:", err.message);
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        EC: -2,
        EM: "Phiên đăng nhập đã hết hạn!",
        DT: "",
      });
    } else {
      return res.status(401).json({
        EC: -3,
        EM: "Token không hợp lệ!",
        DT: "",
      });
    }
  }
};

const checkAdminRole = (req, res, next) => {
  // req.user đã được nạp từ middleware checkUserJWT trước đó
  if (req.user && req.user.roles) {
    // Chuyển tất cả role trong mảng sang chữ Hoa để so sánh cho chắc
    const isAdmin = req.user.roles.some(
      (role) => role.toUpperCase() === "ADMIN",
    );

    if (isAdmin) {
      next(); // Là Admin thì cho đi tiếp
    } else {
      return res.status(403).json({
        EC: -1,
        EM: "Bạn không có quyền truy cập vào tài nguyên này!",
        DT: "",
      });
    }
  } else {
    return res.status(403).json({
      EC: -1,
      EM: "Không tìm thấy thông tin phân quyền!",
      DT: "",
    });
  }
};
export { createJWT, checkUserJWT, checkAdminRole };
