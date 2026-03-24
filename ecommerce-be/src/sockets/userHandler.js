import {
  handleUserMessageService,
  markUserReadService,
} from "../services/chatService.js";

// Xử lý các sự kiện từ phía Khách hàng
const userHandler = (io, socket) => {
  // Khách gửi tin nhắn
  socket.on("send_message", async (data) => {
    const { userId, content } = data;
    if (!userId || !content) return;

    const res = await handleUserMessageService(userId, content);
    // Khi tin nhắn đã được gửi, báo cho admin là khách đã ngừng gõ
    if (res.EC === 0 && res.DT.conversation?.id) {
      io.to("admin_group").emit("user_typing", {
        userId: userId,
        isTyping: false,
      });
    }
    if (res.EC === 0) {
      // Emit cho tất cả thiết bị của chính user (để đồng bộ UI nếu mở nhiều tab)
      io.to(`customer_${userId}`).emit("receive_message", res.DT.message);

      // Bắn toàn bộ cho admin_group để nhảy chấm đỏ Badge và hiển thị tin mới
      io.to("admin_group").emit("admin_receive_message", res.DT);
    }
  });

  // Khách hàng đang gõ phím
  socket.on("user_typing", (data) => {
    const { userId, isTyping } = data;
    io.to("admin_group").emit("user_typing", { userId, isTyping });
  });

  // Khách hàng đọc tin nhắn của Admin
  socket.on("user_read_message", async (userId) => {
    if (!userId) return;
    await markUserReadService(userId);
  });
};
export default userHandler;
