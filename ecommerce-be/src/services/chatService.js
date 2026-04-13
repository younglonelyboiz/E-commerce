import db from "../models/index.js";
import { Op } from "sequelize";

// Luồng 1: Khách hàng gửi tin nhắn
export const handleUserMessageService = async (userId, content) => {
  const transaction = await db.sequelize.transaction();
  try {
    // 1. Tìm hội thoại đang OPEN của user, nếu chưa có thì tạo mới
    let conversation = await db.conversations.findOne({
      where: { user_id: userId, status: "OPEN" },
      transaction,
    });

    if (!conversation) {
      conversation = await db.conversations.create(
        { user_id: userId, status: "OPEN" },
        { transaction },
      );
    }

    // 2. Tạo tin nhắn mới
    const newMessage = await db.messages.create(
      {
        conversation_id: conversation.id,
        sender_id: userId,
        sender_type: "USER",
        message_type: "TEXT",
        content: content,
      },
      { transaction },
    );

    // 3. Cập nhật lại conversation (Đẩy chấm đỏ cho Admin)
    await conversation.update(
      {
        last_message_id: newMessage.id,
        last_message_at: new Date(),
        last_sender_type: "USER",
        unread_count_admin: conversation.unread_count_admin + 1,
      },
      { transaction },
    );

    await transaction.commit();
    return {
      EC: 0,
      EM: "Gửi tin nhắn thành công",
      DT: { message: newMessage, conversation },
    };
  } catch (error) {
    await transaction.rollback();
    console.error(">>> handleUserMessage Error:", error);
    return { EC: -1, EM: "Lỗi hệ thống", DT: null };
  }
};

// Luồng 2: Admin mở hội thoại (Reset chấm đỏ)
export const markAdminReadService = async (conversationId) => {
  try {
    await db.conversations.update(
      { unread_count_admin: 0 },
      { where: { id: conversationId } },
    );
    return { EC: 0, EM: "Đã đọc", DT: { conversationId } };
  } catch (error) {
    return { EC: -1, EM: "Lỗi hệ thống", DT: null };
  }
};

// Khách hàng mở hội thoại (Reset chấm đỏ cho khách)
export const markUserReadService = async (userId) => {
  try {
    await db.conversations.update(
      { unread_count_user: 0 },
      { where: { user_id: userId, status: "OPEN" } },
    );
    return { EC: 0, EM: "Đã đọc", DT: null };
  } catch (error) {
    return { EC: -1, EM: "Lỗi hệ thống", DT: null };
  }
};

// Luồng 3: Admin Nhận ca & Phản hồi (ATOMIC UPDATE CƯỚP CỜ)
export const assignAndReplyService = async (
  adminId,
  conversationId,
  content,
) => {
  const transaction = await db.sequelize.transaction();
  try {
    const conversation = await db.conversations.findOne({
      where: { id: conversationId },
      transaction,
    });

    if (!conversation) throw new Error("Hội thoại không tồn tại");

    // Logic Cướp Cờ: Nếu hội thoại chưa có ai nhận, Update ép điều kiện assignee_id IS NULL
    if (conversation.assignee_id === null) {
      const [affectedRows] = await db.conversations.update(
        {
          assignee_id: adminId,
          assigned_at: new Date(),
        },
        {
          where: { id: conversationId, assignee_id: null }, // Đảm bảo tính nguyên tử
          transaction,
        },
      );

      if (affectedRows === 0) {
        throw new Error("Đã có Admin khác nhanh tay nhận ca này!");
      }
    } else if (conversation.assignee_id !== adminId) {
      throw new Error("Hội thoại này đang được xử lý bởi Admin khác.");
    }

    // Tạo tin nhắn của Admin
    const newMessage = await db.messages.create(
      {
        conversation_id: conversationId,
        sender_id: adminId,
        sender_type: "ADMIN",
        message_type: "TEXT",
        content: content,
      },
      { transaction },
    );

    // Cập nhật lại conversation (Tăng chấm đỏ cho User)
    await conversation.update(
      {
        last_message_id: newMessage.id,
        last_message_at: new Date(),
        last_sender_type: "ADMIN",
        unread_count_user: conversation.unread_count_user + 1,
        assignee_id: adminId, // Đảm bảo lưu đúng admin
      },
      { transaction },
    );

    await transaction.commit();
    return {
      EC: 0,
      EM: "Phản hồi thành công",
      DT: { message: newMessage, conversation },
    };
  } catch (error) {
    await transaction.rollback();
    return { EC: 1, EM: error.message || "Lỗi xử lý", DT: null };
  }
};

