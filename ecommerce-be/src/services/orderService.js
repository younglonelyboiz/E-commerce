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
        code: `ORD${Date.now()}`,
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
  paymentStatus = null,
) => {
  try {
    let offset = (page - 1) * limit;
    let whereCondition = {};

    if (status) {
      whereCondition.order_status = status;
    }
    if (paymentStatus) {
      whereCondition.payment_status = paymentStatus;
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
        {
          model: db.order_products,
          as: "order_products",
          // JOIN sang bảng products để lấy thông tin ảnh và slug
          include: [
            {
              model: db.products,
              as: "product",
              attributes: ["id", "slug"],
              include: [
                {
                  model: db.product_images,
                  as: "product_images",
                  where: { is_thumbnail: 1 },
                  required: false,
                  attributes: ["url"],
                },
              ],
            },
          ],
        },
      ],
    });
    if (!order) return { EC: 1, EM: "Không tìm thấy đơn hàng", DT: "" };

    // Làm phẳng dữ liệu cho order_products dễ dùng ở Frontend
    const o = order.get({ plain: true });
    o.order_products = o.order_products.map((op) => ({
      ...op,
      image: op.product?.product_images?.[0]?.url || null,
      slug: op.product?.slug || null,
    }));

    return { EC: 0, EM: "Lấy chi tiết đơn hàng thành công", DT: o };
  } catch (error) {
    return { EC: -1, EM: "Lỗi hệ thống", DT: "" };
  }
};

export const updateOrderStatusService = async (
  orderId,
  newStatus,
  adminNote,
  newPaymentStatus,
) => {
  const transaction = await db.sequelize.transaction();
  try {
    const order = await db.orders.findOne({
      where: { id: orderId },
      transaction,
    });
    if (!order) throw new Error("Đơn hàng không tồn tại");

    // LOGIC HOÀN KHO: Nếu đơn bị hủy và trạng thái cũ chưa phải là Hủy
    if (
      newStatus &&
      newStatus === "cancelled" &&
      order.order_status !== "cancelled"
    ) {
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

    const updateData = {
      order_status: newStatus || order.order_status,
      admin_note: adminNote !== undefined ? adminNote : order.admin_note,
    };
    if (newPaymentStatus) updateData.payment_status = newPaymentStatus;

    await order.update(updateData, { transaction });
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
      include: [
        {
          model: db.order_products,
          as: "order_products",
          // JOIN sang bảng products để lấy thông tin ảnh
          include: [
            {
              model: db.products,
              as: "product", // Lưu ý: Nếu báo lỗi, bạn kiểm tra lại alias trong initModels.js nhé
              attributes: ["id", "slug"],
              include: [
                {
                  model: db.product_images,
                  as: "product_images",
                  where: { is_thumbnail: 1 },
                  required: false,
                  attributes: ["url"],
                },
              ],
            },
          ],
        },
        { model: db.reviews, as: "reviews" },
      ],
      order: [["order_date", "DESC"]], // Đơn mới nhất lên đầu
    });

    // Làm phẳng (Format) dữ liệu trả về để gán trực tiếp thuộc tính "image" cho FE dễ dùng
    const formattedOrders = orders.map((order) => {
      const o = order.get({ plain: true });
      o.order_products = o.order_products.map((op) => ({
        ...op,
        image: op.product?.product_images?.[0]?.url || null, // Lấy url ảnh nếu có
        slug: op.product?.slug || null,
      }));
      return o;
    });

    return {
      EC: 0,
      EM: "Lấy lịch sử đơn hàng thành công",
      DT: formattedOrders,
    };
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
