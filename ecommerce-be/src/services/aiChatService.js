import axios from "axios";
import db from "../models/index.js";

const AI_BOT_USER_ID = parseInt(process.env.AI_BOT_USER_ID || "1");
const FASTAPI_URL = process.env.AI_SERVICE_URL || "http://be-ai:8000";
const AI_TIMEOUT_MS = 60000;

// ------------------------------------------------------------------ //
//  Helper: Build history array từ DB messages                         //
// ------------------------------------------------------------------ //
const buildHistory = (messages) => {
  return messages.map((msg) => ({
    role: msg.sender_type === "USER" ? "user" : "ai",
    content: msg.content,
  }));
};

// ------------------------------------------------------------------ //
//  askAIService: Gửi câu hỏi → lưu DB → gọi FastAPI → lưu trả lời   //
// ------------------------------------------------------------------ //
export const askAIService = async (userId, question) => {
  const transaction = await db.sequelize.transaction();
  let transactionCommitted = false;
  try {
    // 1. Tìm/tạo AI conversation
    let conversation = await db.conversations.findOne({
      where: { user_id: userId, type: "AI", status: "OPEN" },
      transaction,
    });

    if (!conversation) {
      conversation = await db.conversations.create(
        { user_id: userId, type: "AI", status: "OPEN" },
        { transaction },
      );
    }

    // 2. Lưu message của user
    const userMessage = await db.messages.create(
      {
        conversation_id: conversation.id,
        sender_id: userId,
        sender_type: "USER",
        message_type: "TEXT",
        content: question,
      },
      { transaction },
    );

    // 3. Đọc 10 messages gần nhất (trừ message vừa tạo) để build history
    const recentMessages = await db.messages.findAll({
      where: { conversation_id: conversation.id },
      order: [["created_at", "DESC"]],
      limit: 11,
      transaction,
    });

    const history = buildHistory(
      recentMessages
        .filter((m) => m.id !== userMessage.id)
        .reverse()
        .slice(-10),
    );

    await transaction.commit();
    transactionCommitted = true;

    // 4. Gọi FastAPI (ngoài transaction để không hold lock DB)
    let aiAnswer =
      "Hệ thống Trợ lý AI (RAG) đang tạm thời vượt quá giới hạn lượt gọi của gói API miễn phí do tần suất thử nghiệm cao.  ";
    let sourceProducts = [];

    try {
      const response = await axios.post(
        `${FASTAPI_URL}/api/v1/chat`,
        { question, history },
        { timeout: AI_TIMEOUT_MS },
      );
      aiAnswer = response.data.answer || aiAnswer;
      sourceProducts = response.data.source_products || [];
    } catch (aiError) {
      console.error(">>> [askAIService] FastAPI Error:", aiError.message);
    }

    // Đảm bảo AI Bot User tồn tại để tránh lỗi Foreign Key
    let botUser = await db.users.findByPk(AI_BOT_USER_ID);
    if (!botUser) {
      botUser = await db.users.create({
        id: AI_BOT_USER_ID,
        email: "ai_assistant@dienmay.local",
        user_name: "DienMay AI",
        active: 1,
      });
    }

    // 5. Lưu message AI vào DB
    const aiMessage = await db.messages.create({
      conversation_id: conversation.id,
      sender_id: AI_BOT_USER_ID,
      sender_type: "AI",
      message_type: "TEXT",
      content: aiAnswer,
    });

    // 6. Cập nhật last_message trên conversation
    await conversation.update({
      last_message_id: aiMessage.id,
      last_message_at: new Date(),
      last_sender_type: "AI",
    });

    return {
      EC: 0,
      EM: "Thành công",
      DT: {
        answer: aiAnswer,
        source_products: sourceProducts,
        conversation_id: conversation.id,
      },
    };
  } catch (error) {
    if (!transactionCommitted) {
      await transaction.rollback();
    }
    console.error(">>> [askAIService] Error:", error);
    return { EC: -1, EM: "Lỗi hệ thống", DT: null };
  }
};

// ------------------------------------------------------------------ //
//  getAIHistoryService: Lấy lịch sử chat AI của user                 //
// ------------------------------------------------------------------ //
export const getAIHistoryService = async (userId) => {
  try {
    const conversation = await db.conversations.findOne({
      where: { user_id: userId, type: "AI", status: "OPEN" },
    });

    if (!conversation) {
      return { EC: 0, EM: "Chưa có lịch sử chat", DT: [] };
    }

    const messages = await db.messages.findAll({
      where: { conversation_id: conversation.id },
      order: [["created_at", "ASC"]],
    });

    return { EC: 0, EM: "OK", DT: messages };
  } catch (error) {
    console.error(">>> [getAIHistoryService] Error:", error);
    return { EC: -1, EM: "Lỗi hệ thống", DT: [] };
  }
};

// ------------------------------------------------------------------ //
//  resetAIChatService: Đóng conversation AI để bắt đầu cuộc mới      //
// ------------------------------------------------------------------ //
export const resetAIChatService = async (userId) => {
  try {
    await db.conversations.update(
      { status: "CLOSED" },
      { where: { user_id: userId, type: "AI", status: "OPEN" } },
    );
    return { EC: 0, EM: "Đã reset chat AI", DT: null };
  } catch (error) {
    console.error(">>> [resetAIChatService] Error:", error);
    return { EC: -1, EM: "Lỗi hệ thống", DT: null };
  }
};