// Luồng 4: Admin "Treo" máy -> Cướp quyền (Takeover)
export const takeOverConversationService = async (
  newAdminId,
  conversationId,
  newAdminName,
) => {
  const transaction = await db.sequelize.transaction();
  try {
    // Định nghĩa hằng số cho thời gian không hoạt động để dễ đọc và bảo trì
    const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 phút
    const tenMinutesAgo = new Date(Date.now() - INACTIVITY_TIMEOUT_MS);

    // Debugging: Log current state before attempting takeover
    const currentConversation = await db.conversations.findOne({
      where: { id: conversationId },
      attributes: ["id", "assignee_id", "last_message_at", "last_sender_type"],
    });
    console.log(
      `[Takeover Debug] Attempting takeover for Conv ID: ${conversationId} by Admin ID: ${newAdminId}`,
    );
    console.log(
      `[Takeover Debug] Current state:`,
      currentConversation?.toJSON(),
    );
    console.log(`[Takeover Debug] Ten minutes ago:`, tenMinutesAgo);
    console.log(
      `[Takeover Debug] Is last_message_at < tenMinutesAgo?`,
      currentConversation?.last_message_at < tenMinutesAgo,
    );

    // ATOMIC UPDATE TAKE OVER
    // Điều kiện: Đã có assignee, Không phải mình,
    // VÀ (Tin nhắn cuối là của ADMIN VÀ > 10 phút trước)
    // HOẶC (Tin nhắn cuối là của USER - nghĩa là Admin hiện tại chưa phản hồi)
    const [affectedRows] = await db.conversations.update(
      {
        assignee_id: newAdminId,
        assigned_at: new Date(),
        last_message_at: new Date(), // Reset thời gian để cho Admin mới 10 phút bảo vệ
      },
      {
        where: {
          id: conversationId,
          assignee_id: { [Op.not]: null }, // Đã có người nhận
          assignee_id: { [Op.ne]: newAdminId }, // Không phải Admin đang cố gắng tiếp quản
          [Op.or]: [
            {
              last_sender_type: "ADMIN",
              last_message_at: { [Op.lt]: tenMinutesAgo }, // Tin nhắn cuối của ADMIN > 10 phút trước
            },
            {
              last_sender_type: "USER", // Nếu tin nhắn cuối là của USER, Admin hiện tại chưa phản hồi
            },
          ],
        },
        transaction,
      },
    );

    if (affectedRows === 0) {
      console.log(
        `[Takeover Debug] No rows affected for Conv ID: ${conversationId}. Conditions not met.`,
      );
      throw new Error(
        "Không đủ điều kiện để tiếp quản (Hoặc đã có người khác tiếp quản)",
      );
    }

    // Gửi tin nhắn hệ thống thông báo Takeover
    const systemMessage = await db.messages.create(
      {
        conversation_id: conversationId,
        sender_id: newAdminId,
        sender_type: "ADMIN",
        message_type: "SYSTEM",
        content: `Admin ${newAdminName} đã tiếp quản cuộc trò chuyện.`,
      },
      { transaction },
    );

    // Cập nhật lại ID tin nhắn cuối cho cuộc hội thoại
    await db.conversations.update(
      { last_message_id: systemMessage.id },
      { where: { id: conversationId }, transaction },
    );

    await transaction.commit();
    return {
      EC: 0,
      EM: "Tiếp quản thành công",
      DT: {
        message: systemMessage,
        conversation: await db.conversations.findByPk(conversationId), // Trả về conversation đã cập nhật đầy đủ
      },
    };
  } catch (error) {
    await transaction.rollback();
    return { EC: 1, EM: error.message || "Lỗi xử lý", DT: null };
  }
};

// Luồng 5: Đóng hội thoại
export const closeConversationService = async (conversationId) => {
  try {
    await db.conversations.update(
      {
        status: "CLOSED",
        assignee_id: null,
      },
      { where: { id: conversationId } },
    );
    return { EC: 0, EM: "Đã đóng hội thoại", DT: { conversationId } };
  } catch (error) {
    return { EC: -1, EM: "Lỗi hệ thống", DT: null };
  }
};

// -- API Services --
export const getUnreadCountService = async (userId) => {
  try {
    const count = await db.conversations.sum("unread_count_user", {
      where: { user_id: userId, status: "OPEN" },
    });
    return { EC: 0, EM: "OK", DT: count || 0 };
  } catch (error) {
    return { EC: -1, EM: "Lỗi hệ thống", DT: 0 };
  }
};

export const getConversationsService = async () => {
  try {
    const conversations = await db.conversations.findAll({
      where: { status: "OPEN" },
      order: [["last_message_at", "DESC"]],
      include: [
        {
          model: db.users,
          as: "customer",
          attributes: ["id", "user_name", "email"],
        },
        { model: db.users, as: "assignee", attributes: ["id", "user_name"] },
        {
          model: db.messages,
          as: "last_message",
          attributes: ["content", "message_type", "created_at"],
        },
      ],
    });
    return { EC: 0, EM: "OK", DT: conversations };
  } catch (error) {
    return { EC: -1, EM: "Lỗi hệ thống", DT: [] };
  }
};

export const getMessagesService = async (conversationId) => {
  try {
    const messages = await db.messages.findAll({
      where: { conversation_id: conversationId },
      order: [["created_at", "ASC"]],
    });
    return { EC: 0, EM: "OK", DT: messages };
  } catch (error) {
    return { EC: -1, EM: "Lỗi hệ thống", DT: [] };
  }
};

export const getUserMessagesService = async (userId) => {
  try {
    const conversation = await db.conversations.findOne({
      where: { user_id: userId, status: "OPEN" },
    });

    if (!conversation) return { EC: 0, EM: "OK", DT: [] };

    const messages = await db.messages.findAll({
      where: { conversation_id: conversation.id },
      order: [["created_at", "ASC"]],
    });
    return { EC: 0, EM: "OK", DT: messages };
  } catch (error) {
    return { EC: -1, EM: "Lỗi hệ thống", DT: [] };
  }
};
