import {
  createOrderService,
  getAllOrdersService,
  getOrderDetailService,
  updateOrderStatusService,
  getOrdersByUserIdService,
  cancelOrderByUserService,
} from "../services/orderService.js";

export const createOrder = async (req, res) => {
  try {
    // req.user đã được decode bởi middleware checkUserJWT
    const userId = req.user.id;
    let result = await createOrderService(userId, req.body);
    return res.status(200).json(result);
  } catch (error) {
    console.error(">>> Lỗi ở createOrder Controller:", error);
    return res.status(500).json({ EC: -1, EM: "Lỗi server", DT: "" });
  }
};

export const readAllOrders = async (req, res) => {
  try {
    const { page, limit, status } = req.query;
    let result = await getAllOrdersService(page, limit, status);
    return res.status(200).json(result);
  } catch (error) {
    console.error(">>> Lỗi ở readAllOrders:", error);
    return res.status(500).json({ EC: -1, EM: "Lỗi server", DT: "" });
  }
};

export const readOrderDetail = async (req, res) => {
  try {
    const orderId = req.params.id;
    let result = await getOrderDetailService(orderId);
    return res.status(200).json(result);
  } catch (error) {
    console.error(">>> Lỗi ở readOrderDetail:", error);
    return res.status(500).json({ EC: -1, EM: "Lỗi server", DT: "" });
  }
};

export const changeOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status, admin_note } = req.body;
    let result = await updateOrderStatusService(orderId, status, admin_note);
    return res.status(200).json(result);
  } catch (error) {
    console.error(">>> Lỗi ở changeOrderStatus:", error);
    return res.status(500).json({ EC: -1, EM: "Lỗi server", DT: "" });
  }
};

export const readOrdersByUser = async (req, res) => {
  try {
    const userId = req.user.id;
    let data = await getOrdersByUserIdService(userId);
    return res.status(200).json(data);
  } catch (error) {
    console.error(">>> Lỗi ở Controller readOrdersByUser: ", error);
    return res.status(500).json({ EC: -1, EM: "Lỗi Server", DT: "" });
  }
};

export const cancelOrderByUser = async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.user.id; // Lấy từ token JWT

    let result = await cancelOrderByUserService(orderId, userId);
    return res.status(200).json(result);
  } catch (error) {
    console.error(">>> Lỗi ở cancelOrderByUser:", error);
    return res.status(500).json({ EC: -1, EM: "Lỗi server", DT: "" });
  }
};
