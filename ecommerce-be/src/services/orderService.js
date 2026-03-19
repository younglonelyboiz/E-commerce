import db from "../models/index.js";
import { Op } from "sequelize";

export const createOrderService = async (userId, data) => {
  const transaction = await db.sequelize.transaction();

  try {
    const {
      items,
      shipping_name,
      shipping_phone,
      shipping_address_snapshot,
      payment_method,
      customer_note,
    } = data;

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error("Không có sản phẩm nào để đặt hàng");
    }
    if (!shipping_address_snapshot) {
      throw new Error("Thiếu thông tin địa chỉ giao hàng");
    }

    let totalAmount = 0;
    const orderProductsData = [];
    const productIdsToRemove = [];

    // 1. Lặp qua sản phẩm từ Client gửi lên, check tồn kho và tính tổng tiền
    for (let item of items) {
      const product = await db.products.findOne({
        where: { id: item.product_id },
        transaction,
      });

      if (!product) {
        throw new Error(`Sản phẩm không tồn tại!`);
      }

      if (product.quantity < item.quantity) {
        throw new Error(
          `Sản phẩm '${product.name}' chỉ còn ${product.quantity} trong kho!`,
        );
      }

      const price =
        product.discount_price > 0
          ? product.discount_price
          : product.regular_price;
      const subtotal = price * item.quantity;
      totalAmount += subtotal;

      // Chuẩn bị data cho bảng chi tiết đơn hàng
      orderProductsData.push({
        product_id: product.id,
        name: product.name,
        price: price,
        quantity: item.quantity,
        subtotal: subtotal,
      });

      // Trừ số lượng tồn kho
      await db.products.update(
        { quantity: product.quantity - item.quantity },
        { where: { id: product.id }, transaction },
      );

      productIdsToRemove.push(product.id);
    }

    // 2. Tạo bản ghi đơn hàng
    const newOrder = await db.orders.create(
      {
        code: `ORD-${Date.now()}`,
        user_id: userId,
        grand_total: totalAmount,
        order_date: new Date(),
        payment_method: payment_method || "COD",
        payment_status: "pending",
        order_status: "pending",
        shipping_address_snapshot: shipping_address_snapshot,
        shipping_name: shipping_name,
        shipping_phone: shipping_phone,
        customer_note: customer_note,
      },
      { transaction },
    );

    // 3. Gán ID đơn hàng và lưu nhiều chi tiết đơn hàng cùng lúc
    orderProductsData.forEach((op) => (op.order_id = newOrder.id));
    await db.order_products.bulkCreate(orderProductsData, { transaction });

    // 4. Tìm giỏ hàng và xóa những sản phẩm vừa mua (Hỗ trợ Mua Ngay và Mua từ Giỏ)
    const cart = await db.carts.findOne({
      where: { user_id: userId },
      transaction,
    });
    if (cart && productIdsToRemove.length > 0) {
      await db.cart_products.destroy({
        where: {
          cart_id: cart.id,
          product_id: productIdsToRemove,
        },
        transaction,
      });
    }

    // 6. Mọi thứ OK -> Commit giao dịch
    await transaction.commit();

    return { EC: 0, EM: "Đặt hàng thành công!", DT: newOrder };
  } catch (error) {
    // Có lỗi bất kỳ -> Hoàn tác toàn bộ kho và đơn hàng
    await transaction.rollback();
    console.error(">>> Lỗi tạo đơn hàng:", error);
    return { EC: -1, EM: error.message || "Lỗi hệ thống khi đặt hàng", DT: "" };
  }
};

// ==========================================
// ADMIN: QUẢN LÝ ĐƠN HÀNG
// ==========================================

export const getAllOrdersService = async (
  page = 1,
  limit = 10,
  status = null,
) => {
  try {
    let offset = (page - 1) * limit;
    let whereCondition = {};

    if (status) {
      whereCondition.order_status = status;
    }

    const { count, rows } = await db.orders.findAndCountAll({
      where: whereCondition,
      offset: +offset,
      limit: +limit,
      order: [["order_date", "DESC"]], // Đơn mới nhất lên đầu
    });

    return {
      EC: 0,
      EM: "Lấy danh sách đơn hàng thành công",
      DT: {
        totalRows: count,
        totalPages: Math.ceil(count / limit),
        orders: rows,
      },
    };
  } catch (error) {
    console.error(">>> Lỗi getAllOrdersService:", error);
    return { EC: -1, EM: "Lỗi hệ thống", DT: "" };
  }
};

