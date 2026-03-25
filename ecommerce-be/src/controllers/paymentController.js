import {
  createPaymentLinkService,
  updatePaymentStatusService,
  verifyWebhookDataService,
  retryPaymentService,
} from "../services/paymentService.js";

export const createPaymentLink = async (req, res) => {
  try {
    const { orderCode, amount, description } = req.body;

    if (!orderCode || !amount) {
      return res.status(200).json({
        EC: 1,
        EM: "Thiếu thông tin bắt buộc để tạo thanh toán",
        DT: "",
      });
    }

    const result = await createPaymentLinkService(
      orderCode,
      amount,
      description,
    );

    return res.status(200).json({
      EC: result.EC,
      EM: result.EM,
      DT: result.DT,
    });
  } catch (error) {
    console.error(">>> Controller createPaymentLink Error:", error);
    return res
      .status(500)
      .json({ EC: -1, EM: "Lỗi server (Create Payment Link)", DT: "" });
  }
};

export const retryPaymentLink = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(200).json({ EC: 1, EM: "Thiếu ID đơn hàng", DT: "" });
    }
    const result = await retryPaymentService(orderId);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ EC: -1, EM: "Lỗi server", DT: "" });
  }
};

export const handlePayosWebhook = async (req, res) => {
  console.log(">>> [WEBHOOK] PayOS vừa gọi đến hệ thống!");
  try {
    const webhookBody = req.body;
    console.log(
      ">>> [WEBHOOK] Data Payload:",
      JSON.stringify(webhookBody, null, 2),
    );

    // 1. Xác thực chữ ký Webhook bằng SDK của PayOS để đảm bảo an toàn
    const verifyResult = verifyWebhookDataService(webhookBody);
    if (verifyResult.EC !== 0) {
      console.log(">>> [WEBHOOK] Xác thực chữ ký thất bại!");
      return res
        .status(400)
        .json({ success: false, message: "Xác thực webhook thất bại" });
    }

    // Lấy data đã được SDK verify (chính là webhookBody.data)
    const paymentData = verifyResult.DT;

    // 2. Kiểm tra giao dịch thành công
    if (
      paymentData &&
      (paymentData.code === "00" ||
        webhookBody.code === "00" ||
        webhookBody.success === true)
    ) {
      // Đảm bảo luôn lấy chính xác mã đơn hàng nằm bên trong lõi data của PayOS
      const orderCodeStr = `ORD${webhookBody.data.orderCode}`;
      console.log(
        ">>> PayOS Webhook: Đã nhận thanh toán cho đơn hàng:",
        orderCodeStr,
      );

      // 3. Gọi logic update DB từ Service
      const updateResult = await updatePaymentStatusService(orderCodeStr);
      console.log(">>> Update trạng thái DB:", updateResult.EM);

      // 4. Chỉ khi DB update thành công mới kích hoạt Socket.io
      if (updateResult.EC === 0) {
        const io = req.app.get("io");
        if (io) {
          io.to(orderCodeStr).emit("payment_status", {
            success: true,
            message: "Thanh toán thành công",
          });
          console.log(
            `>>> Socket.io: Đã gửi tín hiệu chuyển trang tới phòng ${orderCodeStr}`,
          );
        }
      }
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(">>> Controller handlePayosWebhook Error:", error);
    return res.status(500).json({ success: false });
  }
};
