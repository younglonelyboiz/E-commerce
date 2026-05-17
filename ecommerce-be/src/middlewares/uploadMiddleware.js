import uploadCloud from "../config/cloudinary.config.js";

/**
 * Middleware xử lý upload ảnh (Cloudinary).
 * Bắt lỗi Multer/Cloudinary trả về chuẩn {EC, EM, DT} thay vì crash server.
 */
const handleImageUpload = (req, res, next) => {
  uploadCloud.any()(req, res, (err) => {
    if (err) {
      console.error(">>> [Upload Error]:", err);
      return res.status(500).json({
        EC: -1,
        EM: "Lỗi upload ảnh: " + (err.message || "Cloudinary error"),
        DT: err,
      });
    }
    next();
  });
};

export default handleImageUpload;