export const getOrderDetailService = async (orderId) => {
  try {
    const order = await db.orders.findOne({
      where: { id: orderId },
      include: [
        { model: db.order_products, as: "order_products" }, // Lấy list sản phẩm mua
      ],
    });
    if (!order) return { EC: 1, EM: "Không tìm thấy đơn hàng", DT: "" };
    return { EC: 0, EM: "Lấy chi tiết đơn hàng thành công", DT: order };
  } catch (error) {
    return { EC: -1, EM: "Lỗi hệ thống", DT: "" };
  }
};

export const updateOrderStatusService = async (
  orderId,
  newStatus,
  adminNote,
) => {
  const transaction = await db.sequelize.transaction();
  try {
    const order = await db.orders.findOne({
      where: { id: orderId },
      transaction,
    });
    if (!order) throw new Error("Đơn hàng không tồn tại");

    // LOGIC HOÀN KHO: Nếu đơn bị hủy và trạng thái cũ chưa phải là Hủy
    if (newStatus === "cancelled" && order.order_status !== "cancelled") {
      const orderItems = await db.order_products.findAll({
        where: { order_id: orderId },
        transaction,
      });
      for (let item of orderItems) {
        await db.products.increment("quantity", {
          by: item.quantity,
          where: { id: item.product_id },
          transaction,
        });
      }
    }

    await order.update(
      { order_status: newStatus, admin_note: adminNote || order.admin_note },
      { transaction },
    );
    await transaction.commit();
    return { EC: 0, EM: "Cập nhật trạng thái thành công", DT: "" };
  } catch (error) {
    await transaction.rollback();
    return { EC: -1, EM: error.message || "Lỗi hệ thống", DT: "" };
  }
};

// ==========================================
// CLIENT: QUẢN LÝ ĐƠN HÀNG
// ==========================================
export const getOrdersByUserIdService = async (userId) => {
  try {
    const orders = await db.orders.findAll({
      where: { user_id: userId },
      include: [{ model: db.order_products, as: "order_products" }],
      order: [["order_date", "DESC"]], // Đơn mới nhất lên đầu
    });
    return { EC: 0, EM: "Lấy lịch sử đơn hàng thành công", DT: orders };
  } catch (error) {
    console.error(">>> Lỗi getOrdersByUserIdService:", error);
    return { EC: -1, EM: "Lỗi hệ thống", DT: [] };
  }
};

export const cancelOrderByUserService = async (orderId, userId) => {
  const transaction = await db.sequelize.transaction();
  try {
    const order = await db.orders.findOne({
      where: { id: orderId, user_id: userId },
      transaction,
    });

    if (!order) {
      throw new Error(
        "Đơn hàng không tồn tại hoặc bạn không có quyền thao tác",
      );
    }

    // Rule: Chỉ cho phép hủy khi chưa giao
    if (
      order.order_status === "shipped" ||
      order.order_status === "delivered"
    ) {
      throw new Error(
        "Không thể hủy đơn hàng khi đang được giao hoặc đã giao thành công",
      );
    }

    // Rule: Hoàn lại số lượng sản phẩm vào kho
    if (order.order_status !== "cancelled") {
      const orderItems = await db.order_products.findAll({
        where: { order_id: orderId },
        transaction,
      });
      for (let item of orderItems) {
        await db.products.increment("quantity", {
          by: item.quantity,
          where: { id: item.product_id },
          transaction,
        });
      }
    }

    await order.update(
      { order_status: "cancelled", admin_note: "Khách hàng tự hủy đơn" },
      { transaction },
    );
    await transaction.commit();
    return { EC: 0, EM: "Hủy đơn hàng thành công", DT: "" };
  } catch (error) {
    await transaction.rollback();
    return { EC: -1, EM: error.message || "Lỗi hệ thống", DT: "" };
  }
};
