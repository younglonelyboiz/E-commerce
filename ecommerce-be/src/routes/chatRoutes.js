import express from "express";
import * as chatController from "../controllers/chatController.js";
import { checkUserJWT, checkAdminRole } from "../middlewares/JWTAction.js";

const router = express.Router();

// Yêu cầu đăng nhập mới được gọi API Chat
router.all("*", checkUserJWT);

router.get("/unread-count", chatController.getUnreadCount);
router.get("/conversations", checkAdminRole, chatController.getConversations);

export default router;
