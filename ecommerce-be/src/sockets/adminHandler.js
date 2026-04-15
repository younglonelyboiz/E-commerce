import {
  markAdminReadService,
  assignAndReplyService,
  takeOverConversationService,
  closeConversationService,
  adminImageReplyService,
} from "../services/chatService.js";

// Xử lý các sự kiện từ phía Admin
const adminHandler = (io, socket) => {
  // Luồng 2: Admin mở hội thoại -> Reset Unread Badge cho toàn bộ group
  socket.on("admin_open_conversation", async (data) => {
    const { conversationId } = data;
    const res = await markAdminReadService(conversationId);
    if (res.EC === 0) {
      // Báo tất cả Admin biết để clear số unread badge
      io.to("admin_group").emit("admin_read_update", { conversationId });
    }
  });

  // Admin phản hồi tin nhắn
  socket.on("admin_reply", async (data) => {
    const { adminId, conversationId, content } = data;
    const res = await assignAndReplyService(adminId, conversationId, content);

    // Khi admin gửi tin, báo cho khách là admin đã ngừng gõ
    if (res.EC === 0) {
      io.to(`customer_${res.DT.conversation.user_id}`).emit("admin_typing", {
        isTyping: false,
      });
    }

    if (res.EC === 0) {
      // Gửi tin nhắn về cho Khách hàng
      const customerRoom = `customer_${res.DT.conversation.user_id}`;
      io.to(customerRoom).emit("receive_message", res.DT.message);

      // Cập nhật lại UI cho tất cả Admin đang online
      io.to("admin_group").emit("admin_reply_update", res.DT);
    } else {
      socket.emit("admin_error", { message: res.EM });
    }
  });

  // Admin phản hồi ảnh
  socket.on("admin_reply_image", async (data) => {
    const { adminId, conversationId, imageUrl, publicId, caption, userId } =
      data;
    const res = await adminImageReplyService(
      adminId,
      conversationId,
      imageUrl,
      publicId,
      caption,
    );

    // Khi admin gửi ảnh, báo cho khách là admin đã ngừng gõ
    if (res.EC === 0) {
      io.to(`customer_${res.DT.conversation.user_id}`).emit("admin_typing", {
        isTyping: false,
      });
    }

    if (res.EC === 0) {
      // Gửi ảnh về cho Khách hàng
      const customerRoom = `customer_${res.DT.conversation.user_id}`;
      io.to(customerRoom).emit("receive_message", res.DT.message);

      // Cập nhật lại UI cho tất cả Admin đang online
      io.to("admin_group").emit("admin_reply_update", res.DT);
    } else {
      socket.emit("admin_error", { message: res.EM });
    }
  });

  // Admin đang gõ phím
  socket.on("admin_typing", (data) => {
    const { userId, isTyping } = data;
    io.to(`customer_${userId}`).emit("admin_typing", { isTyping });
  });

  // Luồng 4: Admin Tiếp quản (Takeover)
  socket.on("admin_takeover", async (data) => {
    const { newAdminId, conversationId, newAdminName, userId } = data;
    const res = await takeOverConversationService(
      newAdminId,
      conversationId,
      newAdminName,
    );

    if (res.EC === 0) {
      // Gửi tin nhắn hệ thống về cho Khách hàng
      io.to(`customer_${userId}`).emit("receive_message", res.DT.message);
      // Cập nhật lại UI cho tất cả Admin đang online
      io.to("admin_group").emit("admin_reply_update", res.DT); // res.DT giờ đã chứa { message, conversation }
    } else {
      socket.emit("admin_error", { message: res.EM });
    }
  });

  // Luồng 5: Đóng hội thoại
  socket.on("admin_close_chat", async (data) => {
    const { conversationId } = data;
    const res = await closeConversationService(conversationId);
    if (res.EC === 0) {
      io.to("admin_group").emit("admin_chat_closed", { conversationId });
    }
  });
};
export default adminHandler;
