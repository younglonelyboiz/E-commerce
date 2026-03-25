import db from "../models/index.js";
import { PayOS } from "@payos/node";
import dotenv from "dotenv";

dotenv.config(); // Nạp biến môi trường ngay lập tức để đảm bảo PayOS nhận được Key

const payos = new PayOS({
  clientId: process.env.PAYOS_CLIENT_ID || "YOUR_CLIENT_ID",
  apiKey: process.env.PAYOS_API_KEY || "YOUR_API_KEY",
  checksumKey: process.env.PAYOS_CHECKSUM_KEY || "YOUR_CHECKSUM_KEY",
});

const createPaymentLinkService = async (orderCode, amount, description) => {
  try {
    // PayOS yêu cầu orderCode phải là SỐ NGUYÊN (Int32)
    // Dùng regex tách các chữ số từ mã đơn "ORD1710123" -> 1710123
    const orderNumber = Number(orderCode.replace(/\D/g, ""));

    const requestData = {
      orderCode: orderNumber,
      amount: Number(amount), // Ép kiểu về số nguyên để tránh lỗi PayOS
      description: description || "Thanh toan don hang",
      expiredAt: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // Link QR hết hạn sau 24h
      returnUrl: `${
        process.env.FRONTEND_URL || "http://localhost:3000"
      }/order-history`,
      cancelUrl: `${
        process.env.FRONTEND_URL || "http://localhost:3000"
      }/checkout`,
    };

    const paymentLink = await payos.paymentRequests.create(requestData);

    return {
      EC: 0,
      EM: "Tạo link thanh toán PayOS thành công",
      DT: paymentLink,
    };
  } catch (error) {
    console.error(">>> createPaymentLinkService Error:", error);
    return {
      EC: -1,
      EM: error.message || "Lỗi tạo link thanh toán PayOS",
      DT: "",
    };
  }
};

const updatePaymentStatusService = async (orderCodeStr) => {
  try {
    const order = await db.orders.findOne({
      where: { code: orderCodeStr },
    });

    if (!order) {
      return { EC: 1, EM: "Đơn hàng không tồn tại trên hệ thống", DT: "" };
    }

    // Cập nhật trạng thái thanh toán sang 'paid'
    await db.orders.update(
      { payment_status: "paid" },
      { where: { code: orderCodeStr } },
    );

    return { EC: 0, EM: "Cập nhật thanh toán thành công", DT: "" };
  } catch (error) {
    console.error(">>> updatePaymentStatusService Error:", error);
    return { EC: -1, EM: "Lỗi hệ thống khi cập nhật thanh toán", DT: "" };
  }
};

const verifyWebhookDataService = (webhookBody) => {
  try {
    // Sử dụng đúng tên hàm của thư viện @payos/node phiên bản hiện tại
    const data = payos.webhooks.verify(webhookBody);
    return { EC: 0, EM: "Xác thực webhook thành công", DT: data };
  } catch (error) {
    console.error(">>> verifyWebhookDataService Error:", error.message);
    return { EC: -1, EM: "Lỗi xác thực chữ ký webhook PayOS", DT: "" };
  }
};

const retryPaymentService = async (orderId) => {
  try {
    const order = await db.orders.findOne({ where: { id: orderId } });
    if (!order) return { EC: 1, EM: "Không tìm thấy đơn hàng", DT: "" };

    // 1. Hủy link thanh toán cũ trên PayOS để vô hiệu hóa mã QR cũ
    try {
      const oldOrderNumber = Number(order.code.replace(/\D/g, ""));
      await payos.cancelPaymentLink(
        oldOrderNumber,
        "Khách hàng yêu cầu tạo mã QR mới",
      );
    } catch (e) {
      // Bỏ qua lỗi nếu link cũ chưa từng được tạo hoặc đã hết hạn từ trước
    }

    // Đổi sang mã đơn mới để PayOS không báo lỗi trùng lặp "Đơn hàng đã tồn tại"
    const newOrderCodeStr = `ORD${Date.now()}`;
    await db.orders.update(
      { code: newOrderCodeStr },
      { where: { id: order.id } },
    );

    // Gọi lại hàm sinh link với mã đơn mới
    const result = await createPaymentLinkService(
      newOrderCodeStr,
      Number(order.grand_total), // Ép kiểu về số nguyên khi truyền vào
      "Thanh toan lai don hang",
    );
    if (result.EC === 0) {
      result.DT.newOrderCode = newOrderCodeStr; // Gửi mã mới về cho Frontend
    }
    return result;
  } catch (error) {
    console.error(">>> retryPaymentService Error:", error);
    return { EC: -1, EM: "Lỗi tạo lại link thanh toán PayOS", DT: "" };
  }
};

export {
  createPaymentLinkService,
  updatePaymentStatusService,
  verifyWebhookDataService,
  retryPaymentService,
};
