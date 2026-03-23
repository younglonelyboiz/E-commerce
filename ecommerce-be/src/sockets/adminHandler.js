// Xử lý các sự kiện từ phía Admin
const adminHandler = (io, socket) => {
  // Admin đăng nhập -> Join phòng chung của tất cả admin
  socket.on("join_admin_room", () => {
    socket.join("admin_group");
    console.log(`Admin joined room: admin_group`);
  });

  // Admin phản hồi tin nhắn
  socket.on("admin_reply", async (data) => {
    // TODO: Gọi chatService.js -> Check Atomic/Take Over -> Emit về customer_room
  });
};
export default adminHandler;
