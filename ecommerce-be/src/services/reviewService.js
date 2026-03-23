import db from "../models/index.js";
import { Op } from "sequelize";

// Bộ lọc từ ngữ thô tục đơn giản (Có thể bổ sung thêm)
const BAD_WORDS = ["xấu", "tệ", "lừa đảo", "chửi", "ngu", "dm", "vcl"];

const containsBadWords = (text) => {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  return BAD_WORDS.some((word) => lowerText.includes(word));
};

export const createReviewService = async (userId, data) => {
  // Khởi tạo Transaction
  const transaction = await db.sequelize.transaction();

  try {
    const { order_id, product_id, rating, content, images } = data;

    // 1. Kiểm tra đầu vào cơ bản
    if (!order_id || !product_id || !rating) {
      throw new Error("Thiếu thông tin bắt buộc (Mã đơn, Mã sản phẩm, Số sao)");
    }
    if (rating < 1 || rating > 5) {
      throw new Error("Số sao đánh giá không hợp lệ (Phải từ 1-5)");
    }
    if (containsBadWords(content)) {
      throw new Error("Nội dung đánh giá chứa từ ngữ không phù hợp chuẩn mực.");
    }

    // 2. Validate Đơn hàng: Có tồn tại, thuộc về User này và đã giao thành công chưa?
    const order = await db.orders.findOne({
      where: { id: order_id, user_id: userId },
      transaction,
    });

    if (!order) {
      throw new Error(
        "Đơn hàng không tồn tại hoặc bạn không có quyền truy cập",
      );
    }
    if (order.order_status !== "delivered") {
      throw new Error(
        "Chỉ được đánh giá sản phẩm khi đơn hàng đã được giao thành công",
      );
    }

    // 3. Validate Sản phẩm: Sản phẩm này có nằm trong đơn hàng đó không?
    const orderProduct = await db.order_products.findOne({
      where: { order_id, product_id },
      transaction,
    });

    if (!orderProduct) {
      throw new Error("Sản phẩm này không nằm trong đơn hàng của bạn");
    }

    // 4. Validate Spam: 1 Sản phẩm trong 1 Đơn hàng chỉ được đánh giá 1 lần
    const existingReview = await db.reviews.findOne({
      where: { order_id, product_id, user_id: userId },
      transaction,
    });

    if (existingReview) {
      throw new Error("Bạn đã đánh giá sản phẩm này rồi");
    }

    // 5. Thêm Review mới
    const newReview = await db.reviews.create(
      {
        user_id: userId,
        product_id,
        order_id,
        rating,
        content,
        images: images || null, // Lưu mảng URL ảnh dạng JSON
      },
      { transaction },
    );

    // 6. Cập nhật Điểm trung bình vào bảng Products (Tối ưu hiệu năng)
    // Thay vì đếm và tính tổng lại từ đầu, ta chỉ cần cộng dồn số sao và số lượt đánh giá
    await db.products.increment(
      {
        total_stars: rating,
        review_count: 1,
      },
      { where: { id: product_id }, transaction },
    );

    // 7. Commit nếu tất cả thành công
    await transaction.commit();
    return { EC: 0, EM: "Cảm ơn bạn đã đánh giá sản phẩm!", DT: newReview };
  } catch (error) {
    await transaction.rollback();
    console.error(">>> createReviewService Error:", error);
    return { EC: -1, EM: error.message || "Lỗi hệ thống khi đánh giá", DT: "" };
  }
};

export const getReviewsByProductService = async (productId, queryParams) => {
  try {
    const { page = 1, limit = 5, star, hasImage } = queryParams;
    let offset = (page - 1) * limit;

    // Khởi tạo điều kiện tìm kiếm mặc định
    let whereCondition = { product_id: productId };

    // 1. Filter: Lọc theo số sao cụ thể (VD: 5 sao)
    if (star) {
      whereCondition.rating = star;
    }

    // 2. Filter: Lọc các đánh giá có đính kèm hình ảnh
    if (hasImage === "true") {
      whereCondition.images = { [Op.not]: null };
    }

    // Lấy danh sách Đánh giá kèm Tên User (Không lấy password hay email để bảo mật)
    const { count, rows } = await db.reviews.findAndCountAll({
      where: whereCondition,
      offset: +offset,
      limit: +limit,
      order: [["created_at", "DESC"]], // Đánh giá mới nhất hiện lên đầu
      include: [
        { model: db.users, as: "user", attributes: ["id", "user_name"] },
      ],
    });

    // Tính tổng sao và tổng lượt đánh giá trực tiếp từ bảng reviews
    // Cách này sẽ đảm bảo độ chính xác 100% kể cả với dữ liệu được crawl từ trước
    const totalReviewCount = await db.reviews.count({
      where: { product_id: productId },
    });
    const totalStars = await db.reviews.sum("rating", {
      where: { product_id: productId },
    });

    let averageStar = 0;
    if (totalReviewCount > 0) {
      averageStar = (totalStars / totalReviewCount).toFixed(1);
    }

    return {
      EC: 0,
      EM: "Lấy danh sách đánh giá thành công",
      DT: {
        totalRows: count,
        totalPages: Math.ceil(count / limit),
        averageStar: Number(averageStar),
        totalReviewCount: totalReviewCount,
        reviews: rows,
      },
    };
  } catch (error) {
    console.error(">>> getReviewsByProductService Error:", error);
    return { EC: -1, EM: "Lỗi hệ thống khi tải đánh giá", DT: "" };
  }
};

// ==========================================
// ADMIN: QUẢN LÝ ĐÁNH GIÁ
// ==========================================

export const getAllReviewsAdminService = async (queryParams) => {
  try {
    const { page = 1, limit = 10, star, hasReply } = queryParams;
    let offset = (page - 1) * limit;

    let whereCondition = {};
    if (star) whereCondition.rating = star;

    // Lọc theo trạng thái đã trả lời hay chưa
    if (hasReply === "true") whereCondition.reply = { [Op.not]: null };
    if (hasReply === "false") whereCondition.reply = null;

    const { count, rows } = await db.reviews.findAndCountAll({
      where: whereCondition,
      offset: +offset,
      limit: +limit,
      order: [["created_at", "DESC"]],
      include: [
        {
          model: db.users,
          as: "user",
          attributes: ["id", "user_name", "email"],
        },
        {
          model: db.products,
          as: "product",
          attributes: ["id", "name", "slug"],
        }, // Lấy thêm tên sản phẩm
      ],
    });

    return {
      EC: 0,
      EM: "Lấy danh sách đánh giá thành công",
      DT: {
        totalRows: count,
        totalPages: Math.ceil(count / limit),
        reviews: rows,
      },
    };
  } catch (error) {
    console.error(">>> getAllReviewsAdminService Error:", error);
    return { EC: -1, EM: "Lỗi hệ thống", DT: "" };
  }
};

export const replyReviewService = async (reviewId, replyContent) => {
  try {
    const review = await db.reviews.findOne({ where: { id: reviewId } });
    if (!review) return { EC: 1, EM: "Đánh giá không tồn tại", DT: "" };

    await review.update({ reply: replyContent });
    return { EC: 0, EM: "Phản hồi đánh giá thành công", DT: review };
  } catch (error) {
    return { EC: -1, EM: "Lỗi hệ thống", DT: "" };
  }
};
