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
const checkUserJWT = (req, res, next) => {
  // 1. Lấy token từ header "Authorization: Bearer <token>"
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      EC: -1,
      EM: "Bạn chưa đăng nhập. Vui lòng đăng nhập để tiếp tục!",
      DT: "",
    });
  }

  try {
    // 2. Xác thực token
    let decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Lưu thông tin user vào request để các hàm sau sử dụng
    next(); // Cho phép đi tiếp sang Controller
  } catch (err) {
    return res.status(401).json({
      EC: -1,
      EM: "Phiên đăng nhập đã hết hạn hoặc không hợp lệ!",
      DT: "",
    });
  }
};

export { createJWT, checkUserJWT };
