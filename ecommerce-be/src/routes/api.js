import express from "express";
import { checkUserJWT, checkAdminRole } from "../middlewares/JWTAction.js";

// Đảm bảo tên hàm ở đây khớp chính xác với 'export const ...' ở Controller
import {
  readProducts, // Thay cho getProductsWithFilter và getProductByID vì dùng chung logic ID
  createProduct,
  deleteProductbyID,
  updateProductbyID,
  getSaleList, // Tên hàm xử lý logic top-sale ở Controller
  getSalingList,
  readProductsForAdmin, // Tên hàm xử lý logic top-selling ở Controller
  getProductDetail, // Thêm mới: Lấy chi tiết sản phẩm theo ID
} from "../controllers/productController.js";

import { getAllBrands } from "../controllers/brandController.js";
import { getAllCategories } from "../controllers/categoriesController.js";
import {
  registerNewUser,
  handleLogin,
  getUserAccount,
  handleLogout,
  readUsersAdmin,
  readUserDetail,
  changePassword, // Thêm controller xử lý đổi mật khẩu
} from "../controllers/userController.js";

import { readAllRoles, updateRole } from "../controllers/roleController.js";

import { addToCart, getCart } from "../controllers/cartController.js";
import {
  getUserAddresses,
  addUserAddress,
  updateUserAddress,
  deleteUserAddress,
} from "../controllers/addressController.js";
import {
  createOrder,
  readAllOrders,
  readOrderDetail,
  changeOrderStatus,
  readOrdersByUser,
  cancelOrderByUser,
} from "../controllers/orderController.js";
import {
  createPaymentLink,
  handlePayosWebhook,
  retryPaymentLink,
} from "../controllers/paymentController.js";

import {
  createReview,
  getReviews,
  getAllReviewsAdmin,
  replyReview,
} from "../controllers/reviewController.js";

import {
  getUnreadCount,
  getConversations,
  getMessages,
  getUserMessages,
} from "../controllers/chatController.js";

const initApiRoutes = (app) => {
  const router = express.Router(); // --- Routes cho sản phẩm --- // Hàm readProducts xử lý cả lấy list (có filter) và lấy 1 sản phẩm theo ID

  router.get(
    "/admin/products",
    checkUserJWT,
    checkAdminRole,
    readProductsForAdmin,
  );
  router.post("/create-product", checkUserJWT, checkAdminRole, createProduct);
  router.delete(
    "/delete-product/:id",
    checkUserJWT,
    checkAdminRole,
    deleteProductbyID,
  );
  router.put(
    "/update-product/:id",
    checkUserJWT,
    checkAdminRole,
    updateProductbyID,
  ); // --- Routes cho trang chủ (Điện Máy Xanh style) ---

  router.get("/admin/users", checkUserJWT, checkAdminRole, readUsersAdmin);
  router.get("/admin/users/:id", checkUserJWT, checkAdminRole, readUserDetail);

  // --- Routes Quản lý đơn hàng (Admin) ---
  router.get("/admin/orders", checkUserJWT, checkAdminRole, readAllOrders);
  router.get(
    "/admin/orders/:id",
    checkUserJWT,
    checkAdminRole,
    readOrderDetail,
  );
  router.put(
    "/admin/orders/:id/status",
    checkUserJWT,
    checkAdminRole,
    changeOrderStatus,
  );

  // --- Routes Quản lý Đánh giá (Admin) ---
  router.get(
    "/admin/reviews",
    checkUserJWT,
    checkAdminRole,
    getAllReviewsAdmin,
  );
  router.put(
    "/admin/reviews/:id/reply",
    checkUserJWT,
    checkAdminRole,
    replyReview,
  );

  router.get("/products", readProducts);
  router.get("/products/:id", getProductDetail);

  router.get("/role/read", checkUserJWT, checkAdminRole, readAllRoles);
  router.put("/user/update-role", checkUserJWT, checkAdminRole, updateRole);

  router.get("/top-sale", getSaleList);
  router.get("/top-selling", getSalingList); // --- Các routes khác ---

  router.get("/brands", getAllBrands);
  router.get("/categories", getAllCategories);

  // Route này yêu cầu phải có Cookie hợp lệ mới vào được
  // --- Routes Giỏ hàng ---
  router.post("/cart/add", checkUserJWT, addToCart);
  router.get("/cart", checkUserJWT, getCart);

  // --- Routes Sổ địa chỉ ---
  router.get("/user/addresses", checkUserJWT, getUserAddresses);
  router.post("/user/addresses", checkUserJWT, addUserAddress);
  router.put("/user/addresses/:id", checkUserJWT, updateUserAddress);
  router.delete("/user/addresses/:id", checkUserJWT, deleteUserAddress);

  // --- Routes Đặt hàng ---
  router.post("/order/create", checkUserJWT, createOrder);
  router.get("/user/orders", checkUserJWT, readOrdersByUser);
  router.put("/user/orders/:id/cancel", checkUserJWT, cancelOrderByUser);

  // --- Routes Thanh toán PayOS ---
  router.post("/payment/webhook", handlePayosWebhook);
  router.post("/payment/create-link", checkUserJWT, createPaymentLink);
  router.post("/payment/retry", checkUserJWT, retryPaymentLink);

  // route review
  router.post("/review/create", checkUserJWT, createReview);
  router.get("/review/list/:productId", getReviews); // API Public cho phép đọc đánh giá

  // --- Routes Chat ---
  router.get("/chat/unread-count", checkUserJWT, getUnreadCount);
  router.get("/chat/user-messages", checkUserJWT, getUserMessages);
  router.get(
    "/chat/conversations",
    checkUserJWT,
    checkAdminRole,
    getConversations,
  );
  router.get(
    "/chat/conversations/:id/messages",
    checkUserJWT,
    checkAdminRole,
    getMessages,
  );

  router.get("/account", checkUserJWT, getUserAccount);
  router.post("/login", handleLogin);
  router.post("/register-user", registerNewUser); // Route kiểm tra JWT
  router.post("/logout", checkUserJWT, handleLogout);
  router.put("/user/change-password", checkUserJWT, changePassword); // Endpoint đổi pass

  router.get("/user/profile", checkUserJWT, (req, res) => {
    return res.status(200).json({
      EC: 0,
      EM: "Lấy thông tin người dùng thành công!",
      DT: req.user,
    });
  });

  return app.use("/api/v1", router);
};

export default initApiRoutes;
