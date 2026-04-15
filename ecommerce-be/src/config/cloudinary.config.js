import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import dotenv from "dotenv";

dotenv.config();

// 1. Cấu hình xác thực với Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2. Cấu hình nơi lưu trữ (Storage) cho Multer
// Lưu ý: Để sử dụng folder khác nhau, có thể tạo uploadCloud với params khác
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "dienmay_chat", // Tên thư mục sẽ chứa ảnh chat trên Cloudinary (có thể override khi cần)
    allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"], // Các định dạng cho phép
    // Bạn có thể thêm transformation ở đây nếu muốn tự động resize ảnh
  },
});

// 3. Tạo middleware upload
const uploadCloud = multer({ storage: storage });

export default uploadCloud;
