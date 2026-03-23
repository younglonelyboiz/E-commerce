import db from "../models/index.js";
import { Op } from "sequelize";

// TODO: Triển khai các hàm xử lý logic nghiệp vụ
// 1. createMessage(conversationId, senderId, content, senderType)
// 2. takeOverConversation(conversationId, newAdminId) // Dùng logic Atomic Update
// 3. getUnreadCount(userId, type)

export const getChatList = async () => {
  // Logic lấy danh sách và tính toán can_take_over (Check 10 phút)
  return [];
};
