import express from "express";
import * as chatController from "../controllers/chatController.js";
import { checkUserJWT, checkAdminRole } from "../middlewares/JWTAction.js";
import uploadCloud from "../config/cloudinary.config.js";

const router = express.Router();

// Yêu cầu đăng nhập mới được gọi API Chat
router.all("*", checkUserJWT);

router.get("/unread-count", chatController.getUnreadCount);
router.get("/conversations", checkAdminRole, chatController.getConversations);

// Upload ảnh cho tin nhắn chat
router.post(
  "/upload-image",
  uploadCloud.single("image"),
  chatController.uploadChatImage,
);

export default router;
