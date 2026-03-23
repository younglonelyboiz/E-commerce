import {
  createReviewService,
  getReviewsByProductService,
  getAllReviewsAdminService,
  replyReviewService,
} from "../services/reviewService.js";

export const createReview = async (req, res) => {
  try {
    // Lấy userId từ Middleware checkUserJWT
    const userId = req.user.id;

    const result = await createReviewService(userId, req.body);

    return res.status(200).json(result);
  } catch (error) {
    console.error(">>> createReview Controller Error:", error);
    return res.status(500).json({ EC: -1, EM: "Lỗi server", DT: "" });
  }
};

export const getAllReviewsAdmin = async (req, res) => {
  try {
    const result = await getAllReviewsAdminService(req.query);
    return res.status(200).json(result);
  } catch (error) {
    console.error(">>> getAllReviewsAdmin Controller Error:", error);
    return res.status(500).json({ EC: -1, EM: "Lỗi server", DT: "" });
  }
};

export const replyReview = async (req, res) => {
  try {
    const reviewId = req.params.id;
    const { reply } = req.body;
    const result = await replyReviewService(reviewId, reply);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ EC: -1, EM: "Lỗi server", DT: "" });
  }
};

export const getReviews = async (req, res) => {
  try {
    const productId = req.params.productId;
    const result = await getReviewsByProductService(productId, req.query);
    return res.status(200).json(result);
  } catch (error) {
    console.error(">>> getReviews Controller Error:", error);
    return res.status(500).json({ EC: -1, EM: "Lỗi server", DT: "" });
  }
};
