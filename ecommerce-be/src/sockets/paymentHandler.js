// Xử lý các sự kiện realtime liên quan đến Thanh toán
const paymentHandler = (io, socket) => {
  // Khách hàng tham gia phòng để lắng nghe trạng thái thanh toán PayOS
  socket.on("join_order", (orderCode) => {
    socket.join(orderCode);
    console.log(
      `[Socket] Client [${socket.id}] joined room order: ${orderCode}`,
    );
  });
};

export default paymentHandler;
