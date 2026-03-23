// Xử lý các sự kiện từ phía Khách hàng
const userHandler = (io, socket) => {
  // Khách hàng đăng nhập -> Join phòng riêng
  socket.on("join_user_room", (userId) => {
    const roomName = `customer_${userId}`;
    socket.join(roomName);
    console.log(`User ${userId} joined room: ${roomName}`);
  });

  // Khách gửi tin nhắn
  socket.on("send_message", async (data) => {
    // TODO: Gọi chatService.js để lưu DB -> Emit cho admin_group
  });
};
export default userHandler;
